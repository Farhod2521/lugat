"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  X,
  Loader2,
  LogOut,
  TriangleAlert,
} from "lucide-react";
import {
  fetchUnits,
  createUnit,
  updateUnit,
  deleteUnit,
  LingvoUnit,
  UnitInput,
} from "@/lib/api";

const KOD = "1212"; // kirish kodi
const KEY = "lugat_admin_ok"; // sessiyada saqlash kaliti

export default function Dashboard() {
  const [authed, setAuthed] = useState(false);
  const [tekshir, setTekshir] = useState(false);

  // Sahifa ochilganda — sessiyada ruxsat bormi.
  useEffect(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem(KEY) === "1") {
      setAuthed(true);
    }
    setTekshir(true);
  }, []);

  if (!tekshir) return null;
  if (!authed) return <Login onOk={() => setAuthed(true)} />;
  return <Panel onLogout={() => setAuthed(false)} />;
}

/* ===================== LOGIN (4 katakli kod) ===================== */
function Login({ onOk }: { onOk: () => void }) {
  const [digits, setDigits] = useState(["", "", "", ""]);
  const [error, setError] = useState("");
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    refs.current[0]?.focus();
  }, []);

  function setAt(i: number, val: string) {
    const v = val.replace(/\D/g, "").slice(-1); // faqat oxirgi raqam
    const next = [...digits];
    next[i] = v;
    setDigits(next);
    setError("");
    if (v && i < 3) refs.current[i + 1]?.focus();
    // To'liq kiritilganda tekshiramiz.
    if (next.every((d) => d !== "")) tekshir(next.join(""));
  }

  function tekshir(code: string) {
    if (code === KOD) {
      sessionStorage.setItem(KEY, "1");
      onOk();
    } else {
      setError("Kod noto'g'ri.");
      setDigits(["", "", "", ""]);
      refs.current[0]?.focus();
    }
  }

  function onKey(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      refs.current[i - 1]?.focus();
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4">
      <div className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-white p-8 card-shadow">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-sky-500 text-lg font-black text-white shadow-md">
            LM
          </div>
          <h1 className="text-lg font-semibold text-[var(--ink)]">Admin panel</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">Kirish kodini kiriting</p>
        </div>

        <div className="flex justify-center gap-3" dir="ltr">
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => {
                refs.current[i] = el;
              }}
              type="password"
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={(e) => setAt(i, e.target.value)}
              onKeyDown={(e) => onKey(i, e)}
              className="h-16 w-14 rounded-xl border-2 border-[var(--border)] bg-[var(--surface-2)] text-center text-2xl font-bold text-[var(--ink)] outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
            />
          ))}
        </div>

        {error && (
          <p className="mt-4 flex items-center justify-center gap-2 text-sm text-red-600">
            <TriangleAlert className="h-4 w-4" /> {error}
          </p>
        )}
      </div>
    </div>
  );
}

