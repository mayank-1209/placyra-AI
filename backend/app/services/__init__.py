"""
Placyra Core Business Logic & AI Services
"""
from app.services.ocr_service import extract_text_from_document
from app.services.parser_service import parse_resume_content
from app.services.dedup_service import deduplicate_question_batch, compute_text_similarity
from app.services.embedding_service import generate_embedding, generate_embeddings_batch
from app.services.qdrant_service import (
    initialize_qdrant_collections,
    index_question_vector,
    search_similar_questions,
    index_resume_vector,
)
from app.services.rag_service import (
    generate_adaptive_interview_question,
    evaluate_interview_answer,
    generate_interview_final_report,
)
from app.services.gap_analysis_service import perform_skill_gap_analysis

__all__ = [
    "extract_text_from_document",
    "parse_resume_content",
    "deduplicate_question_batch",
    "compute_text_similarity",
    "generate_embedding",
    "generate_embeddings_batch",
    "initialize_qdrant_collections",
    "index_question_vector",
    "search_similar_questions",
    "index_resume_vector",
    "generate_adaptive_interview_question",
    "evaluate_interview_answer",
    "generate_interview_final_report",
    "perform_skill_gap_analysis",
]
