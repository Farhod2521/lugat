// Birlikni matn ichida grammatik qo'shimchalari bilan topib, sariq ajratish.
// Mantiq backend `qidiruv.py` bilan bir xil: so'z yasovchilar (-chi, -lik)
// emas, faqat kelishik/egalik/ko'plik qo'shimchalari mos keladi.

import React from "react";

const APOS = ["ʻ", "ʼ", "'", "`", "´", "‘", "’"];

// qidiruv.py dagi _SUFFIXES bilan bir xil (uzunidan qisqasiga).
const SUFFIXES = [
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
  "larning", "larni", "larga", "larda", "lardan", "lar",
  "ning", "ni", "ga", "ka", "qa", "da", "dan", "gacha",
  "imiz", "ingiz", "im", "ing", "si", "i",
  "day", "dek", "cha",
].sort((a, b) => b.length - a.length);

function normalizeApos(s: string): string {
  let out = s;
  for (const a of APOS) out = out.split(a).join("'");
  return out;
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// O'zbekcha birlik regex: birlik + ixtiyoriy grammatik qo'shimcha,
// keyin harf/apostrof KELMASLIGI shart (so'z yasovchini chiqarib tashlash).
export function birlikRegex(birlik: string): RegExp {
  const key = normalizeApos(birlik.toLowerCase());
  const keyRe = key.split(/\s+/).map(escapeRe).join("\\s+");
  const suf = SUFFIXES.map(escapeRe).join("|");
  return new RegExp(`(\\b${keyRe}(?:${suf})?)(?![\\p{L}'])`, "giu");
}

// Inglizcha tarjima regex: tarjimaning asosiy so'zi (qavs/'/' tashlab),
// ixtiyoriy ko'plik 's' bilan. Backend `inglizcha_pattern` bilan mos.
export function tarjimaRegex(tarjima: string): RegExp {
  let s = tarjima.replace(/\([^)]*\)/g, ""); // qavs ichini olib tashlash
  s = s.split("/")[0].trim().toLowerCase();  // birinchi muqobil
  const words = s.split(/\s+/).filter(Boolean).map(escapeRe);
  if (words.length === 0) return /(?!x)x/g;  // hech narsaga mos kelmaydi
  return new RegExp(`(\\b${words.join("\\s+")}s?\\b)`, "giu");
}

// Bitta gap ichida moslikni sariq bilan ajratadi.
function markWords(sentence: string, re: RegExp): React.ReactNode {
  const parts = sentence.split(re);
  return parts.map((p, i) =>
    i % 2 === 1 ? (
      <mark key={i} className="rounded bg-yellow-300 px-0.5 font-semibold text-black">
        {p}
      </mark>
    ) : (
      <React.Fragment key={i}>{p}</React.Fragment>
    )
  );
}

// Paragraf matnini gaplarga ajratib, MOSLIK uchragan gapni HAVO RANG fonda,
// ichidagi so'zni esa SARIQ bilan ajratadi. Birinchi moslik gapiga ref
// biriktiriladi (modal scroll qilishi uchun).
//
// reFactory — har bir matn uchun yangi regex qaytaruvchi funksiya
// (global regex `lastIndex` holatini qayta ishlatmaslik uchun).
export function highlightText(
  text: string,
  reFactory: () => RegExp,
  firstRef?: React.RefObject<HTMLElement | null>
): React.ReactNode {
  if (!text) return text;

  // Matnni gaplarga ajratamiz — ajratuvchi belgilarni saqlab qolamiz.
  const sentences = text.split(/(?<=[.!?…])\s+/);
  let firstUsed = false;

  return sentences.map((s, i) => {
    const testRe = reFactory();
    const hasMatch = testRe.test(s);
    const sep = i < sentences.length - 1 ? " " : "";

    if (hasMatch) {
      const isFirst = !firstUsed && !!firstRef;
      firstUsed = true;
      return (
        <span
          key={i}
          ref={isFirst ? (firstRef as React.RefObject<HTMLElement>) : undefined}
          className="rounded bg-sky-200/70 px-1 py-0.5 box-decoration-clone"
        >
          {markWords(s, reFactory())}
          {sep}
        </span>
      );
    }
    return (
      <React.Fragment key={i}>
        {s}
        {sep}
      </React.Fragment>
    );
  });
}
