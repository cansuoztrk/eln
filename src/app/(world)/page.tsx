import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { Flourish, Sparkle } from "@/components/decor";
import { OwnerHint } from "@/components/layout/owner-hint";
import { SmartImage } from "@/components/media/smart-image";
import { Parallax } from "@/components/motion/parallax";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";
import { WORLD_NAV } from "@/content/navigation";
import { DATE_KEYS } from "@/content/facts";
import { getSection } from "@/features/content/queries";
import { listDates, viewerToday } from "@/features/dates/queries";
import { daysAway, listSpecialDays } from "@/features/days/queries";
import { listGalleryPhotos } from "@/features/gallery/queries";
import { FirstVisit } from "@/features/home/components/first-visit";
import { Hero } from "@/features/home/components/hero";
import { Tonight } from "@/features/home/components/tonight";
import { getHiddenRooms } from "@/features/home/queries";
import { Envelope } from "@/features/letters/components/envelope";
import { listLetters } from "@/features/letters/queries";
import { getReasons } from "@/features/reasons/queries";
import { people, requireMember } from "@/lib/auth/session";
import { cn } from "@/lib/cn";
import {
  daysBetween,
  elapsed,
  formatDate,
  formatDaysUntil,
  formatElapsed,
  formatNumber,
  fullDate,
  type PlainDate,
} from "@/lib/dates";

