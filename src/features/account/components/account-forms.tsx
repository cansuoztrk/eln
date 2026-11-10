"use client";

import { Download } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { describedBy, Field, Input } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { PasswordInput } from "@/features/auth/components/password-field";
import { useAction } from "@/lib/use-action";
import { changePasswordAction, deleteAccountAction, updateProfileAction } from "../actions";

export function ProfileForm({ displayName }: { displayName: string }) {
  const router = useRouter();
  const [name, setName] = useState(displayName);
  const { run, pending, fieldErrors } = useAction(updateProfileAction, { onSuccess: () => router.refresh() });

  return (
    <form
      method="post"
      noValidate
      onSubmit={(event: FormEvent) => {
        event.preventDefault();
        run({ displayName: name });
      }}
      className="flex flex-col gap-4 sm:flex-row sm:items-end"
    >
      <Field htmlFor="displayName" label="Görünen ad" error={fieldErrors.displayName} className="flex-1">
        <Input {...describedBy("displayName", fieldErrors.displayName)} value={name} maxLength={60} onChange={(e) => setName(e.target.value)} />
      </Field>
      <Button type="submit" variant="outline" disabled={pending || name.trim() === displayName}>
        {pending ? <Spinner /> : null}
        Kaydet
      </Button>
    </form>
  );
}

export function PasswordForm() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const { run, pending, fieldErrors } = useAction(changePasswordAction, {
    onSuccess: () => {
      setPassword("");
      setConfirm("");
    },
  });

  return (
    <form
      method="post"
      noValidate
      onSubmit={(event: FormEvent) => {
        event.preventDefault();
        run({ password, confirm });
      }}
      className="grid gap-4 sm:grid-cols-2"
    >
      <Field htmlFor="new-password" label="Yeni parola" hint="En az 10 karakter." error={fieldErrors.password}>
        <PasswordInput {...describedBy("new-password", fieldErrors.password, true)} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
      </Field>
      <Field htmlFor="confirm-password" label="Bir kez daha" error={fieldErrors.confirm}>
        <PasswordInput {...describedBy("confirm-password", fieldErrors.confirm)} autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
      </Field>
      <div>
        <Button type="submit" variant="outline" disabled={pending || password.length === 0}>
          {pending ? <Spinner /> : null}
          Parolayı değiştir
        </Button>
      </div>
    </form>
  );
}

export function ExportButtons() {
  return (
    <div className="flex flex-wrap gap-2">
      <Button asChild variant="soft">
        <a href="/api/export?format=json" download>
          <Download aria-hidden="true" />
          Yazdıklarım (JSON)
        </a>
      </Button>
      <Button asChild variant="soft">
        <a href="/api/export?format=zip" download>
          <Download aria-hidden="true" />
          Yüklediğim dosyalar (ZIP)
        </a>
      </Button>
    </div>
  );
}

export function DeleteAccountForm({ phrase }: { phrase: string }) {
  const router = useRouter();
  const [confirmation, setConfirmation] = useState("");
  const { run, pending, fieldErrors } = useAction(deleteAccountAction, {
    toastOnError: false,
    onSuccess: ({ redirectTo }) => {
      router.replace(redirectTo);
      router.refresh();
    },
  });

  return (
    <form
      method="post"
      noValidate
      onSubmit={(event: FormEvent) => {
        event.preventDefault();
        run({ confirmation });
      }}
      className="flex flex-col gap-4 sm:flex-row sm:items-end"
    >
      <Field htmlFor="confirmation" label={`Onaylamak için "${phrase}" yaz`} error={fieldErrors.confirmation} className="flex-1">
        <Input {...describedBy("confirmation", fieldErrors.confirmation)} autoComplete="off" value={confirmation} onChange={(e) => setConfirmation(e.target.value)} />
      </Field>
      <Button type="submit" variant="danger" disabled={pending || confirmation.trim() !== phrase}>
        {pending ? <Spinner /> : null}
        Kalıcı olarak sil
      </Button>
    </form>
  );
}
