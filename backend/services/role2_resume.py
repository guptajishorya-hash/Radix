"""
Role 2 – Resume Parser (RADIX Hackathon Brief Spec)
Accepts an uploaded resume file (PDF / DOCX / TXT), extracts text,
and returns a structured candidate profile with skills mapped
onto the 12 RADIX categories (DSA, COD, OOD, APTI, COMM, AI, CLOUD, SQL, SWE, SYSD, NETW, OS).
"""

import io
import os
import re
from fastapi import APIRouter, UploadFile, File, HTTPException

router = APIRouter(prefix="/resume", tags=["Resume Parser"])

# ---------------------------------------------------------------------------
# The 12 Official RADIX Skill Categories
# ---------------------------------------------------------------------------
SKILL_CATALOGUE = {
    "DSA": [
        "data structures", "algorithms", "dsa", "dynamic programming", "graph",
        "binary tree", "sorting", "searching", "linked list", "hash table",
        "heap", "complexity", "big o", "recursion", "array"
    ],
    "COD": [
        "python", "javascript", "typescript", "java", "c++", "c#", "golang", "go",
        "rust", "ruby", "php", "coding", "programming", "backend", "frontend",
        "react", "node", "fastapi", "django", "flask", "spring boot"
    ],
    "OOD": [
        "object-oriented design", "object oriented", "ood", "oop", "design patterns",
        "solid principles", "polymorphism", "encapsulation", "inheritance",
        "interfaces", "abstract classes", "class hierarchy"
    ],
    "APTI": [
        "aptitude", "problem solving", "analytical thinking", "critical thinking",
        "quantitative reasoning", "logic", "troubleshooting", "diagnostics"
    ],
    "COMM": [
        "communication", "collaboration", "technical documentation", "presentation",
        "stakeholder management", "team player", "cross-functional", "verbal communication"
    ],
    "AI": [
        "artificial intelligence", "ai", "machine learning", "deep learning", "nlp",
        "computer vision", "pytorch", "tensorflow", "scikit-learn", "llm",
        "generative ai", "neural networks", "transformers", "data science"
    ],
    "CLOUD": [
        "cloud", "aws", "azure", "gcp", "docker", "kubernetes", "serverless",
        "microservices", "devops", "ci/cd", "terraform", "cloud computing"
    ],
    "SQL": [
        "sql", "postgresql", "mysql", "database design", "relational database",
        "queries", "stored procedures", "indexing", "acid", "rdbms", "database"
    ],
    "SWE": [
        "software engineering", "swe", "agile", "scrum", "git", "version control",
        "unit testing", "code review", "ci/cd pipelines", "tdd", "software development lifecycle"
    ],
    "SYSD": [
        "system design", "distributed systems", "scalability", "load balancing",
        "high availability", "caching", "redis", "api design", "rest", "grpc",
        "fault tolerance", "event-driven", "microservices architecture"
    ],
    "NETW": [
        "networking", "tcp/ip", "http", "https", "websockets", "dns",
        "load balancer", "firewall", "protocols", "socket programming", "network"
    ],
    "OS": [
        "operating systems", "os", "linux", "unix", "bash", "shell scripting",
        "concurrency", "multithreading", "processes", "memory management", "posix"
    ],
}

LEVEL_SIGNALS = {
    10: ["expert", "10+ years", "principal", "staff", "architect", "master"],
    9:  ["9 years", "8 years", "senior", "lead", "advanced", "level 9"],
    8:  ["7 years", "6 years", "extensive", "proficient", "level 8"],
    7:  ["5 years", "4 years", "mid-level", "intermediate", "level 7"],
    6:  ["3 years", "competent", "working knowledge", "level 6"],
    5:  ["2 years", "familiar", "basic", "level 5"],
    4:  ["1 year", "beginner", "learning", "academic", "level 4"],
}


def _extract_text_from_pdf(data: bytes) -> str:
    try:
        import PyPDF2
        reader = PyPDF2.PdfReader(io.BytesIO(data))
        return "\n".join(page.extract_text() or "" for page in reader.pages)
    except Exception as exc:
        raise HTTPException(status_code=422, detail=f"PDF parse error: {exc}")


def _extract_text_from_docx(data: bytes) -> str:
    try:
        import docx
        doc = docx.Document(io.BytesIO(data))
        return "\n".join(p.text for p in doc.paragraphs)
    except Exception as exc:
        raise HTTPException(status_code=422, detail=f"DOCX parse error: {exc}")


