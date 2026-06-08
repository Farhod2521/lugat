"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { X, Loader2 } from "lucide-react";
import { fetchAsar } from "@/lib/api";
import { highlightText, birlikRegex, tarjimaRegex } from "@/lib/highlight";

interface Props {
  birlik: string;    // o'zbekcha birlik (chap tomonda sariq)
  tarjima: string;   // inglizcha tarjima (o'ng tomonda sariq)
  onClose: () => void;
}

interface Block {
  tag: "h1" | "h2" | "p";
  cls: string;
  text: string;
}

// Asar HTML stringini bloklarga ajratamiz (DOMParser bilan).
function parseBlocks(html: string): Block[] {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const blocks: Block[] = [];
  doc.body.querySelectorAll("h1, h2, p").forEach((el) => {
    const tag = el.tagName.toLowerCase() as Block["tag"];
    blocks.push({
      tag,
      cls: el.getAttribute("class") || "",
      text: el.textContent || "",
    });
  });
  return blocks;
}

// Bitta til ustunini render qiladi (matn + highlight + scroll ref).
function AsarColumn({
  blocks,
  reFactory,
}: {
  blocks: Block[];
  reFactory: () => RegExp;
}) {
  const firstRef = useRef<HTMLElement | null>(null);

  // Birinchi moslik qaysi blokda — faqat o'shanga ref biriktiramiz.
  const firstBlock = useMemo(() => {
    for (let i = 0; i < blocks.length; i++) {
      const re = reFactory();
      if (re.test(blocks[i].text)) return i;
    }
    return -1;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blocks]);

  // Render bo'lgach birinchi moslikka scroll.
  useEffect(() => {
    const t = setTimeout(() => {
      firstRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 150);
    return () => clearTimeout(t);
  }, [firstBlock]);

  return (
    <article className="asar-body space-y-3">
      {blocks.map((b, i) => {
        const content = highlightText(
          b.text,
          reFactory,
          i === firstBlock ? firstRef : undefined
        );
        if (b.tag === "h1") return <h1 key={i} className="asar-title">{content}</h1>;
        if (b.tag === "h2") return <h2 key={i} className="asar-bolim">{content}</h2>;
        const dialog = b.cls.includes("asar-dialog");
        return (
          <p key={i} className={dialog ? "asar-dialog" : "asar-p"}>
            {content}
          </p>
        );
      })}
    </article>
  );
}

export default function AsarModal({ birlik, tarjima, onClose }: Props) {
  const [data, setData] = useState<{ uz: string; en: string } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAsar()
      .then((r) => setData({ uz: r.uz.html, en: r.en.html }))
      .catch((e) => setError(e instanceof Error ? e.message : "Xatolik"));
  }, []);

  // Esc bilan yopish + body scroll lock.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const uzBlocks = useMemo(() => (data ? parseBlocks(data.uz) : []), [data]);
  const enBlocks = useMemo(() => (data ? parseBlocks(data.en) : []), [data]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sarlavha */}
        <div className="flex items-center gap-3 border-b border-[var(--border)] px-6 py-4">
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-[var(--ink)]">Asar matni</h3>
            <p className="truncate text-xs text-[var(--muted)]">
              <b className="text-[var(--accent)]">{birlik}</b>
              {" — "}
              <b className="text-[var(--accent)]">{tarjima}</b>
              {" — har ikki asarda belgilangan joylarga o'ting"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="ml-auto flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] text-[var(--ink-soft)] transition hover:bg-[var(--surface-2)]"
            aria-label="Yopish"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Ikki ustun: o'zbekcha | inglizcha */}
        {!data && !error && (
          <div className="flex items-center justify-center gap-2 py-24 text-sm text-[var(--muted)]">
            <Loader2 className="h-4 w-4 animate-spin" /> Asarlar yuklanmoqda…
          </div>
        )}
        {error && <p className="py-24 text-center text-sm text-red-600">{error}</p>}
        {data && (
          <div className="grid flex-1 grid-cols-2 divide-x divide-[var(--border)] overflow-hidden">
            {/* O'zbekcha — chap */}
            <div className="flex flex-col overflow-hidden">
              <div className="border-b border-[var(--border)] bg-[var(--surface-2)] px-5 py-2 text-xs font-semibold uppercase tracking-wider text-[var(--ink-soft)]">
                🇺🇿 Shum bola (o&apos;zbekcha)
              </div>
              <div className="overflow-y-auto px-5 py-4">
                <AsarColumn blocks={uzBlocks} reFactory={() => birlikRegex(birlik)} />
              </div>
            </div>
            {/* Inglizcha — o'ng */}
            <div className="flex flex-col overflow-hidden">
              <div className="border-b border-[var(--border)] bg-[var(--surface-2)] px-5 py-2 text-xs font-semibold uppercase tracking-wider text-[var(--ink-soft)]">
                🇬🇧 A naughty Boy (English)
              </div>
              <div className="overflow-y-auto px-5 py-4">
                <AsarColumn blocks={enBlocks} reFactory={() => tarjimaRegex(tarjima)} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
