from fastapi import FastAPI
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
import json
from pathlib import Path
import os

app = FastAPI(title="MaykaMi Neural System")

BASE_DIR = Path(__file__).resolve().parent
STATIC_DIR = BASE_DIR / "static"
DB_PATH = STATIC_DIR / "kamizen_content.json"

# Archivos estáticos
app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

# Cargar JSON
def cargar_db():
    try:
        if DB_PATH.exists():
            with open(DB_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
        return {"missions": []}
    except Exception as e:
        print("ERROR DB:", e)
        return {"missions": []}

# APP PRINCIPAL
@app.get("/", response_class=HTMLResponse)
async def home():
    file = STATIC_DIR / "session.html"
    if file.exists():
        return HTMLResponse(file.read_text(encoding="utf-8"))
    return HTMLResponse("<h1>ERROR: session.html not found</h1>")

# JUEGO
@app.get("/jet", response_class=HTMLResponse)
async def jet():
    file = STATIC_DIR / "jet.html"
    if file.exists():
        return HTMLResponse(file.read_text(encoding="utf-8"))
    return HTMLResponse("<h1>ERROR: jet.html not found</h1>")

# CONTENIDO
@app.get("/session_content")
async def session_content():
    return JSONResponse(content=cargar_db())

# GUARDAR MÉTRICAS (futuro uso)
@app.post("/save_stats")
async def save_stats(data: dict):
    print("STATS RECIBIDOS:", data)
    return {"status": "ok"}

# RUN
if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
