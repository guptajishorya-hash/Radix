"""
Role 4 – Talent Check (RADIX Hackathon Brief Spec & Update)
Implements:
  Option 1: Direct Supabase database integration (staging_company_skill_levels).
  Option 2: Local JSON snapshot (talent_check_company_skillsets.json) across all 12 skillsets for the 3 companies.
Evaluates candidate readiness and calculates skillset gaps.
"""

import os
import json
from typing import Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import httpx

router = APIRouter(prefix="/talent-check", tags=["Talent Check"])

# ---------------------------------------------------------------------------
# The 12 Official RADIX Skill Category Labels
# ---------------------------------------------------------------------------
CATEGORY_LABELS = {
    "DSA":   "Data Structures & Algorithms",
    "COD":   "Coding",
    "OOD":   "Object-Oriented Design",
    "APTI":  "Aptitude",
    "COMM":  "Communication",
    "AI":    "AI",
    "CLOUD": "Cloud",
    "SQL":   "SQL",
    "SWE":   "Software Engineering",
    "SYSD":  "System Design",
    "NETW":  "Networking",
    "OS":    "Operating Systems",
    "OTHER": "Other Technical Skills",
}

# ---------------------------------------------------------------------------
# Option 2: Load local JSON snapshot across all 12 skillsets for the 3 companies
# ---------------------------------------------------------------------------
JSON_FILE_PATH = os.path.join(os.path.dirname(__file__), "..", "talent_check_company_skillsets.json")

