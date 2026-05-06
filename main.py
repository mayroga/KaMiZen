from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
import os
import json

app = FastAPI()

# =========================
# 📁 PATHS
# =========================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(BASE_DIR, "static")

app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

# =========================
# 🧠 CACHE
# =========================
CACHE = {
    "stories": None,
    "missions": None
}

# =========================
# 🔍 SAFE JSON LOADER
# =========================
def load_json(path):
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"❌ JSON ERROR: {path} -> {e}")
        return None

# =========================
# 📖 STORIES LOADER (STRICT)
# =========================
def load_stories():
    if CACHE["stories"] is not None:
        return CACHE["stories"]

    path = os.path.join(BASE_DIR, "stories.json")

    data = load_json(path)

    if not data:
        CACHE["stories"] = []
        return []

    # soporta varios formatos posibles
    if isinstance(data, list):
        stories = data
    elif isinstance(data, dict):
        stories = (
            data.get("stories") or
            data.get("items") or
            data.get("data") or
            []
        )
    else:
        stories = []

    # asegurar orden por id si existe
    try:
        stories = sorted(stories, key=lambda x: x.get("id", 0))
    except:
        pass

    CACHE["stories"] = stories
    return stories

# =========================
# 🎯 MISSIONS LOADER (MULTI FILES)
# =========================
def load_missions():
    if CACHE["missions"] is not None:
        return CACHE["missions"]

    all_missions = []

    for file in sorted(os.listdir(BASE_DIR)):
        if file.startswith("missions_") and file.endswith(".json"):
            path = os.path.join(BASE_DIR, file)

            data = load_json(path)

            if not data:
                continue

            # soporta ambos formatos
            missions = (
                data.get("missions") or
                data.get("ses") or
                data.get("data") or
                []
            )

            if isinstance(missions, list):
                all_missions.extend(missions)

    # ordenar por id (IMPORTANTE)
    try:
        all_missions = sorted(all_missions, key=lambda x: x.get("id", 0))
    except:
        pass

    CACHE["missions"] = {
        "total": len(all_missions),
        "missions": all_missions
    }

    return CACHE["missions"]

# =========================
# 🌐 ROUTES FRONTEND
# =========================
@app.get("/")
def root():
    return FileResponse(os.path.join(STATIC_DIR, "session.html"))

@app.get("/session")
def session():
    return FileResponse(os.path.join(STATIC_DIR, "session.html"))

# =========================
# 📖 API STORIES
# =========================
@app.get("/api/stories")
def get_stories():
    stories = load_stories()

    return JSONResponse({
        "total": len(stories),
        "stories": stories
    })

# =========================
# 🎯 API MISSIONS
# =========================
@app.get("/api/missions")
def get_missions():
    missions = load_missions()

    return JSONResponse(missions)

# =========================
# 🔍 SINGLE MISSION
# =========================
@app.get("/api/missions/{mission_id}")
def get_mission(mission_id: int):
    missions = load_missions()["missions"]

    for m in missions:
        if m.get("id") == mission_id:
            return m

    raise HTTPException(status_code=404, detail="Mission not found")

# =========================
# 🧠 STATE SYSTEM
# =========================
STATE = {
    "user": "",
    "story_index": 0,
    "mission_index": 1,
    "score": 0
}

@app.get("/api/state")
def get_state():
    return STATE

@app.post("/api/state")
def update_state(data: dict):
    STATE.update(data)
    return {"ok": True, "state": STATE}

# =========================
# 🧪 HEALTH CHECK
# =========================
@app.get("/health")
def health():
    return {"status": "ok"}

# =========================
# ▶ RUN SERVER
# =========================
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
