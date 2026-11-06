from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict
from app.models.blog import BlogPostStatus
from app.schemas.ad_schema import PostCtaHookResponse


class BlogCategoryResponse(BaseModel):
    id: str
    name: str
    slug: str
    description: Optional[str] = None
    created_at: datetime
    post_count: Optional[int] = 0

    model_config = ConfigDict(from_attributes=True)


class BlogCategoryCreate(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None


class BlogTagResponse(BaseModel):
    id: str
    name: str
    slug: str

    model_config = ConfigDict(from_attributes=True)


class BlogPostSummaryResponse(BaseModel):
    id: str
    title: str
    slug: str
    excerpt: Optional[str] = None
    cover_image_url: Optional[str] = None
    status: BlogPostStatus
    published_at: Optional[datetime] = None
    reading_time_min: int
    view_count: int
    company_name: Optional[str] = None
    role_name: Optional[str] = None
    is_sponsored: bool
    category_name: Optional[str] = None
    category_slug: Optional[str] = None
    author_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class BlogPostDetailResponse(BaseModel):
    id: str
    title: str
    slug: str
    excerpt: Optional[str] = None
    content: str
    cover_image_url: Optional[str] = None
    status: BlogPostStatus
    published_at: Optional[datetime] = None
    reading_time_min: int
    view_count: int
    seo_title: Optional[str] = None
    seo_description: Optional[str] = None
    canonical_url: Optional[str] = None
    og_image_url: Optional[str] = None
    company_name: Optional[str] = None
    role_name: Optional[str] = None
    is_sponsored: bool
    created_at: datetime
    updated_at: datetime
    category: Optional[BlogCategoryResponse] = None
    tags: List[BlogTagResponse] = []
    cta_hooks: List[PostCtaHookResponse] = []
    author_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class BlogPostCreate(BaseModel):
    title: str
    slug: Optional[str] = None
    category_id: Optional[str] = None
    excerpt: Optional[str] = None
    content: str
    cover_image_url: Optional[str] = None
    company_name: Optional[str] = None
    role_name: Optional[str] = None
    status: Optional[BlogPostStatus] = BlogPostStatus.DRAFT
    seo_title: Optional[str] = None
    seo_description: Optional[str] = None
    tag_names: Optional[List[str]] = []


class BlogPostUpdate(BaseModel):
    title: Optional[str] = None
    slug: Optional[str] = None
    category_id: Optional[str] = None
    excerpt: Optional[str] = None
    content: Optional[str] = None
    cover_image_url: Optional[str] = None
    company_name: Optional[str] = None
    role_name: Optional[str] = None
    status: Optional[BlogPostStatus] = None
    seo_title: Optional[str] = None
    seo_description: Optional[str] = None
    tag_names: Optional[List[str]] = None
