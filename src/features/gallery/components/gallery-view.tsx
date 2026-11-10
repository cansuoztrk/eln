"use client";

import { Heart } from "lucide-react";
import { useState } from "react";
import { SmartImage } from "@/components/media/smart-image";
import { Reveal } from "@/components/motion/reveal";
import { cn } from "@/lib/cn";
import { formatDate, parseISODate } from "@/lib/dates";
import type { Photo } from "../queries";
import { Lightbox } from "./lightbox";

/** A small, stable tilt for a polaroid, derived from its id so server and browser agree. */
function tilt(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return ((Math.abs(hash) % 61) - 30) / 10;
}

type Props = {
  photos: Photo[];
  view: "editorial" | "polaroid";
  memories?: Record<string, { id: string; title: string }[]>;
  fallbackAlt: string;
};

/** The wall of photographs, in either of its two moods, with the lightbox behind it. */
export function GalleryView({ photos, view, memories, fallbackAlt }: Props) {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <>
      {view === "polaroid" ? (
        <ul className="grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 sm:gap-x-8 lg:grid-cols-4">
          {photos.map((photo, i) => (
            <li key={photo.id}>
              <Reveal delay={(i % 4) * 0.06}>
                <button
                  type="button"
                  onClick={() => setOpen(i)}
                  aria-label={`${photo.caption || fallbackAlt} — büyüt`}
                  style={{ rotate: `${tilt(photo.id)}deg` }}
                  className="group block w-full bg-pearl p-2.5 pb-3 text-left shadow-paper transition-[rotate,translate,box-shadow] duration-500 ease-soft hover:-translate-y-1.5 hover:rotate-0! hover:shadow-lift sm:p-3"
                >
                  <SmartImage
                    image={photo.image}
                    alt={photo.altText || photo.caption || fallbackAlt}
                    sizes="(min-width: 1024px) 22vw, (min-width: 640px) 30vw, 46vw"
                    mode="fill"
                    className="aspect-square"
                  />
                  <span className="mt-2.5 block min-h-7 truncate text-center font-hand text-xl leading-tight text-ink-soft">
                    {photo.caption}
                  </span>
                </button>
              </Reveal>
            </li>
          ))}
        </ul>
      ) : (
        // On a phone the column breathes: a full-width photograph, then one set in from the left, then one from the right.
        <ul className="columns-1 gap-6 sm:columns-2 lg:columns-3 lg:gap-9 [&>li]:mb-9 [&>li]:break-inside-avoid max-sm:[&>li:nth-child(3n)]:pr-[14%] max-sm:[&>li:nth-child(3n+2)]:pl-[14%] lg:[&>li]:mb-14">
          {photos.map((photo, i) => {
            const date = photo.takenOn ? parseISODate(photo.takenOn) : null;
            return (
              <li key={photo.id}>
                <Reveal delay={(i % 3) * 0.08}>
                  <figure>
                    <button
                      type="button"
                      onClick={() => setOpen(i)}
                      aria-label={`${photo.caption || fallbackAlt} — büyüt`}
                      className={cn(
                        "group relative block w-full overflow-hidden rounded-[3px] shadow-paper transition-shadow duration-700 hover:shadow-lift",
                        photo.displayStyle === "polaroid" && "bg-pearl p-3 pb-10",
                      )}
                    >
                      <SmartImage
                        image={photo.image}
                        alt={photo.altText || photo.caption || fallbackAlt}
                        sizes="(min-width: 1024px) 30vw, (min-width: 640px) 46vw, 100vw"
                        priority={i < 2}
                        imgClassName="transition-transform duration-[1400ms] ease-soft group-hover:scale-[1.03]"
                      />
                    </button>
                    {photo.caption || date || photo.isFavorite ? (
                      <figcaption className="mt-3 flex items-baseline justify-between gap-4">
                        <span className="font-display text-lg leading-snug text-ink-soft italic">{photo.caption}</span>
                        <span className="flex shrink-0 items-center gap-2 text-[12px] text-taupe">
                          {photo.isFavorite ? <Heart className="size-3 fill-rose text-rose" aria-label="Favori" /> : null}
                          {date ? formatDate(date) : null}
                        </span>
                      </figcaption>
                    ) : null}
                  </figure>
                </Reveal>
              </li>
            );
          })}
        </ul>
      )}

      <Lightbox photos={photos} index={open} onIndexChange={setOpen} memories={memories} />
    </>
  );
}
