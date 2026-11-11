import { Flourish } from "@/components/decor";
import { cn } from "@/lib/cn";
import { formatDate, parseISODate } from "@/lib/dates";
import { categoryLabel } from "../schema";

type Props = {
  title: string;
  body: string;
  category: string;
  writtenOn: string;
  authorName: string;
  fontStyle: "serif" | "hand";
  /** 0 = normal. Each step is one notch larger or smaller. */
  scale?: number;
  className?: string;
};

const SIZES = ["text-[15px]", "text-[17px]", "text-[19px]", "text-[22px]"];
const HAND_SIZES = ["text-[21px]", "text-[24px]", "text-[27px]", "text-[30px]"];

/**
 * The sheet of paper a letter is written on. Used by the reader, by the live
 * preview in the editor and anywhere else a letter is shown, so what Arda
 * sees while writing is exactly what Eln reads.
 */
export function LetterPaper({ title, body, category, writtenOn, authorName, fontStyle, scale = 1, className }: Props) {
  const date = parseISODate(writtenOn);
  const step = Math.min(3, Math.max(0, scale));
  return (
    <article className={cn("paper paper-grain relative px-7 py-10 sm:px-14 sm:py-16", className)}>
      <header className="text-center">
        <p className="eyebrow">{categoryLabel(category)}</p>
        <h1 className="mt-4 font-display text-4xl leading-tight text-ink sm:text-5xl">{title || "Başlıksız"}</h1>
        {date ? <p className="mt-4 text-sm text-taupe">{formatDate(date)}</p> : null}
        <Flourish className="mt-8" />
      </header>

      <div
        className={cn(
          "prose-letter mx-auto mt-10 max-w-[38rem] text-ink-soft",
          fontStyle === "hand"
            ? cn("font-hand leading-[1.65]", HAND_SIZES[step])
            : cn("font-display leading-[1.8] font-normal", SIZES[step + 1 > 3 ? 3 : step + 1]),
        )}
      >
        {body || <span className="text-taupe/70 italic">Mektubun buraya yazılacak…</span>}
      </div>

      <footer className="mx-auto mt-12 max-w-[38rem] text-right">
        <p className="font-hand text-3xl text-accent">— {authorName}</p>
      </footer>
    </article>
  );
}
