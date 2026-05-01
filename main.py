from flask import Flask, jsonify, send_from_directory
import json
import os

app = Flask(__name__, static_folder="static")

# =========================
# BASE DIR
# =========================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# =========================
# STATE (SIMPLE MEMORY LOOP)
# =========================
STATE = {
    "index": 1
}

# =========================
# LOAD JSON SAFE
# =========================
def load_json(file_name):
    path = os.path.join(BASE_DIR, file_name)
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

# =========================
# STORIES (EXACT KEY: stories.json)
# =========================
def get_story(index):
    data = load_json("stories.json")

    for item in data.get("stories", []):
        if item.get("id") == index:
            return item

    return None

# =========================
# MISSIONS ROUTER (EXACT FILE MAPPING)
# =========================
def get_mission(index):

    if 1 <= index <= 7:
        file_name = "missions_01_07.json"
        key = "missions"

    elif 8 <= index <= 14:
        file_name = "missions_08_14.json"
        key = "missions"

    elif 15 <= index <= 21:
        file_name = "missions_15_21.json"
        key = "missions"

    elif 22 <= index <= 28:
        file_name = "missions_22_28.json"
        key = "missions"

    else:
        file_name = "missions_29_35.json"
        key = "missions"

    data = load_json(file_name)

    for item in data.get(key, []):
        if item.get("id") == index:
            return item

    return None

# =========================
# SESSION API (SINGLE SOURCE OF TRUTH)
# =========================
@app.route("/api/session/start")
def session_start():

    index = STATE["index"]

    story = get_story(index)
    mission = get_mission(index)

    # ADVANCE INDEX (SAFE LOOP 1–35)
    STATE["index"] += 1
    if STATE["index"] > 35:
        STATE["index"] = 1

    return jsonify({
        "index": index,
        "story": story,
        "mission": mission
    })

# =========================
# RESET (DEBUG ONLY)
# =========================
@app.route("/api/reset")
def reset():

    STATE["index"] = 1

    return jsonify({
        "status": "reset",
        "index": 1
    })

# =========================
# FRONTEND ENTRY
# =========================
@app.route("/")
def home():
    return send_from_directory("static", "session.html")

# =========================
# RUN SERVER
# =========================
if __name__ == "__main__":
    app.run(debug=True)
