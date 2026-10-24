"use client";

import { useActionState, useRef } from "react";
import { saveSearch, type FormState } from "@/app/actions/account";
import { Icon } from "../icons";

export function SaveSearchButton({ kind, query, defaultName }: { kind: "PRODUCT" | "FLIGHT"; query: string; defaultName: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [state, action, pending] = useActionState<FormState, FormData>(saveSearch, {});
  return (
    <>
      <button type="button" onClick={() => ref.current?.showModal()} className="inline-flex h-10 items-center gap-1.5 rounded-md border border-line px-3 text-[13px] hover:bg-surface-2">
        <Icon name="search" className="size-4" /> Aramayı kaydet
      </button>
      <dialog ref={ref} className="w-[min(420px,92vw)] rounded-xl border border-line bg-surface p-5 text-ink">
        <form action={action} className="space-y-3">
          <p className="font-display text-[17px] font-semibold">Aramayı kaydet</p>
          <input type="hidden" name="kind" value={kind} />
          <input type="hidden" name="query" value={query} />
          <label className="block text-[13px]">
            <span className="mb-1 block text-ink-2">Ad</span>
            <input name="name" defaultValue={defaultName} required maxLength={80} className="field" />
          </label>
          {state.error ? <p className="text-[13px] text-bad-ink">{state.error}</p> : null}
          {state.ok ? <p className="text-[13px] text-good-ink">{state.message}</p> : null}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => ref.current?.close()} className="h-9 rounded-md px-3 text-[13px] text-ink-2 hover:bg-surface-2">
              Kapat
            </button>
            <button disabled={pending} className="h-9 rounded-md bg-brand px-3.5 text-[13px] font-semibold text-on-brand">
              Kaydet
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
