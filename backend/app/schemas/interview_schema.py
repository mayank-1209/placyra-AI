from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field
from app.models.interview import InterviewStatus, MessageRole


class StartInterviewRequest(BaseModel):
    company_id: Optional[int] = None
    target_role: str = Field(default="Software Engineer", min_length=2)
    difficulty: str = Field(default="Medium")


class InterviewAnswerRequest(BaseModel):
    answer_text: str = Field(..., min_length=1)


class InterviewMessageResponse(BaseModel):
    id: Optional[int] = None
    turn_number: int
    role: MessageRole
    message_text: str
    score: Optional[float] = None
    feedback: Optional[str] = None
    hints: Optional[str] = None
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class InterviewTurnResponse(BaseModel):
    session_id: int
    turn_number: int
    question: str
    context_topic: Optional[str] = None
    evaluation_score: Optional[float] = None
    evaluation_feedback: Optional[str] = None
    hints: Optional[str] = None
    is_concluded: bool = False


class InterviewSessionResponse(BaseModel):
    id: int
    company_id: Optional[int] = None
    company_name: Optional[str] = None
    target_role: str
    difficulty: str
    status: InterviewStatus
    overall_score: float
    feedback_summary: Optional[str] = None
    created_at: datetime
    messages: List[InterviewMessageResponse] = []

    model_config = {"from_attributes": True}


class EndInterviewResponse(BaseModel):
    session_id: int
    overall_score: float
    total_turns: int
    feedback_summary: str
    strengths: List[str]
    areas_to_improve: List[str]
