"use client";

import { Bow } from "@/components/decor";
import { Button } from "@/components/ui/button";

/** Something broke while loading a room. Say so gently and offer a retry. */
export default function WorldError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <Bow className="mb-6 w-12 text-rose" />
      <h1 className="font-display text-4xl text-ink">Bir şey yolunda gitmedi</h1>
      <p className="mt-3 max-w-sm text-[15px] leading-relaxed text-muted">
        Bu sayfa şu an açılamadı. Hiçbir şey kaybolmadı; biraz sonra tekrar deneyebilirsin.
      </p>
      <Button className="mt-8" onClick={reset}>
        Tekrar dene
      </Button>
    </div>
  );
}
