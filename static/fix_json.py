import json5
import json
import sys

INPUT_FILE = "static/kamizen_content.json"

def fix_json_file(input_path):
    try:
        # Leer el contenido original
        with open(input_path, "r", encoding="utf-8") as f:
            raw = f.read()

        # Intentar cargar con json5 (más tolerante que json normal)
        data = json5.loads(raw)

        # Guardar en JSON estándar con indentación, sobrescribiendo el original
        with open(input_path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=4)

        print(f"✅ JSON corregido y sobrescrito correctamente: {input_path}")

    except Exception as e:
        print(f"❌ Error al reparar JSON: {e}")
        sys.exit(1)

if __name__ == "__main__":
    fix_json_file(INPUT_FILE)
