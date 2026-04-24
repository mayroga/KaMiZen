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
    data = load_json("save_game.json")
    if data is None:
        return {"last_mission": 0, "score": 0}
    return data

def save_progress(mid, score=None):
    path = os.path.join(BASE, "save_game.json")

    data = {"last_mission": mid}
    if score is not None:
        data["score"] = score

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
    data = []
    for f in files:
        j = load_json(f)
        if j:
            data.append(j)
    return data

# =========================
# 🧠 IA CORE (NEW LAYER)
# =========================

used_explanations = deque(maxlen=80)

user_ai = {
    "score": 0,
    "stress": 0,
    "focus": 50,
    "discipline": 50,
    "stage": "school"
}

contexts = {
    "school": ["focus", "listen", "learn", "respect", "discipline"],
    "street": ["awareness", "risk control", "observation"],
    "money": ["discipline", "saving", "strategy", "control"],
    "family": ["respect", "communication", "empathy"],
    "future": ["planning", "vision", "long term thinking"],
    "security": ["avoid danger", "read situations"],
    "happiness": ["balance", "calm mind", "gratitude"],
    "business": ["strategy", "risk control", "decision making"]
}

explanations = [
    "Control emotions before reacting changes outcomes.",
    "Thinking first avoids long term mistakes.",
    "Silence reveals what noise hides.",
    "Respect builds long term trust.",
    "Discipline creates freedom over time.",
    "Every decision builds your identity.",
    "Awareness is stronger than speed.",
    "Observation is better than reaction.",
    "Calm mind produces better results.",
    "Responsibility creates leadership.",
    "Your decisions today build your future.",
    "Smart thinking reduces mistakes.",
    "Focus determines your results.",
    "Reacting fast often creates errors.",
    "Thinking slow is thinking strong."
]

# =========================
# 🧠 AI FUNCTIONS
# =========================

def pick_explanation():
    available = [e for e in explanations if e not in used_explanations]

    if not available:
        used_explanations.clear()
        available = explanations

    chosen = random.choice(available)
    used_explanations.append(chosen)
    return chosen


def difficulty():
    if user_ai["score"] < 100:
        return "easy"
    elif user_ai["score"] < 300:
        return "medium"
    return "hard"


def generate_words(context):
    base = contexts.get(context, contexts["school"])

    dynamic = [
        "CONTROL", "FOCUS", "DECIDE", "OBSERVE",
        "THINK FAST", "THINK DEEP", "ACT SMART"
    ]

    result = list(set(base + random.sample(dynamic, 3)))
    return [w.upper() for w in result]


def pick_context():
    return random.choice(list(contexts.keys()))

# =========================
# 🎮 FORMAT SYSTEM (COMPATIBLE)
# =========================
def format_mission(mission, pack, lang="en"):
    if not mission:
        return None

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

        # 🧠 IA WORDS (NEW)
        "words": generate_words(context),

        # 🧠 IA EXPLANATION
        "ai_explanation": pick_explanation(),

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
# 🔍 SEARCH LOGIC (UNCHANGED)
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
        save_progress(0)

    current_data = get_save_data()
    current_id = current_data.get("last_mission", 0)
    score = current_data.get("score", 0)

    next_id = current_id + 1

    if next_id > get_total_missions():
        next_id = 1

    mission, pack = find_mission(next_id)

    if mission:
        user_ai["score"] = score + 1

        save_progress(next_id, user_ai["score"])

        return jsonify(format_mission(mission, pack, lang))

    return jsonify({"error": "No mission found"}), 404


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

    print("🚀 AL CIELO HYBRID AI SERVER RUNNING ON PORT 10000")
    app.run(host="0.0.0.0", port=10000, debug=True)
