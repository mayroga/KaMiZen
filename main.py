from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
import json
from pathlib import Path
import os

app = FastAPI(title="AL CIELO - Aura by May Roga")

# Configuración de rutas
BASE_DIR = Path(__file__).resolve().parent
STATIC_DIR = BASE_DIR / "static"
DB_PATH = STATIC_DIR / "kamizen_content.json"

# Montar archivos estáticos
app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

def cargar_db():
    """Carga el contenido de las misiones desde el JSON."""
    try:
        if os.path.exists(DB_PATH):
            with open(DB_PATH, "r", encoding="utf-8") as f:
                data = json.load(f)
                # Si el JSON usa "missions", lo devolvemos tal cual
                return data
        return {"missions": []}
    except Exception as e:
        print(f"Error cargando DB: {e}")
        return {"missions": []}

@app.get("/", response_class=HTMLResponse)
async def home():
    """Sirve la interfaz principal."""
    try:
        # Buscamos session.html dentro de la carpeta static
        session_file = STATIC_DIR / "session.html"
        if session_file.exists():
            return HTMLResponse(content=session_file.read_text(encoding="utf-8"))
        return HTMLResponse("<h1 style='color:white; background:black;'>Error: session.html no encontrado en static/</h1>")
    except Exception as e:
        return HTMLResponse(f"<h1>Error crítico: {str(e)}</h1>")

@app.get("/api/content")
async def get_content():
    """Endpoint que consume el script.js para obtener las 40 misiones."""
    return JSONResponse(content=cargar_db())

if __name__ == "__main__":
    import uvicorn
    # El puerto se ajusta para despliegue o local
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
