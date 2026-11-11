import type { Metadata } from "next";
import { Bow } from "@/components/decor";
import { envIssues } from "@/lib/env";

export const metadata: Metadata = { title: "Kurulum gerekli" };
export const dynamic = "force-dynamic";

/**
 * Shown when the server has no backend to talk to, or its settings are wrong.
 * It says so plainly — the site never pretends with demo data — and names each
 * setting with what is wrong with it, never its value.
 */
export default function UnconfiguredPage() {
  const issues = envIssues();
  return (
    <main className="flex min-h-dvh items-center justify-center px-5 py-16">
      <div className="paper max-w-lg p-8 sm:p-10">
        <Bow className="mb-6 w-12 text-rose-deep" />
        <p className="eyebrow">Elnare</p>
        <h1 className="mt-2 font-display text-4xl text-ink">Sunucu henüz bağlanmadı</h1>
        <p className="mt-4 text-[15px] leading-relaxed text-ink-soft">
          Bu site gerçek bir veritabanıyla çalışır; örnek veriyle açılmaz. Aşağıdaki ayarları düzelt, sonra siteyi yeniden
          yayınla.
        </p>
        {issues.length > 0 ? (
          <ul className="mt-6 space-y-2">
            {issues.map((issue) => (
              <li key={issue.key} className="rounded-lg bg-beige px-4 py-3">
                <span className="block font-mono text-[13px] text-ink">{issue.key}</span>
                <span className="mt-1 block text-[13px] leading-relaxed text-ink-soft">{issue.reason}</span>
              </li>
            ))}
          </ul>
        ) : null}
        <ol className="mt-6 list-decimal space-y-1.5 pl-5 text-sm leading-relaxed text-muted">
          <li>
            Vercel → projen → <span className="text-ink-soft">Settings → Environment Variables</span>: adı ve değeri düzelt.
          </li>
          <li>
            <span className="text-ink-soft">Deployments</span> → en üstteki yayının <span className="text-ink-soft">⋯</span> menüsü →{" "}
            <span className="text-ink-soft">Redeploy</span>. Değişiklik yeniden yayınlamadan geçerli olmaz.
          </li>
        </ol>
        <p className="mt-6 text-sm leading-relaxed text-muted">
          Adım adım anlatım: <span className="font-mono text-[13px]">docs/KURULUM_REHBERI.md</span> → 4. ve 6. adımlar.
        </p>
      </div>
    </main>
  );
}
