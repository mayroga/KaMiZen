import os
import json
import random
from flask import Flask, render_template, jsonify, request, send_from_directory

app = Flask(__name__, 
            static_folder='static', 
            template_folder='static') # Apuntamos a static donde está session.html

# --- CONFIGURACIÓN DE RUTAS ---
MISSION_DIR = os.path.dirname(os.path.abspath(__file__))
TOTAL_MISSIONS = 35

def load_mission(mission_id):
    """Carga un archivo JSON de misión desde la raíz."""
    file_path = os.path.join(MISSION_DIR, f"mission_{mission_id}.json")
    try:
        if os.path.exists(file_path):
            with open(file_path, 'r', encoding='utf-8') as f:
                return json.load(f)
    except Exception as e:
        print(f"Error cargando misión {mission_id}: {e}")
    return None

# --- RUTAS DE NAVEGACIÓN ---

@app.route('/')
def index():
    """Sirve la interfaz principal de la sesión."""
    # Como tu session.html está en /static, Flask lo busca allí
    return render_template('session.html')

@app.route('/engine.js')
def serve_js():
    """Ruta de respaldo para asegurar que el motor se cargue."""
    return send_from_directory(os.path.join(app.root_path, 'static/js'), 'engine.js')

# --- API DE MISIONES (EL CEREBRO) ---

@app.route('/api/mission/next')
def get_mission():
    """
    Endpoint que el engine.js consulta.
    Gestiona qué misión enviar basándose en la progresión.
    """
    # En una app real, esto vendría de una sesión de usuario o DB.
    # Por ahora, enviamos una misión aleatoria o basada en un parámetro.
    mission_id = request.args.get('id', random.randint(1, TOTAL_MISSIONS))
    lang = request.args.get('lang', 'es')
    
    data = load_mission(mission_id)
    
    if data:
        return jsonify({
            "success": True,
            "mission_id": mission_id,
            "mission": data
        })
    else:
        return jsonify({
            "success": False,
            "end": True,
            "message": "No más misiones disponibles o error de carga."
        })

# --- GESTIÓN DE ERRORES ---

@app.errorhandler(404)
def not_found(e):
    return jsonify({"error": "Recurso no encontrado"}), 404

if __name__ == '__main__':
    # Render usa la variable de entorno PORT
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
