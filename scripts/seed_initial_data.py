#!/usr/bin/env python3
"""
Placyra Database & Vector Store Initial Data Seeder
Populates initial roles, admin/student/alumni accounts, companies,
and indexes approved questions into Qdrant vector database.
"""
import asyncio
import os
import sys

# Ensure backend root is on sys.path
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, ".."))
BACKEND_DIR = os.path.join(PROJECT_ROOT, "backend")
sys.path.insert(0, BACKEND_DIR)

from app.core.database import SessionLocal, engine, Base
from app.core.security import get_password_hash
from app.models.company import Company
from app.models.question import Question, QuestionDifficulty, ModerationStatus
from app.models.user import User, UserRole
from app.services.embedding_service import generate_embedding
from app.services.qdrant_service import initialize_qdrant_collections, index_question_vector


INITIAL_USERS = [
    {
        "email": "admin@placyra.edu",
        "password": "admin123",
        "full_name": "Prof. Sarah Jenkins (T&P Head)",
        "role": UserRole.TNP_ADMIN,
        "branch": "Training & Placement Cell",
        "cgpa": 9.8,
        "graduation_year": 2012,
    },
    {
        "email": "student@placyra.edu",
        "password": "student123",
        "full_name": "Rahul Sharma",
        "role": UserRole.STUDENT,
        "branch": "Computer Science and Engineering",
        "cgpa": 8.75,
        "graduation_year": 2026,
    },
    {
        "email": "alumni@placyra.edu",
        "password": "alumni123",
        "full_name": "Ananya Patel (SWE at Google)",
        "role": UserRole.ALUMNI,
        "branch": "Information Technology",
        "cgpa": 9.20,
        "graduation_year": 2023,
    },
]

INITIAL_COMPANIES = [
    {
        "name": "Google",
        "industry": "Technology & Cloud",
        "description": "Global leader in search, distributed systems, Android, and AI.",
        "website": "https://careers.google.com",
        "min_cgpa": 8.0,
        "eligible_branches": ["Computer Science and Engineering", "Information Technology", "Electronics"],
        "required_skills": ["Data Structures", "Algorithms", "System Design", "C++", "Python", "Distributed Systems", "Operating Systems"],
        "hiring_workflow": ["Online Coding Assessment", "Technical Round 1 (DSA)", "Technical Round 2 (System Design)", "Googliness & Leadership"],
    },
    {
        "name": "Microsoft",
        "industry": "Enterprise Software & Cloud",
        "description": "World leader in Azure cloud, enterprise software, and operating systems.",
        "website": "https://careers.microsoft.com",
        "min_cgpa": 7.5,
        "eligible_branches": ["Computer Science and Engineering", "Information Technology", "Electrical"],
        "required_skills": ["Data Structures", "C#", "Java", "React", "Azure", "OOP Principles", "SQL", "REST APIs"],
        "hiring_workflow": ["Online Assessment", "Technical Round 1 (Problem Solving)", "Technical Round 2 (System Architecture)", "HR & Culture"],
    },
    {
        "name": "Amazon",
        "industry": "E-Commerce & Cloud (AWS)",
        "description": "Global leader in high-scale e-commerce, cloud infrastructure, and logistics.",
        "website": "https://amazon.jobs",
        "min_cgpa": 7.5,
        "eligible_branches": ["Computer Science and Engineering", "Information Technology", "Electronics"],
        "required_skills": ["Java", "Algorithms", "Data Structures", "System Design", "Leadership Principles", "AWS", "Multithreading"],
        "hiring_workflow": ["Online Assessment (OA1 & OA2)", "Technical Round 1 (DSA)", "Technical Round 2 (System Design)", "Bar Raiser"],
    },
    {
        "name": "Infosys",
        "industry": "IT Services & Consulting",
        "description": "Next-generation digital services and consulting leader.",
        "website": "https://infosys.com/careers",
        "min_cgpa": 6.5,
        "eligible_branches": ["All Branches"],
        "required_skills": ["Python", "Java", "SQL", "OOP", "HTML/CSS/JavaScript", "Problem Solving"],
        "hiring_workflow": ["Online Aptitude & Coding Test", "Technical Interview", "HR Interview"],
    },
]

