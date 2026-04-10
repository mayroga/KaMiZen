from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
import os

app = FastAPI()

# =====================
# STATIC SAFE
# =====================
BASE_DIR = os.path.dirname(__file__)

app.mount("/static", StaticFiles(directory="static"), name="static")


# =====================
# HOME (SESSION)
# =====================
@app.get("/", response_class=HTMLResponse)
def home():
    return open(os.path.join(BASE_DIR, "static/session.html"), encoding="utf-8").read()


# =====================
# JET PAGE (SAFE CHECK)
# =====================
@app.get("/jet", response_class=HTMLResponse)
def jet():
    path = os.path.join(BASE_DIR, "static/jet.html")
    if not os.path.exists(path):
        return HTMLResponse("<h1>jet.html not found</h1>")
    return open(path, encoding="utf-8").read()


# =====================
# JUDGE IA (SAFE + SIMPLE)
# =====================
@app.post("/judge")
async def judge(request: Request):
    try:
        data = await request.json()
    except:
        data = {}

    decision = data.get("decision", "none")

    if decision == "avoid":
        score = 5
        msg = "SAFE CHOICE"
    elif decision == "engage":
        score = -5
        msg = "RISK DETECTED"
    else:
        score = 0
        msg = "NEUTRAL"

    return JSONResponse({
        "score": score,
        "message": msg
    })
