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

app.mount("/static", StaticFiles(directory="static"), name="static")

# --- CARGA DE CONTENIDO (KAMIZEN DATABASE) ---
CONTENT = []
try:
    file_path = "static/kamizen_content.json"
    if os.path.exists(file_path):
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            # Soporta tanto el formato {"missions": [...]} como una lista directa
            if isinstance(data, dict) and "missions" in data:
                CONTENT = data["missions"]
            elif isinstance(data, list):
                CONTENT = data
            else:
                CONTENT = []
        print(f"DATABASE LOADED: {len(CONTENT)} missions found.")
    else:
        print("WARNING: static/kamizen_content.json no encontrado.")
except Exception as e:
    print(f"CRITICAL DATABASE ERROR: {e}")

# --- PERSISTENCIA EN MEMORIA ---
sessions = {}

def create_initial_state(profile):
    """Inicializa el perfil de usuario con valores base."""
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
# TDM es el código usado para "SALTAR" o decisiones impulsivas (Castigo)
IMPACTS = {
    "TDB": {"mental": 2, "discipline": 5},                
    "TDP": {"mental": 5, "discipline": 10, "karma": 5},    
    "TDM": {"mental": -15, "discipline": -25, "karma": -5}, # PENALIZACIÓN SEVERA EN DISCIPLINA
    "TDN": {"mental": 8, "social": 5, "discipline": 3},   
    "TDG": {"discipline": 12, "mental": 5, "social": -5}, 
    "TDK": {"social": 15, "karma": 10, "mental": 5},      
    "CORRECT": {"mental": 10, "discipline": 10},          
    "WRONG": {"mental": -10, "discipline": -5}            
}

def apply_progression(state, decision):
    """Gestiona el impacto en los puntos y el avance en la narrativa."""
    if not CONTENT: return

    # 1. Aplicar impacto de la decisión
    effect = IMPACTS.get(decision, IMPACTS["TDB"])
    for stat, value in effect.items():
        if stat in state:
            state[stat] = max(0, min(100, state[stat] + value))
    
    # 2. Referencia de la misión actual para avanzar
    try:
        current_mission = CONTENT[state["mission_index"]]
        blocks = current_mission.get("blocks", [])
        
        # 3. Avanzar al siguiente bloque
        state["block_index"] += 1
        
        # 4. Verificar si la misión terminó
        if state["block_index"] >= len(blocks):
            state["mission_index"] += 1
            state["block_index"] = 0
            
        # 5. REINICIO MAESTRO (Loop Infinito)
        if state["mission_index"] >= len(CONTENT):
            state["mission_index"] = 0
            state["block_index"] = 0
    except (IndexError, KeyError):
        state["mission_index"] = 0
        state["block_index"] = 0

def format_block_response(mission, block):
    """Prepara el objeto JSON para el frontend asegurando traducción y estabilidad."""
    # Extraer texto principal con múltiples fallbacks
    text_data = block.get("text") or block.get("question") or block.get("message") or {}
    
    if isinstance(text_data, str):
        text_es = text_data
        text_en = text_data
    else:
        text_es = text_data.get("es") or text_data.get("en") or "CARGANDO PROTOCOLO..."
        text_en = text_data.get("en") or text_es

    # Procesamiento de opciones
    options = []
    raw_options = block.get("options", [])
    
    for opt in raw_options:
        opt_text = opt.get("text", {})
        o_es = opt_text.get("es") or opt_text.get("en") or "CONTINUAR"
        o_en = opt_text.get("en") or o_es
        options.append({
            "code": opt.get("code", "TDB"),
            "text": {"es": o_es, "en": o_en}
        })
    
    # SEGURIDAD: Evita que el usuario se quede bloqueado sin botones
    if not options and block.get("type") not in ["breathing", "silence_challenge"]:
        options = [{"code": "TDB", "text": {"en": "CONTINUE", "es": "CONTINUAR"}}]
    
    # Si la decisión fue un salto (TDM), se puede forzar un feedback_audio específico
    f_audio = block.get("feedback_audio")
    
    response = {
        "type": block.get("type", "story"),
        "category": mission.get("category", "AL CIELO"),
        "text_en": text_en,
        "text_es": text_es,
        "duration_sec": block.get("duration_sec", 0),
        "options": options,
        "feedback_audio": f_audio,
    }

    # Datos extra para acertijos (Riddles)
    if block.get("type") == "riddle":
        ans = block.get("answer", {})
        ins = block.get("insight", {})
        response["answer"] = {"es": ans.get("es", "..."), "en": ans.get("en", ans.get("es", "..."))}
        response["insight"] = {"es": ins.get("es", "..."), "en": ins.get("en", ins.get("es", "..."))}

    return response

# --- ENDPOINTS ---

@app.get("/")
def serve_home():
    """Servir la interfaz principal."""
    return FileResponse("static/session.html")

@app.post("/start")
async def start_session(req: Request):
    """Inicia una nueva sesión del protocolo."""
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
    """Procesa cada paso y actualiza los puntos de disciplina y estado."""
    try:
        data = await req.json()
        session_id = data.get("session_id")
        decision = data.get("decision", "TDB")

        if not session_id or session_id not in sessions:
            return JSONResponse(status_code=404, content={"error": "Session Expired"})

        state = sessions[session_id]
        now = time.time()
        
        # Evitar spam (cooldown de 100ms)
        if now - state["last_update"] < 0.1:
            return {"status": "cooldown", "state": state}
        
        state["last_update"] = now
        apply_progression(state, decision)
        
        # Obtener el nuevo bloque tras el avance
        mission = CONTENT[state["mission_index"]]
        block = mission["blocks"][state["block_index"]]

        return {
            "status": "continue",
            "state": state,
            "story": format_block_response(mission, block)
        }
    except Exception as e:
        print(f"Error en /judge: {e}")
        return JSONResponse(status_code=500, content={"error": "Reconnecting..."})

# --- EJECUCIÓN ---
if __name__ == "__main__":
    import uvicorn
    # Puerto dinámico para despliegue en Render o local
    port = int(os.environ.get("PORT", 10000))
    uvicorn.run(app, host="0.0.0.0", port=port)
