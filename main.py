import os
import json
import logging
from flask import Flask, send_from_directory, jsonify, request

# Configuración de logs para diagnóstico en el panel de Render
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Ruta base del proyecto para evitar errores de archivo no encontrado
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Mapeo exacto de misiones
MISSION_MAP = {
    "1": "missions_01_07.json",
    "2": "missions_08_14.json",
    "3": "missions_15_21.json",
    "4": "missions_22_28.json",
    "5": "missions_29_35.json"
}

# --- RUTAS DE NAVEGACIÓN ---

@app.route('/')
def index():
    """Sirve la interfaz principal asegurando que no se use caché vieja."""
    try:
        response = send_from_directory('static', 'session.html')
        response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
        return response
    except Exception as e:
        logger.error(f"Error crítico sirviendo session.html: {e}")
        return "Error: static/session.html no encontrado.", 404

@app.route('/static/<path:path>')
def serve_static(path):
    """Servidor de recursos estáticos (JS, CSS, Imágenes)."""
    return send_from_directory('static', path)

# --- API DE MISIONES (EL CEREBRO) ---

@app.route('/api/mission/next')
def get_mission():
    """
    Carga y sirve el contenido de las misiones desde los archivos JSON.
    """
    # Obtenemos el ID de la misión, si no viene, enviamos la 1 por defecto
    mission_id = request.args.get('id', '1')
    
    file_name = MISSION_MAP.get(mission_id)
    
    if not file_name:
        logger.info(f"Ciclo completado para ID: {mission_id}")
        return jsonify({
            "success": False, 
            "end": True, 
            "message": "Entrenamiento completado / Training completed."
        }), 200

    # Construimos la ruta absoluta al archivo JSON
    file_path = os.path.join(BASE_DIR, file_name)

    if not os.path.exists(file_path):
        logger.error(f"Archivo JSON no encontrado en la ruta: {file_path}")
        return jsonify({
            "success": False, 
            "error": f"Error: {file_name} not found."
        }), 500

    try:
        # Abrimos el archivo con codificación UTF-8 para evitar errores con acentos
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        logger.info(f"Misión {mission_id} ({file_name}) cargada exitosamente.")
        
        return jsonify({
            "success": True,
            "mission": data,
            "next_id": str(int(mission_id) + 1) if int(mission_id) < 5 else None
        })

    except json.JSONDecodeError as e:
        logger.error(f"Error de sintaxis en el archivo {file_name}: {e}")
        return jsonify({"success": False, "error": "JSON syntax error."}), 500
    except Exception as e:
        logger.error(f"Error inesperado al leer misión: {e}")
        return jsonify({"success": False, "error": "Server error."}), 500

# --- CONFIGURACIÓN DE EJECUCIÓN ---

if __name__ == '__main__':
    # Render usa la variable de entorno PORT
    port = int(os.environ.get("PORT", 5000))
    # debug=False es vital para que Render no se reinicie constantemente
    app.run(host='0.0.0.0', port=port, debug=False)
