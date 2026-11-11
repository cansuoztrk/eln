"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Confirm } from "@/components/ui/confirm";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";
import { trashAction } from "@/features/trash/actions";
import type { ActionResult } from "@/lib/result";
import { addNotesAction, publishNotesAction, saveNoteAction, saveReasonsSettingsAction } from "../actions";
import type { DailyNote } from "../queries";
import { GOAL, NOTE_CATEGORIES, NOTE_MAX, noteCategoryLabel, type NoteCategory } from "../schema";

type Props = { notes: DailyNote[]; mode: "sequential" | "random"; startedOn: string | null; today: string };

/**
 * Where the 365 notes are written. Nothing here is generated: the collection
 * starts empty and grows one real sentence at a time.
 */
export function ReasonsStudio({ notes, mode, startedOn, today }: Props) {
  const router = useRouter();
  const [busy, start] = useTransition();
  const [lines, setLines] = useState("");
  const [category, setCategory] = useState<NoteCategory>("thought");
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [settings, setSettings] = useState({ mode, startedOn: startedOn ?? "" });

  const published = notes.filter((n) => n.status === "published");
  const drafts = notes.filter((n) => n.status === "draft");

  function run(action: () => Promise<ActionResult<unknown>>, after?: () => void) {
    start(async () => {
      const result = await action();
      toast(result.ok ? (result.message ?? "Kaydedildi.") : result.error, result.ok ? "ok" : "error");
      if (result.ok) {
        after?.();
        router.refresh();
      }
    });
  }

  function add(event: FormEvent) {
    event.preventDefault();
    run(() => addNotesAction({ lines, category }), () => setLines(""));
  }

  return (
    <div className="space-y-6">
      <section className="paper grid gap-6 p-5 sm:grid-cols-[1fr_auto] sm:items-center sm:p-7">
        <div>
          <p className="font-display text-5xl text-ink tabular-nums">
            {published.length} <span className="text-2xl text-taupe">/ {GOAL}</span>
          </p>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-beige" role="progressbar" aria-valuemin={0} aria-valuemax={GOAL} aria-valuenow={Math.min(published.length, GOAL)} aria-label="Yayımlanmış not sayısı">
            <div className="h-full rounded-full bg-accent transition-[width] duration-700" style={{ width: `${Math.min(100, (published.length / GOAL) * 100)}%` }} />
          </div>
          <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted">
            365&apos;i bir oturuşta doldurmak zorunda değilsin. Site eldeki notlarla çalışır; hepsi gösterilince baştan döner.
            {drafts.length > 0 ? ` ${drafts.length} taslak bekliyor.` : ""}
          </p>
        </div>
        {drafts.length > 0 ? (
          <Button variant="accent" disabled={busy} onClick={() => run(() => publishNotesAction(drafts.map((d) => d.id), true))}>
            Bütün taslakları yayımla
          </Button>
        ) : null}
      </section>

      <section className="paper p-5 sm:p-7" aria-labelledby="settings-title">
        <h2 id="settings-title" className="mb-4 font-display text-2xl text-ink">
          Günün notu nasıl seçilsin?
        </h2>
        <form
          method="post"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            run(() => saveReasonsSettingsAction(settings));
          }}
          className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
        >
          <Field htmlFor="r-mode" label="Sıra">
            <Select id="r-mode" value={settings.mode} onChange={(e) => setSettings((s) => ({ ...s, mode: e.target.value as Props["mode"] }))}>
              <option value="sequential">Yazdığım sırayla</option>
              <option value="random">Rastgele</option>
            </Select>
          </Field>
          <Field htmlFor="r-start" label="İlk gün" hint={startedOn ? undefined : "Boşken koleksiyon başlamaz."}>
            <div className="flex gap-2">
              <Input id="r-start" type="date" max={today} value={settings.startedOn} onChange={(e) => setSettings((s) => ({ ...s, startedOn: e.target.value }))} />
              {!settings.startedOn ? (
                <Button variant="ghost" onClick={() => setSettings((s) => ({ ...s, startedOn: today }))}>
                  Bugün
                </Button>
              ) : null}
            </div>
          </Field>
          <Button type="submit" variant="outline" disabled={busy}>
            Kaydet
          </Button>
        </form>
        <p className="mt-4 max-w-2xl text-[13px] leading-relaxed text-muted">
          İlk günden bugüne her takvim gününe bir not düşer — kimse girmese bile. Böylece arşiv, kimin hangi gün baktığını
          göstermez; yalnızca bir takvimdir.
        </p>
      </section>

      <section className="paper p-5 sm:p-7" aria-labelledby="add-title">
        <h2 id="add-title" className="mb-4 font-display text-2xl text-ink">
          Not ekle
        </h2>
        <form method="post" noValidate onSubmit={add} className="space-y-4">
          <Field htmlFor="r-lines" label="Her satıra bir not" hint={`Kendi cümlelerin. Satır başına en fazla ${NOTE_MAX} karakter; taslak olarak eklenir.`}>
            <Textarea id="r-lines" rows={5} value={lines} onChange={(e) => setLines(e.target.value)} className="font-display text-[18px] leading-relaxed" />
          </Field>
          <div className="flex flex-wrap items-end gap-3">
            <Field htmlFor="r-category" label="Raf" className="w-64">
              <Select id="r-category" value={category} onChange={(e) => setCategory(e.target.value as NoteCategory)}>
                {NOTE_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Button type="submit" disabled={busy || lines.trim().length === 0}>
              {busy ? <Spinner /> : null}
              Taslak olarak ekle
            </Button>
          </div>
        </form>
      </section>

      <section aria-labelledby="notes-title">
        <h2 id="notes-title" className="mb-4 font-display text-2xl text-ink">
          Notlar <span className="text-base text-muted">({notes.length})</span>
        </h2>
        {notes.length === 0 ? (
          <p className="paper px-6 py-10 text-center text-muted">Koleksiyon boş. İlk notu yukarıdan ekleyebilirsin.</p>
        ) : (
          <ol className="paper divide-y divide-line">
            {notes.map((note, i) => (
              <li key={note.id} className="flex items-start gap-4 px-4 py-4 sm:px-5">
                <span className="w-8 shrink-0 pt-1 text-right font-display text-lg text-taupe tabular-nums">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  {editing === note.id ? (
                    <form
                      method="post"
                      noValidate
                      onSubmit={(event) => {
                        event.preventDefault();
                        run(() => saveNoteAction({ id: note.id, body: draft, category: note.category as NoteCategory, publish: note.status === "published" }), () => setEditing(null));
                      }}
                      className="space-y-2"
                    >
                      <label htmlFor={`note-${note.id}`} className="sr-only">
                        Notu düzenle
                      </label>
                      <Textarea id={`note-${note.id}`} rows={2} className="min-h-20 font-display text-[18px]" value={draft} maxLength={NOTE_MAX} onChange={(e) => setDraft(e.target.value)} />
                      <div className="flex gap-2">
                        <Button type="submit" size="sm" disabled={busy}>
                          Kaydet
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>
                          Vazgeç
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setEditing(note.id);
                        setDraft(note.body);
                      }}
                      className="text-left font-display text-xl leading-snug text-ink hover:text-accent"
                    >
                      {note.body}
                    </button>
                  )}
                  <p className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[12px] text-muted">
                    <Badge tone={note.status === "published" ? "live" : "draft"}>{note.status === "published" ? "Yayında" : "Taslak"}</Badge>
                    <Badge>{noteCategoryLabel(note.category)}</Badge>
                    {note.timesShown > 0 ? <span>{note.timesShown} gün gösterildi</span> : null}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button size="sm" variant="ghost" disabled={busy} onClick={() => run(() => publishNotesAction([note.id], note.status !== "published"))}>
                    {note.status === "published" ? "Taslağa al" : "Yayımla"}
                  </Button>
                  <Confirm
                    trigger={
                      <Button size="icon-sm" variant="ghost" aria-label="Notu çöp kutusuna taşı" className="text-taupe hover:text-[#8c3b3b]">
                        <Trash2 aria-hidden="true" />
                      </Button>
                    }
                    title="Not çöp kutusuna taşınsın mı?"
                    description="Koleksiyondan kalkar; çöp kutusundan geri alabilirsin."
                    confirmLabel="Çöp kutusuna taşı"
                    onConfirm={() => run(() => trashAction("daily_notes", note.id))}
                  />
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
