# main.py
from flask import Flask, jsonify, request, send_from_directory
import json
import os

app = Flask(__name__, static_folder="static")

# =========================
# 📂 CONFIG RANGOS
# =========================
RANGES = [
    (1, 7,  "static/missions_01_07.json"),
    (8, 14, "static/missions_08_14.json"),
    (15,21, "static/missions_15_21.json"),
    (22,28, "static/missions_22_28.json"),
    (29,35, "static/missions_29_35.json"),
]

# cache en memoria por archivo
cache = {}

mission_index = 1


# =========================
# 📦 LOAD FILE ON DEMAND
# =========================
def get_file_for_mission(mid):
    for start, end, path in RANGES:
        if start <= mid <= end:
            return path
    return None


def load_file(path):
    if path in cache:
        return cache[path]

    try:
        if not os.path.exists(path):
            return None

        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
            cache[path] = data
            return data

    except Exception as e:
        print(f"[LOAD ERROR] {path}:", e)
        return None


# =========================
# 🔄 LOOP CONTROL
# =========================
def next_index():
    global mission_index
    mission_index += 1
    if mission_index > 35:
        mission_index = 1


# =========================
# 🌐 ROUTES
# =========================
@app.route("/")
def home():
    return send_from_directory("static", "session.html")


@app.route("/api/mission/next")
def next_mission():
    global mission_index

    lang = request.args.get("lang", "en")

    path = get_file_for_mission(mission_index)
    if not path:
        return jsonify({"error": "invalid range"}), 500

    data = load_file(path)
    if not data:
        return jsonify({"error": "file not loaded"}), 500

    missions = data.get("missions", [])

    mission = next((m for m in missions if m.get("id") == mission_index), None)

    if not mission:
        next_index()
        return jsonify({"error": "mission not found"}), 404

    # =========================
    # 🧠 EXTRAER EXACTO DEL JSON
    # =========================
    story = ""
    analysis = ""
    options = []

    for b in mission.get("blocks", []):
        if b.get("type") == "story":
            story = b.get("text", {}).get(lang, b.get("text", {}).get("en", ""))

        elif b.get("type") == "analysis":
            analysis = b.get("text", {}).get(lang, b.get("text", {}).get("en", ""))

        elif b.get("type") == "decision":
            options = b.get("options", [])

    response = {
        "id": mission.get("id"),
        "level": mission.get("level"),
        "theme": mission.get("theme"),
        "story": story,
        "analysis": analysis,
        "options": options
    }

    next_index()
    return jsonify(response)


@app.route("/api/config")
def config():
    return jsonify({
        "status": "ok",
        "cache_files": list(cache.keys())
    })


# =========================
# 🚀 START
# =========================
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=10000, debug=True)
