# =====================================
# 🧠 KAMIZEN BACKEND vFINAL (FASTAPI)
# =====================================

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
import os
import json
from typing import List

app = FastAPI()

# =====================================
# 📁 PATHS
# =====================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(BASE_DIR, "static")

# Montar archivos estáticos
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

# =====================================
# 🧠 CACHE (evita leer disco siempre)
# =====================================

CACHE = {
    "missions": None,
    "stories": None
}

# =====================================
# 🔍 LOAD JSON SAFE
# =====================================

def load_json_file(path: str):
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading {path}: {e}")
        return None

# =====================================
# 📦 LOAD ALL MISSIONS
# =====================================

def load_all_missions():
    if CACHE["missions"] is not None:
        return CACHE["missions"]

    all_missions = []

    # Buscar archivos missions_*.json
    for file in sorted(os.listdir(BASE_DIR)):
        if file.startswith("missions_") and file.endswith(".json"):
            path = os.path.join(BASE_DIR, file)
            data = load_json_file(path)

            if not data:
                continue

            missions = data.get("missions") or data.get("ses") or []

            all_missions.extend(missions)

    CACHE["missions"] = {
        "total": len(all_missions),
        "missions": all_missions
    }

    return CACHE["missions"]

# =====================================
# 📖 LOAD STORIES (OPCIONAL)
# =====================================

def load_stories():
    if CACHE["stories"] is not None:
        return CACHE["stories"]

    path = os.path.join(BASE_DIR, "stories.json")

    if not os.path.exists(path):
        CACHE["stories"] = {}
        return {}

    data = load_json_file(path) or {}
    CACHE["stories"] = data
    return data

# =====================================
# 🌐 ROUTES
# =====================================

@app.get("/")
def root():
    return FileResponse(os.path.join(STATIC_DIR, "session.html"))

@app.get("/session")
def session():
    return FileResponse(os.path.join(STATIC_DIR, "session.html"))

@app.get("/api/missions")
def get_missions():
    data = load_all_missions()

    if not data["missions"]:
        raise HTTPException(status_code=404, detail="No missions found")

    return JSONResponse(content=data)

@app.get("/api/missions/{mission_id}")
def get_mission(mission_id: int):
    data = load_all_missions()

    for m in data["missions"]:
        if m.get("id") == mission_id:
            return JSONResponse(content=m)

    raise HTTPException(status_code=404, detail="Mission not found")

@app.get("/api/stories")
def get_stories():
    data = load_stories()
    return JSONResponse(content=data)

# =====================================
# 🧠 SIMPLE SESSION STATE (OPCIONAL)
# =====================================

STATE = {
    "current_mission": 1,
    "score": 0
}

@app.get("/api/state")
def get_state():
    return STATE

@app.post("/api/state")
def update_state(payload: dict):
    STATE.update(payload)
    return {"status": "updated", "state": STATE}

# =====================================
# 🧪 HEALTH CHECK
# =====================================

@app.get("/health")
def health():
    return {"status": "ok"}

# =====================================
# ▶ RUN
# =====================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
