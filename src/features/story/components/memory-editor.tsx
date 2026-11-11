"use client";

import { ArrowLeft, ArrowRight, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Sparkle } from "@/components/decor";
import { Button } from "@/components/ui/button";
import { Confirm } from "@/components/ui/confirm";
import { describedBy, Field, Input, Select, Textarea } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";
import { PhotoPicker } from "@/features/gallery/components/photo-picker";
import type { Photo } from "@/features/gallery/queries";
import { parseTags } from "@/features/gallery/schema";
import { trashAction } from "@/features/trash/actions";
import { cn } from "@/lib/cn";
import { useAction } from "@/lib/use-action";
import { saveMemoryAction } from "../actions";
import { MEMORY_CATEGORIES, STAR_TONES, type MemoryCategory, type StarTone } from "../schema";

export type MemoryDraft = {
  id?: string;
  title: string;
  happenedOn: string;
  datePrecision: "day" | "month" | "year";
  summary: string;
  description: string;
  specialNote: string;
  category: MemoryCategory;
  tags: string;
  albumId: string;
  voiceMemoryId: string;
  starSize: number;
  starTone: StarTone;
  status: "draft" | "published";
};

/**
 * Writing a memory. Only what is actually remembered goes in: the date may be
 * left empty or given as just a month or a year, and nothing is required
 * beyond a title.
 */
type Option = { id: string; title: string };

