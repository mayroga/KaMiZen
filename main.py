from flask import Flask, jsonify, request, send_from_directory
import json
import os

app = Flask(__name__, static_folder="static")

# =========================
# LOAD CONTENT SAFE
# =========================
def load_content():
    path = os.path.join("static", "kamizen_content.json")
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

DATA = load_content()

# =========================
# STATE MACHINE GLOBAL
# =========================
STATE = {
    "mission_id": 1,
    "block_index": 0,
    "status": "idle"
}

# =========================
# GET CURRENT BLOCK
# =========================
def get_current_block():
    mission = next((m for m in DATA["missions"] if m["id"] == STATE["mission_id"]), None)
    if not mission:
        return None

    if STATE["block_index"] >= len(mission["blocks"]):
        return None

    return mission["blocks"][STATE["block_index"]]

# =========================
# API: START SESSION
# =========================
@app.route("/api/start", methods=["POST"])
def start():
    STATE["mission_id"] = 1
    STATE["block_index"] = 0
    STATE["status"] = "running"
    return jsonify({"ok": True, "state": STATE})

# =========================
# API: GET CURRENT BLOCK
# =========================
@app.route("/api/state", methods=["GET"])
def state():
    block = get_current_block()
    return jsonify({
        "state": STATE,
        "block": block
    })

# =========================
# API: NEXT BLOCK
# =========================
@app.route("/api/next", methods=["POST"])
def next_block():
    STATE["block_index"] += 1

    mission = next((m for m in DATA["missions"] if m["id"] == STATE["mission_id"]), None)

    if STATE["block_index"] >= len(mission["blocks"]):
        STATE["status"] = "finished"

    return jsonify({"ok": True, "state": STATE})

# =========================
# API: ANSWER (TVID)
# =========================
@app.route("/api/answer", methods=["POST"])
def answer():
    data = request.json
    code = data.get("code")

    block = get_current_block()
    if not block or block.get("type") != "tvid":
        return jsonify({"ok": False, "error": "no_tvid_block"})

    option = next((o for o in block["options"] if o["code"] == code), None)

    return jsonify({
        "ok": True,
        "correct": option.get("correct", False),
        "reason": option.get("reason", {})
    })

# =========================
# STATIC FRONTEND
# =========================
@app.route("/")
def home():
    return send_from_directory("static", "session.html")

if __name__ == "__main__":
    app.run(debug=True)
