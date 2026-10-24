"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login, register, requestPasswordReset, resetPassword, type AuthState } from "@/app/actions/auth";

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-medium">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-[12px] text-ink-3">{hint}</span> : null}
    </label>
  );
}

function ErrorBox({ state }: { state: AuthState }) {
  if (state.error) return <p role="alert" className="rounded-md bg-bad-soft px-3 py-2.5 text-[13px] text-bad-ink">{state.error}</p>;
  if (state.ok && state.message) return <p role="status" className="rounded-md bg-good-soft px-3 py-2.5 text-[13px] text-good-ink">{state.message}</p>;
  return null;
}

const submitCls = "h-11 w-full rounded-md bg-brand text-[14px] font-semibold text-on-brand transition-colors hover:bg-brand-ink disabled:opacity-60";

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(login, {});
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="sonra" value={next} />
      <ErrorBox state={state} />
      <Field label="E-posta">
        <input name="email" type="email" required autoComplete="email" defaultValue={state.fields?.email} className="field h-11" />
      </Field>
      <Field label="Parola">
        <input name="password" type="password" required autoComplete="current-password" className="field h-11" />
      </Field>
      <div className="flex justify-end">
        <Link href="/sifremi-unuttum" className="text-[13px] text-brand-ink hover:underline">
          Parolamı unuttum
        </Link>
      </div>
      <button disabled={pending} className={submitCls}>
        {pending ? "Giriş yapılıyor…" : "Giriş yap"}
      </button>
    </form>
  );
}

export function RegisterForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(register, {});
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="sonra" value={next} />
      <ErrorBox state={state} />
      <Field label="Ad (isteğe bağlı)">
        <input name="name" autoComplete="given-name" maxLength={80} className="field h-11" />
      </Field>
      <Field label="E-posta" hint="Yalnızca giriş ve seçtiğiniz bildirimler için kullanılır.">
        <input name="email" type="email" required autoComplete="email" defaultValue={state.fields?.email} className="field h-11" />
      </Field>
      <Field label="Parola" hint="En az 10 karakter; harf ve rakam içermeli.">
        <input name="password" type="password" required minLength={10} autoComplete="new-password" className="field h-11" />
      </Field>
      <label className="flex items-start gap-2.5 text-[13px] text-ink-2">
        <input type="checkbox" name="kvkk" required className="mt-0.5 size-4 accent-[var(--brand)]" />
        <span>
          <Link href="/kvkk" className="text-brand-ink underline" target="_blank">
            KVKK aydınlatma metnini
          </Link>{" "}
          okudum. Hesabım için gerekli verilerin işlenmesini kabul ediyorum.
        </span>
      </label>
      <label className="flex items-start gap-2.5 text-[13px] text-ink-2">
        <input type="checkbox" name="digest" className="mt-0.5 size-4 accent-[var(--brand)]" />
        <span>Haftalık doğrulanmış fırsat özetini e-postayla almak istiyorum (isteğe bağlı, istediğim zaman ayrılabilirim).</span>
      </label>
      <button disabled={pending} className={submitCls}>
        {pending ? "Hesap oluşturuluyor…" : "Ücretsiz hesap oluştur"}
      </button>
    </form>
  );
}

export function ForgotForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(requestPasswordReset, {});
  return (
    <form action={action} className="space-y-4">
      <ErrorBox state={state} />
      <Field label="E-posta">
        <input name="email" type="email" required autoComplete="email" className="field h-11" />
      </Field>
      <button disabled={pending} className={submitCls}>
        Sıfırlama bağlantısı gönder
      </button>
    </form>
  );
}

export function ResetForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(resetPassword, {});
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      <ErrorBox state={state} />
      <Field label="Yeni parola" hint="En az 10 karakter; harf ve rakam içermeli.">
        <input name="password" type="password" required minLength={10} autoComplete="new-password" className="field h-11" />
      </Field>
      <button disabled={pending} className={submitCls}>
        Parolayı güncelle
      </button>
    </form>
  );
}
