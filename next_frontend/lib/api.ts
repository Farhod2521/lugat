// Backend (Flask) bilan bog'lanish uchun yagona qatlam.

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export interface LingvoResult {
  id: number;
  birlik: string;
  tarjima: string;
  izoh: string;
  strategiya: string;
  kategoriya: string;
  soni: number;
  kontekst: string;
  asarda_bor: boolean;
}

export interface Statistika {
  jami_sozlar: number;
  topilgan_birliklar: number;
  jami_uchrashlar: number;
  qamrov_foizi: number;
}

export interface GrafikPoint {
  nom: string;
  soni: number;
}

export interface AnalyzeResponse {
  results: LingvoResult[];
  statistika: Statistika;
  grafik: GrafikPoint[];
}

export interface LingvoUnit {
  id: number;
  birlik: string;
  tarjima: string;
  izoh: string;
  strategiya: string;
  kategoriya: string;
}

export async function analyzeText(text: string): Promise<AnalyzeResponse> {
  const res = await fetch(`${API_URL}/api/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.xato || "Tahlil amalga oshmadi.");
  }
  return res.json();
}

export async function fetchUnits(): Promise<{ jami: number; units: LingvoUnit[] }> {
  const res = await fetch(`${API_URL}/api/units`);
  if (!res.ok) throw new Error("Lug'atni yuklab bo'lmadi.");
  return res.json();
}

// Dashboard CRUD uchun — qo'shiladigan/tahrirlanadigan maydonlar.
export interface UnitInput {
  birlik: string;
  tarjima: string;
  strategiya: string;
}

export async function createUnit(data: UnitInput): Promise<LingvoUnit> {
  const res = await fetch(`${API_URL}/api/units`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.xato || "Qo'shib bo'lmadi.");
  }
  return res.json();
}

export async function updateUnit(id: number, data: UnitInput): Promise<LingvoUnit> {
  const res = await fetch(`${API_URL}/api/units/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.xato || "Tahrirlab bo'lmadi.");
  }
  return res.json();
}

export async function deleteUnit(id: number): Promise<void> {
  const res = await fetch(`${API_URL}/api/units/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.xato || "O'chirib bo'lmadi.");
  }
}

export interface AsarTomon {
  nom: string;
  html: string;
}

export async function fetchAsar(): Promise<{ uz: AsarTomon; en: AsarTomon }> {
  const res = await fetch(`${API_URL}/api/asar`);
  if (!res.ok) throw new Error("Asarni yuklab bo'lmadi.");
  return res.json();
}
