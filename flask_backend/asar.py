"""Asar matnlari bilan ishlash moduli (o'zbekcha + inglizcha).

  - O'zbekcha:  shumbola.html   ("Shum bola")
  - Inglizcha:  naughtyboy.html ("A naughty Boy")

Asarlar stilli HTML ko'rinishda saqlanadi. Birlikni sariq bilan ajratish va
gapni havo rang qilish frontendda, modal ochilganda bajariladi.

Bu yerda faqat:
  - asar HTML matnlarini berish (get_asarlar)
  - birlik o'zbekchada / tarjima inglizchada uchraydimi (asarda_bormi)
"""
import os
import re

from qidiruv import birlik_pattern, inglizcha_pattern, normalize

_DIR = os.path.dirname(__file__)
UZ_PATH = os.path.join(_DIR, "shumbola.html")
EN_PATH = os.path.join(_DIR, "naughtyboy.html")


def _read(path: str) -> str:
    try:
        with open(path, encoding="utf-8") as f:
            return f.read()
    except FileNotFoundError:
        return ""


_UZ_HTML = _read(UZ_PATH)
_EN_HTML = _read(EN_PATH)
_UZ_NORM = normalize(_UZ_HTML)
_EN_NORM = _EN_HTML.lower()


def get_asarlar() -> dict:
    """Ikkala asar HTML matnini qaytaradi."""
    return {
        "uz": {"nom": "Shum bola", "html": _UZ_HTML},
        "en": {"nom": "A naughty Boy", "html": _EN_HTML},
    }


def asarda_bormi(birlik: str, tarjima: str) -> bool:
    """Birlik o'zbekcha ASARDA yoki tarjima inglizcha asarda uchraydimi.

    Modal ochilishi uchun kamida bittasida topilsa yetarli.
    """
    uz = bool(_UZ_NORM and re.search(birlik_pattern(birlik), _UZ_NORM))
    en = bool(_EN_NORM and re.search(inglizcha_pattern(tarjima), _EN_NORM))
    return uz or en
