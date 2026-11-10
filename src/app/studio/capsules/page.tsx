import type { Metadata } from "next";
import { CapsuleStudio } from "@/features/capsules/components/capsule-studio";
import { listCapsules } from "@/features/capsules/queries";
import { viewerToday } from "@/features/dates/queries";
import { people, requireOwner } from "@/lib/auth/session";
import { addDays, formatDate, todayIn, toISODate } from "@/lib/dates";
import { StudioPage } from "../studio-page";

export const metadata: Metadata = { title: "Kapsüller" };

export default async function StudioCapsulesPage() {
  const session = await requireOwner();
  const { capsules } = await listCapsules(session);
  const { partner } = people(session);

  const rows = capsules
    .filter((capsule) => capsule.mine)
    .map((capsule) => {
      // The day is shown as it falls for the person who will open it.
      const day = todayIn(partner.timezone, new Date(capsule.unlockAt));
      return { capsule, unlockDay: toISODate(day), unlockLabel: `${formatDate(day)} günü açılır` };
    });

  return (
    <StudioPage
      title="Kapsüller"
      description={`Geleceğe bıraktıkların. Bir kapsül, seçtiğin gün ${partner.city}'de gece yarısı olduğunda açılır; o ana kadar içindeki hiçbir şey görünmez.`}
    >
      <CapsuleStudio rows={rows} partnerName={partner.name} tomorrow={toISODate(addDays(viewerToday(session), 1))} />
    </StudioPage>
  );
}
