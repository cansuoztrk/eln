import type { CSSProperties, ReactNode } from "react";
import { WaxSeal } from "@/components/decor";
import { cn } from "@/lib/cn";
import type { EnvelopeStyle, Seal } from "../schema";

const PALETTE: Record<EnvelopeStyle, { back: string; pocket: string; fold: string; flap: string; seal: string }> = {
  blush: { back: "#f1c3cc", pocket: "#f9e3e6", fold: "#f5d3d9", flap: "#f3c9d1", seal: "#9c5565" },
  rose: { back: "#c98b96", pocket: "#e3b5bd", fold: "#dba7b1", flap: "#d59aa5", seal: "#7d3f4f" },
  ivory: { back: "#e6d8c8", pocket: "#fbf7f2", fold: "#f3eae0", flap: "#efe4d7", seal: "#b98a78" },
  champagne: { back: "#d9c294", pocket: "#f1e4c9", fold: "#ead9bb", flap: "#e3cfa9", seal: "#8a6a3c" },
  nude: { back: "#d3b8a5", pocket: "#efdfd3", fold: "#e8d5c7", flap: "#e0c9b9", seal: "#9c5565" },
};

type Props = {
  styleName: EnvelopeStyle;
  seal: Seal;
  /** `open` lifts the flap and lets the paper rise. */
  state?: "closed" | "open";
  /** A sealed envelope keeps its wax even on hover and cannot be opened. */
  sealed?: boolean;
  /** Lifts the flap slightly on hover — for envelopes in a list. */
  interactive?: boolean;
  /** Shown on the sheet that rises out of the envelope. */
  paper?: ReactNode;
  className?: string;
};

/**
 * An envelope built from four folded shapes, so it can actually open: the flap
 * turns on its top edge and the sheet slides up from the pocket.
 */
export function Envelope({ styleName, seal, state = "closed", sealed, interactive, paper, className }: Props) {
  const c = PALETTE[styleName];
  const open = state === "open";
  const vars = { "--env-back": c.back, "--env-pocket": c.pocket, "--env-fold": c.fold, "--env-flap": c.flap } as CSSProperties;

  return (
    <div
      style={vars}
      className={cn(
        "group/env relative aspect-[3/2] w-full [perspective:1400px]",
        "drop-shadow-[0_18px_28px_rgb(74_59_55/0.16)]",
        className,
      )}
    >
      <div className="absolute inset-0 rounded-[10px] bg-(--env-back)" />

      {/* The sheet inside. */}
      <div
        className={cn(
          "absolute inset-x-[7%] top-[10%] h-[82%] overflow-hidden rounded-[3px] bg-pearl shadow-paper",
          "transition-transform duration-[1100ms] ease-soft",
          open ? "-translate-y-[58%] delay-500" : "translate-y-0",
        )}
      >
        <div className="paper-grain size-full p-[7%]">{paper}</div>
      </div>

      {/* The pocket: left, right and bottom folds. */}
      <div
        className="absolute inset-0 rounded-[10px] bg-(--env-pocket) [clip-path:polygon(0_0,50%_54%,100%_0,100%_100%,0_100%)]"
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 rounded-[10px] bg-(--env-fold) [clip-path:polygon(0_100%,50%_46%,100%_100%)]"
        aria-hidden="true"
      />

      {/* The flap. */}
      <div
        aria-hidden="true"
        className={cn(
          "absolute inset-x-0 top-0 h-[58%] origin-top transition-transform duration-[900ms] ease-silk [transform-style:preserve-3d]",
          open
            ? "z-0 [transform:rotateX(180deg)]"
            : interactive && !sealed
              ? "z-10 group-hover/env:[transform:rotateX(24deg)]"
              : "z-10",
        )}
      >
        <div className="size-full bg-(--env-flap) [clip-path:polygon(0_0,100%_0,50%_100%)] [filter:drop-shadow(0_2px_3px_rgb(74_59_55/0.18))]" />
      </div>

      <div
        aria-hidden="true"
        className={cn(
          "absolute top-[56%] left-1/2 z-20 -translate-x-1/2 -translate-y-1/2 transition-[opacity,transform] duration-500 ease-soft",
          open ? "scale-50 opacity-0" : "scale-100 opacity-100",
          interactive && !sealed && "group-hover/env:-translate-y-[62%] group-hover/env:scale-95",
        )}
      >
        <WaxSeal glyph={seal} className="size-[clamp(2.25rem,16%,4rem)]" style={{ color: c.seal }} />
      </div>
    </div>
  );
}
