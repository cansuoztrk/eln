import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { LetterEditor } from "@/features/letters/components/letter-editor";
import { getLetter } from "@/features/letters/queries";
import { LETTER_CATEGORIES, type LetterCategory } from "@/features/letters/schema";
import { people, requireOwner } from "@/lib/auth/session";
import { todayIn, toISODate } from "@/lib/dates";
import { StudioPage } from "../../studio-page";

export const metadata: Metadata = { title: "Mektubu düzenle" };

export default async function EditLetterPage({ params }: PageProps<"/studio/letters/[id]">) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();

  const session = await requireOwner();
  const letter = await getLetter(session, id);
  if (!letter || !letter.mine) notFound();

  const { me, other } = people(session);
  const known = LETTER_CATEGORIES.some((c) => c.value === letter.category);
  const unlockDay = letter.unlockAt ? todayIn(other.timezone, new Date(letter.unlockAt)) : null;

  return (
    <StudioPage title="Mektubu düzenle">
      <LetterEditor
        key={letter.id}
        authorName={me.name}
        recipientName={other.name}
        backHref="/studio/letters"
        initial={{
          id: letter.id,
          title: letter.title,
          body: letter.body,
          category: (known ? letter.category : "open") as LetterCategory,
          writtenOn: letter.writtenOn,
          fontStyle: letter.fontStyle,
          envelopeStyle: letter.envelopeStyle,
          seal: letter.seal,
          unlockOn: unlockDay ? toISODate(unlockDay) : "",
          status: letter.status,
        }}
      />
    </StudioPage>
  );
}
