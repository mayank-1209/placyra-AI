import enum
import uuid
from datetime import datetime
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum as SQLEnum,
    ForeignKey,
    Index,
    Integer,
    String,
    Table,
    Text,
)
from sqlalchemy.dialects.mysql import LONGTEXT
from sqlalchemy.orm import relationship

from app.core.database import Base

# Association table: BlogPost <-> BlogTag
blog_post_tags = Table(
    "blog_post_tags",
    Base.metadata,
    Column("post_id", String(36), ForeignKey("blog_posts.id", ondelete="CASCADE"), primary_key=True),
    Column("tag_id", String(36), ForeignKey("blog_tags.id", ondelete="CASCADE"), primary_key=True),
)


class BlogPostStatus(str, enum.Enum):
    DRAFT = "draft"
    IN_REVIEW = "in_review"
    PUBLISHED = "published"
    ARCHIVED = "archived"


class BlogCategory(Base):
    __tablename__ = "blog_categories"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(100), nullable=False)
    slug = Column(String(120), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    posts = relationship("BlogPost", back_populates="category")


class BlogTag(Base):
    __tablename__ = "blog_tags"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(100), nullable=False)
    slug = Column(String(120), unique=True, nullable=False, index=True)

    # Relationships
    posts = relationship("BlogPost", secondary=blog_post_tags, back_populates="tags")


class BlogPost(Base):
    __tablename__ = "blog_posts"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    author_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    category_id = Column(String(36), ForeignKey("blog_categories.id", ondelete="SET NULL"), nullable=True, index=True)
    title = Column(String(255), nullable=False)
    slug = Column(String(255), unique=True, nullable=False, index=True)
    excerpt = Column(Text, nullable=True)
    content = Column(Text().with_variant(LONGTEXT, "mysql"), nullable=False)
    cover_image_url = Column(String(500), nullable=True)
    status = Column(SQLEnum(BlogPostStatus), default=BlogPostStatus.DRAFT, nullable=False, index=True)
    published_at = Column(DateTime, nullable=True, index=True)
    reading_time_min = Column(Integer, default=5, nullable=False)
    view_count = Column(Integer, default=0, nullable=False)
    seo_title = Column(String(255), nullable=True)
    seo_description = Column(String(500), nullable=True)
    canonical_url = Column(String(500), nullable=True)
    og_image_url = Column(String(500), nullable=True)
    company_name = Column(String(150), nullable=True)
    role_name = Column(String(150), nullable=True)
    is_sponsored = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    author = relationship("User", back_populates="blog_posts")
    category = relationship("BlogCategory", back_populates="posts")
    tags = relationship("BlogTag", secondary=blog_post_tags, back_populates="posts")
    cta_hooks = relationship("PostCtaHook", back_populates="post", cascade="all, delete-orphan")

    __table_args__ = (
        Index("idx_blog_status_published", "status", "published_at"),
        Index("idx_blog_category_published", "category_id", "published_at"),
    )
