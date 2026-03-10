# main.py
from fastapi import FastAPI
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

app = FastAPI(title="KaMiZen - Entrenamiento Mental Diario")

# Montar carpeta de archivos estáticos (JS, CSS, HTML)
app.mount("/static", StaticFiles(directory="static"), name="static")

# Página principal (puedes usar session.html directamente)
@app.get("/")
async def root():
    return JSONResponse({"mensaje": "KaMiZen app activa. Visita /static/session.html"})


# SESIÓN DE KAMIZEN
@app.get("/session_content")
async def session_content():
    """
    Devuelve la sesión completa de KaMiZen con bloques:
    - recompensas
    - quizzes
    - respiración
    - cierre de sesión
    """
    bloques = [
        {"tipo":"recompensa","texto":"¡Bienvenido a KaMiZen! Vamos a entrenar tu mente y emociones."},
        {"tipo":"quiz",
         "pregunta":"¿Qué te hace sentir más feliz hoy?",
         "opciones":["Reír","Dormir","Comer","Trabajar"],
         "correcta":0,
         "explicacion":"Reír siempre ayuda a la mente y al cuerpo",
         "recompensa":5},
        {"tipo":"acertijo",
         "pregunta":"Tengo ciudades pero no casas, tengo montañas pero no árboles, tengo agua pero no peces. ¿Qué soy?",
         "opciones":["Mapa","Libro","Juego","Pintura"],
         "correcta":0,
         "explicacion":"Un mapa representa ciudades y montañas pero no son reales",
         "recompensa":5},
        {"tipo":"decision",
         "pregunta":"Elige una acción positiva para tu día:",
         "opciones":["Meditar","Quejarme","Procrastinar","Revisar redes sociales"],
         "correcta":0,
         "explicacion":"Meditar ayuda a mantener la calma y claridad mental",
         "recompensa":5},
        {"tipo":"juego_mental",
         "pregunta":"Recuerda la secuencia: Rojo, Azul, Verde. ¿Cuál fue el segundo color?",
         "opciones":["Rojo","Azul","Verde","Amarillo"],
         "correcta":1,
         "explicacion":"El segundo color de la secuencia es Azul",
         "recompensa":5},
        {"tipo":"respiracion","texto":"Respira profundo: inhalar por la nariz, exhalar por la boca. Hazlo 5 veces."},
        {"tipo":"recompensa","texto":"¡Excelente! Tu mente se está entrenando para el bienestar."},
        {"tipo":"cierre","texto":"¡Felicidades! Has completado tu sesión KaMiZen. Nos vemos mañana para continuar tu progreso."}
    ]

    return JSONResponse({"sesion": {"bloques": bloques}})
