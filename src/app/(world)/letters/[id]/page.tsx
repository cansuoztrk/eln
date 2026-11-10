import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { LetterReader } from "@/features/letters/components/letter-reader";
import { getLetter } from "@/features/letters/queries";
import { people, requireMember } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Mektup" };

export default async function LetterPage({ params }: PageProps<"/letters/[id]">) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();

  const session = await requireMember();
  // Sealed, draft or deleted letters simply do not exist for this viewer.
  const letter = await getLetter(session, id);
  if (!letter || letter.status !== "published") notFound();

  const { me, other } = people(session);
  const editHref = letter.mine ? (session.role === "owner" ? `/studio/letters/${letter.id}` : `/letters/write?id=${letter.id}`) : undefined;

  return <LetterReader letter={letter} recipientName={letter.mine ? other.name : me.name} editHref={editHref} />;
}
