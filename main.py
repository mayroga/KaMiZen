from flask import Flask, jsonify, send_from_directory
import json
import os
import logging

app = Flask(__name__, static_folder="static")

# =========================
# LOGGING PROFESIONAL
# =========================
logging.basicConfig(level=logging.INFO)

# =========================
# JSON FILES (ROOT DIRECTORY)
# =========================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

MISSION_FILES = [
    ("missions_01_07.json", (1, 7)),
    ("missions_08_14.json", (8, 14)),
    ("missions_15_21.json", (15, 21)),
    ("missions_22_28.json", (22, 28)),
    ("missions_29_35.json", (29, 35)),
]

# =========================
# SAFE LOAD JSON
# =========================
def load_json_file(filename):
    try:
        path = os.path.join(BASE_DIR, filename)

        if not os.path.exists(path):
            logging.error(f"[MISSING FILE] {filename}")
            return None

        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)

    except json.JSONDecodeError as e:
        logging.error(f"[JSON ERROR] {filename} -> {e}")
        return None

    except Exception as e:
        logging.error(f"[LOAD ERROR] {filename} -> {e}")
        return None


# =========================
# GET FILE BY RANGE
# =========================
def get_file_for_mission(mission_id):
    try:
        mission_id = int(mission_id)
    except:
        return None

    for filename, (start, end) in MISSION_FILES:
        if start <= mission_id <= end:
            return filename

    return None


# =========================
# GET MISSION
# =========================
def get_mission(mission_id):
    filename = get_file_for_mission(mission_id)

    if not filename:
        logging.warning(f"[NO FILE MATCH] mission {mission_id}")
        return None

    data = load_json_file(filename)

    if not data or "missions" not in data:
        logging.error(f"[INVALID STRUCTURE] {filename}")
        return None

    for mission in data["missions"]:
        if int(mission.get("id", -1)) == mission_id:
            return mission

    logging.warning(f"[MISSION NOT FOUND] {mission_id}")
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
# NEXT MISSION
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
# HOME
# =========================
@app.route("/")
def home():
    return send_from_directory("static", "session.html")


# =========================
# STATIC SAFE
# =========================
@app.route("/static/<path:path>")
def static_files(path):
    return send_from_directory("static", path)


# =========================
# GLOBAL ERROR HANDLER (ANTI 500 BLIND)
# =========================
@app.errorhandler(Exception)
def handle_error(e):
    logging.error(f"[FATAL ERROR] {str(e)}")

    return jsonify({
        "error": "internal_server_error",
        "message": str(e)
    }), 500


# =========================
# RUN
# =========================
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=10000, debug=False)
