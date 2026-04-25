from flask import Flask, jsonify, send_from_directory, request
import os
import json
import random
from collections import deque

app = Flask(__name__, static_folder="static")

BASE = os.path.dirname(__file__)

# =========================
# 💾 SAVE SYSTEM
# =========================
def get_save_data():
    path = os.path.join(BASE, "save_game.json")
    if not os.path.exists(path):
        return {"last_mission": 0, "score": 0}
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

def save_progress(mid, score):
    path = os.path.join(BASE, "save_game.json")
    data = {
        "last_mission": mid,
        "score": score
    }
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f)

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
    return [load_json(f) for f in files if load_json(f)]

# =========================
# 🧠 AI STATE (SOLO LOGICA)
# =========================
user_ai = {
    "score": 0,
    "stress": 0,
    "focus": 50,
    "discipline": 50,
    "stage": "school"
}

contexts = {
    "school": ["focus", "listen", "learn", "discipline"],
    "street": ["awareness", "risk control", "observation"],
    "money": ["discipline", "saving", "strategy"],
    "family": ["respect", "communication"],
    "future": ["planning", "vision"],
    "security": ["avoid danger", "read situations"],
    "business": ["strategy", "decision making"]
}

# =========================
# 🧠 WORD SYSTEM
# =========================
def generate_words(context):
    base = contexts.get(context, contexts["school"])

    dynamic = [
        "CONTROL", "FOCUS", "OBSERVE",
        "THINK", "PAUSE", "CALM"
    ]

    result = list(set(base + random.sample(dynamic, 3)))
    return [w.upper() for w in result]

def pick_context():
    return random.choice(list(contexts.keys()))

# =========================
# 🎯 DIFFICULTY
# =========================
def difficulty():
    if user_ai["score"] < 100:
        return "easy"
    elif user_ai["score"] < 300:
        return "medium"
    return "hard"

# =========================
# 🎮 FORMAT MISSION
# =========================
def format_mission(mission, pack, lang="en"):
    story_block = next((b for b in mission["blocks"] if b["type"] == "story"), {})
    decision_block = next((b for b in mission["blocks"] if b["type"] == "decision"), {})

    context = pick_context()

    return {
        "id": mission.get("id"),
        "level": mission.get("level"),
        "theme": mission.get("theme"),
        "chapter": pack.get("chapter"),
        "ui": pack.get("ui", {}),
        "matrix_rules": pack.get("matrix_rules", []),

        "difficulty": difficulty(),
        "context": context,

        "story": story_block.get("text", {}).get(lang, ""),

        # IA WORDS (ÚNICO USO DE IA)
        "words": generate_words(context),

        # OPTIONS (JSON ONLY SOURCE OF EXPLANATION)
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
# 🔍 FIND MISSION
# =========================
def find_mission(mid):
    datasets = get_all_missions()
    for pack in datasets:
        for m in pack.get("missions", []):
            if m.get("id") == mid:
                return m, pack
    return None, None

def get_total_missions():
    return 35

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
        save_progress(0, 0)

    current = get_save_data()
    current_id = current.get("last_mission", 0)
    score = current.get("score", 0)

    next_id = current_id + 1
    if next_id > get_total_missions():
        next_id = 1

    mission, pack = find_mission(next_id)

    if not mission:
        return jsonify({"error": "No mission found"}), 404

    user_ai["score"] = score

    save_progress(next_id, user_ai["score"])

    return jsonify(format_mission(mission, pack, lang))

# =========================
# 🧠 UPDATE AI STATE
# =========================
@app.route("/api/update", methods=["POST"])
def update_ai():
    data = request.json
    score = data.get("score", 0)

    user_ai["score"] += score

    if score < 0:
        user_ai["stress"] += 1
        user_ai["focus"] -= 1
    else:
        user_ai["focus"] += 1

    return jsonify({
        "status": "ok",
        "ai_state": user_ai
    })

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
        save_progress(0, 0)

    print("🚀 KAMIZEN CLEAN CORE RUNNING ON PORT 10000")
    app.run(host="0.0.0.0", port=10000, debug=True)
