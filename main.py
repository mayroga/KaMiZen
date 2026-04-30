from flask import Flask, jsonify, request, send_from_directory
import json
import os

app = Flask(__name__, static_folder="static")

# =========================
# CACHE + STATE
# =========================
CACHE = {}

STATE = {
    "mission_index": 1,
    "MAX_MISSION": 35,
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
# SAFE TEXT LANG
# =========================
def t(obj, lang):
    if isinstance(obj, dict):
        return obj.get(lang) or obj.get("en") or ""
    return obj or ""


# =========================
# LOAD JSON (CACHE SAFE)
# =========================
def load_json(file_name):
    if file_name in CACHE:
        return CACHE[file_name]

    path = os.path.join(BASE_DIR, file_name)

    try:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
            CACHE[file_name] = data
            return data
    except Exception as e:
        print("ERROR LOADING:", path, e)
        return None


# =========================
# FILE BY INDEX
# =========================
def get_file_by_index(i):
    for start in sorted(STATE["range_map"].keys()):
        if start <= i <= start + 6:
            return STATE["range_map"][start]
    return STATE["range_map"][1]


# =========================
# NORMALIZE MISSIONS (NEW + OLD STRUCTURE)
# =========================
def get_mission_list(data):
    if not data:
        return []

    # NEW STRUCTURE
    if "missions" in data:
        return data["missions"]

    # OLD STRUCTURE
    if "ses" in data:
        return data["ses"]

    return []


# =========================
# API NEXT MISSION
# =========================
@app.route("/api/mission/next")
def next_mission():

    lang = request.args.get("lang", "en")
    mission_id = STATE["mission_index"]

    file_name = get_file_by_index(mission_id)
    data = load_json(file_name)

    missions = get_mission_list(data)

    if not missions:
        return jsonify({
            "error": "NO DATA",
            "file": file_name
        }), 500

    # FIND BY ID
    mission = next((m for m in missions if m.get("id") == mission_id), None)

    if not mission:
        mission = missions[0]

    # =========================
    # PARSE BLOCKS (FULL COMPATIBLE)
    # =========================
    title = ""
    story = ""
    analysis = ""
    question = ""
    options = []

    blocks = mission.get("b", [])

    for block in blocks:

        ttype = block.get("t")

        # TITLE
        if ttype == "v":
            title = t(block.get("tx"), lang)

        # HEADER / STORY TEXT
        elif ttype == "h":
            story += t(block.get("tx"), lang) + "\n"

        # STORY OBJECT
        elif "story" in block:
            story += t(block.get("story"), lang) + "\n"

        # DECISION
        elif ttype == "d":

            question = t(block.get("q"), lang)

            ops = block.get("op", [])
            correct = block.get("c", 0)
            explanations = block.get("ex", [])

            options = []

            for idx, op in enumerate(ops):

                exp = explanations[idx] if idx < len(explanations) else ""

                options.append({
                    "text": {
                        "en": op,
                        "es": op
                    },
                    "correct": idx == correct,
                    "explanation": {
                        "en": exp,
                        "es": exp
                    }
                })

        # RESULT / REWARD TEXT
        elif ttype == "c":
            analysis += t(block.get("tx"), lang) + "\n"

    # =========================
    # NEXT INDEX LOOP
    # =========================
    STATE["mission_index"] += 1

    if STATE["mission_index"] > STATE["MAX_MISSION"]:
        STATE["mission_index"] = 1

    # =========================
    # RESPONSE
    # =========================
    return jsonify({
        "id": mission_id,
        "next": STATE["mission_index"],
        "theme": title,
        "story": story.strip(),
        "analysis": analysis.strip(),
        "question": question,
        "options": options,
        "lang": lang
    })


# =========================
# RESET
# =========================
@app.route("/api/reset")
def reset():
    STATE["mission_index"] = 1
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
# RUN
# =========================
if __name__ == "__main__":
    print("SERVER RUNNING OK")
    app.run(host="0.0.0.0", port=5000, debug=True)
