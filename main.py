from flask import Flask, jsonify, request, send_from_directory
import json
import os
import time

app = Flask(__name__, static_folder="static")

# Cache para no leer el disco constantemente
CACHE = {}
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Estado global de la sesión (Para producción, considera usar una DB o sesión de Flask)
STATE = {
    "mission_index": 1,
    "MAX_MISSION": 35,
    "start_time": time.time(),
    "session_duration": 300, # 5 minutos de validez
}

# =========================
# GESTIÓN DE DATOS
# =========================

def get_file_by_index(i):
    """Determina qué archivo JSON cargar basado en el ID de la misión."""
    if 1 <= i <= 7:   return "missions_01_07.json"
    if 8 <= i <= 14:  return "missions_08_14.json"
    if 15 <= i <= 21: return "missions_15_21.json"
    if 22 <= i <= 28: return "missions_22_28.json"
    if 29 <= i <= 35: return "missions_29_35.json"
    return "missions_01_07.json"

def load_json(file_name):
    """Carga el JSON con manejo de errores y encoding."""
    if file_name in CACHE:
        return CACHE[file_name]

    path = os.path.join(BASE_DIR, file_name)
    if not os.path.exists(path):
        return {"missions": []}

    try:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
            CACHE[file_name] = data
            return data
    except Exception as e:
        print(f"❌ Error leyendo {file_name}: {e}")
        return {"missions": []}

# =========================
# API ENDPOINTS
# =========================

@app.route("/api/mission/next")
def next_mission():
    # 1. Verificar si el tiempo de sesión expiró
    elapsed = time.time() - STATE["start_time"]
    if elapsed > STATE["session_duration"]:
        return jsonify({"end": True, "reason": "session_expired"})

    lang = request.args.get("lang", "en")
    mission_id = STATE["mission_index"]

    # 2. Cargar la misión correcta
    file_name = get_file_by_index(mission_id)
    data = load_json(file_name)
    
    mission = next((m for m in data.get("missions", []) if m["id"] == mission_id), None)

    if not mission:
        return jsonify({"error": "Mission not found"}), 404

    # 3. Procesar bloques (b) de la misión
    response_data = {
        "id": mission_id,
        "title": "",
        "header": "",
        "story": "",
        "options": [],
        "interactive_blocks": [], # Guardamos respiraciones y silencios aquí
        "time_left": int(STATE["session_duration"] - elapsed)
    }

    for block in mission.get("b", []):
        type = block.get("t")
        
        # Títulos y Textos
        if type == "v":
            response_data["title"] = block["tx"].get(lang, "")
        elif type == "h":
            response_data["header"] = block["tx"].get(lang, "")
        elif type == "story":
            response_data["story"] = block.get(lang, block.get("tx", {}).get(lang, ""))

        # Preguntas y Decisiones
        elif type == "d":
            q_text = block["q"].get(lang, "")
            ops = block["op"]
            correct_idx = block["c"]
            explanations = block.get("ex", [])

            for i, op_text in enumerate(ops):
                # Manejo de idioma en opciones si vienen como strings compuestos "En / Es"
                text = op_text.split(" / ")[0] if lang == "en" else op_text.split(" / ")[-1]
                
                response_data["options"].append({
                    "text": text.strip(),
                    "is_correct": i == correct_idx,
                    "explanation": explanations[i] if i < len(explanations) else "",
                    "question": q_text
                })

        # Bloques de Respiración/Silencio (Para el UI dinámico)
        elif type in ["br", "sil", "breath_auto"]:
            response_data["interactive_blocks"].append({
                "type": type,
                "duration": block.get("d", 0),
                "text": block.get("tx", {}).get(lang, "") if isinstance(block.get("tx"), dict) else block.get("tx", ""),
                "info": block.get("inf", {}).get(lang, "")
            })

    # 4. Incrementar índice (Ciclo 1-35)
    STATE["mission_index"] += 1
    if STATE["mission_index"] > STATE["MAX_MISSION"]:
        STATE["mission_index"] = 1

    return jsonify(response_data)

@app.route("/api/session/reset", methods=["POST"])
def reset_session():
    """Reinicia el tiempo de la sesión tras un pago o advertencia."""
    STATE["start_time"] = time.time()
    return jsonify({"status": "success", "message": "Session renewed"})

# =========================
# RUTAS ESTÁTICAS
# =========================

@app.route("/")
def index():
    return send_from_directory("static", "session.html")

@app.route("/static/<path:path>")
def static_files(path):
    return send_from_directory("static", path)

if __name__ == "__main__":
    # Importante: No mencionar IA en los logs de salida
    print("--- ASESORÍA KAMIZEN ACTIVA ---")
    app.run(debug=True, port=5000)
