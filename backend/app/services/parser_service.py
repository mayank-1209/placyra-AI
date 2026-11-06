import json
import logging
import re
from typing import Any, Dict, List, Optional
import httpx

from app.core.config import settings
from app.utils.prompts import RESUME_PARSER_SYSTEM_PROMPT

logger = logging.getLogger(__name__)

# Curated campus placement skill dictionary for deterministic regex extraction
TECH_SKILL_KEYWORDS = [
    # Programming Languages
    "Python", "Java", "C++", "C", "C#", "Go", "Golang", "Rust", "JavaScript", "TypeScript",
    "Kotlin", "Swift", "PHP", "Ruby", "R", "Dart", "Scala",
    # Web & Frameworks
    "React", "React.js", "Node.js", "Express", "Next.js", "Vue.js", "Angular", "Django",
    "FastAPI", "Flask", "Spring Boot", "ASP.NET", "Tailwind CSS", "Bootstrap", "HTML5", "CSS3",
    # Data Structures & Core CS
    "Data Structures", "Algorithms", "DSA", "OOP", "Object Oriented Programming",
    "System Design", "Operating Systems", "DBMS", "Computer Networks", "Distributed Systems",
    # Databases & Caching
    "SQL", "MySQL", "PostgreSQL", "MongoDB", "Redis", "Cassandra", "DynamoDB", "SQLite",
    "Elasticsearch", "Neo4j", "Qdrant",
    # Cloud, DevOps & Tools
    "Docker", "Kubernetes", "AWS", "Azure", "GCP", "Linux", "Git", "GitHub", "CI/CD",
    "Terraform", "Kafka", "RabbitMQ", "GraphQL", "REST APIs", "Microservices",
    # AI / ML / Data Science
    "Machine Learning", "Deep Learning", "TensorFlow", "PyTorch", "Scikit-Learn", "NLP",
    "Computer Vision", "Pandas", "NumPy", "OpenCV", "Large Language Models", "LLMs", "RAG"
]


def extract_skills_regex(text: str) -> List[str]:
    """Finds matching technical skills from text using boundary-safe regex."""
    found_skills = set()
    text_lower = text.lower()

    for skill in TECH_SKILL_KEYWORDS:
        # Match exact word or symbol like C++
        escaped = re.escape(skill)
        pattern = rf"(?:\b|_){escaped}(?:\b|_)" if not skill.endswith("+") else rf"(?:\b|_){escaped}"
        if re.search(pattern, text, re.IGNORECASE):
            found_skills.add(skill)

    return sorted(list(found_skills))


def extract_contact_info(text: str) -> Dict[str, Any]:
    """Extracts email, phone, github, and linkedin from text."""
    contact: Dict[str, Any] = {
        "email": None,
        "phone": None,
        "github": None,
        "linkedin": None,
    }

    # Email
    email_match = re.search(r"[\w\.-]+@[\w\.-]+\.\w+", text)
    if email_match:
        contact["email"] = email_match.group(0)

    # Phone (handles Indian 10-digit/5+5 formats with +91/0 and international numbers)
    phone_match = re.search(
        r"(?:(?:\+?91|0)?[-.\s]?[6-9]\d{4}[-.\s]?\d{5})|(?:(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})",
        text
    )
    if phone_match:
        contact["phone"] = phone_match.group(0).strip()

    # GitHub
    github_match = re.search(r"(?:https?://)?(?:www\.)?github\.com/([A-Za-z0-9_-]+)", text, re.IGNORECASE)
    if github_match:
        contact["github"] = f"https://github.com/{github_match.group(1)}"

    # LinkedIn
    linkedin_match = re.search(r"(?:https?://)?(?:www\.)?linkedin\.com/in/([A-Za-z0-9_-]+)", text, re.IGNORECASE)
    if linkedin_match:
        contact["linkedin"] = f"https://linkedin.com/in/{linkedin_match.group(1)}"

    return contact


def extract_cgpa_regex(text: str) -> Optional[float]:
    """Extracts CGPA / GPA scores like 'CGPA: 8.75', '8.5 / 10', 'GPA: 3.8'."""
    patterns = [
        r"(?:cgpa|gpa|grade point|pointer)[\s:]*([0-9]\.[0-9]{1,2})",
        r"([0-9]\.[0-9]{1,2})\s*(?:/|\s+out\s+of\s+)\s*(?:10(?:\.0)?|4(?:\.0)?)",
        r"cgpa[\s:]*([0-9]{1,2})%",
    ]
    for pat in patterns:
        match = re.search(pat, text, re.IGNORECASE)
        if match:
            try:
                val = float(match.group(1))
                if val <= 10.0:
                    return val
                elif val <= 100.0:
                    return round(val / 9.5, 2)  # Conversion for Indian percentage to 10-scale
            except ValueError:
                continue
    return None


