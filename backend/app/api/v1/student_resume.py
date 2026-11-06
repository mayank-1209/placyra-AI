import logging
from typing import Optional
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user_payload
from app.models.company import Company
from app.models.resume import Resume
from app.models.user import User
from app.schemas.resume_schema import (
    ResumeParsedData,
    ResumeUploadResponse,
    SkillGapResponse,
)
from app.services.embedding_service import generate_embedding
from app.services.gap_analysis_service import perform_skill_gap_analysis
from app.services.ocr_service import extract_text_from_document
from app.services.parser_service import parse_resume_content
from app.services.qdrant_service import index_resume_vector
from app.utils.file_handler import (
    ALLOWED_RESUME_EXTENSIONS,
    save_uploaded_file,
    validate_file_extension,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/resume", tags=["Student Resume & OCR Pipeline"])


@router.post("/upload", response_model=ResumeUploadResponse)
async def upload_resume(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user_payload: dict = Depends(get_current_user_payload),
):
    """
    Uploads student resume in PDF or Image (PNG/JPG) format.
    Executes PyMuPDF OCR extraction, parses structured skills/projects/CGPA,
    indexes vector into Qdrant 'student_resumes', and computes placement readiness.
    """
    user_id = user_payload.get("id")
    validate_file_extension(file.filename or "", ALLOWED_RESUME_EXTENSIONS)

    # Save file asynchronously
    saved_path, unique_name = await save_uploaded_file(file, subfolder="resumes")

    # Extract OCR text
    try:
        raw_text = extract_text_from_document(saved_path)
    except Exception as ocr_err:
        logger.error("OCR extraction failed for %s: %s", saved_path, ocr_err)
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Unable to extract text from document: {str(ocr_err)}"
        )

    if not raw_text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded resume contained no readable text. Ensure the file is not corrupted."
        )

    # Structured Parser (Regex + Ollama LLM)
    parsed_dict = await parse_resume_content(raw_text)

    # If student's user record lacks CGPA or branch, sync if extracted
    user = db.query(User).filter(User.id == user_id).first()
    if user and parsed_dict.get("cgpa") and not user.cgpa:
        user.cgpa = parsed_dict["cgpa"]
        db.commit()

    # Index in Qdrant
    qdrant_pt_id = None
    try:
        skills_summary = " ".join(parsed_dict.get("skills", []))
        resume_emb = await generate_embedding(f"Resume profile: {skills_summary} {raw_text[:500]}")
        qdrant_pt_id = index_resume_vector(
            resume_id=user_id,
            vector=resume_emb,
            payload={
                "user_id": user_id,
                "skills": parsed_dict.get("skills", []),
                "readiness_score": parsed_dict.get("readiness_score", 0.0),
            },
        )
    except Exception as q_err:
        logger.warning("Resume vector indexing skipped: %s", q_err)

    # Persist Resume in MySQL
    resume = (
        db.query(Resume)
        .filter(Resume.user_id == user_id)
        .order_by(Resume.created_at.desc())
        .first()
    )

    readiness = parsed_dict.get("readiness_score", 45.0)

    if resume:
        resume.file_name = file.filename or unique_name
        resume.file_path = saved_path
        resume.raw_ocr_text = raw_text
        resume.parsed_data = parsed_dict
        resume.readiness_score = readiness
        resume.qdrant_point_id = qdrant_pt_id
    else:
        resume = Resume(
            user_id=user_id,
            file_name=file.filename or unique_name,
            file_path=saved_path,
            raw_ocr_text=raw_text,
            parsed_data=parsed_dict,
            readiness_score=readiness,
            qdrant_point_id=qdrant_pt_id,
        )
        db.add(resume)

    db.commit()
    db.refresh(resume)

    return ResumeUploadResponse(
        id=resume.id,
        user_id=resume.user_id,
        file_name=resume.file_name,
        readiness_score=resume.readiness_score,
        parsed_data=ResumeParsedData(**parsed_dict),
        raw_ocr_preview=raw_text[:500] + ("..." if len(raw_text) > 500 else ""),
        created_at=resume.created_at,
    )


@router.get("/my-resume", response_model=Optional[ResumeUploadResponse])
def get_my_resume(
    db: Session = Depends(get_db),
    user_payload: dict = Depends(get_current_user_payload),
):
    """Retrieves current student's latest uploaded resume and parsed skill breakdown."""
    user_id = user_payload.get("id")
    resume = (
        db.query(Resume)
        .filter(Resume.user_id == user_id)
        .order_by(Resume.created_at.desc())
        .first()
    )
    if not resume:
        return None

    parsed_data = resume.parsed_data or {}
    return ResumeUploadResponse(
        id=resume.id,
        user_id=resume.user_id,
        file_name=resume.file_name,
        readiness_score=resume.readiness_score,
        parsed_data=ResumeParsedData(**parsed_data),
        raw_ocr_preview=(resume.raw_ocr_text[:500] + "...") if resume.raw_ocr_text else "",
        created_at=resume.created_at,
    )


@router.post("/analyze-gap/{company_id}", response_model=SkillGapResponse)
async def analyze_skill_gap(
    company_id: int,
    db: Session = Depends(get_db),
    user_payload: dict = Depends(get_current_user_payload),
):
    """
    Performs deep skill-gap analysis comparing student resume against target company JD.
    Returns matched skills, missing skills, radar data, and step-by-step action plan.
    """
    user_id = user_payload.get("id")
    try:
        report_data = await perform_skill_gap_analysis(
            db=db,
            user_id=user_id,
            company_id=company_id
        )
        return SkillGapResponse(**report_data)
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(ve))
    except Exception as exc:
        logger.error("Skill gap analysis failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Gap analysis calculation failed: {str(exc)}"
        )
