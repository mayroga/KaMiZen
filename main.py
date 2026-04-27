from flask import Flask, jsonify, send_from_directory, request
import os
import json
import random

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
    with open(path, "w", encoding="utf-8") as f:
        json.dump({"last_mission": mid, "score": score}, f)

# =========================
# 📦 LOAD JSON
# =========================
def load_json(file):
    try:
        path = os.path.join(BASE, file)
        if not os.path.exists(path):
            return None
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except:
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
# 🧠 STATE
# =========================
user_ai = {
    "score": 0
}

# =========================
# 🎯 CORE LOGIC
# =========================
def pick_context():
    return random.choice(["focus", "calm", "risk", "control"])

def generate_words():
    return ["FOCUS", "CALM", "OBSERVE", "CONTROL", "THINK"]

def difficulty(score):
    if score < 100:
        return "easy"
    if score < 300:
        return "medium"
    return "hard"

# =========================
# 🎮 FORMAT
# =========================
def format_mission(mission, pack, lang="en"):
    story = mission["blocks"][0]["text"].get(lang, "")

    options = mission["blocks"][1]["options"]

    return {
        "id": mission.get("id"),
        "theme": mission.get("theme"),
        "story": story,
        "difficulty": difficulty(user_ai["score"]),
        "words": generate_words(),
        "options": [
            {
                "text": o["text"].get(lang, ""),
                "score": o.get("score", 0),
                "correct": o.get("correct", False),
                "explanation": o.get("explanation", {}).get(lang, "")
            }
            for o in options
        ]
    }

# =========================
# 🔍 FIND
# =========================
def find_mission(mid):
    for pack in get_all_missions():
        for m in pack.get("missions", []):
            if m["id"] == mid:
                return m, pack
    return None, None

# =========================
# 🎯 API
# =========================
@app.route("/api/mission/next")
def next_mission():
    lang = request.args.get("lang", "en")

    data = get_save_data()
    next_id = data["last_mission"] + 1

    mission, pack = find_mission(next_id)

    if not mission:
        return jsonify({"error": "no mission"}), 404

    save_progress(next_id, user_ai["score"])

    return jsonify(format_mission(mission, pack, lang))

# =========================
# 🏠 FRONTEND
# =========================
@app.route("/")
def home():
    return send_from_directory("static", "session.html")

@app.route("/static/<path:path>")
def static_files(path):
    return send_from_directory("static", path)

# =========================
# 🚀 RUN
# =========================
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=10000)
