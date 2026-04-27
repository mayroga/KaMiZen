from flask import Flask, jsonify, request
import json
import os
from threading import Lock

app = Flask(__name__)

# =========================
# 📦 LOAD JSON FILES (ORDERED)
# =========================
MISSION_FILES = [
    "missions_01_07.json",
    "missions_08_14.json",
    "missions_15_21.json",
    "missions_22_28.json",
    "missions_29_35.json"
]

missions = []
lock = Lock()
index = 0


def load_missions():
    global missions

    all_missions = []

    for file in MISSION_FILES:
        path = os.path.join("static", file)

        try:
            with open(path, "r", encoding="utf-8") as f:
                data = json.load(f)
                all_missions.extend(data.get("missions", []))

        except Exception as e:
            print(f"ERROR LOADING {file}: {e}")

    missions = all_missions
    print(f"TOTAL MISSIONS LOADED: {len(missions)}")


# =========================
# 🎯 NEXT MISSION (INFINITE LOOP)
# =========================
@app.route("/api/mission/next")
def next_mission():
    global index

    lang = request.args.get("lang", "en")

    with lock:
        if not missions:
            return jsonify({"error": "no missions loaded"}), 500

        mission = missions[index]

        # advance pointer (infinite loop)
        index = (index + 1) % len(missions)

    # optional language cleanup (keeps session compatibility)
    def pick_text(obj):
        if isinstance(obj, dict):
            return obj.get(lang) or obj.get("en") or next(iter(obj.values()))
        return obj

    # adapt translation safely
    mission_copy = json.loads(json.dumps(mission))

    for block in mission_copy.get("blocks", []):
        if "text" in block:
            block["text"] = pick_text(block["text"])

        if block.get("type") == "decision":
            for opt in block.get("options", []):
                if "text" in opt:
                    opt["text"] = pick_text(opt["text"])
                if "explanation" in opt:
                    opt["explanation"] = pick_text(opt["explanation"])

    return jsonify(mission_copy)


# =========================
# 🚀 INIT
# =========================
@app.before_first_request
def startup():
    load_missions()


# =========================
# ▶ RUN SERVER
# =========================
if __name__ == "__main__":
    load_missions()
    app.run(host="0.0.0.0", port=5000, debug=True)
