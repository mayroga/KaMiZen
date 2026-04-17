from flask import Flask, jsonify, send_from_directory
import json
import os

app = Flask(__name__, static_folder="static")

BASE_PATH = os.path.dirname(__file__)

# =========================
# LOAD JSON FILES (REAL STRUCTURE)
# =========================

def get_json_files():
    # SOLO tus archivos reales
    return [
        "missions_01_07.json",
        "missions_08_14.json",
        "missions_15_21.json",
        "missions_22_28.json",
        "missions_29_35.json"
    ]


def load_file(file):
    path = os.path.join(BASE_PATH, file)
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


# =========================
# CACHE MEMORY (FAST LOAD)
# =========================

CACHE = {
    "missions": {},
    "chapters": {}
}


def build_cache():
    for file in get_json_files():
        try:
            data = load_file(file)

            chapter = data.get("chapter")
            CACHE["chapters"][chapter] = data

            for m in data.get("missions", []):
                mid = m.get("id")
                CACHE["missions"][mid] = {
                    **m,
                    "ui": data.get("ui", {}),
                    "matrix_rules": data.get("matrix_rules", []),
                    "game": data.get("game"),
                    "chapter": chapter
                }

        except Exception as e:
            print(f"[ERROR LOADING {file}] {e}")


# =========================
# INIT CACHE ON START
# =========================

build_cache()


# =========================
# API: MISSION (ULTRA STABLE)
# =========================

@app.route("/api/mission/<int:mission_id>")
def api_mission(mission_id):
    mission = CACHE["missions"].get(mission_id)

    if not mission:
        return jsonify({
            "error": "Mission not found",
            "id": mission_id
        }), 404

    return jsonify(mission)


# =========================
# API: CHAPTER (FULL RAW JSON)
# =========================

@app.route("/api/chapter/<int:chapter_id>")
def api_chapter(chapter_id):
    chapter = CACHE["chapters"].get(chapter_id)

    if not chapter:
        return jsonify({"error": "Chapter not found"}), 404

    return jsonify(chapter)


# =========================
# NEXT MISSION FLOW (1-35 LOOP)
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
# RUN SERVER
# =========================

if __name__ == "__main__":
    print("🚀 KAMIZEN ENGINE V2 LOADED")
    print("📦 Missions cached:", len(CACHE["missions"]))
    app.run(host="0.0.0.0", port=10000, debug=True)
