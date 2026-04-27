import os
import json
from flask import Flask, jsonify, send_from_directory

app = Flask(__name__, static_folder="static")

# =========================
# 📂 CONFIG
# =========================
JSON_FILES = [
    "missions_01_07.json",
    "missions_08_14.json",
    "missions_15_21.json",
    "missions_22_28.json",
    "missions_29_35.json"
]

CACHE = {}
MISSION_POINTER = 1


# =========================
# 📥 LOAD JSON (CACHE)
# =========================
def load_json(filename):
    if filename in CACHE:
        return CACHE[filename]

    path = os.path.join(app.static_folder, filename)

    if not os.path.exists(path):
        return None

    try:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
            CACHE[filename] = data
            return data
    except Exception:
        return None


# =========================
# 🔎 FIND SESSION BY ID
# =========================
def find_session(session_id):
    for file in JSON_FILES:
        data = load_json(file)
        if not data:
            continue

        sessions = data.get("ses", [])
        for s in sessions:
            if s.get("id") == session_id:
                return s

    return None


# =========================
# 🔁 NEXT SESSION LOOP
# =========================
def get_next_session():
    global MISSION_POINTER

    session = find_session(MISSION_POINTER)

    if session is None:
        MISSION_POINTER = 1
        session = find_session(MISSION_POINTER)

    MISSION_POINTER += 1
    if MISSION_POINTER > 35:
        MISSION_POINTER = 1

    return session


# =========================
# 🧠 PARSER NUEVO FORMATO JSON
# =========================
def parse_session(session):
    if not session:
        return {}

    blocks = session.get("b", [])

    story_parts = []
    analysis = ""
    options = []

    for b in blocks:
        t = b.get("t")

        # narrativa (v + h)
        if t in ["v", "h"]:
            story_parts.append(b.get("tx", ""))

        # conclusión / análisis
        elif t == "c":
            analysis = b.get("tx", "")

        # decisión
        elif t == "d":
            ops = b.get("op", [])
            correct_index = b.get("c", 0)
            explanations = b.get("ex", [])

            for i, op in enumerate(ops):
                options.append({
                    "text": {
                        "en": op,
                        "es": op
                    },
                    "correct": i == correct_index,
                    "explanation": {
                        "en": explanations[i] if i < len(explanations) else "",
                        "es": explanations[i] if i < len(explanations) else ""
                    }
                })

    return {
        "id": session.get("id"),
        "theme": session.get("cat", "MISSION").upper(),
        "story": " ".join(story_parts),
        "analysis": analysis,
        "options": options
    }


# =========================
# 🌐 ROUTES
# =========================
@app.route("/")
def index():
    return send_from_directory("static", "session.html")


@app.route("/api/mission/next")
def next_mission():
    session = get_next_session()
    parsed = parse_session(session)
    return jsonify(parsed)


@app.route("/static/<path:path>")
def static_files(path):
    return send_from_directory("static", path)


# =========================
# 🚀 RUN
# =========================
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
