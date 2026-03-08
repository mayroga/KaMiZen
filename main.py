from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles

# ============================
# Aplicación KaMiZen NeuroWellness
# ============================
app = FastAPI(title="KaMiZen NeuroWellness")

# Montar archivos estáticos
app.mount("/static", StaticFiles(directory="static"), name="static")

# ============================
# Ruta principal
# ============================
@app.get("/")
async def root():
    """
    Devuelve la página principal de KaMiZen
    """
    with open("static/session.html", "r", encoding="utf-8") as f:
        return HTMLResponse(f.read())
