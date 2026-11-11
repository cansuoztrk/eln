import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { DeleteAccountForm, ExportButtons, PasswordForm, ProfileForm } from "@/features/account/components/account-forms";
import { TrashRowActions } from "@/features/studio/components/trash-row";
import { listTrash } from "@/features/studio/queries";
import { people, requireMember } from "@/lib/auth/session";
import { formatDate, todayIn } from "@/lib/dates";

export const metadata: Metadata = { title: "Hesabım" };

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="paper p-6 sm:p-8">
      <h2 className="mb-4 font-display text-3xl text-ink">{title}</h2>
      {children}
    </section>
  );
}

export default async function AccountPage() {
  const session = await requireMember();
  const { me, other } = people(session);
  const owner = session.role === "owner";
  // The owner's trash lives in the Studio; here it is for whoever has no Studio.
  const trash = owner ? [] : await listTrash(session);

  return (
    <>
      <PageHeader eyebrow="Account" title="Hesabım" />
      <div className="shell-narrow space-y-6">
        <Section title="Profil">
          <ProfileForm displayName={session.profile.display_name} />
          <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-line pt-5 text-sm">
            <div>
              <dt className="text-muted">E-posta</dt>
              <dd className="mt-0.5 break-all text-ink">{session.email}</dd>
            </div>
            <div>
              <dt className="text-muted">Şehir · saat dilimi</dt>
              <dd className="mt-0.5 text-ink">
                {me.city} · {me.timezone}
              </dd>
            </div>
          </dl>
        </Section>

        <Section title="Parola">
          <PasswordForm />
        </Section>

        <Section title="Burada ne tutulur, ne tutulmaz">
          <ul className="space-y-3 text-[15px] leading-relaxed text-ink-soft">
            <li>Bu site ne zaman girdiğini, neyi okuduğunu ya da kaç kez baktığını <strong className="font-medium text-ink">kaydetmez</strong>. Okundu bilgisi yoktur.</li>
            <li>Konumun istenmez ve tutulmaz. Şehirler sabit yazıdır; saatler saat diliminden hesaplanır.</li>
            <li>Taslakların ve &ldquo;yalnızca ben&rdquo; kayıtların yalnızca sana görünür — {other.name} dahil kimseye gösterilmez.</li>
            <li>Fotoğrafların herkese kapalı bir depoda durur; sitede gösterilen kopyalardan konum ve cihaz bilgisi silinir.</li>
            <li>Hiçbir şey eklemek zorunda değilsin. Yalnızca okuyabilir, istediğin zaman çıkabilirsin.</li>
            <li className="text-muted">
              Dürüst bir not: sitenin altyapısını {owner ? "sen" : "Arda"} yönetiyor; veritabanı sağlayıcısının yönetim paneli
              teknik olarak her şeye erişebilir. Uygulamanın kendisi bunu kullanmaz ve göstermez.
            </li>
          </ul>
        </Section>

        {!owner ? (
          <Section title="Sen de ekleyebilirsin">
            <p className="text-sm leading-relaxed text-muted">
              Hiçbiri beklenmiyor. İstersen, istediğin zaman — buradan her zaman ulaşabilirsin.
            </p>
            <ul className="mt-5 grid gap-2 sm:grid-cols-2">
              {(
                [
                  ["/gallery/mine", "Fotoğraflarım", "Kendi fotoğraflarını ekle"],
                  ["/letters/write", "Mektup yaz", "Taslak olarak da kalabilir"],
                  ["/story/write", "Anı yaz", "Hikâyeye kendi gözünden"],
                  ["/capsules/mine", "Kapsüllerim", "Geleceğe bir şey bırak"],
                ] as const
              ).map(([href, label, hint]) => (
                <li key={href}>
                  <Link href={href} className="block rounded-xl border border-line-strong px-4 py-3 transition-colors hover:border-accent hover:bg-accent-wash">
                    <span className="block text-[15px] font-medium text-ink">{label}</span>
                    <span className="block text-[13px] text-muted">{hint}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Section>
        ) : null}

        {!owner ? (
          <Section title="Çöp kutum">
            {trash.length === 0 ? (
              <p className="text-[15px] text-muted">Sildiğin bir şey olursa burada bekler; geri alabilir ya da kalıcı olarak silebilirsin.</p>
            ) : (
              <ul className="divide-y divide-line">
                {trash.map((item) => (
                  <li key={`${item.table}-${item.id}`} className="flex flex-wrap items-center justify-between gap-3 py-3.5">
                    <div className="min-w-0">
                      <p className="truncate text-[15px] text-ink">{item.title}</p>
                      <p className="text-[13px] text-muted">
                        {item.label} · {formatDate(todayIn(me.timezone, new Date(item.deletedAt)))}
                      </p>
                    </div>
                    <TrashRowActions table={item.table} id={item.id} />
                  </li>
                ))}
              </ul>
            )}
          </Section>
        ) : null}

        <Section title="Verimi indir">
          <p className="mb-5 text-[15px] leading-relaxed text-muted">
            Yazdığın ve yüklediğin her şeyin bir kopyası. Kimseye sorulmaz, kimseye bildirilmez.
            {owner ? " Sitenin tam yedeği için BACKUP_GUIDE'daki komutu kullan." : ""}
          </p>
          <ExportButtons />
        </Section>

        <Section title={owner ? "Her şeyi sil" : "Hesabımı sil"}>
          <p className="mb-5 text-[15px] leading-relaxed text-muted">
            {owner
              ? `Hesabın bu dünyanın kendisidir: silersen bütün içerik, fotoğraflar ve ${other.name}'in erişimi de kalıcı olarak silinir. Geri alınamaz. Önce yedek al.`
              : `Hesabın ve senin eklediğin her şey (yazıların, fotoğrafların, cevapların) kalıcı olarak silinir. ${other.name}'nın senin için yazdıkları ona aittir ve kalır; ama artık buraya giremezsin. Geri alınamaz.`}
          </p>
          <DeleteAccountForm phrase={owner ? "HER ŞEYİ SİL" : "HESABIMI SİL"} />
        </Section>
      </div>
    </>
  );
}
