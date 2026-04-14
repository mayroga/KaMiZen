# =========================
# KAMIZEN PRO ENGINE
# =========================

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
import uuid
import json
import random
import os

app = FastAPI()

# =========================
# STATIC
# =========================
app.mount("/static", StaticFiles(directory="static"), name="static")

# =========================
# LOAD CONTENT
# =========================
CONTENT_PATH = "static/kamizen_content.json"

def load_content():
    try:
        with open(CONTENT_PATH, "r", encoding="utf-8") as f:
            return json.load(f)["missions"]
    except Exception as e:
        print("[ERROR] JSON LOAD FAIL:", e)
        return []

MISSIONS = load_content()

# =========================
# SESSION MEMORY
# =========================
sessions = {}

def new_session():
    sid = str(uuid.uuid4())

    sessions[sid] = {
        "mission": 0,
        "block": 0,
        "xp": 0,
        "level": 1,
        "errors": 0,
        "achievements": [],
        "history": []
    }

    return sid

# =========================
# UTIL
# =========================
def get_current_block(session):
    try:
        mission = MISSIONS[session["mission"]]
        block = mission["blocks"][session["block"]]
        return mission, block
    except:
        return None, None

def next_block(session):
    session["block"] += 1

    if session["block"] >= len(MISSIONS[session["mission"]]["blocks"]):
        session["mission"] += 1
        session["block"] = 0

    if session["mission"] >= len(MISSIONS):
        return None

    return get_current_block(session)

# =========================
# RANDOM EVENT
# =========================
def random_event():
    return {
        "type": "event",
        "text_en": "⚠️ Unexpected situation! Someone challenges your confidence.",
        "text_es": "⚠️ Evento inesperado! Alguien desafía tu confianza.",
        "options": [
            {"code": "CONTROL", "text": {"en": "Stay calm", "es": "Mantener calma"}},
            {"code": "IMPULSE", "text": {"en": "React fast", "es": "Reaccionar rápido"}}
        ]
    }

# =========================
# ACHIEVEMENTS
# =========================
def check_achievements(session):
    unlocked = []

    if session["xp"] >= 50 and "first_xp" not in session["achievements"]:
        session["achievements"].append("first_xp")
        unlocked.append("First Control")

    if session["errors"] == 0 and session["mission"] >= 2:
        if "perfect_start" not in session["achievements"]:
            session["achievements"].append("perfect_start")
            unlocked.append("Perfect Mind")

    return unlocked

# =========================
# START
# =========================
@app.post("/start")
async def start():
    sid = new_session()
    session = sessions[sid]

    mission, block = get_current_block(session)

    return JSONResponse({
        "session_id": sid,
        "story": format_block(block),
        "xp": session["xp"],
        "level": session["level"],
        "identity": "You are starting your mental training"
    })

# =========================
# JUDGE
# =========================
@app.post("/judge")
async def judge(req: Request):
    data = await req.json()
    sid = data.get("session_id")
    decision = data.get("decision")

    if sid not in sessions:
        return JSONResponse({"error": "Invalid session"})

    session = sessions[sid]

    mission, block = get_current_block(session)

    correct = False

    # =========================
    # EVALUATE
    # =========================
    if block.get("type") in ["quiz", "tvid"]:
        for opt in block.get("options", []):
            if opt.get("code") == decision:
                correct = opt.get("correct", False)

    # =========================
    # XP SYSTEM
    # =========================
    if correct:
        session["xp"] += 10
    else:
        session["xp"] -= 5
        session["errors"] += 1

    # LEVEL UP
    if session["xp"] >= 100:
        session["level"] += 1
        session["xp"] = 0

    # =========================
    # FAIL STATE
    # =========================
    if session["errors"] >= 3:
        sessions.pop(sid)
        return JSONResponse({
            "story": {
                "type": "fail_state",
                "text_en": "You lost control. Restarting...",
                "text_es": "Perdiste el control. Reiniciando..."
            },
            "correct": False
        })

    # =========================
    # RANDOM EVENT (20%)
    # =========================
    if random.random() < 0.2:
        return JSONResponse({
            "story": random_event(),
            "xp": session["xp"],
            "level": session["level"],
            "correct": correct
        })

    # =========================
    # NEXT
    # =========================
    nxt = next_block(session)

    if not nxt:
        sessions.pop(sid)
        return JSONResponse({
            "story": {
                "type": "end",
                "text_en": "🏆 Training Complete. You are in control.",
                "text_es": "🏆 Entrenamiento completo. Estás en control."
            },
            "xp": session["xp"],
            "level": session["level"],
            "correct": True
        })

    mission, block = nxt

    # =========================
    # ACHIEVEMENTS
    # =========================
    achievements = check_achievements(session)

    identity = build_identity(session, correct)

    return JSONResponse({
        "story": format_block(block),
        "xp": session["xp"],
        "level": session["level"],
        "correct": correct,
        "achievements": achievements,
        "identity": identity
    })

# =========================
# FORMAT BLOCK
# =========================
def format_block(block):

    formatted = {
        "type": block.get("type"),
        "text_en": block.get("text", {}).get("en"),
        "text_es": block.get("text", {}).get("es"),
        "options": []
    }

    if block.get("type") in ["quiz", "tvid"]:
        for i, opt in enumerate(block.get("options", [])):
            formatted["options"].append({
                "code": opt.get("code", f"OPT{i}"),
                "text": opt.get("text", {})
            })

    if block.get("type") == "silence_challenge":
        formatted["duration_sec"] = block.get("duration_sec", 10)

    return formatted

# =========================
# IDENTITY ENGINE
# =========================
def build_identity(session, correct):

    if correct:
        return "You are gaining control"
    else:
        return "You are losing control"

# =========================
# ROOT
# =========================
@app.get("/")
async def root():
    return FileResponse("static/session.html")
