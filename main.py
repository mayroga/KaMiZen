from flask import Flask, jsonify, send_from_directory, request
import os
import json

app = Flask(__name__, static_folder="static")

BASE = os.path.dirname(__file__)

# =========================
# 💾 SAVE SYSTEM
# =========================
def get_save_data():
    data = load_json("save_game.json")
    if data is None:
        return {"last_mission": 0}
    return data

def save_progress(mid):
    path = os.path.join(BASE, "save_game.json")
    with open(path, "w", encoding="utf-8") as f:
        json.dump({"last_mission": mid}, f)

# =========================
# 📦 LOAD JSON SAFE
# =========================
def load_json(file):
    try:
        path = os.path.join(BASE, file)
        if not os.path.exists(path):
            return None
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"Error cargando {file}: {e}")
        return None

def get_all_missions():
    files = [
        "missions_01_07.json",
        "missions_08_14.json",
        "missions_15_21.json",
        "missions_22_28.json",
        "missions_29_35.json"
    ]
    data = []
    for f in files:
        j = load_json(f)
        if j:
            data.append(j)
    return data

# =========================
# 🔍 SEARCH LOGIC
# =========================
def find_mission(mid):
    datasets = get_all_missions()
    for pack in datasets:
        for m in pack.get("missions", []):
            if m.get("id") == mid:
                return m, pack
    return None, None

def find_chapter(chapter_id):
    datasets = get_all_missions()
    for pack in datasets:
        if pack.get("chapter") == chapter_id:
            return pack
    return None

def get_total_missions():
    return 35

# =========================
# 🎮 FORMAT FOR FRONTEND
# =========================
def format_mission(mission, pack, lang="en"):
    if not mission:
        return None

    story_block = next((b for b in mission["blocks"] if b["type"] == "story"), {})
    decision_block = next((b for b in mission["blocks"] if b["type"] == "decision"), {})

    return {
        "id": mission.get("id"),
        "level": mission.get("level"),
        "theme": mission.get("theme"),
        "chapter": pack.get("chapter"),
        "ui": pack.get("ui", {}),
        "matrix_rules": pack.get("matrix_rules", []),

        "story": story_block.get("text", {}).get(lang, ""),
        
        "options": [
            {
                "text": opt["text"].get(lang, ""),
                "score": opt.get("score", 0),
                "correct": opt.get("correct", False),
                "explanation": opt.get("explanation", {}).get(lang, "")
            }
            for opt in decision_block.get("options", [])
        ]
    }

# =========================
# 🎯 API
# =========================

@app.route("/api/mission/<int:mission_id>")
def api_mission(mission_id):
    lang = request.args.get("lang", "en")

    mission, pack = find_mission(mission_id)

    if not mission:
        return jsonify({"error": "Mission not found"}), 404

    return jsonify(format_mission(mission, pack, lang))


@app.route("/api/mission/next")
def next_mission_flow():
    lang = request.args.get("lang", "en")
    reset = request.args.get("reset", "false").lower() == "true"

    if reset:
        save_progress(0)

    current_data = get_save_data()
    current_id = current_data.get("last_mission", 0)

    next_id = current_id + 1
    total = get_total_missions()

    if next_id > total:
        next_id = 1  # loop infinito

    mission, pack = find_mission(next_id)

    if mission:
        save_progress(next_id)
        return jsonify(format_mission(mission, pack, lang))

    return jsonify({"error": "No mission found"}), 404


# =========================
# 🧠 TRAINING CONFIG
# =========================

@app.route("/api/config")
def api_config():
    return jsonify({
        "breathing_seconds": 30,
        "silence_seconds": 60,
        "phase_1_words": 300,
        "phase_2_words": 600,
        "voice": "male_en",
        "loop": True
    })


@app.route("/api/silence/<int:level>")
def api_silence(level):
    if level <= 7:
        t = 180
    elif level <= 14:
        t = 360
    elif level <= 21:
        t = 600
    elif level <= 28:
        t = 900
    else:
        t = 1200
    
    return jsonify({"level": level, "silence_time": t})


@app.route("/api/breath/<int:level>")
def api_breath(level):
    if level <= 7:
        interval = 60
    elif level <= 14:
        interval = 50
    elif level <= 21:
        interval = 40
    elif level <= 28:
        interval = 30
    else:
        interval = 25
    
    return jsonify({"level": level, "breath_interval_sec": interval})


# =========================
# 🏠 STATIC
# =========================

@app.route("/")
def home():
    return send_from_directory("static", "session.html")

@app.route("/static/<path:path>")
def static_files(path):
    return send_from_directory("static", path)


# =========================
# 🚀 START
# =========================
if __name__ == "__main__":
    if not os.path.exists(os.path.join(BASE, "save_game.json")):
        save_progress(0)

    print("🚀 AL CIELO PRO SERVER RUNNING ON PORT 10000")
    app.run(host="0.0.0.0", port=10000, debug=True)