INITIAL_QUESTIONS = [
    {
        "company_name": "Google",
        "role_title": "Software Engineer",
        "round_type": "Technical Interview 1 (DSA)",
        "difficulty": QuestionDifficulty.HARD,
        "topic": "Data Structures",
        "question_text": "Given an unsorted integer array nums, return the smallest missing positive integer in O(n) time and O(1) auxiliary space.",
        "answer_guidelines": "Cycle sort placing value x at index x-1. Check edge cases with negative values and zeroes.",
    },
    {
        "company_name": "Google",
        "role_title": "Software Engineer",
        "round_type": "Technical Interview 2 (System Design)",
        "difficulty": QuestionDifficulty.HARD,
        "topic": "System Design",
        "question_text": "Design a globally scalable URL Shortener service like TinyURL. Address Base62 hashing, database schema, rate limiting, and Redis caching.",
        "answer_guidelines": "Cover write vs read ratios (1:100), key generation service vs hash collision resolution, multi-region replication.",
    },
    {
        "company_name": "Microsoft",
        "role_title": "Software Engineer",
        "round_type": "Technical Round 1 (Problem Solving)",
        "difficulty": QuestionDifficulty.MEDIUM,
        "topic": "Algorithms",
        "question_text": "Explain how you would find the Longest Substring Without Repeating Characters in a given string. What is the optimal time and space complexity?",
        "answer_guidelines": "Sliding window technique with hash map storing character positions. Time O(N), Space O(min(N, M)).",
    },
    {
        "company_name": "Microsoft",
        "role_title": "Full Stack Developer",
        "round_type": "Technical Round 2 (System Architecture)",
        "difficulty": QuestionDifficulty.MEDIUM,
        "topic": "Database Management",
        "question_text": "Compare SQL vs NoSQL databases in the context of an e-commerce platform. When would you choose PostgreSQL over MongoDB, and vice versa?",
        "answer_guidelines": "ACID compliance for orders/payments vs flexible document schemas for diverse product catalogs.",
    },
    {
        "company_name": "Amazon",
        "role_title": "SDE-1",
        "round_type": "Technical Round 1 (Data Structures)",
        "difficulty": QuestionDifficulty.MEDIUM,
        "topic": "Data Structures",
        "question_text": "How do you detect and remove a cycle in a singly linked list? State Floyd’s Cycle-Finding Algorithm and explain why it works.",
        "answer_guidelines": "Fast and slow pointers meeting at distance k. Reset slow to head, advance by 1 until they meet at cycle origin.",
    },
    {
        "company_name": "Amazon",
        "role_title": "SDE-1",
        "round_type": "Bar Raiser Round",
        "difficulty": QuestionDifficulty.MEDIUM,
        "topic": "Behavioral",
        "question_text": "Tell me about a time you had a technical disagreement with a team member or professor. How did you resolve it?",
        "answer_guidelines": "Use STAR method highlighting Amazon Leadership Principles: Disagree and Commit, Customer Obsession.",
    },
    {
        "company_name": "Infosys",
        "role_title": "Specialist Programmer",
        "round_type": "Technical Interview",
        "difficulty": QuestionDifficulty.EASY,
        "topic": "Object Oriented Programming",
        "question_text": "What are the 4 main pillars of OOP? Provide real-world code examples illustrating Polymorphism and Encapsulation.",
        "answer_guidelines": "Encapsulation, Abstraction, Inheritance, Polymorphism. Explain method overloading vs overriding.",
    },
]


