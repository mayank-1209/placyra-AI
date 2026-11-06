from fastapi import APIRouter

from app.api.v1.auth import router as auth_router
from app.api.v1.tnp_admin import router as tnp_router
from app.api.v1.student_resume import router as resume_router
from app.api.v1.mock_interview import router as interview_router
from app.api.v1.analytics import router as analytics_router
from app.api.v1.user_settings import router as settings_router
from app.api.v1.blog import router as blog_router
from app.api.v1.ads import router as ads_router

api_router = APIRouter()

api_router.include_router(auth_router)
api_router.include_router(settings_router)
api_router.include_router(tnp_router)
api_router.include_router(resume_router)
api_router.include_router(interview_router)
api_router.include_router(analytics_router)
api_router.include_router(blog_router)
api_router.include_router(ads_router)
