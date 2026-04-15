from flask import Flask, send_from_directory, jsonify
import os

app = Flask(__name__, static_folder="static")

# =========================
# CONFIG
# =========================
PORT = int(os.environ.get("PORT", 5000))


# =========================
# ROUTES FRONTEND
# =========================

@app.route("/")
def home():
    return send_from_directory("static", "session.html")


@app.route("/session")
def session():
    return send_from_directory("static", "session.html")


# =========================
# API (PREPARADO PARA ESCALAR)
# =========================

@app.route("/api/status")
def status():
    return jsonify({
        "status": "ok",
        "engine": "KaMiZen Tactical Life Engine",
        "version": "1.0"
    })


# =========================
# ERROR HANDLER (IMPORTANTE)
# =========================

@app.errorhandler(404)
def not_found(e):
    return jsonify({
        "error": "Ruta no encontrada",
        "message": "Verifica la URL"
    }), 404


# =========================
# RUN
# =========================

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=PORT, debug=True)
