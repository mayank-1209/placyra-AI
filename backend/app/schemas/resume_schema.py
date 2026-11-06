from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class ResumeParsedData(BaseModel):
    skills: List[str] = Field(default_factory=list)
    projects: List[Dict[str, Any]] = Field(default_factory=list)
    experience: List[Dict[str, Any]] = Field(default_factory=list)
    education: List[Dict[str, Any]] = Field(default_factory=list)
    cgpa: Optional[float] = None
    contact: Dict[str, Any] = Field(default_factory=dict)


class ResumeUploadResponse(BaseModel):
    id: int
    user_id: int
    file_name: str
    readiness_score: float
    parsed_data: ResumeParsedData
    raw_ocr_preview: str
    created_at: datetime

    model_config = {"from_attributes": True}


class SkillRadarPoint(BaseModel):
    subject: str
    student: float
    required: float
    fullMark: float = 100.0


class SkillGapResponse(BaseModel):
    company_id: int
    company_name: str
    target_role: str
    match_score: float
    matched_skills: List[str]
    missing_skills: List[str]
    recommended_topics: List[str]
    radar_data: List[SkillRadarPoint]
    action_plan: List[str]
    suggestions: str


class StudentReadinessOverview(BaseModel):
    overall_score: float
    resume_score: float
    interview_avg_score: float
    interviews_completed: int
    top_strengths: List[str]
    critical_gaps: List[str]
    radar_metrics: List[SkillRadarPoint]
    historical_trend: List[Dict[str, Any]]
