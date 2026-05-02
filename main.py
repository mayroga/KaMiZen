from flask import Flask, jsonify, send_from_directory
import json
import os

app = Flask(__name__, static_folder="static")

# =========================
# BASE DIR
# =========================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# =========================
# STATE (SIMPLE MEMORY LOOP)
# =========================
STATE = {
    "index": 1
}

# =========================
# LOAD JSON SAFE
# =========================
def load_json(file_name):
    path = os.path.join(BASE_DIR, file_name)
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading {file_name}: {e}")
        return {}

# =========================
# STORIES (stories.json)
# =========================
def get_story(index):
    data = load_json("stories.json")
    for item in data.get("stories", []):
        if item.get("id") == index:
            return item
    return {"en": "Story not found.", "es": "Historia no encontrada."}

# =========================
# MISSIONS ROUTER
# =========================
def get_mission_list(index):
    """
    Retorna una lista con la misión correspondiente para que 
    el frontend pueda iterar sobre ella.
    """
    if 1 <= index <= 7:
        file_name = "missions_01_07.json"
    elif 8 <= index <= 14:
        file_name = "missions_08_14.json"
    elif 15 <= index <= 21:
        file_name = "missions_15_21.json"
    elif 22 <= index <= 28:
        file_name = "missions_22_28.json"
    else:
        file_name = "missions_29_35.json"

    data = load_json(file_name)
    
    # Buscamos la misión específica por su ID
    for item in data.get("missions", []):
        if item.get("id") == index:
            # Importante: El frontend espera una LISTA de misiones
            return [item] 

    return []

# =========================
# SESSION API (CORREGIDA)
# =========================
@app.route("/api/session/start")
def session_start():
    index = STATE["index"]

    story = get_story(index)
    missions = get_mission_list(index) # Ahora devuelve una lista []

    # ADVANCE INDEX (SAFE LOOP 1–35)
    STATE["index"] += 1
    if STATE["index"] > 35:
        STATE["index"] = 1

    # Retornamos 'missions' en plural para coincidir con session.html
    return jsonify({
        "index": index,
        "story": story,
        "missions": missions 
    })

# =========================
# RESET (DEBUG ONLY)
# =========================
@app.route("/api/reset")
def reset():
    STATE["index"] = 1
    return jsonify({
        "status": "reset",
        "index": 1
    })

# =========================
# FRONTEND ENTRY
# =========================
@app.route("/")
def home():
    return send_from_directory("static", "session.html")

# =========================
# RUN SERVER
# =========================
if __name__ == "__main__":
    # Escucha en todas las interfaces para pruebas locales
    app.run(debug=True, host="0.0.0.0", port=5000)
