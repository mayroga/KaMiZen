from flask import Flask, jsonify, send_from_directory, request
import os
import json
import random
import time

app = Flask(__name__, static_folder="static")

BASE = os.path.dirname(__file__)

# =========================
# 💾 SAVE SYSTEM
# =========================
def get_save_data():
    path = os.path.join(BASE, "save_game.json")
    if not os.path.exists(path):
        return {"last_mission": 0, "score": 0}
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except:
        return {"last_mission": 0, "score": 0}

def save_progress(mid, score):
    path = os.path.join(BASE, "save_game.json")
    with open(path, "w", encoding="utf-8") as f:
        json.dump({"last_mission": mid, "score": score}, f)

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
    packs = []
    for f in files:
        data = load_json(f)
        if data:
            packs.append(data)
    return packs

# =========================
# 🧠 STATE
# =========================
user_ai = {
    "score": 0,
    "stress": 0,
    "focus": 50,
    "discipline": 50,
    "stage": "school"
}

contexts = {
    "school": ["FOCUS", "LISTEN", "LEARN", "DISCIPLINE"],
    "street": ["AWARENESS", "RISK", "OBSERVE"],
    "money": ["SAVE", "STRATEGY", "DISCIPLINE"],
    "family": ["RESPECT", "COMMUNICATE"],
    "future": ["PLAN", "VISION"],
    "security": ["CONTROL", "CALM"],
    "business": ["STRATEGY", "DECIDE"]
}

# =========================
# WORDS
# =========================
def generate_words(context):
    base = contexts.get(context, contexts["school"])
    extra = ["CONTROL", "FOCUS", "CALM", "THINK"]
    return list(set(base + random.sample(extra, 2)))

def pick_context():
    return random.choice(list(contexts.keys()))

# =========================
# DIFFICULTY
# =========================
def difficulty(score):
    if score < 100:
        return "easy"
    elif score < 300:
        return "medium"
    return "hard"

# =========================
# FORMAT
# =========================
def format_mission(mission, pack, lang="en"):
    story = ""
    options = []

    for b in mission.get("blocks", []):
        if b.get("type") == "story":
            story = b.get("text", {}).get(lang, "")
        if b.get("type") == "decision":
            for opt in b.get("options", []):
                options.append({
                    "text": opt["text"].get(lang, ""),
                    "score": opt.get("score", 0),
                    "correct": opt.get("correct", False),
                    "explanation": opt.get("explanation", {}).get(lang, "")
                })

    context = pick_context()

    return {
        "id": mission.get("id"),
        "theme": mission.get("theme"),
        "chapter": pack.get("chapter", ""),
        "story": story,
        "options": options,
        "difficulty": difficulty(user_ai["score"]),
        "context": context,
        "words": generate_words(context)
    }

# =========================
# FIND
# =========================
def find_mission(mid):
    for pack in get_all_missions():
        for m in pack.get("missions", []):
            if m.get("id") == mid:
                return m, pack
    return None, None

# =========================
# TOTAL
# =========================
def total_missions():
    return 35

# =========================
# API
# =========================
@app.route("/api/mission/<int:mid>")
def mission(mid):
    lang = request.args.get("lang", "en")
    m, p = find_mission(mid)
    if not m:
        return jsonify({"error": "not found"}), 404
    return jsonify(format_mission(m, p, lang))

@app.route("/api/mission/next")
def next_mission():
    lang = request.args.get("lang", "en")
    data = get_save_data()

    current = data.get("last_mission", 0)
    score = data.get("score", 0)

    next_id = current + 1
    if next_id > total_missions():
        next_id = 1

    m, p = find_mission(next_id)
    if not m:
        return jsonify({"error": "no mission"}), 404

    user_ai["score"] = score

    save_progress(next_id, user_ai["score"])

    return jsonify(format_mission(m, p, lang))

@app.route("/api/update", methods=["POST"])
def update():
    data = request.json
    score = data.get("score", 0)

    user_ai["score"] += score

    if score < 0:
        user_ai["stress"] += 1
        user_ai["focus"] -= 1
    else:
        user_ai["focus"] += 1

    return jsonify({"ok": True, "state": user_ai})

# =========================
# STATIC
# =========================
@app.route("/")
def home():
    return send_from_directory("static", "session.html")

@app.route("/static/<path:path>")
def static_files(path):
    return send_from_directory("static", path)

# =========================
# START
# =========================
if __name__ == "__main__":
    if not os.path.exists(os.path.join(BASE, "save_game.json")):
        save_progress(0, 0)

    print("KAMIZEN RUNNING 24/7")
    app.run(host="0.0.0.0", port=10000)
