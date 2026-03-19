from fastapi import FastAPI
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
import json

app = FastAPI(title="KaMiZen NeuroGame Engine")

# ==============================
# STATIC FILES
# ==============================
app.mount("/static", StaticFiles(directory="static"), name="static")

# ==============================
# PATH DEL JSON
# ==============================
DB_PATH = "static/kamizen_content.json"

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
    try:
        with open(DB_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
        sesiones = data.get("sesiones", [])
        return JSONResponse({"sesiones": sesiones})
    except Exception as e:
        return JSONResponse({"sesiones": [], "error": str(e)})

# ==============================
# HEALTH CHECK
# ==============================
@app.get("/health")
async def health():
    return {"status": "ok"}
