"use client";

import { Bow } from "@/components/decor";
import { Button } from "@/components/ui/button";

/**
 * The last safety net, for anything outside the world's own error page —
 * sign-in, the gift, the Studio — and for moments when the database cannot
 * be reached. It says so calmly and never shows a stack trace.
 */
export default function RootError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <Bow className="mb-6 w-12 text-rose" />
      <h1 className="font-display text-4xl text-ink">Şu an açılamadı</h1>
      <p className="mt-3 max-w-sm text-[15px] leading-relaxed text-muted">
        Bir bağlantı sorunu olmuş olabilir. Hiçbir şey kaybolmadı; birazdan yeniden deneyebilirsin.
      </p>
      <Button className="mt-8" onClick={reset}>
        Tekrar dene
      </Button>
    </main>
  );
}
