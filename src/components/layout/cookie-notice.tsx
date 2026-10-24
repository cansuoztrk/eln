"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

/** Bilgilendirme: yalnızca zorunlu çerez kullanılır (onay gerektiren çerez yok). */
export function CookieNotice() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    try {
      setShow(localStorage.getItem("fr:cookie-notice") !== "1");
    } catch {}
  }, []);
  if (!show) return null;
  return (
    <div role="region" aria-label="Çerez bilgilendirmesi" className="fixed inset-x-3 bottom-[72px] z-40 mx-auto max-w-xl rounded-lg border border-line bg-surface p-3.5 text-[12.5px] text-ink-2 shadow-pop lg:bottom-4">
      <p>
        Yalnızca oturum için zorunlu bir çerez kullanıyoruz; reklam veya izleme çerezi yok.{" "}
        <Link href="/cerezler" className="text-brand-ink underline">
          Ayrıntılar
        </Link>
      </p>
      <button
        type="button"
        onClick={() => {
          try {
            localStorage.setItem("fr:cookie-notice", "1");
          } catch {}
          setShow(false);
        }}
        className="mt-2 h-8 rounded-md bg-ink px-3 text-[12.5px] font-semibold text-bg"
      >
        Anladım
      </button>
    </div>
  );
}
