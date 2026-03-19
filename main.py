from fastapi import FastAPI
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
import json

app = FastAPI(title="KaMiZen Engine")

app.mount("/static", StaticFiles(directory="static"), name="static")

DB_PATH = "static/kamizen_content.json"


def cargar_db():

    try:

        with open(DB_PATH, "r", encoding="utf-8") as f:

            data = json.load(f)

        if "sesiones" not in data:

            return {"sesiones": []}

        return data

    except Exception as e:

        print("ERROR JSON", e)

        return {"sesiones": []}



@app.get("/", response_class=HTMLResponse)
async def home():

    with open("static/session.html", "r", encoding="utf-8") as f:

        return HTMLResponse(f.read())



@app.get("/session_content")
async def session_content():

    db = cargar_db()

    sesiones = db.get("sesiones", [])

    return JSONResponse({

        "sesiones": sesiones,

        "total": len(sesiones)

    })
