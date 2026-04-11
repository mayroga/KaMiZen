from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
import os

app = FastAPI()

BASE_DIR = os.path.dirname(__file__)

app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/", response_class=HTMLResponse)
def home():
    return open(os.path.join(BASE_DIR,"static/session.html"),encoding="utf-8").read()

@app.post("/judge")
async def judge(request: Request):

    try:
        data = await request.json()
    except:
        data = {}

    decision = data.get("decision","")

    # 🔥 IA REAL BASADA EN TVID
    if decision == "TDB":
        msg = "Has elegido el bien consciente"
        score = 10

    elif decision == "TDM":
        msg = "Estás evitando la realidad"
        score = -5

    elif decision == "TDN":
        msg = "Tu niño interior responde"
        score = 8

    elif decision == "TDP":
        msg = "Estás actuando con guía"
        score = 9

    elif decision == "TDG":
        msg = "Estás en modo guerra emocional"
        score = -10

    else:
        msg = "Decisión neutra"
        score = 0

    return JSONResponse({
        "message": msg,
        "score": score
    })
