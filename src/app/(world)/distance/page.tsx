import type { Metadata } from "next";
import { Heart, Sparkle } from "@/components/decor";
import { OwnerHint } from "@/components/layout/owner-hint";
import { LightThread } from "@/components/motion/light-thread";
import { Reveal, Stagger, StaggerItem, WordReveal } from "@/components/motion/reveal";
import { StarField } from "@/components/motion/star-field";
import { Countdown } from "@/components/time/countdown";
import { DATE_KEYS } from "@/content/facts";
import { getSection } from "@/features/content/queries";
import { getDate, viewerToday } from "@/features/dates/queries";
import { CityCard } from "@/features/distance/components/city-card";
import { DeleteNoteButton, NoteComposer } from "@/features/distance/components/notes";
import { SharedSky } from "@/features/distance/components/shared-sky";
import { listNotes } from "@/features/distance/queries";
import { people, requireMember } from "@/lib/auth/session";
import { describeDate, formatDate, formatDaysUntil, formatNumber, startOfDayIn, todayIn, zoneDifferenceMinutes } from "@/lib/dates";
import { BAKU, distanceKm, ISTANBUL } from "@/lib/dates/sky";

export const metadata: Metadata = { title: "Mesafe" };

export default async function DistancePage() {
  const session = await requireMember();
  const { owner, partner, me } = people(session);
  const now = new Date();

  const [intro, meetingNote, notes, longings, meetingRow] = await Promise.all([
    getSection(session, "distance.intro"),
    getSection(session, "meeting.note"),
    listNotes(session, "note"),
    listNotes(session, "longing"),
    getDate(session, DATE_KEYS.firstMeeting),
  ]);

  // Two facts about two cities: how far apart, and how many hours.
  const km = Math.round(distanceKm(ISTANBUL, BAKU) / 10) * 10;
  const gapMinutes = Math.abs(zoneDifferenceMinutes(owner.timezone, partner.timezone, now));
  const gap = gapMinutes % 60 === 0 ? `${gapMinutes / 60} saat` : `${Math.floor(gapMinutes / 60)} saat ${gapMinutes % 60} dakika`;

  const meeting = meetingRow ? describeDate(meetingRow, viewerToday(session, now)) : { kind: "unknown" as const };
  const happened = Boolean(meetingRow?.happened);
  const day = (iso: string) => formatDate(todayIn(me.timezone, new Date(iso)));

  return (
    <>
      <section className="dusk relative overflow-hidden pt-32 pb-20 md:pt-44 md:pb-28">
        <StarField tone="dusk" />
        <div className="shell relative text-center">
          <Reveal y={10}>
            <p className="eyebrow">Beyond Distance</p>
          </Reveal>
          <h1 className="mt-5 font-display text-display-lg leading-[0.9] italic">
            <WordReveal text="Mesafe" delay={0.15} />
          </h1>
          <Reveal delay={0.4}>
            <p className="mx-auto mt-6 max-w-md font-display text-2xl text-pearl/85">İki şehir, iki hayat, tek bir hikâye.</p>
          </Reveal>

          <Reveal delay={0.55} className="mx-auto mt-12 max-w-3xl">
            <LightThread tone="dusk" labels={[owner.city, partner.city]} />
          </Reveal>

          <Stagger className="mx-auto mt-10 grid max-w-xl grid-cols-2 gap-6">
            <StaggerItem>
              <p className="font-display text-5xl text-pearl tabular-nums md:text-6xl">≈ {formatNumber(km)}</p>
              <p className="eyebrow mt-2">kilometre</p>
            </StaggerItem>
            <StaggerItem>
              <p className="font-display text-5xl text-pearl md:text-6xl">{gap}</p>
              <p className="eyebrow mt-2">saat farkı</p>
            </StaggerItem>
          </Stagger>

          {intro.note ? (
            <Reveal delay={0.2}>
              <p className="prose-letter mx-auto mt-14 max-w-xl font-display text-xl leading-[1.8] text-pearl/90 italic">{intro.note}</p>
            </Reveal>
          ) : null}
        </div>
      </section>

      <section aria-labelledby="cities-heading" className="shell py-20 md:py-28">
        <Reveal>
          <p className="eyebrow">Two cities</p>
          <h2 id="cities-heading" className="mt-3 font-display text-display-sm italic">
            Şu an
          </h2>
        </Reveal>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <Reveal>
            <CityCard city="istanbul" cityName={owner.city} personName={owner.name} timeZone={owner.timezone} />
          </Reveal>
          <Reveal delay={0.12}>
            <CityCard city="baku" cityName={partner.city} personName={partner.name} timeZone={partner.timezone} />
          </Reveal>
        </div>
      </section>

      <section aria-labelledby="sky-heading" className="shell pb-20 md:pb-28">
        <Reveal>
          <p className="eyebrow">The same sky</p>
          <h2 id="sky-heading" className="mt-3 font-display text-display-sm italic">
            Aynı gökyüzü
          </h2>
        </Reveal>
        <Reveal delay={0.1} className="mt-10">
          <SharedSky leftName={owner.city} rightName={partner.city} />
        </Reveal>
      </section>

      <section aria-labelledby="notes-heading" className="bg-beige/50 py-20 md:py-28">
        <div className="shell grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <Reveal>
              <p className="eyebrow">Notes</p>
              <h2 id="notes-heading" className="mt-3 font-display text-display-sm italic">
                Birbirimize notlar
              </h2>
              <p className="mt-4 max-w-sm text-muted">Kısa bir cümle, bir selam, akla gelen bir şey. Yazmak da okumak da isteğe bağlı.</p>
            </Reveal>
            <Reveal delay={0.1} className="mt-8">
              <NoteComposer kind="note" label="Yeni not" placeholder="Bir not bırak…" submitLabel="Bırak" />
            </Reveal>
          </div>
          {notes.length === 0 ? (
            <p className="self-center text-center text-muted lg:text-left">Henüz not yok.</p>
          ) : (
            <Stagger as="ul" className="columns-1 gap-5 sm:columns-2 [&>li]:mb-5 [&>li]:break-inside-avoid">
              {notes.map((note, i) => (
                <StaggerItem as="li" key={note.id}>
                  <article className={`paper relative p-5 ${i % 3 === 0 ? "-rotate-1" : i % 3 === 1 ? "rotate-1" : ""}`}>
                    <p className="prose-letter font-hand text-[23px] leading-snug text-ink-soft">{note.body}</p>
                    <footer className="mt-4 flex items-center justify-between gap-2 text-[12px] text-taupe">
                      <span>
                        <span className={note.authorRole === "owner" ? "text-rosegold" : "text-accent"}>{note.authorName}</span> · {day(note.createdAt)}
                      </span>
                      {note.mine ? <DeleteNoteButton id={note.id} /> : null}
                    </footer>
                  </article>
                </StaggerItem>
              ))}
            </Stagger>
          )}
        </div>
      </section>

      <section aria-labelledby="longing-heading" className="shell-narrow py-20 md:py-28">
        <Reveal className="text-center">
          <Heart className="mx-auto mb-5 size-4 text-rose" />
          <p className="eyebrow">Longing journal</p>
          <h2 id="longing-heading" className="mt-3 font-display text-display-sm italic">
            Özlem günlüğü
          </h2>
        </Reveal>
        <Reveal delay={0.1} className="mt-10">
          <NoteComposer kind="longing" label="Özlem günlüğüne yaz" placeholder="Bugünden bir satır…" submitLabel="Günlüğe ekle" />
        </Reveal>
        {longings.length > 0 ? (
          <ol className="mt-12 space-y-8 border-l border-line-strong pl-6">
            {longings.map((entry) => (
              <li key={entry.id} className="relative">
                <span aria-hidden="true" className="absolute top-2 -left-[1.72rem] size-2 rounded-full bg-rose ring-4 ring-ivory" />
                <Reveal>
                  <p className="flex items-center justify-between gap-2 text-[12px] tracking-wide text-taupe">
                    <span>
                      {day(entry.createdAt)} · {entry.authorName}
                    </span>
                    {entry.mine ? <DeleteNoteButton id={entry.id} /> : null}
                  </p>
                  <p className="prose-letter mt-1 font-display text-xl leading-relaxed text-ink-soft">{entry.body}</p>
                </Reveal>
              </li>
            ))}
          </ol>
        ) : null}
      </section>

      {/* The Day We Finally Meet: counts only when there is a real date to count to. */}
      <section id="meeting" aria-labelledby="meeting-heading" className="dusk relative scroll-mt-20 overflow-hidden py-24 text-center md:py-36">
        <StarField tone="dusk" density={0.7} />
        <div className="shell-narrow relative">
          <Reveal>
            <Sparkle className="mx-auto mb-7 size-5 animate-twinkle text-champagne" />
            <p className="eyebrow">The Day We Finally Meet</p>
            <h2 id="meeting-heading" className="mt-4 font-display text-display leading-none italic">
              {happened ? "Buluştuğumuz gün" : "Buluşacağımız gün"}
            </h2>
          </Reveal>

          {meeting.kind === "upcoming" ? (
            <Reveal delay={0.15}>
              <p className="mt-8 font-display text-3xl text-pearl">{formatDate(meeting.date)}</p>
              <p className="mt-2 text-pearl/70">{formatDaysUntil(meeting.daysUntil)}</p>
              <Countdown
                tone="dusk"
                target={startOfDayIn(session.profile.timezone, meeting.date).toISOString()}
                doneLabel="Bugün"
                className="mt-10 justify-center"
              />
            </Reveal>
          ) : meeting.kind === "past" && happened ? (
            <Reveal delay={0.15}>
              <p className="mt-8 font-display text-4xl text-pearl">{formatDate(meeting.date)}</p>
            </Reveal>
          ) : meeting.kind === "past" ? (
            <Reveal delay={0.15}>
              <p className="mx-auto mt-8 max-w-md text-lg leading-relaxed text-pearl/80">
                Belirlenen tarih ({formatDate(meeting.date)}) geçti. Bu bölüm, gerçekten buluştuğumuzda güncellenecek.
              </p>
            </Reveal>
          ) : (
            <Reveal delay={0.15}>
              <p className="mx-auto mt-8 max-w-md text-lg leading-relaxed text-pearl/80">
                Henüz bir tarihi yok. Belli olduğu gün, burada geri sayım başlayacak.
              </p>
            </Reveal>
          )}

          {meetingNote.note ? (
            <Reveal delay={0.25}>
              <p className="prose-letter mx-auto mt-12 max-w-xl font-display text-xl leading-[1.8] text-pearl/90 italic">{meetingNote.note}</p>
            </Reveal>
          ) : null}
        </div>
      </section>

      {session.role === "owner" && meeting.kind === "unknown" ? (
        <div className="shell pt-10">
          <OwnerHint href="/studio/days" label="Tarihleri aç">
            Buluşma tarihi belli olduğunda buradan girersin; sayaç ancak o zaman çalışır.
          </OwnerHint>
        </div>
      ) : null}
    </>
  );
}
