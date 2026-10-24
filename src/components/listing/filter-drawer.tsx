"use client";

import { useRef, type ReactNode } from "react";
import { Icon } from "../icons";

/** Mobil filtre çekmecesi (yerel <dialog>; odak tuzağı ve Esc tarayıcı tarafından yönetilir). */
export function FilterDrawer({ count, children }: { count: number; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  return (
    <>
      <button type="button" onClick={() => ref.current?.showModal()} className="inline-flex h-10 items-center gap-2 rounded-md border border-line-strong bg-surface px-3.5 text-[13.5px] font-medium lg:hidden">
        <Icon name="filter" className="size-4" />
        Filtreler
        {count ? <span className="grid min-w-5 place-items-center rounded-full bg-brand px-1.5 font-mono text-[11px] text-on-brand">{count}</span> : null}
      </button>
      <dialog ref={ref} className="m-0 ml-auto h-dvh max-h-dvh w-[min(420px,100vw)] max-w-none bg-surface p-0 text-ink backdrop:bg-black/50" onClick={(e) => e.target === ref.current && ref.current?.close()}>
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-surface px-4 py-3">
          <p className="font-display text-[17px] font-semibold">Filtreler</p>
          <button type="button" onClick={() => ref.current?.close()} className="grid size-9 place-items-center rounded-md hover:bg-surface-2" aria-label="Kapat">
            <Icon name="x" className="size-5" />
          </button>
        </div>
        <div className="p-4 pb-28">{children}</div>
      </dialog>
    </>
  );
}
