from fastapi import FastAPI
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pathlib import Path
import json
import os

app = FastAPI(title="MaykaMi Neural Life Engine")

BASE_DIR = Path(__file__).resolve().parent
STATIC_DIR = BASE_DIR / "static"
DB_PATH = STATIC_DIR / "kamizen_content.json"

app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")


def load_game_data():
    try:
        if DB_PATH.exists():
            with open(DB_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
        return {"missions": []}
    except:
        return {"missions": []}


@app.get("/", response_class=HTMLResponse)
async def home():
    return HTMLResponse((STATIC_DIR / "session.html").read_text(encoding="utf-8"))


@app.get("/session_content")
async def session_content():
    return JSONResponse(load_game_data())


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", 8000)))
