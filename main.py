from fastapi import FastAPI, Request, Form
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
import uuid
import random

app = FastAPI()

# Carpeta de templates y estáticos
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

# Usuarios de ejemplo (usuario/pago)
USERS = {
    "admin": {"password": "miclavegratis", "role": "admin"},
    "cliente1": {"password": "123", "role": "cliente_n1", "price": 9.99},
    "cliente2": {"password": "456", "role": "cliente_n2", "price": 99.99},
}

# ================= Página principal =================
@app.get("/", response_class=HTMLResponse)
async def index(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

# ================= Login =================
@app.post("/admin/login")
async def admin_login(data: dict):
    username = data.get("username")
    password = data.get("password")
    user = USERS.get(username)
    if user and user["password"] == password:
        return JSONResponse({"status": "ok", "role": user["role"], "price": user.get("price", 0)})
    return JSONResponse({"detail": "Usuario o contraseña incorrectos"}, status_code=401)

# ================= Sesión de KaMiZen =================
@app.post("/session/start")
async def start_session(data: dict):
    # Generar ID de sesión único
    session_id = str(uuid.uuid4())
    # Preparar respuesta inicial de IA
    messages = [
        "Estoy aquí contigo.",
        "¿Cómo puedo acompañarte hoy?",
        "¿Prefieres escuchar o caminar un poco?"
    ]
    message = random.choice(messages)
    return JSONResponse({
        "session_id": session_id,
        "message": message
    })

# ================= Flujo de microacciones =================
@app.post("/session/action")
async def session_action(data: dict):
    # data contiene: session_id, action
    action = data.get("action", "")
    responses = {
        "respirar": "Respiras profundamente y te relajas.",
        "estirarse": "Te estiras suavemente sintiendo alivio.",
        "cerrarOjos": "Cierras los ojos y sientes calma.",
        "caminar": "Das un paso adelante sintiendo tu progreso."
    }
    message = responses.get(action, "Sigue avanzando lentamente...")
    return JSONResponse({"message": message})

# ================= Test de mapa =================
@app.post("/session/map")
async def session_map(data: dict):
    # data puede contener lat/lon o ciudad
    city = data.get("city", "Miami")
    # En este ejemplo devolvemos coords simuladas
    coords = {"Miami": [25.7617, -80.1918]}
    lat, lon = coords.get(city, [25.7617, -80.1918])
    return JSONResponse({"lat": lat, "lon": lon})
