from fastapi import FastAPI, Request, Form
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
import os
import openai

# Configuración OpenAI
openai.api_key = os.getenv("OPENAI_API_KEY")

app = FastAPI()

# Carpeta de templates y estáticos
templates = Jinja2Templates(directory="templates")
app.mount("/static", StaticFiles(directory="static"), name="static")

# Credenciales (solo tú puedes usar acceso gratuito)
ADMIN_USER = os.getenv("ADMIN_USER") or "miusuario"
ADMIN_PASS = os.getenv("ADMIN_PASS") or "miclave"

# =================== RUTAS ===================
@app.get("/", response_class=HTMLResponse)
async def index(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.post("/login")
async def login(username: str = Form(...), password: str = Form(...)):
    if username == ADMIN_USER and password == ADMIN_PASS:
        return JSONResponse({"role": "admin", "message": "Acceso gratuito concedido"})
    else:
        return JSONResponse({"detail": "Usuario o contraseña incorrectos"}, status_code=401)

@app.post("/start_session")
async def start_session(data: dict):
    """
    Inicia la sesión de KaMiZen:
    - data: { city: str, level: str }
    Devuelve info para mostrar mapa y avatar.
    """
    city = data.get("city", "Miami")
    level = data.get("level", "day")

    # Crear prompt dinámico para IA
    prompt = f"""
    Usuario en ciudad: {city}.
    Nivel: {level}.
    Genera microacciones y guía emocional progresiva siguiendo el manual KaMiZen.
    Nunca repetir estímulos en la misma sesión.
    Devuelve JSON con: message, actions[], colors[].
    """

    try:
        # Usando OpenAI API moderna
        response = openai.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "system", "content": "Eres KaMiZen, guía emocional humano."},
                      {"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=500
        )
        ai_output = response.choices[0].message.content
    except Exception as e:
        ai_output = f"No se pudo generar IA: {e}"

    # Respuesta
    return JSONResponse({
        "city": city,
        "level": level,
        "ai_message": ai_output
    })
