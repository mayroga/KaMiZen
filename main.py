from fastapi import FastAPI, Query
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
import json
import os

app = FastAPI(title="KaMiZen NeuroGame Engine")

# ==============================
# STATIC FILES
# ==============================
app.mount("/static", StaticFiles(directory="static"), name="static")

# ==============================
# ARCHIVOS JSON EN ORDEN
# ==============================
JSON_FILES = [
    "static/kamizen_content_1.json",
    "static/kamizen_content_2.json",
    "static/kamizen_content_3.json",
    "static/kamizen_content_4.json",
]

# ==============================
# CONTROL DE SESIÓN
# ==============================
class SessionManager:
    def __init__(self, json_files):
        self.json_files = json_files
        self.current_file_idx = 0  # empieza por el primer JSON
        self.current_sesion_idx = 0
        self.total_sesiones_per_file = []  # guardará cantidad de sesiones por JSON
        self.load_total_sesiones()

    def load_total_sesiones(self):
        """Cargar la cantidad de sesiones por JSON sin mantener todas en memoria"""
        self.total_sesiones_per_file = []
        for file_path in self.json_files:
            if os.path.exists(file_path):
                with open(file_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    sesiones = data.get("sesiones", [])
                    self.total_sesiones_per_file.append(len(sesiones))
            else:
                self.total_sesiones_per_file.append(0)

    def get_current_session(self):
        """Devuelve la sesión actual leyendo solo el JSON necesario"""
        file_path = self.json_files[self.current_file_idx]
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            sesiones = data.get("sesiones", [])
            if 0 <= self.current_sesion_idx < len(sesiones):
                return sesiones[self.current_sesion_idx]
            return None

    def advance_session(self):
        """Avanzar a la siguiente sesión automáticamente"""
        self.current_sesion_idx += 1
        # si llegamos al final del JSON, pasamos al siguiente
        if self.current_sesion_idx >= self.total_sesiones_per_file[self.current_file_idx]:
            self.current_sesion_idx = 0
            self.current_file_idx += 1
            if self.current_file_idx >= len(self.json_files):
                self.current_file_idx = 0  # vuelve al primero
        return self.get_current_session()

    def previous_session(self):
        """Retroceder a la sesión anterior"""
        self.current_sesion_idx -= 1
        if self.current_sesion_idx < 0:
            self.current_file_idx -= 1
            if self.current_file_idx < 0:
                self.current_file_idx = len(self.json_files) - 1  # último JSON
            self.current_sesion_idx = self.total_sesiones_per_file[self.current_file_idx] - 1
        return self.get_current_session()

    def jump_to(self, file_idx: int, sesion_idx: int):
        """Opcional: saltar a una sesión específica (0-index)"""
        if 0 <= file_idx < len(self.json_files):
            self.current_file_idx = file_idx
            if 0 <= sesion_idx < self.total_sesiones_per_file[file_idx]:
                self.current_sesion_idx = sesion_idx
            else:
                self.current_sesion_idx = 0
        return self.get_current_session()


# Instancia global del manager de sesiones
session_manager = SessionManager(JSON_FILES)

# ==============================
# RUTA PRINCIPAL
# ==============================
@app.get("/", response_class=HTMLResponse)
async def home():
    try:
        with open("static/session.html", "r", encoding="utf-8") as f:
            return HTMLResponse(f.read())
    except Exception as e:
        return HTMLResponse(f"<h1>Error cargando interfaz</h1><p>{e}</p>")

# ==============================
# SESION ACTUAL
# ==============================
@app.get("/session_content")
async def session_content(
    action: str = Query(None, description="Opcional: 'next' o 'prev' para controlar sesión"),
    file_idx: int = Query(None, description="Opcional: saltar a JSON específico (0-3)"),
    sesion_idx: int = Query(None, description="Opcional: saltar a sesión específica dentro del JSON (0-index)")
):
    try:
        # Saltar a sesión específica si se reciben parámetros
        if file_idx is not None and sesion_idx is not None:
            session = session_manager.jump_to(file_idx, sesion_idx)
        # Avanzar o retroceder según acción
        elif action == "next":
            session = session_manager.advance_session()
        elif action == "prev":
            session = session_manager.previous_session()
        else:
            session = session_manager.get_current_session()

        if session:
            return JSONResponse({"sesion": session})
        return JSONResponse({"error": "No hay sesión disponible"})
    except Exception as e:
        return JSONResponse({"error": str(e)})

# ==============================
# HEALTH CHECK
# ==============================
@app.get("/health")
async def health():
    return {"status": "ok"}
