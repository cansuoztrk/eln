import type { Metadata } from "next";
import { Flourish, Sparkle } from "@/components/decor";
import { OwnerHint } from "@/components/layout/owner-hint";
import { PageHeader } from "@/components/layout/page-header";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";
import { EmptyState } from "@/components/ui/empty-state";
import { getReasons } from "@/features/reasons/queries";
import { noteCategoryLabel } from "@/features/reasons/schema";
import { people, requireMember } from "@/lib/auth/session";
import { formatDate, parseISODate, weekdayOf } from "@/lib/dates";

export const metadata: Metadata = { title: "365 Not" };

export default async function ReasonsPage() {
  const session = await requireMember();
  const { today, archive, started } = await getReasons(session);
  const { owner } = people(session);
  const nothing = !today && archive.length === 0;

  return (
    <>
      <PageHeader eyebrow="365 Reasons" title="365 Not" align="center" lead={nothing ? undefined : "Her güne küçük bir not. Geçmiş günler aşağıda durur."} />

      <div className="shell-narrow space-y-20">
        {nothing ? (
          <EmptyState art={<Sparkle className="size-6" />} title="Henüz bir not yok">
            İlk not yazıldığında burada görünecek.
          </EmptyState>
        ) : null}

        {session.role === "owner" && (nothing || !started) ? (
          <OwnerHint href="/studio/reasons" label="Notları aç">
            {started ? "Koleksiyonda yayımlanmış not yok." : "Koleksiyon henüz başlatılmadı."} Notları yalnızca sen yazarsın; site senin yerine cümle üretmez.
          </OwnerHint>
        ) : null}

        {today ? (
          <Reveal>
            <article className="paper paper-grain relative px-7 py-14 text-center sm:px-14 sm:py-20">
              <Sparkle className="absolute top-6 left-6 size-3 animate-twinkle text-gold" />
              <Sparkle className="absolute right-7 bottom-7 size-2.5 animate-twinkle text-rose [animation-delay:1.4s]" />
              <p className="eyebrow">Bugünün notu</p>
              <p className="mt-2 text-sm text-taupe">{noteCategoryLabel(today.category)}</p>
              <p className="prose-letter mx-auto mt-8 max-w-xl font-display text-[clamp(1.6rem,4.5vw,2.5rem)] leading-[1.35] text-ink">{today.body}</p>
              <Flourish className="mt-10" />
              <p className="mt-6 font-hand text-3xl text-accent">— {owner.name}</p>
            </article>
          </Reveal>
        ) : !nothing ? (
          <p className="text-center text-muted">Bugün için bir not yok.</p>
        ) : null}

        {archive.length > 0 ? (
          <section aria-labelledby="archive-heading">
            <Reveal>
              <p className="eyebrow">Archive</p>
              <h2 id="archive-heading" className="mt-3 font-display text-display-sm italic">
                Önceki günler
              </h2>
            </Reveal>
            <Stagger as="ol" stagger={0.04} className="mt-8 divide-y divide-line border-y border-line">
              {archive.map((note) => {
                const date = parseISODate(note.day)!;
                return (
                  <StaggerItem as="li" key={note.day} className="grid gap-2 py-6 sm:grid-cols-[9rem_1fr] sm:gap-8">
                    <p className="text-[13px] text-taupe">
                      <span className="block font-display text-xl text-ink-soft">{formatDate({ month: date.month, day: date.day })}</span>
                      {weekdayOf(date)} · {date.year}
                    </p>
                    <p className="prose-letter font-display text-xl leading-relaxed text-ink-soft">{note.body}</p>
                  </StaggerItem>
                );
              })}
            </Stagger>
          </section>
        ) : null}
      </div>
    </>
  );
}
