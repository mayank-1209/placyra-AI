from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field
from app.models.question import QuestionDifficulty, ModerationStatus


class CompanyCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    industry: Optional[str] = "Technology"
    description: Optional[str] = None
    website: Optional[str] = None
    min_cgpa: float = Field(default=0.0, ge=0.0, le=10.0)
    eligible_branches: List[str] = Field(default_factory=list)
    required_skills: List[str] = Field(default_factory=list)
    hiring_workflow: List[str] = Field(default_factory=list)


class CompanyResponse(BaseModel):
    id: int
    name: str
    industry: Optional[str] = None
    description: Optional[str] = None
    website: Optional[str] = None
    min_cgpa: float
    eligible_branches: Optional[List[str]] = []
    required_skills: Optional[List[str]] = []
    hiring_workflow: Optional[List[str]] = []
    created_at: datetime
    question_count: Optional[int] = 0

    model_config = {"from_attributes": True}


class QuestionCreate(BaseModel):
    company_id: Optional[int] = None
    role_title: str = Field(..., min_length=2, max_length=150)
    round_type: str = Field(..., min_length=2, max_length=100)
    difficulty: QuestionDifficulty = Field(default=QuestionDifficulty.MEDIUM)
    topic: str = Field(..., min_length=2, max_length=100)
    question_text: str = Field(..., min_length=10)
    answer_guidelines: Optional[str] = None


class QuestionResponse(BaseModel):
    id: int
    company_id: Optional[int] = None
    company_name: Optional[str] = None
    role_title: str
    round_type: str
    difficulty: QuestionDifficulty
    topic: str
    question_text: str
    answer_guidelines: Optional[str] = None
    submitted_by: Optional[int] = None
    moderation_status: ModerationStatus
    qdrant_point_id: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class QuestionBulkItem(BaseModel):
    company_name: Optional[str] = None
    role_title: str
    round_type: str
    difficulty: Optional[str] = "Medium"
    topic: str
    question_text: str
    answer_guidelines: Optional[str] = None


class QuestionBulkUploadResponse(BaseModel):
    total_processed: int
    added_questions: int
    duplicates_skipped: int
    duplicate_details: List[str] = []
    errors: List[str] = []


class QuestionModerationUpdate(BaseModel):
    status: ModerationStatus = Field(..., description="Approved or Rejected")
