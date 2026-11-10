"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { WaxSeal } from "@/components/decor";
import { Button } from "@/components/ui/button";
import { Confirm } from "@/components/ui/confirm";
import { describedBy, Field, Input, Select, Textarea } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";
import { trashAction } from "@/features/trash/actions";
import { cn } from "@/lib/cn";
import { useAction } from "@/lib/use-action";
import { saveLetterAction } from "../actions";
import { ENVELOPE_STYLES, LETTER_CATEGORIES, SEALS, type LetterInput } from "../schema";
import { Envelope } from "./envelope";
import { LetterPaper } from "./letter-paper";

type Props = {
  /** Existing letter to edit, or sensible blanks for a new one. */
  initial: Omit<LetterInput, "publish"> & { status: "draft" | "published" };
  authorName: string;
  recipientName: string;
  /** Where to go after saving or deleting. */
  backHref: string;
  /** Which categories to offer (the partner gets a shorter list). */
  categories?: readonly { value: string; label: string }[];
};

const SWATCH: Record<string, string> = {
  blush: "#f9e3e6",
  rose: "#e3b5bd",
  ivory: "#fbf7f2",
  champagne: "#f1e4c9",
  nude: "#efdfd3",
};

/**
 * Writing a letter, with the result beside it: the envelope and the sheet on
 * the right are the very components the reader sees.
 */
