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

# Montar archivos estáticos (HTML, JS, CSS)
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
        return None
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"❌ ERROR JSON en {path}: {e}")
        return None

# =========================
# 📖 LÓGICA DE HISTORIAS
# =========================
def get_all_stories():
    if CACHE["stories"] is not None:
        return CACHE["stories"]

    path = os.path.join(BASE_DIR, "stories.json")
    data = load_json_file(path)

    if data and "stories" in data:
        stories = data["stories"]
    elif isinstance(data, list):
        stories = data
    else:
        stories = []

    CACHE["stories"] = stories
    return stories

# =========================
# 🎯 LÓGICA DE MISIONES
# =========================
def get_all_missions():
    if CACHE["missions"] is not None:
        return CACHE["missions"]

    all_missions = []
    # Busca todos los archivos que empiecen con missions_ y terminen en .json
    files = [f for f in os.listdir(BASE_DIR) if f.startswith("missions_") and f.endswith(".json")]
    
    for file in sorted(files):
        path = os.path.join(BASE_DIR, file)
        data = load_json_file(path)
        
        if data and "missions" in data:
            all_missions.extend(data["missions"])
    
    # Ordenar por ID para mantener la secuencia lógica
    all_missions.sort(key=lambda x: x.get("id", 0))
    
    CACHE["missions"] = all_missions
    return all_missions

# =========================
# 🌐 RUTAS DE NAVEGACIÓN
# =========================
@app.get("/")
def read_root():
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

# Estas rutas sirven los JSON directamente por si el JS los pide sin el prefijo /api/
@app.get("/stories.json")
def serve_stories_json():
    return JSONResponse(content={"stories": get_all_stories()})

@app.get("/missions.json")
def serve_missions_json():
    return JSONResponse(content={"missions": get_all_missions()})

# =========================
# ⚙️ ESTADO Y CONFIGURACIÓN
# =========================
@app.get("/health")
def health_check():
    return {
        "status": "online",
        "branding": "KAMIZEN LIFE SAFETY",
        "files_loaded": {
            "stories": len(get_all_stories()),
            "missions": len(get_all_missions())
        }
    }

# =========================
# ▶️ EJECUCIÓN
# =========================
if __name__ == "__main__":
    import uvicorn
    # Se recomienda usar reload=True solo en desarrollo
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
