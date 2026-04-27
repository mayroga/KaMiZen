/**
 * 🧠 KAMIZEN FLASK CORE — ROBUST STABLE VERSION
 * JSON-driven system (NO AI logic changes)
 * Safe mission flow + error-proof API + stable file handling
 */

from flask import Flask, jsonify, send_from_directory, request
import os
import json
import random
from threading import Lock

app = Flask(__name__, static_folder="static")
BASE = os.path.dirname(__file__)

# =========================
# 🔒 THREAD SAFE LOCK
# =========================
lock = Lock()

# =========================
# 💾 SAVE SYSTEM (ROBUST)
# =========================
def get_save_data():
    try:
        path = os.path.join(BASE, "save_game.json")

        if not os.path.exists(path):
            return {"last_mission": 0, "score": 0}

        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)

        return {
            "last_mission": int(data.get("last_mission", 0)),
            "score": int(data.get("score", 0))
        }

    except Exception as e:
        print("SAVE READ ERROR:", e)
        return {"last_mission": 0, "score": 0}


def save_progress(mid, score):
    try:
        path = os.path.join(BASE, "save_game.json")

        data = {
            "last_mission": int(mid),
            "score": int(score)
        }

        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f)

    except Exception as e:
        print("SAVE WRITE ERROR:", e)

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
        print(f"LOAD ERROR {file}:", e)
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
        d = load_json(f)
        if d:
            data.append(d)

    return data

# =========================
# 🧠 AI STATE (SAFE CORE ONLY)
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
    try:
        base = contexts.get(context, contexts["school"])

        dynamic = ["CONTROL", "FOCUS", "OBSERVE", "THINK", "PAUSE", "CALM"]

        pool = list(set(base + random.sample(dynamic, 3)))
        return [w.upper() for w in pool]

    except Exception as e:
        print("WORD GEN ERROR:", e)
        return ["FOCUS", "CALM", "CONTROL"]


def pick_context():
    try:
        return random.choice(list(contexts.keys()))
    except:
        return "school"

# =========================
# 🎯 DIFFICULTY
# =========================
def difficulty():
    try:
        score = user_ai.get("score", 0)

        if score < 100:
            return "easy"
        elif score < 300:
            return "medium"
        return "hard"

    except:
        return "easy"

# =========================
# 🎮 FORMAT MISSION (SAFE)
# =========================
def format_mission(mission, pack, lang="en"):
    try:
        blocks = mission.get("blocks", [])

        story_block = next((b for b in blocks if b.get("type") == "story"), {})
        decision_block = next((b for b in blocks if b.get("type") == "decision"), {})

        context = pick_context()

        return {
            "id": mission.get("id"),
            "level": mission.get("level"),
            "theme": mission.get("theme"),
            "chapter": pack.get("chapter", 1),
            "ui": pack.get("ui", {}),
            "matrix_rules": pack.get("matrix_rules", []),

            "difficulty": difficulty(),
            "context": context,

            "story": story_block.get("text", {}).get(lang, ""),

            "words": generate_words(context),

            "options": [
                {
                    "text": opt.get("text", {}).get(lang, ""),
                    "score": opt.get("score", 0),
                    "correct": opt.get("correct", False),
                    "explanation": opt.get("explanation", {}).get(lang, "")
                }
                for opt in decision_block.get("options", [])
            ]
        }

    except Exception as e:
        print("FORMAT ERROR:", e)
        return {
            "id": 0,
            "theme": "ERROR",
            "story": "System error",
            "options": []
        }

# =========================
# 🔍 FIND MISSION (SAFE)
# =========================
def find_mission(mid):
    try:
        datasets = get_all_missions()

        for pack in datasets:
            for m in pack.get("missions", []):
                if m.get("id") == mid:
                    return m, pack

        return None, None

    except Exception as e:
        print("FIND ERROR:", e)
        return None, None


def get_total_missions():
    return 35

# =========================
# 🎯 API: MISSION BY ID
# =========================
@app.route("/api/mission/<int:mission_id>")
def api_mission(mission_id):
    try:
        lang = request.args.get("lang", "en")

        mission, pack = find_mission(mission_id)

        if not mission:
            return jsonify({"error": "Mission not found"}), 404

        return jsonify(format_mission(mission, pack, lang))

    except Exception as e:
        print("API ERROR:", e)
        return jsonify({"error": "server error"}), 500

# =========================
# 🎯 API: NEXT MISSION (ROBUST FLOW)
# =========================
@app.route("/api/mission/next")
def next_mission_flow():
    with lock:
        try:
            lang = request.args.get("lang", "en")
            reset = request.args.get("reset", "false").lower() == "true"

            if reset:
                save_progress(0, 0)

            current = get_save_data()

            current_id = int(current.get("last_mission", 0))
            score = int(current.get("score", 0))

            next_id = current_id + 1

            if next_id > get_total_missions():
                next_id = 1

            mission, pack = find_mission(next_id)

            if not mission:
                return jsonify({"error": "No mission found"}), 404

            user_ai["score"] = score

            save_progress(next_id, user_ai["score"])

            return jsonify(format_mission(mission, pack, lang))

        except Exception as e:
            print("NEXT MISSION ERROR:", e)
            return jsonify({"error": "flow error"}), 500

# =========================
# 🧠 UPDATE AI STATE
# =========================
@app.route("/api/update", methods=["POST"])
def update_ai():
    try:
        data = request.json or {}
        score = int(data.get("score", 0))

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

    except Exception as e:
        print("UPDATE ERROR:", e)
        return jsonify({"status": "error"}), 500

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
# 🚀 START SAFE
# =========================
if __name__ == "__main__":
    try:
        path = os.path.join(BASE, "save_game.json")

        if not os.path.exists(path):
            save_progress(0, 0)

        print("🚀 KAMIZEN CLEAN CORE RUNNING ON PORT 10000")

        app.run(host="0.0.0.0", port=10000, debug=True)

    except Exception as e:
        print("FATAL START ERROR:", e)
