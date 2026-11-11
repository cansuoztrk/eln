import type { Metadata } from "next";
import { listAlbums } from "@/features/gallery/queries";
import { MemoryEditor } from "@/features/story/components/memory-editor";
import { listMyVoiceOptions } from "@/features/voice/queries";
import { toDraft } from "@/features/story/draft";
import { requireOwner } from "@/lib/auth/session";
import { StudioPage } from "../../studio-page";

export const metadata: Metadata = { title: "Yeni anı" };

export default async function NewMemoryPage() {
  const session = await requireOwner();
  const [albums, voices] = await Promise.all([listAlbums(session, { includeDrafts: true }), listMyVoiceOptions(session)]);
  return (
    <StudioPage title="Yeni anı">
      <MemoryEditor initial={toDraft()} initialPhotos={[]} backHref="/studio/story" albums={albums} voices={voices} />
    </StudioPage>
  );
}
