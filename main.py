from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
import uuid
import time
import os
import json

app = FastAPI()

# Configuración de directorios de sistema
if not os.path.exists("static"):
    os.makedirs("static")

app.mount("/static", StaticFiles(directory="static"), name="static")

# Carga de base de datos JSON con manejo de errores robusto
CONTENT = []
try:
    with open("static/kamizen_content.json", "r", encoding="utf-8") as f:
        data = json.load(f)
        # Soporta tanto {"missions": [...]} como una lista directa
        CONTENT = data.get("missions") if isinstance(data, dict) else data
except Exception as e:
    print(f"CRITICAL DATABASE ERROR: {e}")

# Persistencia de sesiones en memoria
sessions = {}

def create_initial_state(profile):
    """Inicializa el perfil con stats optimizados para AURA BY MAY ROGA."""
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

# Matriz de Impacto Dinámico (AL CIELO Protocol)
IMPACTS = {
    "TDB": {"mental": 2, "discipline": 5},               # Avance estándar / Disciplina
    "TDP": {"mental": 5, "discipline": 10, "karma": 5},   # Inversión / Estructura
    "TDM": {"mental": -20, "discipline": -15, "karma": -10}, # Impulso / Riesgo / Error
    "TDN": {"mental": 10, "social": 5, "discipline": 5},  # Creatividad / Seguridad
    "TDG": {"discipline": 15, "mental": 10, "social": -5},# Control / Autoridad
    "TDK": {"social": 20, "karma": 15, "mental": 5},      # Conexión / Honor / Éxito
    "CORRECT": {"mental": 10, "discipline": 10},          # Acierto en Quiz/Riddle
    "WRONG": {"mental": -10, "discipline": -5}            # Error en Quiz/Riddle
}

def get_audio_mood(block):
    """Asigna el mood musical basado en el tipo de bloque y su modo interno."""
    b_type = block.get("type")
    mode = block.get("mode")
    
    if "breathing" in b_type: return mode if mode else "focus"
    if b_type == "silence_challenge": return "ambient"
    if b_type in ["quiz", "riddle", "math_trap"]: return "discovery"
    if b_type == "tvid": return mode if mode else "tension"
    if b_type == "win": return "victory"
    
    return "ambient"

def apply_progression(state, decision):
    """Gestiona el avance lógico a través de los 22 niveles del Kamizen."""
    if not CONTENT: return

    # 1. Aplicar impacto si la decisión existe en la matriz
    effect = IMPACTS.get(decision, IMPACTS["TDB"])
    for stat, value in effect.items():
        if stat in state:
            state[stat] = max(0, min(100, state[stat] + value))
    
    # 2. Obtener misión actual
    current_mission = CONTENT[state["mission_index"]]
    
    # 3. Avance de puntero de bloque
    state["block_index"] += 1
    
    # 4. Cambio de misión (Nivel) si se acaban los bloques
    if state["block_index"] >= len(current_mission["blocks"]):
        state["mission_index"] += 1
        state["block_index"] = 0

def format_block_response(mission, block):
    """Prepara el bloque de contenido para el frontend."""
    # Extraer texto principal (soporta 'text' o 'question')
    text_data = block.get("text", {})
    if not text_data and "question" in block:
        text_data = block["question"]
    
    options = block.get("options", [])
    
    # Si es un riddle, enviamos los datos de respuesta para que el front los maneje
    riddle_data = {}
    if block.get("type") == "riddle":
        riddle_data = {
            "answer": block.get("answer"),
            "insight": block.get("insight")
        }

    return {
        "type": block.get("type", "story"),
        "category": mission.get("category", "AL CIELO"),
        "text_en": text_data.get("en", ""),
        "text_es": text_data.get("es", ""),
        "duration_sec": block.get("duration_sec", 0),
        "options": options,
        "mood": get_audio_mood(block),
        "feedback_audio": block.get("feedback_audio"), # Para triggers de sonido (lottery/explosion)
        "quotes": block.get("quotes", []),
        **riddle_data
    }

@app.post("/start")
async def start_session(req: Request):
    """Inicializa la experiencia AURA."""
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
    """Procesa decisiones, quizes y avance de niveles."""
    try:
        data = await req.json()
        session_id = data.get("session_id")
        decision = data.get("decision", "TDB")

        if not session_id or session_id not in sessions:
            return JSONResponse(status_code=404, content={"error": "Session Expired"})

        state = sessions[session_id]
        
        # Cooldown de seguridad
        now = time.time()
        if now - state["last_update"] < 0.3:
            return {"status": "cooldown", "state": state}
        
        state["last_update"] = now
        apply_progression(state, decision)
        
        # Verificar fin del sistema
        if state["mission_index"] >= len(CONTENT):
            state["mission_index"] = len(CONTENT) - 1 # Mantener en el último para el feedback de victoria
            mission = CONTENT[-1]
            block = mission["blocks"][-1]
            return {
                "status": "end",
                "state": state,
                "story": format_block_response(mission, block)
            }

        mission = CONTENT[state["mission_index"]]
        block = mission["blocks"][state["block_index"]]

        return {
            "status": "continue",
            "state": state,
            "story": format_block_response(mission, block)
        }
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.get("/")
def serve_home():
    return FileResponse("static/session.html")

if __name__ == "__main__":
    import uvicorn
    # Render usa la variable PORT
    port = int(os.environ.get("PORT", 10000))
    uvicorn.run(app, host="0.0.0.0", port=port)
