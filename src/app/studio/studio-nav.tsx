"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { STUDIO_NAV } from "@/content/studio-nav";
import { cn } from "@/lib/cn";

function active(pathname: string, href: string) {
  return href === "/studio" ? pathname === "/studio" : pathname === href || pathname.startsWith(`${href}/`);
}

export function StudioSidebar() {
  const pathname = usePathname();
  return (
    <nav aria-label="Studio bölümleri" className="space-y-7">
      {STUDIO_NAV.map((group) => (
        <div key={group.title}>
          <p className="eyebrow mb-2 px-3 text-[10px]">{group.title}</p>
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const current = active(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={current ? "page" : undefined}
                    className={cn(
                      "block rounded-xl px-3 py-2 text-[14px] transition-colors",
                      current ? "bg-ink text-pearl" : "text-ink-soft hover:bg-beige hover:text-ink",
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

/** On phones the same sections become a horizontal strip. */
export function StudioTabs() {
  const pathname = usePathname();
  return (
    <nav aria-label="Studio bölümleri" className="no-scrollbar -mx-5 overflow-x-auto px-5">
      <ul className="flex w-max gap-1.5 pb-1">
        {STUDIO_NAV.flatMap((group) => group.items).map((item) => {
          const current = active(pathname, item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={current ? "page" : undefined}
                className={cn(
                  "block rounded-full px-4 py-2 text-[13px] whitespace-nowrap transition-colors",
                  current ? "bg-ink text-pearl" : "bg-beige/70 text-ink-soft",
                )}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
