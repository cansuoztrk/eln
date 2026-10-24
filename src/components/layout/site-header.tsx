import Link from "next/link";
import { getCurrentUser } from "@/server/auth/session";
import { isStaff } from "@/server/auth/guards";
import { db } from "@/server/db";
import { getNavCategories, getPopularSearches } from "@/server/catalog/nav";
import { Logo } from "../brand/logo";
import { Icon } from "../icons";
import { DesktopNav } from "./nav-links";
import { SearchBox } from "./search-box";
import { ThemeToggle } from "./theme-toggle";

export async function SiteHeader() {
  const [user, categories, popular] = await Promise.all([getCurrentUser(), getNavCategories(), getPopularSearches()]);
  const unread = user ? await db.notification.count({ where: { userId: user.id, readAt: null } }) : 0;
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface/90 backdrop-blur-md supports-[backdrop-filter]:bg-surface/80">
      <a href="#icerik" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:z-50 focus:rounded focus:bg-brand focus:px-3 focus:py-2 focus:text-on-brand">
        İçeriğe geç
      </a>
      <div className="container-page flex h-16 items-center gap-4">
        <Link href="/" aria-label="Ana sayfa" className="shrink-0">
          <Logo />
        </Link>
        <div className="hidden flex-1 md:block md:max-w-xl lg:mx-6">
          <SearchBox popular={popular} />
        </div>
        <div className="ml-auto flex items-center gap-1">
          <ThemeToggle />
          {user ? (
            <>
              <Link href="/hesap/bildirimler" className="relative grid size-9 place-items-center rounded-md text-ink-2 hover:bg-surface-2 hover:text-ink" aria-label={`Bildirimler${unread ? ` (${unread} okunmamış)` : ""}`}>
                <Icon name="bell" className="size-[18px]" />
                {unread ? <span className="absolute right-1 top-1 grid min-w-4 place-items-center rounded-full bg-brand px-1 font-mono text-[9.5px] font-bold leading-4 text-on-brand">{unread > 9 ? "9+" : unread}</span> : null}
              </Link>
              {isStaff(user) ? (
                <Link href="/admin" className="hidden h-9 items-center rounded-md px-2.5 text-[13px] font-medium text-ink-2 hover:bg-surface-2 hover:text-ink sm:inline-flex">
                  Yönetim
                </Link>
              ) : null}
              <Link href="/hesap" className="ml-1 inline-flex h-9 items-center gap-2 rounded-md border border-line px-2.5 text-[13px] font-medium hover:border-line-strong">
                <span className="grid size-6 place-items-center rounded-full bg-brand-soft font-display text-[12px] font-bold text-brand-ink">{(user.name ?? user.email).charAt(0).toLocaleUpperCase("tr")}</span>
                <span className="hidden sm:inline">Hesabım</span>
              </Link>
            </>
          ) : (
            <>
              <Link href="/giris" className="hidden h-9 items-center rounded-md px-3 text-[13px] font-medium text-ink-2 hover:bg-surface-2 hover:text-ink sm:inline-flex">
                Giriş yap
              </Link>
              <Link href="/kayit" className="inline-flex h-9 items-center rounded-md bg-ink px-3 text-[13px] font-semibold text-bg hover:opacity-90">
                Ücretsiz hesap
              </Link>
            </>
          )}
        </div>
      </div>
      <div className="container-page pb-3 md:hidden">
        <SearchBox popular={popular} />
      </div>
      <div className="hidden border-t border-line lg:block">
        <div className="container-page">
          <DesktopNav categories={categories} />
        </div>
      </div>
    </header>
  );
}
