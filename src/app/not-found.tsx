import Link from "next/link";
import { Sparkle } from "@/components/decor";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <Sparkle className="mb-6 size-5 text-rose" />
      <p className="eyebrow">404</p>
      <h1 className="mt-3 font-display text-5xl text-ink">Burada bir şey yok</h1>
      <p className="mt-3 max-w-sm text-[15px] leading-relaxed text-muted">
        Aradığın sayfa taşınmış ya da hiç var olmamış olabilir.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex h-11 items-center rounded-full bg-ink px-6 text-sm font-medium text-pearl transition-colors hover:bg-ink-soft"
      >
        Ana sayfaya dön
      </Link>
    </main>
  );
}
