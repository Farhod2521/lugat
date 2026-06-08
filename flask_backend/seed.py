"""Boshlang'ich lingvomadaniy birliklar lug'ati.

Birliklar `units.json` faylidan o'qiladi (birlik.docx dan generatsiya qilingan).
Baza bo'sh bo'lsa, app ishga tushganda avtomatik to'ldiriladi.

JSON ni qayta yaratish uchun (loyiha ildizida):
    python parse_docx.py
"""
import json
import os

from database import db
from models import LingvoUnit

UNITS_JSON = os.path.join(os.path.dirname(__file__), "units.json")


def _load_units():
    """units.json dan birliklar ro'yxatini o'qiydi."""
    with open(UNITS_JSON, encoding="utf-8") as f:
        return json.load(f)


def seed_database():
    """Baza bo'sh bo'lsa, units.json dagi birliklarni qo'shadi."""
    if LingvoUnit.query.first() is not None:
        return 0  # allaqachon to'ldirilgan

    units = _load_units()
    for u in units:
        db.session.add(
            LingvoUnit(
                birlik=u["birlik"],
                tarjima=u["tarjima"],
                izoh=u.get("izoh", ""),
                strategiya=u.get("strategiya", "Functional equivalent"),
                kategoriya=u.get("kategoriya", "Umumiy"),
            )
        )
    db.session.commit()
    return len(units)
