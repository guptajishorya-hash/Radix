"""
Role 6 — Live Mock Interview Simulator
Accepts skill gaps from Role 4 / Role 5 and generates adaptive technical
interview questions. Grades candidate answers on a 1-5 scale.

Works in 3 modes (auto-selected):
  1. OpenAI GPT-4o / GPT-3.5  (if OPENAI_API_KEY is set)
  2. Google Gemini              (if GEMINI_API_KEY / GOOGLE_API_KEY is set)
  3. Built-in rule-based engine (always works as fallback)
"""

import os
import re
import json
import random
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from dotenv import load_dotenv

load_dotenv()
router = APIRouter(prefix="/mock-interview", tags=["Mock Interview Simulator"])

# ─────────────────────────────────────────────────────────────────────────────
# Question Bank — 8–12 questions per RADIX skill category, company-branded
# ─────────────────────────────────────────────────────────────────────────────
QUESTION_BANK: dict[str, list[dict]] = {
    "DSA": [
        {"q": "Given a directed graph with N nodes, design an algorithm to detect all strongly connected components. What is its time complexity and why?", "topic": "Graph Algorithms", "level": "hard"},
        {"q": "You have an unsorted array of 10 million integers. Walk me through the most efficient sorting strategy and your reasoning for choosing it.", "topic": "Sorting", "level": "medium"},
        {"q": "Design a data structure that supports insert, delete, and getMax in O(1) amortized time. Explain your approach.", "topic": "Advanced Data Structures", "level": "hard"},
        {"q": "Explain dynamic programming using the coin-change problem. How would you optimise for space?", "topic": "Dynamic Programming", "level": "medium"},
        {"q": "What is the difference between DFS and BFS? When would you prefer one over the other in a production system?", "topic": "Graph Traversal", "level": "easy"},
        {"q": "How would you implement an LRU cache with O(1) get and put operations? Which data structures would you combine and why?", "topic": "Caching Structures", "level": "medium"},
    ],
    "COD": [
        {"q": "What are Python's GIL implications when writing concurrent code? How would you work around it for CPU-bound tasks?", "topic": "Python Concurrency", "level": "hard"},
        {"q": "Explain the difference between deep copy and shallow copy. Give a real-world scenario where getting this wrong causes a production bug.", "topic": "Language Fundamentals", "level": "medium"},
        {"q": "Walk me through how you'd refactor a 500-line function into clean, maintainable code. What principles guide your decisions?", "topic": "Code Quality", "level": "medium"},
        {"q": "Describe a bug that took you the longest to find. How did you eventually track it down?", "topic": "Debugging", "level": "easy"},
        {"q": "How do generators and iterators differ in Python? Build a memory-efficient pipeline using generators for processing 10GB of log data.", "topic": "Advanced Python", "level": "hard"},
    ],
    "OOD": [
        {"q": "Design the class hierarchy for a ride-sharing app like Uber. What design patterns would you use and why?", "topic": "System Class Design", "level": "hard"},
        {"q": "Explain the SOLID principles. Give me a real code example where violating the Single Responsibility Principle caused a maintenance nightmare.", "topic": "SOLID Principles", "level": "medium"},
        {"q": "What is the difference between composition and inheritance? When would you choose one over the other?", "topic": "OOP Fundamentals", "level": "easy"},
        {"q": "Implement the Observer design pattern for a real-time stock price notification system. What are its trade-offs at scale?", "topic": "Design Patterns", "level": "hard"},
        {"q": "How do you design an extensible payment system that supports multiple providers (Stripe, PayPal, Razorpay) without modifying core logic?", "topic": "Open/Closed Principle", "level": "hard"},
    ],
    "APTI": [
        {"q": "A train travels 300 km at 60 km/h and returns at 90 km/h. What is the average speed for the full trip? Walk me through your reasoning.", "topic": "Speed & Distance", "level": "easy"},
        {"q": "You have a 3L and a 5L jug. How do you measure exactly 4L of water? Now generalise your algorithm for any two jug sizes.", "topic": "Logical Reasoning", "level": "medium"},
        {"q": "In a town of 100,000 people, how many piano tuners are there? Walk me through your estimation strategy.", "topic": "Fermi Estimation", "level": "medium"},
        {"q": "There are 8 balls, one slightly heavier. You have a balance scale and can weigh only twice. How do you find the heavy ball?", "topic": "Puzzle Solving", "level": "hard"},
    ],
    "COMM": [
        {"q": "Describe a time you had to explain a complex technical decision to a non-technical stakeholder. What was your approach and what was the outcome?", "topic": "Technical Communication", "level": "medium"},
        {"q": "How would you write documentation for an internal API that junior engineers will rely on? What must it include?", "topic": "Documentation", "level": "easy"},
        {"q": "Your team disagrees on a technical approach. How do you facilitate alignment without derailing the project timeline?", "topic": "Team Collaboration", "level": "medium"},
        {"q": "You need to communicate a production outage to the CEO in 2 minutes. How do you structure that communication?", "topic": "Crisis Communication", "level": "hard"},
    ],
    "AI": [
        {"q": "Explain the attention mechanism in Transformers. Why was it a breakthrough over RNNs for sequence modelling?", "topic": "Transformers", "level": "hard"},
        {"q": "You're building a fraud detection system. The dataset is 99% non-fraudulent. How do you train a reliable model and which metrics matter?", "topic": "Imbalanced Classification", "level": "hard"},
        {"q": "What is the bias-variance trade-off? How do you diagnose which one is hurting your model's performance?", "topic": "ML Fundamentals", "level": "medium"},
        {"q": "Walk me through how you'd select features for a churn prediction model. What methods would you use and why?", "topic": "Feature Engineering", "level": "medium"},
        {"q": "How does backpropagation work at a mathematical level? What happens when gradients vanish?", "topic": "Neural Networks", "level": "hard"},
    ],
    "CLOUD": [
        {"q": "Design a multi-region active-active deployment on AWS. What services would you use and how do you handle data consistency across regions?", "topic": "Multi-Region Architecture", "level": "hard"},
        {"q": "Explain the difference between horizontal and vertical scaling. Design an auto-scaling policy for a web service that has 10x traffic spikes every evening.", "topic": "Auto-Scaling", "level": "medium"},
        {"q": "Walk me through a Kubernetes deployment strategy that ensures zero downtime during a rollout.", "topic": "Kubernetes", "level": "medium"},
        {"q": "What is a Service Mesh? When would you introduce Istio into an existing microservices cluster and what problems does it solve?", "topic": "Service Mesh", "level": "hard"},
    ],
    "SQL": [
        {"q": "Write a SQL query to find the second highest salary in an employees table, without using LIMIT or TOP. Explain your logic.", "topic": "Advanced SQL", "level": "medium"},
        {"q": "What is the N+1 query problem in ORMs? How do you detect and fix it in production?", "topic": "Query Optimisation", "level": "hard"},
        {"q": "Explain database normalisation up to 3NF. Give a real example of when you'd deliberately denormalise and why.", "topic": "Database Design", "level": "medium"},
        {"q": "What are ACID properties? Which one is hardest to achieve in a distributed database and how do modern systems handle it?", "topic": "Transactions", "level": "hard"},
        {"q": "How do indexes work under the hood in PostgreSQL? What types exist and how do you decide which one to create?", "topic": "Indexing", "level": "hard"},
    ],
    "SWE": [
        {"q": "Walk me through how you'd set up a CI/CD pipeline for a microservices application. What stages are non-negotiable?", "topic": "CI/CD", "level": "medium"},
        {"q": "Explain Test-Driven Development. Give a real example where writing tests first caught a critical design flaw early.", "topic": "TDD", "level": "medium"},
        {"q": "What is technical debt? Describe how you'd quantify and present technical debt to a product manager who only cares about features.", "topic": "Technical Debt", "level": "medium"},
        {"q": "How do you conduct a meaningful code review? What are the top 3 things you look for beyond correctness?", "topic": "Code Review", "level": "easy"},
    ],
    "SYSD": [
        {"q": "Design a URL shortener like bit.ly that handles 100 million URLs and 10 billion redirects per month. Walk through every component.", "topic": "URL Shortener Design", "level": "hard"},
        {"q": "How do you design a rate limiter for an API that serves 50,000 requests per second? What algorithm would you use?", "topic": "Rate Limiting", "level": "hard"},
        {"q": "Design the backend for a real-time collaborative document editor like Google Docs. How do you handle concurrent edits?", "topic": "Real-Time Systems", "level": "hard"},
        {"q": "What is the CAP theorem? Explain with a real system which trade-offs you'd make for a banking application vs a social media feed.", "topic": "Distributed Theory", "level": "medium"},
        {"q": "How do you design a notification system that must deliver to 500 million users within 30 seconds of an event?", "topic": "Fan-Out Architecture", "level": "hard"},
    ],
    "NETW": [
        {"q": "Walk me through exactly what happens — at every network layer — when you type 'google.com' and press Enter.", "topic": "Network Stack", "level": "medium"},
        {"q": "What is the difference between TCP and UDP? Design a multiplayer game that uses both strategically.", "topic": "Transport Protocols", "level": "medium"},
        {"q": "Explain how TLS 1.3 handshake works and why it's faster than TLS 1.2.", "topic": "Security Protocols", "level": "hard"},
        {"q": "What is a CDN and how does it reduce latency? What are the trade-offs when content needs to be invalidated immediately?", "topic": "CDN & Caching", "level": "medium"},
    ],
    "OS": [
        {"q": "Explain the difference between a process and a thread. Why is context switching expensive and how does the OS minimise it?", "topic": "Process Management", "level": "medium"},
        {"q": "What are the four conditions for a deadlock? Design a resource allocation strategy that prevents deadlock for a database connection pool.", "topic": "Deadlock Prevention", "level": "hard"},
        {"q": "How does virtual memory work? What is page thrashing and how do you detect it in production?", "topic": "Memory Management", "level": "hard"},
        {"q": "Explain the difference between mutexes, semaphores, and spinlocks. When would you use each one?", "topic": "Synchronisation Primitives", "level": "medium"},
    ],
}

