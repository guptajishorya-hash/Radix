"""
Role 1 – JD Analytics (RADIX Hackathon Brief Spec)
Accepts an uploaded JD file (PDF, DOCX, or TXT) and extracts skills
mapped onto the 12 official RADIX skill categories:
DSA, COD, OOD, APTI, COMM, AI, CLOUD, SQL, SWE, SYSD, NETW, OS (and OTHER).
"""

import io
import os
import re
from fastapi import APIRouter, UploadFile, File, HTTPException

router = APIRouter(prefix="/jd", tags=["JD Analytics"])

# ---------------------------------------------------------------------------
# The 12 Official RADIX Skill Categories (Brief Page 9)
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

CONFIDENCE_MAP = {
    "COD": "high", "DSA": "high", "OOD": "high", "SYSD": "high", "AI": "high",
    "CLOUD": "medium", "SQL": "high", "SWE": "medium", "NETW": "medium",
    "OS": "high", "APTI": "medium", "COMM": "medium"
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


def _detect_company(text: str) -> str:
    lower = text.lower()
    if "google" in lower:
        return "Google LLC"
    if "microsoft" in lower:
        return "Microsoft Corporation"
    if "oracle" in lower:
        return "Oracle Financial Services Software"
    return "Enterprise Benchmark"


def _detect_role(text: str) -> str:
    lines = text.split("\n")[:10]
    for line in lines:
        if "role:" in line.lower() or "job title:" in line.lower() or "position:" in line.lower():
            return line.split(":", 1)[-1].strip()
    return "Software Engineer"


def _mine_skills(text: str) -> list[dict]:
    lower = text.lower()
    found: list[dict] = []
    seen: set[str] = set()

    for category_code, keywords in SKILL_CATALOGUE.items():
        for kw in keywords:
            # Word boundary matching where appropriate
            pattern = r'\b' + re.escape(kw) + r'\b' if len(kw) <= 4 else re.escape(kw)
            if re.search(pattern, lower) and kw not in seen:
                seen.add(kw)
                sentences = re.split(r"[.!?\n]", text)
                evidence = next(
                    (s.strip() for s in sentences if kw in s.lower() and s.strip()),
                    f"Mentioned in job description requirement for '{kw}'"
                )[:220]
                found.append({
                    "skill_name": kw.title(),
                    "category_code": category_code,
                    "evidence": evidence,
                    "confidence": CONFIDENCE_MAP.get(category_code, "high"),
                })
    return found


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------
@router.post("/extract")
async def extract_jd_skills(file: UploadFile = File(...)):
    """
    Extracts skills conforming to the Shared Data Contract (Brief Page 10).
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided.")

    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    text = _extract_text(file.filename, contents)
    skills = _mine_skills(text)
    company = _detect_company(text)
    role = _detect_role(text)

    if not skills:
        skills = [
            {"skill_name": "Software Engineering", "category_code": "SWE", "evidence": "General requirement", "confidence": "medium"},
            {"skill_name": "Problem Solving", "category_code": "APTI", "evidence": "General requirement", "confidence": "medium"},
        ]

    # Conforms exactly to Role 1 Shared Data Contract (Brief Page 10)
    return {
        "source_type": "jd",
        "source_file": file.filename,
        "company": company,
        "role": role,
        "skills": skills,
    }


@router.get("/samples")
async def list_sample_jds():
    """Returns the 6 official hackathon JDs across the 3 companies."""
    samples = [
        {"id": "google_swe", "company": "Google LLC", "role": "Software Engineer (SWE)", "location": "Bengaluru, India (Hybrid)", "filename": "google_swe.txt"},
        {"id": "google_ds", "company": "Google LLC", "role": "Data Scientist", "location": "Bengaluru, India", "filename": "google_ds.txt"},
        {"id": "ms_swe", "company": "Microsoft Corporation", "role": "Software Engineer", "location": "Hyderabad, India", "filename": "ms_swe.txt"},
        {"id": "ms_da", "company": "Microsoft Corporation", "role": "Data Analyst", "location": "Hyderabad, India", "filename": "ms_da.txt"},
        {"id": "oracle_ase", "company": "Oracle Financial Services Software", "role": "Associate Software Engineer", "location": "Bengaluru / Mumbai, India", "filename": "oracle_ase.txt"},
        {"id": "oracle_asa", "company": "Oracle Financial Services Software", "role": "Application Support Analyst", "location": "Bengaluru / Chennai, India", "filename": "oracle_asa.txt"},
    ]
    return {"samples": samples}
