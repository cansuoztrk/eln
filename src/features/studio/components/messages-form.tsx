"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Field, Textarea } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { saveSectionAction } from "@/features/content/actions";
import { useAction } from "@/lib/use-action";

/** Short lines for the Little World, one per line — each of them Arda's own. */
export function MessagesForm({ initial }: { initial: string[] }) {
  const router = useRouter();
  const [text, setText] = useState(initial.join("\n"));
  const { run, pending } = useAction(saveSectionAction, { onSuccess: () => router.refresh() });
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  function submit(event: FormEvent) {
    event.preventDefault();
    run({ key: "corner.messages", data: { messages: lines.slice(0, 120) }, publish: true });
  }

  return (
    <section className="paper p-5 sm:p-7">
      <h2 className="font-display text-2xl text-ink">Minik Dünya — tatlı mesajlar</h2>
      <p className="mt-1 mb-5 max-w-xl text-sm leading-relaxed text-muted">
        Minik Dünya&apos;da her gün bunlardan biri görünür. Her satır bir mesaj; en fazla 240 karakter. Boş bırakırsan orada mesaj görünmez.
      </p>
      <form method="post" onSubmit={submit} noValidate className="space-y-4">
        <Field htmlFor="corner-messages" label={`Mesajlar (${lines.length})`}>
          <Textarea id="corner-messages" rows={6} value={text} onChange={(e) => setText(e.target.value)} className="font-display text-[18px] leading-relaxed" />
        </Field>
        <Button type="submit" variant="accent" disabled={pending}>
          {pending ? <Spinner /> : null}
          Kaydet ve yayımla
        </Button>
      </form>
    </section>
  );
}
