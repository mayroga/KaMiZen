from flask import Flask, jsonify, send_from_directory
import json
import os

app = Flask(__name__, static_folder="static")

BASE = os.path.dirname(__file__)

# =========================
# LOAD JSON FILES
# =========================
def load_all_files():
    files = []
    for f in os.listdir(BASE):
        if f.startswith("missions_") and f.endswith(".json"):
            files.append(f)
    return files


def load_json(file):
    path = os.path.join(BASE, file)
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


# =========================
# GET ALL MISSIONS (FLAT MAP)
# =========================
def get_all_missions():
    missions = {}

    for file in load_all_files():
        try:
            data = load_json(file)
            for m in data.get("missions", []):
                missions[m["id"]] = m
        except Exception as e:
            print("[ERROR]", file, e)

    return missions


# CACHE (FAST + STABLE)
MISSIONS_CACHE = get_all_missions()


# =========================
# API: MISSION
# =========================
@app.route("/api/mission/<int:mission_id>")
def mission(mission_id):
    data = MISSIONS_CACHE.get(mission_id)

    if not data:
        return jsonify({"error": "mission not found"}), 404

    return jsonify(data)


# =========================
# API: RANGE (UI FLOW)
# =========================
@app.route("/api/range/<int:start>/<int:end>")
def range_missions(start, end):
    result = [
        m for mid, m in MISSIONS_CACHE.items()
        if start <= mid <= end
    ]

    return jsonify(result)


# =========================
# API: META (NO LOGIC)
# =========================
@app.route("/api/meta")
def meta():
    return jsonify({
        "total_missions": len(MISSIONS_CACHE),
        "range": "1-35",
        "engine": "kamizen_core_v2"
    })


# =========================
# HOME
# =========================
@app.route("/")
def home():
    return send_from_directory("static", "session.html")


# =========================
# STATIC FILES
# =========================
@app.route("/static/<path:path>")
def static_files(path):
    return send_from_directory("static", path)


# =========================
# RUN
# =========================
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=10000, debug=True)
