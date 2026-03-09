import re
import json5
import json

input_file = "static/kamizen_content.json"
output_file = "static/kamizen_content_fixed.json"

# Leer el contenido original
with open(input_file, "r", encoding="utf-8") as f:
    raw = f.read()

# Reparaciones simples:
# 1. Comillas simples → comillas dobles
raw = re.sub(r"'", '"', raw)

# 2. Comas finales faltantes entre elementos (agrega coma antes de cierre de array o objeto si hace falta)
raw = re.sub(r'"\s*\n\s*"([^"]+)"', r'", "\1"', raw)  # línea a línea entre strings
raw = re.sub(r'([}\]"]) *(\n|$)', r'\1,', raw)       # posible coma final (json5 tolera comas extra)

# 3. Quitar comas extra antes de cierre
raw = re.sub(r',\s*([\]}])', r'\1', raw)

# 4. Convertir a JSON usando json5 (más tolerante)
try:
    data = json5.loads(raw)
except Exception as e:
    print("Error reparando JSON automáticamente:", e)
    data = {}  # fallback vacío

# Guardar JSON corregido
with open(output_file, "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=4)

print(f"Archivo reparado guardado en: {output_file}")
