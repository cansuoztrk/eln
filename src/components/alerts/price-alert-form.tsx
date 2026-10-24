"use client";

import Link from "next/link";
import { useActionState } from "react";
import { createPriceAlert, type AlertFormState } from "@/app/actions/alerts";
import { formatMoney } from "@/lib/money";
import { Icon } from "../icons";

export function PriceAlertForm({
  productId,
  variants,
  defaultVariantId,
  suggestedMinor,
  currentMinor,
  loggedIn,
  returnTo,
  existingTargetMinor,
}: {
  productId: string;
  variants: { id: string; label: string }[];
  defaultVariantId: string | null;
  suggestedMinor: number | null;
  currentMinor: number | null;
  loggedIn: boolean;
  returnTo: string;
  existingTargetMinor: number | null;
}) {
  const [state, action, pending] = useActionState<AlertFormState, FormData>(createPriceAlert, {});
  if (!loggedIn) {
    return (
      <div className="rounded-lg border border-line bg-surface-2 p-4 text-[13.5px] text-ink-2">
        <p>Hedef fiyata inildiğinde size e-posta ve site içi bildirim gönderebilmemiz için ücretsiz bir hesap gerekir. Favoriler hesap olmadan da çalışır.</p>
        <div className="mt-3 flex gap-2">
          <Link href={`/giris?sonra=${encodeURIComponent(returnTo)}`} className="inline-flex h-9 items-center rounded-md bg-brand px-3.5 text-[13px] font-semibold text-on-brand">
            Giriş yap
          </Link>
          <Link href={`/kayit?sonra=${encodeURIComponent(returnTo)}`} className="inline-flex h-9 items-center rounded-md border border-line px-3.5 text-[13px]">
            Hesap oluştur
          </Link>
        </div>
      </div>
    );
  }
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="productId" value={productId} />
      {variants.length > 1 ? (
        <label className="block text-[13px]">
          <span className="mb-1 block text-ink-2">Varyant</span>
          <select name="variantId" defaultValue={defaultVariantId ?? ""} className="field">
            <option value="">Tüm varyantlar</option>
            {variants.map((v) => (
              <option key={v.id} value={v.id}>
                {v.label}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      <label className="block text-[13px]">
        <span className="mb-1 block text-ink-2">Hedef fiyat (TL)</span>
        <div className="flex gap-2">
          <input
            name="target"
            inputMode="decimal"
            required
            defaultValue={existingTargetMinor ? String(existingTargetMinor / 100) : suggestedMinor ? String(Math.floor(suggestedMinor / 100)) : ""}
            className="field tabular"
            aria-describedby="alert-help"
          />
          <button type="submit" disabled={pending} className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-md bg-brand px-4 text-[13.5px] font-semibold text-on-brand hover:bg-brand-ink disabled:opacity-60">
            <Icon name="bellPlus" className="size-4" />
            {existingTargetMinor ? "Güncelle" : "Alarm kur"}
          </button>
        </div>
      </label>
      <label className="flex items-center gap-2 text-[13px] text-ink-2">
        <input type="checkbox" name="includeShipping" defaultChecked className="size-4 accent-[var(--brand)]" />
        Kargo dâhil toplam fiyata göre
      </label>
      <p id="alert-help" className="text-[12px] leading-relaxed text-ink-3">
        {currentMinor ? `Şu anki en iyi fiyat ${formatMoney(currentMinor)}. ` : ""}Yalnızca doğrulanmış güncel fiyatlarla tetiklenir; aynı düşüş için tekrar bildirim gönderilmez.
      </p>
      {state.error ? <p className="rounded-md bg-bad-soft px-3 py-2 text-[13px] text-bad-ink">{state.error}</p> : null}
      {state.ok ? (
        <p className="rounded-md bg-good-soft px-3 py-2 text-[13px] text-good-ink">
          {state.message}{" "}
          <Link href="/hesap/alarmlar" className="underline">
            Alarmlarım
          </Link>
        </p>
      ) : null}
    </form>
  );
}
