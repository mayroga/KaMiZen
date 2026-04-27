import os
import json
from flask import Flask, jsonify, send_from_directory

app = Flask(__name__, static_folder="static")

# =========================
# CONFIG
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
# 📥 LOAD JSON (ROOT FOLDER)
# =========================
def load_json(filename):
    if filename in CACHE:
        return CACHE[filename]

    path = os.path.join(os.getcwd(), filename)  # 🔥 RAÍZ DEL PROYECTO

    print("📂 buscando:", path)

    if not os.path.exists(path):
        print("❌ NO EXISTE:", path)
        return None

    try:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
            CACHE[filename] = data
            print("✅ cargado:", filename)
            return data
    except Exception as e:
        print("❌ error json:", filename, e)
        return None


# =========================
# 🔎 FIND SESSION
# =========================
def find_session(session_id):
    for file in JSON_FILES:
        data = load_json(file)
        if not data:
            continue

        sessions = data.get("ses", [])

        for s in sessions:
            if s.get("id") == session_id:
                print("🎯 FOUND:", session_id)
                return s

    print("⚠️ NOT FOUND:", session_id)
    return None


# =========================
# 🔁 LOOP INFINITO
# =========================
def get_next_session():
    global MISSION_POINTER

    session = find_session(MISSION_POINTER)

    if not session:
        MISSION_POINTER = 1
        session = find_session(MISSION_POINTER)

    MISSION_POINTER += 1
    if MISSION_POINTER > 35:
        MISSION_POINTER = 1

    return session


# =========================
# 🧠 PARSER JSON NUEVO
# =========================
def parse_session(session):
    if not session:
        return {}

    story = []
    analysis = ""
    options = []

    for b in session.get("b", []):

        t = b.get("t")

        if t in ["v", "h"]:
            story.append(b.get("tx", ""))

        elif t == "c":
            analysis = b.get("tx", "")

        elif t == "d":
            ops = b.get("op", [])
            correct = b.get("c", 0)
            ex = b.get("ex", [])

            for i, op in enumerate(ops):
                options.append({
                    "text": {"en": op, "es": op},
                    "correct": i == correct,
                    "explanation": {
                        "en": ex[i] if i < len(ex) else "",
                        "es": ex[i] if i < len(ex) else ""
                    }
                })

    return {
        "id": session.get("id"),
        "theme": session.get("cat"),
        "story": " ".join(story),
        "analysis": analysis,
        "options": options
    }


# =========================
# 🌐 ROUTES
# =========================
@app.route("/")
def home():
    return send_from_directory("static", "session.html")


@app.route("/api/mission/next")
def next_mission():
    session = get_next_session()

    if not session:
        return jsonify({"error": "no session"}), 500

    return jsonify(parse_session(session))


@app.route("/static/<path:path>")
def static_files(path):
    return send_from_directory("static", path)


# =========================
# 🚀 RUN
# =========================
if __name__ == "__main__":
    print("🔥 SERVER RUNNING...")
    app.run(host="0.0.0.0", port=5000, debug=True)
