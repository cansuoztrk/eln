"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { Icon } from "../icons";

export const PRIMARY_NAV = [
  { href: "/", label: "Ana sayfa", icon: "home", match: (p: string) => p === "/" },
  { href: "/firsatlar", label: "Ürün fırsatları", icon: "tag", match: (p: string) => p.startsWith("/firsatlar") || p.startsWith("/ara") },
  { href: "/karsilastir", label: "Fiyat karşılaştırma", icon: "compare", match: (p: string) => p.startsWith("/karsilastir") },
  { href: "/kategoriler", label: "Kategoriler", icon: "grid", match: (p: string) => p.startsWith("/kategori") },
  { href: "/ucak-bileti", label: "Uçak bileti", icon: "plane", match: (p: string) => p.startsWith("/ucak-bileti") },
  { href: "/kuponlar", label: "Kuponlar", icon: "ticket", match: (p: string) => p.startsWith("/kuponlar") },
  { href: "/populer", label: "Popüler", icon: "trendDown", match: (p: string) => p.startsWith("/populer") },
  { href: "/alarmlar", label: "Fiyat alarmları", icon: "bell", match: (p: string) => p.startsWith("/alarmlar") || p.startsWith("/hesap/alarmlar") },
];

export function DesktopNav({ categories }: { categories: { slug: string; name: string; icon: string | null; children: { slug: string; name: string; icon: string | null }[] }[] }) {
  const path = usePathname();
  return (
    <nav aria-label="Ana menü" className="hidden lg:block">
      <ul className="flex items-center gap-0.5">
        {PRIMARY_NAV.filter((n) => n.href !== "/").map((n) => {
          const active = n.match(path);
          if (n.href === "/kategoriler") {
            return (
              <li key={n.href} className="group relative">
                <Link href={n.href} aria-current={active ? "page" : undefined} className={cn("relative inline-flex h-11 items-center gap-1 px-3 text-[13.5px] font-medium transition-colors", active ? "text-ink" : "text-ink-2 hover:text-ink")}>
                  {n.label}
                  <Icon name="chevronDown" className="size-3.5 opacity-60" />
                  {active ? <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-brand" /> : null}
                </Link>
                <div className="invisible absolute left-0 top-full z-50 w-[760px] translate-y-1 rounded-xl border border-line bg-surface p-5 opacity-0 shadow-pop transition-all duration-150 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                  <div className="grid grid-cols-4 gap-5">
                    {categories.map((c) => (
                      <div key={c.slug}>
                        <Link href={`/kategori/${c.slug}`} className="mb-2 flex items-center gap-2 text-[13px] font-semibold hover:text-brand-ink">
                          <Icon name={c.icon ?? "grid"} className="size-4 text-ink-3" />
                          {c.name}
                        </Link>
                        <ul className="space-y-0.5">
                          {c.children.slice(0, 9).map((ch) => (
                            <li key={ch.slug}>
                              <Link href={`/kategori/${ch.slug}`} className="block rounded px-1.5 py-1 text-[13px] text-ink-2 hover:bg-surface-2 hover:text-ink">
                                {ch.name}
                              </Link>
                            </li>
                          ))}
                          {c.children.length > 9 ? (
                            <li>
                              <Link href={`/kategori/${c.slug}`} className="block px-1.5 py-1 text-[12px] font-medium text-brand-ink">
                                +{c.children.length - 9} kategori daha
                              </Link>
                            </li>
                          ) : null}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              </li>
            );
          }
          return (
            <li key={n.href}>
              <Link href={n.href} aria-current={active ? "page" : undefined} className={cn("relative inline-flex h-11 items-center px-3 text-[13.5px] font-medium transition-colors", active ? "text-ink" : "text-ink-2 hover:text-ink")}>
                {n.label}
                {active ? <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-brand" /> : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Mobil alt gezinme: en sık kullanılan beş hedef, başparmak erişiminde. */
export function MobileTabBar({ loggedIn }: { loggedIn: boolean }) {
  const path = usePathname();
  const tabs = [
    { href: "/", label: "Ana sayfa", icon: "home", active: path === "/" },
    { href: "/firsatlar", label: "Fırsatlar", icon: "tag", active: path.startsWith("/firsatlar") || path.startsWith("/ara") },
    { href: "/kategoriler", label: "Kategoriler", icon: "grid", active: path.startsWith("/kategori") },
    { href: "/ucak-bileti", label: "Uçuş", icon: "plane", active: path.startsWith("/ucak-bileti") },
    { href: loggedIn ? "/hesap" : "/giris", label: loggedIn ? "Hesabım" : "Giriş", icon: "user", active: path.startsWith("/hesap") || path.startsWith("/giris") },
  ];
  if (path.startsWith("/admin")) return null;
  return (
    <nav aria-label="Alt menü" className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
      <ul className="grid grid-cols-5">
        {tabs.map((t) => (
          <li key={t.href}>
            <Link href={t.href} aria-current={t.active ? "page" : undefined} className={cn("flex h-14 flex-col items-center justify-center gap-0.5 text-[10.5px] font-medium", t.active ? "text-brand-ink" : "text-ink-3")}>
              <Icon name={t.icon} className="size-[21px]" strokeWidth={t.active ? 2 : 1.7} />
              {t.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
