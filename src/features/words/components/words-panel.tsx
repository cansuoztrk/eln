"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";
import type { ActionResult } from "@/lib/result";
import { addWrittenLettersAction, addWrittenNotesAction, fillWrittenPagesAction } from "../actions";

type Kind = "letters" | "notes" | "pages";

const ACTIONS: Record<Kind, () => Promise<ActionResult<unknown>>> = {
  letters: addWrittenLettersAction,
  notes: addWrittenNotesAction,
  pages: fillWrittenPagesAction,
};

/** One button for one kind of ready writing; says what happened and where to read it. */
export function AddWords({ kind, label, done, href, hrefLabel }: { kind: Kind; label: string; done: boolean; href: string; hrefLabel: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);

  function add() {
    setBusy(true);
    startTransition(async () => {
      const result = await ACTIONS[kind]();
      setBusy(false);
      toast(result.ok ? (result.message ?? "Eklendi.") : result.error, result.ok ? "ok" : "error");
      router.refresh();
    });
  }

  return (
    <div className="mt-5 flex flex-wrap items-center gap-3">
      <Button variant={done ? "outline" : "accent"} onClick={add} disabled={done || busy || pending}>
        {busy || pending ? <Spinner /> : null}
        {done ? "Hepsi eklendi" : label}
      </Button>
      <Link href={href} className="text-[13px] font-medium tracking-wide text-accent underline-offset-4 hover:underline">
        {hrefLabel}
      </Link>
    </div>
  );
}
