import os
import json
import logging
from flask import Flask, send_from_directory, jsonify, request

# Configuración de logs para ver errores en el panel de Render
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Mapeo de misiones para control total
MISSION_MAP = {
    "1": "missions_01_07.json",
    "2": "missions_08_14.json",
    "3": "missions_15_21.json",
    "4": "missions_22_28.json",
    "5": "missions_29_35.json"
}

# --- RUTAS DE INTERFAZ ---

@app.route('/')
def index():
    """Sirve el HTML con headers de control de caché."""
    try:
        response = send_from_directory('static', 'session.html')
        response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
        return response
    except Exception as e:
        logger.error(f"Error sirviendo index: {e}")
        return "Error: static/session.html no encontrado.", 404

@app.route('/static/<path:path>')
def serve_static(path):
    """Servidor de estáticos genérico para JS, CSS e Imágenes."""
    return send_from_directory('static', path)

# --- API DE MISIONES ROBUSTA ---

@app.route('/api/mission/next')
def get_mission():
    """
    Carga la misión basada en el parámetro 'id'.
    Si no hay ID, asume la primera.
    """
    mission_id = request.args.get('id', '1')
    lang = request.args.get('lang', 'es')
    
    file_name = MISSION_MAP.get(mission_id)
    
    if not file_name:
        return jsonify({
            "success": False, 
            "end": True, 
            "message": "Ciclo de entrenamiento completado."
        }), 200

    file_path = os.path.join(os.getcwd(), file_name)

    if not os.path.exists(file_path):
        logger.error(f"Archivo no encontrado: {file_path}")
        return jsonify({
            "success": False, 
            "error": "Error interno: Archivo de misión desaparecido."
        }), 500

    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        logger.info(f"Misión {mission_id} enviada con éxito.")
        return jsonify({
            "success": True,
            "mission": data,
            "next_id": str(int(mission_id) + 1) if int(mission_id) < 5 else None
        })
    except json.JSONDecodeError:
        logger.error(f"Error de formato en JSON: {file_name}")
        return jsonify({"success": False, "error": "Error de formato en datos."}), 500
    except Exception as e:
        logger.error(f"Error inesperado: {e}")
        return jsonify({"success": False, "error": "Error de servidor."}), 500

# --- CONFIGURACIÓN DE PUERTO PARA RENDER ---

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    # En producción (Render), debug debe ser False
    app.run(host='0.0.0.0', port=port, debug=False)
