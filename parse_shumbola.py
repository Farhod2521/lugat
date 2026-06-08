# -*- coding: utf-8 -*-
"""'Shum bola.docx' asarini stilli HTML ga aylantiradi.

Chiqish: flask_backend/shumbola.html

Asar matni o'zgartirilmasdan, paragraf turlari (bo'lim sarlavhasi, dialog,
oddiy matn) HTML elementlariga aylantiriladi. Birliklarni sariq bilan
ajratish (highlight) frontendda, modal ko'rsatilganda bajariladi.

Har bir matnli paragraf <p data-i="N"> ga o'raladi — frontend qidirilgan
so'zni shu paragraflar ichidan topib, scroll qiladi.

Qayta yaratish (loyiha ildizida):
    python parse_shumbola.py
"""
import html
import os

import docx

DOCX_PATH = os.path.join(os.path.dirname(__file__), "Shum bola.docx")
OUT_PATH = os.path.join(os.path.dirname(__file__), "flask_backend", "shumbola.html")

APOS = ["ʻ", "ʼ", "‘", "’", "`", "´"]


def fix(s: str) -> str:
    for a in APOS:
        s = s.replace(a, "'")
    return s.strip()


def main():
    d = docx.Document(DOCX_PATH)

    parts = []
    idx = 0
    for p in d.paragraphs:
        text = fix(p.text)
        if not text:
            continue

        style = p.style.name
        safe = html.escape(text)

        if style in ("Title",):
            parts.append(f'<h1 class="asar-title">{safe}</h1>')
        elif style in ("Heading 1", "Heading 2"):
            parts.append(f'<h2 class="asar-bolim">{safe}</h2>')
        elif text.startswith("–") or text.startswith("-"):
            # Dialog satri (tire bilan boshlanadi)
            parts.append(f'<p class="asar-dialog" data-i="{idx}">{safe}</p>')
            idx += 1
        else:
            parts.append(f'<p class="asar-p" data-i="{idx}">{safe}</p>')
            idx += 1

    body = "\n".join(parts)

    with open(OUT_PATH, "w", encoding="utf-8") as f:
        f.write(body)

    print(f"Matnli paragraflar: {idx}")
    print(f"Yozildi: {OUT_PATH} ({len(body)} belgi)")


if __name__ == "__main__":
    main()
