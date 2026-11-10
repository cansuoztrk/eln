import type { Metadata } from "next";
import { Bow } from "@/components/decor";
import { missingEnvKeys } from "@/lib/env";

export const metadata: Metadata = { title: "Kurulum gerekli" };
export const dynamic = "force-dynamic";

/**
 * Shown when the server has no backend to talk to. It says so plainly —
 * the site never pretends with demo data.
 */
export default function UnconfiguredPage() {
  const missing = missingEnvKeys();
  return (
    <main className="flex min-h-dvh items-center justify-center px-5 py-16">
      <div className="paper max-w-lg p-8 sm:p-10">
        <Bow className="mb-6 w-12 text-rose-deep" />
        <p className="eyebrow">Elnare</p>
        <h1 className="mt-2 font-display text-4xl text-ink">Sunucu henüz bağlanmadı</h1>
        <p className="mt-4 text-[15px] leading-relaxed text-ink-soft">
          Bu site gerçek bir veritabanıyla çalışır; örnek veriyle açılmaz. Devam etmek için aşağıdaki ortam
          değişkenlerini tanımla ve sunucuyu yeniden başlat.
        </p>
        {missing.length > 0 ? (
          <ul className="mt-6 space-y-2">
            {missing.map((key) => (
              <li key={key} className="rounded-lg bg-beige px-4 py-2.5 font-mono text-[13px] text-ink">
                {key}
              </li>
            ))}
          </ul>
        ) : null}
        <p className="mt-6 text-sm leading-relaxed text-muted">
          Adım adım anlatım: <span className="font-mono text-[13px]">README.md</span> →{" "}
          <span className="italic">Kurulum</span>. Örnek dosya:{" "}
          <span className="font-mono text-[13px]">.env.example</span>
        </p>
      </div>
    </main>
  );
}
