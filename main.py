from flask import Flask, jsonify, send_from_directory
import json
import os

app = Flask(__name__, static_folder="static")

BASE_PATH = os.path.dirname(__file__)

# =========================
# FIND ALL MISSION FILES
# =========================

def get_json_files():
    """
    Detecta automáticamente todos los archivos missions_*.json
    sin hardcode ni listas fijas.
    """
    return [
        f for f in os.listdir(BASE_PATH)
        if f.startswith("missions_") and f.endswith(".json")
    ]


# =========================
# LOAD JSON SAFE
# =========================

def load_json(file_path):
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"[JSON ERROR] {file_path}: {e}")
        return None


# =========================
# FIND MISSION BY ID
# =========================

def find_mission(mission_id):
    """
    Busca la misión EXACTA en todos los archivos JSON.
    No reestructura nada.
    """
    for file in get_json_files():
        path = os.path.join(BASE_PATH, file)
        data = load_json(path)

        if not data:
            continue

        for mission in data.get("missions", []):
            if mission.get("id") == mission_id:
                return mission

    return None


# =========================
# FIND FULL CHAPTER
# =========================

def find_chapter(chapter_id):
    """
    Devuelve el JSON COMPLETO del capítulo sin modificarlo.
    """
    for file in get_json_files():
        path = os.path.join(BASE_PATH, file)
        data = load_json(path)

        if not data:
            continue

        if data.get("chapter") == chapter_id:
            return data

    return None


# =========================
# API: SINGLE MISSION
# =========================

@app.route("/api/mission/<int:mission_id>")
def api_mission(mission_id):
    mission = find_mission(mission_id)

    if not mission:
        return jsonify({
            "error": "Mission not found",
            "id": mission_id
        }), 404

    return jsonify(mission)


# =========================
# API: CHAPTER RAW
# =========================

@app.route("/api/chapter/<int:chapter_id>")
def api_chapter(chapter_id):
    chapter = find_chapter(chapter_id)

    if not chapter:
        return jsonify({
            "error": "Chapter not found",
            "id": chapter_id
        }), 404

    return jsonify(chapter)


# =========================
# API: NEXT MISSION (SAFE LOOP 1-35)
# =========================

@app.route("/api/next/<int:mission_id>")
def api_next(mission_id):
    next_id = mission_id + 1

    if next_id > 35:
        next_id = 1

    return jsonify({"next": next_id})


# =========================
# HOME (SESSION GAME)
# =========================

@app.route("/")
def home():
    return send_from_directory("static", "session.html")


# =========================
# STATIC FILES
# =========================

@app.route("/static/<path:path>")
def static_files(path):
    return send_from_directory("static", path)


# =========================
# RUN SERVER (STABLE MODE)
# =========================

if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=10000,
        debug=False,   # <- importante para evitar crashes en producción
        threaded=True
    )
