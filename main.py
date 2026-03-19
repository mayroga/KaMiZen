from fastapi import FastAPI
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
import json
from pathlib import Path

app = FastAPI()

BASE_DIR = Path(__file__).resolve().parent
STATIC_DIR = BASE_DIR / "static"
DB_PATH = STATIC_DIR / "kamizen_content.json"

app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

@app.get("/", response_class=HTMLResponse)
async def home():
    try:
        with open(STATIC_DIR / "session.html", "r", encoding="utf-8") as f:
            return HTMLResponse(f.read())
    except:
        return HTMLResponse("<h1>Error: No se encuentra session.html</h1>")

@app.get("/session_content")
async def session_content():
    try:
        with open(DB_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
            return JSONResponse(content=data)
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)

@app.get("/api/status")
async def api_status():
    # Siempre abierto para que no te bloquee
    return {"is_open": True, "next": "Ahora", "mins_left": 30}
