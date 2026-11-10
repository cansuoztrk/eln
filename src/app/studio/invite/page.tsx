import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { InviteForm, RevokeInviteButton } from "@/features/studio/components/invite-panel";
import { getOverview } from "@/features/studio/queries";
import { people, requireOwner } from "@/lib/auth/session";
import { formatDate, todayIn } from "@/lib/dates";
import { StudioCard, StudioPage } from "../studio-page";

export const metadata: Metadata = { title: "Davet" };

export default async function StudioInvitePage() {
  const session = await requireOwner();
  const overview = await getOverview(session);
  const { partner, me } = people(session);
  const now = new Date();
  const day = (iso: string) => formatDate(todayIn(me.timezone, new Date(iso)));

  return (
    <StudioPage
      title="Davet"
      description={`${partner.name} buraya yalnızca senin oluşturduğun tek kullanımlık bir bağlantıyla girer. Bağlantıyı açınca kendine bir parola belirler ve hediye başlar.`}
    >
      <div className="space-y-6">
        <StudioCard title={overview.partnerJoined ? `${partner.name} katıldı` : "Yeni davet"}>
          {overview.partnerJoined ? (
            <p className="mb-6 max-w-2xl text-sm leading-relaxed text-muted">
              Parolasını unutursa ya da yeni bir cihazdan giremezse aynı e-posta için yeni bir bağlantı oluştur: o bağlantı
              hesabını silmez, yalnızca yeni bir parola belirlemesini sağlar.
            </p>
          ) : null}
          <InviteForm defaultName={partner.name} />
        </StudioCard>

        <StudioCard title="Davet geçmişi">
          {overview.invites.length === 0 ? (
            <p className="text-sm text-muted">Henüz davet oluşturulmadı.</p>
          ) : (
            <ul className="divide-y divide-line">
              {overview.invites.map((invite) => {
                const expired = new Date(invite.expires_at) <= now;
                const state = invite.accepted_at
                  ? { tone: "live" as const, text: `Kabul edildi · ${day(invite.accepted_at)}` }
                  : invite.revoked_at
                    ? { tone: "neutral" as const, text: "İptal edildi" }
                    : expired
                      ? { tone: "neutral" as const, text: "Süresi doldu" }
                      : { tone: "gold" as const, text: `Bekliyor · ${day(invite.expires_at)} tarihine kadar` };
                const waiting = !invite.accepted_at && !invite.revoked_at && !expired;
                return (
                  <li key={invite.id} className="flex flex-wrap items-center justify-between gap-3 py-3.5">
                    <div className="min-w-0">
                      <p className="truncate text-[15px] text-ink">{invite.email}</p>
                      <p className="text-[13px] text-muted">
                        {invite.display_name} · {day(invite.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge tone={state.tone}>{state.text}</Badge>
                      {waiting ? <RevokeInviteButton id={invite.id} /> : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          <p className="mt-5 text-[13px] leading-relaxed text-muted">
            Burada görünen yalnızca davetin durumu. Site, {partner.name}&apos;in sonraki ziyaretlerini kaydetmez.
          </p>
        </StudioCard>
      </div>
    </StudioPage>
  );
}
