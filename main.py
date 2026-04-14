from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
import uuid
import json
import os

app = FastAPI()

# Configuración de rutas de archivos
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(BASE_DIR, "static")
CONTENT_PATH = os.path.join(STATIC_DIR, "kamizen_content.json")

# Montar archivos estáticos
if os.path.exists(STATIC_DIR):
    app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

# Globales en memoria
GAME_DATA = []
SESSIONS = {}
RANKING = {}

# ==========================================
# CARGA ROBUSTA DE CONTENIDO (Failsafe)
# ==========================================
def load_game_content():
    global GAME_DATA
    try:
        if not os.path.exists(CONTENT_PATH):
            print(f"CRITICAL: {CONTENT_PATH} not found.")
            GAME_DATA = []
            return

        with open(CONTENT_PATH, "r", encoding="utf-8") as f:
            raw_data = f.read().strip()
            if not raw_data:
                print("CRITICAL: kamizen_content.json is empty.")
                GAME_DATA = []
                return
            
            data = json.loads(raw_data)
            GAME_DATA = data.get("missions", [])
            print(f"SUCCESS: {len(GAME_DATA)} missions loaded.")
            
    except Exception as e:
        print(f"CRITICAL ERROR loading JSON: {e}")
        GAME_DATA = []

# Cargar al iniciar
load_game_content()

# ==========================================
# UTILIDADES
# ==========================================
def norm(x):
    return str(x).strip().upper() if x else ""

def get_rank(sid):
    if not RANKING: return 1
    sorted_r = sorted(RANKING.items(), key=lambda x: x[1], reverse=True)
    for i, (k, v) in enumerate(sorted_r):
        if k == sid:
            return i + 1
    return len(sorted_r)

# ==========================================
# RUTAS DE LA API
# ==========================================

@app.get("/")
def root():
    index_path = os.path.join(STATIC_DIR, "session.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return JSONResponse({"error": "session.html not found"}, status_code=404)

@app.post("/start")
async def start(req: Request):
    if not GAME_DATA:
        load_game_content() # Intento de recarga en caliente
    
    try:
        data = await req.json()
    except:
        data = {}
        
    sid = str(uuid.uuid4())
    lang = data.get("profile", {}).get("lang", "en")

    SESSIONS[sid] = {
        "mission_index": 0,
        "xp": 0,
        "errors": 0,
        "streak": 0,
        "lang": lang,
        "completed": False
    }

    return {
        "session_id": sid,
        "mission": build_mission_response(sid)
    }

@app.post("/get_mission")
async def get_mission(req: Request):
    try:
        data = await req.json()
        sid = data.get("session_id")
    except:
        return JSONResponse({"error": "Invalid request"}, status_code=400)
    
    if not sid or sid not in SESSIONS:
        # Failsafe: Si no hay sesión válida, devuelve la primera misión
        return {"mission": GAME_DATA[0] if GAME_DATA else {}}
    
    return {"mission": build_mission_response(sid)}

@app.post("/judge")
async def judge(req: Request):
    try:
        data = await req.json()
        sid = data.get("session_id")
        decision_code = data.get("decision")
    except:
        return JSONResponse({"error": "Bad Request"}, status_code=400)

    if not sid or sid not in SESSIONS:
        return JSONResponse({"error": "Invalid Session"}, status_code=401)

    s = SESSIONS[sid]
    if s["mission_index"] >= len(GAME_DATA):
        return {"finished": True, "xp": s["xp"]}

    current_m = GAME_DATA[s["mission_index"]]
    
    # Localizar el bloque de decisión
    tvid_block = next((b for b in current_m["blocks"] if b["type"] == "tvid"), None)
    if not tvid_block:
        # Si la misión no tiene decisión, avanzar automáticamente
        s["mission_index"] += 1
        return {"correct": True, "xp": s["xp"], "next": True}

    chosen_option = next((o for o in tvid_block["options"] if norm(o["code"]) == norm(decision_code)), None)

    if not chosen_option:
        return JSONResponse({"error": "Option Not Found"}, status_code=404)

    correct = chosen_option.get("correct", False)
    
    if correct:
        s["xp"] += 15
        s["streak"] += 1
        s["mission_index"] += 1
        if s["mission_index"] >= len(GAME_DATA):
            s["completed"] = True
    else:
        s["xp"] = max(0, s["xp"] - 5)
        s["errors"] += 1
        s["streak"] = 0

    RANKING[sid] = s["xp"]

    return {
        "correct": correct,
        "xp": s["xp"],
        "reason": chosen_option.get("reason", {}),
        "semaphore": "green" if correct else "red",
        "finished": s["completed"],
        "rank": get_rank(sid)
    }

# ==========================================
# CONSTRUCTORES
# ==========================================

def build_mission_response(sid):
    s = SESSIONS[sid]
    idx = s["mission_index"]
    
    if idx >= len(GAME_DATA):
        return {
            "id": "END",
            "blocks": [{
                "type": "story",
                "text": {
                    "es": "Has completado todos los niveles. Lidera con sabiduría.",
                    "en": "You have completed all levels. Lead with wisdom."
                }
            }]
        }
    
    return GAME_DATA[idx]

if __name__ == "__main__":
    import uvicorn
    # Render suele pasar el puerto por variable de entorno
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
