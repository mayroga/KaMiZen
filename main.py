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
        CONTENT = data.get("missions", [])
except Exception as e:
    print(f"CRITICAL DATABASE ERROR: {e}")
    CONTENT = []

# Persistencia de sesiones en memoria
sessions = {}

def create_initial_state(profile):
    """Inicializa el perfil del usuario con stats equilibrados."""
    return {
        "mental": 100,
        "social": 50,
        "discipline": 50,
        "karma": 0,
        "age": profile.get("age", 18),
        "mission_index": 0,
        "block_index": 0,
        "last_update": time.time(),
        "history": []
    }

# Matriz de Impacto de Decisiones (Sistema AURA / Kamizen)
IMPACTS = {
    "TDB": {"mental": 5, "discipline": 2, "karma": 1},   # Balance
    "TDP": {"social": 5, "discipline": 3, "karma": 1},   # Structure
    "TDM": {"mental": -6, "karma": -1},                  # Impulse (High Dopamine/Risk)
    "TDN": {"social": 4, "karma": 1},                    # Creativity
    "TDG": {"discipline": 4, "mental": 2, "karma": 0},   # Control
    "TDK": {"social": 6, "mental": 1, "karma": 1}        # Connection
}

def get_audio_mood(block_type, custom_mode=None):
    """
    Asigna el mood musical basado en la situación.
    """
    if custom_mode:
        return custom_mode
    
    moods = {
        "voice": "ambient",
        "story": "suspense",
        "turning_point": "tension",
        "psychological_insight": "discovery",
        "tvid": "agitation", # Por defecto para decisiones bajo presión
        "exercise_1": "focus",
        "win": "victory"
    }
    return moods.get(block_type, "ambient")

def apply_progression(state, decision):
    """Aplica consecuencias y avanza la narrativa."""
    # 1. Aplicar Impacto
    effect = IMPACTS.get(decision, IMPACTS["TDB"])
    for stat, value in effect.items():
        if stat in state:
            state[stat] = max(0, min(100, state[stat] + value))
    
    # 2. Avance lógico
    current_mission = CONTENT[state["mission_index"]]
    state["block_index"] += 1
    
    # 3. Fin de misión
    if state["block_index"] >= len(current_mission["blocks"]):
        state["mission_index"] += 1
        state["block_index"] = 0
        
    # 4. Loop de entrenamiento (Reset al final del contenido)
    if state["mission_index"] >= len(CONTENT):
        state["mission_index"] = 0
        state["block_index"] = 0

@app.post("/start")
async def start_session(req: Request):
    """Inicializa la experiencia AURA."""
    try:
        data = await req.json()
        profile = data.get("profile", {})
        
        session_id = str(uuid.uuid4())
        state = create_initial_state(profile)
        sessions[session_id] = state
        
        if not CONTENT:
            return JSONResponse(status_code=500, content={"error": "Database Empty"})
            
        mission = CONTENT[0]
        block = mission["blocks"][0]
        
        return {
            "session_id": session_id,
            "state": state,
            "story": {
                "category": mission["category"],
                "text_en": block["text"].get("en", ""),
                "text_es": block["text"].get("es", ""),
                "mood": get_audio_mood(block.get("type"), block.get("mode"))
            }
        }
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.post("/judge")
async def judge_decision(req: Request):
    """Procesa decisiones con lógica de premio/castigo."""
    try:
        data = await req.json()
        session_id = data.get("session_id")
        decision = data.get("decision", "TDB")

        if not session_id or session_id not in sessions:
            return JSONResponse(status_code=404, content={"error": "Invalid session"})

        state = sessions[session_id]
        
        # Anti-spam (0.4s)
        now = time.time()
        if now - state["last_update"] < 0.4:
            return {"status": "cooldown", "state": state}
        
        state["last_update"] = now
        apply_progression(state, decision)
        
        # Obtener nuevo bloque
        mission = CONTENT[state["mission_index"]]
        block = mission["blocks"][state["block_index"]]
        
        # Lógica de audio para impacto emocional
        mood = get_audio_mood(block.get("type"), block.get("mode"))
        if state["block_index"] == 0:
            mood = "victory" # Fanfarria de éxito al superar un nivel

        return {
            "status": "continue",
            "state": state,
            "story": {
                "category": mission["category"],
                "text_en": block["text"].get("en", ""),
                "text_es": block["text"].get("es", ""),
                "mood": mood
            }
        }
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.get("/")
def serve_home():
    """Interfaz principal AURA."""
    return FileResponse("static/session.html")

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 10000))
    uvicorn.run(app, host="0.0.0.0", port=port)
