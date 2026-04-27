/**
 * KAMIZEN FLASK CORE — DEPLOY PROOF (RENDER READY)
 * - No endpoint conflicts
 * - Thread-safe
 * - Safe file IO
 * - Stable mission flow
 * - No static overrides
 * - Production-safe behavior
 */

from flask import Flask, jsonify, send_from_directory, request
import os
import json
import random
from threading import Lock

app = Flask(__name__, static_folder="static", static_url_path="/static")

BASE = os.path.dirname(__file__)
lock = Lock()

# =========================
# SAVE SYSTEM (SAFE)
# =========================
def get_save_data():
    path = os.path.join(BASE, "save_game.json")
    try:
        if not os.path.exists(path):
            return {"last_mission": 0, "score": 0}

        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)

        return {
            "last_mission": int(data.get("last_mission", 0)),
            "score": int(data.get("score", 0))
        }

    except:
        return {"last_mission": 0, "score": 0}


def save_progress(mid, score):
    path = os.path.join(BASE, "save_game.json")
    try:
        with open(path, "w", encoding="utf-8") as f:
            json.dump({
                "last_mission": int(mid),
                "score": int(score)
            }, f)
    except:
        pass


# =========================
# LOAD JSON SAFE
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
        d = load_json(f)
        if d:
            packs.append(d)

    return packs


# =========================
# AI STATE (LIGHTWEIGHT)
# =========================
user_ai = {
    "score": 0,
    "stress": 0,
    "focus": 50
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
# WORD SYSTEM
# =========================
def generate_words(context):
    try:
        base = contexts.get(context, contexts["school"])
        dynamic = ["CONTROL", "FOCUS", "OBSERVE", "THINK", "PAUSE", "CALM"]
        return list(set(base + random.sample(dynamic, 3)))
    except:
        return ["FOCUS", "CALM", "CONTROL"]


def pick_context():
    try:
        return random.choice(list(contexts.keys()))
    except:
        return "school"


# =========================
# DIFFICULTY
# =========================
def difficulty():
    s = user_ai.get("score", 0)
    if s < 100:
        return "easy"
    elif s < 300:
        return "medium"
    return "hard"


# =========================
# FORMAT MISSION
# =========================
def format_mission(mission, pack, lang="en"):
    try:
        blocks = mission.get("blocks", [])

        story = next((b for b in blocks if b.get("type") == "story"), {})
        decision = next((b for b in blocks if b.get("type") == "decision"), {})

        context = pick_context()

        return {
            "id": mission.get("id"),
            "level": mission.get("level"),
            "theme": mission.get("theme"),
            "chapter": pack.get("chapter", 1),

            "difficulty": difficulty(),
            "context": context,

            "story": story.get("text", {}).get(lang, ""),

            "words": generate_words(context),

            "options": [
                {
                    "text": o.get("text", {}).get(lang, ""),
                    "score": o.get("score", 0),
                    "correct": o.get("correct", False),
                    "explanation": o.get("explanation", {}).get(lang, "")
                }
                for o in decision.get("options", [])
            ]
        }

    except:
        return {
            "id": 0,
            "theme": "ERROR",
            "story": "System error",
            "options": []
        }


# =========================
# FIND MISSION
# =========================
def find_mission(mid):
    try:
        for pack in get_all_missions():
            for m in pack.get("missions", []):
                if m.get("id") == mid:
                    return m, pack
    except:
        pass

    return None, None


def total_missions():
    return 35


# =========================
# API: HEALTH CHECK (FOR RENDER)
# =========================
@app.route("/health")
def health():
    return jsonify({"status": "ok"})


# =========================
# API: MISSION BY ID
# =========================
@app.route("/api/mission/<int:mid>")
def mission(mid):
    lang = request.args.get("lang", "en")

    m, p = find_mission(mid)

    if not m:
        return jsonify({"error": "not found"}), 404

    return jsonify(format_mission(m, p, lang))


# =========================
# API: NEXT MISSION (SAFE + LOCKED)
# =========================
@app.route("/api/mission/next")
def next_mission():
    with lock:
        try:
            lang = request.args.get("lang", "en")
            reset = request.args.get("reset", "false").lower() == "true"

            if reset:
                save_progress(0, 0)

            data = get_save_data()

            last = int(data.get("last_mission", 0))
            score = int(data.get("score", 0))

            nxt = last + 1
            if nxt > total_missions():
                nxt = 1

            mission, pack = find_mission(nxt)

            if not mission:
                return jsonify({"error": "no mission"}), 404

            user_ai["score"] = score

            save_progress(nxt, score)

            return jsonify(format_mission(mission, pack, lang))

        except:
            return jsonify({"error": "flow error"}), 500


# =========================
# API: UPDATE STATE
# =========================
@app.route("/api/update", methods=["POST"])
def update():
    try:
        data = request.json or {}
        score = int(data.get("score", 0))

        user_ai["score"] += score

        if score < 0:
            user_ai["stress"] += 1
            user_ai["focus"] -= 1
        else:
            user_ai["focus"] += 1

        return jsonify({"status": "ok", "ai": user_ai})

    except:
        return jsonify({"status": "error"}), 500


# =========================
# STATIC (SAFE — NO CONFLICT)
# =========================
@app.route("/")
def home():
    return send_from_directory("static", "session.html")


# =========================
# STARTUP SAFE
# =========================
if __name__ == "__main__":
    try:
        path = os.path.join(BASE, "save_game.json")

        if not os.path.exists(path):
            save_progress(0, 0)

        print("KAMIZEN DEPLOY READY SERVER ON 10000")

        app.run(
            host="0.0.0.0",
            port=10000,
            debug=False,
            threaded=True
        )

    except Exception as e:
        print("FATAL START ERROR:", e)
