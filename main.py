from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
import json5
from datetime import date

app = FastAPI(title="KaMiZen NeuroGame Engine")
app.mount("/static", StaticFiles(directory="static"), name="static")

# --------------------------
# Cargar sesiones desde JSON
# --------------------------
try:
    with open("static/kamizen_content.json", "r", encoding="utf-8") as f:
        db = json5.load(f)
except Exception as e:
    print("Error cargando JSON:", e)
    db = {"sesiones": []}

# --------------------------
# Función para obtener sesión del día automáticamente
# --------------------------
def obtener_sesion():
    if not db.get("sesiones"):
        return {
            "apertura": "Contenido no disponible",
            "historia": "Contenido no disponible",
            "ejercicio": "Contenido no disponible",
            "respiracion": "Contenido no disponible",
            "visualizacion": "Contenido no disponible",
            "cierre": "Contenido no disponible"
        }

    # Fecha base de inicio (puede ser la fecha de primer uso o definida manualmente)
    inicio = date(2026, 3, 9)  # Ajusta esta fecha según tu lanzamiento
    hoy = date.today()
    dias_transcurridos = (hoy - inicio).days

    # Selecciona índice de sesión según día transcurrido, usando módulo para repetir
    indice = dias_transcurridos % len(db["sesiones"])

    return db["sesiones"][indice]

# --------------------------
# Rutas FastAPI
# --------------------------

@app.get("/")
async def root():
    # Devuelve la página HTML principal
    try:
        with open("static/session.html", "r", encoding="utf-8") as f:
            return HTMLResponse(f.read())
    except Exception as e:
        return HTMLResponse(f"<h1>Error cargando session.html: {e}</h1>")

@app.get("/session_content")
async def session_content():
    # Devuelve la sesión correspondiente al día
    sesion = obtener_sesion()
    return sesion

# --------------------------
# Info de debug
# --------------------------
@app.get("/debug_sessions")
async def debug_sessions():
    # Para revisar todas las sesiones y su índice de hoy
    total = len(db.get("sesiones", []))
    hoy = date.today()
    dias_transcurridos = (hoy - date(2026, 3, 9)).days
    indice = dias_transcurridos % total if total > 0 else 0
    return {
        "total_sesiones": total,
        "dias_transcurridos": dias_transcurridos,
        "indice_hoy": indice,
        "sesion_hoy": db["sesiones"][indice] if total > 0 else {}
    }
