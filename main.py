from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
import json
import uuid
import os

app = FastAPI()

# Montar estáticos
if not os.path.exists("static"):
    os.makedirs("static")
app.mount("/static", StaticFiles(directory="static"), name="static")

CONTENT_PATH = "static/kamizen_content.json"

def load_content():
    try:
        if not os.path.exists(CONTENT_PATH):
            return []
        with open(CONTENT_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
            return data.get("missions", [])
    except Exception as e:
        print("[ERROR] JSON LOAD FAIL:", e)
        return []

MISSIONS = load_content()
sessions = {}

# --- HELPERS MEJORADOS ---

def get_next_block(session):
    m_idx = session["mission_index"]
    b_idx = session["block_index"]

    if m_idx >= len(MISSIONS):
        return {"type": "end", "text": {"en": "END", "es": "FIN"}}

    mission = MISSIONS[m_idx]
    blocks = mission.get("blocks", [])

    # Si ya terminamos los bloques de esta misión
    if b_idx >= len(blocks):
        session["mission_index"] += 1
        session["block_index"] = 0
        return get_next_block(session) # Llamada recursiva controlada

    block = blocks[b_idx]
    session["block_index"] += 1
    return block

def format_block(block):
    """
    Asegura que el frontend reciba algo coherente incluso si el tipo es nuevo
    """
    if not block:
        return {"type": "error", "text": {"en": "Block not found", "es": "Bloque no encontrado"}}

    # Copia base para no mutar el original
    base = block.copy()
    
    # Normalización para tipos específicos que el frontend espera
    if block.get("type") in ["breath_focus", "riso_tvid"]:
        # Estos suelen usar 'guide' en lugar de 'text'
        if "guide" in block:
            base["text"] = block["guide"]
            
    return base

# --- RUTAS ---

@app.get("/")
async def home():
    return FileResponse("static/session.html")

@app.post("/start")
async def start():
    session_id = str(uuid.uuid4())
    sessions[session_id] = {"mission_index": 0, "block_index": 0}

    if not MISSIONS:
        return JSONResponse({"error": "No missions loaded"})

    # Empezamos directamente con el flujo
    first_block = get_next_block(sessions[session_id])
    
    return {
        "session_id": session_id,
        "story": format_block(first_block)
    }

@app.post("/judge")
async def judge(request: Request):
    data = await request.json()
    session_id = data.get("session_id")
    session = sessions.get(session_id)

    if not session:
        return JSONResponse({"error": "Invalid session"}, status_code=400)

    next_block = get_next_block(session)
    
    return {
        "story": format_block(next_block)
    }

@app.get("/reload")
def reload():
    global MISSIONS
    MISSIONS = load_content()
    return {"status": "reloaded", "count": len(MISSIONS)}
