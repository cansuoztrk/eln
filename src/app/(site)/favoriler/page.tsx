import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LocalFavorites } from "@/components/product/local-favorites";
import { PageHeader } from "@/components/ui/section";
import { getCurrentUser } from "@/server/auth/session";

export const metadata: Metadata = { title: "Favorilerim", robots: { index: false } };

export default async function LocalFavoritesPage() {
  if (await getCurrentUser()) redirect("/hesap/favoriler");
  return (
    <>
      <PageHeader eyebrow="Favoriler" title="Favorilerim" description="Hesap olmadan eklediğiniz favoriler yalnızca bu tarayıcıda saklanır. Giriş yaptığınızda hesabınıza aktarılır." />
      <div className="container-page py-8">
        <LocalFavorites />
      </div>
    </>
  );
}
