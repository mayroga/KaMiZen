# main.py
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
import openai
import os

app = FastAPI()

# Configuración de carpetas
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

# ADMIN credentials desde Render
ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "adminpass")

# Clave de OpenAI desde entorno
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
openai.api_key = OPENAI_API_KEY

# ================= ROUTES =================

@app.get("/", response_class=HTMLResponse)
async def root(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

# ================= LOGIN =================
@app.post("/admin/login")
async def admin_login(req: Request):
    data = await req.json()
    username = data.get("username")
    password = data.get("password")
    
    if username == ADMIN_USERNAME and password == ADMIN_PASSWORD:
        return JSONResponse({"role": "admin", "message": "Acceso concedido"})
    else:
        raise HTTPException(status_code=401, detail="Usuario o contraseña incorrectos")

# ================= LIFE GUIDE / NIVELES =================
@app.post("/life/guide")
async def life_guide(req: Request):
    data = await req.json()
    age = data.get("age")
    mood = data.get("mood")
    city = data.get("city")
    lang = data.get("lang", "es")
    level = data.get("level", "day")

    if not all([age, mood, city, level]):
        raise HTTPException(status_code=400, detail="Faltan datos requeridos")

    # Crear prompt para OpenAI
    prompt = f"Usuario de {age} años, estado de ánimo: {mood}, ciudad: {city}, idioma: {lang}, nivel: {level}. Genera un mensaje breve para mostrar en la app."

    try:
        response = openai.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=200
        )
        answer = response.choices[0].message.content

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    # Retornar al frontend
    return {"session_id": "12345", "message": answer}
