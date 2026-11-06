import math
import re
import uuid
from datetime import datetime
from typing import List, Optional, Tuple
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.models.blog import BlogCategory, BlogPost, BlogPostStatus, BlogTag
from app.models.ad import AdSlot, PostCtaHook
from app.schemas.blog_schema import BlogPostCreate, BlogPostUpdate
from app.schemas.ad_schema import AdSlotUpdate


def slugify(text: str) -> str:
    """Converts a title string into an SEO-friendly URL slug."""
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_-]+", "-", text)
    return text.strip("-")


def calculate_reading_time(content: str) -> int:
    """Estimates reading time in minutes based on 200 words per minute."""
    words = len(content.split())
    return max(1, math.ceil(words / 200))


class BlogService:
    @staticmethod
    def get_public_posts(
        db: Session,
        category_slug: Optional[str] = None,
        search: Optional[str] = None,
        page: int = 1,
        limit: int = 12,
    ) -> Tuple[List[BlogPost], int]:
        """Lists published blog posts with category and search filtering."""
        query = db.query(BlogPost).filter(BlogPost.status == BlogPostStatus.PUBLISHED)

        if category_slug:
            query = query.join(BlogPost.category).filter(BlogCategory.slug == category_slug)

        if search:
            search_term = f"%{search.strip()}%"
            query = query.filter(
                or_(
                    BlogPost.title.ilike(search_term),
                    BlogPost.excerpt.ilike(search_term),
                    BlogPost.content.ilike(search_term),
                    BlogPost.company_name.ilike(search_term),
                )
            )

        total = query.count()
        posts = (
            query.order_by(BlogPost.published_at.desc())
            .offset((page - 1) * limit)
            .limit(limit)
            .all()
        )
        return posts, total

    @staticmethod
    def get_post_by_slug(db: Session, slug: str) -> BlogPost:
        """Fetches a published article by slug and safely increments view count."""
        post = (
            db.query(BlogPost)
            .filter(BlogPost.slug == slug)
            .first()
        )
        if not post:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Article not found or has been moved",
            )

        # Increment view count
        post.view_count += 1
        db.commit()
        db.refresh(post)
        return post

    @staticmethod
    def get_categories(db: Session) -> List[BlogCategory]:
        """Returns all categories with published post counts."""
        categories = db.query(BlogCategory).order_by(BlogCategory.name.asc()).all()
        for cat in categories:
            cat.post_count = (
                db.query(BlogPost)
                .filter(BlogPost.category_id == cat.id, BlogPost.status == BlogPostStatus.PUBLISHED)
                .count()
            )
        return categories

    @staticmethod
    def create_post(db: Session, post_in: BlogPostCreate, author_id: int) -> BlogPost:
        """Creates a new article draft or submitted post."""
        base_slug = slugify(post_in.slug or post_in.title)
        unique_slug = base_slug
        counter = 1
        while db.query(BlogPost).filter(BlogPost.slug == unique_slug).first():
            unique_slug = f"{base_slug}-{counter}"
            counter += 1

        reading_time = calculate_reading_time(post_in.content)
        published_at = datetime.utcnow() if post_in.status == BlogPostStatus.PUBLISHED else None

        post = BlogPost(
            id=str(uuid.uuid4()),
            author_id=author_id,
            category_id=post_in.category_id,
            title=post_in.title,
            slug=unique_slug,
            excerpt=post_in.excerpt or (post_in.content[:160] + "..."),
            content=post_in.content,
            cover_image_url=post_in.cover_image_url,
            status=post_in.status or BlogPostStatus.DRAFT,
            published_at=published_at,
            reading_time_min=reading_time,
            seo_title=post_in.seo_title or post_in.title,
            seo_description=post_in.seo_description or post_in.excerpt,
            company_name=post_in.company_name,
            role_name=post_in.role_name,
        )

        # Handle tags
        if post_in.tag_names:
            for tag_name in post_in.tag_names:
                tag_slug = slugify(tag_name)
                tag = db.query(BlogTag).filter(BlogTag.slug == tag_slug).first()
                if not tag:
                    tag = BlogTag(id=str(uuid.uuid4()), name=tag_name, slug=tag_slug)
                    db.add(tag)
                    db.flush()
                post.tags.append(tag)

        db.add(post)
        db.commit()
        db.refresh(post)
        return post

    @staticmethod
    def update_post(
        db: Session,
        post_id: str,
        post_in: BlogPostUpdate,
        user_payload: dict,
    ) -> BlogPost:
        """Updates article with service-layer ownership and permission validation."""
        post = db.query(BlogPost).filter(BlogPost.id == post_id).first()
        if not post:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Article not found")

        user_id = user_payload.get("id")
        user_role = user_payload.get("role")
        permissions = user_payload.get("permissions", [])

        # Ownership check: authors can edit only their own posts unless they have blog:edit_any
        if "blog:edit_any" not in permissions and user_role not in ("admin", "super_admin", "editor"):
            if post.author_id != user_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail={"message": "You can only edit your own articles", "code": "FORBIDDEN"},
                )

        update_dict = post_in.model_dump(exclude_unset=True)

        if "content" in update_dict and update_dict["content"]:
            post.reading_time_min = calculate_reading_time(update_dict["content"])

        if "status" in update_dict:
            new_status = update_dict["status"]
            if new_status == BlogPostStatus.PUBLISHED and post.status != BlogPostStatus.PUBLISHED:
                if "blog:publish" not in permissions and user_role not in ("admin", "super_admin", "editor"):
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail={"message": "Publishing requires editor or admin permissions", "code": "FORBIDDEN"},
                    )
                post.published_at = datetime.utcnow()

        for key, value in update_dict.items():
            if key != "tag_names":
                setattr(post, key, value)

        db.commit()
        db.refresh(post)
        return post

    @staticmethod
    def delete_post(db: Session, post_id: str, user_payload: dict) -> None:
        """Deletes an article with ownership enforcement."""
        post = db.query(BlogPost).filter(BlogPost.id == post_id).first()
        if not post:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Article not found")

        user_id = user_payload.get("id")
        user_role = user_payload.get("role")
        permissions = user_payload.get("permissions", [])

        if "blog:edit_any" not in permissions and user_role not in ("admin", "super_admin"):
            if post.author_id != user_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail={"message": "You can only delete your own articles", "code": "FORBIDDEN"},
                )

        db.delete(post)
        db.commit()


class AdService:
    @staticmethod
    def get_public_ad_slots(db: Session) -> List[AdSlot]:
        """Returns all configured ad slots for frontend rendering."""
        return db.query(AdSlot).all()

    @staticmethod
    def update_ad_slot(db: Session, slot_key: str, update_data: AdSlotUpdate) -> AdSlot:
        """Updates ad unit configuration (admin only)."""
        slot = db.query(AdSlot).filter(AdSlot.slot_key == slot_key).first()
        if not slot:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ad slot not found")

        update_dict = update_data.model_dump(exclude_unset=True)
        for key, value in update_dict.items():
            setattr(slot, key, value)

        db.commit()
        db.refresh(slot)
        return slot
