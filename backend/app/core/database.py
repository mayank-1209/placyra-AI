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


# Qdrant Vector Client Singleton
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
