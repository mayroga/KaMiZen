from flask import Flask, jsonify, request, send_from_directory
import json
import os
import time

app = Flask(__name__, static_folder="static")

CACHE = {}

# =========================
# 🔥 BASE FIJA (CRÍTICO)
# =========================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

STATE = {
    "mission_index": 1,
    "MAX_MISSION": 35,
    "start_time": time.time(),
    "session_duration": 300,
    "range_map": {
        1: "missions_01_07.json",
        8: "missions_08_14.json",
        15: "missions_15_21.json",
        22: "missions_22_28.json",
        29: "missions_29_35.json"
    }
}

# =========================
# LOAD JSON FIXED
# =========================
def load_json(file_name):
    if file_name in CACHE:
        return CACHE[file_name]

    path = os.path.join(BASE_DIR, file_name)

    if not os.path.exists(path):
        print("❌ JSON NOT FOUND:", path)
        return {"missions": []}

    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
        CACHE[file_name] = data
        return data


# =========================
# RANGE FIXED
# =========================
def get_file_by_index(i):
    if 1 <= i <= 7:
        return "missions_01_07.json"
    if 8 <= i <= 14:
        return "missions_08_14.json"
    if 15 <= i <= 21:
        return "missions_15_21.json"
    if 22 <= i <= 28:
        return "missions_22_28.json"
    return "missions_29_35.json"


# =========================
# SESSION CHECK
# =========================
def session_active():
    return (time.time() - STATE["start_time"]) < STATE["session_duration"]


# =========================
# API
# =========================
@app.route("/api/mission/next")
def next_mission():

    if not session_active():
        return jsonify({"end": True})

    lang = request.args.get("lang", "en")
    mission_id = STATE["mission_index"]

    file_name = get_file_by_index(mission_id)
    data = load_json(file_name)

    mission = next((m for m in data.get("missions", []) if m["id"] == mission_id), None)

    if not mission and data.get("missions"):
        mission = data["missions"][0]

    title = ""
    story = ""
    options = []

    if mission:

        for b in mission["b"]:

            if b["t"] == "v":
                title = b["tx"].get(lang, "")

            if b["t"] == "h":
                story += b["tx"].get(lang, "") + "\n"

            if b["t"] == "d":
                q = b["q"].get(lang, "")
                ops = b["op"]
                correct = b["c"]

                options = []

                for i, op in enumerate(ops):
                    options.append({
                        "text": op,
                        "correct": i == correct,
                        "explanation": b["ex"][i] if i < len(b["ex"]) else "",
                        "question": q
                    })

    STATE["mission_index"] += 1
    if STATE["mission_index"] > STATE["MAX_MISSION"]:
        STATE["mission_index"] = 1

    return jsonify({
        "id": mission_id,
        "theme": title,
        "story": story,
        "options": options,
        "time_left": int(STATE["session_duration"] - (time.time() - STATE["start_time"]))
    })


# =========================
# STATIC FIXED
# =========================
@app.route("/")
def index():
    return send_from_directory("static", "session.html")


@app.route("/static/<path:path>")
def static_files(path):
    return send_from_directory("static", path)


if __name__ == "__main__":
    print("KAMIZEN RUNNING FIXED")
    app.run(debug=True)
