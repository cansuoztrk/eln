import { ArrowLeft, ArrowRight, PenLine } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { Flourish } from "@/components/decor";
import { OwnerHint } from "@/components/layout/owner-hint";
import { SmartImage } from "@/components/media/smart-image";
import { Reveal } from "@/components/motion/reveal";
import { listAlbums } from "@/features/gallery/queries";
import { getMemory, listMemories } from "@/features/story/queries";
import { listVoices } from "@/features/voice/queries";
import { memoryCategoryLabel } from "@/features/story/schema";
import { people, requireMember } from "@/lib/auth/session";
import { formatWithPrecision, parseISODate } from "@/lib/dates";

export const metadata: Metadata = { title: "Anı" };

export default async function MemoryPage({ params }: PageProps<"/story/[id]">) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();

  const session = await requireMember();
  const [memory, all] = await Promise.all([getMemory(session, id), listMemories(session, { withPhotos: false })]);
  if (!memory) notFound();

  const [voice, album] = await Promise.all([
    memory.voiceMemoryId ? listVoices(session).then((list) => list.find((v) => v.id === memory.voiceMemoryId) ?? null) : null,
    memory.albumId ? listAlbums(session).then((list) => list.find((a) => a.id === memory.albumId) ?? null) : null,
  ]);
  const { partner } = people(session);
  const date = parseISODate(memory.happenedOn);
  const position = all.findIndex((m) => m.id === memory.id);
  const previous = position > 0 ? all[position - 1] : null;
  const next = position >= 0 && position < all.length - 1 ? all[position + 1] : null;
  const editHref = memory.mine || session.role === "owner" ? (session.role === "owner" ? `/studio/story/${memory.id}` : `/story/write?id=${memory.id}`) : null;
  const rest = memory.photos.slice(1);
  const bare = !memory.description && !memory.specialNote && memory.photos.length === 0;

  return (
    <article className="pt-24 md:pt-32">
      <div className="shell flex items-center justify-between gap-4">
        <Link href="/story" className="inline-flex items-center gap-2 text-[13px] font-medium tracking-wide text-taupe transition-colors hover:text-accent">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Hikâyemiz
        </Link>
        {editHref ? (
          <Link href={editHref} className="inline-flex items-center gap-1.5 text-[13px] font-medium text-taupe transition-colors hover:text-accent">
            <PenLine className="size-3.5" aria-hidden="true" />
            Düzenle
          </Link>
        ) : null}
      </div>

      <header className="shell-narrow pt-12 pb-10 text-center md:pt-16">
        <Reveal y={10}>
          <p className="eyebrow">{memoryCategoryLabel(memory.category)}</p>
        </Reveal>
        <Reveal delay={0.08}>
          <h1 className="mt-5 font-display text-display leading-[1.02]">{memory.title}</h1>
        </Reveal>
        {date ? (
          <Reveal delay={0.16}>
            <p className="mt-6 font-display text-2xl text-accent italic">{formatWithPrecision(date, memory.datePrecision)}</p>
          </Reveal>
        ) : null}
        {memory.status === "draft" ? (
          <p className="mt-5 inline-block rounded-full border border-dashed border-line-strong px-3 py-1 text-[12px] text-muted">
            Taslak — yalnızca sen görürsün
          </p>
        ) : null}
      </header>

      {memory.cover ? (
        <Reveal className="shell" duration={1.3}>
          <SmartImage
            image={memory.cover.image}
            alt={memory.cover.altText || memory.cover.caption || partner.fullName}
            sizes="(min-width: 1280px) 70rem, 100vw"
            priority
            className="mx-auto max-h-[82dvh] max-w-4xl rounded-[3px] shadow-lift"
            fit="contain"
          />
          {memory.cover.caption ? <p className="mt-4 text-center font-display text-lg text-ink-soft italic">{memory.cover.caption}</p> : null}
        </Reveal>
      ) : null}

      <div className="shell-narrow py-14 md:py-20">
        {memory.summary ? (
          <Reveal>
            <p className="text-center font-display text-2xl leading-snug text-ink-soft md:text-3xl">{memory.summary}</p>
            <Flourish className="my-10" />
          </Reveal>
        ) : null}

        {memory.description ? (
          <Reveal>
            <div className="prose-letter font-display text-[19px] leading-[1.9] text-ink-soft md:text-[21px]">{memory.description}</div>
          </Reveal>
        ) : null}

        {memory.specialNote ? (
          <Reveal delay={0.1}>
            <aside aria-label="Özel not" className="relative mt-12 -rotate-1 border-l-2 border-accent-soft bg-accent-wash/60 px-6 py-5 md:ml-10">
              <p className="prose-letter font-hand text-[26px] leading-[1.5] text-accent">{memory.specialNote}</p>
              <p className="mt-2 text-right font-hand text-xl text-taupe">— {memory.authorName}</p>
            </aside>
          </Reveal>
        ) : null}

        {bare && session.role === "owner" ? (
          <OwnerHint href={`/studio/story/${memory.id}`} label="Anıyı yaz">
            Bu anının şimdilik yalnızca başlığı ve tarihi var. Gerisini yalnızca sen anlatabilirsin.
          </OwnerHint>
        ) : null}

        {voice ? (
          <Reveal delay={0.1}>
            <figure className="paper mt-12 p-5">
              <figcaption className="mb-3 text-[13px] text-taupe">
                Ses kaydı · <span className="text-ink">{voice.title}</span>
              </figcaption>
              <audio controls preload="none" src={voice.url} className="w-full" />
            </figure>
          </Reveal>
        ) : null}

        {album ? (
          <p className="mt-10 text-center">
            <Link href={`/gallery?album=${album.id}`} className="text-[13px] font-medium tracking-wide text-accent underline-offset-4 hover:underline">
              Albümü aç: {album.title}
            </Link>
          </p>
        ) : null}

        {memory.tags.length > 0 ? (
          <ul className="mt-12 flex flex-wrap justify-center gap-2" aria-label="Etiketler">
            {memory.tags.map((tag) => (
              <li key={tag} className="rounded-full border border-line-strong px-3 py-1 text-[12px] text-muted">
                #{tag}
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {rest.length > 0 ? (
        <section aria-label="Bu anıdan fotoğraflar" className="shell pb-10">
          <ul className="columns-2 gap-4 md:columns-3 md:gap-6 [&>li]:mb-4 [&>li]:break-inside-avoid md:[&>li]:mb-6">
            {rest.map((photo, i) => (
              <li key={photo.id}>
                <Reveal delay={(i % 3) * 0.08}>
                  <figure>
                    <SmartImage
                      image={photo.image}
                      alt={photo.altText || photo.caption || partner.fullName}
                      sizes="(min-width: 768px) 30vw, 46vw"
                      className="rounded-[3px] shadow-paper"
                    />
                    {photo.caption ? <figcaption className="mt-2 font-display text-[15px] text-ink-soft italic">{photo.caption}</figcaption> : null}
                  </figure>
                </Reveal>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <nav aria-label="Diğer anılar" className="shell mt-10 grid gap-px overflow-hidden rounded-3xl border border-line bg-line sm:grid-cols-2">
        {[
          { item: previous, label: "Önceki anı", align: "text-left", icon: <ArrowLeft className="size-4" aria-hidden="true" /> },
          { item: next, label: "Sonraki anı", align: "sm:text-right", icon: <ArrowRight className="size-4" aria-hidden="true" /> },
        ].map(({ item, label, align, icon }) =>
          item ? (
            <Link key={label} href={`/story/${item.id}`} className={`group bg-ivory p-6 transition-colors hover:bg-accent-wash md:p-8 ${align}`}>
              <span className={`eyebrow inline-flex items-center gap-2 text-[10px] ${label === "Sonraki anı" ? "sm:flex-row-reverse" : ""}`}>
                {icon}
                {label}
              </span>
              <span className="mt-2 block font-display text-2xl text-ink group-hover:text-accent">{item.title}</span>
            </Link>
          ) : (
            <span key={label} className="hidden bg-ivory sm:block" />
          ),
        )}
      </nav>
    </article>
  );
}
