# -*- coding: utf-8 -*-
"""'NAUGHTY BOY WORD.docx' (inglizcha tarjima) ni stilli HTML ga aylantiradi.

Word fayldan to'g'ridan-to'g'ri o'qiladi (PDF OCR o'rniga — aniqroq).
Chiqish: flask_backend/naughtyboy.html

Qayta yaratish (loyiha ildizida):
    python parse_naughty.py
"""
import html
import os
import re

import docx

DOCX_PATH = os.path.join(os.path.dirname(__file__), "NAUGHTY BOY WORD.docx")
OUT_PATH = os.path.join(os.path.dirname(__file__), "flask_backend", "naughtyboy.html")

# Buzilgan tirnoq/tire belgilarini tuzatish.
_REPLACE = {
    "“": '"', "”": '"', "‘": "'", "’": "'",
    "—": "-", "–": "-",
}

# Kolontitul satrlari: "28 Gafur Gulom", "A naughty Boy 7", "Gafur Gulom".
_HEADER_RE = re.compile(
    r"^\s*(?:A naughty Boy\s*\d*|\d+\s+Gafur Gul\w*|Gafur Gul\w*\s*\d*)\s*",
    re.IGNORECASE,
)
# Bo'lim sarlavhasi. OCR PART raqamlarini buzgan ("PART n", "PART 111",
# "PART rv"), shuning uchun PART + qisqa belgilarni tutamiz va tartib bo'yicha
# to'g'ri Rim raqami beramiz.
_PART_RE = re.compile(r"^\s*(FOREWORD|PART\b[\s.]*[ivxlcn0-9]{0,4})", re.IGNORECASE)
_ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"]


def clean(s: str) -> str:
    for a, b in _REPLACE.items():
        s = s.replace(a, b)
    s = re.sub(r"(?<=\w)�(?=\w)", "'", s)
    s = s.replace("�", "")
    return " ".join(s.split()).strip()


def main():
    doc = docx.Document(DOCX_PATH)
    parts = []
    idx = 0
    part_no = 0  # nechanchi PART (Rim raqamini to'g'rilash uchun)

    for p in doc.paragraphs:
        text = clean(p.text)
        if not text:
            continue

        # Boshidagi kolontitulni olib tashlaymiz.
        text = _HEADER_RE.sub("", text).strip()
        if not text:
            continue

        # Bo'lim sarlavhasi (PART I / FOREWORD).
        m = _PART_RE.match(text)
        if m:
            if m.group(1).upper().startswith("FOREWORD"):
                sarlavha = "FOREWORD"
            else:
                roman = _ROMAN[part_no] if part_no < len(_ROMAN) else str(part_no + 1)
                part_no += 1
                sarlavha = f"PART {roman}"
            parts.append(f'<h2 class="asar-bolim">{html.escape(sarlavha)}</h2>')
            text = text[m.end():].strip()
            if not text:
                continue

        safe = html.escape(text)
        if text.startswith("-"):
            parts.append(f'<p class="asar-dialog" data-i="{idx}">{safe}</p>')
        else:
            parts.append(f'<p class="asar-p" data-i="{idx}">{safe}</p>')
        idx += 1

    body = "\n".join(parts)
    with open(OUT_PATH, "w", encoding="utf-8") as f:
        f.write(body)

    print(f"Paragraflar: {idx}")
    print(f"Yozildi: {OUT_PATH} ({len(body)} belgi)")


if __name__ == "__main__":
    main()
