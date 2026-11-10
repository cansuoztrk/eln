import { Lock } from "lucide-react";
import { Sparkle } from "@/components/decor";
import { cn } from "@/lib/cn";
import type { CoverStyle } from "../schema";

const SHELL: Record<CoverStyle, string> = {
  rose: "from-[#d59aa5] to-[#9c5565] text-pearl",
  blush: "from-[#f9e3e6] to-[#f3c9d1] text-rose-deep",
  champagne: "from-[#f1e4c9] to-[#d9c294] text-[#6f5527]",
  ivory: "from-[#fffdfa] to-[#e6d8c8] text-rosegold",
  nude: "from-[#efdfd3] to-[#d3b8a5] text-ink-soft",
};

/** A time capsule: a small sealed case. It shows a lock until its day. */
export function CapsuleArt({ style, sealed, className }: { style: CoverStyle; sealed: boolean; className?: string }) {
  return (
    <div className={cn("relative grid aspect-[5/3] place-items-center overflow-hidden rounded-[2.5rem] bg-gradient-to-br shadow-lift", SHELL[style], className)} aria-hidden="true">
      <span className="absolute inset-y-0 left-1/2 w-px bg-current opacity-25" />
      <span className="absolute inset-3 rounded-[2rem] border border-current opacity-20" />
      <Sparkle className="absolute top-5 left-7 size-2.5 animate-twinkle opacity-70" />
      <Sparkle className="absolute right-8 bottom-6 size-2 animate-twinkle opacity-60 [animation-delay:1.3s]" />
      <span className="grid size-12 place-items-center rounded-full bg-current/15 backdrop-blur-sm">
        {sealed ? <Lock className="size-5" /> : <Sparkle className="size-5" />}
      </span>
    </div>
  );
}