async def seed_data():
    print("==================================================")
    print("Placyra: Database & Vector Store Initial Seeder")
    print("==================================================")

    # 1. Initialize Tables
    try:
        Base.metadata.create_all(bind=engine)
        print("[✓] MySQL tables verified.")
    except Exception as e:
        print(f"[!] MySQL table creation warning: {e}")

    # 2. Initialize Qdrant Collections
    initialize_qdrant_collections()
    print("[✓] Qdrant vector collections initialized.")

    db = SessionLocal()
    try:
        # 3. Seed Users
        admin_user = None
        for u_data in INITIAL_USERS:
            existing = db.query(User).filter(User.email == u_data["email"]).first()
            if not existing:
                u = User(
                    email=u_data["email"],
                    hashed_password=get_password_hash(u_data["password"]),
                    full_name=u_data["full_name"],
                    role=u_data["role"],
                    branch=u_data.get("branch"),
                    cgpa=u_data.get("cgpa"),
                    graduation_year=u_data.get("graduation_year"),
                )
                db.add(u)
                db.commit()
                db.refresh(u)
                print(f"[+] Created user: {u.email} ({u.role.value})")
                if u.role == UserRole.TNP_ADMIN:
                    admin_user = u
            else:
                if existing.role == UserRole.TNP_ADMIN:
                    admin_user = existing
                print(f"[-] User already exists: {u_data['email']}")

        admin_id = admin_user.id if admin_user else 1

        # 4. Seed Companies
        company_map = {}
        for c_data in INITIAL_COMPANIES:
            existing_comp = db.query(Company).filter(Company.name == c_data["name"]).first()
            if not existing_comp:
                comp = Company(
                    name=c_data["name"],
                    industry=c_data["industry"],
                    description=c_data["description"],
                    website=c_data["website"],
                    min_cgpa=c_data["min_cgpa"],
                    eligible_branches=c_data["eligible_branches"],
                    required_skills=c_data["required_skills"],
                    hiring_workflow=c_data["hiring_workflow"],
                )
                db.add(comp)
                db.commit()
                db.refresh(comp)
                company_map[comp.name] = comp.id
                print(f"[+] Created company: {comp.name}")
            else:
                company_map[existing_comp.name] = existing_comp.id
                print(f"[-] Company already exists: {c_data['name']}")

        # 5. Seed Questions & Index into Qdrant
        for q_data in INITIAL_QUESTIONS:
            comp_id = company_map.get(q_data["company_name"])
            existing_q = db.query(Question).filter(Question.question_text == q_data["question_text"]).first()
            if not existing_q:
                q = Question(
                    company_id=comp_id,
                    role_title=q_data["role_title"],
                    round_type=q_data["round_type"],
                    difficulty=q_data["difficulty"],
                    topic=q_data["topic"],
                    question_text=q_data["question_text"],
                    answer_guidelines=q_data["answer_guidelines"],
                    submitted_by=admin_id,
                    moderation_status=ModerationStatus.APPROVED,
                )
                db.add(q)
                db.commit()
                db.refresh(q)

                # Generate 768-d embedding and index in Qdrant
                try:
                    emb = await generate_embedding(q.question_text)
                    pt_id = index_question_vector(
                        question_id=q.id,
                        vector=emb,
                        payload={
                            "company_id": comp_id,
                            "topic": q.topic,
                            "difficulty": q.difficulty.value,
                            "question_text": q.question_text,
                        },
                    )
                    if pt_id:
                        q.qdrant_point_id = pt_id
                        db.commit()
                except Exception as qdr_err:
                    print(f"[!] Qdrant indexing deferred: {qdr_err}")

                print(f"[+] Seeded question for {q_data['company_name']}: {q.topic}")
            else:
                print(f"[-] Question already exists: {q_data['question_text'][:40]}...")

        print("==================================================")
        print("Initial Data Seeding Completed Successfully!")
        print("==================================================")
    finally:
        db.close()


if __name__ == "__main__":
    asyncio.run(seed_data())
