from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
import os

app = FastAPI()

BASE_DIR = os.path.dirname(__file__)

# =====================
# STATIC
# =====================
app.mount("/static", StaticFiles(directory="static"), name="static")

# =====================
# HOME
# =====================
@app.get("/", response_class=HTMLResponse)
def home():
    path = os.path.join(BASE_DIR, "static/session.html")
    return open(path, encoding="utf-8").read()

# =====================
# JET MODE
# =====================
@app.get("/jet", response_class=HTMLResponse)
def jet():
    path = os.path.join(BASE_DIR, "static/jet.html")
    return open(path, encoding="utf-8").read()

# =====================
# IA JUDGE
# =====================
@app.post("/judge")
async def judge(request: Request):

    try:
        data = await request.json()
    except:
        data = {}

    decision = data.get("decision", "neutral")

    if decision == "avoid":
        score = 10
        message = "GOOD CONTROL"
    elif decision == "engage":
        score = -10
        message = "RISKY DECISION"
    else:
        score = 0
        message = "NEUTRAL"

    return JSONResponse({
        "score": score,
        "message": message
    })
