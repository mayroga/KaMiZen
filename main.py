from flask import Flask, jsonify, send_from_directory
import json
import os

app = Flask(__name__, static_folder="static")

BASE_PATH = os.path.dirname(__file__)

# =========================
# DETECT ALL MISSION FILES (ROOT ONLY)
# =========================

def get_json_files():
    """
    Detecta automáticamente todos los archivos:
    missions_01_07.json ... missions_29_35.json
    SIN hardcode.
    """
    files = []
    for f in os.listdir(BASE_PATH):
        if f.startswith("missions_") and f.endswith(".json"):
            files.append(f)
    return files


# =========================
# SAFE LOAD JSON
# =========================

def load_json(file_path):
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"[JSON ERROR] {file_path}: {e}")
        return None


# =========================
# FIND MISSION (GLOBAL SEARCH)
# =========================

def find_mission(mission_id):
    """
    Busca misión en TODOS los archivos reales.
    NO asume estructura artificial.
    """
    for file in get_json_files():
        path = os.path.join(BASE_PATH, file)
        data = load_json(path)

        if not data:
            continue

        missions = data.get("missions", [])
        for m in missions:
            if m.get("id") == mission_id:
                return m

    return None


# =========================
# FIND CHAPTER (RAW JSON EXACTO)
# =========================

def find_chapter(chapter_id):
    """
    Devuelve el JSON EXACTO sin modificar.
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
# GET FULL GAME STATE (OPTIONAL FUTURE)
# =========================

def get_full_game():
    """
    Junta todos los JSON sin modificar.
    """
    game = {
        "missions": [],
        "chapters": {}
    }

    for file in get_json_files():
        path = os.path.join(BASE_PATH, file)
        data = load_json(path)

        if not data:
            continue

        game["missions"].extend(data.get("missions", []))

        chapter = data.get("chapter")
        if chapter:
            game["chapters"][chapter] = data

    return game


# =========================
# API: MISSION (SINGLE)
# =========================

@app.route("/api/mission/<int:mission_id>")
def api_mission(mission_id):
    mission = find_mission(mission_id)

    if not mission:
        return jsonify({
            "error": "Mission not found",
            "mission_id": mission_id
        }), 404

    return jsonify(mission)


# =========================
# API: CHAPTER (RAW FILE)
# =========================

@app.route("/api/chapter/<int:chapter_id>")
def api_chapter(chapter_id):
    chapter = find_chapter(chapter_id)

    if not chapter:
        return jsonify({
            "error": "Chapter not found",
            "chapter_id": chapter_id
        }), 404

    return jsonify(chapter)


# =========================
# API: NEXT MISSION (1 → 35 LOOP)
# =========================

@app.route("/api/next/<int:mission_id>")
def api_next(mission_id):
    next_id = mission_id + 1
    if next_id > 35:
        next_id = 1

    return jsonify({
        "next": next_id
    })


# =========================
# API: FULL GAME (OPTIONAL)
# =========================

@app.route("/api/game")
def api_game():
    return jsonify(get_full_game())


# =========================
# HOME
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
# ERROR HANDLING (ANTI 500 SAFE MODE)
# =========================

@app.errorhandler(500)
def internal_error(e):
    return jsonify({
        "error": "internal_server_error",
        "message": str(e)
    }), 500


# =========================
# RUN SERVER
# =========================

if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=10000,
        debug=True
    )
