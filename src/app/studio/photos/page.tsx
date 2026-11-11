import type { Metadata } from "next";
import { PhotoManager } from "@/features/gallery/components/photo-manager";
import { listAlbums, listLibrary } from "@/features/gallery/queries";
import { people, requireOwner } from "@/lib/auth/session";
import { StudioPage } from "../studio-page";

export const metadata: Metadata = { title: "Fotoğraflar" };

export default async function StudioPhotosPage() {
  const session = await requireOwner();
  const [photos, albums] = await Promise.all([listLibrary(session), listAlbums(session, { includeDrafts: true })]);
  const { partner } = people(session);

  return (
    <StudioPage
      title="Fotoğraflar"
      description={`Yalnızca gerçek fotoğraflar. Orijinal dosya dokunulmadan saklanır; ${partner.name}'in gördüğü kopyalardan konum ve cihaz bilgisi silinir.`}
    >
      <PhotoManager photos={photos} albums={albums} canManageAlbums />
    </StudioPage>
  );
}
