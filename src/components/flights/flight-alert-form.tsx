"use client";

import Link from "next/link";
import { useActionState } from "react";
import { createFlightAlert, type FlightFormState } from "@/app/actions/flights";

export function FlightAlertForm({ origin, destination, suggestedMinor, loggedIn }: { origin: string; destination: string; suggestedMinor: number | null; loggedIn: boolean }) {
  const [state, action, pending] = useActionState<FlightFormState, FormData>(createFlightAlert, {});
  const from = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
  const to = new Date(Date.now() + 60 * 86400000).toISOString().slice(0, 10);
  if (!loggedIn)
    return (
      <p className="text-[13.5px] text-ink-2">
        Uçuş alarmı kurmak için{" "}
        <Link href={`/giris?sonra=/ucak-bileti/rota/${origin}-${destination}`} className="font-medium text-brand-ink underline">
          giriş yapın
        </Link>
        .
      </p>
    );
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="origin" value={origin} />
      <input type="hidden" name="destination" value={destination} />
      <div className="grid gap-2 sm:grid-cols-3">
        <label className="text-[13px]">
          <span className="mb-1 block text-ink-2">En erken gidiş</span>
          <input type="date" name="departFrom" defaultValue={from} required className="field" />
        </label>
        <label className="text-[13px]">
          <span className="mb-1 block text-ink-2">En geç gidiş</span>
          <input type="date" name="departTo" defaultValue={to} required className="field" />
        </label>
        <label className="text-[13px]">
          <span className="mb-1 block text-ink-2">Hedef fiyat (TL)</span>
          <input name="target" inputMode="decimal" required defaultValue={suggestedMinor ? String(Math.floor((suggestedMinor * 0.9) / 100)) : ""} className="field tabular" />
        </label>
      </div>
      <label className="flex items-center gap-2 text-[13px] text-ink-2">
        <input type="checkbox" name="directOnly" className="size-4 accent-[var(--brand)]" /> Yalnızca direkt uçuşlar
      </label>
      <button disabled={pending} className="h-10 rounded-md bg-brand px-4 text-[13.5px] font-semibold text-on-brand hover:bg-brand-ink disabled:opacity-60">
        Uçuş alarmı kur
      </button>
      {state.error ? <p className="rounded-md bg-bad-soft px-3 py-2 text-[13px] text-bad-ink">{state.error}</p> : null}
      {state.ok ? <p className="rounded-md bg-good-soft px-3 py-2 text-[13px] text-good-ink">{state.message}</p> : null}
      <p className="text-[12px] text-ink-3">Önbellek fiyatları gösterge niteliğindedir; bildirimde fiyatın türü ve kontrol zamanı belirtilir.</p>
    </form>
  );
}
