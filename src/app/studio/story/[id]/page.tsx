import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { MemoryEditor } from "@/features/story/components/memory-editor";
import { toDraft } from "@/features/story/draft";
import { getMemory } from "@/features/story/queries";
import { requireOwner } from "@/lib/auth/session";
import { StudioPage } from "../../studio-page";

export const metadata: Metadata = { title: "Anıyı düzenle" };

export default async function EditMemoryPage({ params }: PageProps<"/studio/story/[id]">) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();

  const session = await requireOwner();
  const memory = await getMemory(session, id);
  if (!memory) notFound();

  return (
    <StudioPage
      title="Anıyı düzenle"
      description={memory.mine ? undefined : `Bu anıyı ${memory.authorName} ekledi. Yayındaki halini düzenleyebilir ya da kaldırabilirsin.`}
    >
      <MemoryEditor key={memory.id} initial={toDraft(memory)} initialPhotos={memory.photos} backHref="/studio/story" />
    </StudioPage>
  );
}
