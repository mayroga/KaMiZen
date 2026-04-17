import json
import os

INPUT_FILE = "kamizen_content.json"
OUTPUT_FILE = "kamizen_content_clean.json"


def validate_json():
    if not os.path.exists(INPUT_FILE):
        print("❌ File not found")
        return

    with open(INPUT_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)

    # =========================
    # CLEAN MISSIONS ONLY
    # =========================
    missions = data.get("missions", [])

    unique = {}
    for m in missions:
        mid = m.get("id")
        if mid is not None:
            unique[mid] = m

    missions = sorted(unique.values(), key=lambda x: x.get("id", 0))

    # FIX STRUCTURE WITHOUT BREAKING IT
    data["missions"] = missions

    # =========================
    # SAVE FULL STRUCTURE (IMPORTANT)
    # =========================
    with open(OUTPUT_FILE, "w", encoding="utf-8") as out:
        json.dump(data, out, indent=2, ensure_ascii=False)

    print("🚀 CLEAN VALID JSON READY (STRUCTURE PRESERVED)")


if __name__ == "__main__":
    validate_json()
