"use client";

import { ImageOff, Play } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PhotoPicker } from "@/features/gallery/components/photo-picker";
import { Envelope } from "@/features/letters/components/envelope";
import { SectionForm, type SectionField } from "./section-form";

const FIELDS: SectionField[] = [
  { name: "greeting", label: "İlk kelime", kind: "text", hint: "Sessiz ilk sahnede, tek başına görünür.", maxLength: 80 },
  { name: "headline", label: "Büyük cümle", kind: "text", hint: "Yıldızların altında, kelime kelime belirir.", maxLength: 200 },
  {
    name: "letter",
    label: "Zarftaki not",
    kind: "textarea",
    rows: 12,
    hint: "Kurdele çözülünce okunur. Paragraflar arasında bir satır boş bırak.",
    maxLength: 6000,
  },
  { name: "signature", label: "İmza", kind: "text", maxLength: 80 },
  { name: "enterLabel", label: "Son düğmenin yazısı", kind: "text", maxLength: 40 },
];

/**
 * The opening of the gift: its words and its one photograph. The photograph
 * can only be chosen from real uploads — if none is chosen, that scene is
 * skipped rather than filled with anything else.
 */
export function OpeningEditor({
  initial,
  hasDraft,
  photoThumb,
}: {
  initial: Record<string, unknown>;
  hasDraft: boolean;
  photoThumb: string | null;
}) {
  const [thumb, setThumb] = useState(photoThumb);

  return (
    <SectionForm
      sectionKey="gift.opening"
      title="Açılış metni ve fotoğrafı"
      description="Eln'in siteyi ilk açtığında yaşayacağı altı sahne buradan beslenir. Yayımlamadan önce tam ekran önizlemeyle baştan sona izle."
      fields={FIELDS}
      initial={initial}
      hasDraft={hasDraft}
      extra={(values, set) => (
        <div>
          <p className="mb-2 text-[13px] font-medium text-ink-soft">Hediye fotoğrafı</p>
          <div className="flex items-center gap-4">
            <div className="grid size-24 shrink-0 place-items-center overflow-hidden rounded-xl border border-line bg-beige text-taupe">
              {thumb && values.photoId ? (
                // eslint-disable-next-line @next/next/no-img-element -- signed thumbnail
                <img src={thumb} alt="" className="size-full object-cover" />
              ) : (
                <ImageOff className="size-6" strokeWidth={1.5} aria-hidden="true" />
              )}
            </div>
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                <PhotoPicker
                  title="Hediye fotoğrafını seç"
                  value={values.photoId ? [String(values.photoId)] : []}
                  onChange={(ids, photos) => {
                    set("photoId", ids[0] ?? null);
                    setThumb(photos[0]?.image.thumb ?? null);
                  }}
                />
                {values.photoId ? (
                  <Button variant="ghost" onClick={() => set("photoId", null)}>
                    Kaldır
                  </Button>
                ) : null}
              </div>
              <p className="max-w-sm text-[13px] leading-snug text-muted">
                Eln&apos;in, senin seçtiğin gerçek bir fotoğrafı. Seçmezsen fotoğraf sahnesi atlanır.
              </p>
            </div>
          </div>
        </div>
      )}
      preview={(values) => (
        <div className="space-y-5">
          <div className="dusk rounded-2xl px-6 py-10 text-center">
            <p className="font-display text-4xl text-pearl italic">{String(values.greeting || "")}</p>
            <p className="mx-auto mt-5 max-w-xs font-display text-2xl leading-snug text-pearl/90 italic">
              {String(values.headline || "")}
            </p>
          </div>
          <div className="mx-auto w-40">
            <Envelope styleName="blush" seal="heart" />
          </div>
          <article className="paper paper-grain px-6 py-7">
            <p className="prose-letter font-display text-[17px] leading-[1.8] text-ink-soft">{String(values.letter || "")}</p>
            {values.signature ? <p className="mt-5 text-right font-hand text-2xl text-accent">— {String(values.signature)}</p> : null}
          </article>
          <Button asChild variant="outline" className="w-full">
            <Link href="/gift?from=studio">
              <Play aria-hidden="true" />
              Yayındaki hali tam ekran izle
            </Link>
          </Button>
          <p className="text-center text-[12px] text-muted">Tam ekran önizleme yayımlanmış sürümü gösterir.</p>
        </div>
      )}
    />
  );
}
