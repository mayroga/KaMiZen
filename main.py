from fastapi import FastAPI
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
import json
import os

app = FastAPI(title="KaMiZen NeuroGame Engine")

# ==============================
# STATIC FILES
# ==============================
app.mount("/static", StaticFiles(directory="static"), name="static")

# ==============================
# CARGAR BASE DE CONTENIDO
# ==============================
DB_PATH = "static/kamizen_content.json"

def cargar_db():
    try:
        with open(DB_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
        if "sesiones" not in data:
            return {"sesiones": []}
        return data
    except Exception as e:
        print("Error cargando kamizen_content.json:", e)
        return {"sesiones": []}

db = cargar_db()

# ==============================
# RUTA PRINCIPAL
# ==============================
@app.get("/", response_class=HTMLResponse)
async def home():
    try:
        with open("static/session.html", "r", encoding="utf-8") as f:
            return HTMLResponse(f.read())
    except Exception as e:
        return HTMLResponse(f"<h1>Error cargando interfaz</h1><p>{e}</p>")

# ==============================
# CONTENIDO DE SESION
# ==============================
@app.get("/session_content")
async def session_content():
    sesiones = db.get("sesiones", [])
    # devolvemos todas las sesiones, el cliente decide cuál no ha completado
    return JSONResponse({"sesiones": sesiones})

# ==============================
# HEALTH CHECK
# ==============================
@app.get("/health")
async def health():
    return {"status": "ok"}
