import logging
import re
from typing import Any, Dict, List, Set, Tuple
import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

logger = logging.getLogger(__name__)

STOP_WORDS: Set[str] = {
    "a", "an", "the", "in", "on", "of", "for", "to", "at", "by", "from",
    "with", "about", "into", "through", "during", "is", "are", "was", "were",
    "be", "been", "being", "have", "has", "had", "do", "does", "did", "can",
    "could", "will", "would", "should", "how", "what", "which", "who", "whom",
    "this", "that", "these", "those", "explain", "describe", "write", "code",
    "program", "solve", "problem", "question", "give", "example", "using"
}


def normalize_question_text(text: str) -> str:
    """Normalizes question text by stripping punctuation, extra spaces, and stopwords."""
    if not text:
        return ""
    # Lowercase & remove non-alphanumeric except basic symbols
    cleaned = re.sub(r"[^a-zA-Z0-9\s]", " ", text.lower())
    tokens = [tok for tok in cleaned.split() if tok not in STOP_WORDS and len(tok) > 1]
    return " ".join(tokens)


def compute_text_similarity(text_a: str, text_b: str) -> float:
    """Computes TF-IDF cosine similarity between two question texts."""
    norm_a = normalize_question_text(text_a)
    norm_b = normalize_question_text(text_b)

    if not norm_a or not norm_b:
        return 0.0

    if norm_a == norm_b:
        return 1.0

    try:
        vectorizer = TfidfVectorizer()
        tfidf_matrix = vectorizer.fit_transform([norm_a, norm_b])
        sim = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
        return float(sim)
    except Exception:
        # Fallback to Jaccard similarity over word tokens
        tokens_a = set(norm_a.split())
        tokens_b = set(norm_b.split())
        intersection = tokens_a.intersection(tokens_b)
        union = tokens_a.union(tokens_b)
        return len(intersection) / len(union) if union else 0.0


def deduplicate_question_batch(
    incoming_questions: List[Dict[str, Any]],
    existing_questions: List[Dict[str, Any]],
    similarity_threshold: float = 0.82
) -> Tuple[List[Dict[str, Any]], int, List[str]]:
    """
    Deduplicates a batch of uploaded questions against:
    1. Earlier items in the same upload batch (intra-batch deduplication)
    2. Already saved questions in MySQL (database deduplication)

    Returns:
    (unique_questions_to_add, duplicate_count, duplicate_details)
    """
    if not incoming_questions:
        return [], 0, []

    unique_to_add: List[Dict[str, Any]] = []
    duplicate_count = 0
    duplicate_details: List[str] = []

    # Prepare corpus of existing questions
    existing_pool: List[Dict[str, Any]] = list(existing_questions)

    for idx, item in enumerate(incoming_questions):
        raw_text = item.get("question_text", "").strip()
        if not raw_text:
            continue

        is_duplicate = False
        matched_reason = ""

        # Check against existing database pool + already approved from this batch
        for pool_item in existing_pool:
            pool_text = pool_item.get("question_text", "").strip()
            sim = compute_text_similarity(raw_text, pool_text)

            if sim >= similarity_threshold:
                is_duplicate = True
                matched_reason = (
                    f"'{raw_text[:50]}...' matches existing question '{pool_text[:50]}...' "
                    f"({int(sim * 100)}% similarity)"
                )
                break

        if is_duplicate:
            duplicate_count += 1
            duplicate_details.append(matched_reason)
        else:
            unique_to_add.append(item)
            # Add to the running pool so subsequent duplicates in the same batch get caught
            existing_pool.append(item)

    return unique_to_add, duplicate_count, duplicate_details
