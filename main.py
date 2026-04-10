from fastapi import FastAPI
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
import json
from pathlib import Path
import os

app = FastAPI(title="KaMiZen Engine Professional")

BASE_DIR = Path(__file__).resolve().parent
STATIC_DIR = BASE_DIR / "static"
DB_PATH = STATIC_DIR / "kamizen_content.json"

app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

def cargar_db():
    try:
        if not DB_PATH.exists():
            return {"sessions": []}
        with open(DB_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {"sessions": []}

@app.get("/", response_class=HTMLResponse)
async def home():
    try:
        # Busca el archivo en static/session.html como estaba originalmente
        session_file = STATIC_DIR / "session.html"
        return HTMLResponse(content=session_file.read_text(encoding="utf-8"))
    except Exception as e:
        return HTMLResponse(f"<h1>Error: session.html not found in static/</h1><p>{str(e)}</p>")

@app.get("/session_content")
async def session_content():
    return JSONResponse(content=cargar_db())

@app.get("/health")
async def health():
    return {"status": "active", "engine": "KaMiZen V3"}

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
