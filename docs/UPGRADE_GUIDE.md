# Placyra Enterprise Upgrade & Modernization Guide
**Version:** 2.0.0-PROD  
**Architecture:** React 18 (Vite, Port 4000) + FastAPI + SQLAlchemy 2.0 (MySQL 8.0) + Local Ollama AI + Qdrant

---

## 1. Executive Summary

This release completes the end-to-end transformation of Placyra into an open, secure, enterprise-grade campus placement assistant with guest access, RBAC authorization, custom themes, and an AdSense-compliant blog knowledge base.

---

## 2. Core Architectural Upgrades

### Phase 1: Public Access & Auth Gating (Guest Mode)
- **Public Entry:** Home (`/`), Public Blog (`/blog`, `/blog/:slug`), and Static Pages are 100% accessible to guest visitors without authentication.
- **Action Gating:** Protected capabilities (Resume Upload & OCR, AI Mock Interviews, Skill-Gap Reports) do not redirect guests away. Instead, they trigger the global `<AuthModal />` while registering a `pendingAction`.
- **Automatic Resume:** Once the user logs in or creates an account, the intended action resumes seamlessly via `useAuthGate()` and `pendingActionRegistry`.
- **Decoupled API Interceptors:** Axios response interceptors emit `placyra:auth_required` events on HTTP 401 instead of forcing hard window redirects, preventing auth loops.
- **Backend Dependency:** `require_user` FastAPI dependency returns `{ "detail": "Authentication required", "code": "AUTH_REQUIRED" }`.

### Phase 2: Design Token Palette (Zero Indigo/Violet Purge)
- Purged 100% of hardcoded `indigo-*`, `violet-*`, and un-themed hex colors across all React components, forms, and charts.
- Built a semantic design token system in `frontend/src/index.css` supporting light and dark surface tokens:
  - `--bg`, `--surface`, `--surface-2`, `--border`, `--text`, `--text-muted`, `--accent` (`#2563eb`), `--accent-hover`, `--success`, `--warning`, `--danger`.
- Mapped tokens directly into `tailwind.config.js`.

### Phase 3: 3-Way Theme System (Light, Dark, System)
- **Zero Flash of Unstyled Content (FOUC):** High-speed inline IIFE script placed in `index.html` `<head>` evaluates `localStorage['placyra-theme']` and system `prefers-color-scheme` before DOM rendering.
- **Theme Controls:** `<ThemeToggle />` segmented pill in the navigation bar.
- **Dual Persistence:** Stored in `localStorage` for guests and synced asynchronously with debouncing to `PATCH /api/v1/me/settings` for authenticated users.

### Phase 4: Database Schema & Reversible Alembic Migrations
- Standardized all primary keys to RFC 4122 `CHAR(36)` UUIDs.
- Created reversible migration `20261106_001_phase4_schema.py` covering:
  - `user_settings`
  - `roles`, `permissions`, `role_permissions`, `user_roles`
  - `audit_logs`
  - `blog_categories`, `blog_posts`, `blog_tags`, `blog_post_tags`
  - `ad_slots`, `post_cta_hooks`
- Created database seed script `scripts/seed_rbac_and_blog.py`.

### Phase 5: Role-Based Access Control (RBAC)
- 5 Hierarchical Roles: `student`, `author`, `editor`, `admin`, `super_admin`.
- Fine-grained permission codes:
  - `resume:analyze`, `ai:use`, `blog:read`, `blog:create`, `blog:edit_own`, `blog:edit_any`, `blog:publish`, `ads:manage`, `users:manage`.
- Backend decorators: `require_permission(code)` and `require_role(role)` returning HTTP 403 `FORBIDDEN` with audit trail logging.

### Phase 6: Layered Architecture
- Separation of concerns: `Router -> Service Layer -> Repository / ORM -> Database Model`.

### Phase 7: Public Blog & Google AdSense Readiness
- **Blog Engine:**
  - Index (`/blog`) with search, category filtering, reading time, and author metadata.
  - Article Page (`/blog/:slug`) with social share buttons, structured headings, and author bios.
  - Category Archive (`/blog/category/:slug`).
  - Editorial Studio (`/blog/editor`) for authors with live Markdown split preview.
  - Ad Manager (`/admin/ads`) for controlling ad slots.
- **AdSense & CLS Protections:**
  - `<AdSlot slotKey="..." />` enforcing reserved `min-height` containers (0 Cumulative Layout Shift).
  - 5 Smart placements:
    1. `top_leaderboard` (728x90 desktop / 320x50 mobile)
    2. `in_article_1` (336x280 / responsive)
    3. `sticky_sidebar` (300x600 Half-page desktop sticky)
    4. `in_article_2` (336x280 mid-article)
    5. `feed_native` (auto-injected after every 6th card on `/blog`)
    6. `multiplex_footer` (grid recommendations)
  - `<CookieConsentBanner />` for GDPR/privacy compliance with `Accept All` and `Essential Only` modes.
- **Conversion Hooks:**
  - `<ResumeAnalyzerCallout />` triggering Phase 1 auth-gated resume scanning.
  - `<CompanyMockInterviewButton />` launching company-specific AI mock interview chamber.
  - `<ArticleTOC />` with IntersectionObserver scroll-spy for sticky desktop sidebar.
- **Legal Compliance:**
  - Dedicated pages for `/about`, `/contact`, `/privacy`, `/terms`, and `/cookie-policy`.

---

## 3. Environment Variables

Add to `backend/.env`:
```env
# Relational DB
DATABASE_URL=mysql+pymysql://placyra_user:placyra_secure_password_2026@127.0.0.1:3306/placyra_db
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_USER=placyra_user
MYSQL_PASSWORD=placyra_secure_password_2026
MYSQL_DATABASE=placyra_db

# Security & CORS
SECRET_KEY=placyra-enterprise-secret-key-32-chars-minimum
CORS_ORIGINS=["http://localhost:4000", "http://127.0.0.1:4000"]
```

Add to `frontend/.env`:
```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
# Optional: Set your real Google AdSense Publisher ID for production
VITE_ADSENSE_CLIENT_ID=ca-pub-0000000000000000
```

---

## 4. Verification & Testing

### Backend Unit & Integration Tests (10/10 Passing)
```powershell
$env:PYTHONPATH='backend'
.\backend\venv\Scripts\python.exe -m pytest backend/tests/test_api.py -v
```
All 10 test suites pass:
1. `test_root_endpoint` - PASSED
2. `test_health_endpoint` - PASSED
3. `test_password_hashing` - PASSED
4. `test_jwt_token_lifecycle` - PASSED
5. `test_question_deduplication` - PASSED
6. `test_fallback_embeddings` - PASSED
7. `test_resume_regex_parsing` - PASSED
8. `test_security_sanitization_and_defenses` - PASSED
9. `test_auth_gating_and_guest_access` - PASSED
10. `test_rbac_permission_matrix` - PASSED

### Frontend Production Build
```powershell
npm --prefix frontend run build
```
Built in 14.19s with 0 errors across 2,297 modules.
