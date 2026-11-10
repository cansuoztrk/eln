"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { describedBy, Field, Input } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { useAction } from "@/lib/use-action";
import { loginAction } from "../actions";
import { PasswordInput } from "./password-field";

export function LoginForm({ next }: { next?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { run, pending, error, fieldErrors } = useAction(loginAction, {
    toastOnError: false,
    onSuccess: ({ redirectTo }) => {
      router.replace(redirectTo);
      router.refresh();
    },
  });

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    run({ email, password, next });
  }

  return (
    <form method="post" onSubmit={onSubmit} noValidate className="paper space-y-5 p-7 sm:p-9">
      <Field htmlFor="email" label="E-posta" error={fieldErrors.email}>
        <Input
          {...describedBy("email", fieldErrors.email)}
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </Field>
      <Field htmlFor="password" label="Parola" error={fieldErrors.password}>
        <PasswordInput
          {...describedBy("password", fieldErrors.password)}
          name="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </Field>

      {error ? (
        <p role="alert" className="rounded-xl bg-[#f8e9e7] px-4 py-3 text-sm text-[#8c3b3b]">
          {error}
        </p>
      ) : null}

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? <Spinner /> : null}
        İçeri gir
      </Button>
    </form>
  );
}
