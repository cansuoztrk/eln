"use client";

import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/cn";

type Airport = { iata: string; name: string; city: string; country: string; isCity: boolean };

/**
 * Havalimanı/şehir seçici: IATA kodu, şehir veya havalimanı adıyla arar. Form alanına IATA kodu
 * yazılır; JavaScript olmadan da 3 harfli kod girilerek kullanılabilir.
 */
export function AirportInput({ name, label, defaultValue = "", className, required = true }: { name: string; label: string; defaultValue?: string; className?: string; required?: boolean }) {
  const [code, setCode] = useState(defaultValue);
  const [text, setText] = useState(defaultValue);
  const [items, setItems] = useState<Airport[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const id = useId();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!defaultValue) return;
    fetch(`/api/airports?q=${encodeURIComponent(defaultValue)}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((list: Airport[]) => {
        const hit = list.find((a) => a.iata === defaultValue);
        if (hit) setText(`${hit.city} (${hit.iata})`);
      })
      .catch(() => {});
  }, [defaultValue]);

  useEffect(() => {
    const term = text.trim();
    if (!open || term.length < 2 || /\([A-Z]{3}\)$/.test(term)) return;
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      fetch(`/api/airports?q=${encodeURIComponent(term)}`, { signal: ctrl.signal })
        .then((r) => (r.ok ? r.json() : []))
        .then((list: Airport[]) => {
          setItems(list);
          setActive(0);
        })
        .catch(() => {});
    }, 120);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [text, open]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function pick(a: Airport) {
    setCode(a.iata);
    setText(`${a.city} (${a.iata})`);
    setOpen(false);
  }

  return (
    <div ref={ref} className={cn("relative", className)}>
      <label className="flex flex-col rounded-md px-2.5 py-1.5 hover:bg-surface-2">
        <span className="text-[11px] text-ink-3">{label}</span>
        <input
          value={text}
          onChange={(e) => {
            const v = e.target.value;
            setText(v);
            setOpen(true);
            const m = v.trim().toUpperCase();
            setCode(/^[A-Z]{3}$/.test(m) ? m : "");
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((a) => Math.min(items.length - 1, a + 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((a) => Math.max(0, a - 1));
            } else if (e.key === "Enter" && open && items[active]) {
              e.preventDefault();
              pick(items[active]);
            } else if (e.key === "Escape") setOpen(false);
          }}
          placeholder="Şehir veya havalimanı"
          className="bg-transparent text-[14px] font-medium outline-none placeholder:font-normal placeholder:text-ink-3"
          role="combobox"
          aria-expanded={open && items.length > 0}
          aria-controls={id}
          autoComplete="off"
          aria-label={label}
        />
      </label>
      <input type="hidden" name={name} value={code} required={required} />
      {open && items.length > 0 ? (
        <ul id={id} role="listbox" className="absolute left-0 top-full z-50 mt-1 max-h-72 w-[min(340px,90vw)] overflow-y-auto rounded-lg border border-line bg-surface p-1 shadow-pop">
          {items.map((a, i) => (
            <li key={a.iata} role="option" aria-selected={i === active}>
              <button type="button" onMouseEnter={() => setActive(i)} onClick={() => pick(a)} className={cn("flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-left", i === active && "bg-surface-2")}>
                <span className="w-10 shrink-0 font-mono text-[12px] font-semibold text-brand-ink">{a.iata}</span>
                <span className="min-w-0">
                  <span className="block truncate text-[13.5px]">{a.isCity ? a.name : `${a.city} · ${a.name}`}</span>
                  <span className="block text-[11.5px] text-ink-3">{a.country}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