def extract_sections_heuristic(text: str) -> Dict[str, Any]:
    """Heuristic extraction of education, projects, and experience blocks."""
    lines = [line.strip() for line in text.splitlines() if line.strip()]

    projects: List[Dict[str, Any]] = []
    experience: List[Dict[str, Any]] = []
    education: List[Dict[str, Any]] = []

    current_section = None
    for line in lines:
        line_lower = line.lower()
        if any(h in line_lower for h in ["education", "academic qualification", "degrees"]):
            current_section = "education"
            continue
        elif any(h in line_lower for h in ["projects", "personal projects", "academic projects"]):
            current_section = "projects"
            continue
        elif any(h in line_lower for h in ["experience", "internship", "work history", "employment"]):
            current_section = "experience"
            continue
        elif any(h in line_lower for h in ["skills", "certifications", "achievements"]):
            current_section = None
            continue

        if current_section == "education" and len(line) > 5:
            if any(deg in line_lower for deg in ["b.tech", "b.e", "m.tech", "bachelor", "master", "high school", "diploma"]):
                education.append({"degree": line, "institution": "Campus/University", "year": "2022-2026"})
        elif current_section == "projects" and len(line) > 10:
            if not line.startswith("-") and not line.startswith("•"):
                projects.append({"title": line[:60], "technologies": [], "description": line})
        elif current_section == "experience" and len(line) > 10:
            if any(kw in line_lower for kw in ["intern", "engineer", "developer", "lead", "assistant"]):
                experience.append({"role": line[:60], "company": "Tech Organization", "duration": "3 months", "highlights": [line]})

    return {
        "education": education[:4],
        "projects": projects[:5],
        "experience": experience[:4],
    }


def calculate_baseline_readiness(
    skills: List[str],
    cgpa: Optional[float],
    projects: List[Any],
    experience: List[Any]
) -> float:
    """Calculates a baseline placement readiness score out of 100."""
    score = 30.0  # Base score for having an uploaded valid resume

    # Skills contribution (up to 30 pts)
    score += min(len(skills) * 3.0, 30.0)

    # CGPA contribution (up to 20 pts)
    if cgpa:
        if cgpa >= 8.5:
            score += 20.0
        elif cgpa >= 7.5:
            score += 15.0
        elif cgpa >= 6.5:
            score += 10.0
        else:
            score += 5.0
    else:
        score += 12.0

    # Projects contribution (up to 12 pts)
    score += min(len(projects) * 4.0, 12.0)

    # Experience / Internships contribution (up to 8 pts)
    score += min(len(experience) * 4.0, 8.0)

    return round(min(score, 100.0), 1)


async def parse_resume_content(raw_text: str) -> Dict[str, Any]:
    """
    Hybrid resume parser:
    1. Extracts regex-based structured entities (deterministic, instant).
    2. Attempts local Ollama LLM enrichment if available.
    3. Merges and scores readiness.
    """
    regex_skills = extract_skills_regex(raw_text)
    regex_contact = extract_contact_info(raw_text)
    regex_cgpa = extract_cgpa_regex(raw_text)
    heuristic_sections = extract_sections_heuristic(raw_text)

    parsed_result: Dict[str, Any] = {
        "skills": regex_skills,
        "contact": regex_contact,
        "cgpa": regex_cgpa,
        "projects": heuristic_sections["projects"],
        "experience": heuristic_sections["experience"],
        "education": heuristic_sections["education"],
    }

    # Attempt LLM Enrichment via Ollama
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            prompt = f"{RESUME_PARSER_SYSTEM_PROMPT}\n\nCandidate Resume Raw Text:\n{raw_text[:4000]}"
            response = await client.post(
                f"{settings.OLLAMA_BASE_URL}/api/generate",
                json={
                    "model": settings.OLLAMA_LLM_MODEL,
                    "prompt": prompt,
                    "stream": False,
                    "format": "json",
                },
            )
            if response.status_code == 200:
                data = response.json()
                llm_response_text = data.get("response", "{}")
                llm_json = json.loads(llm_response_text)

                # Merge LLM skills with regex skills
                llm_skills = llm_json.get("skills", [])
                if isinstance(llm_skills, list) and len(llm_skills) > 0:
                    combined_skills = set(parsed_result["skills"]) | {s.strip() for s in llm_skills if isinstance(s, str)}
                    parsed_result["skills"] = sorted(list(combined_skills))

                # If LLM detected projects with descriptions, prefer LLM
                llm_projects = llm_json.get("projects")
                if isinstance(llm_projects, list) and len(llm_projects) > 0:
                    parsed_result["projects"] = llm_projects

                # If LLM detected experience, prefer LLM
                llm_exp = llm_json.get("experience")
                if isinstance(llm_exp, list) and len(llm_exp) > 0:
                    parsed_result["experience"] = llm_exp

                # If LLM detected education, prefer LLM
                llm_edu = llm_json.get("education")
                if isinstance(llm_edu, list) and len(llm_edu) > 0:
                    parsed_result["education"] = llm_edu

                if not parsed_result["cgpa"] and llm_json.get("cgpa"):
                    try:
                        parsed_result["cgpa"] = float(llm_json.get("cgpa"))
                    except (ValueError, TypeError):
                        pass
    except Exception as llm_err:
        logger.info("Ollama LLM enrichment skipped (Ollama offline or model loading): %s", llm_err)

    # Compute placement readiness score
    readiness = calculate_baseline_readiness(
        parsed_result["skills"],
        parsed_result["cgpa"],
        parsed_result["projects"],
        parsed_result["experience"]
    )
    parsed_result["readiness_score"] = readiness

    return parsed_result
