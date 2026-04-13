from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
import uuid
import time
import os
import json

app = FastAPI()

# Configuración de directorios
if not os.path.exists("static"):
    os.makedirs("static")

app.mount("/static", StaticFiles(directory="static"), name="static")

# Carga de contenido con validación estricta
try:
    with open("static/kamizen_content.json", "r", encoding="utf-8") as f:
        data = json.load(f)
        CONTENT = data.get("missions", [])
except Exception as e:
    print(f"CRITICAL ERROR: No se pudo cargar el archivo de misiones: {e}")
    CONTENT = []

# Almacenamiento de sesiones (En producción usar Redis/DB)
sessions = {}

def create_initial_state(profile):
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

# Sistema de Impactos de Decisiones
IMPACTS = {
    "TDB": {"mental": 5, "discipline": 2, "karma": 1},
    "TDP": {"social": 5, "discipline": 3, "karma": 1},
    "TDM": {"mental": -6, "karma": -1},
    "TDN": {"social": 4, "karma": 1},
    "TDG": {"discipline": 4, "mental": 2, "karma": 0},
    "TDK": {"social": 6, "mental": 1, "karma": 1}
}

def get_audio_mood(block_type):
    """Asigna un estado musical según el tipo de bloque de la historia."""
    moods = {
        "voice": "ambient",
        "story": "suspense",
        "turning_point": "tension",
        "psychological_insight": "discovery",
        "tvid": "power",
        "exercise_1": "focus",
        "exercise_2": "focus",
        "exercise_3": "focus",
        "win": "victory"
    }
    return moods.get(block_type, "ambient")

def apply_progression(state, decision):
    """Gestiona el avance lógico de la historia y los stats."""
    # 1. Aplicar impacto de la decisión
    effect = IMPACTS.get(decision, IMPACTS["TDB"])
    for stat, value in effect.items():
        if stat in state:
            state[stat] = max(0, min(100, state[stat] + value))
    
    # 2. Mover puntero de historia
    current_mission = CONTENT[state["mission_index"]]
    state["block_index"] += 1
    
    # 3. Salto de misión si se acaban los bloques
    if state["block_index"] >= len(current_mission["blocks"]):
        state["mission_index"] += 1
        state["block_index"] = 0
        
    # 4. Reinicio de ciclo completo
    if state["mission_index"] >= len(CONTENT):
        state["mission_index"] = 0
        state["block_index"] = 0

@app.post("/start")
async def start_session(req: Request):
    try:
        data = await req.json()
        profile = data.get("profile", {})
        
        session_id = str(uuid.uuid4())
        state = create_initial_state(profile)
        sessions[session_id] = state
        
        # Primer bloque
        mission = CONTENT[0]
        block = mission["blocks"][0]
        
        return {
            "session_id": session_id,
            "state": state,
            "story": {
                "category": mission["category"],
                "text": block["text"].get("es", ""),
                "mood": get_audio_mood(block.get("type"))
            }
        }
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.post("/judge")
async def judge_decision(req: Request):
    try:
        data = await req.json()
        session_id = data.get("session_id")
        decision = data.get("decision", "TDB")

        if not session_id or session_id not in sessions:
            return JSONResponse(status_code=404, content={"error": "Invalid session"})

        state = sessions[session_id]
        
        # Anti-spam (0.5s)
        now = time.time()
        if now - state["last_update"] < 0.5:
            return {"status": "cooldown", "state": state}
        
        state["last_update"] = now
        apply_progression(state, decision)
        
        # Obtener nuevo contenido
        mission = CONTENT[state["mission_index"]]
        block = mission["blocks"][state["block_index"]]
        
        # Si es el último bloque de una misión importante, forzar mood de victoria
        mood = get_audio_mood(block.get("type"))
        if state["block_index"] == 0 and state["mission_index"] > 0:
            mood = "victory"

        return {
            "status": "continue",
            "state": state,
            "story": {
                "category": mission["category"],
                "text": block["text"].get("es", ""),
                "mood": mood
            }
        }
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.get("/")
def serve_home():
    return FileResponse("static/session.html")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", 10000)))
