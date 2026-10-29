# RADIX Talent Match ⚡ (JSS Global Edition)

> **Enterprise-Grade AI Talent Evaluation Pipeline, Neural Knowledge Graph & Interactive Voice/Text Screening Simulator**

Developed for the **RADIX Hackathon** & Academic Technical Submission.

---

## 🌟 Key Platform Capabilities

RADIX Talent Match integrates 6 specialized roles into an end-to-end talent calibration ecosystem:

1. **Role 1 — Job Description Analytics (`role1_jd.py`)**: Multi-format document parser (PDF, DOCX, TXT) extracting essential competencies, category mappings, and textual evidence.
2. **Role 2 — Resume Intelligence (`role2_resume.py`)**: Deep extraction of candidate credentials, work history, and competency scores (1–10) across 12 RADIX categories.
3. **Role 3 — Interactive Profile Builder (`ProfileBuilder.jsx`)**: Candidate profile studio allowing dynamic skill tuning, level adjustments, and 1-click addition of enterprise competencies.
4. **Role 4 — Competency Benchmarking & Talent Check (`role4_talent.py`)**: Calibrates candidates against target company thresholds (**Google LLC**, **Microsoft Corporation**, **Oracle Financial Services Software**) via:
   - **Option 1**: Live Supabase database query (`staging_company_skill_levels`).
   - **Option 2**: Local JSON snapshot across all 12 skillsets (`talent_check_company_skillsets.json`).
5. **Role 5 — Fuzzy Skill Matching & Gap Intelligence (`role5_match.py`)**: Token-set ratio algorithm computing granular similarity scores, matched skills, and actionable upskilling recommendations.
6. **Role 6 — Live Mock Interview Simulator (`role6_mock_interview.py` & `MockInterviewModal.jsx`)**:
   - Spawns strict AI Engineering Managers emulating target company culture (Alex Chen @ Google, Priya Sharma @ Microsoft, Marcus Vance @ Oracle).
   - Real-time **Voice Mic Speech Recognition** and text response input.
   - Evaluates answers on a live **5-point rubric scale** with specific architectural critique and pro-tips.
7. **12-Skillset Neural Knowledge Graph (`KnowledgeGraph.jsx`)**:
   - Interactive force-directed topology showing architectural dependencies and synergies across all 12 RADIX categories.
   - Real-time **Predictive Upskilling Slider** demonstrating score deltas across top-tier companies.

---

## 🏗️ Architecture & Tech Stack

- **Frontend**: React 18, Vite 5, Axios, Material Symbols, Canvas & SVG Neural Graph
- **Backend**: FastAPI 0.110, Pydantic v2, Uvicorn, Python 3.11/3.12
- **Matching & Analytics**: `thefuzz` Token Set Ratio, Levenshtein Distance
- **Data Persistence**: Supabase (PostgreSQL) + Local Failover Snapshots
- **Cloud Hosting**: Vercel Serverless Functions (`@vercel/python` + `@vercel/static-build`)

---

## 🚀 Running Locally

### 1. Clone Repository
```bash
git clone https://github.com/guptajishorya-hash/Radix.git
cd Radix
```

### 2. Backend Setup
```bash
cd backend
python -m venv venv
.\venv\Scripts\activate      # On Windows
source venv/bin/activate       # On Linux/macOS
pip install -r requirements.txt
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```
- API Docs & Swagger UI: `http://127.0.0.1:8000/docs`
- Health check: `http://127.0.0.1:8000/health`

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
- Web Application: `http://127.0.0.1:5173`

---

## ☁️ Deployment on Vercel

This repository is pre-configured with `vercel.json` for full-stack monorepo deployment:

1. Import this repository (`guptajishorya-hash/Radix`) on [Vercel Dashboard](https://vercel.com/new).
2. Framework Preset: **Vite** (Root Directory: `./`).
3. (Optional) Set Environment Variables:
   - `SUPABASE_URL`: `https://kadfiuqfbcvcoiiqidku.supabase.co`
   - `SUPABASE_KEY`: Your Supabase public anon key
4. Click **Deploy**. Vercel will build the React Vite frontend and deploy the FastAPI backend as Serverless Functions under the unified domain.

---

## 👥 Authors & Academic Submission
- **Project**: RADIX Talent Match – JSS Global Edition
- **Repository**: [https://github.com/guptajishorya-hash/Radix](https://github.com/guptajishorya-hash/Radix)
