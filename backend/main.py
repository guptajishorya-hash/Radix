"""
RADIX Talent Match – FastAPI Backend Entry Point
All 5 role routers are registered here.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Routers
from services.role1_jd import router as jd_router
from services.role2_resume import router as resume_router
from services.role4_talent import router as talent_router
from services.role5_match import router as match_router
from services.role6_mock_interview import router as mock_router

# Helpers for backward-compatibility
from services.role2_resume import analyze_resume
from services.role5_match import calculate_match

app = FastAPI(
    title="RADIX Talent Match API",
    version="2.0",
    description=(
        "End-to-end talent evaluation pipeline: "
        "Role 1: JD extraction | Role 2: Resume parsing | Role 3: Profile building | "
        "Role 4: Talent check (Supabase) | Role 5: Skill matching (Fuzzy logic)"
    ),
)

# ── CORS ──────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:3000",
    ],
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Register all role routers (standard + /api prefix for Vercel Serverless) ─
for r in [jd_router, resume_router, talent_router, match_router, mock_router]:
    app.include_router(r)
    app.include_router(r, prefix="/api")


# ── Backward-compatible request schemas & endpoints ──────────────────────
class JobDescriptionRequest(BaseModel):
    job_description: str


class ResumeRequest(BaseModel):
    resume_text: str


@app.get("/", tags=["Health"])
@app.get("/api", tags=["Health"])
def read_root():
    return {
        "message": "RADIX Talent Match Backend is Running",
        "version": "2.0",
        "roles": {
            "role1_jd":      "POST /jd/extract (upload JD file)",
            "role2_resume":  "POST /resume/parse (upload candidate resume)",
            "role3_profile": "Handled on Frontend (ProfileBuilder component)",
            "role4_talent":  "POST /talent-check/evaluate (Supabase evaluation)",
            "role5_match":   "POST /match/skills (Fuzzy skill match)",
            "role6_mock":    "POST /mock-interview/start (Live Mock Interview)",
        },
    }


@app.get("/health", tags=["Health"])
@app.get("/api/health", tags=["Health"])
def health_check():
    return {"status": "success", "server": "running"}


@app.get("/companies", tags=["Companies"])
@app.get("/api/companies", tags=["Companies"])
def get_companies():
    return {
        "companies": [
            "Google LLC",
            "Microsoft Corporation",
            "Oracle Financial Services Software",
        ]
    }


@app.get("/resume", tags=["Legacy"])
def resume_test():
    return analyze_resume("Candidate Resume with Python, Docker, and Kubernetes experience")


@app.get("/match", tags=["Legacy"])
def match_test():
    return calculate_match()


@app.post("/analyze-jd", tags=["Legacy"])
def analyze_job(request: JobDescriptionRequest):
    return {
        "received_job_description": request.job_description,
        "status": "success"
    }


@app.post("/analyze-resume", tags=["Legacy"])
def analyze_candidate_resume(request: ResumeRequest):
    return analyze_resume(request.resume_text)
