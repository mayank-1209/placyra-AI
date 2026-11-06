import logging
from typing import Generator, Optional
from qdrant_client import QdrantClient
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from app.core.config import settings

logger = logging.getLogger(__name__)

# SQLAlchemy MySQL 8.0 Engine & Session
engine = create_engine(
    settings.SQLALCHEMY_DATABASE_URI,
    pool_pre_ping=True,
    pool_recycle=3600,
    pool_size=10,
    max_overflow=20,
    connect_args={"connect_timeout": 2},
    echo=False,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db() -> Generator:
    """FastAPI dependency for yielding database session with automatic cleanup."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def check_component_health() -> dict:
    """
    Performs non-blocking diagnostics across MySQL 8.0, Qdrant, and Ollama.
    Never throws unhandled exceptions during health checks.
    """
    health_status = {
        "mysql": {"status": "offline", "details": None},
        "qdrant": {"status": "offline", "details": None},
        "ollama": {"status": "offline", "details": None},
    }

    # 1. Test MySQL 8.0
    try:
        with engine.connect() as conn:
            from sqlalchemy import text
            conn.execute(text("SELECT 1"))
            health_status["mysql"]["status"] = "online"
            health_status["mysql"]["details"] = f"{settings.MYSQL_HOST}:{settings.MYSQL_PORT}/{settings.MYSQL_DATABASE}"
    except Exception as exc:
        health_status["mysql"]["details"] = str(exc)[:120]

    # 2. Test Qdrant Vector Engine
    try:
        q_client = get_qdrant_client()
        if q_client:
            colls = q_client.get_collections()
            health_status["qdrant"]["status"] = "online"
            health_status["qdrant"]["details"] = f"{len(colls.collections)} collections initialized"
        else:
            health_status["qdrant"]["details"] = "Could not initialize Qdrant client"
    except Exception as exc:
        health_status["qdrant"]["details"] = str(exc)[:120]

    # 3. Test Ollama Server
    try:
        import httpx
        with httpx.Client(timeout=1.5) as client:
            resp = client.get(f"{settings.OLLAMA_BASE_URL}/api/tags")
            if resp.status_code == 200:
                health_status["ollama"]["status"] = "online"
                models = [m.get("name") for m in resp.json().get("models", [])]
                health_status["ollama"]["details"] = f"Models available: {models[:3]}"
            else:
                health_status["ollama"]["details"] = f"HTTP {resp.status_code}"
    except Exception as exc:
        health_status["ollama"]["details"] = f"Offline (fallback active): {str(exc)[:60]}"

    return health_status


_qdrant_client: Optional[QdrantClient] = None


def get_qdrant_client() -> Optional[QdrantClient]:
    """Returns connected Qdrant client or None if vector database is unavailable."""
    global _qdrant_client
    if _qdrant_client is not None:
        return _qdrant_client

    try:
        client = QdrantClient(
            host=settings.QDRANT_HOST,
            port=settings.QDRANT_PORT,
            api_key=settings.QDRANT_API_KEY if settings.QDRANT_API_KEY else None,
            timeout=5.0,
        )
        # Test connection
        client.get_collections()
        _qdrant_client = client
        logger.info("Connected to Qdrant vector database at %s:%s", settings.QDRANT_HOST, settings.QDRANT_PORT)
        return _qdrant_client
    except Exception as exc:
        logger.warning(
            "Qdrant vector database not reachable at %s:%s (%s). Falling back gracefully.",
            settings.QDRANT_HOST,
            settings.QDRANT_PORT,
            exc,
        )
        return None
