from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
import os
import json

app = FastAPI()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(BASE_DIR, "static")

app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

# =========================
# 🧠 GLOBAL CONFIG
# =========================
MAX_LEVEL = 35

CACHE = {
    "stories": None,
    "missions": None
}

STATE = {
    "user": "",
    "index": 1,   # GLOBAL INDEX (1–35)
    "score": 0
}

# =========================
# 📦 LOAD JSON
# =========================
def load_json(path):
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except:
        return None

# =========================
# 📖 STORIES
# =========================
def load_stories():
    if CACHE["stories"] is not None:
        return CACHE["stories"]

    path = os.path.join(BASE_DIR, "stories.json")
    data = load_json(path)

    stories = data.get("stories", []) if isinstance(data, dict) else []

    stories = sorted(stories, key=lambda x: x.get("id", 0))

    CACHE["stories"] = stories
    return stories

# =========================
# 🎯 MISSIONS (MULTI FILE SAFE)
# =========================
def load_missions():
    if CACHE["missions"] is not None:
        return CACHE["missions"]

    all_missions = []

    for file in sorted(os.listdir(BASE_DIR)):
        if file.startswith("missions_") and file.endswith(".json"):
            data = load_json(os.path.join(BASE_DIR, file))

            if not data:
                continue

            missions = data.get("missions") or data.get("ses") or []

            if isinstance(missions, list):
                all_missions.extend(missions)

    all_missions = sorted(all_missions, key=lambda x: x.get("id", 0))

    CACHE["missions"] = all_missions
    return all_missions

# =========================
# 🔁 GLOBAL INDEX CONTROL
# =========================
def safe_index():
    """FORZAR LOOP 1–35"""
    if STATE["index"] > MAX_LEVEL:
        STATE["index"] = 1
    if STATE["index"] < 1:
        STATE["index"] = 1
    return STATE["index"]

# =========================
# 🌐 FRONTEND
# =========================
@app.get("/")
def root():
    return FileResponse(os.path.join(STATIC_DIR, "session.html"))

# =========================
# 📖 STORIES API
# =========================
@app.get("/api/stories")
def get_stories():
    return {
        "total": len(load_stories()),
        "stories": load_stories()
    }

# =========================
# 🎯 MISSIONS API (SYNCED)
# =========================
@app.get("/api/missions")
def get_missions():
    missions = load_missions()

    idx = safe_index()

    return {
        "global_index": idx,
        "total": len(missions),
        "mission": missions[idx - 1] if idx - 1 < len(missions) else None
    }

# =========================
# 🔄 NEXT STEP CONTROL
# =========================
@app.post("/api/next")
def next_step():
    STATE["index"] += 1

    if STATE["index"] > MAX_LEVEL:
        STATE["index"] = 1  # 🔁 RESET LOOP

    return {
        "index": STATE["index"],
        "reset": STATE["index"] == 1
    }

# =========================
# 🧠 STATE
# =========================
@app.get("/api/state")
def get_state():
    return STATE

@app.post("/api/state")
def update_state(data: dict):
    STATE.update(data)
    return STATE

# =========================
# ▶ RUN
# =========================
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
