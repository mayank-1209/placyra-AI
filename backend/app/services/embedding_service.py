import hashlib
import logging
from typing import List
import httpx
import numpy as np

from app.core.config import settings

logger = logging.getLogger(__name__)

VECTOR_DIMENSION = 768


def generate_deterministic_fallback_embedding(text: str, dimension: int = VECTOR_DIMENSION) -> List[float]:
    """
    Generates a deterministic, unit-normalized 768-dimensional embedding vector
    using SHA-256 seed when the Ollama server is offline or still downloading models.
    Ensures Qdrant indexing and semantic operations never crash during local setup.
    """
    cleaned = text.strip().lower()
    # Create deterministic seed from SHA-256 hash of text
    seed = int(hashlib.sha256(cleaned.encode("utf-8")).hexdigest()[:8], 16)
    rng = np.random.RandomState(seed)

    # Generate pseudo-vector and normalize to unit L2 norm
    vec = rng.randn(dimension).astype(np.float32)
    norm = np.linalg.norm(vec)
    if norm > 0:
        vec = vec / norm
    return vec.tolist()


async def generate_embedding(text: str) -> List[float]:
    """
    Calls local Ollama instance running 'nomic-embed-text' to obtain 768-d embedding.
    Falls back gracefully to deterministic pseudo-embedding if Ollama is unreachable.
    """
    if not text or not text.strip():
        return [0.0] * VECTOR_DIMENSION

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            # First attempt standard Ollama /api/embeddings
            response = await client.post(
                f"{settings.OLLAMA_BASE_URL}/api/embeddings",
                json={
                    "model": settings.OLLAMA_EMBED_MODEL,
                    "prompt": text,
                },
            )
            if response.status_code == 200:
                data = response.json()
                embedding = data.get("embedding")
                if embedding and len(embedding) == VECTOR_DIMENSION:
                    return embedding
                elif embedding and len(embedding) > 0:
                    # Pad or truncate to exact dimension if model differs
                    if len(embedding) < VECTOR_DIMENSION:
                        return embedding + [0.0] * (VECTOR_DIMENSION - len(embedding))
                    return embedding[:VECTOR_DIMENSION]
    except Exception as exc:
        logger.warning(
            "Ollama embedding service at %s unavailable (%s). Using deterministic fallback.",
            settings.OLLAMA_BASE_URL,
            exc,
        )

    return generate_deterministic_fallback_embedding(text, VECTOR_DIMENSION)


async def generate_embeddings_batch(texts: List[str]) -> List[List[float]]:
    """Generates embeddings for multiple texts sequentially or concurrently."""
    results = []
    for text in texts:
        emb = await generate_embedding(text)
        results.append(emb)
    return results