export default async function HomePage() {
  const session = await requireMember();
  const { owner, partner, me } = people(session);
  const today = viewerToday(session);

  const [hero, dates, specialDays, favourites, letters, reasons, hiddenRooms] = await Promise.all([
    getSection(session, "home.hero"),
    listDates(session),
    listSpecialDays(session),
    listGalleryPhotos(session, { favorites: true }),
    listLetters(session),
    getReasons(session),
    getHiddenRooms(session),
  ]);
  const photos = favourites.length > 0 ? favourites : await listGalleryPhotos(session);
  const featured = photos.slice(0, 3);

  // Only real, fully known dates in the past are ever counted from.
  const since = (key: string): { date: PlainDate; days: number } | null => {
    const found = dates.find((d) => d.key === key);
    const date = found ? fullDate(found) : null;
    if (!date || !found?.happened) return null;
    const days = daysBetween(date, today);
    return days >= 0 ? { date, days } : null;
  };
  const met = since(DATE_KEYS.met);
  const together = since(DATE_KEYS.together);
  const between = met && together ? daysBetween(met.date, together.date) : null;

  const nextDay = specialDays.find((day) => Number.isFinite(daysAway(day)));
  const fromOther = letters.open.filter((letter) => !letter.mine);
  const latestLetter = (session.role === "partner" ? fromOther : letters.open)[0];

  return (
    <>
      {session.role === "partner" ? <FirstVisit /> : null}

      <Hero greetingName={me.name} headline={hero.headline} note={hero.note} owner={owner} partner={partner} />

      {session.role === "owner" && photos.length === 0 && letters.open.length === 0 ? (
        <div className="shell pb-16">
          <OwnerHint href="/studio" label="Studio'ya git">
            Dünya hazır ama henüz boş. Fotoğrafları, mektupları ve açılışı Studio&apos;dan doldurabilirsin.
          </OwnerHint>
        </div>
      ) : null}

      {/* Today: the part of the home page that is different every day. */}
      <section aria-labelledby="today-heading" className="shell pb-6 md:pb-10">
        <h2 id="today-heading" className="sr-only">
          Bugün
        </h2>
        <div className={reasons.today ? "grid gap-6 md:grid-cols-[1.35fr_1fr]" : "mx-auto max-w-xl"}>
          {reasons.today ? (
            <Reveal>
              <Link href="/reasons" className="paper paper-grain group flex h-full min-h-56 flex-col justify-center px-7 py-10 text-center sm:px-12">
                <p className="eyebrow">Bugünün notu</p>
                <p className="prose-letter mx-auto mt-5 max-w-lg font-display text-[clamp(1.5rem,3.4vw,2.1rem)] leading-[1.35] text-ink">{reasons.today.body}</p>
                <p className="mt-5 font-hand text-2xl text-accent">— {owner.name}</p>
              </Link>
            </Reveal>
          ) : null}
          <Reveal delay={0.1}>
            <Tonight ownerCity={owner.city} partnerCity={partner.city} />
          </Reveal>
        </div>
      </section>

      {met || together ? (
        <section aria-labelledby="since-heading" className="shell py-20 md:py-28">
          <Reveal>
            <p className="eyebrow text-center">Since</p>
            <h2 id="since-heading" className="sr-only">
              Geçen zaman
            </h2>
          </Reveal>
          <Stagger className="mt-10 grid gap-12 text-center md:grid-cols-2 md:gap-6">
            {met ? (
              <StaggerItem>
                <p className="font-display text-[clamp(4.5rem,14vw,9rem)] leading-none text-ink tabular-nums">
                  {formatNumber(met.days)}
                </p>
                <p className="mt-3 font-display text-2xl text-ink-soft italic">gündür tanışıyoruz</p>
                <p className="mt-2 text-sm text-taupe">{formatDate(met.date)} tarihinden bugüne</p>
              </StaggerItem>
            ) : null}
            {together ? (
              <StaggerItem>
                <p className="font-display text-[clamp(4.5rem,14vw,9rem)] leading-none text-accent tabular-nums">
                  {formatNumber(together.days)}
                </p>
                <p className="mt-3 font-display text-2xl text-ink-soft italic">gündür birlikteyiz</p>
                <p className="mt-2 text-sm text-taupe">
                  {formatDate(together.date)} tarihinden bugüne · {formatElapsed(elapsed(together.date, today))}
                </p>
              </StaggerItem>
            ) : null}
          </Stagger>
        </section>
      ) : null}

      {nextDay && (nextDay.when.kind === "recurring" || nextDay.when.kind === "upcoming") ? (
        <section aria-labelledby="next-day-heading" className="shell pb-20 md:pb-28">
          <Reveal>
            <Link
              href={`/days/${nextDay.slug}`}
              className="group dusk relative mx-auto flex max-w-4xl flex-col items-center overflow-hidden rounded-[2rem] px-8 py-14 text-center shadow-lift md:py-20"
            >
              <Sparkle className="absolute top-8 left-10 size-3 animate-twinkle text-champagne" />
              <Sparkle className="absolute right-12 bottom-10 size-4 animate-twinkle text-powder [animation-delay:1.6s]" />
              <p className="eyebrow">Next special day</p>
              <h2 id="next-day-heading" className="mt-4 font-display text-display-sm italic">
                {nextDay.title}
              </h2>
              <p className="mt-6 font-display text-[clamp(3.5rem,11vw,7rem)] leading-none text-pearl">
                {nextDay.when.kind === "recurring" && nextDay.when.isToday
                  ? "Bugün"
                  : formatDaysUntil(daysAway(nextDay)).replace(" sonra", "")}
              </p>
              <p className="mt-4 text-sm text-pearl/70">
                {formatDate(nextDay.when.kind === "recurring" ? nextDay.when.next : nextDay.when.date)}
              </p>
              <span className="mt-8 inline-flex items-center gap-1.5 text-[13px] font-medium tracking-wide text-champagne transition-transform duration-500 ease-soft group-hover:translate-x-1">
                Özel günler <ArrowUpRight className="size-3.5" aria-hidden="true" />
              </span>
            </Link>
          </Reveal>
        </section>
      ) : null}

      {featured.length > 0 ? (
        <section aria-labelledby="photos-heading" className="shell py-12 md:py-20">
          <div className="flex items-end justify-between gap-6">
            <Reveal>
              <p className="eyebrow">Eln&apos;s Gallery</p>
              <h2 id="photos-heading" className="mt-3 font-display text-display-sm italic">
                Fotoğraflar
              </h2>
            </Reveal>
            <Link href="/gallery" className="text-[13px] font-medium tracking-wide text-accent underline-offset-4 hover:underline">
              Tümünü gör
            </Link>
          </div>
          {/* On a phone: one photograph large, the next two side by side. Three across from a tablet up. */}
          <div className="mt-10 grid grid-cols-2 items-start gap-4 sm:grid-cols-3 sm:gap-8">
            {featured.map((photo, i) => (
              <Parallax
                key={photo.id}
                distance={i === 1 ? 70 : 30}
                className={cn(i === 0 && featured.length !== 2 && "col-span-2 sm:col-span-1", i === 1 && "sm:mt-16", i === 2 && "mt-10 sm:mt-0")}
              >
                <Reveal delay={i * 0.12}>
                  <Link href="/gallery" className="group block">
                    <SmartImage
                      image={photo.image}
                      alt={photo.altText || photo.caption || `${partner.fullName}`}
                      sizes={i === 0 ? "(min-width: 640px) 30vw, 100vw" : "(min-width: 640px) 30vw, 46vw"}
                      priority={i === 0}
                      className="rounded-[4px] shadow-paper transition-shadow duration-500 group-hover:shadow-lift"
                    />
                    {photo.caption ? (
                      <p className="mt-3 font-display text-base leading-snug text-ink-soft italic sm:text-lg">{photo.caption}</p>
                    ) : null}
                  </Link>
                </Reveal>
              </Parallax>
            ))}
          </div>
        </section>
      ) : null}

      {met && together && between !== null ? (
        <section aria-labelledby="story-heading" className="shell py-20 md:py-28">
          <Reveal>
            <p className="eyebrow text-center">Our Story</p>
            <h2 id="story-heading" className="sr-only">
              Hikâyemiz
            </h2>
          </Reveal>
          <Link href="/story" className="group mt-10 grid items-center gap-8 text-center md:grid-cols-[1fr_auto_1fr]">
            <Reveal>
              <p className="font-display text-[clamp(5rem,18vw,5.5rem)] leading-none text-ink transition-colors group-hover:text-accent md:text-display">
                {met.date.day}
              </p>
              <p className="mt-2 font-display text-2xl text-ink-soft italic">{formatDate(met.date).replace(/^\d+ /, "")}</p>
              <p className="mt-3 text-sm text-taupe">Tanıştığımız gün</p>
            </Reveal>
            <Reveal delay={0.12}>
              <p className="font-hand text-3xl text-rose">{between} gün</p>
              <Flourish className="mt-2" />
            </Reveal>
            <Reveal delay={0.24}>
              <p className="font-display text-[clamp(5rem,18vw,5.5rem)] leading-none text-ink transition-colors group-hover:text-accent md:text-display">
                {together.date.day}
              </p>
              <p className="mt-2 font-display text-2xl text-ink-soft italic">
                {formatDate(together.date).replace(/^\d+ /, "")}
              </p>
              <p className="mt-3 text-sm text-taupe">Sevgili olduğumuz gün</p>
            </Reveal>
          </Link>
        </section>
      ) : null}

      {latestLetter || letters.sealed.length > 0 ? (
        <section aria-labelledby="letters-heading" className="bg-beige/50 py-20 md:py-28">
          <div className="shell grid items-center gap-12 md:grid-cols-2">
            <Reveal className="mx-auto w-full max-w-sm">
              <Link href={latestLetter ? `/letters/${latestLetter.id}` : "/letters"} className="block">
                <Envelope
                  styleName={latestLetter?.envelopeStyle ?? letters.sealed[0].envelopeStyle}
                  seal={latestLetter?.seal ?? letters.sealed[0].seal}
                  interactive={Boolean(latestLetter)}
                  sealed={!latestLetter}
                />
              </Link>
            </Reveal>
            <Reveal delay={0.15} className="text-center md:text-left">
              <p className="eyebrow">Letters</p>
              <h2 id="letters-heading" className="mt-3 font-display text-display-sm italic">
                {latestLetter ? latestLetter.title : "Günü gelince"}
              </h2>
              <p className="mt-4 text-muted">
                {letters.open.length > 0 ? `${letters.open.length} mektup` : null}
                {letters.open.length > 0 && letters.sealed.length > 0 ? " · " : null}
                {letters.sealed.length > 0 ? `${letters.sealed.length} mühürlü zarf` : null}
              </p>
              <Link
                href="/letters"
                className="mt-7 inline-flex h-11 items-center rounded-full bg-ink px-6 text-sm font-medium text-pearl transition-colors hover:bg-ink-soft"
              >
                Mektuplara git
              </Link>
            </Reveal>
          </div>
        </section>
      ) : null}

      <section aria-labelledby="rooms-heading" className="shell py-20 md:py-28">
        <Reveal>
          <p className="eyebrow">The whole world</p>
          <h2 id="rooms-heading" className="mt-3 font-display text-display-sm italic">
            Bu dünyada neler var
          </h2>
        </Reveal>
        <Stagger as="ul" stagger={0.05} className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-line bg-line lg:grid-cols-3">
          {WORLD_NAV.filter((room) => !hiddenRooms.includes(room.href)).map((room) => (
            <StaggerItem as="li" key={room.href} className="bg-ivory">
              <Link
                href={room.href}
                className="group flex h-full min-h-28 flex-col justify-between gap-4 p-4 transition-colors duration-500 hover:bg-accent-wash sm:min-h-36 sm:gap-6 sm:p-6 md:p-7"
              >
                <span className="flex items-start justify-between gap-3">
                  <span className="eyebrow text-[9px] sm:text-[10px]">{room.eyebrow}</span>
                  <ArrowUpRight
                    className="size-4 -translate-x-1 translate-y-1 text-accent opacity-0 transition-[opacity,transform] duration-500 ease-soft group-hover:translate-x-0 group-hover:translate-y-0 group-hover:opacity-100"
                    aria-hidden="true"
                  />
                </span>
                <span>
                  <span className="block font-display text-2xl leading-tight text-ink sm:text-3xl">{room.label}</span>
                  <span className="mt-1.5 hidden text-sm text-muted sm:block">{room.description}</span>
                </span>
              </Link>
            </StaggerItem>
          ))}
        </Stagger>
      </section>
    </>
  );
}
