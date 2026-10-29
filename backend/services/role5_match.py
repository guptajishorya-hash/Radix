"""
Role 5 – Skill Matching (RADIX Hackathon Brief Spec)
Compares a candidate's skill set against a JD's required skills using
fuzzy matching (thefuzz token_set_ratio) with a fallback to substring matching.
Conforms strictly to the Shared Data Contract (Brief Page 10).
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/match", tags=["Skill Matching"])


# ---------------------------------------------------------------------------
# Fuzzy matching helpers
# ---------------------------------------------------------------------------
def _fuzzy_score(a: str, b: str) -> int:
    """Return 0-100 similarity score between two strings."""
    try:
        from thefuzz import fuzz
        return fuzz.token_set_ratio(a.lower(), b.lower())
    except ImportError:
        a_l, b_l = a.lower(), b.lower()
        if a_l == b_l:
            return 100
        if a_l in b_l or b_l in a_l:
            return 80
        words_a = set(a_l.split())
        words_b = set(b_l.split())
        common = words_a & words_b
        if not words_a or not words_b:
            return 0
        return int(100 * len(common) / max(len(words_a), len(words_b)))


# ---------------------------------------------------------------------------
# Pydantic models
# ---------------------------------------------------------------------------
class SkillEntry(BaseModel):
    skill_name: str
    category_code: str = ""
    level: int = 5


class MatchRequest(BaseModel):
    jd_source_file: str = "Job_Description.pdf"
    candidate_skills: list[SkillEntry]
    jd_skills: list[SkillEntry] = []
    threshold: int = 70  # minimum fuzzy score to count as a match


# ---------------------------------------------------------------------------
# Backward-compat function used by main.py
# ---------------------------------------------------------------------------
def calculate_match(candidate_skills: list | None = None, jd_skills: list | None = None) -> dict:
    if not candidate_skills or not jd_skills:
        return {"match_score": 85, "note": "Mock score — no real data provided."}

    matched_count = 0
    for jd_skill in jd_skills:
        for c_skill in candidate_skills:
            score = _fuzzy_score(jd_skill.get("skill_name", ""), c_skill.get("skill_name", ""))
            if score >= 70:
                matched_count += 1
                break

    total = len(jd_skills)
    pct = round(100 * matched_count / total) if total else 0
    return {"match_score": pct}


# ---------------------------------------------------------------------------
# Endpoint
# ---------------------------------------------------------------------------
@router.post("/skills")
async def match_skills(req: MatchRequest):
    """
    Compare candidate skills against JD skills using fuzzy matching.
    Outputs the Role 5 Shared Data Contract format (Brief Page 10).
    """
    jd_skills = req.jd_skills
    if not jd_skills:
        jd_skills = [
            SkillEntry(skill_name="Data Structures & Algorithms", category_code="DSA", level=8),
            SkillEntry(skill_name="Coding & Object-Oriented Design", category_code="COD", level=8),
            SkillEntry(skill_name="Distributed System Design", category_code="SYSD", level=8),
            SkillEntry(skill_name="Cloud & Infrastructure", category_code="CLOUD", level=8),
            SkillEntry(skill_name="SQL Database Optimization", category_code="SQL", level=7),
            SkillEntry(skill_name="Operating Systems & Concurrency", category_code="OS", level=7),
        ]

    matched: list[dict] = []
    unmatched: list[dict] = []

    for jd_skill in jd_skills:
        best_score = 0
        best_cand = None

        for c_skill in req.candidate_skills:
            score = _fuzzy_score(jd_skill.skill_name, c_skill.skill_name)
            if score > best_score:
                best_score = score
                best_cand = c_skill

        if best_score >= req.threshold and best_cand:
            matched.append({
                "jd_skill": jd_skill.skill_name,
                "matched_candidate_skill": best_cand.skill_name,
                "similarity_score": best_score,
                "candidate_level": best_cand.level,
                "category_code": jd_skill.category_code or best_cand.category_code,
            })
        else:
            unmatched.append({
                "jd_skill": jd_skill.skill_name,
                "category_code": jd_skill.category_code,
                "best_candidate_skill": best_cand.skill_name if best_cand else "—",
                "best_similarity": best_score,
                "recommendation": f"Candidate should develop competency in '{jd_skill.skill_name}'.",
            })

    total = len(req.jd_skills)
    match_score = round(100 * len(matched) / total) if total else 0

    # Category breakdown across the RADIX skill categories
    cat_totals: dict[str, int] = {}
    cat_matched: dict[str, int] = {}
    for jd_skill in req.jd_skills:
        cat = jd_skill.category_code or "OTHER"
        cat_totals[cat] = cat_totals.get(cat, 0) + 1
    for m in matched:
        cat = m["category_code"] or "OTHER"
        cat_matched[cat] = cat_matched.get(cat, 0) + 1

    category_breakdown = [
        {
            "category_code": cat,
            "total_required": total_v,
            "matched": cat_matched.get(cat, 0),
            "match_pct": round(100 * cat_matched.get(cat, 0) / total_v),
        }
        for cat, total_v in cat_totals.items()
    ]

    # Shared Data Contract Role 5 format (Brief Page 10)
    return {
        "jd_source_file": req.jd_source_file,
        "match_score": match_score,
        "match_label": (
            "Exceptional Match" if match_score >= 85
            else "Solid Match" if match_score >= 70
            else "Moderate Match" if match_score >= 50
            else "Low Match — Substantial Skill Gaps"
        ),
        "total_jd_skills": total,
        "matched_count": len(matched),
        "unmatched_count": len(unmatched),
        "matched_skills": matched,
        "missing_skills": unmatched,      # Spec name in Brief Page 10
        "unmatched_skills": unmatched,    # Alias for UI compatibility
        "category_breakdown": category_breakdown,
    }
