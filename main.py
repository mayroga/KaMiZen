from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import os
import json

app = FastAPI(title="KAMIZEN LIFE SAFETY")

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(BASE_DIR, "static")

if not os.path.exists(STATIC_DIR):
    os.makedirs(STATIC_DIR)

app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

CACHE = {
    "stories": None,
    "missions": None
}

def load_json_file(path):
    if not os.path.exists(path):
        return None
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading {path}: {e}")
        return None

def get_all_stories():
    if CACHE["stories"] is not None:
        return CACHE["stories"]
    path = os.path.join(BASE_DIR, "stories.json")
    data = load_json_file(path)
    stories = []
    if data:
        if isinstance(data, dict) and "stories" in data:
            stories = data["stories"]
        elif isinstance(data, list):
            stories = data
    CACHE["stories"] = stories
    return stories

def get_all_missions():
    if CACHE["missions"] is not None:
        return CACHE["missions"]
    all_missions = []
    files = [f for f in os.listdir(BASE_DIR) if f.startswith("missions_") and f.endswith(".json")]
    for file in sorted(files):
        path = os.path.join(BASE_DIR, file)
        data = load_json_file(path)
        if data and "missions" in data:
            all_missions.extend(data["missions"])
    all_missions.sort(key=lambda x: x.get("id", 0))
    CACHE["missions"] = all_missions
    return all_missions

@app.get("/")
def read_root():
    return FileResponse(os.path.join(STATIC_DIR, "session.html"))

@app.get("/api/stories")
def api_stories():
    return {"stories": get_all_stories()}

@app.get("/api/missions")
def api_missions():
    return {"missions": get_all_missions()}

@app.get("/stories.json")
def serve_stories_json():
    return {"stories": get_all_stories()}

@app.get("/missions.json")
def serve_missions_json():
    return {"missions": get_all_missions()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000)
