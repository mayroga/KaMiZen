from fastapi import FastAPI
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
import json
import os

app = FastAPI(title="KaMiZen NeuroGame Engine")

app.mount("/static", StaticFiles(directory="static"), name="static")

DB_PATH = os.path.join("static", "kamizen_content.json")

def cargar_db():
    try:
        if not os.path.exists(DB_PATH):
            return {"sesiones": []}
        with open(DB_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
        # Ordenar sesiones por ID para asegurar la secuencia
        if "sesiones" in data:
            data["sesiones"].sort(key=lambda x: x['id'])
        return data
    except Exception as e:
        print("Error cargando DB:", e)
        return {"sesiones": []}

@app.get("/", response_class=HTMLResponse)
async def home():
    try:
        with open(os.path.join("static", "session.html"), "r", encoding="utf-8") as f:
            return HTMLResponse(f.read())
    except Exception as e:
        return HTMLResponse(f"<h1>Error</h1><p>{e}</p>")

@app.get("/session_content")
async def session_content():
    db = cargar_db()
    return JSONResponse(db)

@app.get("/health")
async def health():
    return {"status": "ok"}
