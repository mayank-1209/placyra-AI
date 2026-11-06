from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import require_permission, require_user
from app.schemas.blog_schema import (
    BlogCategoryResponse,
    BlogPostDetailResponse,
    BlogPostSummaryResponse,
    BlogPostCreate,
    BlogPostUpdate,
)
from app.services.blog_service import BlogService

router = APIRouter(prefix="/blog", tags=["Student Placement Blog & Knowledge Base"])


@router.get("/posts", response_model=List[BlogPostSummaryResponse])
def list_blog_posts(
    category: Optional[str] = Query(None, description="Category slug filter"),
    search: Optional[str] = Query(None, description="Search query in title, excerpt, and content"),
    page: int = Query(1, ge=1),
    limit: int = Query(12, ge=1, le=50),
    db: Session = Depends(get_db),
):
    """
    Public Endpoint: Lists published placement guides, technical tutorials, and interview chronicles.
    No authentication required.
    """
    posts, _ = BlogService.get_public_posts(
        db=db,
        category_slug=category,
        search=search,
        page=page,
        limit=limit,
    )

    summaries = []
    for p in posts:
        summary = BlogPostSummaryResponse.model_validate(p)
        if p.category:
            summary.category_name = p.category.name
            summary.category_slug = p.category.slug
        if p.author:
            summary.author_name = p.author.full_name
        summaries.append(summary)

    return summaries


@router.get("/posts/{slug}", response_model=BlogPostDetailResponse)
def get_blog_post_detail(
    slug: str,
    db: Session = Depends(get_db),
):
    """
    Public Endpoint: Fetches full article content, meta information, and attached product CTA hooks.
    No authentication required.
    """
    post = BlogService.get_post_by_slug(db, slug)
    detail = BlogPostDetailResponse.model_validate(post)
    if post.author:
        detail.author_name = post.author.full_name
    return detail


@router.get("/categories", response_model=List[BlogCategoryResponse])
def list_blog_categories(
    db: Session = Depends(get_db),
):
    """
    Public Endpoint: Lists all blog categories with article counts.
    No authentication required.
    """
    return BlogService.get_categories(db)


@router.post("/posts", response_model=BlogPostDetailResponse, status_code=status.HTTP_201_CREATED)
def create_blog_post(
    post_in: BlogPostCreate,
    db: Session = Depends(get_db),
    user_payload: dict = Depends(require_permission("blog:create")),
):
    """
    Protected Endpoint: Creates a new article draft. Requires 'blog:create' permission.
    """
    author_id = user_payload.get("id")
    post = BlogService.create_post(db, post_in, author_id)
    detail = BlogPostDetailResponse.model_validate(post)
    if post.author:
        detail.author_name = post.author.full_name
    return detail


@router.patch("/posts/{post_id}", response_model=BlogPostDetailResponse)
def update_blog_post(
    post_id: str,
    post_in: BlogPostUpdate,
    db: Session = Depends(get_db),
    user_payload: dict = Depends(require_permission("blog:edit_own")),
):
    """
    Protected Endpoint: Updates an article with service-layer ownership enforcement.
    """
    post = BlogService.update_post(db, post_id, post_in, user_payload)
    detail = BlogPostDetailResponse.model_validate(post)
    if post.author:
        detail.author_name = post.author.full_name
    return detail


@router.delete("/posts/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_blog_post(
    post_id: str,
    db: Session = Depends(get_db),
    user_payload: dict = Depends(require_permission("blog:edit_own")),
):
    """
    Protected Endpoint: Deletes an article with service-layer ownership enforcement.
    """
    BlogService.delete_post(db, post_id, user_payload)
    return None
