from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
import uuid
import time
import os
import json

app = FastAPI()

# Configuración de estáticos
if not os.path.exists("static"):
    os.makedirs("static")

app.mount("/static", StaticFiles(directory="static"), name="static")

# Carga de contenido con manejo de errores
try:
    with open("static/kamizen_content.json", "r", encoding="utf-8") as f:
        CONTENT = json.load(f)["missions"]
except Exception as e:
    print(f"Error cargando JSON: {e}")
    CONTENT = []

sessions = {}

def create_state(profile):
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

IMPACTS = {
    "TDB": {"mental": 5, "discipline": 2, "karma": 1},
    "TDP": {"social": 5, "discipline": 3, "karma": 1},
    "TDM": {"mental": -6, "karma": -1},
    "TDN": {"social": 4, "karma": 1},
    "TDG": {"discipline": 4, "mental": 2, "karma": 0},
    "TDK": {"social": 6, "mental": 1, "karma": 1}
}

def apply_impacts(state, decision):
    effect = IMPACTS.get(decision, IMPACTS["TDM"])
    for k, v in effect.items():
        if k in state:
            state[k] = max(0, min(100, state[k] + v))

def advance_story(state):
    mission = CONTENT[state["mission_index"]]
    state["block_index"] += 1
    
    # Si terminamos los bloques de la misión actual, pasar a la siguiente
    if state["block_index"] >= len(mission["blocks"]):
        state["mission_index"] += 1
        state["block_index"] = 0
    
    # Reiniciar ciclo si se acaban las misiones
    if state["mission_index"] >= len(CONTENT):
        state["mission_index"] = 0
        state["block_index"] = 0

@app.post("/start")
async def start(req: Request):
    data = await req.json()
    profile = data.get("profile", {})
    session_id = str(uuid.uuid4())
    state = create_state(profile)
    sessions[session_id] = state
    
    mission = CONTENT[state["mission_index"]]
    block = mission["blocks"][state["block_index"]]
    
    return {
        "session_id": session_id, 
        "state": state, 
        "story": {"text": block["text"].get("es", block["text"].get("en", ""))}
    }

@app.post("/judge")
async def judge(req: Request):
    data = await req.json()
    session_id = data.get("session_id")
    decision = data.get("decision", "TDB")

    if session_id not in sessions:
        return JSONResponse(status_code=404, content={"error": "Session expired"})

    state = sessions[session_id]
    
    # Anti-spam
    now = time.time()
    if now - state["last_update"] < 0.5:
        return {"status": "cooldown", "state": state}
    
    state["last_update"] = now
    apply_impacts(state, decision)
    advance_story(state)
    
    mission = CONTENT[state["mission_index"]]
    block = mission["blocks"][state["block_index"]]
    
    return {
        "status": "continue",
        "state": state,
        "story": {"text": block["text"].get("es", "")}
    }

@app.get("/")
def home():
    return FileResponse("static/session.html")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", 10000)))
