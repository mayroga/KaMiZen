from flask import Flask, jsonify, request, send_from_directory
import json
import os

# =========================
# APP INIT
# =========================
app = Flask(__name__, static_folder="static")

# =========================
# BASE DIR
# =========================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATE_FILE = os.path.join(BASE_DIR, "state.json")

# =========================
# LOAD / SAVE STATE (PERSISTENT)
# =========================
def load_state():
    if not os.path.exists(STATE_FILE):
        state = {"mission_index": 1}
        save_state(state)
        return state

    with open(STATE_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def save_state(state):
    with open(STATE_FILE, "w", encoding="utf-8") as f:
        json.dump(state, f, ensure_ascii=False, indent=2)


STATE = load_state()

# =========================
# LOAD JSON FILES
# =========================
def load_json(file_name):
    path = os.path.join(BASE_DIR, file_name)
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

# =========================
# STORIES SYSTEM
# =========================
def get_story(index):
    data = load_json("stories.json")

    for story in data.get("stories", []):
        if story.get("id") == index:
            return story

    return None

# =========================
# MISSIONS ROUTER SYSTEM
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
        key = "ses"  # importante: este JSON usa "ses"

    data = load_json(file_name)

    for mission in data.get(key, []):
        if mission.get("id") == index:
            return mission

    return None

# =========================
# INDEX CONTROL (PERSISTENT LOOP 1-35)
# =========================
def get_index():
    return STATE.get("mission_index", 1)


def increment_index():
    STATE["mission_index"] += 1

    if STATE["mission_index"] > 35:
        STATE["mission_index"] = 1

    save_state(STATE)

# =========================
# ROUTE: HOME
# =========================
@app.route("/")
def index():
    return send_from_directory("static", "session.html")

# =========================
# API: START SESSION
# =========================
@app.route("/api/session/start")
def start_session():

    index = get_index()

    story = get_story(index)
    mission = get_mission(index)

    # avanzar inmediatamente al siguiente ciclo
    increment_index()

    return jsonify({
        "index": index,
        "story": story,
        "mission": mission
    })

# =========================
# API: RESET (DEBUG)
# =========================
@app.route("/api/reset")
def reset():

    global STATE
    STATE = {"mission_index": 1}
    save_state(STATE)

    return jsonify({
        "status": "reset",
        "index": 1
    })

# =========================
# RUN SERVER
# =========================
if __name__ == "__main__":
    app.run(debug=True)
