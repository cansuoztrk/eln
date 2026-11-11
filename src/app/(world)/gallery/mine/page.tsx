import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { PhotoManager } from "@/features/gallery/components/photo-manager";
import { listAlbums, listLibrary } from "@/features/gallery/queries";
import { requireMember } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Fotoğraflarım" };

/** A place for either of them to add their own photographs — if and when they want to. */
export default async function MyPhotosPage() {
  const session = await requireMember();
  const [library, albums] = await Promise.all([listLibrary(session), listAlbums(session)]);

  return (
    <>
      <PageHeader eyebrow="My photos" title="Fotoğraflarım" lead="Eklediğin fotoğraflar önce taslak olarak durur; yayımladığında galeride görünür." />
      <div className="shell space-y-8">
        <Link href="/gallery" className="inline-flex items-center gap-2 text-[13px] font-medium text-taupe hover:text-accent">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Galeriye dön
        </Link>
        <PhotoManager photos={library.filter((photo) => photo.mine)} albums={albums} canManageAlbums={false} />
      </div>
    </>
  );
}
