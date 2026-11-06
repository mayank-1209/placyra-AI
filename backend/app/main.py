import logging
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.database import Base, engine, check_component_health
from app.core.middleware import RateLimitMiddleware, SecurityHeadersMiddleware
from app.services.qdrant_service import initialize_qdrant_collections

# Setup root logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("placyra")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application Lifespan Events:
    - Attempt MySQL 8.0 schema synchronization
    - Initialize Qdrant HNSW vector collections
    """
    logger.info("Initializing Placyra Backend Service...")

    if os.getenv("TESTING", "0") != "1":
        # 1. MySQL Schema Synchronization
        try:
            Base.metadata.create_all(bind=engine)
            logger.info("MySQL 8.0 tables verified and synchronized.")
        except Exception as db_err:
            logger.warning("MySQL connection check during lifespan deferred (%s).", db_err)

        # 2. Qdrant Vector DB Collection Initialization
        try:
            initialize_qdrant_collections()
        except Exception as q_err:
            logger.warning("Qdrant collection initialization deferred (%s).", q_err)

    yield

    logger.info("Shutting down Placyra Backend Service.")


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="AI-Powered Campus Placement and Career Preparation Assistant API",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# Enterprise Security Headers Middleware
app.add_middleware(SecurityHeadersMiddleware)

# Sliding Window Rate Limiting Middleware
app.add_middleware(RateLimitMiddleware, auth_limit=25, general_limit=200)

# CORS Middleware Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API v1 Routers
app.include_router(api_router, prefix=settings.API_V1_STR)

# Mount Uploads directory for static asset preview
if os.path.exists(settings.UPLOAD_DIR):
    app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")


@app.get("/", tags=["Health Check"])
def root():
    """Root status endpoint."""
    return {
        "status": "online",
        "app": settings.PROJECT_NAME,
        "version": "1.0.0",
        "docs": "/docs",
    }


@app.get("/health", tags=["Health Check"])
@app.get("/api/v1/health", tags=["Health Check"])
def health_check():
    """
    Enterprise health check and component diagnostics.
    Reports real-time status of MySQL 8.0, Qdrant, and Ollama.
    """
    components = check_component_health()
    all_healthy = all(c["status"] == "online" for c in components.values())
    return {
        "status": "healthy" if all_healthy else "degraded",
        "environment": settings.ENVIRONMENT,
        "api_version": "v1",
        "components": components,
    }
