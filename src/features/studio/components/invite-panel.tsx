"use client";

import { Check, Copy } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Confirm } from "@/components/ui/confirm";
import { describedBy, Field, Input, Select } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";
import { createInviteAction, revokeInviteAction } from "@/features/auth/actions";
import { useAction } from "@/lib/use-action";

/** Creates the one link that lets Eln in. Shown once; Arda delivers it himself. */
export function InviteForm({ defaultName }: { defaultName: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState(defaultName);
  const [days, setDays] = useState("14");
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const { run, pending, fieldErrors, error } = useAction(createInviteAction, {
    toastOnError: false,
    onSuccess: (data) => {
      setLink(data.link);
      setCopied(false);
      router.refresh();
    },
  });

  function submit(event: FormEvent) {
    event.preventDefault();
    run({ email, displayName, expiresInDays: Number(days) });
  }

  async function copy() {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast("Bağlantı kopyalandı.");
    } catch {
      toast("Kopyalanamadı; bağlantıyı elle seçip kopyala.", "error");
    }
  }

  return (
    <div className="space-y-6">
      <form method="post" onSubmit={submit} noValidate className="grid gap-5 sm:grid-cols-2">
        <Field htmlFor="invite-email" label="E-posta" error={fieldErrors.email} hint="Giriş yaparken bunu kullanacak. Site ona e-posta göndermez.">
          <Input
            {...describedBy("invite-email", fieldErrors.email, true)}
            type="email"
            inputMode="email"
            autoCapitalize="none"
            spellCheck={false}
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        <Field htmlFor="invite-name" label="Sitede görünecek adı" error={fieldErrors.displayName}>
          <Input
            {...describedBy("invite-name", fieldErrors.displayName)}
            required
            maxLength={60}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </Field>
        <Field htmlFor="invite-days" label="Bağlantı ne kadar geçerli olsun?">
          <Select id="invite-days" value={days} onChange={(e) => setDays(e.target.value)}>
            <option value="3">3 gün</option>
            <option value="7">7 gün</option>
            <option value="14">14 gün</option>
            <option value="30">30 gün</option>
          </Select>
        </Field>
        <div className="flex items-end">
          <Button type="submit" variant="accent" disabled={pending} className="w-full sm:w-auto">
            {pending ? <Spinner /> : null}
            Davet bağlantısı oluştur
          </Button>
        </div>
        {error ? (
          <p role="alert" className="rounded-xl bg-[#f8e9e7] px-4 py-3 text-sm text-[#8c3b3b] sm:col-span-2">
            {error}
          </p>
        ) : null}
      </form>

      {link ? (
        <div className="rounded-2xl border border-accent/40 bg-accent-wash p-5" role="status">
          <p className="text-sm font-medium text-ink">Bağlantı hazır — yalnızca şimdi görebilirsin.</p>
          <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">
            Güvenlik için bu bağlantı saklanmaz. Kopyala ve Eln&apos;e kendin, istediğin an ilet. Tek kullanımlıktır; yeni bir
            bağlantı oluşturursan bu geçersiz olur.
          </p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <Input readOnly value={link} aria-label="Davet bağlantısı" onFocus={(e) => e.target.select()} className="font-mono text-[13px]" />
            <Button onClick={copy} className="shrink-0">
              {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
              {copied ? "Kopyalandı" : "Kopyala"}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function RevokeInviteButton({ id }: { id: string }) {
  const router = useRouter();
  return (
    <Confirm
      trigger={
        <Button variant="ghost" size="sm">
          İptal et
        </Button>
      }
      title="Davet iptal edilsin mi?"
      description="Bu bağlantı artık çalışmaz. İstediğin zaman yenisini oluşturabilirsin."
      confirmLabel="Daveti iptal et"
      onConfirm={async () => {
        const result = await revokeInviteAction(id);
        toast(result.ok ? (result.message ?? "İptal edildi.") : result.error, result.ok ? "ok" : "error");
        router.refresh();
      }}
    />
  );
}
