from flask import Flask, jsonify, request, send_from_directory
import json
import os

app = Flask(__name__, static_folder="static")

# =========================
# 🧠 CACHE
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

# =========================
# 📍 ROOT PATH (JSON EN RAÍZ)
# =========================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))


# =========================
# 📦 LOAD JSON FROM ROOT
# =========================
def load_json(file_name):
    if file_name in CACHE:
        return CACHE[file_name]

    path = os.path.join(BASE_DIR, file_name)  # 🔥 RAÍZ DIRECTA

    try:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
            CACHE[file_name] = data
            return data
    except Exception as e:
        print("❌ ERROR loading JSON:", file_name)
        print("📍 PATH:", path)
        print("🔥 ERROR:", e)
        return None


# =========================
# 🔎 GET FILE BY RANGE
# =========================
def get_file_by_index(i):
    for start in sorted(STATE["range_map"].keys()):
        if start <= i <= start + 6:
            return STATE["range_map"][start]
    return STATE["range_map"][1]


# =========================
# 🚀 MISSION ENGINE
# =========================
@app.route("/api/mission/next")
def next_mission():

    lang = request.args.get("lang", "en")
    mission_id = STATE["mission_index"]

    file_name = get_file_by_index(mission_id)
    data = load_json(file_name)

    # 🔴 FAIL SAFE
    if not data:
        return jsonify({"error": "JSON NOT FOUND", "file": file_name}), 500

    if "ses" not in data:
        return jsonify({"error": "INVALID FORMAT", "file": file_name}), 500

    mission = next((s for s in data["ses"] if s.get("id") == mission_id), None)

    # 🔥 SAFE FALLBACK (NO FREEZE)
    if not mission:
        mission = data["ses"][0] if data["ses"] else None
        if mission:
            mission_id = mission.get("id", mission_id)

    if not mission:
        return jsonify({"error": "NO MISSION FOUND"}), 500

    # =========================
    # PARSE MISSION
    # =========================
    story = ""
    title = ""
    options = []
    analysis = ""

    for block in mission.get("b", []):

        t = block.get("t")

        if t == "v":
            title = block.get("tx", "")

        elif t == "h":
            story += block.get("tx", "") + "\n"

        elif t == "d":
            ops = block.get("op", [])
            correct = block.get("c", 0)

            options = []
            for i, op in enumerate(ops):
                options.append({
                    "text": {
                        "en": op,
                        "es": op
                    },
                    "correct": (i == correct),
                    "explanation": {
                        "en": block.get("ex", [""])[i] if i < len(block.get("ex", [])) else "",
                        "es": block.get("ex", [""])[i] if i < len(block.get("ex", [])) else ""
                    }
                })

        elif t == "c":
            analysis += block.get("tx", "") + "\n"

    # =========================
    # ADVANCE INDEX
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
        "options": options,
        "lang": lang
    })


# =========================
# 🌐 STATIC
# =========================
@app.route("/")
def index():
    return send_from_directory("static", "session.html")


@app.route("/static/<path:path>")
def static_files(path):
    return send_from_directory("static", path)


# =========================
# 🔁 RESET
# =========================
@app.route("/api/reset")
def reset():
    STATE["mission_index"] = 1
    return jsonify({"ok": True})


# =========================
# 🚀 RUN
# =========================
if __name__ == "__main__":
    app.run(debug=True)
