"use client";

import { useState, useTransition } from "react";
import { deletePriceAlert, togglePriceAlert, updatePriceAlertTarget } from "@/app/actions/alerts";
import { Icon } from "../icons";

export function AlertRowActions({ id, active, targetTl }: { id: string; active: boolean; targetTl: string }) {
  const [pending, start] = useTransition();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(targetTl);
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {editing ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            start(async () => {
              const r = await updatePriceAlertTarget(id, value);
              if (r.ok) setEditing(false);
              else setError(r.error ?? "Hata");
            });
          }}
          className="flex items-center gap-1.5"
        >
          <input value={value} onChange={(e) => setValue(e.target.value)} inputMode="decimal" className="field h-8 w-28 tabular" aria-label="Yeni hedef fiyat" />
          <button disabled={pending} className="h-8 rounded-md bg-brand px-2.5 text-[12.5px] font-semibold text-on-brand">
            Kaydet
          </button>
          {error ? <span className="text-[12px] text-bad-ink">{error}</span> : null}
        </form>
      ) : (
        <button type="button" onClick={() => setEditing(true)} className="inline-flex h-8 items-center gap-1 rounded-md border border-line px-2.5 text-[12.5px] hover:bg-surface-2">
          <Icon name="edit" className="size-3.5" /> Düzenle
        </button>
      )}
      <button type="button" disabled={pending} onClick={() => start(async () => void (await togglePriceAlert(id)))} className="inline-flex h-8 items-center gap-1 rounded-md border border-line px-2.5 text-[12.5px] hover:bg-surface-2">
        <Icon name={active ? "pause" : "play"} className="size-3.5" />
        {active ? "Duraklat" : "Devam ettir"}
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (confirm("Bu alarm silinsin mi?")) start(async () => void (await deletePriceAlert(id)));
        }}
        className="inline-flex h-8 items-center gap-1 rounded-md border border-line px-2.5 text-[12.5px] text-bad-ink hover:bg-bad-soft"
      >
        <Icon name="trash" className="size-3.5" /> Sil
      </button>
    </div>
  );
}
