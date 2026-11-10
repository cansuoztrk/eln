"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { describedBy, Field, Input } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { useAction } from "@/lib/use-action";
import { saveSpaceSettingsAction, type SpaceSettingsInput } from "../actions";

export function SettingsForm({ initial }: { initial: SpaceSettingsInput }) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const { run, pending, fieldErrors } = useAction(saveSpaceSettingsAction, { onSuccess: () => router.refresh() });
  const field = (key: keyof SpaceSettingsInput, label: string, hint?: string) => (
    <Field htmlFor={`s-${key}`} label={label} hint={hint} error={fieldErrors[key]}>
      <Input {...describedBy(`s-${key}`, fieldErrors[key], hint)} value={form[key]} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} />
    </Field>
  );

  return (
    <form
      method="post"
      noValidate
      onSubmit={(event: FormEvent) => {
        event.preventDefault();
        run(form);
      }}
      className="space-y-8"
    >
      <fieldset className="grid gap-5 sm:grid-cols-2">
        <legend className="mb-4 font-display text-2xl text-ink">Sen</legend>
        {field("ownerName", "Adın")}
        {field("ownerCity", "Şehrin")}
        {field("ownerTimezone", "Saat dilimin", "IANA adı, ör. Europe/Istanbul")}
      </fieldset>
      <fieldset className="grid gap-5 sm:grid-cols-2">
        <legend className="mb-4 font-display text-2xl text-ink">O</legend>
        {field("partnerName", "Hitap adı", "Sitede her yerde bu görünür.")}
        {field("partnerFullName", "Tam adı")}
        {field("partnerCity", "Şehri")}
        {field("partnerTimezone", "Saat dilimi", "IANA adı, ör. Asia/Baku")}
      </fieldset>
      <Button type="submit" variant="accent" disabled={pending}>
        {pending ? <Spinner /> : null}
        Kaydet
      </Button>
    </form>
  );
}
