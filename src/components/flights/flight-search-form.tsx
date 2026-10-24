"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { Icon } from "../icons";
import { AirportInput } from "./airport-input";

export type FlightFormDefaults = { from?: string; to?: string; depart?: string; return?: string; adults?: number; cabin?: string; direct?: boolean; flex?: number };

/** Uçuş arama formu — GET ile /ucak-bileti/ara; sonuç URL'si paylaşılabilir. */
export function FlightSearchForm({ d = {}, compact = false }: { d?: FlightFormDefaults; compact?: boolean }) {
  const [roundTrip, setRoundTrip] = useState(Boolean(d.return));
  const [key, setKey] = useState(0);
  const [vals, setVals] = useState({ from: d.from ?? "IST", to: d.to ?? "" });
  const today = new Date().toISOString().slice(0, 10);
  const defDepart = d.depart ?? new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);
  return (
    <form action="/ucak-bileti/ara" method="get" className={cn("rounded-xl border border-line bg-surface p-3 shadow-card", compact ? "" : "md:p-4")}>
      <div className="mb-3 flex flex-wrap items-center gap-2 text-[13px]">
        {[
          [false, "Tek yön"],
          [true, "Gidiş-dönüş"],
        ].map(([v, label]) => (
          <button key={String(v)} type="button" onClick={() => setRoundTrip(v as boolean)} aria-pressed={roundTrip === v} className={cn("h-8 rounded-full border px-3", roundTrip === v ? "border-ink bg-ink text-bg" : "border-line text-ink-2 hover:border-line-strong")}>
            {label as string}
          </button>
        ))}
        <span className="mx-1 h-5 w-px bg-line" aria-hidden />
        <label className="inline-flex h-8 items-center gap-1.5 rounded-full border border-line px-3 text-ink-2">
          <Icon name="user" className="size-3.5" />
          <select name="adults" defaultValue={String(d.adults ?? 1)} className="bg-transparent outline-none" aria-label="Yolcu sayısı">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>
                {n} yetişkin
              </option>
            ))}
          </select>
        </label>
        <label className="inline-flex h-8 items-center gap-1.5 rounded-full border border-line px-3 text-ink-2">
          <select name="cabin" defaultValue={d.cabin ?? "ECONOMY"} className="bg-transparent outline-none" aria-label="Kabin sınıfı">
            <option value="ECONOMY">Ekonomi</option>
            <option value="PREMIUM_ECONOMY">Premium ekonomi</option>
            <option value="BUSINESS">Business</option>
            <option value="FIRST">First</option>
          </select>
        </label>
        <label className="inline-flex h-8 items-center gap-1.5 rounded-full border border-line px-3 text-ink-2">
          <select name="flex" defaultValue={String(d.flex ?? 0)} className="bg-transparent outline-none" aria-label="Esnek tarih">
            <option value="0">Tam tarih</option>
            <option value="1">± 1 gün</option>
            <option value="2">± 2 gün</option>
            <option value="3">± 3 gün</option>
          </select>
        </label>
        <label className="inline-flex h-8 items-center gap-1.5 rounded-full border border-line px-3 text-ink-2">
          <input type="checkbox" name="direct" value="1" defaultChecked={d.direct} className="size-3.5 accent-[var(--brand)]" />
          Yalnızca direkt
        </label>
      </div>
      <div className={cn("grid gap-2", roundTrip ? "md:grid-cols-[1fr_auto_1fr_150px_150px_auto]" : "md:grid-cols-[1fr_auto_1fr_150px_auto]")}>
        <div className="rounded-lg border border-line">
          <AirportInput key={`f${key}`} name="from" label="Nereden" defaultValue={vals.from} />
        </div>
        <button
          type="button"
          onClick={() => {
            const form = (document.activeElement as HTMLElement)?.closest("form");
            const f = (form?.querySelector('input[name="from"]') as HTMLInputElement)?.value || vals.from;
            const t = (form?.querySelector('input[name="to"]') as HTMLInputElement)?.value || vals.to;
            setVals({ from: t, to: f });
            setKey((k) => k + 1);
          }}
          className="mx-auto grid size-9 place-items-center self-center rounded-full border border-line text-ink-2 hover:bg-surface-2"
          aria-label="Kalkış ve varışı değiştir"
        >
          <Icon name="swap" className="size-4" />
        </button>
        <div className="rounded-lg border border-line">
          <AirportInput key={`t${key}`} name="to" label="Nereye" defaultValue={vals.to} />
        </div>
        <label className="flex flex-col rounded-lg border border-line px-2.5 py-1.5">
          <span className="text-[11px] text-ink-3">Gidiş</span>
          <input type="date" name="depart" required min={today} defaultValue={defDepart} className="bg-transparent text-[14px] outline-none" />
        </label>
        {roundTrip ? (
          <label className="flex flex-col rounded-lg border border-line px-2.5 py-1.5">
            <span className="text-[11px] text-ink-3">Dönüş</span>
            <input type="date" name="return" required min={today} defaultValue={d.return} className="bg-transparent text-[14px] outline-none" />
          </label>
        ) : null}
        <button type="submit" className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-brand px-6 text-[14px] font-semibold text-on-brand hover:bg-brand-ink md:h-auto">
          <Icon name="search" className="size-4" />
          Uçuş ara
        </button>
      </div>
    </form>
  );
}
