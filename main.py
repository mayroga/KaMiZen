from flask import Flask, render_template, request, jsonify, session
from flask_cors import CORS
import os

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "kamizen-secret-key")
CORS(app, supports_credentials=True)

ADMIN_USERNAME = os.environ.get("ADMIN_USERNAME")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD")

# -----------------------
# RUTA PRINCIPAL
# -----------------------
@app.route("/")
def index():
    return render_template("index.html")

# -----------------------
# LOGIN
# -----------------------
@app.route("/login", methods=["POST"])
def login():
    data = request.json
    username = data.get("username")
    password = data.get("password")

    if username == ADMIN_USERNAME and password == ADMIN_PASSWORD:
        session["authenticated"] = True
        session["username"] = username
        session["level"] = 1

        return jsonify({
            "success": True,
            "level": 1,
            "message": "Login correcto"
        })

    return jsonify({
        "success": False,
        "message": "Credenciales incorrectas"
    }), 401

# -----------------------
# ESTADO DEL USUARIO
# -----------------------
@app.route("/state")
def state():
    if not session.get("authenticated"):
        return jsonify({"authenticated": False})

    return jsonify({
        "authenticated": True,
        "username": session.get("username"),
        "level": session.get("level")
    })

# -----------------------
# LOGOUT
# -----------------------
@app.route("/logout", methods=["POST"])
def logout():
    session.clear()
    return jsonify({"success": True})

# -----------------------
# RUN
# -----------------------
if __name__ == "__main__":
    app.run(debug=True)
