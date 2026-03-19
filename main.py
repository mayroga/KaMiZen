from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import json
import os
from datetime import datetime
import pytz
from pathlib import Path

app = FastAPI()
BASE_DIR = Path(__file__).resolve().parent
STATIC_DIR = BASE_DIR / "static"
DB_PATH = STATIC_DIR / "kamizen_content.json"
MIAMI_TZ = pytz.timezone("America/New_York")

app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

class AdminAuth(BaseModel):
    user: str
    pass_word: str

def get_status():
    ahora = datetime.now(MIAMI_TZ)
    h, m = ahora.hour, ahora.minute
    is_open = (h == 10 and 0 <= m < 30) or (h == 18 and 0 <= m < 30)
    proxima = "10:00 AM" if h < 10 else ("06:00 PM" if h < 18 else "Mañana 10:00 AM")
    return {"is_open": is_open, "next": proxima, "mins_left": 30 - m if is_open else 0}

@app.get("/", response_class=HTMLResponse)
async def home():
    with open(STATIC_DIR / "session.html", "r", encoding="utf-8") as f:
        return HTMLResponse(f.read())

@app.post("/admin_auth")
async def admin_login(auth: AdminAuth):
    # Asegúrate de configurar estas variables en Render
    if auth.user == os.getenv("ADMIN_USERNAME") and auth.pass_word == os.getenv("ADMIN_PASSWORD"):
        return {"status": "authorized"}
    raise HTTPException(status_code=401)

@app.get("/api/status")
async def api_status():
    return JSONResponse(get_status())

@app.get("/session_content")
async def session_content(request: Request):
    is_admin = request.headers.get("X-Admin-Access") == "true"
    if not is_admin and not get_status()["is_open"]:
        return JSONResponse({"error": "Cerrado"}, status_code=403)
    
    with open(DB_PATH, "r", encoding="utf-8") as f:
        return JSONResponse(json.load(f))
