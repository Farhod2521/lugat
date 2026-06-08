"""Ma'lumotlar bazasi modellari."""
from datetime import datetime

from database import db


class LingvoUnit(db.Model):
    """Lingvomadaniy birlik — milliy-madaniy o'ziga xos so'z/ibora.

    Masalan: "Mahalla", "Hashar", "Navro'z" va h.k.
    """

    __tablename__ = "lingvo_units"

    id = db.Column(db.Integer, primary_key=True)
    birlik = db.Column(db.String(200), nullable=False, unique=True, index=True)
    tarjima = db.Column(db.String(300), nullable=False)          # inglizcha tarjima
    izoh = db.Column(db.Text, nullable=False, default="")        # o'zbekcha izoh (ixtiyoriy)
    strategiya = db.Column(db.String(100), nullable=False, default="Functional equivalent")  # tarjima strategiyasi
    kategoriya = db.Column(db.String(100), nullable=False, default="Umumiy")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "birlik": self.birlik,
            "tarjima": self.tarjima,
            "izoh": self.izoh,
            "strategiya": self.strategiya,
            "kategoriya": self.kategoriya,
        }


class AnalysisHistory(db.Model):
    """Foydalanuvchi yuborgan tahlillar tarixi (statistika uchun)."""

    __tablename__ = "analysis_history"

    id = db.Column(db.Integer, primary_key=True)
    text_preview = db.Column(db.String(500))
    total_words = db.Column(db.Integer, default=0)
    found_count = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "text_preview": self.text_preview,
            "total_words": self.total_words,
            "found_count": self.found_count,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
