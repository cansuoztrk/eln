import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { listAlbums } from "@/features/gallery/queries";
import { VersionHistory } from "@/features/history/components/version-history";
import { listVersions } from "@/features/history/queries";
import { MemoryEditor } from "@/features/story/components/memory-editor";
import { listMyVoiceOptions } from "@/features/voice/queries";
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
  const [albums, voices, versions] = await Promise.all([
    listAlbums(session, { includeDrafts: true }),
    listMyVoiceOptions(session),
    listVersions(session, "memories", memory.id),
  ]);

  return (
    <StudioPage
      title="Anıyı düzenle"
      description={memory.mine ? undefined : `Bu anıyı ${memory.authorName} ekledi. Yayındaki halini düzenleyebilir ya da kaldırabilirsin.`}
    >
      <MemoryEditor key={memory.id} initial={toDraft(memory)} initialPhotos={memory.photos} backHref="/studio/story" albums={albums} voices={voices} />
      <VersionHistory table="memories" versions={versions} timeZone={session.space.owner_timezone} />
    </StudioPage>
  );
}
