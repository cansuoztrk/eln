"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { Icon } from "../icons";
import { SearchBox } from "../layout/search-box";
import { AirportInput } from "../flights/airport-input";

/** Kahraman alanı araması: ürün veya uçuş. Uçuş sekmesi uçuş arama sayfasına yönlendirir. */
export function HeroSearch({ popular }: { popular: string[] }) {
  const [tab, setTab] = useState<"product" | "flight">("product");
  const today = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
  return (
    <div>
      <div role="tablist" aria-label="Arama türü" className="mb-3 inline-flex rounded-lg border border-line bg-surface-2 p-1">
        {(
          [
            ["product", "Ürün ara", "tag"],
            ["flight", "Uçak bileti", "plane"],
          ] as const
        ).map(([key, label, icon]) => (
          <button
            key={key}
            role="tab"
            type="button"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={cn("inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-[13px] font-medium transition-colors", tab === key ? "bg-surface text-ink shadow-card" : "text-ink-2 hover:text-ink")}
          >
            <Icon name={icon} className="size-4" />
            {label}
          </button>
        ))}
      </div>
      {tab === "product" ? (
        <div role="tabpanel">
          <SearchBox size="lg" popular={popular} placeholder="Ör. “kablosuz oyuncu faresi 1500 TL altı”" />
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-[12px] text-ink-3">Popüler:</span>
            {popular.slice(0, 5).map((p) => (
              <a key={p} href={`/ara?q=${encodeURIComponent(p)}`} className="rounded-full border border-line bg-surface px-2.5 py-1 text-[12px] text-ink-2 transition-colors hover:border-line-strong hover:text-ink">
                {p}
              </a>
            ))}
          </div>
        </div>
      ) : (
        <form role="tabpanel" action="/ucak-bileti/ara" className="grid gap-2 rounded-lg border border-line-strong bg-surface p-2 sm:grid-cols-[1fr_1fr_150px_auto]">
          <AirportInput name="from" label="Nereden" defaultValue="IST" />
          <AirportInput name="to" label="Nereye" defaultValue="" />
          <label className="flex flex-col rounded-md px-2.5 py-1.5 hover:bg-surface-2">
            <span className="text-[11px] text-ink-3">Gidiş</span>
            <input type="date" name="depart" defaultValue={today} min={new Date().toISOString().slice(0, 10)} required className="bg-transparent text-[14px] outline-none" />
          </label>
          <button type="submit" className="h-12 rounded-md bg-brand px-5 text-[14px] font-semibold text-on-brand hover:bg-brand-ink">
            Uçuş ara
          </button>
        </form>
      )}
    </div>
  );
}
