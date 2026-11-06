import logging
import uuid
from typing import Any, Dict, List, Optional
from qdrant_client.http import models as qmodels

from app.core.config import settings
from app.core.database import get_qdrant_client

logger = logging.getLogger(__name__)


def initialize_qdrant_collections() -> bool:
    """
    Initializes Qdrant HNSW vector collections for questions and student resumes.
    Runs during application lifespan startup.
    """
    client = get_qdrant_client()
    if not client:
        logger.warning("Skipping Qdrant collection initialization (vector DB unreachable).")
        return False

    collections_to_init = [
        settings.QDRANT_COLLECTION_QUESTIONS,
        settings.QDRANT_COLLECTION_RESUMES,
    ]

    try:
        existing_collections = {c.name for c in client.get_collections().collections}

        for coll_name in collections_to_init:
            if coll_name not in existing_collections:
                client.create_collection(
                    collection_name=coll_name,
                    vectors_config=qmodels.VectorParams(
                        size=settings.QDRANT_VECTOR_SIZE,
                        distance=qmodels.Distance.COSINE,
                    ),
                    hnsw_config=qmodels.HnswConfigDiff(
                        m=16,
                        ef_construct=100,
                        full_scan_threshold=1000,
                    ),
                )
                logger.info("Successfully created Qdrant collection '%s'", coll_name)
            else:
                logger.info("Qdrant collection '%s' already exists", coll_name)

        return True
    except Exception as exc:
        logger.error("Failed to initialize Qdrant collections: %s", exc)
        return False


def index_question_vector(
    question_id: int,
    vector: List[float],
    payload: Dict[str, Any]
) -> Optional[str]:
    """
    Upserts a placement question vector into the company_questions collection.
    Returns point UUID.
    """
    client = get_qdrant_client()
    if not client:
        return None

    try:
        point_id = str(uuid.uuid4())
        payload_data = dict(payload)
        payload_data["question_id"] = question_id

        client.upsert(
            collection_name=settings.QDRANT_COLLECTION_QUESTIONS,
            points=[
                qmodels.PointStruct(
                    id=point_id,
                    vector=vector,
                    payload=payload_data,
                )
            ],
        )
        return point_id
    except Exception as exc:
        logger.error("Failed to index question %d in Qdrant: %s", question_id, exc)
        return None


def index_resume_vector(
    resume_id: int,
    vector: List[float],
    payload: Dict[str, Any]
) -> Optional[str]:
    """Upserts student resume profile vector into student_resumes collection."""
    client = get_qdrant_client()
    if not client:
        return None

    try:
        point_id = str(uuid.uuid4())
        payload_data = dict(payload)
        payload_data["resume_id"] = resume_id

        client.upsert(
            collection_name=settings.QDRANT_COLLECTION_RESUMES,
            points=[
                qmodels.PointStruct(
                    id=point_id,
                    vector=vector,
                    payload=payload_data,
                )
            ],
        )
        return point_id
    except Exception as exc:
        logger.error("Failed to index resume %d in Qdrant: %s", resume_id, exc)
        return None


def search_similar_questions(
    query_vector: List[float],
    company_id: Optional[int] = None,
    topic: Optional[str] = None,
    limit: int = 5
) -> List[Dict[str, Any]]:
    """
    Performs HNSW cosine similarity search over company_questions with optional
    metadata filtering by company_id and topic.
    """
    client = get_qdrant_client()
    if not client:
        return []

    try:
        must_filters = []
        if company_id is not None:
            must_filters.append(
                qmodels.FieldCondition(
                    key="company_id",
                    match=qmodels.MatchValue(value=company_id),
                )
            )
        if topic:
            must_filters.append(
                qmodels.FieldCondition(
                    key="topic",
                    match=qmodels.MatchValue(value=topic),
                )
            )

        query_filter = qmodels.Filter(must=must_filters) if must_filters else None

        search_result = client.search(
            collection_name=settings.QDRANT_COLLECTION_QUESTIONS,
            query_vector=query_vector,
            query_filter=query_filter,
            limit=limit,
        )

        results = []
        for hit in search_result:
            results.append({
                "point_id": hit.id,
                "score": hit.score,
                "payload": hit.payload or {},
            })
        return results
    except Exception as exc:
        logger.warning("Qdrant semantic search failed: %s", exc)
        return []
