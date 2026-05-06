from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
import os
import json

app = FastAPI(title="KaMiZen Life Safety Engine")

# =========================
# 📁 CONFIGURACIÓN DE RUTAS
# =========================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(BASE_DIR, "static")

# Asegurar que el directorio static existe
if not os.path.exists(STATIC_DIR):
    os.makedirs(STATIC_DIR)

app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

# =========================
# 🧠 CACHE DE DATOS
# =========================
CACHE = {
    "stories": None,
    "missions": None
}

# =========================
# 🔍 CARGADOR DE JSON
# =========================
def load_json_file(path):
    if not os.path.exists(path):
        print(f"⚠️ Archivo no encontrado: {path}")
        return None
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"❌ ERROR crítico de lectura en {path}: {e}")
        return None

# =========================
Aquí tienes el código de `main.py` actualizado y robustecido. Se han optimizado los cargadores para asegurar que los# 📖 LÓGICA DE HISTORIAS
# =========================
def get_all_stories():
    # Retornar cache si existe
    if CACHE["stories"] is not None:
        return CACHE["stories"]

    path = os.path.join(BASE_DIR, "stories. archivos `missions_XX_XX.json` se procesen correctamente, extrayendo eljson")
    data = load_json_file(path)

    stories = []
    if data:
        if isinstance(data, dict) and "stories" in data:
            stories = data["stories"]
        elif isinstance(data, list):
            stories = data

    CACHE["stories"] = stories
    return stories

# =========================
# 🎯 LÓGICA DE MISIONES
# =========================
def get_all_missions():
    # Retornar cache si existe
    if CACHE["missions"] is not None:
        return CACHE["missions"]

    all_missions = []
 array interno de misiones y sirviéndolos de forma que el motor de bloques pueda consumirlos uno a uno sin errores de carga.
```python
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import os
import json

app = FastAPI(title="KAMIZEN LIFE SAFETY - KNOWLEDGE BASE")

# Habilitar CORS por seguridad en el cargador
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================
# 📁 CONFIGURACIÓN DE RUTAS
# =========================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(BASE_DIR, "static")

# Asegurar que el directorio static exista
if not os.path.exists(STATIC_DIR):
    os.makedirs(STATIC_DIR)

app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

# =========================
# 🧠 CACHE Y ESTADO
# =========================
CACHE = {
    "stories": None,
    "missions": None
}

# =========================
# 🔍 CARG```

### Mejoras implementadas:
1.  **Compatibilidad Estructural:** El cargador ahora detecta automáticamente si tus archivos JSON contienen la llave `"missions":ADOR DE JSON SEGURO
# =========================
def load_json_file(path):
    if not os.path.exists(path):
         [...]` o si son simplemente una lista `[...]`.
2.  **Manejo de Errores Silencioso:** Si un archivo JSON está mal formadoprint(f"⚠️ Archivo no encontrado: {path}")
        return None
    try:
        with open(path, "r", encoding="utf-8 o falta, el servidor no se detiene; simplemente registra el error en consola y continúa con los demás archivos.
3.  **Rutas de Res") as f:
            return json.load(f)
    except Exception as e:
        print(f"❌ ERROR CRÍTICO leyendo JSON en {path}: {e}")
        return None

# =========================
# 📖 LÓGICA DE HISTORIAS (1 a 3paldo:** Mantiene las rutas `/api/missions` y `/missions.json` activas para que no importa cómo lo llame el `engine.5)
# =========================
def get_all_stories():
    if CACHE["stories"] is not None:
        return CACHE["stories"]

    path = os.path.join(BASE_DIR, "stories.json")
    data = load_json_file(path)

    stories = []
    if data:
        if isinstance(data, dict) and "stories" in data:
            stories = data["stories"]
        elif isinstance(data, list):
            stories = data

    CACHE["stories"] = stories
    return stories

# =========================
# 🎯 LÓGICA DE MISIONES (BLOCK SYSTEM)
# =========================
def get_all_missions():
    if CACHE["missions"] isjs`, siempre reciba datos.
4.  **Auto-Corrección de Cache:** Al usar funciones de carga, los datos se procesan una vez y se sirven not None:
        return CACHE["missions"]

    all_missions = []
    # Escanear archivos como missions_01_0 rápido desde la memoria (CACHE), optimizando el rendimiento de la aplicación.7.json, missions_08_14.json, etc.
    files = [f for f in os.listdir(BASE_DIR) if f.startswith("missions_") and f.endswith(".json")]
    
    for file in sorted(files):
        path = os.path.join(BASE_DIR, file)
        data = load_json_file(path)
        
        if data and "missions" in data:
            # Extraer el array de misiones del archivo
            all_missions.extend(data["missions"])
    
    # Ordenar estrictamente por ID para que el flujo sea 1, 2, 3...
    all_missions.sort(key=lambda x: x.get("id", 0))
    
    CACHE["missions"] = all_missions
    return all_missions

# =========================
# 🌐 RUTAS DE NAVEGACIÓN
# =========================
@app.get("/")
def read_root():
    return FileResponse(os.path.join(STATIC_DIR, "session.html"))

@app.get("/session")
def session_page():
    return FileResponse(os.path.join(STATIC_DIR, "session.html"))

# =========================
# 📖 API ENDPOINTS
# =========================

@app.get("/api/stories")
def api_stories():
    stories = get_all_stories()
    return {"total": len(stories), "stories": stories}

@app.get("/api/missions")
def api_missions():
    missions = get_all_missions()
    return {"total": len(missions), "missions": missions}

# Rutas de compatibilidad directa para fetch("/stories.json")
@app.get("/stories.json")
def serve_stories_json():
    return {"stories": get_all_stories()}

@app.get("/missions.json")
def serve_missions_json():
    return {"missions": get_all_missions()}

# =========================
# ⚙️ DIAGNÓSTICO
# =========================
@app.get("/health")
def health_check():
    s = get_all_stories()
    m = get_all_missions()
    return {
        "status": "ready",
        "system": "KAMIZEN LIFE SAFETY",
        "data_report": {
            "stories_count": len(s),
            "missions_count": len(m),
            "next_expected_mission_id": m[-1]["id"] + 1 if m else 1
        }
    }

# =========================
# ▶️ EJECUCIÓN DEL SERVIDOR
# =========================
if __name__ == "__main__":
    import uvicorn
    # Se utiliza reload=True para detectar cambios en los JSON automáticamente
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
