from flask import Flask, jsonify, send_from_directory
import os
import json

app = Flask(__name__, static_folder="static")

BASE = os.path.dirname(__file__)

# =========================
# 💾 SISTEMA DE PERSISTENCIA (SAVE GAME)
# =========================
def get_save_data():
    """Carga el progreso guardado o inicia desde 0."""
    data = load_json("save_game.json")
    if data is None:
        return {"last_mission": 0}
    return data

def save_progress(mid):
    """Guarda el ID de la última misión completada."""
    path = os.path.join(BASE, "save_game.json")
    with open(path, "w", encoding="utf-8") as f:
        json.dump({"last_mission": mid}, f)

# =========================
# 📦 LOAD MISSION FILES SAFE
# =========================
def load_json(file):
    try:
        path = os.path.join(BASE, file)
        if not os.path.exists(path):
            return None
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"Error cargando {file}: {e}")
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
# 🎯 LOGICA DE BUSQUEDA
# =========================
def find_mission(mid):
    datasets = get_all_missions()
    for pack in datasets:
        for m in pack.get("missions", []):
            if m.get("id") == mid:
                return m
    return None

def find_chapter(chapter_id):
    datasets = get_all_missions()
    for pack in datasets:
        if pack.get("chapter") == chapter_id:
            return pack
    return None

# =========================
# 🎮 API: MISIONES Y FLUJO
# =========================

@app.route("/api/mission/<int:mission_id>")
def api_mission(mission_id):
    mission = find_mission(mission_id)
    if not mission:
        return jsonify({"error": "Mission not found", "id": mission_id}), 404
    return jsonify(mission)

@app.route("/api/mission/next")
def next_mission_flow():
    """Ruta inteligente: entrega la siguiente misión sin repetir."""
    current_data = get_save_data()
    current_id = current_data.get("last_mission", 0)
    
    next_id = current_id + 1
    if next_id > 35: 
        next_id = 1 # Reinicio infinito
        
    mission = find_mission(next_id)
    if mission:
        save_progress(next_id) # Solo guarda si la misión existe
        return jsonify(mission)
    
    return jsonify({"error": "No more missions"}), 404

# =========================
# 🧠 CONFIGURACIONES DINÁMICAS
# =========================

@app.route("/api/silence/<int:level>")
def api_silence(level):
    """Tiempos progresivos de 3 a 20 minutos."""
    if level <= 7:
        t = 180  # 3 min
    elif level <= 14:
        t = 360  # 6 min
    elif level <= 21:
        t = 600  # 10 min
    elif level <= 28:
        t = 900  # 15 min
    else:
        t = 1200 # 20 min
    
    return jsonify({"level": level, "silence_time": t})

@app.route("/api/breath/<int:level>")
def api_breath(level):
    """Intervalos de respiración (más lentos según nivel)."""
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
    
    return jsonify({"level": level, "breath_interval_sec": interval})

# =========================
# 🏠 RUTAS DE ARCHIVOS
# =========================

@app.route("/")
def home():
    return send_from_directory("static", "session.html")

@app.route("/static/<path:path>")
def static_files(path):
    return send_from_directory("static", path)

# =========================
# 🚀 INICIO DEL SERVIDOR
# =========================
if __name__ == "__main__":
    # Verifica que el archivo de guardado exista al iniciar
    if not os.path.exists(os.path.join(BASE, "save_game.json")):
        save_progress(0)
        
    print("🚀 AL CIELO: Servidor Activo en el puerto 10000")
    app.run(host="0.0.0.0", port=10000, debug=True)
