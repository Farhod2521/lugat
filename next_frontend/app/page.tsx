"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Download,
  Sparkles,
  TriangleAlert,
  FileText,
  Target,
  Repeat,
  ChartColumnBig,
  Languages,
  Eye,
  type LucideIcon,
} from "lucide-react";
import { analyzeText, AnalyzeResponse, fetchUnits } from "@/lib/api";
import { catIcon } from "@/lib/categories";
import AsarModal from "@/components/AsarModal";

const NAMUNA_MATN = `Navro'z bayrami arafasida mahalla ahli hashar uyushtirdi. Choyxona oldida katta qozonda osh damlandi, ayollar sumalak pishirdi. Bobolar do'ppi kiyib choy ustida suhbat qurdi. Mehmondo'stlik, sabr va andisha — bu xalqimizning eng ulug' qadriyatlari. Kelin va qaynona birga non yopdi, hamma hashar va o'zaro qarzni qadrladi. Kechqurun karnay-surnay yangrab, dutor sadolari ostida to'y boshlandi.`;

export default function Home() {
  const [text, setText] = useState("");
  const [data, setData] = useState<AnalyzeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dictSize, setDictSize] = useState<number | null>(null);
  const [filter, setFilter] = useState<string>("Barchasi");
  const [modal, setModal] = useState<{ birlik: string; tarjima: string } | null>(null);

  useEffect(() => {
    fetchUnits()
      .then((r) => setDictSize(r.jami))
      .catch(() => setDictSize(null));
  }, []);

  async function handleAnalyze() {
    if (!text.trim()) {
      setError("Iltimos, tahlil uchun matn kiriting.");
      return;
    }
    setError("");
    setLoading(true);
    setFilter("Barchasi");
    try {
      const res = await analyzeText(text);
      setData(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Xatolik yuz berdi.");
    } finally {
      setLoading(false);
    }
  }

  const categories = useMemo(() => {
    if (!data) return [];
    return Array.from(new Set(data.results.map((r) => r.kategoriya)));
  }, [data]);

  const shown = useMemo(() => {
    if (!data) return [];
    return filter === "Barchasi"
      ? data.results
      : data.results.filter((r) => r.kategoriya === filter);
  }, [data, filter]);

  function exportCSV() {
    if (!data) return;
    const rows = [
      ["O'zbekcha birlik", "Inglizcha tarjima", "Tarjima strategiyasi", "Kategoriya", "Soni", "Kontekst"],
      ...data.results.map((r) => [r.birlik, r.tarjima, r.strategiya, r.kategoriya, String(r.soni), r.kontekst]),
    ];
    const csv = rows
      .map((row) => row.map((c) => `"${c.replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "lingvomadaniy-tahlil.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  const stat = data?.statistika;
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  return (
    <div className="flex flex-1 flex-col text-[var(--ink)]">
      {/* ===================== HEADER ===================== */}
      <header className="sticky top-0 z-20 border-b border-[var(--border)] bg-white/75 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-6 py-3.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-sky-500 text-sm font-black tracking-tight text-white shadow-md shadow-blue-600/25">
            LM
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-[16px] font-semibold tracking-tight text-[var(--ink)]">
              Lingvomadaniy Birliklar Tahlil Tizimi
            </h1>
            <p className="truncate text-xs text-[var(--muted)]">
              Milliy-madaniy birliklarni aniqlash · tarjima bilan taqqoslash · statistik tahlil
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {dictSize !== null && (
              <span className="hidden items-center gap-1.5 rounded-full border border-[var(--border)] bg-white px-3 py-1.5 text-xs text-[var(--ink-soft)] sm:flex">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Lug&apos;at: <b className="text-[var(--ink)]">{dictSize}</b> birlik
              </span>
            )}
            <span className="hidden rounded-full border border-[var(--border)] bg-white px-3 py-1.5 text-xs text-[var(--muted)] md:block">
              PostgreSQL
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[400px_1fr]">
          {/* ===================== CHAP: KIRITISH ===================== */}
          <section className="lg:sticky lg:top-24 flex h-fit flex-col gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 card-shadow">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-[var(--ink)]">
                <StepBadge n={1} /> Matn kiritish
              </h2>
            </div>

            <div className="relative">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Tahlil qilinadigan matnni shu yerga yozing yoki fayl yuklang…"
                className="min-h-[280px] w-full resize-y rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4 text-sm leading-relaxed text-[var(--ink)] outline-none transition placeholder:text-[var(--muted)] focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-500/15"
              />
              <span className="pointer-events-none absolute bottom-3 right-3 rounded-md border border-[var(--border)] bg-white px-2 py-0.5 text-[11px] text-[var(--muted)]">
                {wordCount} so&apos;z · {text.length} belgi
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <button
                onClick={() => setText(NAMUNA_MATN)}
                className="flex items-center gap-1.5 text-[var(--accent)] transition hover:opacity-80"
              >
                <Sparkles className="h-3.5 w-3.5" /> Namuna matnni qo&apos;yish
              </button>
              {text && (
                <button onClick={() => setText("")} className="text-[var(--muted)] transition hover:text-[var(--ink-soft)]">
                  Tozalash
                </button>
              )}
            </div>

            <button
              onClick={handleAnalyze}
              disabled={loading}
              className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-sky-500 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-blue-600/25 transition hover:from-blue-500 hover:to-sky-400 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Tahlil qilinmoqda…
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" /> Matnni tahlil qilish
                </>
              )}
            </button>

            {error && (
              <p className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
                <TriangleAlert className="h-4 w-4 shrink-0" /> {error}
              </p>
            )}
          </section>

          {/* ===================== O'NG: NATIJALAR ===================== */}
          <section className="flex flex-col gap-6">
            {!data && !loading && <EmptyState />}

            {data && (
              <>
                {/* Statistika kartalari */}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <StatCard label="Jami so'zlar" value={stat!.jami_sozlar} Icon={FileText} />
                  <StatCard label="Topilgan birliklar" value={stat!.topilgan_birliklar} Icon={Target} />
                  <StatCard label="Jami uchrashlar" value={stat!.jami_uchrashlar} Icon={Repeat} />
                  <StatCard label="Qamrov darajasi" value={`${stat!.qamrov_foizi}%`} Icon={ChartColumnBig} />
                </div>

                {/* Jadval */}
                <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] card-shadow">
                  <div className="flex flex-wrap items-center gap-3 border-b border-[var(--border)] px-5 py-4">
                    <h2 className="flex items-center gap-2 text-sm font-semibold text-[var(--ink)]">
                      <StepBadge n={2} /> Aniqlangan birliklar
                    </h2>
                    <span className="rounded-full bg-[var(--accent-soft)] px-2.5 py-0.5 text-xs font-medium text-[var(--accent)]">
                      {data.results.length} ta
                    </span>
                    {data.results.length > 0 && (
                      <button
                        onClick={exportCSV}
                        className="ml-auto flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1.5 text-xs text-[var(--ink-soft)] transition hover:border-blue-400 hover:text-[var(--accent)]"
                      >
                        <Download className="h-3.5 w-3.5" /> CSV eksport
                      </button>
                    )}
                  </div>

                  {/* Kategoriya filtri */}
                  {categories.length > 1 && (
                    <div className="flex flex-wrap gap-2 border-b border-[var(--border)] px-5 py-3">
                      <FilterChip active={filter === "Barchasi"} onClick={() => setFilter("Barchasi")} label={`Barchasi (${data.results.length})`} />
                      {categories.map((cat) => (
                        <FilterChip
                          key={cat}
                          active={filter === cat}
                          onClick={() => setFilter(cat)}
                          label={cat}
                          Icon={catIcon(cat)}
                        />
                      ))}
                    </div>
                  )}

                  {data.results.length === 0 ? (
                    <p className="px-5 py-12 text-center text-sm text-[var(--muted)]">
                      Bu matndan hech qanday lingvomadaniy birlik topilmadi.
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
                            <th className="px-4 py-3 font-medium">Asardan ko&apos;rish</th>
                          </tr>
                        </thead>
                        <tbody>
                          {shown.map((r, i) => (
                            <tr
                              key={r.id}
                              className="border-b border-[var(--border)] transition last:border-0 hover:bg-[var(--surface-2)] fade-up"
                              style={{ animationDelay: `${i * 30}ms` }}
                            >
                              <td className="px-4 py-4 align-top text-xs text-[var(--muted)]">{i + 1}</td>
                              <td className="px-4 py-4 align-top">
                                <div className="font-semibold text-[var(--ink)]">{r.birlik}</div>
                              </td>
                              <td className="px-4 py-4 align-top">
                                <span className="font-medium text-[var(--ink)]">{r.tarjima}</span>
                              </td>
                              <td className="max-w-xs px-4 py-4 align-top">
                                <span className="inline-flex items-center rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-2 py-0.5 text-xs font-medium text-[var(--ink-soft)]">
                                  {r.strategiya}
                                </span>
                              </td>
                              <td className="px-4 py-4 align-top">
                                {r.asarda_bor ? (
                                  <button
                                    onClick={() => setModal({ birlik: r.birlik, tarjima: r.tarjima })}
                                    title="Asarda ko'rish"
                                    className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1.5 text-xs font-medium text-[var(--ink-soft)] transition hover:border-blue-400 hover:text-[var(--accent)]"
                                  >
                                    <Eye className="h-3.5 w-3.5" /> Ko&apos;rish
                                  </button>
                                ) : (
                                  <span className="text-xs italic text-[var(--muted)]">asarda yo&apos;q</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

              </>
            )}
          </section>
        </div>
      </main>

      <footer className="border-t border-[var(--border)] py-5 text-center text-xs text-[var(--muted)]">
        Lingvomadaniy birliklar tahlil tizimi · Next.js + Flask + PostgreSQL ·{" "}
        {new Date().getFullYear()}
      </footer>

      {modal && (
        <AsarModal
          birlik={modal.birlik}
          tarjima={modal.tarjima}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}

function StepBadge({ n }: { n: number }) {
  return (
    <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[var(--accent-soft)] text-[11px] font-bold text-[var(--accent)]">
      {n}
    </span>
  );
}

function StatCard({ label, value, Icon }: { label: string; value: number | string; Icon: LucideIcon }) {
  return (
    <div className="fade-up rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 card-shadow">
      <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent-soft)]">
        <Icon className="h-4 w-4 text-[var(--accent)]" />
      </div>
      <div className="text-2xl font-bold text-[var(--ink)]">{value}</div>
      <div className="mt-0.5 text-xs text-[var(--muted)]">{label}</div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  label,
  Icon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  Icon?: LucideIcon;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs transition ${
        active
          ? "bg-[var(--accent)] text-white shadow-sm shadow-blue-600/25"
          : "border border-[var(--border)] bg-[var(--surface-2)] text-[var(--ink-soft)] hover:border-blue-300"
      }`}
    >
      {Icon && <Icon className="h-3.5 w-3.5" />}
      {label}
    </button>
  );
}

function EmptyState() {
  const features = [
    { Icon: Target, t: "Avtomatik aniqlash", d: "Matndagi milliy-madaniy birliklar qo'shimchalari bilan topiladi" },
    { Icon: Languages, t: "Tarjima bilan taqqoslash", d: "Har bir birlikning inglizcha muqobili va izohi" },
    { Icon: ChartColumnBig, t: "Statistika va grafik", d: "Chastota, qamrov foizi va vizual ko'rinish" },
  ];
  return (
    <div className="flex flex-1 flex-col rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-10 card-shadow fade-up">
      <div className="flex flex-col items-center text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--accent-soft)]">
          <ChartColumnBig className="h-8 w-8 text-[var(--accent)]" />
        </div>
        <h3 className="text-base font-semibold text-[var(--ink)]">Natijalar shu yerda chiqadi</h3>
        <p className="mt-2 max-w-md text-sm text-[var(--muted)]">
          Chap tomonga matn kiriting yoki <b className="text-[var(--ink-soft)]">.txt</b> fayl yuklang,
          so&apos;ng «Matnni tahlil qilish» tugmasini bosing.
        </p>
      </div>
      <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {features.map((f) => (
          <div key={f.t} className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4">
            <f.Icon className="mb-2 h-6 w-6 text-[var(--accent)]" />
            <div className="text-sm font-medium text-[var(--ink)]">{f.t}</div>
            <div className="mt-1 text-xs leading-relaxed text-[var(--muted)]">{f.d}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
