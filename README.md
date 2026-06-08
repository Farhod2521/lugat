# Lingvomadaniy Birliklar Tahlil Tizimi

Matndagi **lingvomadaniy birliklarni** (milliy-madaniy o'ziga xos so'z va iboralarni)
avtomatik aniqlaydigan, tarjimasi va izohi bilan taqqoslab, natijani **jadval va grafik**
ko'rinishida chiqaradigan veb-tizim.

> O'zbek tili uchun: `Mahalla`, `Hashar`, `Navro'z`, `Osh`, `Do'ppi` kabi birliklar bazada
> saqlanadi va matn ichidan aniqlanadi.

---

## Texnologiyalar

| Qatlam      | Texnologiya                          |
| ----------- | ------------------------------------ |
| Frontend    | Next.js 16 + React 19 + Tailwind v4  |
| Backend     | Python 3.12 + Flask + SQLAlchemy     |
| Baza        | PostgreSQL 16 (Docker) / SQLite      |
| Konteyner   | Docker + docker-compose              |

---

## Loyiha tuzilishi

```
LUGAT/
├── docker-compose.yml         # Hammasini bitta buyruq bilan ishga tushiradi
├── flask_backend/             # Flask REST API
│   ├── app.py                 # Endpointlar
│   ├── analyzer.py            # Matn tahlil qilish algoritmi (asosiy mantiq)
│   ├── models.py              # Baza modellari
│   ├── seed.py                # Boshlang'ich lug'at (30+ birlik)
│   ├── database.py / config.py
│   └── Dockerfile
└── next_frontend/             # Next.js interfeys
    ├── app/page.tsx           # Asosiy oyna (matn + jadval + grafik)
    ├── components/BarChart.tsx
    ├── lib/api.ts             # Backend bilan bog'lanish
    └── Dockerfile
```

---

## 1-usul: Docker bilan ishga tushirish (tavsiya etiladi)

Bitta buyruq bilan PostgreSQL + Backend + Frontend ko'tariladi:

```bash
docker compose up --build
```

So'ngra brauzerda oching:

- **Frontend (interfeys):** http://localhost:3000
- **Backend (API):** http://localhost:5000/api/health

To'xtatish:

```bash
docker compose down          # konteynerlarni o'chiradi
docker compose down -v       # baza ma'lumotlarini ham o'chiradi
```

---

## 2-usul: Lokal ishlab chiqish (Docker'siz)

### Backend (Flask + SQLite)

```bash
cd flask_backend
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux/Mac:
# source venv/bin/activate

pip install -r requirements.txt
python app.py
```

> DATABASE_URL berilmasa, avtomatik `sqlite:///lingvo.db` ishlatiladi.

### Frontend (Next.js)

```bash
cd next_frontend
npm install
copy .env.local.example .env.local   # NEXT_PUBLIC_API_URL=http://localhost:5000
npm run dev
```

http://localhost:3000 ni oching.

---

## API endpointlar

| Metod  | Manzil           | Tavsif                                       |
| ------ | ---------------- | -------------------------------------------- |
| `GET`  | `/api/health`    | Tizim holati                                 |
| `GET`  | `/api/units`     | Barcha lingvomadaniy birliklar (lug'at)      |
| `POST` | `/api/units`     | Yangi birlik qo'shish                        |
| `POST` | `/api/analyze`   | **Matnni tahlil qilish (asosiy funksiya)**   |
| `GET`  | `/api/history`   | So'nggi tahlillar tarixi                     |

### `/api/analyze` namuna so'rovi

```json
POST /api/analyze
{ "text": "Navro'z bayramida mahalla ahli hashar uyushtirdi." }
```

### Javob

```json
{
  "results": [
    {
      "birlik": "Hashar",
      "tarjima": "Community voluntary work",
      "izoh": "Jamoa bo'lib bajariladigan jamoaviy mehnat.",
      "kategoriya": "Urf-odat",
      "soni": 1,
      "kontekst": "Navro'z bayramida mahalla ahli hashar uyushtirdi."
    }
  ],
  "statistika": {
    "jami_sozlar": 6,
    "topilgan_birliklar": 3,
    "jami_uchrashlar": 3,
    "qamrov_foizi": 50.0
  },
  "grafik": [{ "nom": "Hashar", "soni": 1 }]
}
```

---

## Ishlash tartibi

1. Foydalanuvchi matn yozadi.
2. Backend matnni normallashtiradi (o'zbekcha apostrof variantlari birxillashtiriladi).
3. Bazadagi har bir birlik matn ichidan grammatik qo'shimchalari bilan qidiriladi.
4. Topilgan birliklar — tarjimasi, strategiyasi va asardagi konteksti bilan qaytariladi.
5. "Ko'rish" bosilganda «Shum bola» (o'zbekcha) va «A naughty Boy» (inglizcha)
   asarlari yonma-yon ochiladi, birlik belgilanadi.

---

## Production deploy

**Arxitektura:** Backend — o'z serveringizda (Docker), Frontend — Vercel'da.

### A) Backend (server: 185.74.5.15, domen: lugat.testyarat.uz, port 5000)

```bash
# 1. Serverga ulanib, loyihani klon qiling
git clone https://github.com/<foydalanuvchi>/<repo>.git
cd <repo>

# 2. Muhit faylini tayyorlang
cp .env.prod.example .env.prod
nano .env.prod        # POSTGRES_PASSWORD ni o'zgartiring,
                      # CORS_ORIGINS ga Vercel URL'ingizni qo'ying

# 3. Faqat DB + backend ni ko'taring
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build

# 4. Tekshiring
curl http://localhost:5000/api/health
```

**Domen + HTTPS (tavsiya):** port 5000 ni to'g'ridan-to'g'ri ochish o'rniga,
oldiga Nginx qo'yib, `lugat.testyarat.uz` ni 5000-portga yo'naltiring va
Let's Encrypt (certbot) bilan HTTPS oching. Namuna Nginx bloki:

```nginx
server {
    server_name lugat.testyarat.uz;
    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

```bash
sudo certbot --nginx -d lugat.testyarat.uz
```

> DNS: `lugat.testyarat.uz` A-yozuvini `185.74.5.15` ga yo'naltiring.

### B) Frontend (Vercel)

1. [vercel.com](https://vercel.com) → **Add New → Project** → GitHub repo'ni tanlang.
2. **Root Directory** = `next_frontend` (Vercel "Edit" tugmasi orqali tanlanadi).
3. **Environment Variables** qo'shing:
   - `NEXT_PUBLIC_API_URL` = `https://lugat.testyarat.uz`
4. **Deploy** bosing.

> Vercel deploy qilgach, sizga `https://<app>.vercel.app` URL beradi.
> O'sha URL ni serverdagi `.env.prod` ichidagi `CORS_ORIGINS` ga qo'shing va
> backendni qayta ishga tushiring:
> `docker compose -f docker-compose.prod.yml --env-file .env.prod up -d`

### Manba hujjatlarni qayta ishlash (kerak bo'lsa)

Asar/lug'at fayllari yangilansa, generatsiya skriptlarini ishga tushiring:

```bash
python parse_docx.py        # birlik.docx  -> flask_backend/units.json
python parse_shumbola.py    # Shum bola.docx -> flask_backend/shumbola.html
python parse_naughty.py     # NAUGHTY BOY WORD.docx -> flask_backend/naughtyboy.html
```

So'ng backendni qayta build qiling.
