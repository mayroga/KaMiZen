from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
import uuid
import json
import time
import random
import os

app = FastAPI()

# =========================
# STATIC
# =========================
if not os.path.exists("static"):
    os.makedirs("static")

app.mount("/static", StaticFiles(directory="static"), name="static")

# =========================
# LOAD GAME CONTENT
# =========================
with open("static/kamizen_content.json", "r", encoding="utf-8") as f:
    GAME_DATA = json.load(f)["missions"]

# =========================
# MEMORY SYSTEM
# =========================
SESSIONS = {}
RANKING = {}

# =========================
# XP SYSTEM CONFIG
# =========================
XP_CORRECT = 10
XP_WRONG = -5

# =========================
# START SESSION
# =========================
@app.post("/start")
async def start_game(request: Request):
    data = await request.json()
    lang = data.get("profile", {}).get("lang", "es")

    session_id = str(uuid.uuid4())

    SESSIONS[session_id] = {
        "index": 0,
        "xp": 0,
        "errors": 0,
        "start_time": time.time(),
        "lang": lang,
        "history": []
    }

    mission = GAME_DATA[0]

    return JSONResponse({
        "session_id": session_id,
        "story": build_story(mission, 0, lang)
    })


# =========================
# JUDGE ANSWER
# =========================
@app.post("/judge")
async def judge(request: Request):
    data = await request.json()

    session_id = data["session_id"]
    decision = data["decision"]

    if session_id not in SESSIONS:
        return JSONResponse({"error": "invalid session"})

    session = SESSIONS[session_id]
    index = session["index"]

    if index >= len(GAME_DATA):
        return JSONResponse({"end": True})

    mission = GAME_DATA[index]
    tvid = get_tvid(mission)

    result = None
    correct = False

    for opt in tvid["options"]:
        if opt["code"] == decision:
            correct = opt["correct"]
            result = opt
            break

    # =========================
    # XP LOGIC (FIXED)
    # =========================
    if correct:
        session["xp"] += XP_CORRECT
        feedback_type = "success"
    else:
        session["xp"] += XP_WRONG
        session["errors"] += 1
        feedback_type = "fail"

    # =========================
    # NO HARD RESET (FIX IMPORTANT)
    # =========================
    if session["errors"] >= 5:
        session["errors"] = 0
        session["xp"] = max(0, session["xp"] - 20)
        feedback_type = "warning"

    # =========================
    # NEXT STEP
    # =========================
    session["index"] += 1

    next_mission = GAME_DATA[session["index"]] if session["index"] < len(GAME_DATA) else None

    # =========================
    # RANKING UPDATE
    # =========================
    RANKING[session_id] = session["xp"]

    return JSONResponse({
        "story": build_story(next_mission, session["index"], session["lang"]) if next_mission else {
            "type": "end",
            "text_es": "Sesión completada. Respira y reflexiona.",
            "xp": session["xp"]
        },
        "xp": session["xp"],
        "errors": session["errors"],
        "feedback": feedback_type,
        "timer": get_timer(next_mission),
        "rank": get_rank(session_id)
    })


# =========================
# STORY BUILDER
# =========================
def build_story(mission, index, lang):
    if not mission:
        return None

    # safe extraction
    blocks = mission.get("blocks", [])

    story_text = ""
    options = []
    story_type = "normal"
    timer = 20

    for b in blocks:
        if b["type"] == "story":
            story_text = b["text"].get(lang, "")
        if b["type"] == "tvid":
            options = b["options"]
        if b["type"] == "silence_challenge":
            story_type = "silence"
            timer = b.get("duration_sec", 20)

    return {
        "text_es": story_text,
        "type": story_type,
        "options": options,
        "timer": timer,
        "level": mission["level"],
        "theme": mission["theme"]
    }


# =========================
# HELPERS
# =========================
def get_tvid(mission):
    for b in mission["blocks"]:
        if b["type"] == "tvid":
            return b
    return {"options": []}


def get_timer(mission):
    if not mission:
        return 0
    for b in mission["blocks"]:
        if b["type"] == "silence_challenge":
            return b.get("duration_sec", 20)
    return 15


def get_rank(session_id):
    sorted_rank = sorted(RANKING.items(), key=lambda x: x[1], reverse=True)

    for i, (sid, xp) in enumerate(sorted_rank):
        if sid == session_id:
            return i + 1

    return len(sorted_rank) + 1


# =========================
# RANKING GLOBAL
# =========================
@app.get("/ranking")
async def ranking():
    sorted_rank = sorted(RANKING.items(), key=lambda x: x[1], reverse=True)

    return JSONResponse([
        {"session": k, "xp": v, "rank": i + 1}
        for i, (k, v) in enumerate(sorted_rank)
    ])


# =========================
# ROOT
# =========================
@app.get("/")
async def root():
    return FileResponse("static/session.html")
