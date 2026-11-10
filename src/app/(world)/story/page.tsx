import type { Metadata } from "next";
import { COPY } from "@/content/copy";
import Link from "next/link";
import { Sparkle } from "@/components/decor";
import { OwnerHint } from "@/components/layout/owner-hint";
import { PageHeader } from "@/components/layout/page-header";
import { Reveal } from "@/components/motion/reveal";
import { StarField } from "@/components/motion/star-field";
import { DATE_KEYS } from "@/content/facts";
import { getSection } from "@/features/content/queries";
import { listDates, viewerToday } from "@/features/dates/queries";
import { ChapterHeading } from "@/features/story/components/chapter";
import { MemoryCard } from "@/features/story/components/memory-card";
import { listMemories, type Memory } from "@/features/story/queries";
import { people, requireMember } from "@/lib/auth/session";
import { compareDates, daysBetween, describeDate, formatDate, formatDaysUntil, fullDate, parseISODate } from "@/lib/dates";

export const metadata: Metadata = { title: "Hikâyemiz" };

function Memories({ items, start, fallbackAlt, anchor }: { items: Memory[]; start: number; fallbackAlt: string; anchor?: string }) {
  if (items.length === 0) return null;
  return (
    <div className="shell space-y-24 pb-8 md:space-y-36">
      {items.map((memory, i) => (
        <MemoryCard
          key={memory.id}
          memory={memory}
          index={start + i}
          fallbackAlt={fallbackAlt}
          anchored={Boolean(anchor) && memory.relationshipDateKey === anchor}
        />
      ))}
    </div>
  );
}

export default async function StoryPage() {
  const session = await requireMember();
  const [memories, dates, intro, interlude] = await Promise.all([
    listMemories(session),
    listDates(session),
    getSection(session, "story.intro"),
    getSection(session, "story.interlude"),
  ]);
  const { partner } = people(session);
  const owner = session.role === "owner";
  const today = viewerToday(session);

  const metRow = dates.find((d) => d.key === DATE_KEYS.met);
  const togetherRow = dates.find((d) => d.key === DATE_KEYS.together);
  const meetingRow = dates.find((d) => d.key === DATE_KEYS.firstMeeting);
  const met = metRow ? fullDate(metRow) : null;
  const together = togetherRow ? fullDate(togetherRow) : null;

  const dated = memories.filter((m) => m.happenedOn);
  const undated = memories.filter((m) => !m.happenedOn);
  const on = (m: Memory) => parseISODate(m.happenedOn)!;

  // With both dates known the story has three movements; otherwise it is told as one.
  const chaptered = Boolean(met && together);
  const first = chaptered ? dated.filter((m) => compareDates(on(m), met!) <= 0) : [];
  const between = chaptered ? dated.filter((m) => compareDates(on(m), met!) > 0 && compareDates(on(m), together!) < 0) : [];
  const second = chaptered ? dated.filter((m) => compareDates(on(m), together!) >= 0) : dated;
  const gap = met && together ? daysBetween(met, together) : null;
  const meeting = meetingRow ? describeDate(meetingRow, today) : { kind: "unknown" as const };

  return (
    <>
      <PageHeader eyebrow="Our Story" title="Hikâyemiz" align="center" lead={intro.note || undefined} />

      {chaptered ? (
        <>
          <ChapterHeading eyebrow="Chapter One" title={metRow!.label} date={met} />
          <Memories items={first} start={0} fallbackAlt={partner.fullName} anchor={DATE_KEYS.met} />

          {/* The days in between: counted, never described for him. */}
          <section aria-labelledby="interlude-heading" className="dusk relative my-24 overflow-hidden py-28 text-center md:my-36 md:py-40">
            <StarField tone="dusk" density={0.8} />
            <div className="shell-narrow relative">
              <Reveal>
                <p className="eyebrow">In between</p>
                <p className="mt-6 font-display text-[clamp(6rem,24vw,14rem)] leading-[0.85] text-pearl tabular-nums">{gap}</p>
                <h2 id="interlude-heading" className="mt-4 font-display text-display-sm italic">
                  gün
                </h2>
                <p className="mx-auto mt-6 max-w-md text-pearl/70">
                  {formatDate(met!)} ile {formatDate(together!)} arasında.
                </p>
              </Reveal>
              {interlude.note ? (
                <Reveal delay={0.2}>
                  <p className="prose-letter mx-auto mt-12 max-w-xl font-display text-xl leading-[1.8] text-pearl/90 italic">{interlude.note}</p>
                </Reveal>
              ) : null}
            </div>
          </section>
          {owner && !interlude.note && between.length === 0 ? (
            <div className="shell -mt-12 pb-16 md:-mt-20">
              <OwnerHint href="/studio/story/new" label="Anı ekle">
                Bu {gap} güne ait anıları ve o döneme dair notunu yalnızca sen yazabilirsin.
              </OwnerHint>
            </div>
          ) : null}
          <Memories items={between} start={first.length} fallbackAlt={partner.fullName} />

          <ChapterHeading eyebrow="Chapter Two" title={togetherRow!.label} date={together} />
        </>
      ) : null}

      <Memories
        items={second}
        start={first.length + between.length}
        fallbackAlt={partner.fullName}
        anchor={chaptered ? DATE_KEYS.together : undefined}
      />

      {undated.length > 0 ? (
        <section aria-labelledby="undated-heading" className="pt-24">
          <header className="shell pb-12 text-center">
            <p className="eyebrow">Undated</p>
            <h2 id="undated-heading" className="mt-3 font-display text-display-sm italic">
              Günü belli olmayanlar
            </h2>
          </header>
          <Memories items={undated} start={0} fallbackAlt={partner.fullName} />
        </section>
      ) : null}

      {/* The chapter that has not been written yet. */}
      <section aria-labelledby="meet-heading" className="shell pt-32 text-center md:pt-44">
        <Reveal>
          <Sparkle className="mx-auto mb-8 size-4 animate-twinkle text-rose" />
          <p className="eyebrow">The Day We Finally Meet</p>
          <h2 id="meet-heading" className="mt-4 font-display text-display leading-none">
            {meetingRow?.happened ? "Buluştuğumuz gün" : "Buluşacağımız gün"}
          </h2>
          <p className="mx-auto mt-6 max-w-md text-lg leading-relaxed text-muted">
            {meeting.kind === "upcoming"
              ? `${formatDate(meeting.date)} · ${formatDaysUntil(meeting.daysUntil)}`
              : meeting.kind === "past" && meetingRow?.happened
                ? formatDate(meeting.date)
                : COPY.story.meetingUnknown}
          </p>
          <Link href="/distance#meeting" className="mt-8 inline-block text-[13px] font-medium tracking-wide text-accent underline-offset-4 hover:underline">
            Mesafe sayfasına git
          </Link>
        </Reveal>
      </section>

      {session.role === "partner" ? (
        <p className="shell pt-20 text-center text-sm text-muted">
          {COPY.story.addOwn}{" "}
          <Link href="/story/write" className="text-accent underline-offset-4 hover:underline">
            Bir anı yaz
          </Link>
        </p>
      ) : null}
    </>
  );
}
