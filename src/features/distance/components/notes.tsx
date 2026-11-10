"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Confirm } from "@/components/ui/confirm";
import { Textarea } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";
import { trashAction } from "@/features/trash/actions";
import { useAction } from "@/lib/use-action";
import { addNoteAction } from "../actions";
import { NOTE_MAX, type NoteKind } from "../schema";

/** A small box for leaving a line. It never suggests what to feel or say. */
export function NoteComposer({ kind, label, placeholder, submitLabel }: { kind: NoteKind; label: string; placeholder: string; submitLabel: string }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const { run, pending, fieldErrors } = useAction(addNoteAction, {
    onSuccess: () => {
      setBody("");
      router.refresh();
    },
  });
  const id = `composer-${kind}`;

  function submit(event: FormEvent) {
    event.preventDefault();
    run({ kind, body });
  }

  return (
    <form method="post" onSubmit={submit} noValidate className="paper p-4 sm:p-5">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <Textarea
        id={id}
        rows={3}
        value={body}
        maxLength={NOTE_MAX}
        placeholder={placeholder}
        aria-invalid={fieldErrors.body ? true : undefined}
        aria-describedby={`${id}-count`}
        onChange={(e) => setBody(e.target.value)}
        className="min-h-24 border-0 bg-transparent px-1 font-hand text-2xl leading-snug focus:ring-0"
      />
      {fieldErrors.body ? (
        <p role="alert" className="px-1 text-[13px] text-[#a94442]">
          {fieldErrors.body}
        </p>
      ) : null}
      <div className="mt-2 flex items-center justify-between gap-3 border-t border-line pt-3">
        <span id={`${id}-count`} className="text-[12px] text-taupe tabular-nums">
          {body.length} / {NOTE_MAX}
        </span>
        <Button type="submit" size="sm" variant="accent" disabled={pending || body.trim().length === 0}>
          {pending ? <Spinner /> : null}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

export function DeleteNoteButton({ id }: { id: string }) {
  const router = useRouter();
  return (
    <Confirm
      trigger={
        <button type="button" aria-label="Bu notu çöp kutusuna taşı" className="grid size-8 place-items-center rounded-full text-taupe/70 transition-colors hover:bg-beige hover:text-[#8c3b3b]">
          <Trash2 className="size-3.5" aria-hidden="true" />
        </button>
      }
      title="Not kaldırılsın mı?"
      description="Sayfadan kalkar. Çöp kutusundan geri alınabilir."
      confirmLabel="Kaldır"
      onConfirm={async () => {
        const result = await trashAction("distance_notes", id);
        toast(result.ok ? "Not kaldırıldı." : result.error, result.ok ? "ok" : "error");
        router.refresh();
      }}
    />
  );
}
