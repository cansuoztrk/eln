"use client";

import { BookHeart, Home, Images, LayoutGrid, Mail, PenLine } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { isActive, PRIMARY_NAV } from "@/content/navigation";
import { cn } from "@/lib/cn";
import { WorldMenu } from "./world-menu";

/** Routes that sit entirely on the dusk palette and always need light chrome. */
const DUSK_ROUTES = ["/universe"];
/** Routes that open on a dusk hero: light chrome until the page is scrolled. */
const DUSK_HERO_ROUTES = ["/distance", "/song"];

type Props = { isOwner: boolean; partnerName: string; ownerName: string; hiddenRooms: string[] };

export function SiteHeader({ isOwner, partnerName, ownerName, hiddenRooms }: Props) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const dusk =
    DUSK_ROUTES.some((route) => isActive(pathname, route)) ||
    (!scrolled && DUSK_HERO_ROUTES.some((route) => pathname === route));

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-40 transition-[background-color,border-color,backdrop-filter] duration-500",
          scrolled
            ? dusk
              ? "border-b border-pearl/10 bg-night/70 backdrop-blur-md"
              : "border-b border-line bg-ivory/80 backdrop-blur-md"
            : "border-b border-transparent",
        )}
      >
        <div className="shell flex h-16 items-center justify-between gap-6 md:h-20">
          <Link
            href="/"
            aria-label="Ana sayfa"
            className={cn(
              "font-display text-[1.7rem] leading-none tracking-tight italic transition-colors md:text-3xl",
              dusk ? "text-pearl" : "text-ink hover:text-accent",
            )}
          >
            Elnare
          </Link>

          <nav aria-label="Ana bölümler" className="hidden items-center gap-9 lg:flex">
            {PRIMARY_NAV.filter((item) => !hiddenRooms.includes(item.href)).map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "group relative py-2 text-[13px] font-medium tracking-[0.14em] uppercase transition-colors",
                    dusk
                      ? active
                        ? "text-pearl"
                        : "text-pearl/60 hover:text-pearl"
                      : active
                        ? "text-accent"
                        : "text-ink-soft/80 hover:text-ink",
                  )}
                >
                  {item.label}
                  <span
                    aria-hidden="true"
                    className={cn(
                      "absolute -bottom-0.5 left-1/2 h-px -translate-x-1/2 bg-current transition-[width] duration-500 ease-soft",
                      active ? "w-full" : "w-0 group-hover:w-full",
                    )}
                  />
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            {isOwner ? (
              <Link
                href="/studio"
                className={cn(
                  "hidden h-9 items-center gap-2 rounded-full border px-4 text-[13px] font-medium transition-colors sm:inline-flex",
                  dusk
                    ? "border-pearl/25 text-pearl/85 hover:border-pearl/60 hover:text-pearl"
                    : "border-line-strong text-ink-soft hover:border-accent hover:text-accent",
                )}
              >
                <PenLine className="size-3.5" aria-hidden="true" />
                Studio
              </Link>
            ) : null}
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-haspopup="dialog"
              aria-expanded={menuOpen}
              className={cn(
                "hidden h-9 items-center gap-2 rounded-full px-4 text-[13px] font-medium transition-colors md:inline-flex",
                dusk ? "bg-pearl/10 text-pearl hover:bg-pearl/20" : "bg-ink text-pearl hover:bg-ink-soft",
              )}
            >
              <LayoutGrid className="size-3.5" aria-hidden="true" />
              Tüm dünya
            </button>
          </div>
        </div>
      </header>

      {/* Phones get a thumb-reachable bar instead of a header menu. */}
      <nav
        aria-label="Hızlı gezinme"
        className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-line bg-ivory/92 pt-1.5 backdrop-blur-md md:hidden"
      >
        <ul className="mx-auto grid max-w-md auto-cols-fr grid-flow-col">
          {[
            { href: "/", label: "Ev", icon: Home, exact: true },
            { href: "/story", label: "Hikâye", icon: BookHeart },
            { href: "/gallery", label: "Galeri", icon: Images },
            { href: "/letters", label: "Mektup", icon: Mail },
          ]
            .filter((item) => !hiddenRooms.includes(item.href))
            .map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : isActive(pathname, href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex h-13 flex-col items-center justify-center gap-1 text-[10px] font-medium tracking-wide transition-colors",
                    active ? "text-accent" : "text-taupe",
                  )}
                >
                  <Icon className="size-5" strokeWidth={active ? 2 : 1.6} aria-hidden="true" />
                  {label}
                </Link>
              </li>
            );
          })}
          <li>
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-haspopup="dialog"
              aria-expanded={menuOpen}
              className="flex h-13 w-full flex-col items-center justify-center gap-1 text-[10px] font-medium tracking-wide text-taupe"
            >
              <LayoutGrid className="size-5" strokeWidth={1.6} aria-hidden="true" />
              Tümü
            </button>
          </li>
        </ul>
      </nav>

      <WorldMenu
        open={menuOpen}
        onOpenChange={setMenuOpen}
        isOwner={isOwner}
        partnerName={partnerName}
        ownerName={ownerName}
        hiddenRooms={hiddenRooms}
      />
    </>
  );
}
