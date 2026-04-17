from fastapi import FastAPI
from fastapi.responses import JSONResponse
import json
import os
import time

app = FastAPI()

# =========================
# CONFIG
# =========================

BASE_DIR = os.getcwd()

MISSION_FILES = [
    ("missions_01_07.json", (1, 7)),
    ("missions_08_14.json", (8, 14)),
    ("missions_15_21.json", (15, 21)),
    ("missions_22_28.json", (22, 28)),
    ("missions_29_35.json", (29, 35)),
]

# =========================
# RAM CACHE (CORE ENGINE)
# =========================

CACHE = {
    "missions": {},
    "loaded": False,
    "last_load": None
}

# =========================
# SAFE LOAD
# =========================

def safe_load_json(path):
    try:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)

        if isinstance(data, dict):
            return data

        return {"missions": []}

    except Exception as e:
        print(f"[LOAD ERROR] {path} -> {e}")
        return {"missions": []}


# =========================
# LOAD ALL INTO RAM
# =========================

def load_all_missions():
    global CACHE

    temp = {}

    for filename, (start, end) in MISSION_FILES:
        path = os.path.join(BASE_DIR, filename)
        data = safe_load_json(path)

        missions = data.get("missions", [])

        for m in missions:
            mid = m.get("id")
            if mid:
                temp[mid] = m

    CACHE["missions"] = temp
    CACHE["loaded"] = True
    CACHE["last_load"] = time.time()

    print("🚀 KAMIZEN ENGINE LOADED IN RAM")


# =========================
# AUTO LOAD ON START
# =========================

@app.on_event("startup")
def startup():
    load_all_missions()


# =========================
# GET MISSION (ZERO DISK)
# =========================

@app.get("/api/mission/{mission_id}")
def get_mission(mission_id: int):

    mission = CACHE["missions"].get(mission_id)

    if not mission:
        return JSONResponse({
            "status": "ok",
            "found": False,
            "mission_id": mission_id
        }, status_code=404)

    return {
        "status": "ok",
        "found": True,
        "mission": mission
    }


# =========================
# NEXT MISSION FLOW
# =========================

@app.get("/api/next/{mission_id}")
def next_mission(mission_id: int):

    next_id = mission_id + 1
    if next_id > 35:
        next_id = 1

    return {
        "next_mission": next_id
    }


# =========================
# HEALTH CHECK (INDUSTRIAL)
# =========================

@app.get("/api/status")
def status():

    return {
        "system": "KAMIZEN INDUSTRIAL ENGINE V2",
        "cache_loaded": CACHE["loaded"],
        "missions_loaded": len(CACHE["missions"]),
        "last_reload": CACHE["last_load"]
    }


# =========================
# MANUAL RELOAD (SAFE)
# =========================

@app.get("/api/reload")
def reload_cache():
    load_all_missions()

    return {
        "status": "reloaded",
        "missions": len(CACHE["missions"])
    }
