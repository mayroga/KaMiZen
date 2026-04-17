from flask import Flask, jsonify, request, send_from_directory
import json
import os

app = Flask(__name__, static_folder="static")

# =========================
# LOAD JSON
# =========================
def load_data():
    with open("static/kamizen_content.json", "r", encoding="utf-8") as f:
        data = json.load(f)

    # ordenar misiones por ID SIEMPRE
    data["missions"] = sorted(data["missions"], key=lambda m: m["id"])
    return data

DATA = load_data()

# =========================
# STATE (SOURCE OF TRUTH)
# =========================
STATE = {
    "mission_index": 0,
    "block_index": 0
}

# =========================
# GET CURRENT MISSION/BLOCK
# =========================
def get_current():
    missions = DATA["missions"]

    # reset global si termina todo
    if STATE["mission_index"] >= len(missions):
        STATE["mission_index"] = 0
        STATE["block_index"] = 0

    mission = missions[STATE["mission_index"]]
    blocks = mission["blocks"]

    # reset bloque si termina misión
    if STATE["block_index"] >= len(blocks):
        STATE["mission_index"] += 1
        STATE["block_index"] = 0

        # recursivo para evitar saltos
        return get_current()

    return {
        "mission": mission,
        "block": blocks[STATE["block_index"]],
        "state": STATE
    }

# =========================
# START / RESET
# =========================
@app.route("/api/start", methods=["POST"])
def start():
    STATE["mission_index"] = 0
    STATE["block_index"] = 0
    return jsonify(get_current())

# =========================
# GET CURRENT STEP
# =========================
@app.route("/api/state", methods=["GET"])
def state():
    return jsonify(get_current())

# =========================
# NEXT STEP (ONLY MAIN CONTROLS FLOW)
# =========================
@app.route("/api/next", methods=["POST"])
def next_step():
    STATE["block_index"] += 1
    return jsonify(get_current())

# =========================
# ANSWER CHECK (TVID)
# =========================
@app.route("/api/answer", methods=["POST"])
def answer():
    data = request.json
    code = data.get("code")

    current = get_current()
    block = current["block"]

    if block["type"] != "tvid":
        return jsonify({"ok": False})

    option = next((o for o in block["options"] if o["code"] == code), None)

    return jsonify({
        "ok": True,
        "correct": option["correct"],
        "reason": option["reason"]
    })

# =========================
# FRONTEND
# =========================
@app.route("/")
def home():
    return send_from_directory("static", "session.html")

if __name__ == "__main__":
    app.run(debug=True)
