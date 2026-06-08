"use client";

import { LingvoResult } from "@/lib/api";
import { catIcon } from "@/lib/categories";

// Sof CSS ustunli grafik — yagona ko'k urg'u rang, qiymatga qarab to'qligi o'zgaradi.
export default function BarChart({ data }: { data: LingvoResult[] }) {
  if (!data.length) return null;

  const max = Math.max(...data.map((d) => d.soni), 1);
  const top = [...data].sort((a, b) => b.soni - a.soni).slice(0, 12);

  return (
    <div className="space-y-2.5">
      {top.map((d, i) => {
        const pct = (d.soni / max) * 100;
        const Icon = catIcon(d.kategoriya);
        // Qiymat qancha katta bo'lsa, ustun shuncha to'q ko'k
        const alpha = 0.45 + 0.55 * (d.soni / max);
        return (
          <div
            key={d.id}
            className="flex items-center gap-3 fade-up"
            style={{ animationDelay: `${i * 40}ms` }}
          >
            <div
              className="flex w-32 shrink-0 items-center gap-1.5 truncate text-sm text-[var(--ink-soft)]"
              title={`${d.birlik} — ${d.kategoriya}`}
            >
              <Icon className="h-3.5 w-3.5 shrink-0 text-[var(--muted)]" />
              <span className="truncate">{d.birlik}</span>
            </div>
            <div className="relative h-7 flex-1 overflow-hidden rounded-md bg-[var(--surface-2)] ring-1 ring-[var(--border)]">
              <div
                className="flex h-full items-center justify-end rounded-md px-2 transition-all duration-700"
                style={{ width: `${Math.max(pct, 9)}%`, background: `rgba(37, 99, 235, ${alpha})` }}
              >
                <span className="text-xs font-semibold text-white">{d.soni}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
