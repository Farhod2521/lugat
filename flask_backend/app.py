"""Flask ilovasi — REST API.

Endpointlar:
    GET  /api/health            -> holat tekshiruvi
    GET  /api/units             -> barcha lingvomadaniy birliklar (lug'at)
    POST /api/units             -> yangi birlik qo'shish
    POST /api/analyze           -> matnni tahlil qilish (asosiy funksiya)
    GET  /api/history           -> tahlillar tarixi
"""
import time

from flask import Flask, jsonify, request
from flask_cors import CORS
from sqlalchemy.exc import OperationalError

from analyzer import analyze_text
from config import Config
from database import db
from models import AnalysisHistory, LingvoUnit
from seed import seed_database


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    app.config["JSON_AS_ASCII"] = False

    # CORS — qaysi frontend manzillariga ruxsat berilishi.
    # CORS_ORIGINS muhit o'zgaruvchisida vergul bilan ajratilgan ro'yxat.
    # Berilmasa (lokal ishlab chiqish) — hamma joyga ruxsat.
    import os

    origins_env = os.getenv("CORS_ORIGINS", "*").strip()
    origins = "*" if origins_env == "*" else [o.strip() for o in origins_env.split(",") if o.strip()]
    CORS(app, resources={r"/api/*": {"origins": origins}})
    db.init_app(app)

    with app.app_context():
        _init_db_with_retry(app)

    register_routes(app)
    return app


def _init_db_with_retry(app, retries=10, delay=3):
    """PostgreSQL Docker konteyneri ko'tarilguncha kutadi."""
    for attempt in range(1, retries + 1):
        try:
            db.create_all()
            count = seed_database()
            if count:
                app.logger.info("Bazaga %d ta birlik qo'shildi.", count)
            return
        except OperationalError:
            app.logger.warning("Bazaga ulanib bo'lmadi (%d/%d). Qayta urinish...", attempt, retries)
            time.sleep(delay)
    raise RuntimeError("Ma'lumotlar bazasiga ulanib bo'lmadi.")


def register_routes(app):
    @app.get("/api/health")
    def health():
        return jsonify({"status": "ok", "service": "lingvo-backend"})

    @app.get("/api/asar")
    def asar():
        """Asarlarning to'liq HTML matni — o'zbekcha + inglizcha (modal uchun)."""
        from asar import get_asarlar

        return jsonify(get_asarlar())

    @app.get("/api/units")
    def get_units():
        """Barcha lingvomadaniy birliklar lug'ati."""
        units = LingvoUnit.query.order_by(LingvoUnit.birlik).all()
        return jsonify(
            {
                "jami": len(units),
                "units": [u.to_dict() for u in units],
            }
        )

    @app.post("/api/units")
    def add_unit():
        """Yangi birlik qo'shish."""
        data = request.get_json(silent=True) or {}
        birlik = (data.get("birlik") or "").strip()
        tarjima = (data.get("tarjima") or "").strip()
        izoh = (data.get("izoh") or "").strip()
        strategiya = (data.get("strategiya") or "Functional equivalent").strip()
        kategoriya = (data.get("kategoriya") or "Umumiy").strip()

        if not birlik or not tarjima or not izoh:
            return jsonify({"xato": "birlik, tarjima va izoh majburiy."}), 400

        if LingvoUnit.query.filter_by(birlik=birlik).first():
            return jsonify({"xato": "Bunday birlik allaqachon mavjud."}), 409

        unit = LingvoUnit(birlik=birlik, tarjima=tarjima, izoh=izoh, strategiya=strategiya, kategoriya=kategoriya)
        db.session.add(unit)
        db.session.commit()
        return jsonify(unit.to_dict()), 201

    @app.post("/api/analyze")
    def analyze():
        """Asosiy funksiya: matnni tahlil qilib, birliklarni aniqlaydi."""
        data = request.get_json(silent=True) or {}
        text = (data.get("text") or "").strip()

        if not text:
            return jsonify({"xato": "Tahlil uchun matn yuboring."}), 400

        units = LingvoUnit.query.all()
        analysis = analyze_text(text, units)

        # Tahlilni tarixga yozamiz
        history = AnalysisHistory(
            text_preview=text[:500],
            total_words=analysis["statistika"]["jami_sozlar"],
            found_count=analysis["statistika"]["topilgan_birliklar"],
        )
        db.session.add(history)
        db.session.commit()

        return jsonify(analysis)

    @app.get("/api/history")
    def history():
        rows = (
            AnalysisHistory.query.order_by(AnalysisHistory.created_at.desc())
            .limit(20)
            .all()
        )
        return jsonify({"history": [r.to_dict() for r in rows]})


app = create_app()


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
