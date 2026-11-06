import logging
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user_payload
from app.models.company import Company
from app.models.interview import (
    InterviewMessage,
    InterviewStatus,
    MessageRole,
    MockInterviewSession,
)
from app.schemas.interview_schema import (
    EndInterviewResponse,
    InterviewAnswerRequest,
    InterviewMessageResponse,
    InterviewSessionResponse,
    InterviewTurnResponse,
    StartInterviewRequest,
)
from app.services.rag_service import (
    evaluate_interview_answer,
    generate_adaptive_interview_question,
    generate_interview_final_report,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/mock-interview", tags=["AI Adaptive Mock Interview"])

MAX_SESSION_TURNS = 5


@router.post("/start", response_model=InterviewTurnResponse)
async def start_mock_interview(
    req: StartInterviewRequest,
    db: Session = Depends(get_db),
    user_payload: dict = Depends(get_current_user_payload),
):
    """
    Initializes a new AI Mock Interview session targeting a specific company and role.
    Generates the initial adaptive technical question using Hybrid RAG.
    """
    user_id = user_payload.get("id")

    session = MockInterviewSession(
        user_id=user_id,
        company_id=req.company_id,
        target_role=req.target_role,
        difficulty=req.difficulty,
        status=InterviewStatus.IN_PROGRESS,
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    # Generate initial question (Turn 1)
    q_data = await generate_adaptive_interview_question(
        db=db,
        session=session,
        turn_number=1,
    )

    assistant_msg = InterviewMessage(
        session_id=session.id,
        turn_number=1,
        role=MessageRole.ASSISTANT,
        message_text=q_data["question"],
        hints=q_data.get("hints"),
    )
    db.add(assistant_msg)
    db.commit()

    return InterviewTurnResponse(
        session_id=session.id,
        turn_number=1,
        question=q_data["question"],
        context_topic=q_data.get("context_topic", "Technical Assessment"),
        hints=q_data.get("hints"),
        is_concluded=False,
    )


@router.post("/{session_id}/answer", response_model=InterviewTurnResponse)
async def submit_interview_answer(
    session_id: int,
    req: InterviewAnswerRequest,
    db: Session = Depends(get_db),
    user_payload: dict = Depends(get_current_user_payload),
):
    """
    Submits student candidate's answer for the current question turn.
    Evaluates response technical accuracy via Ollama LLM, assigns score (0-10) and feedback,
    and dynamically produces the next adaptive follow-up question.
    """
    user_id = user_payload.get("id")
    session = (
        db.query(MockInterviewSession)
        .filter(MockInterviewSession.id == session_id, MockInterviewSession.user_id == user_id)
        .first()
    )
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Interview session not found")

    if session.status != InterviewStatus.IN_PROGRESS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This interview session is already completed or ended."
        )

    # Find the latest assistant question
    last_assistant_msg = (
        db.query(InterviewMessage)
        .filter(InterviewMessage.session_id == session.id, InterviewMessage.role == MessageRole.ASSISTANT)
        .order_by(InterviewMessage.turn_number.desc())
        .first()
    )
    current_turn = last_assistant_msg.turn_number if last_assistant_msg else 1

    # Evaluate Candidate Answer
    question_text = last_assistant_msg.message_text if last_assistant_msg else "General technical question"
    eval_result = await evaluate_interview_answer(
        question_text=question_text,
        candidate_answer=req.answer_text,
    )

    # Save User Turn Answer with Evaluation
    user_msg = InterviewMessage(
        session_id=session.id,
        turn_number=current_turn,
        role=MessageRole.USER,
        message_text=req.answer_text,
        score=eval_result.get("score", 7.0),
        feedback=eval_result.get("feedback"),
        hints=eval_result.get("hints"),
    )
    db.add(user_msg)
    db.commit()

    # Check if session reached conclusion limit
    if current_turn >= MAX_SESSION_TURNS:
        all_user_msgs = (
            db.query(InterviewMessage)
            .filter(InterviewMessage.session_id == session.id, InterviewMessage.role == MessageRole.USER)
            .all()
        )
        report = generate_interview_final_report(all_user_msgs)
        session.status = InterviewStatus.COMPLETED
        session.overall_score = report["overall_score"]
        session.feedback_summary = report["feedback_summary"]
        db.commit()

        return InterviewTurnResponse(
            session_id=session.id,
            turn_number=current_turn,
            question="Interview concluded. Fantastic effort! Review your complete score breakdown and feedback below.",
            context_topic="Interview Concluded",
            evaluation_score=eval_result.get("score"),
            evaluation_feedback=eval_result.get("feedback"),
            hints=None,
            is_concluded=True,
        )

    # Generate Next Question (Turn + 1)
    next_turn = current_turn + 1
    next_q_data = await generate_adaptive_interview_question(
        db=db,
        session=session,
        turn_number=next_turn,
    )

    next_assistant_msg = InterviewMessage(
        session_id=session.id,
        turn_number=next_turn,
        role=MessageRole.ASSISTANT,
        message_text=next_q_data["question"],
        hints=next_q_data.get("hints"),
    )
    db.add(next_assistant_msg)
    db.commit()

    return InterviewTurnResponse(
        session_id=session.id,
        turn_number=next_turn,
        question=next_q_data["question"],
        context_topic=next_q_data.get("context_topic"),
        evaluation_score=eval_result.get("score"),
        evaluation_feedback=eval_result.get("feedback"),
        hints=next_q_data.get("hints"),
        is_concluded=False,
    )


@router.post("/{session_id}/end", response_model=EndInterviewResponse)
def end_mock_interview(
    session_id: int,
    db: Session = Depends(get_db),
    user_payload: dict = Depends(get_current_user_payload),
):
    """Explicitly ends the interview session and produces final placement readiness report."""
    user_id = user_payload.get("id")
    session = (
        db.query(MockInterviewSession)
        .filter(MockInterviewSession.id == session_id, MockInterviewSession.user_id == user_id)
        .first()
    )
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Interview session not found")

    user_msgs = (
        db.query(InterviewMessage)
        .filter(InterviewMessage.session_id == session.id, InterviewMessage.role == MessageRole.USER)
        .all()
    )
    report = generate_interview_final_report(user_msgs)

    session.status = InterviewStatus.COMPLETED
    session.overall_score = report["overall_score"]
    session.feedback_summary = report["feedback_summary"]
    db.commit()

    return EndInterviewResponse(
        session_id=session.id,
        overall_score=report["overall_score"],
        total_turns=report["total_turns"],
        feedback_summary=report["feedback_summary"],
        strengths=report["strengths"],
        areas_to_improve=report["areas_to_improve"],
    )


@router.get("/history", response_model=List[InterviewSessionResponse])
def get_interview_history(
    db: Session = Depends(get_db),
    user_payload: dict = Depends(get_current_user_payload),
):
    """Lists past mock interview sessions for current student."""
    user_id = user_payload.get("id")
    sessions = (
        db.query(MockInterviewSession)
        .filter(MockInterviewSession.user_id == user_id)
        .order_by(MockInterviewSession.created_at.desc())
        .limit(20)
        .all()
    )

    results = []
    for s in sessions:
        comp_name = s.company.name if s.company else "General Placement"
        msgs = [InterviewMessageResponse.model_validate(m) for m in s.messages]
        item = InterviewSessionResponse(
            id=s.id,
            company_id=s.company_id,
            company_name=comp_name,
            target_role=s.target_role,
            difficulty=s.difficulty,
            status=s.status,
            overall_score=s.overall_score,
            feedback_summary=s.feedback_summary,
            created_at=s.created_at,
            messages=msgs,
        )
        results.append(item)
    return results


@router.get("/{session_id}", response_model=InterviewSessionResponse)
def get_interview_session(
    session_id: int,
    db: Session = Depends(get_db),
    user_payload: dict = Depends(get_current_user_payload),
):
    """Retrieves full transcript and evaluations for a specific interview session."""
    user_id = user_payload.get("id")
    session = (
        db.query(MockInterviewSession)
        .filter(MockInterviewSession.id == session_id, MockInterviewSession.user_id == user_id)
        .first()
    )
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Interview session not found")

    comp_name = session.company.name if session.company else "General Placement"
    msgs = [InterviewMessageResponse.model_validate(m) for m in session.messages]

    return InterviewSessionResponse(
        id=session.id,
        company_id=session.company_id,
        company_name=comp_name,
        target_role=session.target_role,
        difficulty=session.difficulty,
        status=session.status,
        overall_score=session.overall_score,
        feedback_summary=session.feedback_summary,
        created_at=session.created_at,
        messages=msgs,
    )
