import json
import logging
from typing import Any, Dict, List
import httpx
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.company import Company
from app.models.interview import SkillGapReport
from app.models.resume import Resume
from app.utils.prompts import SKILL_GAP_ANALYSIS_SYSTEM_PROMPT

logger = logging.getLogger(__name__)


async def perform_skill_gap_analysis(
    db: Session,
    user_id: int,
    company_id: int
) -> Dict[str, Any]:
    """
    Analyzes gap between student's resume profile and target company requirements.
    Generates radar data for Recharts, matched vs missing skills, and action plan.
    """
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise ValueError(f"Company with id {company_id} does not exist")

    resume = (
        db.query(Resume)
        .filter(Resume.user_id == user_id)
        .order_by(Resume.created_at.desc())
        .first()
    )

    student_skills: List[str] = []
    student_projects: List[Any] = []
    student_cgpa = None

    if resume and resume.parsed_data:
        student_skills = [s.strip() for s in resume.parsed_data.get("skills", [])]
        student_projects = resume.parsed_data.get("projects", [])
        student_cgpa = resume.parsed_data.get("cgpa")

    # Match skills case-insensitively
    required_skills = company.required_skills or []
    req_lower = {s.lower(): s for s in required_skills}
    stud_lower = {s.lower(): s for s in student_skills}

    matched_keys = set(req_lower.keys()).intersection(set(stud_lower.keys()))
    missing_keys = set(req_lower.keys()) - set(stud_lower.keys())

    matched_skills = [req_lower[k] for k in sorted(list(matched_keys))]
    missing_skills = [req_lower[k] for k in sorted(list(missing_keys))]

    total_req = len(required_skills) if required_skills else 1
    match_ratio = len(matched_skills) / total_req
    match_score = round(match_ratio * 100, 1)

    # Calculate 5 Radar Metrics for Recharts
    # 1. DSA & Problem Solving
    dsa_keywords = {"data structures", "algorithms", "dsa", "c++", "java", "python"}
    dsa_student = min(85.0, 40.0 + len(set(stud_lower.keys()).intersection(dsa_keywords)) * 15.0)

    # 2. System Design & Architecture
    sys_keywords = {"system design", "distributed systems", "redis", "kafka", "microservices", "docker"}
    sys_student = min(90.0, 30.0 + len(set(stud_lower.keys()).intersection(sys_keywords)) * 18.0)

    # 3. Core CS (OS/DBMS/CN)
    core_keywords = {"operating systems", "dbms", "sql", "mysql", "computer networks", "oop"}
    core_student = min(95.0, 45.0 + len(set(stud_lower.keys()).intersection(core_keywords)) * 14.0)

    # 4. Domain Tech Stack
    domain_student = match_score

    # 5. Project Depth & Scale
    proj_student = min(90.0, 35.0 + len(student_projects) * 15.0)

    radar_data = [
        {"subject": "DSA & Problem Solving", "student": round(dsa_student, 1), "required": 85.0, "fullMark": 100.0},
        {"subject": "System Design", "student": round(sys_student, 1), "required": 75.0, "fullMark": 100.0},
        {"subject": "Core CS Concepts", "student": round(core_student, 1), "required": 80.0, "fullMark": 100.0},
        {"subject": "Domain Tech Stack", "student": round(domain_student, 1), "required": 90.0, "fullMark": 100.0},
        {"subject": "Project Depth", "student": round(proj_student, 1), "required": 80.0, "fullMark": 100.0},
    ]

    action_plan = [
        f"Master the {len(missing_skills)} missing skills: {', '.join(missing_skills[:3]) if missing_skills else 'Practice advanced system design'}",
        f"Review company interview rounds for {company.name}: {', '.join(company.hiring_workflow or ['Technical Interview', 'HR'])}",
        "Practice high-frequency DSA questions from the Placyra Question Bank",
        "Conduct at least 2 AI Mock Interview sessions on target role topics",
    ]

    suggestions = (
        f"For {company.name}, you have a {match_score}% direct skill match. "
        f"You possess key capabilities in {', '.join(matched_skills[:4]) if matched_skills else 'programming foundations'}. "
        f"Prioritize building proficiency in {', '.join(missing_skills[:3]) if missing_skills else 'mock interview practice'} "
        "to maximize your selection probability during campus placement drives."
    )

    recommended_topics = missing_skills + ["Object Oriented Design", "Scalability Trade-offs", "Concurrency"]

    # Attempt LLM Enrichment via Ollama
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            prompt = (
                f"{SKILL_GAP_ANALYSIS_SYSTEM_PROMPT}\n\n"
                f"Target Company: {company.name}\n"
                f"Company Required Skills: {company.required_skills}\n"
                f"Student Skills: {student_skills}\n"
                f"Student CGPA: {student_cgpa}\n"
            )
            resp = await client.post(
                f"{settings.OLLAMA_BASE_URL}/api/generate",
                json={
                    "model": settings.OLLAMA_LLM_MODEL,
                    "prompt": prompt,
                    "stream": False,
                    "format": "json",
                },
            )
            if resp.status_code == 200:
                raw_json = resp.json().get("response", "{}")
                data = json.loads(raw_json)
                if "suggestions" in data and "action_plan" in data:
                    suggestions = data.get("suggestions", suggestions)
                    action_plan = data.get("action_plan", action_plan)
                    if "recommended_topics" in data:
                        recommended_topics = data.get("recommended_topics", recommended_topics)
    except Exception as exc:
        logger.info("Ollama gap analysis LLM enrichment skipped: %s", exc)

    # Persist or update report in DB
    existing_report = (
        db.query(SkillGapReport)
        .filter(SkillGapReport.user_id == user_id, SkillGapReport.company_id == company_id)
        .first()
    )
    if existing_report:
        existing_report.match_score = match_score
        existing_report.matched_skills = matched_skills
        existing_report.missing_skills = missing_skills
        existing_report.recommended_topics = recommended_topics
        existing_report.suggestions = suggestions
    else:
        new_report = SkillGapReport(
            user_id=user_id,
            company_id=company_id,
            match_score=match_score,
            matched_skills=matched_skills,
            missing_skills=missing_skills,
            recommended_topics=recommended_topics,
            suggestions=suggestions,
        )
        db.add(new_report)

    db.commit()

    return {
        "company_id": company.id,
        "company_name": company.name,
        "target_role": "Software Engineering Candidate",
        "match_score": match_score,
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
        "recommended_topics": recommended_topics,
        "radar_data": radar_data,
        "action_plan": action_plan,
        "suggestions": suggestions,
    }
