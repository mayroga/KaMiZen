from flask import Flask, jsonify, request
import json
import os

app = Flask(__name__)

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
        json.dump(state, f)


STATE = load_state()

# =========================
# LOAD JSON
# =========================
def load_json(file_name):
    path = os.path.join(BASE_DIR, file_name)
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

# =========================
# STORIES
# =========================
def get_story(index):
    data = load_json("stories.json")
    for s in data["stories"]:
        if s["id"] == index:
            return s
    return None

# =========================
# MISSIONS ROUTER
# =========================
def get_mission(index):

    if 1 <= index <= 7:
        file = "missions_01_07.json"
        key = "missions"

    elif 8 <= index <= 14:
        file = "missions_08_14.json"
        key = "missions"

    elif 15 <= index <= 21:
        file = "missions_15_21.json"
        key = "missions"

    elif 22 <= index <= 28:
        file = "missions_22_28.json"
        key = "missions"

    else:
        file = "missions_29_35.json"
        key = "ses"  # importante: este JSON usa "ses"

    data = load_json(file)

    for m in data[key]:
        if m["id"] == index:
            return m

    return None

# =========================
# INDEX CONTROL (PERSISTENT)
# =========================
def get_index():
    return STATE.get("mission_index", 1)


def increment_index():
    STATE["mission_index"] += 1

    if STATE["mission_index"] > 35:
        STATE["mission_index"] = 1

    save_state(STATE)

# =========================
# API START SESSION
# =========================
@app.route("/api/session/start")
def start_session():

    index = get_index()

    story = get_story(index)
    mission = get_mission(index)

    # avanzar al siguiente ciclo inmediatamente
    increment_index()

    return jsonify({
        "index": index,
        "story": story,
        "mission": mission
    })

# =========================
# RESET (OPTIONAL DEBUG)
# =========================
@app.route("/api/reset")
def reset():
    global STATE
    STATE = {"mission_index": 1}
    save_state(STATE)
    return jsonify({"status": "reset", "index": 1})

# =========================
# RUN SERVER
# =========================
if __name__ == "__main__":
    app.run(debug=True)
