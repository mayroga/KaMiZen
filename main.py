from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
import json
import random
import re

app = FastAPI(title="KaMiZen NeuroGame Engine")
app.mount("/static", StaticFiles(directory="static"), name="static")

# -------------------------------
# Función para limpiar y corregir JSON automáticamente
# -------------------------------
def cargar_json_seguro(ruta):
    """
    Intenta cargar un JSON incluso si tiene errores comunes:
    - Comas faltantes entre elementos
    - Comillas simples cambiadas a dobles
    - Llaves o corchetes mal cerrados
    """
    with open(ruta, "r", encoding="utf-8") as f:
        contenido = f.read()

    # Reemplazar comillas simples por dobles
    contenido = contenido.replace("'", '"')

    # Agregar comas entre elementos que no tengan coma
    # Busca comillas dobles seguidas de salto de línea o comillas
    contenido = re.sub(r'("\s*\n\s*")', '",\n"', contenido)

    # Intentar cerrar corchetes o llaves si faltan
    # Contar corchetes y llaves
    corchetes_abiertos = contenido.count('[') - contenido.count(']')
    llaves_abiertas = contenido.count('{') - contenido.count('}')

    if corchetes_abiertos > 0:
        contenido += ']' * corchetes_abiertos
    if llaves_abiertas > 0:
        contenido += '}' * llaves_abiertas

    # Intentar parsear JSON
    try:
        return json.loads(contenido)
    except json.JSONDecodeError as e:
        print("Error al cargar JSON automáticamente:", e)
        # Devolver un JSON vacío para que la app no falle
        return {}

# -------------------------------
# Cargar contenido desde archivo JSON de forma segura
# -------------------------------
db = cargar_json_seguro("static/kamizen_content.json")

# Función para obtener contenido aleatorio
def obtener_contenido(categoria):
    return random.choice(db.get(categoria, ["Sin contenido disponible"]))

# Endpoint principal
@app.get("/")
async def root():
    with open("static/session.html", "r", encoding="utf-8") as f:
        return HTMLResponse(f.read())

# Endpoint para obtener contenido de sesión
@app.get("/session_content")
async def session_content():
    contenido = {
        "historia": obtener_contenido("historias"),
        "historia_riqueza": obtener_contenido("historias_riqueza"),
        "ejercicio": obtener_contenido("ejercicios"),
        "bienestar": obtener_contenido("bienestar"),
        "cierre": obtener_contenido("cierres")
    }
    return contenido
