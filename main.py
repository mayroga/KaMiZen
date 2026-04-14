from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
import uuid, json, time, random, os

app = FastAPI()

# Montar archivos estáticos para CSS, JS e Imágenes
app.mount("/static", StaticFiles(directory="static"), name="static")

# Cargar el contenido de las misiones (1-22)
with open("static/kamizen_content.json", "r", encoding="utf-8") as f:
    GAME_DATA = json.load(f)["missions"]

# Almacenamiento en memoria de sesiones y ranking
SESSIONS = {}
RANKING = {}

# =========================
# UTILIDADES
# =========================
def norm(x):
    """Normaliza strings para comparaciones seguras."""
    return x.strip().upper() if isinstance(x, str) else x

def get_session(sid):
    """Recupera la sesión o lanza error si no existe."""
    return SESSIONS.get(sid)

# =========================
# RUTAS PRINCIPALES
# =========================

@app.get("/")
def root():
    """Sirve la interfaz principal del sistema Kamizen."""
    return FileResponse("static/session.html")

@app.post("/start")
async def start(req: Request):
    """Inicia una nueva sesión de entrenamiento."""
    data = await req.json()
    sid = str(uuid.uuid4())
    lang = data.get("profile", {}).get("lang", "es")

    # Inicializar estado del usuario
    SESSIONS[sid] = {
        "mission_index": 0,
        "block_index": 0,
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
    """Endpoint para que el frontend pida una misión específica o la actual."""
    data = await req.json()
    sid = data.get("session_id")
    
    if not sid or sid not in SESSIONS:
        # Si no hay sesión, devolvemos la primera misión como previa
        return {"mission": GAME_DATA[0]}
    
    s = SESSIONS[sid]
    return {"mission": GAME_DATA[s["mission_index"]]}

@app.post("/judge")
async def judge(req: Request):
    """Evalúa las decisiones del usuario y actualiza el progreso."""
    data = await req.json()
    sid = data.get("session_id")
    decision_code = data.get("decision")

    if not sid or sid not in SESSIONS:
        return JSONResponse({"error": "Sesión inválida"}, status_code=400)

    s = SESSIONS[sid]
    current_m = GAME_DATA[s["mission_index"]]
    
    # Buscar el bloque de decisión (tvid) en la misión actual
    tvid_block = next((b for b in current_m["blocks"] if b["type"] == "tvid"), None)
    
    if not tvid_block:
        return JSONResponse({"error": "No decision block found"}, status_code=500)

    chosen_option = next((o for o in tvid_block["options"] if norm(o["code"]) == norm(decision_code)), None)

    if not chosen_option:
        return JSONResponse({"error": "Opción no válida"}, status_code=400)

    correct = chosen_option["correct"]
    
    # Lógica de Recompensa/Castigo
    if correct:
        s["xp"] += 15
        s["streak"] += 1
        # Avanzar a la siguiente misión
        s["mission_index"] += 1
        if s["mission_index"] >= len(GAME_DATA):
            s["completed"] = True
    else:
        s["xp"] = max(0, s["xp"] - 5)
        s["errors"] += 1
        s["streak"] = 0

    # Actualizar Ranking
    RANKING[sid] = s["xp"]

    return {
        "correct": correct,
        "xp": s["xp"],
        "reason": chosen_option["reason"],
        "semaphore": "green" if correct else "red",
        "finished": s["completed"],
        "next_mission_id": s["mission_index"] + 1 if not s["completed"] else None,
        "rank": get_rank(sid)
    }

# =========================
# CONSTRUCTORES DE RESPUESTA
# =========================

def build_mission_response(sid):
    """Construye el objeto de misión actual para el frontend."""
    s = SESSIONS[sid]
    if s["mission_index"] >= len(GAME_DATA):
        return {
            "id": "END",
            "blocks": [{
                "type": "story",
                "text": {
                    "es": "Has completado todos los niveles de AL CIELO. El mundo real te espera.",
                    "en": "You have completed all levels of AL CIELO. The real world awaits."
                }
            }]
        }
    return GAME_DATA[s["mission_index"]]

def get_rank(sid):
    """Calcula la posición del usuario en base al XP global."""
    if not RANKING: return 1
    sorted_r = sorted(RANKING.items(), key=lambda x: x[1], reverse=True)
    for i, (k, v) in enumerate(sorted_r):
        if k == sid:
            return i + 1
    return len(sorted_r)

# =========================
# EJECUCIÓN
# =========================
if __name__ == "__main__":
    import uvicorn
    # Ejecutar en el puerto 8000
    uvicorn.run(app, host="0.0.0.0", port=8000)