COMPANY_PERSONAS: dict[str, dict] = {
    "Google LLC": {
        "manager": "Alex Chen",
        "title": "Senior Engineering Manager, Google Cloud Platform",
        "style": "data-driven and deeply technical",
        "values": "scalability, correctness, and elegant systems thinking",
        "greeting": "Welcome. At Google, we solve problems at a scale most engineers never see. I'm going to push you hard on fundamentals — the kind of depth that separates good engineers from exceptional ones. Ready?",
    },
    "Microsoft Corporation": {
        "manager": "Priya Sharma",
        "title": "Principal Engineering Manager, Azure DevOps",
        "style": "collaborative but rigorous, emphasising growth mindset",
        "values": "cloud excellence, teamwork, and inclusive design",
        "greeting": "Hi, I'm excited to speak with you. At Microsoft, we care deeply about both technical depth and collaborative impact. I'll be assessing your problem-solving approach as much as your answers. Let's dive in.",
    },
    "Oracle Financial Services Software": {
        "manager": "Rajesh Nair",
        "title": "Director of Engineering, Core Banking Platform",
        "style": "precision-focused, enterprise-grade standards",
        "values": "data integrity, regulatory compliance, and zero-tolerance for ambiguity",
        "greeting": "Good day. Oracle FSS powers the financial systems of the world's largest banks. I'll be probing your understanding of correctness, reliability, and SQL mastery. These are non-negotiable for us.",
    },
}

