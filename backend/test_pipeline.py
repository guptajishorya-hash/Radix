"""
Automated end-to-end test suite for RADIX Talent Match backend.
Tests all 5 roles and legacy endpoints using httpx ASGITransport.
"""

import io
import asyncio
import httpx
from main import app

transport = httpx.ASGITransport(app=app)


async def run_tests():
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        print("=== 1. Root & Health Check ===")
        r = await client.get("/")
        assert r.status_code == 200
        print("Root response:", r.json()["message"])

        r = await client.get("/health")
        assert r.status_code == 200
        print("Health response:", r.json())

        print("\n=== 2. Role 1 (JD Extraction) ===")
        sample_jd = """
Senior Full Stack Engineer
We are seeking a talented engineer proficient in Python, FastAPI, and React.
Experience with Docker, Kubernetes, and Cloud architecture is essential.
Strong system design and database design capabilities required.
Must have experience in machine learning and data engineering pipelines.
"""
        r = await client.post(
            "/jd/extract",
            files={"file": ("job_description.txt", sample_jd.encode("utf-8"), "text/plain")},
        )
        assert r.status_code == 200, r.text
        jd_data = r.json()
        assert len(jd_data["skills"]) > 0
        print(f"Extracted {len(jd_data['skills'])} skills from JD:")
        for s in jd_data["skills"][:5]:
            print(f"  • {s['skill_name']} [{s['category_code']}] - Conf: {s['confidence']}")

        print("\n=== 3. Role 2 (Resume Parser) ===")
        sample_resume = """
Alex Rivera
alex.rivera@example.com
Senior Software Engineer with 8 years of extensive experience.
Expert in Python, React, JavaScript, SQL, and FastAPI.
Hands-on experience with Docker, AWS, and system design for distributed microservices.
Familiar with machine learning models and cloud deployment pipelines.
"""
        r = await client.post(
            "/resume/parse",
            files={"file": ("alex_rivera_resume.txt", sample_resume.encode("utf-8"), "text/plain")},
        )
        assert r.status_code == 200, r.text
        resume_data = r.json()
        assert resume_data["name"] == "Alex Rivera"
        assert resume_data["email"] == "alex.rivera@example.com"
        assert len(resume_data["skills"]) > 0
        print(f"Parsed candidate: {resume_data['name']} <{resume_data['email']}>")
        print(f"Found {len(resume_data['skills'])} candidate skills:")
        for s in resume_data["skills"][:5]:
            print(f"  • {s['skill_name']} [{s['category_code']}] Level: {s['level']}/10")

        print("\n=== 4. Role 4 (Talent Check / Supabase) ===")
        eval_payload = {
            "name": resume_data["name"],
            "company": "Google",
            "skills": resume_data["skills"],
        }
        r = await client.post("/talent-check/evaluate", json=eval_payload)
        assert r.status_code == 200, r.text
        talent_data = r.json()
        assert "readiness_score" in talent_data
        assert 0 <= talent_data["readiness_score"] <= 100
        print(f"Candidate: {talent_data['candidate_name']} vs {talent_data['company']}")
        print(f"Readiness Score: {talent_data['readiness_score']}/100 ({talent_data['readiness_label']})")
        print(f"Data Source: {talent_data['data_source']}")
        print("Skill Gap Breakdown:")
        for g in talent_data["skillset_gap"]:
            print(f"  • {g['category_code']} ({g['category_label']}): Cand Lv.{g['candidate_level']} vs Req Lv.{g['required_level']} -> Gap: {g['gap']} [{g['status']}]")

        print("\n=== 5. Role 5 (Fuzzy Skill Matching) ===")
        match_payload = {
            "candidate_skills": resume_data["skills"],
            "jd_skills": jd_data["skills"],
            "threshold": 70,
        }
        r = await client.post("/match/skills", json=match_payload)
        assert r.status_code == 200, r.text
        match_data = r.json()
        assert "match_score" in match_data
        assert 0 <= match_data["match_score"] <= 100
        print(f"Skill Match Score: {match_data['match_score']}% ({match_data['match_label']})")
        print(f"Matched {match_data['matched_count']} of {match_data['total_jd_skills']} JD skills:")
        for m in match_data["matched_skills"][:5]:
            print(f"  • JD '{m['jd_skill']}' <=> Cand '{m['matched_candidate_skill']}' (Score: {m['similarity_score']}%)")

        print("\n=== 6. Legacy Endpoints Compatibility ===")
        r = await client.get("/match")
        assert r.status_code == 200
        print("GET /match:", r.json())

        r = await client.get("/resume")
        assert r.status_code == 200
        print("GET /resume:", r.json()["status"])

        r = await client.post("/analyze-jd", json={"job_description": "DevOps Engineer needed"})
        assert r.status_code == 200
        print("POST /analyze-jd:", r.json()["status"])

        r = await client.post("/analyze-resume", json={"resume_text": "Experienced Python developer with React knowledge"})
        assert r.status_code == 200
        print("POST /analyze-resume:", r.json()["status"])

        print("\n✨ ALL 6 SECTIONS OF BACKEND TESTS PASSED WITH 100% SUCCESS! ✨")


if __name__ == "__main__":
    asyncio.run(run_tests())
