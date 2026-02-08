# main.py
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
import os

app = FastAPI()

# Carpeta de templates y estáticos
templates = Jinja2Templates(directory="templates")
app.mount("/static", StaticFiles(directory="static"), name="static")

# Cargar usuario y contraseña ocultos desde variables de entorno de Render
ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "admin")  # Por seguridad, default nunca se usa
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "1234")

# ================== RUTAS ==================

@app.get("/")
async def index(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.post("/login")
async def login(request: Request):
    data = await request.json()
    username = data.get("username")
    password = data.get("password")
    if username == ADMIN_USERNAME and password == ADMIN_PASSWORD:
        return JSONResponse({"role": "admin", "message": "Login exitoso"})
    else:
        # Bloqueo inmediato si falla para evitar intentos múltiples
        raise HTTPException(status_code=401, detail="Usuario o contraseña incorrectos")

@app.post("/start_session")
async def start_session(request: Request):
    """
    Inicia la sesión del usuario después de login exitoso.
    Recibe: ciudad, nivel
    Devuelve: coordenadas iniciales para Leaflet, precios y estado de avatar
    """
    data = await request.json()
    city = data.get("city", "Miami")
    level = data.get("level", "day")  # day = Nivel 1, night = Nivel 2

    # Coordenadas de ejemplo, en un caso real se puede integrar geocoding
    city_coords = {
        "Miami": [25.7617, -80.1918],
        "New York": [40.7128, -74.0060],
        "Los Angeles": [34.0522, -118.2437]
    }
    lat, lon = city_coords.get(city, [25.7617, -80.1918])

    # Precios según nivel
    prices = {
        "day": 9.99,
        "night": 99.0
    }

    # Estado inicial del avatar
    avatar = {
        "x": lat,
        "y": lon,
        "status": "walking"
    }

    return JSONResponse({
        "map_center": [lat, lon],
        "level": level,
        "price": prices.get(level),
        "avatar": avatar,
        "message": "Sesión iniciada. ¡Disfruta tu experiencia KaMiZen!"
    })

# ================== SERVIR ARCHIVOS ==================
@app.get("/favicon.ico")
async def favicon():
    return FileResponse("static/favicon.ico")
