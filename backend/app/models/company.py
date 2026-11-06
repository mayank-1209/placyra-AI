from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Float, DateTime, JSON
from sqlalchemy.orm import relationship

from app.core.database import Base


class Company(Base):
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(255), unique=True, index=True, nullable=False)
    industry = Column(String(150), nullable=True)
    description = Column(Text, nullable=True)
    website = Column(String(255), nullable=True)
    min_cgpa = Column(Float, default=0.0, nullable=False)
    eligible_branches = Column(JSON, nullable=True)   # List of strings e.g. ["CSE", "IT"]
    required_skills = Column(JSON, nullable=True)     # List of strings e.g. ["DSA", "Python"]
    hiring_workflow = Column(JSON, nullable=True)     # List of rounds e.g. ["OA", "Tech 1", "HR"]
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    questions = relationship("Question", back_populates="company", cascade="all, delete-orphan")
    interview_sessions = relationship("MockInterviewSession", back_populates="company")
    skill_gap_reports = relationship("SkillGapReport", back_populates="company", cascade="all, delete-orphan")
