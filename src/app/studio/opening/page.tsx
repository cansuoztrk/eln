import type { Metadata } from "next";
import { getSectionDraft } from "@/features/content/queries";
import { getPhoto } from "@/features/gallery/queries";
import { OpeningEditor } from "@/features/studio/components/opening-editor";
import { requireOwner } from "@/lib/auth/session";
import { StudioPage } from "../studio-page";

export const metadata: Metadata = { title: "Açılış" };

export default async function StudioOpeningPage() {
  const session = await requireOwner();
  const { data, hasDraft } = await getSectionDraft(session, "gift.opening");
  const photo = await getPhoto(session, data.photoId);

  return (
    <StudioPage
      title="Açılış"
      description="The Gift — ilk karşılaşma. Sahneler sabit, kelimeler ve fotoğraf senin."
    >
      <OpeningEditor key={JSON.stringify(data)} initial={data} hasDraft={hasDraft} photoThumb={photo?.image.thumb ?? null} />
    </StudioPage>
  );
}
