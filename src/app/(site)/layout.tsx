import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { MobileTabBar } from "@/components/layout/nav-links";
import { getCurrentUser } from "@/server/auth/session";
import { FavoriteSync } from "@/components/product/favorite-sync";
import { CookieNotice } from "@/components/layout/cookie-notice";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  return (
    <>
      <SiteHeader />
      <main id="icerik" className="min-h-[60vh]">
        {children}
      </main>
      <SiteFooter />
      <MobileTabBar loggedIn={Boolean(user)} />
      {user ? <FavoriteSync /> : null}
      <CookieNotice />
    </>
  );
}
