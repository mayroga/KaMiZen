from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
import uuid
import time
import os
import json

app = FastAPI()

# --- CONFIGURACIÓN DE DIRECTORIOS ---
if not os.path.exists("static"):
    os.makedirs("static")

# Montar archivos estáticos para acceso a CSS, JS e Imágenes
app.mount("/static", StaticFiles(directory="static"), name="static")

# --- CARGA DE CONTENIDO (KAMIZEN DATABASE) ---
CONTENT = []
try:
    # Se busca el archivo en la carpeta static
    file_path = "static/kamizen_content.json"
    if os.path.exists(file_path):
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            # Soporta estructura de lista directa o diccionario con clave "missions"
            CONTENT = data.get("missions") if isinstance(data, dict) else data
    else:
        print("WARNING: static/kamizen_content.json no encontrado.")
except Exception as e:
    print(f"CRITICAL DATABASE ERROR: {e}")

# --- PERSISTENCIA EN MEMORIA ---
sessions = {}

def create_initial_state(profile):
    """Inicializa el perfil de usuario para AURA BY MAY ROGA."""
    return {
        "mental": 100,
        "social": 100,
        "discipline": 100,
        "karma": 0,
        "age": profile.get("age", 18),
        "mission_index": 0,
        "block_index": 0,
        "last_update": time.time(),
        "history": []
    }

# --- MATRIZ DE IMPACTO (PROTOCOLO AL CIELO) ---
IMPACTS = {
    "TDB": {"mental": 2, "discipline": 5},                # Avance Estándar
    "TDP": {"mental": 5, "discipline": 10, "karma": 5},    # Inversión/Estructura
    "TDM": {"mental": -15, "discipline": -10, "karma": -5},# Error/Riesgo
    "TDN": {"mental": 8, "social": 5, "discipline": 3},   # Seguridad
    "TDG": {"discipline": 12, "mental": 5, "social": -5}, # Control
    "TDK": {"social": 15, "karma": 10, "mental": 5},      # Honor/Éxito
    "CORRECT": {"mental": 10, "discipline": 10},          # Acierto
    "WRONG": {"mental": -10, "discipline": -5}            # Fallo
}

def get_audio_mood(block):
    """Determina la atmósfera sonora según el tipo de bloque."""
    b_type = block.get("type", "")
    mode = block.get("mode")
    
    if "breathing" in b_type: return mode if mode else "focus"
    if b_type == "silence_challenge": return "ambient"
    if b_type in ["quiz", "riddle"]: return "discovery"
    if b_type == "win": return "victory"
    return "ambient"

def apply_progression(state, decision):
    """Gestiona el ciclo infinito del sistema (Loop 1 a 22)."""
    if not CONTENT:
        return

    # 1. Aplicar impacto de la decisión
    effect = IMPACTS.get(decision, IMPACTS["TDB"])
    for stat, value in effect.items():
        if stat in state:
            state[stat] = max(0, min(100, state[stat] + value))
    
    # 2. Referencia de la misión actual
    current_mission = CONTENT[state["mission_index"]]
    
    # 3. Avanzar al siguiente bloque
    state["block_index"] += 1
    
    # 4. Verificar si la misión terminó
    if state["block_index"] >= len(current_mission.get("blocks", [])):
        state["mission_index"] += 1
        state["block_index"] = 0
    
    # 5. REINICIO MAESTRO (Loop Infinito)
    # Si llegamos al final de la lista de misiones (ej. misión 23), volvemos a la 0
    if state["mission_index"] >= len(CONTENT):
        state["mission_index"] = 0
        state["block_index"] = 0

def format_block_response(mission, block):
    """Prepara el objeto JSON para el frontend."""
    text_data = block.get("text", {})
    if not text_data and "question" in block:
        text_data = block["question"]
    
    options = block.get("options", [])
    
    # Garantizar botón de continuar si no hay opciones definidas (evita bloqueos)
    if not options and block.get("type") not in ["breathing", "silence_challenge", "breathing_warmup"]:
        options = [{"code": "TDB", "text": {"en": "CONTINUE", "es": "CONTINUAR"}}]
    
    response = {
        "type": block.get("type", "story"),
        "category": mission.get("category", "AL CIELO"),
        "text_en": text_data.get("en", "System loading..."),
        "text_es": text_data.get("es", "Cargando sistema..."),
        "duration_sec": block.get("duration_sec", 0),
        "options": options,
        "mood": get_audio_mood(block),
        "feedback_audio": block.get("feedback_audio"),
    }

    # Datos extra para acertijos
    if block.get("type") == "riddle":
        response["answer"] = block.get("answer", {"en": "...", "es": "..."})
        response["insight"] = block.get("insight", {"en": "...", "es": "..."})

    return response

# --- ENDPOINTS ---

@app.get("/")
def serve_home():
    """Servir la interfaz principal."""
    return FileResponse("static/session.html")

@app.post("/start")
async def start_session(req: Request):
    """Inicia o reinicia una sesión de AURA."""
    try:
        data = await req.json()
        session_id = str(uuid.uuid4())
        state = create_initial_state(data.get("profile", {}))
        sessions[session_id] = state
        
        if not CONTENT:
            return JSONResponse(status_code=500, content={"error": "Database missing"})
            
        mission = CONTENT[0]
        block = mission["blocks"][0]
        
        return {
            "session_id": session_id,
            "state": state,
            "story": format_block_response(mission, block)
        }
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.post("/judge")
async def judge_decision(req: Request):
    """Procesa decisiones y devuelve el siguiente paso del protocolo."""
    try:
        data = await req.json()
        session_id = data.get("session_id")
        decision = data.get("decision", "TDB")

        if not session_id or session_id not in sessions:
            return JSONResponse(status_code=404, content={"error": "Session Expired"})

        state = sessions[session_id]
        
        # Cooldown de 200ms para evitar spam de clics que congelen el backend
        now = time.time()
        if now - state["last_update"] < 0.2:
            return {"status": "cooldown", "state": state}
        
        state["last_update"] = now
        
        # Avanzar en la lógica
        apply_progression(state, decision)
        
        # Obtener el nuevo bloque tras la progresión
        mission = CONTENT[state["mission_index"]]
        block = mission["blocks"][state["block_index"]]

        return {
            "status": "continue",
            "state": state,
            "story": format_block_response(mission, block)
        }
    except Exception as e:
        print(f"Error en /judge: {e}")
        return JSONResponse(status_code=500, content={"error": "System reconnecting..."})

# --- EJECUCIÓN ---
if __name__ == "__main__":
    import uvicorn
    # Render usa la variable de entorno PORT
    port = int(os.environ.get("PORT", 10000))
    uvicorn.run(app, host="0.0.0.0", port=port)