# ─────────────────────────────────────────────────────────────────────────────
# Grading Rubric
# ─────────────────────────────────────────────────────────────────────────────
SCORE_RUBRIC = {
    5: "Exceptional — complete, insightful, demonstrated deep expertise with real-world nuance.",
    4: "Strong — mostly correct with good reasoning; minor gaps in depth or precision.",
    3: "Adequate — core concepts identified but explanation lacks depth or has some inaccuracies.",
    2: "Weak — partial understanding; significant conceptual gaps or incorrect assumptions.",
    1: "Insufficient — fundamental misunderstanding or very little relevant content.",
}

SCORE_LABELS = {5: "🏆 Exceptional", 4: "✅ Strong", 3: "⚠️ Adequate", 2: "🔴 Weak", 1: "❌ Insufficient"}

# ─────────────────────────────────────────────────────────────────────────────
# AI Integration (OpenAI / Gemini / Rule-based fallback)
# ─────────────────────────────────────────────────────────────────────────────
def _get_ai_mode() -> str:
    if os.getenv("OPENAI_API_KEY"):
        return "openai"
    if os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY"):
        return "gemini"
    return "rule_based"


def _call_openai(system_prompt: str, user_prompt: str) -> str:
    from openai import OpenAI
    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    resp = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        max_tokens=600,
        temperature=0.7,
    )
    return resp.choices[0].message.content.strip()


