import enum
import uuid
from datetime import datetime
from sqlalchemy import Boolean, Column, DateTime, Enum as SQLEnum, ForeignKey, Integer, String, JSON
from sqlalchemy.orm import relationship

from app.core.database import Base


class AdPlacement(str, enum.Enum):
    TOP_LEADERBOARD = "top_leaderboard"
    IN_ARTICLE = "in_article"
    SIDEBAR_STICKY = "sidebar_sticky"
    FEED_NATIVE = "feed_native"
    MULTIPLEX_FOOTER = "multiplex_footer"


class AdDevice(str, enum.Enum):
    ALL = "all"
    DESKTOP = "desktop"
    MOBILE = "mobile"


class PostCtaType(str, enum.Enum):
    RESUME_ANALYZER_CALLOUT = "resume_analyzer_callout"
    MOCK_INTERVIEW_BUTTON = "mock_interview_button"


class AdSlot(Base):
    __tablename__ = "ad_slots"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    slot_key = Column(String(100), unique=True, nullable=False, index=True)
    placement = Column(SQLEnum(AdPlacement), nullable=False)
    ad_unit_id = Column(String(100), nullable=True)
    format = Column(String(50), default="responsive", nullable=False)
    min_height_px = Column(Integer, default=90, nullable=False)
    is_enabled = Column(Boolean, default=False, nullable=False)
    device = Column(SQLEnum(AdDevice), default=AdDevice.ALL, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class PostCtaHook(Base):
    __tablename__ = "post_cta_hooks"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    post_id = Column(String(36), ForeignKey("blog_posts.id", ondelete="CASCADE"), nullable=False, index=True)
    hook_type = Column(SQLEnum(PostCtaType), nullable=False)
    config = Column(JSON, nullable=True)
    is_enabled = Column(Boolean, default=True, nullable=False)

    post = relationship("BlogPost", back_populates="cta_hooks")
