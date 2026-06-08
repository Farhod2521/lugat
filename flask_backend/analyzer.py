"""Matnni lingvomadaniy birliklarga tahlil qiluvchi modul.

Ish tartibi:
  1. Matn normallashtiriladi (apostrof variantlari, kichik harf).
  2. Bazadagi har bir birlik matn ichidan grammatik qo'shimchalari bilan
     qidiriladi (so'z yasovchilar bilan emas — qidiruv.py ga qarang).
  3. Har bir topilgan birlikning soni va matndagi konteksti qaytariladi.
"""
import re

from qidiruv import birlik_pattern, normalize
from asar import asarda_bormi

# normalize qidiruv.py dan re-export qilinadi (boshqa modullar import qiladi).
__all__ = ["analyze_text", "normalize"]


def _split_sentences(text: str):
    """Matnni gaplarga ajratadi (kontekstni ko'rsatish uchun)."""
    parts = re.split(r"(?<=[.!?…])\s+", text.strip())
    return [p.strip() for p in parts if p.strip()]


def analyze_text(text: str, units):
    """Matnni tahlil qiladi.

    Args:
        text: foydalanuvchi yuborgan matn.
        units: LingvoUnit obyektlari ro'yxati (bazadan).

    Returns:
        dict — natijalar va statistika.
    """
    norm_text = normalize(text)
    sentences = _split_sentences(text)
    norm_sentences = [normalize(s) for s in sentences]

    # Matndagi jami so'zlar soni (qamrov foizini hisoblash uchun)
    total_words = len(re.findall(r"\w+", text, flags=re.UNICODE))

    results = []
    for unit in units:
        pattern = birlik_pattern(unit.birlik)
        matches = re.findall(pattern, norm_text)
        count = len(matches)

        if count == 0:
            continue

        # Birlik uchragan birinchi gapni (foydalanuvchi matnidagi) kontekst olamiz.
        context = ""
        for orig, norm in zip(sentences, norm_sentences):
            if re.search(pattern, norm):
                context = orig.strip()
                break

        results.append(
            {
                "id": unit.id,
                "birlik": unit.birlik,
                "tarjima": unit.tarjima,
                "izoh": unit.izoh,
                "strategiya": unit.strategiya,
                "kategoriya": unit.kategoriya,
                "soni": count,                       # foydalanuvchi matnida necha marta
                "kontekst": context,                 # foydalanuvchi matnidagi gap
                "asarda_bor": asarda_bormi(unit.birlik, unit.tarjima),  # asarlarda uchraydimi
            }
        )

    # Eng ko'p uchragan birliklar tepada turadi.
    results.sort(key=lambda r: r["soni"], reverse=True)

    total_found = sum(r["soni"] for r in results)

    return {
        "results": results,
        "statistika": {
            "jami_sozlar": total_words,
            "topilgan_birliklar": len(results),
            "jami_uchrashlar": total_found,
            "qamrov_foizi": round((total_found / total_words * 100), 2) if total_words else 0,
        },
        "grafik": [{"nom": r["birlik"], "soni": r["soni"]} for r in results],
    }
