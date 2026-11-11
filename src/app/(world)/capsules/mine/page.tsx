import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { CapsuleStudio } from "@/features/capsules/components/capsule-studio";
import { listCapsules } from "@/features/capsules/queries";
import { viewerToday } from "@/features/dates/queries";
import { people, requireMember } from "@/lib/auth/session";
import { addDays, formatDate, todayIn, toISODate } from "@/lib/dates";

export const metadata: Metadata = { title: "Kapsüllerim" };

/** A place for either of them to leave something for a later day. Entirely optional. */
export default async function MyCapsulesPage() {
  const session = await requireMember();
  const { capsules } = await listCapsules(session);
  const { other } = people(session);

  const rows = capsules
    .filter((capsule) => capsule.mine)
    .map((capsule) => {
      const day = todayIn(other.timezone, new Date(capsule.unlockAt));
      return { capsule, unlockDay: toISODate(day), unlockLabel: `${formatDate(day)} günü açılır` };
    });

  return (
    <>
      <PageHeader eyebrow="My capsules" title="Kapsüllerim" lead={`Gelecekteki bir güne bıraktıkların. Seçtiğin gün ${other.city}'de gece yarısı olduğunda açılır.`} />
      <div className="shell space-y-8">
        <Link href="/capsules" className="inline-flex items-center gap-2 text-[13px] font-medium text-taupe hover:text-accent">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Kapsüllere dön
        </Link>
        <CapsuleStudio rows={rows} partnerName={other.name} tomorrow={toISODate(addDays(viewerToday(session), 1))} />
      </div>
    </>
  );
}