/* ===================== PANEL (table + CRUD) ===================== */
function Panel({ onLogout }: { onLogout: () => void }) {
  const [units, setUnits] = useState<LingvoUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [modal, setModal] = useState<{ mode: "add" | "edit"; unit?: LingvoUnit } | null>(null);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const r = await fetchUnits();
      setUnits(r.units);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Xatolik");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  // Jonli qidiruv — birlik yoki tarjima bo'yicha.
  const shown = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return units;
    return units.filter(
      (u) =>
        u.birlik.toLowerCase().includes(s) ||
        u.tarjima.toLowerCase().includes(s) ||
        u.strategiya.toLowerCase().includes(s)
    );
  }, [units, q]);

  async function handleDelete(u: LingvoUnit) {
    if (!confirm(`"${u.birlik}" o'chirilsinmi?`)) return;
    try {
      await deleteUnit(u.id);
      setUnits((prev) => prev.filter((x) => x.id !== u.id));
    } catch (e) {
      alert(e instanceof Error ? e.message : "O'chirib bo'lmadi");
    }
  }

  function logout() {
    sessionStorage.removeItem(KEY);
    onLogout();
  }

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--ink)]">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-[var(--border)] bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-6 py-3.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-sky-500 text-sm font-black text-white">
            LM
          </div>
          <div>
            <h1 className="text-[15px] font-semibold">Admin panel — Lug&apos;at</h1>
            <p className="text-xs text-[var(--muted)]">Birliklarni boshqarish</p>
          </div>
          <button
            onClick={logout}
            className="ml-auto flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-white px-3 py-1.5 text-xs text-[var(--ink-soft)] transition hover:border-red-300 hover:text-red-600"
          >
            <LogOut className="h-3.5 w-3.5" /> Chiqish
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-6">
        {/* Qidiruv + qo'shish */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Qidirish… (bitta harf yozing)"
              className="w-full rounded-xl border border-[var(--border)] bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/15"
            />
          </div>
          <button
            onClick={() => setModal({ mode: "add" })}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-sky-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-600/25 transition hover:from-blue-500 hover:to-sky-400"
          >
            <Plus className="h-4 w-4" /> Qo&apos;shish
          </button>
        </div>

        {/* Jadval */}
        <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white card-shadow">
          <div className="flex items-center gap-2 border-b border-[var(--border)] px-5 py-3 text-sm">
            <span className="font-semibold">Birliklar</span>
            <span className="rounded-full bg-[var(--accent-soft)] px-2 py-0.5 text-xs font-medium text-[var(--accent)]">
              {shown.length} ta
            </span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-[var(--muted)]">
              <Loader2 className="h-4 w-4 animate-spin" /> Yuklanmoqda…
            </div>
          ) : error ? (
            <p className="py-16 text-center text-sm text-red-600">{error}</p>
          ) : shown.length === 0 ? (
            <p className="py-16 text-center text-sm text-[var(--muted)]">
              Hech narsa topilmadi.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--surface-2)] text-xs uppercase tracking-wider text-[var(--muted)]">
                    <th className="px-4 py-3 font-medium">#</th>
                    <th className="px-4 py-3 font-medium">O&apos;zbekcha birlik</th>
                    <th className="px-4 py-3 font-medium">Inglizcha tarjima</th>
                    <th className="px-4 py-3 font-medium">Tarjima strategiyasi</th>
                    <th className="px-4 py-3 text-right font-medium">Amal</th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map((u, i) => (
                    <tr
                      key={u.id}
                      className="border-b border-[var(--border)] transition last:border-0 hover:bg-[var(--surface-2)]"
                    >
                      <td className="px-4 py-3 text-xs text-[var(--muted)]">{i + 1}</td>
                      <td className="px-4 py-3 font-semibold">{u.birlik}</td>
                      <td className="px-4 py-3">{u.tarjima}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-2 py-0.5 text-xs text-[var(--ink-soft)]">
                          {u.strategiya}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setModal({ mode: "edit", unit: u })}
                            title="Tahrirlash"
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] text-[var(--ink-soft)] transition hover:border-blue-400 hover:text-[var(--accent)]"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(u)}
                            title="O'chirish"
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] text-[var(--ink-soft)] transition hover:border-red-400 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {modal && (
        <UnitModal
          mode={modal.mode}
          unit={modal.unit}
          onClose={() => setModal(null)}
          onSaved={(saved) => {
            setUnits((prev) => {
              const exists = prev.some((x) => x.id === saved.id);
              const next = exists
                ? prev.map((x) => (x.id === saved.id ? saved : x))
                : [...prev, saved];
              return next.sort((a, b) => a.birlik.localeCompare(b.birlik));
            });
            setModal(null);
          }}
        />
      )}
    </div>
  );
}

/* ===================== MODAL (qo'shish / tahrirlash) ===================== */
function UnitModal({
  mode,
  unit,
  onClose,
  onSaved,
}: {
  mode: "add" | "edit";
  unit?: LingvoUnit;
  onClose: () => void;
  onSaved: (u: LingvoUnit) => void;
}) {
  const [form, setForm] = useState<UnitInput>({
    birlik: unit?.birlik || "",
    tarjima: unit?.tarjima || "",
    strategiya: unit?.strategiya || "Functional equivalent",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    if (!form.birlik.trim() || !form.tarjima.trim()) {
      setError("O'zbekcha birlik va inglizcha tarjima majburiy.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const saved =
        mode === "add"
          ? await createUnit(form)
          : await updateUnit(unit!.id, form);
      onSaved(saved);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Saqlab bo'lmadi.");
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center border-b border-[var(--border)] px-5 py-4">
          <h3 className="text-base font-semibold text-[var(--ink)]">
            {mode === "add" ? "Yangi birlik qo'shish" : "Birlikni tahrirlash"}
          </h3>
          <button
            onClick={onClose}
            className="ml-auto flex h-8 w-8 items-center justify-center rounded-lg text-[var(--ink-soft)] transition hover:bg-[var(--surface-2)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-5">
          <Field
            label="O'zbekcha birlik"
            value={form.birlik}
            onChange={(v) => setForm({ ...form, birlik: v })}
            placeholder="masalan: choyxona"
          />
          <Field
            label="Inglizcha tarjima"
            value={form.tarjima}
            onChange={(v) => setForm({ ...form, tarjima: v })}
            placeholder="masalan: teahouse"
          />
          <Field
            label="Tarjima strategiyasi"
            value={form.strategiya}
            onChange={(v) => setForm({ ...form, strategiya: v })}
            placeholder="masalan: Functional equivalent"
          />

          {error && (
            <p className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
              <TriangleAlert className="h-4 w-4 shrink-0" /> {error}
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-[var(--border)] px-5 py-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-[var(--border)] bg-white px-4 py-2 text-sm text-[var(--ink-soft)] transition hover:bg-[var(--surface-2)]"
          >
            Bekor qilish
          </button>
          <button
            onClick={submit}
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-sky-500 px-4 py-2 text-sm font-semibold text-white transition hover:from-blue-500 hover:to-sky-400 disabled:opacity-60"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Saqlash
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-[var(--ink-soft)]">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2.5 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-500/15"
      />
    </label>
  );
}
