"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { describedBy, Field, Input } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { useAction } from "@/lib/use-action";
import { setupAction } from "../actions";
import { PasswordInput } from "./password-field";

export function SetupForm() {
  const router = useRouter();
  const [form, setForm] = useState({ secret: "", email: "", password: "", passwordConfirm: "" });
  const { run, pending, error, fieldErrors } = useAction(setupAction, {
    toastOnError: false,
    onSuccess: ({ redirectTo }) => {
      router.replace(redirectTo);
      router.refresh();
    },
  });

  const set = (key: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    run(form);
  }

  return (
    <form method="post" onSubmit={onSubmit} noValidate className="paper space-y-5 p-7 sm:p-9">
      <Field
        htmlFor="secret"
        label="Kurulum anahtarı"
        hint="Sunucudaki SETUP_SECRET değeri. Yalnızca bu ilk kurulumda sorulur."
        error={fieldErrors.secret}
      >
        <PasswordInput
          {...describedBy("secret", fieldErrors.secret, true)}
          name="secret"
          autoComplete="off"
          required
          value={form.secret}
          onChange={set("secret")}
        />
      </Field>
      <Field htmlFor="email" label="E-postan" error={fieldErrors.email}>
        <Input
          {...describedBy("email", fieldErrors.email)}
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          required
          value={form.email}
          onChange={set("email")}
        />
      </Field>
      <Field htmlFor="password" label="Parola" hint="En az 10 karakter." error={fieldErrors.password}>
        <PasswordInput
          {...describedBy("password", fieldErrors.password, true)}
          name="password"
          autoComplete="new-password"
          required
          value={form.password}
          onChange={set("password")}
        />
      </Field>
      <Field htmlFor="passwordConfirm" label="Parola (tekrar)" error={fieldErrors.passwordConfirm}>
        <PasswordInput
          {...describedBy("passwordConfirm", fieldErrors.passwordConfirm)}
          name="passwordConfirm"
          autoComplete="new-password"
          required
          value={form.passwordConfirm}
          onChange={set("passwordConfirm")}
        />
      </Field>

      {error ? (
        <p role="alert" className="rounded-xl bg-[#f8e9e7] px-4 py-3 text-sm text-[#8c3b3b]">
          {error}
        </p>
      ) : null}

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? <Spinner /> : null}
        Dünyayı kur
      </Button>
    </form>
  );
}
