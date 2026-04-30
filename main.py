import os
import json
import logging
from flask import Flask, send_from_directory, jsonify, request

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Asegúrate de que estos nombres de archivo coincidan exactamente con tu carpeta
MISSION_MAP = {
    "1": "missions_01_07.json",
    "2": "missions_08_14.json",
    "3": "missions_15_21.json",
    "4": "missions_22_28.json",
    "5": "missions_29_35.json"
}

@app.route('/')
def index():
    return send_from_directory('static', 'session.html')

@app.route('/static/<path:path>')
def serve_static(path):
    return send_from_directory('static', path)

@app.route('/api/stories')
def get_stories():
    try:
        file_path = os.path.join(BASE_DIR, 'stories.json')
        with open(file_path, 'r', encoding='utf-8') as f:
            return jsonify(json.load(f))
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/mission/next')
def get_mission():
    mission_id = request.args.get('id', '1')
    file_name = MISSION_MAP.get(mission_id)
    
    if not file_name:
        return jsonify({"success": False, "end": True})

    try:
        file_path = os.path.join(BASE_DIR, file_name)
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        return jsonify({
            "success": True,
            "mission": data, # Aquí va el JSON completo (sys, ui, missions, etc)
            "next_id": str(int(mission_id) + 1) if int(mission_id) < 5 else None
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 404

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)
