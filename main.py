from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
import os
import json

# =========================================================
# 🚀 APP CORE
# =========================================================
app = FastAPI(title="KAMIZEN LIFE SYSTEM")

# =========================================================
# 📁 PATHS
# =========================================================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(BASE_DIR, "static")

app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

# =========================================================
# 🧠 CACHE SYSTEM (ANTI OVERLOAD / NO FREEZE)
# =========================================================
CACHE = {
    "stories": None,
    "missions": None,
    "exam": None
}

# =========================================================
# 🔍 SAFE JSON LOADER
# =========================================================
def load_json(path):
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"❌ JSON ERROR: {path} -> {e}")
        return None

# =========================================================
# 📖 STORIES LOADER
# =========================================================
def load_stories():

    if CACHE["stories"] is not None:
        return CACHE["stories"]

    path = os.path.join(BASE_DIR, "stories.json")
    data = load_json(path)

    stories = []

    if isinstance(data, dict):
        stories = data.get("stories", [])
    elif isinstance(data, list):
        stories = data

    stories = sorted(
        [s for s in stories if isinstance(s, dict) and "id" in s],
        key=lambda x: x["id"]
    )

    CACHE["stories"] = stories
    return stories

# =========================================================
# 🎯 MISSIONS LOADER (1–35 SYSTEM CORE)
# =========================================================
def load_missions():

    if CACHE["missions"] is not None:
        return CACHE["missions"]

    all_missions = []

    files = sorted([
        f for f in os.listdir(BASE_DIR)
        if f.startswith("missions_") and f.endswith(".json")
    ])

    for file in files:

        path = os.path.join(BASE_DIR, file)
        data = load_json(path)

        if not data:
            continue

        missions = data.get("missions", []) if isinstance(data, dict) else data

        for m in missions:
            if isinstance(m, dict) and "id" in m:
                all_missions.append(m)

    all_missions = sorted(all_missions, key=lambda x: x["id"])

    CACHE["missions"] = {
        "total": len(all_missions),
        "missions": all_missions
    }

    return CACHE["missions"]

# =========================================================
# 🧠 EXAM SYSTEM LOADER (OPTIONAL MODULE)
# =========================================================
def load_exam_system():

    if CACHE["exam"] is not None:
        return CACHE["exam"]

    exam_files = [
        "exam36-42.json",
        "exam43-49.json"
    ]

    all_exam_missions = []

    for file in exam_files:

        path = os.path.join(BASE_DIR, file)
        data = load_json(path)

        if not data:
            continue

        missions = data.get("missions", [])

        for m in missions:
            if isinstance(m, dict) and "id" in m:
                all_exam_missions.append(m)

    all_exam_missions = sorted(all_exam_missions, key=lambda x: x["id"])

    CACHE["exam"] = {
        "total": len(all_exam_missions),
        "missions": all_exam_missions,
        "mode": "How to React Before & During Exams"
    }

    return CACHE["exam"]

# =========================================================
# 🌐 FRONTEND ROUTES
# =========================================================
@app.get("/")
def root():
    return FileResponse(os.path.join(STATIC_DIR, "session.html"))

@app.get("/session")
def session():
    return FileResponse(os.path.join(STATIC_DIR, "session.html"))

# =========================================================
# 📖 API STORIES
# =========================================================
@app.get("/api/stories")
def get_stories():
    return {
        "total": len(load_stories()),
        "stories": load_stories()
    }

# =========================================================
# 🎯 API MISSIONS (CORE SYSTEM 1–35)
# =========================================================
@app.get("/api/missions")
def get_missions():
    return load_missions()

# =========================================================
# 🧠 API EXAM MODE (OPTIONAL MODULE)
# =========================================================
@app.get("/api/exam")
def get_exam():
    return load_exam_system()

# =========================================================
# 🔍 SINGLE MISSION
# =========================================================
@app.get("/api/missions/{mission_id}")
def get_mission(mission_id: int):

    missions = load_missions()["missions"]

    for m in missions:
        if m.get("id") == mission_id:
            return m

    raise HTTPException(status_code=404, detail="Mission not found")

# =========================================================
# 🧠 STATE SYSTEM (USER PROGRESS)
# =========================================================
STATE = {
    "user": "",
    "story_index": 0,
    "mission_index": 1,
    "score": 0,
    "exam_mode": False
}

@app.get("/api/state")
def get_state():
    return STATE

@app.post("/api/state")
def update_state(data: dict):
    STATE.update(data)
    return {
        "ok": True,
        "state": STATE
    }

# =========================================================
# 🧪 HEALTH CHECK
# =========================================================
@app.get("/health")
def health():
    return {"status": "ok"}

# =========================================================
# 🚀 RUN SERVER
# =========================================================
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
