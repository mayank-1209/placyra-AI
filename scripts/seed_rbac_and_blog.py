"""
Database Seeding Script for RBAC Roles, Permissions, Blog Categories, Ad Slots, and Initial Posts.
Execute inside backend virtual environment:
    python scripts/seed_rbac_and_blog.py
"""
import os
import sys
import uuid
from datetime import datetime

# Add backend directory to sys.path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from app.core.database import SessionLocal, engine, Base
from app.models.user import User
from app.models.settings import UserSetting, ThemePreference
from app.models.rbac import Role, Permission, role_permissions, user_roles
from app.models.blog import BlogCategory, BlogPost, BlogTag, BlogPostStatus, blog_post_tags
from app.models.ad import AdSlot, PostCtaHook, AdPlacement, AdDevice, PostCtaType


def seed_rbac_and_blog():
    print("Connecting to database and seeding RBAC, settings, blog, and ad configurations...")
    db = SessionLocal()

    try:
        # --------------------------------------------------------------------------
        # 1. SEED PERMISSIONS
        # --------------------------------------------------------------------------
        permissions_data = [
            ("resume:analyze", "Upload and execute OCR resume extraction and ATS scoring"),
            ("ai:use", "Access Ollama adaptive mock interview chamber and RAG evaluations"),
            ("blog:read", "Read public articles, guides, and interview chronicles"),
            ("blog:create", "Create new placement articles and drafts"),
            ("blog:edit_own", "Edit own created blog drafts"),
            ("blog:edit_any", "Edit any post across authors"),
            ("blog:publish", "Review and publish blog posts to production"),
            ("ads:manage", "Configure and toggle Google AdSense ad units and CTA hooks"),
            ("users:manage", "Manage system users, student verification, and role assignments"),
        ]

        permission_map = {}
        for code, desc in permissions_data:
            perm = db.query(Permission).filter(Permission.code == code).first()
            if not perm:
                perm = Permission(id=str(uuid.uuid4()), code=code, description=desc)
                db.add(perm)
                db.flush()
            permission_map[code] = perm

        # --------------------------------------------------------------------------
        # 2. SEED ROLES & ROLE-PERMISSION MAPPINGS
        # --------------------------------------------------------------------------
        role_definitions = {
            "student": ["resume:analyze", "ai:use", "blog:read"],
            "author": ["resume:analyze", "ai:use", "blog:read", "blog:create", "blog:edit_own"],
            "editor": [
                "resume:analyze", "ai:use", "blog:read", "blog:create", "blog:edit_own",
                "blog:edit_any", "blog:publish"
            ],
            "admin": [
                "resume:analyze", "ai:use", "blog:read", "blog:create", "blog:edit_own",
                "blog:edit_any", "blog:publish", "ads:manage", "users:manage"
            ],
            "super_admin": [
                "resume:analyze", "ai:use", "blog:read", "blog:create", "blog:edit_own",
                "blog:edit_any", "blog:publish", "ads:manage", "users:manage"
            ],
        }

        role_map = {}
        for role_name, perm_codes in role_definitions.items():
            role = db.query(Role).filter(Role.name == role_name).first()
            if not role:
                role = Role(
                    id=str(uuid.uuid4()),
                    name=role_name,
                    description=f"{role_name.replace('_', ' ').capitalize()} role permissions"
                )
                db.add(role)
                db.flush()
            role_map[role_name] = role

            # Sync permissions
            target_perms = [permission_map[c] for c in perm_codes if c in permission_map]
            role.permissions = target_perms

        # --------------------------------------------------------------------------
        # 3. MIGRATE EXISTING USERS TO USER_ROLES & SETTINGS
        # --------------------------------------------------------------------------
        all_users = db.query(User).all()
        for user in all_users:
            # Map legacy enum role to RBAC role
            target_role_name = "student"
            if str(user.role).lower() in ("tnp_admin", "admin"):
                target_role_name = "admin"
            elif str(user.role).lower() == "alumni":
                target_role_name = "author"

            assigned_role = role_map.get(target_role_name)
            if assigned_role and assigned_role not in user.assigned_roles:
                user.assigned_roles.append(assigned_role)

            # Ensure user_settings row exists
            existing_settings = db.query(UserSetting).filter(UserSetting.user_id == user.id).first()
            if not existing_settings:
                user_setting = UserSetting(
                    id=str(uuid.uuid4()),
                    user_id=user.id,
                    theme_preference=ThemePreference.SYSTEM,
                )
                db.add(user_setting)

        # --------------------------------------------------------------------------
        # 4. SEED BLOG CATEGORIES
        # --------------------------------------------------------------------------
        categories_data = [
            ("Interview Experiences", "interview-experiences", "Round-by-round coding, technical, and HR interview chronicles for top recruiters."),
            ("Technical Tutorials", "technical-tutorials", "In-depth system design, algorithms, concurrency, and cloud deployment guides."),
            ("Resume Guides", "resume-guides", "ATS formatting checklists, action verb frameworks, and resume engineering best practices."),
        ]

        category_map = {}
        for name, slug, desc in categories_data:
            cat = db.query(BlogCategory).filter(BlogCategory.slug == slug).first()
            if not cat:
                cat = BlogCategory(id=str(uuid.uuid4()), name=name, slug=slug, description=desc)
                db.add(cat)
                db.flush()
            category_map[slug] = cat

        # --------------------------------------------------------------------------
        # 5. SEED AD SLOTS CONFIGURATION
        # --------------------------------------------------------------------------
        ad_slots_data = [
            ("top_leaderboard", AdPlacement.TOP_LEADERBOARD, os.getenv("ADSENSE_LEADERBOARD_ID", "pub-placeholder-728x90"), "responsive", 90, True, AdDevice.ALL),
            ("in_article", AdPlacement.IN_ARTICLE, os.getenv("ADSENSE_IN_ARTICLE_ID", "pub-placeholder-in-article"), "fluid", 250, True, AdDevice.ALL),
            ("sidebar_sticky", AdPlacement.SIDEBAR_STICKY, os.getenv("ADSENSE_SIDEBAR_ID", "pub-placeholder-300x600"), "rectangle_300x600", 600, True, AdDevice.DESKTOP),
            ("feed_native", AdPlacement.FEED_NATIVE, os.getenv("ADSENSE_FEED_ID", "pub-placeholder-feed-card"), "native_card", 120, True, AdDevice.ALL),
            ("multiplex_footer", AdPlacement.MULTIPLEX_FOOTER, os.getenv("ADSENSE_MULTIPLEX_ID", "pub-placeholder-multiplex"), "grid_multiplex", 280, True, AdDevice.ALL),
        ]

        for key, placement, unit_id, fmt, min_h, enabled, device in ad_slots_data:
            slot = db.query(AdSlot).filter(AdSlot.slot_key == key).first()
            if not slot:
                slot = AdSlot(
                    id=str(uuid.uuid4()),
                    slot_key=key,
                    placement=placement,
                    ad_unit_id=unit_id,
                    format=fmt,
                    min_height_px=min_h,
                    is_enabled=enabled,
                    device=device,
                )
                db.add(slot)

        # --------------------------------------------------------------------------
        # 6. SEED SAMPLE HIGH-VALUE POSTS & CTA HOOKS
        # --------------------------------------------------------------------------
        admin_user = db.query(User).filter(User.email.like("%admin%")).first() or all_users[0] if all_users else None

        if admin_user:
            # Post 1: Google Interview Experience
            post1_slug = "cracking-google-l3-swe-campus-placement-experience"
            post1 = db.query(BlogPost).filter(BlogPost.slug == post1_slug).first()
            if not post1:
                post1 = BlogPost(
                    id=str(uuid.uuid4()),
                    author_id=admin_user.id,
                    category_id=category_map["interview-experiences"].id,
                    title="Cracking the Google L3 SWE Campus Placement: 4 Technical Rounds Deconstructed",
                    slug=post1_slug,
                    excerpt="A comprehensive breakdown of graph algorithms, sliding window logs, and concurrency questions asked in the Google on-campus drive.",
                    content="""# Cracking the Google L3 SWE Campus Placement

Securing a software engineering offer from Google requires disciplined preparation across graph traversal, dynamic programming, and systems design fundamentals.

## Round 1: Online Assessment (OA)
The assessment consisted of two challenging algorithmic questions with strict 90-minute time constraints. The first question evaluated monotonic stacks for range queries, and the second tested shortest path DAG dynamic programming.

## Round 2: Technical Interview 1 — Tree Traversals & Bit Manipulation
The interviewer presented a serialized binary tree problem with weighted nodes. The key requirement was calculating maximum path sums with negative node weights in O(N) time and O(H) auxiliary stack space.

## Round 3: Technical Interview 2 — Concurrency & System Design Basics
In this round, we designed an in-memory distributed rate limiter. We evaluated sliding window logs versus token bucket algorithms and addressed clock skew across distributed servers.

## Round 4: Googliness & Behavioral Leadership
The discussion focused on navigating technical disagreements, mentoring peers through blockers, and designing inclusive software architectures.

## Key Takeaways
Consistent practice with adaptive mock interviewers that evaluate time/space complexity under real-time constraints is essential for campus placement success.
""",
                    status=BlogPostStatus.PUBLISHED,
                    published_at=datetime.utcnow(),
                    reading_time_min=6,
                    company_name="Google",
                    role_name="Software Engineer",
                    seo_title="Google L3 SWE Campus Placement Interview Experience | Placyra",
                    seo_description="Full round-by-round breakdown of Google SWE campus placement rounds including tree traversal, rate limiting, and system design.",
                )
                db.add(post1)
                db.flush()

                # Add CTA Hook for company mock interview
                cta1 = PostCtaHook(
                    id=str(uuid.uuid4()),
                    post_id=post1.id,
                    hook_type=PostCtaType.MOCK_INTERVIEW_BUTTON,
                    config={"company_name": "Google", "target_role": "Software Engineer", "difficulty": "Hard"},
                    is_enabled=True,
                )
                db.add(cta1)

            # Post 2: Resume Guide
            post2_slug = "the-ultimate-engineering-resume-guide-passing-ats-algorithms"
            post2 = db.query(BlogPost).filter(BlogPost.slug == post2_slug).first()
            if not post2:
                post2 = BlogPost(
                    id=str(uuid.uuid4()),
                    author_id=admin_user.id,
                    category_id=category_map["resume-guides"].id,
                    title="The Ultimate Engineering Resume Guide: How to Beat Modern ATS Scanners",
                    slug=post2_slug,
                    excerpt="Learn how PyMuPDF and modern ATS parsers extract technical skills, metrics, and CGPA from single-column engineering resumes.",
                    content="""# The Ultimate Engineering Resume Guide

Applicant Tracking Systems (ATS) filter over 75% of candidate resumes before a human recruiter ever sees them. Here is how to format your engineering resume for maximum keyword extractability.

## 1. Single-Column Clean Typography
Avoid multi-column tables, text boxes, and complex graphical charts. Text extraction engines like PyMuPDF read top-to-bottom and can scramble columns into incoherent text fragments.

## 2. Quantify Project Impact with XYZ Formula
Frame every project bullet point using Google's XYZ formula: *"Accomplished [X], as measured by [Y], by doing [Z]"*. For example: *"Reduced API p99 latency by 42% (Y) by implementing Redis sorted sets and read-through caching (Z)"*.

## 3. Explicit Skill Section Keywords
Group technical skills under explicit subheadings: **Languages**, **Frameworks**, **Developer Tools**, and **Core CS Fundamentals**. Avoid rating bars or percentages (e.g., 'Python 90%') which ATS parsers cannot interpret.

## 4. Run Automated OCR Verification
Before submitting to corporate portals, test your document using Placyra's PyMuPDF OCR analyzer to review your verified skill density and placement readiness score.
""",
                    status=BlogPostStatus.PUBLISHED,
                    published_at=datetime.utcnow(),
                    reading_time_min=5,
                    seo_title="How to Format Your Engineering Resume for ATS Verification | Placyra",
                    seo_description="Guide to passing automated recruiter ATS parsers with clean PyMuPDF-friendly resume structures and quantified project bullets.",
                )
                db.add(post2)
                db.flush()

                # Add CTA Hook for resume analyzer callout
                cta2 = PostCtaHook(
                    id=str(uuid.uuid4()),
                    post_id=post2.id,
                    hook_type=PostCtaType.RESUME_ANALYZER_CALLOUT,
                    config={"callout_title": "Analyze Your Resume with PyMuPDF OCR", "button_text": "Upload Resume to Placyra Analyzer"},
                    is_enabled=True,
                )
                db.add(cta2)

        db.commit()
        print("✓ RBAC, User Settings, Blog Categories, Ad Slots, and Initial Posts successfully seeded!")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_rbac_and_blog()