def _call_gemini(system_prompt: str, user_prompt: str) -> str:
    import httpx
    key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    payload = {
        "contents": [{"parts": [{"text": f"{system_prompt}\n\n{user_prompt}"}]}],
        "generationConfig": {"maxOutputTokens": 600, "temperature": 0.7},
    }
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={key}"
    r = httpx.post(url, json=payload, timeout=15.0)
    if r.status_code == 200:
        return r.json()["candidates"][0]["content"]["parts"][0]["text"].strip()
    raise Exception(f"Gemini error {r.status_code}: {r.text}")


def _rule_based_grade(question: str, answer: str, category_code: str) -> dict:
    """
    Deterministic grader when no AI key is available.
    Scores based on answer length, keyword coverage, and coherence signals.
    """
    answer_lower = answer.lower().strip()
    words = answer_lower.split()
    word_count = len(words)

    # Length signal
    if word_count < 10:
        base_score = 1
    elif word_count < 30:
        base_score = 2
    elif word_count < 70:
        base_score = 3
    elif word_count < 150:
        base_score = 4
    else:
        base_score = 5

    # Keyword bonus
    CAT_KEYWORDS = {
        "DSA": ["complexity", "o(", "algorithm", "tree", "graph", "hash", "sort", "queue", "stack"],
        "OOD": ["solid", "pattern", "inherit", "polymorphi", "interface", "abstract", "class", "encapsul"],
        "SYSD": ["scale", "load balanc", "database", "cache", "microservice", "latency", "throughput", "shard"],
        "SQL": ["join", "index", "query", "normal", "acid", "transaction", "table", "foreign key"],
        "CLOUD": ["aws", "azure", "gcp", "docker", "kubernetes", "container", "serverless", "deploy"],
        "AI": ["model", "train", "loss", "neural", "feature", "gradient", "overfit", "accuracy"],
        "OS": ["process", "thread", "deadlock", "memory", "page", "semaphor", "mutex", "kernel"],
        "NETW": ["tcp", "udp", "http", "dns", "latency", "packet", "protocol", "handshake"],
        "COD": ["function", "class", "loop", "debug", "refactor", "test", "async", "exception"],
        "SWE": ["agile", "ci/cd", "test", "git", "review", "deploy", "sprint", "pipeline"],
        "APTI": ["because", "therefore", "logic", "reason", "step", "approach", "solution"],
        "COMM": ["team", "stakeholder", "explain", "document", "clear", "feedback", "communicate"],
    }
    kws = CAT_KEYWORDS.get(category_code, [])
    keyword_hits = sum(1 for kw in kws if kw in answer_lower)
    bonus = min(2, keyword_hits // 2)
    score = max(1, min(5, base_score + bonus - (1 if word_count < 20 else 0)))

    feedbacks = {
        5: f"Excellent depth. You demonstrated strong command of {category_code} concepts with concrete examples. A strong hire signal.",
        4: f"Good answer with solid core reasoning. Consider adding more specifics — benchmarks, edge cases, or trade-offs would elevate this further.",
        3: f"You identified the right territory but the explanation lacks precision. Try to go deeper on the 'why' and real-world implications.",
        2: f"The answer shows surface-level familiarity. A stronger candidate would explain the underlying mechanism and trade-offs more clearly.",
        1: f"This answer needs significant development. Focus on studying the core principles of {category_code} before your next interview.",
    }

    improvement = {
        5: "You could mention edge cases or failure scenarios to demonstrate senior-level thinking.",
        4: "Quantify your claims where possible — 'O(log n)' is more impressive than 'fast'.",
        3: "Practise explaining these concepts out loud. Clarity of communication is as important as correctness.",
        2: "I'd recommend reviewing fundamentals with worked examples before your next screen.",
        1: "Study the topic with hands-on coding practice, not just theory.",
    }

    return {
        "score": score,
        "score_label": SCORE_LABELS[score],
        "rubric": SCORE_RUBRIC[score],
        "feedback": feedbacks[score],
        "improvement_tip": improvement[score],
        "graded_by": "rule_based_engine",
    }


def _ai_grade(question: str, answer: str, category_code: str, company: str, history: list) -> dict:
    """Grade answer using available AI (OpenAI → Gemini → rule-based fallback)."""
    mode = _get_ai_mode()

    if mode == "rule_based":
        return _rule_based_grade(question, answer, category_code)

    persona = COMPANY_PERSONAS.get(company, COMPANY_PERSONAS["Google LLC"])
    system_prompt = f"""You are {persona['manager']}, {persona['title']} at {company}.
You are conducting a technical screening for a software engineering role.
Your style is {persona['style']}. You value {persona['values']}.

Grade the candidate's answer strictly and professionally on a 1-5 scale:
5 = Exceptional, 4 = Strong, 3 = Adequate, 2 = Weak, 1 = Insufficient

Respond ONLY with a JSON object in this exact format:
{{
  "score": <integer 1-5>,
  "score_label": "<label>",
  "feedback": "<2-3 sentence professional feedback from your perspective as {persona['manager']}>",
  "improvement_tip": "<one specific, actionable improvement suggestion>",
  "follow_up_probe": "<one sharper follow-up question if you want to dig deeper (or empty string if answer was exceptional)>",
  "graded_by": "ai"
}}"""

    user_prompt = f"""Question ({category_code}): {question}

Candidate's Answer: {answer}

Grade this answer."""

    try:
        if mode == "openai":
            raw = _call_openai(system_prompt, user_prompt)
        else:
            raw = _call_gemini(system_prompt, user_prompt)

        # Extract JSON from response
        match = re.search(r'\{.*\}', raw, re.DOTALL)
        if match:
            result = json.loads(match.group())
            score = max(1, min(5, int(result.get("score", 3))))
            result["score"] = score
            result["score_label"] = SCORE_LABELS.get(score, result.get("score_label", ""))
            result["rubric"] = SCORE_RUBRIC[score]
            return result
        else:
            raise ValueError("No JSON in AI response")

    except Exception as e:
        print(f"[MockInterview] AI grade error ({mode}): {e}. Falling back to rule-based.")
        return _rule_based_grade(question, answer, category_code)


def _pick_question(category_code: str, used_indices: list[int]) -> dict | None:
    bank = QUESTION_BANK.get(category_code, [])
    available = [(i, q) for i, q in enumerate(bank) if i not in used_indices]
    if not available:
        return None
    idx, q = random.choice(available)
    return {"index": idx, "category_code": category_code, **q}


def _ai_generate_question(category_code: str, company: str, gap_context: str) -> str | None:
    """Try to generate a fresh contextual question via AI."""
    mode = _get_ai_mode()
    if mode == "rule_based":
        return None

    persona = COMPANY_PERSONAS.get(company, COMPANY_PERSONAS["Google LLC"])
    system_prompt = f"""You are {persona['manager']}, {persona['title']} at {company}.
Generate ONE challenging technical interview question about {category_code} that is highly relevant to this candidate's gap: {gap_context}.
The question should reflect real problems faced at {company}.
Respond with ONLY the question text — no preamble, no numbering."""

    try:
        if mode == "openai":
            return _call_openai(system_prompt, f"Generate a {category_code} question for {company}.")
        else:
            return _call_gemini(system_prompt, f"Generate a {category_code} question for {company}.")
    except Exception:
        return None


# ─────────────────────────────────────────────────────────────────────────────
# Pydantic Models
# ─────────────────────────────────────────────────────────────────────────────
class StartSessionRequest(BaseModel):
    company: str
    candidate_name: str = "Candidate"
    skill_gaps: list[dict]   # [{category_code, category_label, required_level, candidate_level, gap}]
    role: str = "Software Engineer"


class SubmitAnswerRequest(BaseModel):
    session_id: str
    question: str
    category_code: str
    company: str
    candidate_answer: str
    history: list[dict] = []


class NextQuestionRequest(BaseModel):
    session_id: str
    company: str
    skill_gaps: list[dict]
    used_categories: list[str] = []
    used_indices: dict[str, list[int]] = {}
    question_number: int = 1


# ─────────────────────────────────────────────────────────────────────────────
# Endpoints
# ─────────────────────────────────────────────────────────────────────────────
@router.post("/start")
async def start_session(req: StartSessionRequest):
    """
    Kick off a mock interview session.
    Returns persona intro + first question targeting the worst skill gap.
    """
    persona = COMPANY_PERSONAS.get(req.company, {
        "manager": "Jordan Lee",
        "title": "Engineering Manager",
        "style": "thorough and structured",
        "values": "technical excellence",
        "greeting": "Welcome to this technical screen. Let's assess your skills.",
    })

    # Find the worst gap (largest difference between required and candidate level)
    gaps = [g for g in req.skill_gaps if g.get("gap") is True]
    if not gaps:
        gaps = req.skill_gaps  # Use all if nothing flagged

    # Sort by severity
    gaps_sorted = sorted(gaps, key=lambda g: (g.get("required_level", 7) - g.get("candidate_level", 4)), reverse=True)
    target_gap = gaps_sorted[0] if gaps_sorted else {"category_code": "DSA", "category_label": "Data Structures & Algorithms"}
    category_code = target_gap.get("category_code", "DSA")
    gap_context = f"required level {target_gap.get('required_level', 7)}, candidate scored {target_gap.get('candidate_level', 4)}"

    # Try AI-generated question first, fall back to bank
    ai_q = _ai_generate_question(category_code, req.company, gap_context)
    question_obj = _pick_question(category_code, [])
    question_text = ai_q if ai_q else (question_obj["q"] if question_obj else f"Explain a fundamental concept of {category_code} and a time you applied it.")
    question_topic = question_obj.get("topic", category_code) if question_obj else category_code
    question_idx = question_obj.get("index", 0) if question_obj else 0

    import uuid
    session_id = str(uuid.uuid4())[:8]

    return {
        "session_id": session_id,
        "company": req.company,
        "candidate_name": req.candidate_name,
        "role": req.role,
        "ai_mode": _get_ai_mode(),
        "persona": {
            "name": persona["manager"],
            "title": persona["title"],
            "company": req.company,
            "greeting": persona["greeting"],
        },
        "total_questions": min(5, len(gaps_sorted)),
        "question_number": 1,
        "question": {
            "text": question_text,
            "category_code": category_code,
            "category_label": target_gap.get("category_label", category_code),
            "topic": question_topic,
            "gap_context": gap_context,
            "index": question_idx,
        },
        "session_gaps": [{"category_code": g.get("category_code"), "category_label": g.get("category_label", g.get("category_code")), "required_level": g.get("required_level"), "candidate_level": g.get("candidate_level")} for g in gaps_sorted[:5]],
    }


@router.post("/grade")
async def grade_answer(req: SubmitAnswerRequest):
    """Grade a candidate's answer and return score + feedback."""
    if not req.candidate_answer.strip():
        raise HTTPException(status_code=400, detail="Answer cannot be empty.")

    result = _ai_grade(
        question=req.question,
        answer=req.candidate_answer,
        category_code=req.category_code,
        company=req.company,
        history=req.history,
    )

    return {
        "session_id": req.session_id,
        "question": req.question,
        "category_code": req.category_code,
        "answer_preview": req.candidate_answer[:200] + ("…" if len(req.candidate_answer) > 200 else ""),
        "ai_mode": _get_ai_mode(),
        **result,
    }


@router.post("/next-question")
async def get_next_question(req: NextQuestionRequest):
    """Pick the next question targeting a different skill gap."""
    gaps = [g for g in req.skill_gaps if g.get("gap") is True or True]
    gaps_sorted = sorted(gaps, key=lambda g: (g.get("required_level", 7) - g.get("candidate_level", 4)), reverse=True)

    # Rotate through gaps — avoid repeating same category if possible
    target_gap = None
    for gap in gaps_sorted:
        cat = gap.get("category_code", "DSA")
        used_for_cat = req.used_indices.get(cat, [])
        bank = QUESTION_BANK.get(cat, [])
        if len(used_for_cat) < len(bank):
            target_gap = gap
            break

    if not target_gap:
        target_gap = gaps_sorted[0] if gaps_sorted else {"category_code": "DSA", "category_label": "DSA"}

    category_code = target_gap.get("category_code", "DSA")
    used = req.used_indices.get(category_code, [])
    gap_context = f"required level {target_gap.get('required_level', 7)}, candidate at {target_gap.get('candidate_level', 4)}"

    ai_q = _ai_generate_question(category_code, req.company, gap_context)
    question_obj = _pick_question(category_code, used)
    question_text = ai_q if ai_q else (question_obj["q"] if question_obj else f"Explain a core concept of {category_code}.")
    question_topic = question_obj.get("topic", category_code) if question_obj else category_code
    question_idx = question_obj.get("index", 0) if question_obj else 0

    return {
        "question_number": req.question_number,
        "question": {
            "text": question_text,
            "category_code": category_code,
            "category_label": target_gap.get("category_label", category_code),
            "topic": question_topic,
            "gap_context": gap_context,
            "index": question_idx,
        },
    }


@router.get("/personas")
async def get_personas():
    """Returns available company interviewer personas."""
    return {
        "personas": [
            {"company": k, "manager": v["manager"], "title": v["title"], "style": v["style"]}
            for k, v in COMPANY_PERSONAS.items()
        ]
    }
