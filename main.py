from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
import os

# ============================
# Aplicación KaMiZen NeuroWellness
# ============================
app = FastAPI(title="KaMiZen NeuroWellness")

# Directorio base de la app
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Montar carpeta estática correctamente
app.mount("/static", StaticFiles(directory=os.path.join(BASE_DIR, "static")), name="static")

# ============================
# Ruta principal
# ============================
@app.get("/", response_class=HTMLResponse)
async def root():
    """
    Devuelve la página principal de KaMiZen
    """
    file_path = os.path.join(BASE_DIR, "static", "session.html")
    if not os.path.exists(file_path):
        return HTMLResponse("<h1>Error: session.html no encontrado</h1>", status_code=404)
    
    with open(file_path, "r", encoding="utf-8") as f:
        return HTMLResponse(f.read())
