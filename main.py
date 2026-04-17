from flask import Flask, jsonify, send_from_directory
import json
import os

app = Flask(__name__, static_folder="static")

BASE_PATH = os.path.dirname(__file__)

# =========================
# GET ALL JSON FILES
# =========================

def get_json_files():
    files = []
    for f in os.listdir(BASE_PATH):
        if f.startswith("missions_") and f.endswith(".json"):
            files.append(f)
    return files

# =========================
# FIND MISSION IN REAL FILES
# =========================

def find_mission(mission_id):
    for file in get_json_files():
        path = os.path.join(BASE_PATH, file)

        try:
            with open(path, "r", encoding="utf-8") as f:
                data = json.load(f)

                for m in data.get("missions", []):
                    if m.get("id") == mission_id:
                        return m

        except Exception as e:
            print(f"[ERROR] {file}: {e}")

    return None

# =========================
# FIND CHAPTER (REAL JSON)
# =========================

def find_chapter(chapter_id):
    for file in get_json_files():
        path = os.path.join(BASE_PATH, file)

        try:
            with open(path, "r", encoding="utf-8") as f:
                data = json.load(f)

                if data.get("chapter") == chapter_id:
                    return data  # ← devuelve TODO el JSON intacto

        except Exception as e:
            print(f"[ERROR] {file}: {e}")

    return None

# =========================
# API: MISSION
# =========================

@app.route("/api/mission/<int:mission_id>")
def api_mission(mission_id):
    mission = find_mission(mission_id)

    if not mission:
        return jsonify({"error": "Mission not found"}), 404

    return jsonify(mission)

# =========================
# API: CHAPTER (RAW JSON)
# =========================

@app.route("/api/chapter/<int:chapter_id>")
def api_chapter(chapter_id):
    chapter = find_chapter(chapter_id)

    if not chapter:
        return jsonify({"error": "Chapter not found"}), 404

    return jsonify(chapter)

# =========================
# API: NEXT
# =========================

@app.route("/api/next/<int:mission_id>")
def api_next(mission_id):
    next_id = mission_id + 1
    if next_id > 35:
        next_id = 1

    return jsonify({"next": next_id})

# =========================
# HOME
# =========================

@app.route("/")
def home():
    return send_from_directory("static", "session.html")

# =========================
# STATIC
# =========================

@app.route("/static/<path:path>")
def static_files(path):
    return send_from_directory("static", path)

# =========================
# RUN
# =========================

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=10000, debug=True)
