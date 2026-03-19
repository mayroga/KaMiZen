from fastapi import FastAPI
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
import json
import os
import uvicorn

# Configuración del Motor KaMiZen
app = FastAPI(title="KaMiZen NeuroGame Engine")

# Montaje de archivos estáticos (JS, CSS, Imágenes)
app.mount("/static", StaticFiles(directory="static"), name="static")

# Ruta al archivo de contenido
DB_PATH = os.path.join("static", "kamizen_content.json")

def cargar_db():
    """Carga y valida la base de datos de sesiones."""
    if not os.path.exists(DB_PATH):
        return {"sesiones": []}
    
    try:
        with open(DB_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
            # Asegurar que la estructura básica exista
            if "sesiones" not in data:
                return {"sesiones": []}
            return data
    except Exception as e:
        print(f"Error crítico al leer base de datos: {e}")
        return {"sesiones": []}

# --- RUTAS ---

@app.get("/", response_class=HTMLResponse)
async def home():
    """Carga la interfaz principal de la sesión."""
    file_path = os.path.join("static", "session.html")
    try:
        if os.path.exists(file_path):
            with open(file_path, "r", encoding="utf-8") as f:
                return HTMLResponse(content=f.read())
        return HTMLResponse(content="<h1>Error: session.html no encontrado</h1>", status_code=404)
    except Exception as e:
        return HTMLResponse(content=f"<h1>Error de sistema</h1><p>{str(e)}</p>", status_code=500)

@app.get("/session_content")
async def get_session_content():
    """
    Envía todas las sesiones al cliente. 
    El motor de JS se encarga de ordenarlas por ID y ciclar de la 40 a la 1.
    """
    db = cargar_db()
    return JSONResponse(content=db)

@app.get("/health")
async def health_check():
    """Verificación de estado del servidor."""
    return {"status": "active", "engine": "KaMiZen", "version": "1.0.40"}

# --- EJECUCIÓN ---

if __name__ == "__main__":
    # Ejecución optimizada para entorno local o servidor
    uvicorn.run(app, host="0.0.0.0", port=8000)
