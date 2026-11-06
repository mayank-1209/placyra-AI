import os
os.environ["TESTING"] = "1"

import pytest
from starlette.testclient import TestClient

from app.main import app
from app.core.security import get_password_hash, verify_password, create_access_token, decode_access_token
from app.services.dedup_service import normalize_question_text, compute_text_similarity, deduplicate_question_batch
from app.services.embedding_service import generate_deterministic_fallback_embedding, VECTOR_DIMENSION
from app.services.parser_service import extract_skills_regex, extract_contact_info, extract_cgpa_regex, calculate_baseline_readiness

client = TestClient(app)


def test_root_endpoint():
    """Verify root API returns online status and app name."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert "Placyra" in data["app"]


def test_health_endpoint():
    """Verify healthcheck endpoint returns healthy status."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["api_version"] == "v1"


def test_password_hashing():
    """Test bcrypt hashing and verification."""
    raw_pass = "SecureSecretPassword123"
    hashed = get_password_hash(raw_pass)
    assert hashed != raw_pass
    assert verify_password(raw_pass, hashed) is True
    assert verify_password("WrongPassword", hashed) is False


def test_jwt_token_lifecycle():
    """Test JWT creation, claim encoding, and decode verification."""
    token = create_access_token(
        subject="test_student@placyra.edu",
        role="student",
        user_id=42
    )
    assert isinstance(token, str)
    assert len(token) > 20

    claims = decode_access_token(token)
    assert claims is not None
    assert claims["sub"] == "test_student@placyra.edu"
    assert claims["role"] == "student"
    assert claims["id"] == 42


def test_question_deduplication():
    """Test normalization and cosine similarity thresholding."""
    q1 = "How do you detect and remove a cycle in a singly linked list using two pointers?"
    q2 = "Explain Floyd's cycle detection algorithm in a singly linked list with fast and slow pointers."
    q3 = "Design a scalable URL shortener like TinyURL with Redis cache and distributed database."

    # Normalized text checks
    norm1 = normalize_question_text(q1)
    assert "cycle" in norm1
    assert "linked" in norm1
    assert "pointers" in norm1

    # Similarity between q1 and q2 should be high (both about cycle detection in linked list)
    sim_1_2 = compute_text_similarity(q1, q2)
    assert sim_1_2 > 0.35

    # Similarity between q1 and q3 should be near zero (different topics)
    sim_1_3 = compute_text_similarity(q1, q3)
    assert sim_1_3 < 0.20

    # Test batch deduplication
    incoming = [
        {"question_text": q1, "topic": "DSA"},
        {"question_text": q1, "topic": "DSA"},  # Exact duplicate
        {"question_text": q3, "topic": "System Design"},
    ]
    unique, dup_count, details = deduplicate_question_batch(
        incoming_questions=incoming,
        existing_questions=[],
        similarity_threshold=0.85
    )
    assert len(unique) == 2
    assert dup_count == 1


def test_fallback_embeddings():
    """Verify deterministic 768-dimensional fallback embedding properties."""
    sample_text = "Data Structures, Algorithms, Dynamic Programming and Graph Theory"
    vec = generate_deterministic_fallback_embedding(sample_text)
    assert len(vec) == VECTOR_DIMENSION
    assert len(vec) == 768

    # Ensure deterministic output for identical input
    vec2 = generate_deterministic_fallback_embedding(sample_text)
    assert vec == vec2


def test_resume_regex_parsing():
    """Test resume parsing heuristics for skills, email, phone, and CGPA."""
    mock_resume = """
    Rahul Sharma
    Email: rahul.sharma@example.com | Phone: +91 98765 43210
    GitHub: https://github.com/rahulsharma | LinkedIn: https://linkedin.com/in/rahulsharma
    Education: B.Tech in Computer Science and Engineering, CGPA: 8.85 / 10
    Technical Skills: Python, Java, React, Docker, SQL, FastApi, Data Structures, Algorithms, AWS, Redis.
    Projects: Built an E-commerce microservice architecture with Redis caching.
    """

    skills = extract_skills_regex(mock_resume)
    assert "Python" in skills
    assert "Java" in skills
    assert "React" in skills
    assert "Docker" in skills
    assert "SQL" in skills

    contact = extract_contact_info(mock_resume)
    assert contact["email"] == "rahul.sharma@example.com"
    assert "98765" in contact["phone"]
    assert "github.com/rahulsharma" in contact["github"]

    cgpa = extract_cgpa_regex(mock_resume)
    assert cgpa == 8.85

    score = calculate_baseline_readiness(skills, cgpa, [1], [1])
    assert score >= 70.0
