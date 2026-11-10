import type { Metadata } from "next";
import { MemoryEditor } from "@/features/story/components/memory-editor";
import { toDraft } from "@/features/story/draft";
import { requireOwner } from "@/lib/auth/session";
import { StudioPage } from "../../studio-page";

export const metadata: Metadata = { title: "Yeni anı" };

export default async function NewMemoryPage() {
  await requireOwner();
  return (
    <StudioPage title="Yeni anı">
      <MemoryEditor initial={toDraft()} initialPhotos={[]} backHref="/studio/story" />
    </StudioPage>
  );
}
