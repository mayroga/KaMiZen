# main.py
from fastapi import FastAPI, Request, HTTPException, Form
from fastapi.responses import HTMLResponse, JSONResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import os
import uuid
import datetime

# ===============================
# APP
# ===============================
app = FastAPI()

# ===============================
# CORS
# ===============================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ===============================
# ENV VARIABLES
# ===============================
ADMIN_USERNAME = os.getenv("ADMIN_USERNAME")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD")

if not ADMIN_USERNAME or not ADMIN_PASSWORD:
    raise RuntimeError("ADMIN_USERNAME or ADMIN_PASSWORD not set")

# ===============================
# STATIC FILES
# ===============================
app.mount("/static", StaticFiles(directory="static"), name="static")

# ===============================
# SESSION STATE (NO PERSISTENTE)
# ===============================
SESSIONS = {}

# ===============================
# HELPERS
# ===============================
def create_session(username: str):
    sid = str(uuid.uuid4())
    SESSIONS[sid] = {
        "username": username,
        "level": 1,
        "start_time": datetime.datetime.utcnow().isoformat()
    }
    return sid

def get_session(request: Request):
    sid = request.cookies.get("kamizen_session")
    if not sid or sid not in SESSIONS:
        return None
    return SESSIONS[sid]

# ===============================
# ROUTES
# ===============================

@app.get("/", response_class=HTMLResponse)
async def login_page():
    with open("templates/index.html", "r", encoding="utf-8") as f:
        return f.read()

@app.post("/login")
async def login(
    username: str = Form(...),
    password: str = Form(...)
):
    if username != ADMIN_USERNAME or password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    sid = create_session(username)

    response = RedirectResponse(url="/level/1", status_code=302)
    response.set_cookie(
        key="kamizen_session",
        value=sid,
        httponly=True,
        samesite="lax"
    )
    return response

@app.get("/level/1", response_class=HTMLResponse)
async def level_one(request: Request):
    session = get_session(request)
    if not session:
        return RedirectResponse(url="/", status_code=302)

    with open("templates/level1.html", "r", encoding="utf-8") as f:
        return f.read()

@app.get("/level/2", response_class=HTMLResponse)
async def level_two(request: Request):
    session = get_session(request)
    if not session:
        return RedirectResponse(url="/", status_code=302)

    if session["level"] < 2:
        raise HTTPException(status_code=403, detail="Level locked")

    with open("templates/level2.html", "r", encoding="utf-8") as f:
        return f.read()

@app.post("/api/progress")
async def progress_level(request: Request):
    session = get_session(request)
    if not session:
        raise HTTPException(status_code=401)

    session["level"] += 1
    return JSONResponse({"level": session["level"]})

@app.post("/logout")
async def logout(request: Request):
    sid = request.cookies.get("kamizen_session")
    if sid in SESSIONS:
        del SESSIONS[sid]

    response = RedirectResponse(url="/", status_code=302)
    response.delete_cookie("kamizen_session")
    return response
