from fastapi import FastAPI, Request, Form
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
import os

app = FastAPI()
templates = Jinja2Templates(directory="templates")
app.mount("/static", StaticFiles(directory="static"), name="static")

# Usuario y contraseña para tu acceso gratis (tomados desde Render environment)
FREE_USER = os.getenv("FREE_USER")
FREE_PASS = os.getenv("FREE_PASS")

# Niveles de pago
LEVELS = {
    "day": {"name": "Nivel 1 – Day", "price": 9.99},
    "night": {"name": "Nivel 2 – Night", "price": 99.0}
}

@app.get("/", response_class=HTMLResponse)
async def index(request: Request):
    return templates.TemplateResponse("index.html", {"request": request, "levels": LEVELS})

@app.post("/login")
async def login(request: Request):
    data = await request.json()
    username = data.get("username")
    password = data.get("password")
    if username == FREE_USER and password == FREE_PASS:
        return JSONResponse({"success": True, "role": "admin"})
    else:
        return JSONResponse({"success": False, "detail": "Usuario o contraseña incorrectos"}, status_code=401)

@app.post("/start_session")
async def start_session(request: Request):
    data = await request.json()
    level = data.get("level")
    city = data.get("city")
    # Retorna datos de sesión
    return JSONResponse({
        "success": True,
        "level": LEVELS.get(level, LEVELS["day"]),
        "city": city,
        "message": f"Bienvenido a KaMiZen. Nivel seleccionado: {LEVELS.get(level, LEVELS['day'])['name']}"
    })
