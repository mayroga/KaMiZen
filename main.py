from fastapi import FastAPI, Query
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
# LISTA DE JSON
# ==============================
SESIONES_FILES = [
    "static/kamizen_content_1.json",
    "static/kamizen_content_2.json",
    "static/kamizen_content_3.json",
    "static/kamizen_content_4.json"
]

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
# ENDPOINT SESIÓN
# ==============================
@app.get("/session_content")
async def session_content(file_idx: int = Query(0, ge=0), sesion_idx: int = Query(0, ge=0)):
    try:
        if file_idx >= len(SESIONES_FILES):
            return JSONResponse({"error": "file_idx fuera de rango", "bloques": []})
        
        file_path = SESIONES_FILES[file_idx]
        if not os.path.exists(file_path):
            return JSONResponse({"error": "Archivo no encontrado", "bloques": []})

        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        sesiones = data.get("sesiones", [])
        if sesion_idx >= len(sesiones):
            return JSONResponse({"error": "sesion_idx fuera de rango", "bloques": []})

        session = sesiones[sesion_idx]
        bloques = session.get("bloques", [])
        return JSONResponse({"bloques": bloques})

    except Exception as e:
        return JSONResponse({"error": str(e), "bloques": []})

# ==============================
# HEALTH CHECK
# ==============================
@app.get("/health")
async def health():
    return {"status": "ok"}
