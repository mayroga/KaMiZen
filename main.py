from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
import json
import os

app = FastAPI(title="AL CIELO - Aura by May Roga")
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

def load_kamizen():
    with open("static/kamizen_content.json", "r", encoding="utf-8") as f:
        return json.load(f)

@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.get("/session/{mission_id}", response_class=HTMLResponse)
async def start_session(request: Request, mission_id: int):
    content = load_kamizen()
    mission = next((m for m in content["missions"] if m["id"] == mission_id), None)
    if not mission:
        raise HTTPException(status_code=404, detail="Misión no encontrada")
    return templates.TemplateResponse("session.html", {"request": request, "mission": mission})

@app.get("/api/content")
async def get_content():
    return JSONResponse(content=load_kamizen())
