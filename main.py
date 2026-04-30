from flask import Flask, jsonify, request, send_from_directory
import json
import os
import time

app = Flask(__name__, static_folder="static")

CACHE = {}

# =========================
# 🧠 STATE GLOBAL
# =========================
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
# 🧬 USER PROFILE (ADAPTIVE CORE)
# =========================
PROFILE = {
    "impulsivity": 50,
    "calm": 50,
    "focus": 50,
    "fear": 50,
    "discipline": 50,
    "error_pattern": {
        "react": 0,
        "avoid": 0,
        "risk": 0
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
# FILE BY INDEX
# =========================
def get_file_by_index(i):
    for start in sorted(STATE["range_map"].keys()):
        if start <= i <= start + 6:
            return STATE["range_map"][start]
    return STATE["range_map"][1]


# =========================
# SESSION CHECK
# =========================
def session_active():
    return (time.time() - STATE["start_time"]) < STATE["session_duration"]


# =========================
# 🧠 ADAPTIVE PROFILE UPDATE
# =========================
def update_profile(cat, chosen_correct, choice_index, correct_index):

    if not chosen_correct:
        PROFILE["impulsivity"] += 2
        PROFILE["discipline"] -= 1

    else:
        PROFILE["discipline"] += 1

    # CATEGORY IMPACT
    if cat in ["bullying", "emotion", "social"]:
        PROFILE["fear"] += 1 if not chosen_correct else -1

    if cat in ["focus", "truth", "mind"]:
        PROFILE["focus"] += 1 if chosen_correct else -1

    if cat in ["emergency", "stranger", "digital"]:
        PROFILE["calm"] += 1 if chosen_correct else -1

    # ERROR PATTERN
    if choice_index != correct_index:
        if choice_index == 0:
            PROFILE["error_pattern"]["react"] += 1
        elif choice_index == 3:
            PROFILE["error_pattern"]["avoid"] += 1
        else:
            PROFILE["error_pattern"]["risk"] += 1


# =========================
# DIFFICULTY ENGINE
# =========================
def get_difficulty_boost():
    boost = 0

    if PROFILE["impulsivity"] > 60:
        boost += 1

    if PROFILE["focus"] > 70:
        boost -= 1

    if PROFILE["fear"] > 65:
        boost += 1

    return boost


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

    # =========================
    # PARSE MISSION
    # =========================
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

            # 🧠 UPDATE PROFILE BASED ON LAST ACTION (SIMULATED)
            # NOTE: real app would send user choice via POST
            update_profile(mission.get("cat", "unknown"), True, correct, correct)

    # =========================
    # ADAPTIVE DIFFICULTY
    # =========================
    difficulty_boost = get_difficulty_boost()

    if difficulty_boost > 0:
        STATE["mission_index"] += difficulty_boost
    else:
        STATE["mission_index"] += 1

    if STATE["mission_index"] > STATE["MAX_MISSION"]:
        STATE["mission_index"] = 1

    # =========================
    # RESPONSE
    # =========================
    return jsonify({
        "id": mission_id,
        "theme": title,
        "story": story,
        "options": options,
        "time_left": int(STATE["session_duration"] - (time.time() - STATE["start_time"])),
        "profile": PROFILE
    })


# =========================
# RESET SESSION
# =========================
@app.route("/api/reset")
def reset():
    STATE["mission_index"] = 1
    STATE["start_time"] = time.time()

    # reset optional (comment if you want persistence)
    # global PROFILE
    # PROFILE = { ... reset values ... }

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


# =========================
# RUN SERVER
# =========================
if __name__ == "__main__":
    print("KAMIZEN ADAPTIVE ENGINE RUNNING")
    app.run(debug=True)
