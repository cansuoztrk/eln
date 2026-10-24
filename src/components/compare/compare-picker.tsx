"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon } from "../icons";

/** Karşılaştırmaya ürün ekleme: arama önerilerinden seçilen ürün URL'deki listeye eklenir. */
export function ComparePicker({ current }: { current: string[] }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [items, setItems] = useState<{ slug: string; title: string }[]>([]);
  const active = q.trim().length >= 2;
  useEffect(() => {
    if (!active) return;
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      fetch(`/api/search/suggest?q=${encodeURIComponent(q)}`, { signal: ctrl.signal })
        .then((r) => (r.ok ? r.json() : { products: [] }))
        .then((d) => setItems(d.products ?? []))
        .catch(() => {});
    }, 150);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q, active]);
  if (current.length >= 4) return <p className="text-[13px] text-ink-3">En fazla 4 ürün karşılaştırılabilir.</p>;
  return (
    <div className="relative max-w-md">
      <label className="flex h-10 items-center gap-2 rounded-md border border-line-strong bg-surface px-3 focus-within:border-brand">
        <Icon name="search" className="size-4 text-ink-3" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Karşılaştırmaya ürün ekle…" className="h-full flex-1 bg-transparent text-[14px] outline-none" aria-label="Karşılaştırmaya ürün ekle" />
      </label>
      {active && items.length ? (
        <ul className="absolute inset-x-0 top-full z-30 mt-1 rounded-lg border border-line bg-surface p-1 shadow-pop">
          {items
            .filter((i) => !current.includes(i.slug))
            .map((i) => (
              <li key={i.slug}>
                <button
                  type="button"
                  onClick={() => {
                    setQ("");
                    router.push(`/karsilastir?urunler=${[...current, i.slug].join(",")}`);
                  }}
                  className="block w-full truncate rounded-md px-3 py-2 text-left text-[13.5px] hover:bg-surface-2"
                >
                  {i.title}
                </button>
              </li>
            ))}
        </ul>
      ) : null}
    </div>
  );
}
