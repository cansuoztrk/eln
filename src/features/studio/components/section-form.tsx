"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Confirm } from "@/components/ui/confirm";
import { describedBy, Field, Input, Textarea } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";
import { discardSectionDraftAction, saveSectionAction } from "@/features/content/actions";
import { useAction } from "@/lib/use-action";

export type SectionField = {
  name: string;
  label: string;
  kind: "text" | "textarea" | "url";
  hint?: string;
  rows?: number;
  placeholder?: string;
  maxLength?: number;
};

type Props = {
  sectionKey: string;
  title: string;
  description?: string;
  fields: SectionField[];
  /** The working copy (draft if one exists). */
  initial: Record<string, unknown>;
  hasDraft: boolean;
  /** Extra controls (e.g. a photo picker) that read and write the same values. */
  extra?: (values: Record<string, unknown>, set: (name: string, value: unknown) => void) => ReactNode;
  /** A live preview of the values. */
  preview?: (values: Record<string, unknown>) => ReactNode;
};

/**
 * Edits one piece of site copy. "Taslak kaydet" keeps the change to Arda
 * alone; "Yayımla" is the moment it becomes visible to both.
 */
export function SectionForm({ sectionKey, title, description, fields, initial, hasDraft, extra, preview }: Props) {
  const router = useRouter();
  const [values, setValues] = useState(initial);
  const { run, pending, fieldErrors } = useAction(saveSectionAction, { onSuccess: () => router.refresh() });
  const set = (name: string, value: unknown) => setValues((v) => ({ ...v, [name]: value }));

  const save = (publish: boolean) => (event?: FormEvent) => {
    event?.preventDefault();
    run({ key: sectionKey, data: values, publish });
  };

  async function discard() {
    const result = await discardSectionDraftAction(sectionKey);
    if (result.ok) {
      toast(result.message ?? "Taslak silindi.");
      router.refresh();
    } else toast(result.error, "error");
  }

  const form = (
    <form method="post" onSubmit={save(false)} noValidate className="space-y-5">
      {fields.map((field) => {
        const id = `${sectionKey}-${field.name}`.replace(/\./g, "-");
        const value = String(values[field.name] ?? "");
        const error = fieldErrors[field.name];
        return (
          <Field key={field.name} htmlFor={id} label={field.label} hint={field.hint} error={error}>
            {field.kind === "textarea" ? (
              <Textarea
                {...describedBy(id, error, field.hint)}
                rows={field.rows ?? 5}
                value={value}
                maxLength={field.maxLength}
                placeholder={field.placeholder}
                onChange={(e) => set(field.name, e.target.value)}
              />
            ) : (
              <Input
                {...describedBy(id, error, field.hint)}
                type={field.kind === "url" ? "url" : "text"}
                inputMode={field.kind === "url" ? "url" : undefined}
                value={value}
                maxLength={field.maxLength}
                placeholder={field.placeholder}
                onChange={(e) => set(field.name, e.target.value)}
              />
            )}
          </Field>
        );
      })}
      {extra?.(values, set)}
      <div className="flex flex-wrap items-center gap-2 pt-2">
        <Button type="submit" variant="outline" disabled={pending}>
          Taslak kaydet
        </Button>
        <Button variant="accent" onClick={save(true)} disabled={pending}>
          {pending ? <Spinner /> : null}
          Yayımla
        </Button>
        {hasDraft ? (
          <Confirm
            trigger={<Button variant="ghost">Taslağı sil</Button>}
            title="Taslak silinsin mi?"
            description="Yayımlanmamış değişikliklerin gider; sitede görünen hali olduğu gibi kalır."
            confirmLabel="Taslağı sil"
            onConfirm={discard}
          />
        ) : null}
      </div>
    </form>
  );

  return (
    <section className="paper p-5 sm:p-7">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl text-ink">{title}</h2>
          {description ? <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted">{description}</p> : null}
        </div>
        {hasDraft ? <Badge tone="draft">Yayımlanmamış taslak var</Badge> : <Badge tone="live">Yayında olanla aynı</Badge>}
      </div>
      {preview ? (
        <div className="grid gap-8 lg:grid-cols-2">
          {form}
          <aside aria-label="Önizleme">
            <p className="eyebrow mb-4">Canlı önizleme</p>
            {preview(values)}
          </aside>
        </div>
      ) : (
        form
      )}
    </section>
  );
}
