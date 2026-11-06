import io
import json
import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
import pandas as pd
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user_payload, require_role
from app.models.company import Company
from app.models.question import Question, QuestionDifficulty, ModerationStatus
from app.models.user import UserRole
from app.schemas.question_schema import (
    CompanyCreate,
    CompanyResponse,
    QuestionBulkUploadResponse,
    QuestionCreate,
    QuestionModerationUpdate,
    QuestionResponse,
)
from app.services.dedup_service import deduplicate_question_batch
from app.services.embedding_service import generate_embedding
from app.services.qdrant_service import index_question_vector

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/tnp", tags=["T&P Admin & Placement Management"])


# ==============================================================================
# COMPANIES MANAGEMENT
# ==============================================================================

@router.get("/companies", response_model=List[CompanyResponse])
def get_companies(db: Session = Depends(get_db)):
    """Lists all registered hiring companies along with active question counts."""
    companies = db.query(Company).order_by(Company.name.asc()).all()
    results = []
    for c in companies:
        q_count = db.query(Question).filter(
            Question.company_id == c.id,
            Question.moderation_status == ModerationStatus.APPROVED
        ).count()
        resp = CompanyResponse.model_validate(c)
        resp.question_count = q_count
        results.append(resp)
    return results


@router.post("/companies", response_model=CompanyResponse, status_code=status.HTTP_201_CREATED)
def create_company(
    comp_in: CompanyCreate,
    db: Session = Depends(get_db),
    user_payload: dict = Depends(require_role([UserRole.TNP_ADMIN.value])),
):
    """Creates a new target company with Job Description criteria and cutoffs."""
    existing = db.query(Company).filter(Company.name.ilike(comp_in.name.strip())).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Company '{comp_in.name}' already exists in directory."
        )

    company = Company(
        name=comp_in.name.strip(),
        industry=comp_in.industry,
        description=comp_in.description,
        website=comp_in.website,
        min_cgpa=comp_in.min_cgpa,
        eligible_branches=comp_in.eligible_branches,
        required_skills=comp_in.required_skills,
        hiring_workflow=comp_in.hiring_workflow,
    )
    db.add(company)
    db.commit()
    db.refresh(company)

    resp = CompanyResponse.model_validate(company)
    resp.question_count = 0
    return resp


@router.delete("/companies/{company_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_company(
    company_id: int,
    db: Session = Depends(get_db),
    user_payload: dict = Depends(require_role([UserRole.TNP_ADMIN.value])),
):
    """Deletes target company and associated relations."""
    comp = db.query(Company).filter(Company.id == company_id).first()
    if not comp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Company not found")
    db.delete(comp)
    db.commit()
    return None


# ==============================================================================
# QUESTION MANAGEMENT & MODERATION
# ==============================================================================

@router.get("/questions", response_model=List[QuestionResponse])
def list_questions(
    company_id: Optional[int] = None,
    topic: Optional[str] = None,
    difficulty: Optional[str] = None,
    status_filter: Optional[str] = Query("approved", alias="status"),
    db: Session = Depends(get_db),
):
    """Lists questions with optional company, topic, difficulty, and moderation filtering."""
    query = db.query(Question)

    if status_filter:
        query = query.filter(Question.moderation_status == status_filter)
    if company_id:
        query = query.filter(Question.company_id == company_id)
    if topic:
        query = query.filter(Question.topic.ilike(f"%{topic}%"))
    if difficulty:
        query = query.filter(Question.difficulty == difficulty)

    questions = query.order_by(Question.created_at.desc()).limit(100).all()
    results = []
    for q in questions:
        comp_name = q.company.name if q.company else None
        q_resp = QuestionResponse.model_validate(q)
        q_resp.company_name = comp_name
        results.append(q_resp)
    return results


