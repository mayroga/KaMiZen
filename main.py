from fastapi import FastAPI
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
import json
from pathlib import Path
import os

app = FastAPI(title="AURA - KaMiZen Engine")

BASE_DIR = Path(__file__).resolve().parent
STATIC_DIR = BASE_DIR / "static"
DB_PATH = STATIC_DIR / "kamizen_content.json"

app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

def cargar_db():
    try:
        if os.path.exists(DB_PATH):
            with open(DB_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
        return {"sessions": []}
    except Exception:
        return {"sessions": []}

@app.get("/", response_class=HTMLResponse)
async def home():
    try:
        session_file = STATIC_DIR / "session.html"
        return HTMLResponse(content=session_file.read_text(encoding="utf-8"))
    except Exception:
        return HTMLResponse("<h1>Error: session.html no encontrado en static/</h1>")

@app.get("/session_content")
async def session_content():
    return JSONResponse(content=cargar_db())

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
