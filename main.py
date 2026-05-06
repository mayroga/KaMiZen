from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import os
import json

# =========================================================
# KAMIZEN LIFE SYSTEM - BACKEND CORE
# =========================================================

app = FastAPI(title="KAMIZEN LIFE SYSTEM")

# -------------------------
# CORS (DEV MODE OPEN)
# -------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------
# PATHS
# -------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(BASE_DIR, "static")

if not os.path.exists(STATIC_DIR):
    os.makedirs(STATIC_DIR)

app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

# -------------------------
# CACHE SYSTEM
# -------------------------
CACHE = {
    "stories": None,
    "missions": None
}

# -------------------------
# LOAD JSON SAFE
# -------------------------
def load_json(path):
    try:
        if not os.path.exists(path):
            return None
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"[ERROR] Loading JSON: {path} -> {e}")
        return None

# -------------------------
# STORIES LOADER
# -------------------------
def get_stories():
    if CACHE["stories"] is not None:
        return CACHE["stories"]

    path = os.path.join(BASE_DIR, "stories.json")
    data = load_json(path)

    stories = []

    if isinstance(data, dict) and "stories" in data:
        stories = data["stories"]
    elif isinstance(data, list):
        stories = data

    CACHE["stories"] = stories
    return stories

# -------------------------
# MISSIONS LOADER (MULTI FILE SYSTEM)
# -------------------------
def get_missions():
    if CACHE["missions"] is not None:
        return CACHE["missions"]

    missions = []

    files = [
        f for f in os.listdir(BASE_DIR)
        if f.startswith("missions_") and f.endswith(".json")
    ]

    for file in sorted(files):
        path = os.path.join(BASE_DIR, file)
        data = load_json(path)

        if not data:
            continue

        if "missions" in data:
            missions.extend(data["missions"])
        elif "ses" in data:
            missions.extend(data["ses"])

    # ORDER BY ID SAFE
    missions.sort(key=lambda x: x.get("id", 0))

    CACHE["missions"] = missions
    return missions

# =========================================================
# ROUTES
# =========================================================

@app.get("/")
def home():
    return FileResponse(os.path.join(STATIC_DIR, "session.html"))

# -------------------------
# API: STORIES
# -------------------------
@app.get("/api/stories")
def api_stories():
    return {
        "stories": get_stories()
    }

# -------------------------
# API: MISSIONS
# -------------------------
@app.get("/api/missions")
def api_missions():
    return {
        "missions": get_missions()
    }

# -------------------------
# COMPATIBILITY ENDPOINTS
# -------------------------
@app.get("/stories.json")
def stories_json():
    return {"stories": get_stories()}

@app.get("/missions.json")
def missions_json():
    return {"missions": get_missions()}

# -------------------------
# HEALTH CHECK
# -------------------------
@app.get("/health")
def health():
    return {
        "status": "OK",
        "system": "KAMIZEN LIFE SYSTEM",
        "missions_loaded": len(get_missions()),
        "stories_loaded": len(get_stories())
    }

# =========================================================
# RUN SERVER
# =========================================================
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
