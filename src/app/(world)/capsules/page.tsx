import type { Metadata } from "next";
import Link from "next/link";
import { OwnerHint } from "@/components/layout/owner-hint";
import { PageHeader } from "@/components/layout/page-header";
import { Stagger, StaggerItem } from "@/components/motion/reveal";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { CapsuleArt } from "@/features/capsules/components/capsule-art";
import { listCapsules } from "@/features/capsules/queries";
import { viewerToday } from "@/features/dates/queries";
import { people, requireMember } from "@/lib/auth/session";
import { daysBetween, formatDate, todayIn } from "@/lib/dates";

export const metadata: Metadata = { title: "Zaman Kapsülü" };

export default async function CapsulesPage() {
  const session = await requireMember();
  const { capsules, sealed } = await listCapsules(session);
  const { me } = people(session);
  const today = viewerToday(session);
  const dayOf = (iso: string) => todayIn(me.timezone, new Date(iso));
  const left = (iso: string) => {
    const days = daysBetween(today, dayOf(iso));
    return days <= 0 ? "bugün açılıyor" : days === 1 ? "yarın açılıyor" : `${days} gün kaldı`;
  };
  const nothing = capsules.length === 0 && sealed.length === 0;

  return (
    <>
      <PageHeader eyebrow="Time Capsule" title="Zaman Kapsülü" align="center" lead={nothing ? undefined : "Günü gelince açılacaklar. Mühürlü olanların yalnızca adı ve tarihi görünür."} />
      <div className="shell space-y-12">
        {nothing ? <EmptyState art={<div className="w-40"><CapsuleArt style="rose" sealed /></div>} title="Henüz bir kapsül yok">Geleceğe bir şey bırakıldığında burada bekleyecek.</EmptyState> : null}
        {session.role === "owner" && capsules.filter((c) => c.mine).length === 0 ? (
          <OwnerHint href="/studio/capsules" label="Kapsül hazırla">
            Gelecekteki bir güne mektup, fotoğraf ya da ses bırakabilirsin.
          </OwnerHint>
        ) : null}

        <Stagger as="ul" className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {sealed.map((capsule) => (
            <StaggerItem as="li" key={capsule.id} className="text-center">
              <CapsuleArt style={capsule.coverStyle} sealed className="saturate-[0.85]" />
              <h2 className="mt-5 font-display text-2xl text-ink">{capsule.title}</h2>
              <p className="mt-2 text-[13px] text-plum">
                {formatDate(dayOf(capsule.unlockAt))} · {left(capsule.unlockAt)}
              </p>
            </StaggerItem>
          ))}
          {capsules.map((capsule) => (
            <StaggerItem as="li" key={capsule.id} className="text-center">
              <Link href={`/capsules/${capsule.id}`} className="group block">
                <CapsuleArt style={capsule.coverStyle} sealed={!capsule.open} className="transition-transform duration-500 ease-soft group-hover:-translate-y-1.5" />
                <h2 className="mt-5 font-display text-2xl text-ink group-hover:text-accent">{capsule.title}</h2>
              </Link>
              <p className="mt-2 flex flex-wrap items-center justify-center gap-2 text-[13px] text-taupe">
                {formatDate(dayOf(capsule.unlockAt))}
                {capsule.open ? <Badge tone="live">Açıldı</Badge> : <Badge tone="sealed">{left(capsule.unlockAt)}</Badge>}
                {capsule.status === "draft" ? <Badge tone="draft">Taslak</Badge> : null}
              </p>
            </StaggerItem>
          ))}
        </Stagger>

        {session.role === "partner" ? (
          <p className="text-center text-sm text-muted">
            İstersen sen de geleceğe bir şey bırakabilirsin.{" "}
            <Link href="/capsules/mine" className="text-accent underline-offset-4 hover:underline">
              Kapsüllerim
            </Link>
          </p>
        ) : null}
      </div>
    </>
  );
}
