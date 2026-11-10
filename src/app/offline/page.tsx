import type { Metadata } from "next";
import { Bow } from "@/components/decor";

export const metadata: Metadata = { title: "Bağlantı yok" };

/** Shown by the service worker when there is no connection. Holds nothing private. */
export default function OfflinePage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <Bow className="mb-6 w-12 text-rose" />
      <p className="eyebrow">Elnare</p>
      <h1 className="mt-3 font-display text-4xl text-ink">Şu an bağlantı yok</h1>
      <p className="mt-3 max-w-sm text-[15px] leading-relaxed text-muted">
        Bu küçük dünya yerinde duruyor. İnternet geri geldiğinde sayfayı yenilemen yeterli.
      </p>
    </main>
  );
}
