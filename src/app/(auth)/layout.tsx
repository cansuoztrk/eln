import { Bow, Sparkle } from "@/components/decor";
import { Toaster } from "@/components/ui/toast";

/** The threshold: sign-in, setup and the invitation share this quiet frame. */
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-5 py-12">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,var(--color-blush)_0%,transparent_70%),radial-gradient(40%_40%_at_90%_100%,var(--color-champagne)_0%,transparent_70%)] opacity-70"
      />
      <Sparkle aria-hidden="true" className="absolute top-[14%] left-[12%] size-3 animate-twinkle text-gold" />
      <Sparkle
        aria-hidden="true"
        className="absolute top-[22%] right-[16%] size-2 animate-twinkle text-rose [animation-delay:1.2s]"
      />
      <Sparkle
        aria-hidden="true"
        className="absolute bottom-[18%] left-[20%] size-2.5 animate-twinkle text-rose [animation-delay:2.1s]"
      />

      <main className="relative w-full max-w-md animate-fade-up">
        <header className="mb-8 flex flex-col items-center text-center">
          <Bow className="mb-5 w-14 text-rose-deep" />
          <p className="eyebrow">Beyond Distance</p>
          <p className="mt-2 font-display text-5xl tracking-tight text-ink italic">Elnare</p>
        </header>
        {children}
      </main>
      <Toaster />
    </div>
  );
}
