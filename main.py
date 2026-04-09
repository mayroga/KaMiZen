from fastapi import FastAPI, HTTPException
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
import json
from pathlib import Path

app = FastAPI(title="AL CIELO - Inmersive Engine v3")

BASE_DIR = Path(__file__).resolve().parent
STATIC_DIR = BASE_DIR / "static"
DB_PATH = STATIC_DIR / "kamizen_content.json"

# Asegurar que el directorio static existe
STATIC_DIR.mkdir(exist_ok=True)
app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

def load_database():
    try:
        if not DB_PATH.exists():
            return {"sessions": []}
        with open(DB_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {"sessions": []}

@app.get("/", response_class=HTMLResponse)
async def index():
    html_file = STATIC_DIR / "session.html"
    if not html_file.exists():
        return HTMLResponse("<h1>Error: session.html no encontrado</h1>")
    return HTMLResponse(html_file.read_text(encoding="utf-8"))

@app.get("/session_content")
async def get_content():
    return JSONResponse(content=load_database())

@app.get("/health")
async def health():
    return {"status": "optimized", "branding": "AURA BY MAY ROGA LLC"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
