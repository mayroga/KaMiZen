from fastapi import FastAPI, Request, Form
from fastapi.responses import RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

app = FastAPI()

app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

# Datos de niveles
levels = {
    "day": {"name": "Nivel 1 – Day", "price": 9.99},
    "night": {"name": "Nivel 2 – Night", "price": 99.0}
}

# Usuario gratis
FREE_USER = {"username": "gratis", "password": "1234"}

@app.get("/")
async def index(request: Request):
    return templates.TemplateResponse("index.html", {
        "request": request,
        "levels": levels
    })

@app.post("/login")
async def login(request: Request, username: str = Form(...), password: str = Form(...)):
    if username == FREE_USER["username"] and password == FREE_USER["password"]:
        response = RedirectResponse("/", status_code=302)
        return response
    # Para cualquier otro usuario, error simple
    return templates.TemplateResponse("index.html", {
        "request": request,
        "levels": levels,
        "error": "Usuario o contraseña incorrectos"
    })
