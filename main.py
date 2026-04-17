from flask import Flask, jsonify, send_from_directory, request
import json
import os

app = Flask(__name__, static_folder="static")

# =========================
# MAPA DE ARCHIVOS POR RANGO
# =========================
MISSION_FILES = [
    ("missions_1_7.json", 1, 7),
    ("missions_8_14.json", 8, 14),
    ("missions_15_21.json", 15, 21),
    ("missions_22_35.json", 22, 35)
]

# =========================
# CACHE EN MEMORIA (evita recargar disco)
# =========================
CACHE = {}

def load_file(file_name):
    if file_name in CACHE:
        return CACHE[file_name]

    path = os.path.join(os.getcwd(), file_name)

    if not os.path.exists(path):
        return None

    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)

    CACHE[file_name] = data
    return data


# =========================
# BUSCAR MISIÓN POR ID (RANGO INTELIGENTE)
# =========================
def get_mission_by_id(mission_id):
    for file_name, start, end in MISSION_FILES:
        if start <= mission_id <= end:
            data = load_file(file_name)
            if not data:
                return None

            for mission in data.get("missions", []):
                if mission["id"] == mission_id:
                    return mission
    return None


# =========================
# API: MISIÓN ACTUAL
# =========================
@app.route("/api/mission/<int:mission_id>")
def mission(mission_id):
    mission = get_mission_by_id(mission_id)

    if not mission:
        return jsonify({"error": "Mission not found"}), 404

    return jsonify(mission)


# =========================
# API: SISTEMA DE LOOP 1-35
# =========================
@app.route("/api/next/<int:mission_id>")
def next_mission(mission_id):
    next_id = mission_id + 1

    if next_id > 35:
        next_id = 1

    return jsonify({"next": next_id})


# =========================
# FRONTEND
# =========================
@app.route("/")
def home():
    return send_from_directory("static", "session.html")


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
