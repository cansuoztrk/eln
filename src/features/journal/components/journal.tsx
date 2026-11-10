"use client";

import { EyeOff, Pencil, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { SmartImage } from "@/components/media/smart-image";
import { Reveal } from "@/components/motion/reveal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Confirm } from "@/components/ui/confirm";
import { describedBy, Field, Input, Textarea } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";
import { PhotoPicker } from "@/features/gallery/components/photo-picker";
import type { Photo } from "@/features/gallery/queries";
import { parseTags } from "@/features/gallery/schema";
import { trashAction } from "@/features/trash/actions";
import { cn } from "@/lib/cn";
import { formatDate, parseISODate, weekdayOf } from "@/lib/dates";
import { useAction } from "@/lib/use-action";
import { saveEntryAction } from "../actions";
import type { Entry } from "../queries";

type Draft = { id?: string; title: string; body: string; entryDate: string; tags: string; visibility: "shared" | "private"; status: "draft" | "published" };

/** A notebook for two. Each writes in their own hand; nobody is expected to. */
export function Journal({ entries, today, otherName }: { entries: Entry[]; today: string; otherName: string }) {
  const router = useRouter();
  const blank: Draft = { title: "", body: "", entryDate: today, tags: "", visibility: "shared", status: "draft" };
  const [form, setForm] = useState<Draft>(blank);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [filter, setFilter] = useState<"all" | "mine" | "theirs">("all");
  const { run, pending, fieldErrors } = useAction(saveEntryAction, {
    onSuccess: () => {
      setForm(blank);
      setPhotos([]);
      router.refresh();
    },
  });

  const save = (publish: boolean) => (event?: FormEvent) => {
    event?.preventDefault();
    const { status: _status, tags, ...rest } = form;
    void _status;
    run({ ...rest, tags: parseTags(tags), photoIds: photos.map((p) => p.id), publish });
  };

  function edit(entry: Entry) {
    setForm({ id: entry.id, title: entry.title, body: entry.body, entryDate: entry.entryDate, tags: entry.tags.join(", "), visibility: entry.visibility, status: entry.status });
    setPhotos(entry.photos);
    document.getElementById("journal-composer")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const shown = entries.filter((e) => filter === "all" || (filter === "mine" ? e.mine : !e.mine));

  return (
    <div className="space-y-16">
      <form id="journal-composer" method="post" onSubmit={save(false)} noValidate className="paper paper-grain scroll-mt-28 space-y-4 p-5 sm:p-8">
        <div className="grid gap-4 sm:grid-cols-[1fr_11rem]">
          <Field htmlFor="j-title" label="Başlık" optional error={fieldErrors.title}>
            <Input {...describedBy("j-title", fieldErrors.title)} value={form.title} maxLength={160} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
          </Field>
          <Field htmlFor="j-date" label="Gün" error={fieldErrors.entryDate}>
            <Input {...describedBy("j-date", fieldErrors.entryDate)} type="date" max={today} value={form.entryDate} onChange={(e) => setForm((f) => ({ ...f, entryDate: e.target.value }))} />
          </Field>
        </div>
        <Field htmlFor="j-body" label="Bugün" error={fieldErrors.body}>
          <Textarea {...describedBy("j-body", fieldErrors.body)} rows={6} className="min-h-40 font-display text-[18px] leading-[1.8]" value={form.body} onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))} />
        </Field>
        <Field htmlFor="j-tags" label="Etiketler" optional hint="Virgülle ayır." error={fieldErrors.tags}>
          <Input {...describedBy("j-tags", fieldErrors.tags, true)} value={form.tags} onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))} />
        </Field>

        <div className="flex flex-wrap items-center gap-2">
          <PhotoPicker multiple title="Günlük fotoğrafları" value={photos.map((p) => p.id)} onChange={(_, picked) => setPhotos(picked.slice(0, 12))} />
          {photos.map((photo) => (
            <span key={photo.id} className="relative size-12 overflow-hidden rounded-lg bg-beige">
              {/* eslint-disable-next-line @next/next/no-img-element -- signed thumbnail */}
              <img src={photo.image.thumb} alt="" className="size-full object-cover" />
              <button type="button" onClick={() => setPhotos((list) => list.filter((p) => p.id !== photo.id))} aria-label="Fotoğrafı çıkar" className="absolute inset-0 grid place-items-center bg-ink/45 text-pearl opacity-0 transition-opacity hover:opacity-100 focus-visible:opacity-100">
                <X className="size-4" aria-hidden="true" />
              </button>
            </span>
          ))}
        </div>

        <fieldset className="flex flex-wrap gap-2 pt-1">
          <legend className="mb-2 text-[13px] font-medium text-ink-soft">Kim görsün?</legend>
          {(
            [
              ["shared", "İkimiz", `Yayımlayınca ${otherName} da okur.`],
              ["private", "Yalnızca ben", "Yayımlasan da kimseye gösterilmez."],
            ] as const
          ).map(([value, label, hint]) => (
            <button
              key={value}
              type="button"
              aria-pressed={form.visibility === value}
              onClick={() => setForm((f) => ({ ...f, visibility: value }))}
              className={cn("rounded-xl border px-4 py-2.5 text-left transition-colors", form.visibility === value ? "border-accent bg-accent-wash" : "border-line-strong hover:border-taupe")}
            >
              <span className="block text-[14px] font-medium text-ink">{label}</span>
              <span className="block text-[12px] text-muted">{hint}</span>
            </button>
          ))}
        </fieldset>

        <div className="flex flex-wrap items-center gap-2 border-t border-line pt-4">
          <Button type="submit" variant="outline" disabled={pending}>
            Taslak kaydet
          </Button>
          <Button variant="accent" onClick={save(true)} disabled={pending}>
            {pending ? <Spinner /> : null}
            {form.visibility === "private" ? "Kendime kaydet" : "Günlüğe ekle"}
          </Button>
          {form.id ? (
            <Button
              variant="ghost"
              onClick={() => {
                setForm(blank);
                setPhotos([]);
              }}
            >
              Düzenlemeyi bırak
            </Button>
          ) : null}
        </div>
      </form>

      {entries.length > 0 ? (
        <section aria-label="Günlük kayıtları">
          <div className="mb-8 flex justify-center gap-1 rounded-full bg-beige p-1 sm:mx-auto sm:w-max" role="group" aria-label="Kayıtları süz">
            {(
              [
                ["all", "Hepsi"],
                ["mine", "Benim"],
                ["theirs", otherName],
              ] as const
            ).map(([value, label]) => (
              <button key={value} type="button" aria-pressed={filter === value} onClick={() => setFilter(value)} className={cn("h-9 flex-1 rounded-full px-5 text-[13px] font-medium transition-colors sm:flex-none", filter === value ? "bg-pearl text-ink shadow-paper" : "text-muted")}>
                {label}
              </button>
            ))}
          </div>

          {shown.length === 0 ? <p className="text-center text-muted">Bu süzgeçte kayıt yok.</p> : null}
          <ol className="space-y-10">
            {shown.map((entry) => {
              const date = parseISODate(entry.entryDate)!;
              return (
                <li key={entry.id}>
                  <Reveal as="article" className="paper p-6 sm:p-9">
                    <header className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-[13px] text-taupe">
                          {weekdayOf(date)}, {formatDate(date)} · <span className={entry.authorRole === "owner" ? "text-rosegold" : "text-accent"}>{entry.authorName}</span>
                        </p>
                        {entry.title ? <h2 className="mt-1.5 font-display text-3xl text-ink">{entry.title}</h2> : null}
                      </div>
                      <div className="flex items-center gap-1.5">
                        {entry.status === "draft" ? <Badge tone="draft">Taslak</Badge> : null}
                        {entry.visibility === "private" ? (
                          <Badge tone="sealed">
                            <EyeOff className="size-3" aria-hidden="true" />
                            Yalnızca ben
                          </Badge>
                        ) : null}
                        {entry.mine ? (
                          <>
                            <Button size="icon-sm" variant="ghost" aria-label="Kaydı düzenle" onClick={() => edit(entry)}>
                              <Pencil aria-hidden="true" />
                            </Button>
                            <Confirm
                              trigger={
                                <Button size="icon-sm" variant="ghost" aria-label="Kaydı çöp kutusuna taşı" className="text-taupe hover:text-[#8c3b3b]">
                                  <Trash2 aria-hidden="true" />
                                </Button>
                              }
                              title="Kayıt çöp kutusuna taşınsın mı?"
                              description="Günlükten kalkar ama silinmez."
                              confirmLabel="Çöp kutusuna taşı"
                              onConfirm={async () => {
                                const result = await trashAction("journal_entries", entry.id);
                                toast(result.ok ? "Kayıt kaldırıldı." : result.error, result.ok ? "ok" : "error");
                                router.refresh();
                              }}
                            />
                          </>
                        ) : null}
                      </div>
                    </header>
                    <p className="prose-letter mt-5 font-display text-[19px] leading-[1.85] text-ink-soft">{entry.body}</p>
                    {entry.photos.length > 0 ? (
                      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {entry.photos.map((photo) => (
                          <SmartImage key={photo.id} image={photo.image} alt={photo.altText || photo.caption || "Günlük fotoğrafı"} sizes="(min-width: 640px) 14rem, 44vw" mode="fill" className="aspect-square rounded-[3px]" />
                        ))}
                      </div>
                    ) : null}
                    {entry.tags.length > 0 ? <p className="mt-5 text-[12px] text-taupe">{entry.tags.map((tag) => `#${tag}`).join("  ")}</p> : null}
                  </Reveal>
                </li>
              );
            })}
          </ol>
        </section>
      ) : null}
    </div>
  );
}
