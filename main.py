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
try:
    with open("static/kamizen_content.json", "r", encoding="utf-8") as f:
        data = json.load(f)
        # Soportamos tanto el formato {"missions": [...]} como una lista directa
        CONTENT = data.get("missions") if isinstance(data, dict) else data
except Exception as e:
    print(f"CRITICAL DATABASE ERROR: {e}")
    CONTENT = []

# Persistencia de sesiones en memoria
sessions = {}

def create_initial_state(profile):
    """Inicializa el perfil del usuario con stats equilibrados al estilo AURA."""
    return {
        "mental": 100,
        "social": 80,
        "discipline": 50,
        "karma": 10,
        "age": profile.get("age", 18),
        "mission_index": 0,
        "block_index": 0,
        "last_update": time.time(),
        "history": []
    }

# Matriz de Impacto de Decisiones (Sistema AL CIELO / AURA)
IMPACTS = {
    "TDB": {"mental": 5, "discipline": 2, "karma": 5},    # Balance / Karma
    "TDP": {"mental": 2, "discipline": 8, "karma": 2},    # Structure / Victory
    "TDM": {"mental": -15, "discipline": -5, "karma": -10}, # Impulse (Dopamine/Risk)
    "TDN": {"mental": 5, "social": 5, "discipline": 2},   # Creativity / Survival
    "TDG": {"discipline": 10, "mental": 5, "social": -2}, # Control / Power
    "TDK": {"social": 15, "karma": 10, "mental": 5}      # Connection
}

def get_audio_mood(block_type, custom_mode=None):
    """Asigna el mood musical basado en la situación y el tipo de bloque."""
    if custom_mode:
        return custom_mode
    
    moods = {
        "voice": "ambient",
        "story": "suspense",
        "turning_point": "tension",
        "psychological_insight": "discovery",
        "tvid": "agitation",
        "exercise": "focus",
        "win": "victory"
    }
    return moods.get(block_type, "ambient")

def apply_progression(state, decision):
    """Aplica consecuencias y gestiona el flujo entre misiones y niveles."""
    if not CONTENT:
        return

    # 1. Aplicar Impacto de la decisión
    effect = IMPACTS.get(decision, IMPACTS["TDB"])
    for stat, value in effect.items():
        if stat in state:
            state[stat] = max(0, min(100, state[stat] + value))
    
    # 2. Avance dentro de la misión actual
    current_mission = CONTENT[state["mission_index"]]
    state["block_index"] += 1
    
    # 3. Verificar si terminó la misión y pasar a la siguiente
    if state["block_index"] >= len(current_mission["blocks"]):
        state["mission_index"] += 1
        state["block_index"] = 0
        
    # 4. Loop o Finalización (Si llega al final del Kamizen 21)
    if state["mission_index"] >= len(CONTENT):
        state["mission_index"] = 0  # Reiniciar para ciclo continuo o marcar como fin
        state["block_index"] = 0

@app.post("/start")
async def start_session(req: Request):
    """Punto de entrada para inicializar la experiencia AURA BY MAY ROGA."""
    try:
        data = await req.json()
        profile = data.get("profile", {})
        
        session_id = str(uuid.uuid4())
        state = create_initial_state(profile)
        sessions[session_id] = state
        
        if not CONTENT:
            return JSONResponse(status_code=500, content={"error": "Database is empty or missing."})
            
        mission = CONTENT[0]
        block = mission["blocks"][0]
        
        return {
            "session_id": session_id,
            "state": state,
            "story": {
                "category": mission.get("category", "AL CIELO INITIALIZATION"),
                "text_en": block["text"].get("en", ""),
                "text_es": block["text"].get("es", ""),
                "mood": get_audio_mood(block.get("type"), block.get("mode"))
            }
        }
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.post("/judge")
async def judge_decision(req: Request):
    """Procesador de decisiones con lógica de impacto y progresión de niveles."""
    try:
        data = await req.json()
        session_id = data.get("session_id")
        decision = data.get("decision", "TDB")

        if not session_id or session_id not in sessions:
            return JSONResponse(status_code=404, content={"error": "Invalid or expired session"})

        state = sessions[session_id]
        
        # Anti-spam y control de ritmo (0.5s)
        now = time.time()
        if now - state["last_update"] < 0.5:
            return {"status": "cooldown", "state": state}
        
        state["last_update"] = now
        apply_progression(state, decision)
        
        # Validar límites tras la progresión
        if state["mission_index"] >= len(CONTENT):
            return {"status": "end", "message": "KAMIZEN COMPLETED. YOU ARE THE ARCHITECT."}

        # Cargar el nuevo contenido
        mission = CONTENT[state["mission_index"]]
        block = mission["blocks"][state["block_index"]]
        
        # Lógica de audio específica para el cambio de nivel o bloque
        mood = get_audio_mood(block.get("type"), block.get("mode"))
        
        # Si acabamos de entrar en una nueva misión (nivel), forzamos audio de transición
        if state["block_index"] == 0:
            mood = "discovery"

        return {
            "status": "continue",
            "state": state,
            "story": {
                "category": mission.get("category", "AURA PHASE"),
                "text_en": block["text"].get("en", ""),
                "text_es": block["text"].get("es", ""),
                "mood": mood
            }
        }
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.get("/")
def serve_home():
    """Sirve la terminal interactiva AL CIELO."""
    return FileResponse("static/session.html")

if __name__ == "__main__":
    import uvicorn
    # Puerto dinámico para despliegue en Render/Heroku o local 10000
    port = int(os.environ.get("PORT", 10000))
    uvicorn.run(app, host="0.0.0.0", port=port)
