-- ==============================================================================
-- PLACYRA: Initial MySQL 8.0 Database Schema & Comprehensive Seed Data
-- ==============================================================================

CREATE DATABASE IF NOT EXISTS placyra_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE placyra_db;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role ENUM('student', 'tnp_admin', 'alumni') NOT NULL DEFAULT 'student',
    branch VARCHAR(100) NULL,
    cgpa DECIMAL(4,2) NULL,
    graduation_year INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_role (role),
    INDEX idx_user_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Companies & Job Descriptions Table
CREATE TABLE IF NOT EXISTS companies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    industry VARCHAR(150) NULL,
    description TEXT NULL,
    website VARCHAR(255) NULL,
    min_cgpa DECIMAL(4,2) DEFAULT 0.00,
    eligible_branches JSON NULL,
    required_skills JSON NULL,
    hiring_workflow JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_company_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Placement Questions Repository
CREATE TABLE IF NOT EXISTS questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT NULL,
    role_title VARCHAR(150) NOT NULL,
    round_type VARCHAR(100) NOT NULL,
    difficulty ENUM('Easy', 'Medium', 'Hard') NOT NULL DEFAULT 'Medium',
    topic VARCHAR(100) NOT NULL,
    question_text TEXT NOT NULL,
    answer_guidelines TEXT NULL,
    submitted_by INT NULL,
    moderation_status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
    qdrant_point_id VARCHAR(64) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL,
    FOREIGN KEY (submitted_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_question_company (company_id),
    INDEX idx_question_moderation (moderation_status),
    INDEX idx_question_topic (topic),
    INDEX idx_question_difficulty (difficulty)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Resumes & Extracted OCR Metadata Table
CREATE TABLE IF NOT EXISTS resumes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    raw_ocr_text LONGTEXT NULL,
    parsed_data JSON NULL,
    readiness_score DECIMAL(5,2) DEFAULT 0.00,
    qdrant_point_id VARCHAR(64) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_resume_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Mock Interview Sessions Table
CREATE TABLE IF NOT EXISTS interview_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    company_id INT NULL,
    target_role VARCHAR(150) NOT NULL,
    difficulty VARCHAR(50) DEFAULT 'Medium',
    status ENUM('in_progress', 'completed', 'abandoned') NOT NULL DEFAULT 'in_progress',
    overall_score DECIMAL(5,2) DEFAULT 0.00,
    feedback_summary TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL,
    INDEX idx_interview_user (user_id),
    INDEX idx_interview_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Interview Turn Messages (Transcripts)
CREATE TABLE IF NOT EXISTS interview_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id INT NOT NULL,
    turn_number INT NOT NULL,
    role ENUM('assistant', 'user', 'system') NOT NULL,
    message_text TEXT NOT NULL,
    score DECIMAL(4,2) NULL,
    feedback TEXT NULL,
    hints TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES interview_sessions(id) ON DELETE CASCADE,
    INDEX idx_message_session (session_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Skill Gap Reports Table
CREATE TABLE IF NOT EXISTS skill_gap_reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    company_id INT NOT NULL,
    match_score DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    matched_skills JSON NULL,
    missing_skills JSON NULL,
    recommended_topics JSON NULL,
    suggestions TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    INDEX idx_skill_gap_user_company (user_id, company_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- INITIAL SEED DATA
-- Default Passwords (bcrypt):
-- admin123   -> $2b$12$K1d0wQYQ.GvY.32u.vG6gOF6wZ.2mZ0Wz0QZ0wZ0QZ0wZ0QZ0wZ0Q (will be synced via security.py)
-- student123 -> $2b$12$K1d0wQYQ.GvY.32u.vG6gOF6wZ.2mZ0Wz0QZ0wZ0QZ0wZ0QZ0wZ0Q
-- alumni123  -> $2b$12$K1d0wQYQ.GvY.32u.vG6gOF6wZ.2mZ0Wz0QZ0wZ0QZ0wZ0QZ0wZ0Q
-- ==============================================================================

INSERT INTO users (id, email, hashed_password, full_name, role, branch, cgpa, graduation_year)
VALUES
(1, 'admin@placyra.edu', '$2b$12$q77s15B1fWkL7Gz4Q8z4mOF3M57kF9W0xW2H6mD1d2s3a4f5g6h7j', 'Prof. Sarah Jenkins (T&P Head)', 'tnp_admin', 'Training & Placement Cell', 9.80, 2012),
(2, 'student@placyra.edu', '$2b$12$q77s15B1fWkL7Gz4Q8z4mOF3M57kF9W0xW2H6mD1d2s3a4f5g6h7j', 'Rahul Sharma', 'student', 'Computer Science and Engineering', 8.75, 2026),
(3, 'alumni@placyra.edu', '$2b$12$q77s15B1fWkL7Gz4Q8z4mOF3M57kF9W0xW2H6mD1d2s3a4f5g6h7j', 'Ananya Patel (SWE at Google)', 'alumni', 'Information Technology', 9.20, 2023)
ON DUPLICATE KEY UPDATE id=id;

-- Seed Target Companies
INSERT INTO companies (id, name, industry, description, website, min_cgpa, eligible_branches, required_skills, hiring_workflow)
VALUES
(1, 'Google', 'Technology & Cloud', 'Global technology leader specializing in search engine, cloud computing, and AI systems.', 'https://careers.google.com', 8.00,
 JSON_ARRAY('Computer Science and Engineering', 'Information Technology', 'Electronics and Communication'),
 JSON_ARRAY('Data Structures', 'Algorithms', 'System Design', 'C++', 'Python', 'Distributed Systems', 'OS Concepts'),
 JSON_ARRAY('Online Coding Assessment', 'Technical Interview 1 (DSA)', 'Technical Interview 2 (System Design)', 'Googliness & Leadership')),

(2, 'Microsoft', 'Enterprise Software & Cloud', 'World leader in software products, operating systems, and enterprise Azure cloud solutions.', 'https://careers.microsoft.com', 7.50,
 JSON_ARRAY('Computer Science and Engineering', 'Information Technology', 'Electrical Engineering'),
 JSON_ARRAY('Data Structures', 'C#', 'Java', 'React', 'Azure', 'OOP Principles', 'Database Management', 'REST APIs'),
 JSON_ARRAY('Online Assessment', 'Technical Round 1 (Problem Solving)', 'Technical Round 2 (System Architecture)', 'HR & Culture Fit')),

(3, 'Amazon', 'E-commerce & Cloud Services', 'Global leader in cloud computing (AWS), e-commerce, and high-scale logistics automation.', 'https://amazon.jobs', 7.50,
 JSON_ARRAY('Computer Science and Engineering', 'Information Technology', 'Electronics'),
 JSON_ARRAY('Java', 'Algorithms', 'Data Structures', 'System Design', 'Leadership Principles', 'AWS', 'Multithreading'),
 JSON_ARRAY('Online Assessment (OA1 & OA2)', 'Technical Round 1 (Data Structures)', 'Technical Round 2 (System Design)', 'Bar Raiser Round')),

(4, 'Infosys', 'IT Services & Consulting', 'Next-generation digital services and consulting firm delivering agile business transformations.', 'https://infosys.com/careers', 6.50,
 JSON_ARRAY('All Branches'),
 JSON_ARRAY('Python', 'Java', 'SQL', 'Object Oriented Programming', 'HTML/CSS/JavaScript', 'Aptitude'),
 JSON_ARRAY('Online Aptitude & Coding Test', 'Technical Interview', 'HR Interview'))
ON DUPLICATE KEY UPDATE id=id;

-- Seed Curated Placement Questions (Approved)
INSERT INTO questions (id, company_id, role_title, round_type, difficulty, topic, question_text, answer_guidelines, submitted_by, moderation_status, qdrant_point_id)
VALUES
(1, 1, 'Software Engineer', 'Technical Interview 1 (DSA)', 'Hard', 'Data Structures', 
 'Given an unsorted integer array nums, return the smallest missing positive integer in O(n) time and O(1) auxiliary space.',
 'Key approach: Use cycle sort or index hashing where value x is placed at index x-1. Then iterate to find the first index i where nums[i] != i+1. Must explain edge cases like all positive or all negative numbers.', 
 1, 'approved', '550e8400-e29b-41d4-a716-446655440001'),

(2, 1, 'Software Engineer', 'Technical Interview 2 (System Design)', 'Hard', 'System Design',
 'Design a scalable URL Shortener service like TinyURL. Address hashing, database schema, collision resolution, and caching.',
 'Candidate should cover: Functional and non-functional requirements (read heavy, 100:1 ratio), Base62 encoding of auto-incrementing ID vs MD5 hash with collision check, Redis caching layer, distributed database partitioning (sharding by hash prefix).',
 1, 'approved', '550e8400-e29b-41d4-a716-446655440002'),

(3, 2, 'Software Engineer', 'Technical Round 1 (Problem Solving)', 'Medium', 'Algorithms',
 'Explain how you would find the Longest Substring Without Repeating Characters in a given string. What is the optimal time and space complexity?',
 'Optimal approach: Sliding window technique with two pointers and a Hash Map storing character indices. Time complexity O(N), Space complexity O(min(N, M)) where M is the character set size.',
 1, 'approved', '550e8400-e29b-41d4-a716-446655440003'),

(4, 2, 'Full Stack Developer', 'Technical Round 2 (System Architecture)', 'Medium', 'Database Management',
 'Compare SQL vs NoSQL databases in the context of an e-commerce platform. When would you choose PostgreSQL over MongoDB, and vice versa?',
 'Discuss ACID compliance vs BASE consistency, relational integrity for inventory and financial ledger vs document model for flexible product catalog with varying attributes.',
 3, 'approved', '550e8400-e29b-41d4-a716-446655440004'),

(5, 3, 'SDE-1', 'Technical Round 1 (Data Structures)', 'Medium', 'Data Structures',
 'How do you detect and remove a cycle in a singly linked list? State Floyd’s Cycle-Finding Algorithm and explain why it works.',
 'Use two pointers: slow (1 step) and fast (2 steps). If they meet, a cycle exists. To find the start node, reset slow to head, advance both by 1 step until they meet. Then break the last node’s next pointer.',
 3, 'approved', '550e8400-e29b-41d4-a716-446655440005'),

(6, 3, 'SDE-1', 'Bar Raiser Round', 'Medium', 'Behavioral',
 'Tell me about a time you had a disagreement with a team member or professor regarding a technical decision. How did you resolve it?',
 'Use the STAR method (Situation, Task, Action, Result). Demonstrate Amazon Leadership Principles: Disagree and Commit, Customer Obsession, and Earn Trust.',
 1, 'approved', '550e8400-e29b-41d4-a716-446655440006'),

(7, 4, 'Specialist Programmer', 'Technical Interview', 'Easy', 'Object Oriented Programming',
 'What are the 4 main pillars of OOP? Provide real-world code examples illustrating Polymorphism and Encapsulation.',
 'Pillars: Encapsulation, Abstraction, Inheritance, Polymorphism. Explain compile-time (overloading) vs runtime (overriding with virtual methods/interfaces).',
 1, 'approved', '550e8400-e29b-41d4-a716-446655440007'),

(8, 1, 'Software Engineer', 'Technical Interview 1 (DSA)', 'Medium', 'Operating Systems',
 'What is the difference between a process and a thread? Explain virtual memory, paging, and how thrashing occurs.',
 'Process has isolated memory space; threads share address space within a process. Virtual memory maps logical to physical frames. Thrashing happens when page fault frequency overwhelms CPU time.',
 3, 'pending', '550e8400-e29b-41d4-a716-446655440008')
ON DUPLICATE KEY UPDATE id=id;
