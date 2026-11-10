import { ArrowUpRight } from "lucide-react";
import { COPY } from "@/content/copy";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";
import { Countdown } from "@/components/time/countdown";
import { EmptyState } from "@/components/ui/empty-state";
import { timezoneFor } from "@/features/dates/queries";
import { listSpecialDays } from "@/features/days/queries";
import { DAY_LOOK, dayEyebrow } from "@/features/days/theme";
import { whenText } from "@/features/days/when";
import { requireMember } from "@/lib/auth/session";
import { cn } from "@/lib/cn";
import { startOfDayIn } from "@/lib/dates";

export const metadata: Metadata = { title: "Özel Günler" };

export default async function DaysPage() {
  const session = await requireMember();
  const days = await listSpecialDays(session);
  const [featured, ...rest] = days;

  return (
    <>
      <PageHeader eyebrow="Special Days" title="Özel Günler" lead={days.length > 0 ? COPY.days.lead : undefined} />

      <div className="shell space-y-8">
        {!featured ? <EmptyState title={COPY.days.emptyTitle} /> : null}

        {featured ? (
          <Reveal>
            <Link
              href={`/days/${featured.slug}`}
              className={cn("group relative flex flex-col items-center overflow-hidden rounded-[2rem] border border-line px-6 py-14 text-center shadow-lift md:py-20", DAY_LOOK[featured.theme].surface)}
            >
              <div className="mb-6">{DAY_LOOK[featured.theme].motif}</div>
              <p className="eyebrow">{dayEyebrow(featured.theme, session.role)}</p>
              <h2 className="mt-4 font-display text-display leading-none">{featured.title}</h2>
              <p className={cn("mt-5 font-display text-2xl italic", DAY_LOOK[featured.theme].accent)}>
                {whenText(featured).dateText}
                {whenText(featured).ordinal ? ` · ${whenText(featured).ordinal}` : ""}
              </p>
              {featured.showCountdown && whenText(featured).next && !whenText(featured).isToday ? (
                <Countdown
                  className="mt-10 justify-center"
                  target={startOfDayIn(timezoneFor(session, featured.date), whenText(featured).next!).toISOString()}
                />
              ) : (
                <p className="mt-8 font-display text-5xl text-ink italic">{whenText(featured).awayText}</p>
              )}
              <span className="mt-10 inline-flex items-center gap-1.5 text-[13px] font-medium tracking-wide text-ink-soft transition-transform duration-500 ease-soft group-hover:translate-x-1">
                Sayfasını aç <ArrowUpRight className="size-3.5" aria-hidden="true" />
              </span>
            </Link>
          </Reveal>
        ) : null}

        {rest.length > 0 ? (
          <Stagger as="ul" className="grid gap-6 md:grid-cols-3">
            {rest.map((day) => {
              const look = DAY_LOOK[day.theme];
              const when = whenText(day);
              return (
                <StaggerItem as="li" key={day.id}>
                  <Link
                    href={`/days/${day.slug}`}
                    className={cn("group flex h-full min-h-72 flex-col justify-between rounded-[1.75rem] border border-line p-7 shadow-paper transition-[transform,box-shadow] duration-500 ease-soft hover:-translate-y-1 hover:shadow-lift", look.surface)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="eyebrow text-[10px]">{dayEyebrow(day.theme, session.role)}</p>
                      <div className="origin-top-right scale-75">{look.motif}</div>
                    </div>
                    <div>
                      <h2 className="font-display text-3xl leading-tight text-ink">{day.title}</h2>
                      <p className={cn("mt-2 font-display text-xl italic", look.accent)}>{when.dateText}</p>
                      <p className="mt-4 text-sm text-ink-soft">
                        {when.awayText}
                        {when.ordinal ? ` · ${when.ordinal}` : ""}
                      </p>
                    </div>
                  </Link>
                </StaggerItem>
              );
            })}
          </Stagger>
        ) : null}
      </div>
    </>
  );
}
