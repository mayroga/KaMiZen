from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from datetime import datetime
import pytz
import json
import os
from pathlib import Path

app = FastAPI(title="KaMiZen NeuroGame Engine - Admin Edition")

# Configuración de Rutas y Reglas
BASE_DIR = Path(__file__).resolve().parent
STATIC_DIR = BASE_DIR / "static"
DB_PATH = STATIC_DIR / "kamizen_content.json"
MIAMI_TZ = pytz.timezone("America/New_York")
MAX_USERS = 500

# Estado del Sistema (Cupo)
usuarios_hoy = 0
ultimo_reset = None

app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

class AdminAuth(BaseModel):
    user: str
    pass_word: str

def obtener_estado_sistema():
    global usuarios_hoy, ultimo_reset
    ahora = datetime.now(MIAMI_TZ)
    hoy = ahora.date()
    if ultimo_reset != hoy:
        usuarios_hoy = 0
        ultimo_reset = hoy

    h, m = ahora.hour, ahora.minute
    esta_abierto = (h == 10 and 0 <= m < 30) or (h == 18 and 0 <= m < 30)
    
    proxima = "10:00 AM" if h < 10 else ("06:00 PM" if h < 18 else "Mañana 10:00 AM")
    return {
        "abierto": esta_abierto,
        "cupo_actual": usuarios_hoy,
        "proxima": proxima,
        "minutos_restantes": 30 - m if esta_abierto else 0
    }

@app.get("/", response_class=HTMLResponse)
async def home():
    with open(STATIC_DIR / "session.html", "r", encoding="utf-8") as f:
        return HTMLResponse(f.read())

@app.post("/admin_auth")
async def admin_login(auth: AdminAuth):
    # Variables protegidas en Render
    if auth.user == os.getenv("ADMIN_USERNAME") and auth.pass_word == os.getenv("ADMIN_PASSWORD"):
        return {"status": "authorized"}
    raise HTTPException(status_code=401, detail="Denegado")

@app.get("/api/status")
async def api_status():
    return JSONResponse(obtener_estado_sistema())

@app.get("/session_content")
async def session_content(request: Request):
    global usuarios_hoy
    # Verificamos si es Admin por el Header (enviado desde JS)
    is_admin = request.headers.get("X-Admin-Access") == "true"
    
    if not is_admin:
        status = obtener_estado_sistema()
        if not status["abierto"] or usuarios_hoy >= MAX_USERS:
            return JSONResponse({"error": "Acceso restringido por horario o cupo"}, status_code=403)
        usuarios_hoy += 1

    try:
        with open(DB_PATH, "r", encoding="utf-8") as f:
            return JSONResponse(json.load(f))
    except Exception as e:
        return JSONResponse({"error": "Error cargando base de datos"}, status_code=500)
