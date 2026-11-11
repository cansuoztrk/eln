"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { describedBy, Field } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { useAction } from "@/lib/use-action";
import { acceptInviteAction } from "../actions";
import { PasswordInput } from "./password-field";

export function InviteForm({ token }: { token: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const { run, pending, error, fieldErrors } = useAction(acceptInviteAction, {
    toastOnError: false,
    onSuccess: ({ redirectTo }) => {
      router.replace(redirectTo);
      router.refresh();
    },
  });

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    run({ token, password, passwordConfirm });
  }

  return (
    <form method="post" onSubmit={onSubmit} noValidate className="space-y-5">
      <Field
        htmlFor="password"
        label="Anahtarın"
        hint="En az 10 karakter. Buraya her dönüşünde bunu kullanacaksın."
        error={fieldErrors.password}
      >
        <PasswordInput
          {...describedBy("password", fieldErrors.password, true)}
          name="password"
          autoComplete="new-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </Field>
      <Field htmlFor="passwordConfirm" label="Bir kez daha" error={fieldErrors.passwordConfirm}>
        <PasswordInput
          {...describedBy("passwordConfirm", fieldErrors.passwordConfirm)}
          name="passwordConfirm"
          autoComplete="new-password"
          required
          value={passwordConfirm}
          onChange={(e) => setPasswordConfirm(e.target.value)}
        />
      </Field>

      {error ? (
        <p role="alert" className="rounded-xl bg-[#f8e9e7] px-4 py-3 text-sm text-[#8c3b3b]">
          {error}
        </p>
      ) : null}

      <Button type="submit" variant="accent" size="lg" className="w-full" disabled={pending}>
        {pending ? <Spinner /> : null}
        Kapıyı aç
      </Button>
    </form>
  );
}
