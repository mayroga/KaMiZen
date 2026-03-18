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
DB_PATH = os.path.join("static", "kamizen_content.json")

def cargar_db():
    """
    Carga el archivo kamizen_content.json y devuelve un diccionario.
    Si hay error o no existe la clave 'sesiones', devuelve {'sesiones': []}.
    """
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
    """
    Devuelve la interfaz HTML principal de la app KaMiZen.
    """
    try:
        with open(os.path.join("static", "session.html"), "r", encoding="utf-8") as f:
            return HTMLResponse(f.read())
    except Exception as e:
        return HTMLResponse(f"<h1>Error cargando interfaz</h1><p>{e}</p>")

# ==============================
# CONTENIDO DE SESION
# ==============================
@app.get("/session_content")
async def session_content():
    """
    Devuelve todas las sesiones cargadas desde kamizen_content.json.
    El cliente filtrará las ya completadas.
    """
    sesiones = db.get("sesiones", [])
    return JSONResponse({"sesiones": sesiones})

# ==============================
# HEALTH CHECK
# ==============================
@app.get("/health")
async def health():
    """
    Ruta para verificar que el servidor está activo.
    """
    return {"status": "ok"}

# ==============================
# OPCIONAL: RECARGA DE DB SIN REINICIAR
# ==============================
@app.get("/reload_db")
async def reload_db():
    """
    Recarga el archivo kamizen_content.json sin reiniciar el servidor.
    """
    global db
    db = cargar_db()
    return {"status": "ok", "message": "Base de datos recargada", "sessions_count": len(db.get("sesiones", []))}
