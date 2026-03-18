from fastapi import FastAPI
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
import json
import os
from pathlib import Path

app = FastAPI(title="KaMiZen NeuroGame Engine")

# Definir rutas base
BASE_DIR = Path(__file__).resolve().parent
STATIC_DIR = BASE_DIR / "static"
DB_PATH = STATIC_DIR / "kamizen_content.json"

# Montar archivos estáticos
app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

def cargar_db():
    try:
        if not DB_PATH.exists():
            print(f"ERROR: No se encuentra {DB_PATH}")
            return {"sesiones": []}
        
        with open(DB_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
            
        if "sesiones" in data:
            # Ordenar por ID para evitar saltos lógicos
            data["sesiones"].sort(key=lambda x: x.get('id', 0))
            return data
        return {"sesiones": []}
    except Exception as e:
        print(f"Error crítico en JSON: {e}")
        return {"sesiones": []}

@app.get("/", response_class=HTMLResponse)
async def home():
    index_path = STATIC_DIR / "session.html"
    try:
        with open(index_path, "r", encoding="utf-8") as f:
            return HTMLResponse(f.read())
    except Exception as e:
        return HTMLResponse(f"<h1>Error de Sistema</h1><p>No se halló session.html</p>")

@app.get("/session_content")
async def session_content():
    db = cargar_db()
    # Forzamos JSONResponse para asegurar que el navegador lo interprete bien
    return JSONResponse(content=db)

@app.get("/health")
async def health():
    return {"status": "ok"}
