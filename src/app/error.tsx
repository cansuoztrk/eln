"use client";

import { useEffect } from "react";

/** Beklenmeyen hata ekranı: ayrıntı sızdırmaz, yeniden deneme sunar. */
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="grid min-h-[60vh] place-items-center px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-[26px] font-[680] tracking-tight">Bir şeyler ters gitti</h1>
        <p className="mt-2 text-[14px] text-ink-2">Sayfa yüklenirken bir sorun oluştu. Veri kaynaklarından biri geçici olarak erişilemiyor olabilir; diğer bölümler çalışmaya devam eder.</p>
        {error.digest ? <p className="mt-2 font-mono text-[11px] text-ink-3">Hata kodu: {error.digest}</p> : null}
        <button onClick={reset} className="mt-6 inline-flex h-10 items-center rounded-md bg-brand px-4 text-[14px] font-semibold text-on-brand">
          Tekrar dene
        </button>
      </div>
    </div>
  );
}
