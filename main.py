from flask import Flask, jsonify, send_from_directory
import os
import json

app = Flask(__name__, static_folder="static")

BASE = os.path.dirname(__file__)

# =========================
# 📦 LOAD MISSION FILES SAFE
# =========================
def load_json(file):
    try:
        path = os.path.join(BASE, file)
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

    data = []

    for f in files:
        j = load_json(f)
        if j:
            data.append(j)

    return data


# =========================
# 🎯 FIND MISSION (PURE DATA)
# =========================
def find_mission(mid):
    datasets = get_all_missions()

    for pack in datasets:
        for m in pack.get("missions", []):
            if m.get("id") == mid:
                return m

    return None


# =========================
# 📊 GET CHAPTER (RAW JSON ONLY)
# =========================
def find_chapter(chapter_id):
    datasets = get_all_missions()

    for pack in datasets:
        if pack.get("chapter") == chapter_id:
            return pack

    return None


# =========================
# 🎮 API: MISSION
# =========================
@app.route("/api/mission/<int:mission_id>")
def api_mission(mission_id):
    mission = find_mission(mission_id)

    if not mission:
        return jsonify({
            "error": "Mission not found",
            "id": mission_id
        }), 404

    return jsonify(mission)


# =========================
# 📘 API: CHAPTER (RAW DATA)
# =========================
@app.route("/api/chapter/<int:chapter_id>")
def api_chapter(chapter_id):
    chapter = find_chapter(chapter_id)

    if not chapter:
        return jsonify({
            "error": "Chapter not found",
            "id": chapter_id
        }), 404

    return jsonify(chapter)


# =========================
# 🔁 NEXT MISSION (NO LOGIC)
# =========================
@app.route("/api/next/<int:mission_id>")
def api_next(mission_id):

    next_id = mission_id + 1

    if next_id > 35:
        next_id = 1

    return jsonify({
        "next": next_id
    })


# =========================
# 🧠 SILENCE CONFIG (FOR SESSION.HTML)
# =========================
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

    return jsonify({
        "level": level,
        "silence_time": t
    })


# =========================
# 🌬️ BREATH CONFIG (SYNC WITH UI)
# =========================
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

    return jsonify({
        "level": level,
        "breath_interval_sec": interval
    })


# =========================
# 🏠 FRONTEND ENTRY
# =========================
@app.route("/")
def home():
    return send_from_directory("static", "session.html")


# =========================
# 📁 STATIC FILES
# =========================
@app.route("/static/<path:path>")
def static_files(path):
    return send_from_directory("static", path)


# =========================
# 🚀 RUN SERVER
# =========================
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=10000, debug=True)
