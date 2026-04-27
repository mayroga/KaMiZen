# main.py
from flask import Flask, jsonify, request, send_from_directory
import json
import os

app = Flask(__name__, static_folder="static")

# =========================
# 📦 FILE SYSTEM SAFE LOAD
# =========================
FILES = [
    "static/missions_01_07.json",
    "static/missions_08_14.json",
    "static/missions_15_21.json",
    "static/missions_22_28.json",
    "static/missions_29_35.json",
]

all_missions = []
mission_index = 0


def load_all_missions():
    global all_missions

    all_missions = []

    for path in FILES:
        try:
            if not os.path.exists(path):
                continue

            with open(path, "r", encoding="utf-8") as f:
                data = json.load(f)

                missions = data.get("missions", [])
                if isinstance(missions, list):
                    all_missions.extend(missions)

        except Exception as e:
            print(f"[MISSION LOAD ERROR] {path}: {e}")

    # ordenar por id
    try:
        all_missions.sort(key=lambda x: x.get("id", 0))
    except Exception as e:
        print("[SORT ERROR]", e)


# =========================
# 🔄 SAFE RESET LOOP (INFINITE READY)
# =========================
def reset_if_needed():
    global mission_index
    if mission_index >= len(all_missions):
        mission_index = 0


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

    if not all_missions:
        return jsonify({
            "error": "no missions loaded",
            "hint": "check JSON files"
        }), 500

    reset_if_needed()

    mission = all_missions[mission_index]
    mission_index += 1

    # =========================
    # 🧠 NORMALIZE SAFE OUTPUT
    # =========================
    blocks = mission.get("blocks", [])

    story = ""
    options = []

    for b in blocks:
        if b.get("type") == "story":
            t = b.get("text", {})
            story = t.get(lang, t.get("en", ""))

        if b.get("type") == "decision":
            options = b.get("options", [])

    return jsonify({
        "id": mission.get("id"),
        "level": mission.get("level"),
        "theme": mission.get("theme"),
        "story": story,
        "options": options
    })


@app.route("/api/config")
def config():
    return jsonify({
        "status": "ok",
        "missions_loaded": len(all_missions)
    })


# =========================
# 🚀 INIT SAFE (NO deprecated Flask hooks)
# =========================
load_all_missions()


if __name__ == "__main__":
    try:
        load_all_missions()
        print(f"[OK] Missions loaded: {len(all_missions)}")
        app.run(host="0.0.0.0", port=10000, debug=True)
    except Exception as e:
        print("[FATAL ERROR]", e)
