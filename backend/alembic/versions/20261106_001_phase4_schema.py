"""Phase 4 Database Schema: user_settings, rbac, blog, ads, and audit_logs

Revision ID: 20261106_001
Revises: 
Create Date: 2026-11-06 19:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

# revision identifiers, used by Alembic.
revision: str = '20261106_001'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. User Settings Table
    op.create_table(
        'user_settings',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('theme_preference', sa.Enum('light', 'dark', 'system', name='theme_preference_enum'), server_default='system', nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id')
    )
    op.create_index('idx_user_settings_user', 'user_settings', ['user_id'])

    # 2. Roles Table
    op.create_table(
        'roles',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('name', sa.String(length=50), nullable=False),
        sa.Column('description', sa.String(length=255), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name')
    )
    op.create_index('idx_role_name', 'roles', ['name'])

    # 3. Permissions Table
    op.create_table(
        'permissions',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('code', sa.String(length=100), nullable=False),
        sa.Column('description', sa.String(length=255), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('code')
    )
    op.create_index('idx_permission_code', 'permissions', ['code'])

    # 4. Role Permissions Association Table
    op.create_table(
        'role_permissions',
        sa.Column('role_id', sa.String(length=36), nullable=False),
        sa.Column('permission_id', sa.String(length=36), nullable=False),
        sa.ForeignKeyConstraint(['permission_id'], ['permissions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['role_id'], ['roles.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('role_id', 'permission_id')
    )

    # 5. User Roles Association Table
    op.create_table(
        'user_roles',
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('role_id', sa.String(length=36), nullable=False),
        sa.ForeignKeyConstraint(['role_id'], ['roles.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('user_id', 'role_id')
    )

    # 6. Audit Logs Table
    op.create_table(
        'audit_logs',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('actor_id', sa.Integer(), nullable=True),
        sa.Column('action', sa.String(length=100), nullable=False),
        sa.Column('target_type', sa.String(length=50), nullable=False),
        sa.Column('target_id', sa.String(length=100), nullable=True),
        sa.Column('details', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.ForeignKeyConstraint(['actor_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_audit_logs_actor', 'audit_logs', ['actor_id'])

    # 7. Blog Categories Table
    op.create_table(
        'blog_categories',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('slug', sa.String(length=120), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('slug')
    )
    op.create_index('idx_blog_category_slug', 'blog_categories', ['slug'])

    # 8. Blog Posts Table
    op.create_table(
        'blog_posts',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('author_id', sa.Integer(), nullable=False),
        sa.Column('category_id', sa.String(length=36), nullable=True),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('slug', sa.String(length=255), nullable=False),
        sa.Column('excerpt', sa.Text(), nullable=True),
        sa.Column('content', mysql.LONGTEXT(), nullable=False),
        sa.Column('cover_image_url', sa.String(length=500), nullable=True),
        sa.Column('status', sa.Enum('draft', 'in_review', 'published', 'archived', name='blog_post_status_enum'), server_default='draft', nullable=False),
        sa.Column('published_at', sa.DateTime(), nullable=True),
        sa.Column('reading_time_min', sa.Integer(), server_default='5', nullable=False),
        sa.Column('view_count', sa.Integer(), server_default='0', nullable=False),
        sa.Column('seo_title', sa.String(length=255), nullable=True),
        sa.Column('seo_description', sa.String(length=500), nullable=True),
        sa.Column('canonical_url', sa.String(length=500), nullable=True),
        sa.Column('og_image_url', sa.String(length=500), nullable=True),
        sa.Column('company_name', sa.String(length=150), nullable=True),
        sa.Column('role_name', sa.String(length=150), nullable=True),
        sa.Column('is_sponsored', sa.Boolean(), server_default='0', nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'), nullable=False),
        sa.ForeignKeyConstraint(['author_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['category_id'], ['blog_categories.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('slug')
    )
    op.create_index('idx_blog_post_status_published', 'blog_posts', ['status', 'published_at'])
    op.create_index('idx_blog_post_category_published', 'blog_posts', ['category_id', 'published_at'])

    # 9. Blog Tags Table
    op.create_table(
        'blog_tags',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('slug', sa.String(length=120), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('slug')
    )

    # 10. Blog Post Tags Association Table
    op.create_table(
        'blog_post_tags',
        sa.Column('post_id', sa.String(length=36), nullable=False),
        sa.Column('tag_id', sa.String(length=36), nullable=False),
        sa.ForeignKeyConstraint(['post_id'], ['blog_posts.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['tag_id'], ['blog_tags.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('post_id', 'tag_id')
    )

    # 11. Ad Slots Configuration Table
    op.create_table(
        'ad_slots',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('slot_key', sa.String(length=100), nullable=False),
        sa.Column('placement', sa.Enum('top_leaderboard', 'in_article', 'sidebar_sticky', 'feed_native', 'multiplex_footer', name='ad_placement_enum'), nullable=False),
        sa.Column('ad_unit_id', sa.String(length=100), nullable=True),
        sa.Column('format', sa.String(length=50), server_default='responsive', nullable=False),
        sa.Column('min_height_px', sa.Integer(), server_default='90', nullable=False),
        sa.Column('is_enabled', sa.Boolean(), server_default='0', nullable=False),
        sa.Column('device', sa.Enum('all', 'desktop', 'mobile', name='ad_device_enum'), server_default='all', nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('slot_key')
    )
    op.create_index('idx_ad_slot_key', 'ad_slots', ['slot_key'])

    # 12. Post CTA Hooks Table
    op.create_table(
        'post_cta_hooks',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('post_id', sa.String(length=36), nullable=False),
        sa.Column('hook_type', sa.Enum('resume_analyzer_callout', 'mock_interview_button', name='post_cta_hook_enum'), nullable=False),
        sa.Column('config', sa.JSON(), nullable=True),
        sa.Column('is_enabled', sa.Boolean(), server_default='1', nullable=False),
        sa.ForeignKeyConstraint(['post_id'], ['blog_posts.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_post_cta_post_id', 'post_cta_hooks', ['post_id'])


def downgrade() -> None:
    # Drop in exact reverse dependency order
    op.drop_table('post_cta_hooks')
    op.drop_table('ad_slots')
    op.drop_table('blog_post_tags')
    op.drop_table('blog_tags')
    op.drop_table('blog_posts')
    op.drop_table('blog_categories')
    op.drop_table('audit_logs')
    op.drop_table('user_roles')
    op.drop_table('role_permissions')
    op.drop_table('permissions')
    op.drop_table('roles')
    op.drop_table('user_settings')
