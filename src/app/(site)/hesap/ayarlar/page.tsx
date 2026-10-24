import type { Metadata } from "next";
import Link from "next/link";
import { deleteAccount, updateInterests, updatePreferences, updateProfile } from "@/app/actions/account";
import { changePassword } from "@/app/actions/auth";
import { ActionForm } from "@/components/forms/action-form";
import { requireUser } from "@/server/auth/guards";
import { db } from "@/server/db";
import { formatDateTime } from "@/lib/time";

export const metadata: Metadata = { title: "Ayarlar ve gizlilik", robots: { index: false } };

function Card({ id, title, description, children }: { id?: string; title: string; description?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="card scroll-mt-28 p-5">
      <h2 className="font-display text-[17px] font-[650]">{title}</h2>
      {description ? <p className="mb-4 mt-1 text-[13px] text-ink-2">{description}</p> : <div className="mb-4" />}
      {children}
    </section>
  );
}

export default async function SettingsPage() {
  const u = await requireUser("/hesap/ayarlar");
  const [user, categories, interests, sessions] = await Promise.all([
    db.user.findUniqueOrThrow({ where: { id: u.id } }),
    db.category.findMany({ where: { parentId: { not: null }, isActive: true, slug: { not: "diger-firsatlar" } }, orderBy: [{ parent: { sortOrder: "asc" } }, { sortOrder: "asc" }], include: { parent: { select: { name: true } } } }),
    db.userInterest.findMany({ where: { userId: u.id }, select: { categoryId: true } }),
    db.session.count({ where: { userId: u.id, expiresAt: { gt: new Date() } } }),
  ]);
  const selected = new Set(interests.map((i) => i.categoryId));
  const groups = new Map<string, typeof categories>();
  for (const c of categories) groups.set(c.parent?.name ?? "", [...(groups.get(c.parent?.name ?? "") ?? []), c]);

  return (
    <div className="space-y-5">
      <Card title="Profil">
        <ActionForm action={updateProfile} submitLabel="Kaydet">
          <label className="block max-w-sm">
            <span className="mb-1.5 block text-[13px] font-medium">Ad</span>
            <input name="name" defaultValue={user.name ?? ""} maxLength={80} className="field" />
          </label>
          <p className="text-[12.5px] text-ink-3">E-posta: {user.email}</p>
        </ActionForm>
      </Card>

      <Card id="ilgi" title="İlgi alanları" description="Kişisel fırsat akışınız ve haftalık özet bu kategorilere göre hazırlanır.">
        <ActionForm action={updateInterests} submitLabel="İlgi alanlarını kaydet">
          <div className="grid gap-5 md:grid-cols-2">
            {[...groups.entries()].map(([group, cats]) => (
              <fieldset key={group}>
                <legend className="eyebrow mb-2">{group}</legend>
                <div className="flex flex-wrap gap-1.5">
                  {cats.map((c) => (
                    <label key={c.id} className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-line px-2.5 py-1.5 text-[13px] has-[:checked]:border-brand has-[:checked]:bg-brand-soft has-[:checked]:text-brand-ink">
                      <input type="checkbox" name="category" value={c.id} defaultChecked={selected.has(c.id)} className="sr-only" />
                      {c.name}
                    </label>
                  ))}
                </div>
              </fieldset>
            ))}
          </div>
        </ActionForm>
      </Card>

      <Card title="Bildirim tercihleri" description="Site içi bildirimler her zaman açıktır. E-posta yalnızca izin verdiğiniz konularda gönderilir.">
        <ActionForm action={updatePreferences} submitLabel="Tercihleri kaydet">
          <label className="flex items-start gap-2.5 text-[13.5px]">
            <input type="checkbox" name="emailAlertsEnabled" defaultChecked={user.emailAlertsEnabled} className="mt-0.5 size-4 accent-[var(--brand)]" />
            <span>
              Fiyat ve uçuş alarmlarım tetiklendiğinde e-posta gönder
            </span>
          </label>
          <label className="flex items-start gap-2.5 text-[13.5px]">
            <input type="checkbox" name="digestOptIn" defaultChecked={user.digestOptIn} className="mt-0.5 size-4 accent-[var(--brand)]" />
            <span>
              Haftalık doğrulanmış fırsat özeti (e-posta)
              {user.digestOptInAt ? <span className="block text-[12px] text-ink-3">İzin tarihi: {formatDateTime(user.digestOptInAt)}</span> : null}
            </span>
          </label>
        </ActionForm>
      </Card>

      <Card title="Parola" description={`Parolayı değiştirdiğinizde diğer cihazlardaki oturumlar kapatılır. Aktif oturum: ${sessions}.`}>
        <ActionForm action={changePassword} submitLabel="Parolayı değiştir">
          <div className="grid max-w-xl gap-3 sm:grid-cols-2">
            <label>
              <span className="mb-1.5 block text-[13px] font-medium">Mevcut parola</span>
              <input name="current" type="password" required autoComplete="current-password" className="field" />
            </label>
            <label>
              <span className="mb-1.5 block text-[13px] font-medium">Yeni parola</span>
              <input name="password" type="password" required minLength={10} autoComplete="new-password" className="field" />
            </label>
          </div>
        </ActionForm>
      </Card>

      <Card title="Verilerim (KVKK)" description="Hesabınızla ilişkili kişisel verilerin bir kopyasını indirebilir veya hesabınızı tamamen silebilirsiniz.">
        <div className="flex flex-wrap gap-3">
          <a href="/hesap-verilerim" className="inline-flex h-10 items-center rounded-md border border-line-strong px-4 text-[13.5px] font-medium hover:bg-surface-2">
            Verilerimi indir (JSON)
          </a>
          <Link href="/kvkk" className="inline-flex h-10 items-center px-2 text-[13.5px] text-brand-ink hover:underline">
            Aydınlatma metni
          </Link>
        </div>
        <details className="mt-5 rounded-md border border-bad/40 p-4">
          <summary className="cursor-pointer text-[13.5px] font-semibold text-bad-ink">Hesabı sil</summary>
          <p className="mt-2 text-[13px] text-ink-2">Favorileriniz, alarmlarınız, bildirimleriniz ve oturumlarınız kalıcı olarak silinir. Bu işlem geri alınamaz.</p>
          <ActionForm action={deleteAccount} submitLabel="Hesabımı kalıcı olarak sil" danger className="mt-3">
            <div className="grid max-w-xl gap-3 sm:grid-cols-2">
              <label>
                <span className="mb-1.5 block text-[13px] font-medium">Parola</span>
                <input name="password" type="password" required autoComplete="current-password" className="field" />
              </label>
              <label>
                <span className="mb-1.5 block text-[13px] font-medium">Onay için “SİL” yazın</span>
                <input name="confirm" required className="field" />
              </label>
            </div>
          </ActionForm>
        </details>
      </Card>
    </div>
  );
}
