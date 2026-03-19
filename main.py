from fastapi import FastAPI
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
import json
import os

app = FastAPI(title="KaMiZen Engine")

STATIC_DIR = "static"
DB_PATH = os.path.join(STATIC_DIR, "kamizen_content.json")

app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


# -------------------------
# CARGAR JSON SIEMPRE NUEVO
# -------------------------

def cargar_db():

    try:

        if not os.path.exists(DB_PATH):

            return {"sesiones": []}

        with open(DB_PATH, "r", encoding="utf-8") as f:

            data = json.load(f)

        if "sesiones" not in data:

            return {"sesiones": []}

        return data

    except Exception as e:

        print("ERROR JSON:", e)

        return {"sesiones": []}


# -------------------------
# HOME
# -------------------------

@app.get("/", response_class=HTMLResponse)
async def home():

    try:

        with open(
            os.path.join(STATIC_DIR, "session.html"),
            "r",
            encoding="utf-8"
        ) as f:

            return HTMLResponse(f.read())

    except:

        return HTMLResponse(
            "<h1>Error cargando session.html</h1>"
        )


# -------------------------
# API SESIONES
# -------------------------

@app.get("/session_content")
async def session_content():

    db = cargar_db()

    sesiones = db.get("sesiones", [])

    return JSONResponse({

        "sesiones": sesiones,

        "total": len(sesiones)

    })


# -------------------------
# HEALTH CHECK
# -------------------------

@app.get("/health")
async def health():

    return {

        "status": "ok",

        "engine": "kamizen",

        "sesiones": len(
            cargar_db().get("sesiones", [])
        )

    }
