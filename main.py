from flask import Flask, jsonify, send_from_directory
import json
import os

app = Flask(__name__, static_folder="static")

# =========================
# CONFIG
# =========================

MISSION_FILES = [
    ("missions_01_07.json", (1, 7)),
    ("missions_08_14.json", (8, 14)),
    ("missions_15_21.json", (15, 21)),
    ("missions_22_28.json", (22, 28)),
    ("missions_29_35.json", (29, 35)),
]

# =========================
# LOAD JSON SAFE
# =========================

def load_json_file(filename):
    try:
        path = os.path.join(os.path.dirname(__file__), filename)
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"[ERROR LOADING {filename}] -> {e}")
        return None

# =========================
# GET FILE BY MISSION ID
# =========================

def get_file_for_mission(mission_id):
    for filename, (start, end) in MISSION_FILES:
        if start <= mission_id <= end:
            return filename
    return None

# =========================
# GET MISSION BY ID
# =========================

def get_mission(mission_id):
    filename = get_file_for_mission(mission_id)

    if not filename:
        return None

    data = load_json_file(filename)
    if not data:
        return None

    for mission in data.get("missions", []):
        if mission.get("id") == mission_id:
            return mission

    return None

# =========================
# API: MISSION
# =========================

@app.route("/api/mission/<int:mission_id>")
def api_mission(mission_id):
    mission = get_mission(mission_id)

    if not mission:
        return jsonify({
            "error": "Mission not found",
            "mission_id": mission_id
        }), 404

    return jsonify(mission)

# =========================
# API: NEXT MISSION FLOW (1 → 35 → 1)
# =========================

@app.route("/api/next/<int:mission_id>")
def api_next(mission_id):
    next_id = mission_id + 1
    if next_id > 35:
        next_id = 1

    return jsonify({
        "next_mission": next_id
    })

# =========================
# HOME (SESSION)
# =========================

@app.route("/")
def home():
    return send_from_directory("static", "session.html")

# =========================
# STATIC FILES SAFE
# =========================

@app.route("/static/<path:path>")
def static_files(path):
    return send_from_directory("static", path)

# =========================
# RUN APP
# =========================

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=10000, debug=True)
