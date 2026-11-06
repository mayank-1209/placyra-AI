import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Enum as SQLEnum
from sqlalchemy.orm import relationship

from app.core.database import Base


class UserRole(str, enum.Enum):
    STUDENT = "student"
    TNP_ADMIN = "tnp_admin"
    ALUMNI = "alumni"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(SQLEnum(UserRole), default=UserRole.STUDENT, nullable=False, index=True)
    branch = Column(String(100), nullable=True)
    cgpa = Column(Float, nullable=True)
    graduation_year = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Core Relationships
    resumes = relationship("Resume", back_populates="user", cascade="all, delete-orphan")
    interview_sessions = relationship("MockInterviewSession", back_populates="user", cascade="all, delete-orphan")
    submitted_questions = relationship("Question", back_populates="submitter")
    skill_gap_reports = relationship("SkillGapReport", back_populates="user", cascade="all, delete-orphan")

    # Extension Relationships (Settings, RBAC, Blog)
    settings = relationship("UserSetting", back_populates="user", uselist=False, cascade="all, delete-orphan")
    assigned_roles = relationship("Role", secondary="user_roles", back_populates="users")
    blog_posts = relationship("BlogPost", back_populates="author", cascade="all, delete-orphan")
