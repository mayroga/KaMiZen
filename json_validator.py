import json
import os

INPUT_FILE = "static/kamizen_content.json"
OUTPUT_FILE = "static/kamizen_content_clean.json"


# =========================
# FIX COMMON JSON ERRORS
# =========================
def auto_fix_json(text):
    print("🔧 Attempting auto-fix...")

    # Fix: missing commas between objects
    text = text.replace("}\n{", "},\n{")

    # Fix: extra commas before closing arrays
    text = text.replace(",\n]", "\n]")

    # Fix: double closing
    text = text.replace("}\n]\n}", "\n]")

    # Remove stray fragments like `"id":12` outside structure
    lines = text.splitlines()
    clean_lines = []

    for line in lines:
        if line.strip().startswith('"id"') and "{" not in line:
            continue
        clean_lines.append(line)

    return "\n".join(clean_lines)


# =========================
# VALIDATE JSON
# =========================
def validate_json():
    if not os.path.exists(INPUT_FILE):
        print("❌ File not found")
        return

    with open(INPUT_FILE, "r", encoding="utf-8") as f:
        raw = f.read()

    # First attempt
    try:
        data = json.loads(raw)
        print("✅ JSON is already valid")
    except json.JSONDecodeError as e:
        print("❌ JSON ERROR:")
        print(f"👉 Line: {e.lineno}, Column: {e.colno}")
        print(f"👉 Msg: {e.msg}")

        # Try auto-fix
        fixed = auto_fix_json(raw)

        try:
            data = json.loads(fixed)
            print("✅ JSON fixed automatically")

            with open(OUTPUT_FILE, "w", encoding="utf-8") as out:
                json.dump(data, out, indent=2, ensure_ascii=False)

            print(f"💾 Clean file saved → {OUTPUT_FILE}")

        except Exception as e2:
            print("❌ Auto-fix failed:", e2)
            return

    # =========================
    # CLEAN STRUCTURE
    # =========================

    missions = data.get("missions", [])

    # Remove duplicates by ID
    unique = {}
    for m in missions:
        mid = m.get("id")
        if mid not in unique:
            unique[mid] = m

    missions = list(unique.values())

    # Sort by ID
    missions.sort(key=lambda x: x.get("id", 0))

    # Validate structure
    for m in missions:
        if "blocks" not in m:
            print(f"⚠️ Mission {m.get('id')} missing blocks")

    clean_data = {"missions": missions}

    # Save clean version
    with open(OUTPUT_FILE, "w", encoding="utf-8") as out:
        json.dump(clean_data, out, indent=2, ensure_ascii=False)

    print("🚀 FINAL CLEAN JSON READY")


# =========================
# RUN
# =========================
if __name__ == "__main__":
    validate_json()
