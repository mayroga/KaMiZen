from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
import json
from pathlib import Path
import os

app = FastAPI(title="AL CIELO - Aura by May Roga")

# Configuración de rutas absolutas
BASE_DIR = Path(__file__).resolve().parent
STATIC_DIR = BASE_DIR / "static"
DB_PATH = STATIC_DIR / "kamizen_content.json"

# Montaje de archivos estáticos
app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

def cargar_db():
    try:
        if os.path.exists(DB_PATH):
            with open(DB_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
        return {"missions": []}
    except Exception as e:
        print(f"Error crítico en JSON: {e}")
        return {"missions": []}

@app.get("/", response_class=HTMLResponse)
async def home():
    """Carga el archivo session.html desde la carpeta static."""
    try:
        session_file = STATIC_DIR / "session.html"
        if session_file.exists():
            return HTMLResponse(content=session_file.read_text(encoding="utf-8"))
        return HTMLResponse("<h1 style='color:white;background:black;'>Error: session.html no encontrado en /static</h1>")
    except Exception as e:
        return HTMLResponse(f"<h1>Error de Servidor: {str(e)}</h1>")

@app.get("/api/content")
async def get_content():
    """Ruta que el script.js consulta para obtener las misiones."""
    return JSONResponse(content=cargar_db())

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