def _load_local_json_bars() -> dict:
    if os.path.exists(JSON_FILE_PATH):
        try:
            with open(JSON_FILE_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print(f"[Role 4] Error reading local JSON snapshot: {e}")
    # Built-in fallback containing all 12 skillsets for the 3 companies
    return {
        "Google LLC": [
            {"category_code": "DSA", "required_level": 9},
            {"category_code": "COD", "required_level": 9},
            {"category_code": "SYSD", "required_level": 9},
            {"category_code": "AI", "required_level": 8},
            {"category_code": "CLOUD", "required_level": 8},
            {"category_code": "SWE", "required_level": 8},
            {"category_code": "OOD", "required_level": 8},
            {"category_code": "OS", "required_level": 8},
            {"category_code": "NETW", "required_level": 7},
            {"category_code": "SQL", "required_level": 7},
            {"category_code": "APTI", "required_level": 8},
            {"category_code": "COMM", "required_level": 8},
        ],
        "Microsoft Corporation": [
            {"category_code": "COD", "required_level": 8},
            {"category_code": "DSA", "required_level": 8},
            {"category_code": "SWE", "required_level": 9},
            {"category_code": "CLOUD", "required_level": 9},
            {"category_code": "OOD", "required_level": 8},
            {"category_code": "SYSD", "required_level": 8},
            {"category_code": "SQL", "required_level": 8},
            {"category_code": "AI", "required_level": 8},
            {"category_code": "OS", "required_level": 8},
            {"category_code": "COMM", "required_level": 8},
            {"category_code": "APTI", "required_level": 8},
            {"category_code": "NETW", "required_level": 7},
        ],
        "Oracle Financial Services Software": [
            {"category_code": "SQL", "required_level": 9},
            {"category_code": "COD", "required_level": 8},
            {"category_code": "SWE", "required_level": 8},
            {"category_code": "OOD", "required_level": 8},
            {"category_code": "DSA", "required_level": 7},
            {"category_code": "SYSD", "required_level": 7},
            {"category_code": "CLOUD", "required_level": 7},
            {"category_code": "OS", "required_level": 7},
            {"category_code": "APTI", "required_level": 8},
            {"category_code": "COMM", "required_level": 8},
            {"category_code": "NETW", "required_level": 7},
            {"category_code": "AI", "required_level": 6},
        ]
    }


def _match_company_key(company: str, catalogue: dict) -> Optional[str]:
    c_lower = company.lower()
    for k in catalogue.keys():
        if k.lower() in c_lower or c_lower in k.lower():
            return k
    return None


# ---------------------------------------------------------------------------
# Option 1: Direct Supabase database integration
# ---------------------------------------------------------------------------
def _fetch_bars_from_supabase(company: str) -> Optional[list[dict]]:
    try:
        from dotenv import load_dotenv
        load_dotenv()
    except ImportError:
        pass

    url = os.environ.get("SUPABASE_URL", "").rstrip("/")
    key = os.environ.get("SUPABASE_KEY", "")

    if not url or not key:
        return None

    try:
        headers = {
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
        }
        endpoint = f"{url}/rest/v1/staging_company_skill_levels"
        resp = httpx.get(endpoint, headers=headers, params={"select": "*"}, timeout=2.0)
        if resp.status_code == 200:
            rows = resp.json() or []
            matched = []
            for r in rows:
                c_name = r.get("company_name") or r.get("company") or ""
                if not c_name or company.lower() in c_name.lower():
                    cat = r.get("category_code") or r.get("category") or r.get("skill") or "COD"
                    lvl = r.get("required_level") or r.get("level") or 7
                    matched.append({"category_code": str(cat).upper(), "required_level": int(lvl)})

            if len(matched) >= 6:  # Has real data
                return matched

        return None
    except Exception as e:
        print(f"[Supabase] Option 1 notice: {e}. Gracefully using Option 2 JSON snapshot.")
        return None


def _get_bars(company: str) -> tuple[list[dict], str]:
    """
    Returns (bars, source) where source is 'supabase' (Option 1) or 'local_json' (Option 2).
    """
    # Try Option 1: Supabase
    bars = _fetch_bars_from_supabase(company)
    if bars:
        return bars, "supabase"

    # Try Option 2: local JSON snapshot
    local_data = _load_local_json_bars()
    matched_key = _match_company_key(company, local_data)
    if matched_key and local_data.get(matched_key):
        return local_data[matched_key], "local_json"

    # Fallback to Google LLC's 12 bars if arbitrary company is passed
    return local_data.get("Google LLC", []), "local_json_default"


# ---------------------------------------------------------------------------
# Pydantic models
# ---------------------------------------------------------------------------
class SkillEntry(BaseModel):
    skill_name: str = ""
    category_code: str
    level: int = 5


class ProfileInput(BaseModel):
    name: str = "Candidate"
    company: str
    skills: list[SkillEntry] = []
    candidate_skills: list[SkillEntry] | None = None

    def get_skills(self) -> list[SkillEntry]:
        return self.skills or self.candidate_skills or []


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------
@router.get("/company-bars")
async def get_company_bars(company: str = "Google LLC"):
    """
    Returns expected competency levels across all 12 skillsets for the specified company.
    """
    bars, source = _get_bars(company)
    return {
        "company": company,
        "source": source,
        "bars": [
            {
                **b,
                "category_label": CATEGORY_LABELS.get(b["category_code"], b["category_code"])
            }
            for b in bars
        ]
    }


@router.post("/evaluate")
async def evaluate_talent(profile: ProfileInput):
    """
    Conforms to the Role 4 Shared Data Contract (Brief Page 10).
    Evaluates candidate readiness across all 12 skillsets.
    """
    if not profile.company:
        raise HTTPException(status_code=400, detail="Company name is required.")

    company_bars, data_source = _get_bars(profile.company)
    skillset_gaps: list[dict] = []
    total_score = 0
    count = len(company_bars)

    for bar in company_bars:
        cat = bar["category_code"]
        req_lvl = bar["required_level"]

        # Calculate candidate level for this category
        all_skills = profile.get_skills()
        matching = [s.level for s in all_skills if s.category_code == cat]
        cand_lvl = round(sum(matching) / len(matching)) if matching else 4

        # Boolean gap as specified in Brief Page 10: "gap": true|false
        has_gap = cand_lvl < req_lvl

        if cand_lvl >= req_lvl:
            status = "Meets Bar"
            score_contrib = 100
        else:
            diff = req_lvl - cand_lvl
            status = f"Gap: -{diff}"
            score_contrib = max(20, 100 - (diff * 18))

        total_score += score_contrib
        skillset_gaps.append({
            "category_code": cat,
            "category_label": CATEGORY_LABELS.get(cat, cat),
            "required_level": req_lvl,
            "candidate_level": cand_lvl,
            "gap": has_gap,
            "status": status,
        })

    readiness_score = round(total_score / count) if count > 0 else 70

    if readiness_score >= 85:
        label = "High Readiness — Ready for Interview"
    elif readiness_score >= 70:
        label = "Targeted Preparation Recommended"
    else:
        label = "Significant Skillset Gaps Detected"

    # Shared Data Contract Role 4 format (Brief Page 10)
    return {
        "company": profile.company,
        "candidate_name": profile.name,
        "skillset_gap": skillset_gaps,
        "readiness_score": readiness_score,
        "readiness_label": label,
        "data_source": data_source,
    }
