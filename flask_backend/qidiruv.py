"""Lingvomadaniy birliklarni matndan aniqlash uchun umumiy qidiruv mantiqi.

O'zbek tilida qo'shimchalar so'z oxiriga qo'shiladi. Bizga FAQAT grammatik
(kelishik / egalik / ko'plik) qo'shimchalar bilan kelgan shakllar kerak.
So'z yasovchi qo'shimchalar (-chi, -lik, -dosh ...) YANGI so'z hosil qiladi,
shuning uchun ular topilmasligi kerak.

Masalan:
    "samovar" -> samovar, samovarga, samovarda, samovarni, samovarlar  ✓
    "samovar" -> samovarchi (kasb), samovarsoz                          ✗
"""
import re

# O'zbek tilidagi turli apostrof/tutuq belgilari bir ko'rinishga keltiriladi.
_APOSTROPHES = ["ʻ", "ʼ", "'", "`", "´", "‘", "’"]

# Grammatik qo'shimchalar (eng uzunidan qisqasiga — regex ochko'zligi uchun).
# Bular birlikdan keyin kelsa ham AYNAN o'sha so'z hisoblanadi.
_SUFFIXES = [
    # egalik + kelishik birikmalari
    "larimizning", "laringizning", "larining",
    "larimizni", "laringizni", "larini",
    "larimizga", "laringizga", "lariga",
    "larimizda", "laringizda", "larida",
    "larimizdan", "laringizdan", "laridan",
    "larimiz", "laringiz", "lari",
    "imizning", "ingizning", "sining", "ining",
    "imizni", "ingizni", "sini", "ini",
    "imizga", "ingizga", "siga", "iga",
    "imizda", "ingizda", "sida", "ida",
    "imizdan", "ingizdan", "sidan", "idan",
    # ko'plik
    "larning", "larni", "larga", "larda", "lardan", "lar",
    # kelishik
    "ning", "ni", "ga", "ka", "qa", "da", "dan", "gacha",
    # egalik (yakka)
    "imiz", "ingiz", "im", "ing", "si", "i",
    # joy/holat
    "day", "dek", "cha",
]

# Eng uzun qo'shimcha birinchi tekshirilishi uchun saralaymiz.
_SUFFIXES.sort(key=len, reverse=True)
_SUFFIX_ALT = "|".join(re.escape(s) for s in _SUFFIXES)


def normalize(text: str) -> str:
    """Matnni qidiruv uchun birxil ko'rinishga keltiradi."""
    text = text.lower()
    for ap in _APOSTROPHES:
        text = text.replace(ap, "'")
    return text


def birlik_pattern(birlik: str) -> str:
    """Birlik uchun regex naqsh (normallashtirilgan matnda qidirish uchun).

    Birlik + ixtiyoriy grammatik qo'shimcha(lar), so'z chegarasida.
    So'z yasovchilar (-chi, -lik ...) bilan davom etsa MOS KELMAYDI.
    """
    key = normalize(birlik)
    # Ko'p so'zli birlik (masalan "qala kavush") — so'zlar orasidagi
    # bo'shliqni moslashuvchan qilamiz.
    key_re = r"\s+".join(re.escape(w) for w in key.split())
    # birlik(+qo'shimcha)? va undan keyin harf-raqam KELMASLIGI shart.
    return r"\b" + key_re + r"(?:" + _SUFFIX_ALT + r")?(?![\w'])"


def topilgan_sonlar(birlik: str, norm_text: str):
    """Birlik normallashtirilgan matnda necha marta uchraganini qaytaradi."""
    return re.findall(birlik_pattern(birlik), norm_text)


def tarjima_asosiy_soz(tarjima: str) -> str:
    """Inglizcha tarjimadan asosiy (qidiriladigan) so'zni ajratadi.

    Tarjima ko'pincha murakkab bo'ladi:
        "Pilaf (palov)"            -> "pilaf"
        "dastarkhan / tablecloth"  -> "dastarkhan"
        "community elder"          -> "community elder" (ko'p so'zli qoladi)
    Qavs ichidagi izoh va '/' dan keyingi muqobil tashlab yuboriladi.
    """
    s = tarjima.strip()
    # qavs ichidagi izohni olib tashlaymiz
    s = re.sub(r"\([^)]*\)", "", s)
    # '/' bo'lsa, birinchi muqobilni olamiz
    s = s.split("/")[0]
    return s.strip()


def inglizcha_pattern(tarjima: str) -> str:
    """Inglizcha asar matnida tarjimani topish uchun regex (so'z chegarasi).

    O'zbekcha qo'shimchalar shart emas — ingliz tilida so'z o'zgarmaydi,
    faqat ko'plik 's' ni hisobga olamiz.
    """
    soz = tarjima_asosiy_soz(tarjima).lower()
    words = soz.split()
    if not words:
        return r"(?!x)x"  # hech narsaga mos kelmaydigan naqsh
    esc = r"\s+".join(re.escape(w) for w in words)
    return r"\b" + esc + r"s?\b"
