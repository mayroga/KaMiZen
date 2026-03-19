from fastapi import FastAPI, HTTPException
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
import json
from pathlib import Path

app = FastAPI(title="KaMiZen NeuroGame Engine - AL CIELO")

# Rutas de archivos
BASE_DIR = Path(__file__).resolve().parent
STATIC_DIR = BASE_DIR / "static"
DB_PATH = STATIC_DIR / "kamizen_content.json"

app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

def cargar_db():
    try:
        if not DB_PATH.exists(): return {"sesiones": []}
        with open(DB_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        return {"sesiones": []}

@app.get("/", response_class=HTMLResponse)
async def home():
    try:
        with open(STATIC_DIR / "session.html", "r", encoding="utf-8") as f:
            return HTMLResponse(f.read())
    except Exception:
        return HTMLResponse("<body style='background:black;color:white;'><h1>Error de Sistema: Contacte a Soporte</h1></body>")

@app.get("/session_content")
async def session_content():
    db = cargar_db()
    return JSONResponse(content=db)

@app.get("/health")
async def health():
    return {"status": "operativo", "power": "max"}