export function LetterEditor({ initial, authorName, recipientName, backHref, categories = LETTER_CATEGORIES }: Props) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [tab, setTab] = useState<"write" | "preview">("write");

  const { run, pending, fieldErrors } = useAction(saveLetterAction, {
    onSuccess: () => {
      router.push(backHref);
      router.refresh();
    },
  });

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => setForm((f) => ({ ...f, [key]: value }));

  function submit(publish: boolean) {
    return (event?: FormEvent) => {
      event?.preventDefault();
      const { status: _status, ...values } = form;
      void _status;
      run({ ...values, publish });
    };
  }

  async function moveToTrash() {
    if (!form.id) return;
    const result = await trashAction("letters", form.id);
    if (result.ok) {
      toast(result.message ?? "Çöp kutusuna taşındı.");
      router.push(backHref);
      router.refresh();
    } else {
      toast(result.error, "error");
    }
  }

  const preview = (
    <div className="space-y-8">
      <div className="mx-auto max-w-xs">
        <Envelope
          styleName={form.envelopeStyle}
          seal={form.seal}
          paper={<p className="font-hand text-sm text-ink-soft/80">{recipientName},</p>}
        />
      </div>
      <LetterPaper
        title={form.title}
        body={form.body}
        category={form.category}
        writtenOn={form.writtenOn}
        authorName={authorName}
        fontStyle={form.fontStyle}
        className="sm:px-9 sm:py-11"
      />
    </div>
  );

  return (
    <div>
      <div className="mb-6 flex gap-1 rounded-full bg-beige p-1 lg:hidden" role="tablist" aria-label="Görünüm">
        {(["write", "preview"] as const).map((value) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={tab === value}
            onClick={() => setTab(value)}
            className={cn(
              "h-9 flex-1 rounded-full text-[13px] font-medium transition-colors",
              tab === value ? "bg-pearl text-ink shadow-paper" : "text-muted",
            )}
          >
            {value === "write" ? "Yaz" : "Önizle"}
          </button>
        ))}
      </div>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <form
          method="post"
          onSubmit={submit(form.status === "published")}
          noValidate
          className={cn("space-y-6", tab === "preview" && "hidden lg:block")}
        >
          <Field htmlFor="title" label="Başlık" error={fieldErrors.title} hint="Mektup kilitliyken de görünür; sürprizi başlıkta verme.">
            <Input
              {...describedBy("title", fieldErrors.title, true)}
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              maxLength={160}
              required
            />
          </Field>

          <Field htmlFor="body" label="Mektup" error={fieldErrors.body}>
            <Textarea
              {...describedBy("body", fieldErrors.body)}
              value={form.body}
              onChange={(e) => set("body", e.target.value)}
              rows={16}
              className="min-h-80 font-display text-[18px] leading-[1.8]"
              placeholder="Buraya yalnızca senin kelimelerin yazılır."
            />
          </Field>

          <div className="grid gap-6 sm:grid-cols-2">
            <Field htmlFor="category" label="Raf">
              <Select id="category" value={form.category} onChange={(e) => set("category", e.target.value as typeof form.category)}>
                {categories.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field htmlFor="writtenOn" label="Tarih" error={fieldErrors.writtenOn}>
              <Input
                {...describedBy("writtenOn", fieldErrors.writtenOn)}
                type="date"
                value={form.writtenOn}
                onChange={(e) => set("writtenOn", e.target.value)}
              />
            </Field>
          </div>

          <fieldset>
            <legend className="mb-2 text-[13px] font-medium text-ink-soft">Yazı</legend>
            <div className="flex gap-2">
              {(["serif", "hand"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={form.fontStyle === value}
                  onClick={() => set("fontStyle", value)}
                  className={cn(
                    "h-12 flex-1 rounded-xl border px-4 transition-colors",
                    value === "hand" ? "font-hand text-2xl" : "font-display text-lg",
                    form.fontStyle === value
                      ? "border-accent bg-accent-wash text-ink"
                      : "border-line-strong bg-pearl text-ink-soft hover:border-taupe",
                  )}
                >
                  {value === "serif" ? "Basılı" : "El yazısı"}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-2 text-[13px] font-medium text-ink-soft">Zarf</legend>
            <div className="flex flex-wrap gap-2">
              {ENVELOPE_STYLES.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={form.envelopeStyle === option.value}
                  onClick={() => set("envelopeStyle", option.value)}
                  className={cn(
                    "flex h-11 items-center gap-2.5 rounded-full border pr-4 pl-1.5 text-[13px] transition-colors",
                    form.envelopeStyle === option.value
                      ? "border-accent text-ink"
                      : "border-line-strong text-ink-soft hover:border-taupe",
                  )}
                >
                  <span className="size-8 rounded-full border border-line" style={{ background: SWATCH[option.value] }} />
                  {option.label}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-2 text-[13px] font-medium text-ink-soft">Mühür</legend>
            <div className="flex flex-wrap gap-2">
              {SEALS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={form.seal === option.value}
                  aria-label={option.label}
                  title={option.label}
                  onClick={() => set("seal", option.value)}
                  className={cn(
                    "grid size-14 place-items-center rounded-2xl border transition-colors",
                    form.seal === option.value ? "border-accent bg-accent-wash" : "border-line-strong hover:border-taupe",
                  )}
                >
                  <WaxSeal glyph={option.value} className="size-9 text-accent" />
                </button>
              ))}
            </div>
          </fieldset>

          <Field
            htmlFor="unlockOn"
            label="Açılacağı gün"
            optional
            error={fieldErrors.unlockOn}
            hint={`Bir gün seçersen mektup mühürlenir: ${recipientName} o güne kadar yalnızca başlığı ve tarihi görür. Boş bırakırsan hemen okunabilir.`}
          >
            <div className="flex gap-2">
              <Input
                {...describedBy("unlockOn", fieldErrors.unlockOn, true)}
                type="date"
                value={form.unlockOn}
                onChange={(e) => set("unlockOn", e.target.value)}
              />
              {form.unlockOn ? (
                <Button variant="ghost" onClick={() => set("unlockOn", "")}>
                  Kaldır
                </Button>
              ) : null}
            </div>
          </Field>

          <div className="sticky bottom-4 z-10 flex flex-wrap items-center gap-2 rounded-2xl border border-line bg-ivory/95 p-3 shadow-lift backdrop-blur">
            <Button variant="outline" onClick={submit(false)} disabled={pending}>
              {form.status === "published" ? "Taslağa çek" : "Taslak kaydet"}
            </Button>
            <Button variant="accent" onClick={submit(true)} disabled={pending}>
              {pending ? <Spinner /> : null}
              {form.status === "published" ? "Güncelle" : "Yayımla"}
            </Button>
            <span className="ml-1 text-[12px] text-muted">
              {form.status === "published" ? "Şu an yayında." : "Taslak — yalnızca sen görürsün."}
            </span>
            {form.id ? (
              <Confirm
                trigger={
                  <Button variant="ghost" size="icon" className="ml-auto text-taupe hover:text-[#8c3b3b]" aria-label="Çöp kutusuna taşı">
                    <Trash2 aria-hidden="true" />
                  </Button>
                }
                title="Mektup çöp kutusuna taşınsın mı?"
                description="Siteden kalkar ama silinmez. Çöp kutusundan geri alabilirsin."
                confirmLabel="Çöp kutusuna taşı"
                onConfirm={moveToTrash}
              />
            ) : null}
          </div>
        </form>

        <aside aria-label="Canlı önizleme" className={cn("lg:sticky lg:top-24 lg:h-max", tab === "write" && "hidden lg:block")}>
          <p className="eyebrow mb-5 hidden lg:block">Canlı önizleme</p>
          {preview}
        </aside>
      </div>
    </div>
  );
}
