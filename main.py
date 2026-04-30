from flask import Flask, jsonify, request, send_from_directory
import json
import os
import time

app = Flask(__name__, static_folder="static")

CACHE = {}

STATE = {
    "mission_index": 1,
    "MAX_MISSION": 35,
    "start_time": time.time(),
    "session_duration": 300,  # 5 minutos
    "range_map": {
        1: "missions_01_07.json",
        8: "missions_08_14.json",
        15: "missions_15_21.json",
        22: "missions_22_28.json",
        29: "missions_29_35.json"
    }
}

BASE_DIR = os.getcwd()


# =========================
# LOAD JSON
# =========================
def load_json(file_name):
    if file_name in CACHE:
        return CACHE[file_name]

    path = os.path.join(BASE_DIR, file_name)

    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
        CACHE[file_name] = data
        return data


# =========================
# GET FILE BY INDEX
# =========================
def get_file_by_index(i):
    for start in sorted(STATE["range_map"].keys()):
        if start <= i <= start + 6:
            return STATE["range_map"][start]
    return STATE["range_map"][1]


# =========================
# SESSION CHECK (5 MIN LIMIT)
# =========================
def session_active():
    return (time.time() - STATE["start_time"]) < STATE["session_duration"]


# =========================
# API MISSION
# =========================
@app.route("/api/mission/next")
def next_mission():

    if not session_active():
        return jsonify({
            "end": True,
            "message": "SESSION COMPLETE"
        })

    lang = request.args.get("lang", "en")
    mission_id = STATE["mission_index"]

    file_name = get_file_by_index(mission_id)
    data = load_json(file_name)

    mission = next((m for m in data["missions"] if m["id"] == mission_id), None)

    if not mission:
        mission = data["missions"][0]

    title = ""
    story = ""
    options = []

    for b in mission["b"]:

        if b["t"] == "v":
            title = b["tx"].get(lang, "")

        if b["t"] == "h":
            story += b["tx"].get(lang, "") + "\n"

        if b["t"] == "d":
            ops = b["op"]
            correct = b["c"]

            q = b["q"].get(lang, "")

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
# RESET SESSION
# =========================
@app.route("/api/reset")
def reset():
    STATE["mission_index"] = 1
    STATE["start_time"] = time.time()
    return jsonify({"ok": True})


# =========================
# STATIC
# =========================
@app.route("/")
def index():
    return send_from_directory("static", "session.html")


@app.route("/static/<path:path>")
def static_files(path):
    return send_from_directory("static", path)


if __name__ == "__main__":
    print("KAMIZEN SERVER RUNNING")
    app.run(debug=True)
