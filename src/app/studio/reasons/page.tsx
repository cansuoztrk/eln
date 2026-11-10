import type { Metadata } from "next";
import { viewerToday } from "@/features/dates/queries";
import { ReasonsStudio } from "@/features/reasons/components/reasons-studio";
import { listAllNotes } from "@/features/reasons/queries";
import { people, requireOwner } from "@/lib/auth/session";
import { toISODate } from "@/lib/dates";
import { StudioPage } from "../studio-page";

export const metadata: Metadata = { title: "365 Not" };

export default async function StudioReasonsPage() {
  const session = await requireOwner();
  const notes = await listAllNotes(session);
  const { partner } = people(session);

  return (
    <StudioPage
      title="365 Not"
      description={`${partner.name}'e söylemek istediğin küçük düşünceler. Her gün biri gösterilir. Bu koleksiyon bilerek boş başlar: içindeki her cümle senin olmalı.`}
    >
      <ReasonsStudio
        notes={notes}
        mode={session.space.reasons_mode as "sequential" | "random"}
        startedOn={session.space.reasons_started_on}
        today={toISODate(viewerToday(session))}
      />
    </StudioPage>
  );
}