@router.post("/questions", response_model=QuestionResponse, status_code=status.HTTP_201_CREATED)
async def create_single_question(
    q_in: QuestionCreate,
    db: Session = Depends(get_db),
    user_payload: dict = Depends(get_current_user_payload),
):
    """
    Submits a placement interview question.
    If submitted by T&P admin, automatically approved and indexed into Qdrant.
    If submitted by alumni or student, placed into moderation queue.
    """
    user_role = user_payload.get("role")
    user_id = user_payload.get("id")

    auto_approve = user_role == UserRole.TNP_ADMIN.value
    mod_status = ModerationStatus.APPROVED if auto_approve else ModerationStatus.PENDING

    new_q = Question(
        company_id=q_in.company_id,
        role_title=q_in.role_title,
        round_type=q_in.round_type,
        difficulty=q_in.difficulty,
        topic=q_in.topic,
        question_text=q_in.question_text.strip(),
        answer_guidelines=q_in.answer_guidelines,
        submitted_by=user_id,
        moderation_status=mod_status,
    )
    db.add(new_q)
    db.commit()
    db.refresh(new_q)

    # Index into Qdrant immediately if approved
    if auto_approve:
        try:
            emb = await generate_embedding(new_q.question_text)
            point_id = index_question_vector(
                question_id=new_q.id,
                vector=emb,
                payload={
                    "company_id": new_q.company_id,
                    "topic": new_q.topic,
                    "difficulty": new_q.difficulty.value,
                    "question_text": new_q.question_text,
                },
            )
            if point_id:
                new_q.qdrant_point_id = point_id
                db.commit()
                db.refresh(new_q)
        except Exception as q_err:
            logger.warning("Vector indexing skipped during question creation: %s", q_err)

    comp_name = new_q.company.name if new_q.company else None
    resp = QuestionResponse.model_validate(new_q)
    resp.company_name = comp_name
    return resp


@router.post("/questions/bulk-upload", response_model=QuestionBulkUploadResponse)
async def bulk_upload_questions(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user_payload: dict = Depends(require_role([UserRole.TNP_ADMIN.value, UserRole.ALUMNI.value])),
):
    """
    Bulk uploads questions via CSV or JSON file.
    Applies Pandas text normalization and cosine deduplication against existing questions.
    Auto-indexes approved questions into Qdrant vector database.
    """
    contents = await file.read()
    filename = file.filename or "upload.csv"
    ext = filename.split(".")[-1].lower()

    parsed_rows: List[dict] = []
    errors: List[str] = []

    try:
        if ext == "csv":
            df = pd.read_csv(io.BytesIO(contents))
            # Standardize column headers
            df.columns = [col.strip().lower().replace(" ", "_") for col in df.columns]
            for _, row in df.iterrows():
                q_text = str(row.get("question_text", row.get("question", ""))).strip()
                if q_text and q_text.lower() != "nan":
                    parsed_rows.append({
                        "company_name": str(row.get("company_name", row.get("company", ""))).strip() or None,
                        "role_title": str(row.get("role_title", row.get("role", "Software Engineer"))).strip(),
                        "round_type": str(row.get("round_type", row.get("round", "Technical Interview"))).strip(),
                        "difficulty": str(row.get("difficulty", "Medium")).capitalize(),
                        "topic": str(row.get("topic", "Data Structures")).strip(),
                        "question_text": q_text,
                        "answer_guidelines": str(row.get("answer_guidelines", row.get("guidelines", ""))).strip() or None,
                    })
        elif ext == "json":
            json_data = json.loads(contents.decode("utf-8"))
            items = json_data if isinstance(json_data, list) else json_data.get("questions", [])
            for item in items:
                q_text = str(item.get("question_text", item.get("question", ""))).strip()
                if q_text:
                    parsed_rows.append({
                        "company_name": item.get("company_name") or item.get("company"),
                        "role_title": item.get("role_title", "Software Engineer"),
                        "round_type": item.get("round_type", "Technical Interview"),
                        "difficulty": str(item.get("difficulty", "Medium")).capitalize(),
                        "topic": item.get("topic", "General"),
                        "question_text": q_text,
                        "answer_guidelines": item.get("answer_guidelines"),
                    })
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Supported bulk upload formats are CSV and JSON."
            )
    except Exception as parse_err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to parse upload file: {str(parse_err)}"
        )

    if not parsed_rows:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No valid questions found in uploaded file."
        )

    # Fetch existing questions from database for deduplication
    existing_records = db.query(Question.question_text).all()
    existing_pool = [{"question_text": r[0]} for r in existing_records]

    # Run pandas/numpy cosine deduplication
    unique_items, dup_count, dup_details = deduplicate_question_batch(
        incoming_questions=parsed_rows,
        existing_questions=existing_pool,
        similarity_threshold=0.82
    )

    # Map companies for quick ID lookup
    all_companies = {c.name.lower(): c.id for c in db.query(Company).all()}
    user_id = user_payload.get("id")
    is_admin = user_payload.get("role") == UserRole.TNP_ADMIN.value
    mod_status = ModerationStatus.APPROVED if is_admin else ModerationStatus.PENDING

    added_count = 0
    for item in unique_items:
        comp_id = None
        if item.get("company_name"):
            comp_id = all_companies.get(item["company_name"].lower())

        diff_val = QuestionDifficulty.MEDIUM
        if item.get("difficulty") == "Easy":
            diff_val = QuestionDifficulty.EASY
        elif item.get("difficulty") == "Hard":
            diff_val = QuestionDifficulty.HARD

        q = Question(
            company_id=comp_id,
            role_title=item.get("role_title", "Software Engineer"),
            round_type=item.get("round_type", "Technical Interview"),
            difficulty=diff_val,
            topic=item.get("topic", "General"),
            question_text=item["question_text"],
            answer_guidelines=item.get("answer_guidelines"),
            submitted_by=user_id,
            moderation_status=mod_status,
        )
        db.add(q)
        db.flush()  # assign ID

        # Index approved questions in Qdrant
        if mod_status == ModerationStatus.APPROVED:
            try:
                emb = await generate_embedding(q.question_text)
                pt_id = index_question_vector(
                    question_id=q.id,
                    vector=emb,
                    payload={
                        "company_id": q.company_id,
                        "topic": q.topic,
                        "difficulty": q.difficulty.value,
                        "question_text": q.question_text,
                    },
                )
                q.qdrant_point_id = pt_id
            except Exception as e:
                logger.warning("Vector indexing failed during bulk row: %s", e)

        added_count += 1

    db.commit()

    return QuestionBulkUploadResponse(
        total_processed=len(parsed_rows),
        added_questions=added_count,
        duplicates_skipped=dup_count,
        duplicate_details=dup_details[:20],  # Return first 20 duplicate descriptions
        errors=errors,
    )


