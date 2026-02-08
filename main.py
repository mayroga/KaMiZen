import os
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

app = FastAPI()

# Carpeta de templates y static
templates = Jinja2Templates(directory="templates")
app.mount("/static", StaticFiles(directory="static"), name="static")

# Admin desde Render
ADMIN_USERNAME = os.environ.get("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "1234")

# ================= LOGIN =================
@app.post("/admin/login")
async def admin_login(req: Request):
    data = await req.json()
    username = data.get("username")
    password = data.get("password")
    if username == ADMIN_USERNAME and password == ADMIN_PASSWORD:
        return JSONResponse({"role": "admin", "message": "Acceso autorizado"})
    else:
        return JSONResponse({"detail": "Usuario o contraseña incorrecta"}, status_code=401)

# ================= LIFE / MAP =================
@app.post("/life/guide")
async def life_guide(req: Request):
    data = await req.json()
    age = data.get("age")
    mood = data.get("mood")
    city = data.get("city")
    level = data.get("level", "day")
    lang = data.get("lang", "es")

    # Para demo: mensaje simple y ubicación para el mapa
    message = f"Bienvenido a KaMiZen. Edad: {age}, Mood: {mood}, Ciudad: {city}, Nivel: {level}"

    return JSONResponse({
        "session_id": "session123",  # aquí puedes generar un UUID real si quieres
        "message": message,
        "city": city,
        "level": level
    })

# ================= INDEX =================
@app.get("/")
async def index(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})
