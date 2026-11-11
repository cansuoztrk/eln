import type { Metadata } from "next";
import { LetterEditor } from "@/features/letters/components/letter-editor";
import { people, requireOwner } from "@/lib/auth/session";
import { todayIn, toISODate } from "@/lib/dates";
import { StudioPage } from "../../studio-page";

export const metadata: Metadata = { title: "Yeni mektup" };

export default async function NewLetterPage() {
  const session = await requireOwner();
  const { me, other } = people(session);

  return (
    <StudioPage title="Yeni mektup">
      <LetterEditor
        authorName={me.name}
        recipientName={other.name}
        backHref="/studio/letters"
        initial={{
          title: "",
          body: "",
          category: "say",
          writtenOn: toISODate(todayIn(me.timezone, new Date())),
          fontStyle: "serif",
          envelopeStyle: "blush",
          seal: "heart",
          unlockOn: "",
          status: "draft",
        }}
      />
    </StudioPage>
  );
}
