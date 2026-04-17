from flask import Flask, jsonify, send_from_directory
import json
import os

app = Flask(__name__, static_folder="static")

BASE_PATH = os.path.dirname(os.path.abspath(__file__))

# =========================
# LOAD JSON FILES (ROOT SAFE)
# =========================

def get_json_files():
    files = []
    try:
        for f in os.listdir(BASE_PATH):
            if f.startswith("missions_") and f.endswith(".json"):
                files.append(f)
    except Exception as e:
        print("[ERROR] Cannot list JSON files:", e)

    return sorted(files)


# =========================
# SAFE JSON LOADER
# =========================

def load_json_file(file_path):
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"[ERROR] JSON load failed {file_path}: {e}")
        return None


# =========================
# FIND MISSION (CRASH SAFE)
# =========================

def find_mission(mission_id):
    try:
        mission_id = int(mission_id)
    except:
        return None

    for file in get_json_files():
        path = os.path.join(BASE_PATH, file)
        data = load_json_file(path)

        if not data:
            continue

        missions = data.get("missions", [])

        for m in missions:
            try:
                if int(m.get("id", -1)) == mission_id:
                    # SAFE UI FALLBACK (floating words nunca rompen frontend)
                    if "ui" not in m:
                        m["ui"] = {"floating_words": []}

                    if "floating_words" not in m.get("ui", {}):
                        m["ui"]["floating_words"] = []

                    return m
            except:
                continue

    return None


# =========================
# FIND CHAPTER (RAW SAFE)
# =========================

def find_chapter(chapter_id):
    try:
        chapter_id = int(chapter_id)
    except:
        return None

    for file in get_json_files():
        path = os.path.join(BASE_PATH, file)
        data = load_json_file(path)

        if not data:
            continue

        if int(data.get("chapter", -1)) == chapter_id:
            return data

    return None


# =========================
# API: MISSION (NO 500 EVER)
# =========================

@app.route("/api/mission/<int:mission_id>")
def api_mission(mission_id):
    try:
        mission = find_mission(mission_id)

        if not mission:
            return jsonify({
                "id": mission_id,
                "theme": "SYSTEM SAFE MODE",
                "ui": {"floating_words": []},
                "blocks": [
                    {
                        "type": "story",
                        "text": {
                            "en": "Mission is loading safely...",
                            "es": "La misión se está cargando..."
                        }
                    },
                    {
                        "type": "analysis",
                        "text": {
                            "en": "System protection active.",
                            "es": "Sistema de protección activo."
                        }
                    },
                    {
                        "type": "decision",
                        "options": [
                            {
                                "code": "WAIT",
                                "text": {"en": "Wait", "es": "Esperar"},
                                "correct": True
                            }
                        ]
                    }
                ]
            })

        return jsonify(mission)

    except Exception as e:
        return jsonify({
            "error": "safe fallback triggered",
            "detail": str(e)
        }), 200


# =========================
# API: CHAPTER
# =========================

@app.route("/api/chapter/<int:chapter_id>")
def api_chapter(chapter_id):
    try:
        chapter = find_chapter(chapter_id)

        if not chapter:
            return jsonify({"error": "Chapter not found"}), 404

        return jsonify(chapter)

    except Exception as e:
        return jsonify({
            "error": "chapter load failed",
            "detail": str(e)
        }), 200


# =========================
# API: NEXT MISSION (SAFE LOOP)
# =========================

@app.route("/api/next/<int:mission_id>")
def api_next(mission_id):
    try:
        next_id = int(mission_id) + 1

        if next_id > 35:
            next_id = 1

        return jsonify({"next": next_id})

    except:
        return jsonify({"next": 1})


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
# HEALTH CHECK (INDUSTRIAL SAFE)
# =========================

@app.route("/health")
def health():
    return jsonify({
        "status": "ok",
        "engine": "KAMIZEN V2 SAFE",
        "missions_loaded": len(get_json_files())
    })


# =========================
# RUN SERVER
# =========================

if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=10000,
        debug=False,
        threaded=True
    )
