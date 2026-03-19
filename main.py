from fastapi import FastAPI, HTTPException
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import json
from pathlib import Path

app = FastAPI(title="KaMiZen Engine")

BASE_DIR = Path(__file__).resolve().parent
STATIC_DIR = BASE_DIR / "static"
DB_PATH = STATIC_DIR / "kamizen_content.json"

app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

class AdminAuth(BaseModel):
    user: str
    pass_word: str

@app.get("/", response_class=HTMLResponse)
async def home():
    try:
        with open(STATIC_DIR / "session.html", "r", encoding="utf-8") as f:
            return HTMLResponse(f.read())
    except:
        return HTMLResponse("<h1>Error: session.html no encontrado</h1>")

@app.get("/session_content")
async def session_content():
    try:
        if not DB_PATH.exists():
            return JSONResponse({"sesiones": []})
        with open(DB_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
            # Ordenar sesiones por ID para evitar errores de salto
            if "sesiones" in data:
                data["sesiones"].sort(key=lambda x: x.get('id', 0))
            return JSONResponse(content=data)
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)

@app.post("/admin_auth")
async def admin_auth(auth: AdminAuth):
    # Credenciales de acceso rápido
    if auth.user == "admin" and auth.pass_word == "1234":
        return {"status": "authorized"}
    raise HTTPException(status_code=401)
