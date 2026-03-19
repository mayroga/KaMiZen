from fastapi import FastAPI, Query
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
import json
import os

app = FastAPI()

app.mount("/static", StaticFiles(directory="static"), name="static")

FILES = [
    "static/kamizen_content_1.json",
    "static/kamizen_content_2.json",
    "static/kamizen_content_3.json",
    "static/kamizen_content_4.json",
]


@app.get("/", response_class=HTMLResponse)
async def home():
    with open("static/session.html", "r", encoding="utf-8") as f:
        return f.read()


@app.get("/session_content")
async def session_content(
    file_idx: int = Query(0),
    sesion_idx: int = Query(0),
):

    try:

        if file_idx >= len(FILES):
            return {"bloques": [], "total": 0}

        path = FILES[file_idx]

        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)

        sesiones = data["sesiones"]

        if sesion_idx >= len(sesiones):
            return {
                "bloques": [],
                "total": len(sesiones),
            }

        return {
            "bloques": sesiones[sesion_idx]["bloques"],
            "total": len(sesiones),
        }

    except Exception as e:

        print(e)

        return {"bloques": [], "total": 0}
