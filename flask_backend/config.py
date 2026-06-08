"""Ilova konfiguratsiyasi.

PostgreSQL (Docker) yoki SQLite (lokal ishlab chiqish) bilan ishlaydi.
DATABASE_URL muhit o'zgaruvchisi orqali boshqariladi.
"""
import os

from dotenv import load_dotenv

load_dotenv()


class Config:
    # Agar DATABASE_URL berilmasa, lokal SQLite faylga tushib qoladi.
    # Docker ichida docker-compose orqali PostgreSQL URL beriladi.
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL",
        "sqlite:///lingvo.db",
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JSON_AS_ASCII = False  # O'zbekcha (kirill/lotin) belgilar uchun
