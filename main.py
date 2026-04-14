from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
import uuid, json, time, random, os

app = FastAPI()

app.mount("/static", StaticFiles(directory="static"), name="static")

with open("static/kamizen_content.json", "r", encoding="utf-8") as f:
    GAME = json.load(f)["missions"]

SESSIONS = {}
RANKING = {}

# =========================
# UTIL
# =========================
def norm(x):
    return x.strip().upper() if isinstance(x, str) else x

# =========================
# START
# =========================
@app.post("/start")
async def start(req: Request):
    data = await req.json()
    sid = str(uuid.uuid4())

    SESSIONS[sid] = {
        "i": 0,
        "xp": 0,
        "errors": 0,
        "streak": 0,
        "lang": data.get("profile", {}).get("lang", "es")
    }

    return {
        "session_id": sid,
        "story": build(0, SESSIONS[sid])
    }

# =========================
# JUDGE
# =========================
@app.post("/judge")
async def judge(req: Request):
    data = await req.json()
    sid = data["session_id"]
    decision = data["decision"]

    s = SESSIONS[sid]
    mission = GAME[s["i"]]

    tvid = next(b for b in mission["blocks"] if b["type"] == "tvid")

    chosen = None
    correct = False
    reason = None

    for o in tvid["options"]:
        if norm(o["code"]) == norm(decision):
            chosen = o
            correct = o["correct"]
            reason = o.get("reason", None)

    # ================= XP SYSTEM =================
    if correct:
        s["xp"] += 10
        s["streak"] += 1
    else:
        s["xp"] -= 5
        s["errors"] += 1
        s["streak"] = 0

    # ================= SOFT CONSEQUENCE =================
    if s["errors"] >= 5:
        s["xp"] = max(0, s["xp"] - 15)
        s["errors"] = 0

    # ================= NEXT =================
    s["i"] += 1
    next_m = GAME[s["i"]] if s["i"] < len(GAME) else None

    RANKING[sid] = s["xp"]

    return {
        "story": build(s["i"], s),
        "xp": s["xp"],
        "streak": s["streak"],
        "errors": s["errors"],
        "correct": correct,
        "reason": reason,
        "semaphore": "green" if correct else "red",
        "timer": get_timer(next_m),
        "rank": get_rank(sid),
        "voice": True
    }

# =========================
# STORY BUILDER
# =========================
def build(i, s):
    if i >= len(GAME):
        return {
            "type": "end",
            "text_es": "Sesión completada. Respira y reflexiona.",
            "text_en": "Session completed. Breathe and reflect."
        }

    m = GAME[i]

    story = ""
    options = []
    timer = 20

    for b in m["blocks"]:
        if b["type"] == "story":
            story = b["text"][s["lang"]]
        if b["type"] == "tvid":
            options = b["options"]
        if b["type"] == "silence_challenge":
            timer = b["duration_sec"]

    return {
        "text_es": story,
        "text_en": story,
        "options": options,
        "timer": timer,
        "level": m["level"],
        "theme": m["theme"]
    }

# =========================
def get_timer(m):
    if not m: return 15
    for b in m["blocks"]:
        if b["type"] == "silence_challenge":
            return b["duration_sec"]
    return 15

# =========================
def get_rank(sid):
    sorted_r = sorted(RANKING.items(), key=lambda x: x[1], reverse=True)
    for i,(k,v) in enumerate(sorted_r):
        if k == sid:
            return i+1
    return len(sorted_r)

# =========================
@app.get("/")
def root():
    return FileResponse("static/session.html")
