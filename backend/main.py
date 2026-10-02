import os
import httpx
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="FriendStudy AI")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434/api/generate")
MODEL = os.getenv("OLLAMA_MODEL", "qwen2.5:3b")

class AskRequest(BaseModel):
    question: str
    subjects: list[dict]
    hours: int

class PlanRequest(BaseModel):
    subjects: list[dict]
    hours: int
    exam_date: str

class QuizRequest(BaseModel):
    subject: str
    topic: str
    count: int = 5
    difficulty: str = "medium"

async def ask_ollama(prompt: str) -> str:
    payload = {
        "model": MODEL,
        "prompt": prompt,
        "stream": False,
        "options": {"temperature": 0.4}
    }
    async with httpx.AsyncClient(timeout=120) as client:
        response = await client.post(OLLAMA_URL, json=payload)
        response.raise_for_status()
        return response.json().get("response", "").strip()

@app.get("/api/health")
async def health():
    return {"status": "ok", "model": MODEL}

@app.post("/api/ask")
async def ask(data: AskRequest):
    subjects = ", ".join(
        f"{s['name']} ({'weak' if s.get('weak') else 'normal'})"
        for s in data.subjects
    )
    prompt = f"""You are FriendStudy AI, a patient study companion.
Student subjects: {subjects}
Daily study time: {data.hours} hours.
Question: {data.question}

Answer clearly for a college student. Use simple language, a short example, and finish with one practice question.
Do not pretend to know facts you are unsure about."""
    try:
        answer = await ask_ollama(prompt)
        return {"answer": answer, "source": "local open-weight model"}
    except Exception:
        return {"answer": "i could not reach the local open-weight model. make sure ollama is running with qwen2.5:3b.", "source": "fallback"}

@app.post("/api/plan")
async def plan(data: PlanRequest):
    subjects = ", ".join(
        f"{s['name']} ({'weak topic' if s.get('weak') else 'normal'})"
        for s in data.subjects
    )
    prompt = f"""You are FriendStudy AI.
Create a practical study plan for a college student.
Subjects: {subjects}
Daily available time: {data.hours} hours.
Exam date: {data.exam_date}.

Return:
1. today's 3-4 study blocks with minutes
2. what to prioritize and why
3. a small revision task
Keep it realistic and concise."""
    try:
        answer = await ask_ollama(prompt)
        return {"answer": answer, "source": "local open-weight model"}
    except Exception:
        return {"answer": "i could not generate the plan. make sure ollama is running with qwen2.5:3b.", "source": "fallback"}

@app.post("/api/quiz")
async def quiz(data: QuizRequest):
    prompt = f"""You are FriendStudy AI creating a college study quiz.
Subject: {data.subject}
Topic: {data.topic}
Difficulty: {data.difficulty}
Number of questions: {data.count}

Create exactly {data.count} multiple-choice questions.
For every question use this format:
Q1. question
A. option
B. option
C. option
D. option
Answer: A
Explanation: one short explanation

Do not add an introduction or conclusion."""
    try:
        answer = await ask_ollama(prompt)
        return {"answer": answer, "source": "local open-weight model"}
    except Exception:
        return {"answer": "i could not generate the quiz. make sure ollama is running with qwen2.5:3b.", "source": "fallback"}