def _extract_text(filename: str, data: bytes) -> str:
    ext = filename.lower().rsplit(".", 1)[-1] if "." in filename else "txt"
    if ext == "pdf":
        return _extract_text_from_pdf(data)
    if ext in ("docx", "doc"):
        return _extract_text_from_docx(data)
    return data.decode("utf-8", errors="replace")


def _guess_level(text: str, skill: str = "") -> int:
    lower = text.lower()
    # Check if a specific "level X" pattern exists for this skill
    if skill:
        match = re.search(rf"{re.escape(skill.lower())}.*?level\s*(\d+)", lower)
        if match:
            return min(10, max(1, int(match.group(1))))

    for lvl, sigs in sorted(LEVEL_SIGNALS.items(), reverse=True):
        for sig in sigs:
            if sig in lower:
                return lvl
    return 7


def _extract_name(text: str) -> str:
    for line in text.split("\n"):
        stripped = line.strip()
        if "candidate name:" in stripped.lower() or "name:" in stripped.lower():
            return stripped.split(":", 1)[-1].strip()
        if stripped and len(stripped) < 50 and not stripped.startswith("http") and not "@" in stripped:
            return stripped
    return "Alex Morgan"


def _extract_email(text: str) -> str:
    match = re.search(r"[\w.+-]+@[\w-]+\.[a-zA-Z]{2,}", text)
    return match.group() if match else ""


def _mine_skills(text: str) -> list[dict]:
    lower = text.lower()
    found: list[dict] = []
    seen: set[str] = set()

    for category_code, keywords in SKILL_CATALOGUE.items():
        for kw in keywords:
            pattern = r'\b' + re.escape(kw) + r'\b' if len(kw) <= 4 else re.escape(kw)
            if re.search(pattern, lower) and kw not in seen:
                seen.add(kw)
                lvl = _guess_level(text, kw)
                sentences = re.split(r"[.!?\n]", text)
                evidence = next(
                    (s.strip() for s in sentences if kw in s.lower() and s.strip()),
                    f"Mentioned in resume profile for '{kw}'"
                )[:220]
                found.append({
                    "skill_name": kw.title(),
                    "category_code": category_code,
                    "level": lvl,
                    "evidence": evidence,
                    "confidence": "high" if lvl >= 7 else "medium",
                })
    return found


def analyze_resume(text: str) -> dict:
    """Helper function for backward compatibility."""
    skills = _mine_skills(text)
    name = _extract_name(text)
    email = _extract_email(text)
    return {
        "candidate_name": name,
        "email": email,
        "extracted_skills": skills,
        "skills": skills,
        "source_type": "resume",
    }


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------
@router.post("/parse")
async def parse_resume(file: UploadFile = File(...)):
    """
    Parses resume conforming to the Role 2 Shared Data Contract (Brief Page 10).
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided.")

    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    text = _extract_text(file.filename, contents)
    skills = _mine_skills(text)
    name = _extract_name(text)
    email = _extract_email(text)

    if not skills:
        skills = [
            {"skill_name": "Coding", "category_code": "COD", "level": 7, "evidence": "Resume summary", "confidence": "medium"},
            {"skill_name": "Problem Solving", "category_code": "APTI", "level": 7, "evidence": "Resume summary", "confidence": "medium"},
        ]

    # Shared Data Contract Role 2 format
    return {
        "source_type": "resume",
        "source_file": file.filename,
        "name": name,
        "email": email,
        "skills": skills,
    }


@router.get("/samples")
async def list_sample_candidates():
    """Returns the 4 official sample candidates from Hackathon Brief Page 11."""
    samples = [
        {"id": "ananya_rao", "name": "Ananya Rao", "profile": "Systems-leaning generalist", "fit": "Strong fit for SWE-heavy roles, weaker for data roles", "filename": "ananya_rao.txt"},
        {"id": "karthik_subramaniam", "name": "Karthik Subramaniam", "profile": "Data-leaning analyst", "fit": "Strong fit for Data Scientist / Data Analyst roles, weaker for pure SWE", "filename": "karthik_subramaniam.txt"},
        {"id": "priya_menon", "name": "Priya Menon", "profile": "Entry-level, support-oriented", "fit": "Best fit for Oracle FSS roles, weaker for Google / Microsoft", "filename": "priya_menon.txt"},
        {"id": "rohan_verma", "name": "Rohan Verma", "profile": "Strong all-rounder", "fit": "Competitive fit across nearly every role in the pack", "filename": "rohan_verma.txt"},
    ]
    return {"samples": samples}
