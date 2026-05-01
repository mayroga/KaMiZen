from flask import Flask, jsonify, send_from_directory
import json
import os

app = Flask(__name__, static_folder="static")

# =========================
# BASE PATH
# =========================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# =========================
# LOAD JSON SAFE
# =========================
def load_json(file_name):
    path = os.path.join(BASE_DIR, file_name)
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

# =========================
# STORIES PROVIDER
# =========================
@app.route("/api/stories/<int:index>")
def get_story(index):
    try:
        data = load_json("stories.json")

        for item in data["stories"]:
            if item["id"] == index:
                return jsonify(item)

        return jsonify({"error": "story_not_found"})

    except Exception as e:
        return jsonify({"error": str(e)})

# =========================
# MISSIONS PROVIDER (ROUTER SIMPLE)
# =========================
@app.route("/api/missions/<int:index>")
def get_mission(index):

    try:
        if 1 <= index <= 7:
            file = "missions_01_07.json"
            key = "missions"

        elif 8 <= index <= 14:
            file = "missions_08_14.json"
            key = "missions"

        elif 15 <= index <= 21:
            file = "missions_15_21.json"
            key = "missions"

        elif 22 <= index <= 28:
            file = "missions_22_28.json"
            key = "missions"

        else:
            file = "missions_29_35.json"
            key = "ses"

        data = load_json(file)

        for m in data[key]:
            if m["id"] == index:
                return jsonify(m)

        return jsonify({"error": "mission_not_found"})

    except Exception as e:
        return jsonify({"error": str(e)})

# =========================
# SESSION ENTRY (STATIC)
# =========================
@app.route("/")
def index():
    return send_from_directory("static", "session.html")

# =========================
# HEALTH CHECK (DEBUG)
# =========================
@app.route("/api/health")
def health():
    return jsonify({
        "status": "ok",
        "mode": "data_provider_only"
    })

# =========================
# RUN SERVER
# =========================
if __name__ == "__main__":
    app.run(debug=True, threaded=True)
