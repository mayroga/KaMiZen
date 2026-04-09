from fastapi import FastAPI, HTTPException
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
import json
import os
from pathlib import Path

# Configuración de la aplicación bajo el estándar AURA BY MAY ROGA LLC
app = FastAPI(
    title="KaMiZen Engine V3",
    description="Sistema de Asesoría en Neuro-Disciplina y Enfoque"
)

# Definición de rutas de archivos
BASE_DIR = Path(__file__).resolve().parent
STATIC_DIR = BASE_DIR / "static"
DB_PATH = STATIC_DIR / "kamizen_content.json"

# Montar archivos estáticos para JS, CSS, Audio e Imágenes
if not STATIC_DIR.exists():
    os.makedirs(STATIC_DIR)
app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

def cargar_db():
    """Carga la base de datos de sesiones con validación de estructura."""
    try:
        if not DB_PATH.exists():
            # Base de datos inicial por defecto si no existe el archivo
            return {"sessions": []}
        
        with open(DB_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
            return data
    except json.JSONDecodeError:
        print("Error: El archivo kamizen_content.json tiene un formato inválido.")
        return {"sessions": []}
    except Exception as e:
        print(f"Error inesperado al cargar DB: {e}")
        return {"sessions": []}

@app.get("/", response_class=HTMLResponse)
async def home():
    """Servir la interfaz principal de la aplicación."""
    try:
        html_path = STATIC_DIR / "session.html"
        if not html_path.exists():
            return HTMLResponse("<h1>Error: session.html no encontrado en /static</h1>", status_code=404)
        return HTMLResponse(html_path.read_text(encoding="utf-8"))
    except Exception as e:
        return HTMLResponse(f"<h1>Error interno: {str(e)}</h1>", status_code=500)

@app.get("/session_content")
async def get_session_content():
    """Endpoint para obtener las sesiones, juegos y acertijos de diferentes niveles."""
    data = cargar_db()
    if not data["sessions"]:
        return JSONResponse(
            content={"error": "No hay contenido disponible"}, 
            status_code=404
        )
    return JSONResponse(content=data)

@app.get("/health")
async def health_check():
    """Verificación de estado del motor de IAAT y T-VID."""
    return {
        "status": "online",
        "version": "3.0.0",
        "engine": "AURA Professional",
        "database_connected": DB_PATH.exists()
    }

# Ejecución local para desarrollo
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