export function MemoryEditor({
  initial,
  initialPhotos,
  backHref,
  albums = [],
  voices = [],
}: {
  initial: MemoryDraft;
  initialPhotos: Photo[];
  backHref: string;
  albums?: Option[];
  voices?: Option[];
}) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [photos, setPhotos] = useState(initialPhotos);
  const { run, pending, fieldErrors } = useAction(saveMemoryAction, {
    onSuccess: () => {
      router.push(backHref);
      router.refresh();
    },
  });
  const set = <K extends keyof MemoryDraft>(key: K, value: MemoryDraft[K]) => setForm((f) => ({ ...f, [key]: value }));

  const save = (publish: boolean) => (event?: FormEvent) => {
    event?.preventDefault();
    const { status: _status, tags, albumId, voiceMemoryId, ...rest } = form;
    void _status;
    run({ ...rest, tags: parseTags(tags), photoIds: photos.map((p) => p.id), albumId: albumId || null, voiceMemoryId: voiceMemoryId || null, publish });
  };

  function shift(index: number, step: -1 | 1) {
    setPhotos((list) => {
      const next = [...list];
      const to = index + step;
      if (to < 0 || to >= next.length) return list;
      [next[index], next[to]] = [next[to], next[index]];
      return next;
    });
  }

  const tone = STAR_TONES.find((t) => t.value === form.starTone)?.color ?? "#f3c9d1";

  return (
    <form method="post" onSubmit={save(form.status === "published")} noValidate className="grid gap-10 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)]">
      <div className="space-y-6">
        <Field htmlFor="m-title" label="Başlık" error={fieldErrors.title}>
          <Input {...describedBy("m-title", fieldErrors.title)} value={form.title} maxLength={160} required onChange={(e) => set("title", e.target.value)} />
        </Field>

        <div className="grid gap-6 sm:grid-cols-2">
          <Field htmlFor="m-date" label="Ne zaman?" optional hint="Emin değilsen boş bırak ya da yalnızca ayı / yılı seç." error={fieldErrors.happenedOn}>
            <Input {...describedBy("m-date", fieldErrors.happenedOn, true)} type="date" value={form.happenedOn} onChange={(e) => set("happenedOn", e.target.value)} />
          </Field>
          <Field htmlFor="m-precision" label="Tarih ne kadar kesin?">
            <Select id="m-precision" value={form.datePrecision} disabled={!form.happenedOn} onChange={(e) => set("datePrecision", e.target.value as MemoryDraft["datePrecision"])}>
              <option value="day">Günü belli</option>
              <option value="month">Yalnızca ay ve yıl</option>
              <option value="year">Yalnızca yıl</option>
            </Select>
          </Field>
        </div>

        <Field htmlFor="m-summary" label="Kısa özet" optional hint="Zaman çizelgesindeki kartta görünür." error={fieldErrors.summary}>
          <Textarea {...describedBy("m-summary", fieldErrors.summary, true)} rows={2} className="min-h-20" value={form.summary} maxLength={400} onChange={(e) => set("summary", e.target.value)} />
        </Field>

        <Field htmlFor="m-description" label="Anı" optional error={fieldErrors.description}>
          <Textarea
            {...describedBy("m-description", fieldErrors.description)}
            rows={12}
            className="min-h-64 font-display text-[18px] leading-[1.8]"
            value={form.description}
            placeholder="Hatırladığın kadarını, hatırladığın gibi."
            onChange={(e) => set("description", e.target.value)}
          />
        </Field>

        <Field htmlFor="m-note" label="Özel not" optional hint="Anının içinde, el yazısıyla kenar notu olarak görünür." error={fieldErrors.specialNote}>
          <Textarea {...describedBy("m-note", fieldErrors.specialNote, true)} rows={3} className="min-h-24 font-hand text-2xl" value={form.specialNote} maxLength={2000} onChange={(e) => set("specialNote", e.target.value)} />
        </Field>

        <div className="grid gap-6 sm:grid-cols-2">
          <Field htmlFor="m-category" label="Raf">
            <Select id="m-category" value={form.category} onChange={(e) => set("category", e.target.value as MemoryCategory)}>
              {MEMORY_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field htmlFor="m-tags" label="Etiketler" optional hint="Virgülle ayır." error={fieldErrors.tags}>
            <Input {...describedBy("m-tags", fieldErrors.tags, true)} value={form.tags} onChange={(e) => set("tags", e.target.value)} />
          </Field>
        </div>

        {albums.length > 0 || voices.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2">
            {albums.length > 0 ? (
              <Field htmlFor="m-album" label="Albüm" optional hint="Anının altında albüme bir bağlantı çıkar.">
                <Select id="m-album" value={form.albumId} onChange={(e) => set("albumId", e.target.value)}>
                  <option value="">Yok</option>
                  {albums.map((album) => (
                    <option key={album.id} value={album.id}>
                      {album.title}
                    </option>
                  ))}
                </Select>
              </Field>
            ) : null}
            {voices.length > 0 ? (
              <Field htmlFor="m-voice" label="Ses kaydı" optional hint="Anının içinde dinlenebilir.">
                <Select id="m-voice" value={form.voiceMemoryId} onChange={(e) => set("voiceMemoryId", e.target.value)}>
                  <option value="">Yok</option>
                  {voices.map((voice) => (
                    <option key={voice.id} value={voice.id}>
                      {voice.title}
                    </option>
                  ))}
                </Select>
              </Field>
            ) : null}
          </div>
        ) : null}

        <div>
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-[13px] font-medium text-ink-soft">Fotoğraflar</p>
            <PhotoPicker
              multiple
              title="Anının fotoğraflarını seç"
              value={photos.map((p) => p.id)}
              onChange={(_, picked) => setPhotos(picked)}
            />
          </div>
          {photos.length === 0 ? (
            <p className="rounded-xl border border-dashed border-line-strong px-4 py-6 text-center text-[13px] text-muted">
              Fotoğraf eklenmedi. Fotoğrafsız anılar da zaman çizelgesinde yerini alır.
            </p>
          ) : (
            <ul className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {photos.map((photo, i) => (
                <li key={photo.id} className="group relative overflow-hidden rounded-lg bg-beige">
                  {/* eslint-disable-next-line @next/next/no-img-element -- signed thumbnail */}
                  <img src={photo.image.thumb} alt={photo.altText} className="aspect-square w-full object-cover" />
                  {i === 0 ? <span className="absolute top-1 left-1 rounded-full bg-ink/75 px-1.5 py-0.5 text-[9px] font-medium tracking-wide text-pearl">KAPAK</span> : null}
                  <div className="flex justify-between bg-pearl px-1 py-0.5">
                    <button type="button" onClick={() => shift(i, -1)} disabled={i === 0} aria-label="Öne al" className="grid size-7 place-items-center text-taupe hover:text-ink disabled:opacity-30">
                      <ArrowLeft className="size-3.5" aria-hidden="true" />
                    </button>
                    <button type="button" onClick={() => setPhotos((list) => list.filter((p) => p.id !== photo.id))} aria-label="Anıdan çıkar" className="grid size-7 place-items-center text-taupe hover:text-[#8c3b3b]">
                      <X className="size-3.5" aria-hidden="true" />
                    </button>
                    <button type="button" onClick={() => shift(i, 1)} disabled={i === photos.length - 1} aria-label="Arkaya al" className="grid size-7 place-items-center text-taupe hover:text-ink disabled:opacity-30">
                      <ArrowRight className="size-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <aside className="space-y-6 lg:sticky lg:top-24 lg:h-max">
        <div className="dusk rounded-2xl p-6 text-center">
          <p className="eyebrow">Memory Universe</p>
          <div className="grid h-28 place-items-center">
            <Sparkle style={{ color: tone, width: 10 + form.starSize * 9, height: 10 + form.starSize * 9, filter: `drop-shadow(0 0 ${form.starSize * 4}px ${tone})` }} className="animate-twinkle" />
          </div>
          <p className="text-[13px] text-pearl/70">Bu anı evrende böyle parlayacak.</p>
        </div>
        <Field htmlFor="m-size" label={`Yıldızın büyüklüğü: ${form.starSize}`}>
          <input id="m-size" type="range" min={1} max={5} step={1} value={form.starSize} onChange={(e) => set("starSize", Number(e.target.value))} className="w-full accent-(--accent)" />
        </Field>
        <fieldset>
          <legend className="mb-2 text-[13px] font-medium text-ink-soft">Yıldızın rengi</legend>
          <div className="flex gap-2">
            {STAR_TONES.map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={form.starTone === option.value}
                aria-label={option.label}
                title={option.label}
                onClick={() => set("starTone", option.value)}
                className={cn("grid size-10 place-items-center rounded-full border-2 transition-colors", form.starTone === option.value ? "border-accent" : "border-transparent")}
              >
                <span className="size-7 rounded-full border border-line-strong" style={{ background: option.color }} />
              </button>
            ))}
          </div>
        </fieldset>

        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-line bg-pearl p-3">
          <Button variant="outline" onClick={save(false)} disabled={pending}>
            {form.status === "published" ? "Taslağa çek" : "Taslak kaydet"}
          </Button>
          <Button variant="accent" onClick={save(true)} disabled={pending}>
            {pending ? <Spinner /> : null}
            {form.status === "published" ? "Güncelle" : "Yayımla"}
          </Button>
          {form.id ? (
            <Confirm
              trigger={
                <Button variant="ghost" size="icon" className="ml-auto text-taupe hover:text-[#8c3b3b]" aria-label="Çöp kutusuna taşı">
                  <Trash2 aria-hidden="true" />
                </Button>
              }
              title="Anı çöp kutusuna taşınsın mı?"
              description="Hikâyeden kalkar ama silinmez; çöp kutusundan geri alabilirsin."
              confirmLabel="Çöp kutusuna taşı"
              onConfirm={async () => {
                const result = await trashAction("memories", form.id!);
                toast(result.ok ? (result.message ?? "Taşındı.") : result.error, result.ok ? "ok" : "error");
                if (result.ok) {
                  router.push(backHref);
                  router.refresh();
                }
              }}
            />
          ) : null}
          <p className="w-full px-1 text-[12px] text-muted">
            {form.status === "published" ? "Şu an yayında." : "Taslak — yalnızca sen görürsün."}
          </p>
        </div>
      </aside>
    </form>
  );
}
