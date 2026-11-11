import { ArrowLeft, Lock } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Flourish, Sparkle } from "@/components/decor";
import { OwnerHint } from "@/components/layout/owner-hint";
import { SmartImage } from "@/components/media/smart-image";
import { Reveal } from "@/components/motion/reveal";
import { Countdown } from "@/components/time/countdown";
import { timezoneFor } from "@/features/dates/queries";
import { getSpecialDay, listEditions, listSealedEditions, type Edition } from "@/features/days/queries";
import { DAY_LOOK, dayEyebrow } from "@/features/days/theme";
import { whenText } from "@/features/days/when";
import { getPhotos } from "@/features/gallery/queries";
import { people, requireMember } from "@/lib/auth/session";
import { cn } from "@/lib/cn";
import { formatDate, startOfDayIn, todayIn } from "@/lib/dates";

export const metadata: Metadata = { title: "Özel gün" };

export default async function SpecialDayPage({ params }: PageProps<"/days/[slug]">) {
  const { slug } = await params;
  if (!/^[a-z0-9][a-z0-9-]{1,60}$/.test(slug)) notFound();

  const session = await requireMember();
  const day = await getSpecialDay(session, slug);
  if (!day) notFound();

  const [editions, sealed] = await Promise.all([listEditions(session, day.id), listSealedEditions(session)]);
  const visible = editions.filter((e) => e.status === "published");
  const letterIds = visible.map((e) => e.letterId).filter((id): id is string => Boolean(id));
  const [photos, letters] = await Promise.all([
    getPhotos(session, [day.coverPhotoId, ...visible.map((e) => e.coverPhotoId)]),
    letterIds.length > 0
      ? session.supabase.from("letters").select("id, title").in("id", letterIds).eq("status", "published").is("deleted_at", null)
      : Promise.resolve({ data: [] as { id: string; title: string }[] }),
  ]);
  const letterTitle = new Map((letters.data ?? []).map((l) => [l.id, l.title]));

  const look = DAY_LOOK[day.theme];
  const when = whenText(day);
  const { partner, me } = people(session);
  const cover = day.coverPhotoId ? photos.get(day.coverPhotoId) : null;
  const waiting = sealed.filter((s) => s.specialDayId === day.id);
  const focusYear = when.next?.year ?? todayIn(me.timezone, new Date()).year;
  const current = visible.find((e) => e.year === focusYear) ?? null;
  const archive = visible.filter((e) => e !== current);

  const renderEdition = (edition: Edition, featured: boolean) => {
    const photo = edition.coverPhotoId ? photos.get(edition.coverPhotoId) : null;
    return (
      <article key={edition.id} className={cn("paper overflow-hidden", featured ? "p-7 md:p-12" : "p-6 md:p-8")}>
        <p className="eyebrow">{edition.year}</p>
        {edition.title ? <h3 className={cn("mt-3 font-display text-ink", featured ? "text-4xl md:text-5xl" : "text-3xl")}>{edition.title}</h3> : null}
        {photo ? (
          <SmartImage
            image={photo.image}
            alt={photo.altText || photo.caption || partner.fullName}
            sizes="(min-width: 768px) 44rem, 100vw"
            className="mt-7 max-h-[70dvh] rounded-[3px]"
            fit="contain"
          />
        ) : null}
        {edition.note ? <p className="prose-letter mt-7 font-display text-[19px] leading-[1.85] text-ink-soft">{edition.note}</p> : null}
        <div className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-[13px] font-medium">
          {edition.letterId && letterTitle.has(edition.letterId) ? (
            <Link href={`/letters/${edition.letterId}`} className="text-accent underline-offset-4 hover:underline">
              Mektup: {letterTitle.get(edition.letterId)}
            </Link>
          ) : null}
          {edition.albumId ? (
            <Link href={`/gallery?album=${edition.albumId}`} className="text-accent underline-offset-4 hover:underline">
              Albümü aç
            </Link>
          ) : null}
        </div>
      </article>
    );
  };

  return (
    <>
      <section className={cn("relative overflow-hidden pt-28 pb-16 text-center md:pt-40 md:pb-24", look.surface)}>
        {when.isToday ? (
          <div aria-hidden="true" className="pointer-events-none absolute inset-0">
            {[["12%", "24%"], ["82%", "18%"], ["24%", "70%"], ["72%", "64%"], ["50%", "12%"], ["90%", "46%"], ["6%", "50%"]].map(([left, top], i) => (
              <Sparkle key={i} className="absolute size-4 animate-twinkle text-gold" style={{ left, top, animationDelay: `${i * 0.5}s` }} />
            ))}
          </div>
        ) : null}
        <div className="shell relative">
          <Link href="/days" className="inline-flex items-center gap-2 text-[13px] font-medium tracking-wide text-ink-soft/80 hover:text-ink">
            <ArrowLeft className="size-4" aria-hidden="true" />
            Özel günler
          </Link>
          <Reveal className="mt-10 flex justify-center">{look.motif}</Reveal>
          <Reveal delay={0.08}>
            <p className="eyebrow mt-6">{dayEyebrow(day.theme, session.role)}</p>
            <h1 className="mt-4 font-display text-display leading-[1.02]">{day.title}</h1>
            {day.subtitle ? <p className="mt-4 font-display text-2xl text-ink-soft italic">{day.subtitle}</p> : null}
          </Reveal>
          <Reveal delay={0.18}>
            <p className={cn("mt-8 font-display text-3xl italic", look.accent)}>
              {when.dateText}
              {when.ordinal ? ` · ${when.ordinal}` : ""}
            </p>
          </Reveal>
          <Reveal delay={0.28} className="mt-10 flex justify-center">
            {when.isToday ? (
              <p className="font-display text-display-lg leading-none text-ink italic" role="status">
                Bugün
              </p>
            ) : day.showCountdown && when.next ? (
              <Countdown target={startOfDayIn(timezoneFor(session, day.date), when.next).toISOString()} />
            ) : when.awayText ? (
              <p className="font-display text-5xl text-ink italic">{when.awayText}</p>
            ) : null}
          </Reveal>
          {day.status === "draft" ? <p className="mt-8 text-[12px] text-ink-soft">Taslak — yalnızca sen görürsün.</p> : null}
        </div>
      </section>

      <div className="shell-narrow space-y-12 py-16 md:py-24">
        {cover ? (
          <Reveal>
            <SmartImage image={cover.image} alt={cover.altText || cover.caption || partner.fullName} sizes="(min-width: 768px) 44rem, 100vw" priority className="rounded-[3px] shadow-lift" />
          </Reveal>
        ) : null}

        {day.intro ? (
          <Reveal>
            <p className="prose-letter text-center font-display text-2xl leading-[1.7] text-ink-soft">{day.intro}</p>
            <Flourish className="mt-10" />
          </Reveal>
        ) : null}

        {waiting.map((item) => (
          <Reveal key={`${item.year}`}>
            <div className="rounded-3xl border border-dashed border-plum/30 bg-plum/5 px-6 py-10 text-center">
              <Lock className="mx-auto mb-4 size-5 text-plum" aria-hidden="true" />
              <p className="font-display text-3xl text-ink italic">{item.year} için bir sürpriz bekliyor</p>
              <p className="mt-2 text-sm text-muted">{formatDate(todayIn(me.timezone, new Date(item.revealAt)))} günü açılacak.</p>
            </div>
          </Reveal>
        ))}

        {current ? <Reveal>{renderEdition(current, true)}</Reveal> : null}

        {archive.length > 0 ? (
          <section aria-labelledby="archive-heading" className="space-y-6">
            <Reveal>
              <p className="eyebrow">Archive</p>
              <h2 id="archive-heading" className="mt-2 font-display text-display-sm italic">
                Anı arşivi
              </h2>
            </Reveal>
            {archive.map((edition) => (
              <Reveal key={edition.id}>{renderEdition(edition, false)}</Reveal>
            ))}
          </section>
        ) : null}

        {visible.length === 0 && waiting.length === 0 && session.role === "owner" ? (
          <OwnerHint href="/studio/days" label="Baskı hazırla">
            Bu gün için henüz bir yıl baskısı yok. Her yıl yeni bir not, fotoğraf ya da mektup hazırlayabilirsin.
          </OwnerHint>
        ) : null}
      </div>
    </>
  );
}
