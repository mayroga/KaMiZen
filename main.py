from flask import Flask, send_from_directory, jsonify
import json
import os

app = Flask(__name__, static_folder="static")

# ===============================
# LOAD JSON CONTENT (ROBUST)
# ===============================

def load_content():
    path = os.path.join(app.static_folder, "kamizen_content.json")

    try:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)

        # Validación base
        if "missions" not in data:
            raise Exception("JSON inválido: falta 'missions'")

        # NORMALIZACIÓN (CLAVE IMPORTANTE)
        for mission in data["missions"]:
            for block in mission.get("blocks", []):

                # Caso 1: tvid viene como lista (error en tu JSON)
                if block.get("type") == "tvid" and isinstance(block.get("tvid"), list):
                    block["options"] = block["tvid"]
                    del block["tvid"]

                # Caso 2: asegurar que options exista
                if block.get("type") == "tvid":
                    if "options" not in block:
                        block["options"] = []

        return data

    except Exception as e:
        print("ERROR cargando JSON:", e)
        return {"missions": []}


# ===============================
# ROUTES
# ===============================

@app.route("/")
def index():
    return send_from_directory("static", "session.html")


@app.route("/api/missions")
def missions():
    data = load_content()
    return jsonify(data)


# ===============================
# STATIC FILES (CSS, JS, JSON)
# ===============================

@app.route("/static/<path:path>")
def static_files(path):
    return send_from_directory("static", path)


# ===============================
# RUN SERVER
# ===============================

if __name__ == "__main__":
    app.run(debug=True)
