# -*- coding: utf-8 -*-
"""birlik.docx ichidagi lingvomadaniy birliklarni o'qib, JSON ga yozadi.

Chiqish: flask_backend/units.json
Format: [{"birlik", "tarjima", "izoh", "strategiya", "kategoriya"}, ...]
"""
import json
import os

import docx

DOCX_PATH = os.path.join(os.path.dirname(__file__), "birlik.docx")
OUT_PATH = os.path.join(os.path.dirname(__file__), "flask_backend", "units.json")

APOS = ["ʻ", "ʼ", "‘", "’", "`", "´"]


def fix(s: str) -> str:
    s = (s or "").strip()
    for a in APOS:
        s = s.replace(a, "'")
    return s


def is_header(birlik: str) -> bool:
    b = birlik.lower()
    return b in ("o'zbekcha birlik", "uzbekcha birlik", "birlik", "son", "")


def main():
    d = docx.Document(DOCX_PATH)

    raw = []
    for t in d.tables:
        for r in t.rows:
            cells = [fix(c.text) for c in r.cells]
            if len(cells) < 4:
                continue
            # ustun: 0=raqam, 1=o'zbekcha, 2=inglizcha, 3=strategiya
            birlik, tarjima, strat = cells[1], cells[2], cells[3]
            if is_header(birlik) or not birlik or not tarjima:
                continue
            raw.append((birlik, tarjima, strat or "Functional equivalent"))

    # birlik bo'yicha dublikatni tozalash (kichik harf kaliti bilan)
    seen = {}
    for birlik, tarjima, strat in raw:
        key = birlik.lower()
        if key not in seen:
            seen[key] = (birlik, tarjima, strat)

    units = []
    for birlik, tarjima, strat in seen.values():
        units.append(
            {
                "birlik": birlik,
                "tarjima": tarjima,
                "izoh": "",            # docx da izoh yo'q
                "strategiya": strat,
                "kategoriya": "Umumiy",
            }
        )

    with open(OUT_PATH, "w", encoding="utf-8") as f:
        json.dump(units, f, ensure_ascii=False, indent=2)

    print(f"Xom qator: {len(raw)}")
    print(f"Dublikatsiz birlik: {len(units)}")
    print(f"Yozildi: {OUT_PATH}")
    print("Namuna:")
    for u in units[:5]:
        print("  ", u)


if __name__ == "__main__":
    main()