@router.get("/questions/pending", response_model=List[QuestionResponse])
def get_pending_moderation_queue(
    db: Session = Depends(get_db),
    user_payload: dict = Depends(require_role([UserRole.TNP_ADMIN.value])),
):
    """Fetches questions submitted by students or alumni awaiting moderation."""
    pending = (
        db.query(Question)
        .filter(Question.moderation_status == ModerationStatus.PENDING)
        .order_by(Question.created_at.asc())
        .all()
    )
    results = []
    for q in pending:
        resp = QuestionResponse.model_validate(q)
        resp.company_name = q.company.name if q.company else None
        results.append(resp)
    return results


@router.patch("/questions/{question_id}/approve", response_model=QuestionResponse)
async def approve_question(
    question_id: int,
    db: Session = Depends(get_db),
    user_payload: dict = Depends(require_role([UserRole.TNP_ADMIN.value])),
):
    """
    Approves a pending question, generates 768-d Ollama embedding,
    and indexes vector into Qdrant company_questions collection.
    """
    q = db.query(Question).filter(Question.id == question_id).first()
    if not q:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found")

    q.moderation_status = ModerationStatus.APPROVED

    # Index into Qdrant
    try:
        emb = await generate_embedding(q.question_text)
        point_id = index_question_vector(
            question_id=q.id,
            vector=emb,
            payload={
                "company_id": q.company_id,
                "topic": q.topic,
                "difficulty": q.difficulty.value,
                "question_text": q.question_text,
            },
        )
        if point_id:
            q.qdrant_point_id = point_id
    except Exception as exc:
        logger.warning("Qdrant indexing failed on approval: %s", exc)

    db.commit()
    db.refresh(q)

    resp = QuestionResponse.model_validate(q)
    resp.company_name = q.company.name if q.company else None
    return resp


@router.patch("/questions/{question_id}/reject", response_model=QuestionResponse)
def reject_question(
    question_id: int,
    db: Session = Depends(get_db),
    user_payload: dict = Depends(require_role([UserRole.TNP_ADMIN.value])),
):
    """Rejects a pending question."""
    q = db.query(Question).filter(Question.id == question_id).first()
    if not q:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found")

    q.moderation_status = ModerationStatus.REJECTED
    db.commit()
    db.refresh(q)

    resp = QuestionResponse.model_validate(q)
    resp.company_name = q.company.name if q.company else None
    return resp
