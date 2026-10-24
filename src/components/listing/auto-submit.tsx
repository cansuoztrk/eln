"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

/**
 * GET filtre formu: seçim değiştikçe URL'yi günceller (boş alanlar atılır, bağlantı temiz kalır).
 * Sonuç URL'de tutulduğu için paylaşılabilir. JavaScript yoksa "Uygula" ile normal form gibi çalışır.
 */
export function AutoSubmitForm({ action, children, className, id }: { action: string; children: ReactNode; className?: string; id?: string }) {
  const router = useRouter();
  function go(form: HTMLFormElement) {
    const params = new URLSearchParams();
    for (const [k, v] of new FormData(form)) {
      if (typeof v === "string" && v.trim() !== "") params.append(k, v.trim());
    }
    const qs = params.toString();
    router.push(`${action}${qs ? `?${qs}` : ""}`, { scroll: false });
  }
  return (
    <form
      action={action}
      method="get"
      id={id}
      className={className}
      onSubmit={(e) => {
        e.preventDefault();
        go(e.currentTarget);
      }}
      onChange={(e) => {
        const t = e.target as unknown as HTMLInputElement;
        if (t.type === "checkbox" || t.type === "radio" || t.tagName === "SELECT") go(e.currentTarget);
      }}
    >
      {children}
    </form>
  );
}
