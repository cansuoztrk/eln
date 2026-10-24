"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { formatMoney } from "@/lib/money";
import { Icon } from "../icons";

type Suggest = {
  products: { slug: string; title: string; brand: string | null; priceMinor: number | null; currency: string | null; icon: string | null; isTestData: boolean }[];
  categories: { slug: string; name: string; icon: string | null }[];
  brands: { slug: string; name: string }[];
};

type Item = { key: string; label: string; sub?: string; href: string; icon: string; kind: string };

const RECENT_KEY = "fr:recent-searches";

function readRecent(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
    return Array.isArray(v) ? v.filter((x) => typeof x === "string").slice(0, 6) : [];
  } catch {
    return [];
  }
}

export function rememberSearch(q: string) {
  try {
    const list = [q, ...readRecent().filter((x) => x.toLocaleLowerCase("tr") !== q.toLocaleLowerCase("tr"))].slice(0, 6);
    localStorage.setItem(RECENT_KEY, JSON.stringify(list));
  } catch {}
}

/**
 * Akıllı arama kutusu: yazım hatasına toleranslı otomatik tamamlama, son aramalar (yalnızca bu
 * tarayıcıda), popüler aramalar, klavye ile gezinme. JavaScript olmadan da form olarak çalışır.
 */
export function SearchBox({ popular = [], size = "md", autoFocus = false, placeholder, className, defaultValue = "" }: { popular?: string[]; size?: "md" | "lg"; autoFocus?: boolean; placeholder?: string; className?: string; defaultValue?: string }) {
  const router = useRouter();
  const [q, setQ] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<Suggest | null>(null);
  const suggest = q.trim().length >= 2 ? data : null;
  const [recent, setRecent] = useState<string[]>([]);
  const [active, setActive] = useState(-1);
  const listId = useId();
  function openBox() {
    setRecent(readRecent());
    setOpen(true);
  }
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) return;
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search/suggest?q=${encodeURIComponent(term)}`, { signal: ctrl.signal });
        if (res.ok) setData(await res.json());
      } catch {}
    }, 140);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const items: Item[] = useMemo(() => {
    const out: Item[] = [];
    if (q.trim().length < 2) {
      recent.forEach((r) => out.push({ key: `r:${r}`, label: r, href: `/ara?q=${encodeURIComponent(r)}`, icon: "clock", kind: "Son aramalar" }));
      popular.slice(0, 6).forEach((p) => out.push({ key: `p:${p}`, label: p, href: `/ara?q=${encodeURIComponent(p)}`, icon: "trendDown", kind: "Popüler aramalar" }));
      return out;
    }
    suggest?.categories.forEach((c) => out.push({ key: `c:${c.slug}`, label: c.name, href: `/kategori/${c.slug}`, icon: c.icon ?? "grid", kind: "Kategoriler" }));
    suggest?.brands.forEach((b) => out.push({ key: `b:${b.slug}`, label: b.name, href: `/firsatlar?marka=${b.slug}`, icon: "tag", kind: "Markalar" }));
    suggest?.products.forEach((p) =>
      out.push({
        key: `u:${p.slug}`,
        label: p.title,
        sub: [p.brand, p.priceMinor !== null ? formatMoney(p.priceMinor, p.currency ?? "TRY") : "güncel teklif yok", p.isTestData ? "test verisi" : null].filter(Boolean).join(" · "),
        href: `/urun/${p.slug}`,
        icon: p.icon ?? "spark",
        kind: "Ürünler",
      }),
    );
    return out;
  }, [q, suggest, recent, popular]);

  function submit(term: string) {
    const t = term.trim();
    if (!t) return;
    rememberSearch(t);
    setOpen(false);
    router.push(`/ara?q=${encodeURIComponent(t)}`);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      openBox();
      setActive((a) => Math.min(items.length - 1, a + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(-1, a - 1));
    } else if (e.key === "Escape") {
      setOpen(false);
      setActive(-1);
    } else if (e.key === "Enter" && active >= 0 && items[active]) {
      e.preventDefault();
      const it = items[active];
      if (it.kind === "Son aramalar" || it.kind === "Popüler aramalar") submit(it.label);
      else {
        setOpen(false);
        router.push(it.href);
      }
    }
  }

  let lastKind = "";
  return (
    <div ref={boxRef} className={cn("relative w-full", className)}>
      <form
        action="/ara"
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          submit(q);
        }}
        className={cn(
          "flex items-center gap-2 rounded-lg border border-line-strong bg-surface transition-[border-color,box-shadow] focus-within:border-brand focus-within:shadow-[0_0_0_3px_var(--brand-soft)]",
          size === "lg" ? "h-14 pl-4 pr-1.5" : "h-10 pl-3 pr-1",
        )}
      >
        <Icon name="search" className={cn("shrink-0 text-ink-3", size === "lg" ? "size-5" : "size-[18px]")} />
        <input
          name="q"
          value={q}
          autoFocus={autoFocus}
          onChange={(e) => {
            setQ(e.target.value);
            openBox();
            setActive(-1);
          }}
          onFocus={() => openBox()}
          onKeyDown={onKeyDown}
          placeholder={placeholder ?? "Ürün, marka, model kodu ara…"}
          className={cn("h-full min-w-0 flex-1 bg-transparent outline-none placeholder:text-ink-3", size === "lg" ? "text-[16px]" : "text-[14px]")}
          role="combobox"
          aria-expanded={open && items.length > 0}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
          autoComplete="off"
          enterKeyHint="search"
          aria-label="Ara"
        />
        {size === "lg" ? (
          <button type="submit" className="h-11 rounded-md bg-brand px-5 text-[14px] font-semibold text-on-brand transition-colors hover:bg-brand-ink">
            Ara
          </button>
        ) : (
          <kbd className="mr-1.5 hidden rounded border border-line px-1.5 font-mono text-[10px] text-ink-3 lg:inline">Enter</kbd>
        )}
      </form>
      {open && items.length > 0 ? (
        <ul id={listId} role="listbox" className="absolute inset-x-0 top-[calc(100%+6px)] z-50 max-h-[70vh] overflow-y-auto rounded-lg border border-line bg-surface p-1.5 shadow-pop">
          {items.map((it, i) => {
            const header = it.kind !== lastKind ? it.kind : null;
            lastKind = it.kind;
            return (
              <li key={it.key} role="presentation">
                {header ? <p className="eyebrow px-2.5 pb-1 pt-2">{header}</p> : null}
                <a
                  id={`${listId}-${i}`}
                  role="option"
                  aria-selected={i === active}
                  href={it.href}
                  onMouseEnter={() => setActive(i)}
                  onClick={(e) => {
                    if (it.kind === "Son aramalar" || it.kind === "Popüler aramalar") {
                      e.preventDefault();
                      submit(it.label);
                    } else setOpen(false);
                  }}
                  className={cn("flex items-center gap-3 rounded-md px-2.5 py-2 text-[14px]", i === active ? "bg-surface-2" : "")}
                >
                  <span className="grid size-8 shrink-0 place-items-center rounded-md border border-line bg-surface-2 text-ink-3">
                    <Icon name={it.icon} className="size-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate">{it.label}</span>
                    {it.sub ? <span className="block truncate text-[12px] text-ink-3">{it.sub}</span> : null}
                  </span>
                </a>
              </li>
            );
          })}
          {q.trim().length >= 2 ? (
            <li role="presentation">
              <button type="button" onClick={() => submit(q)} className="mt-1 flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-[13px] text-brand-ink hover:bg-surface-2">
                <Icon name="search" className="size-4" />“{q.trim()}” için tüm sonuçlar
              </button>
            </li>
          ) : null}
        </ul>
      ) : null}
    </div>
  );
}
