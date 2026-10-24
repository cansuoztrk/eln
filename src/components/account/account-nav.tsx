"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/actions/auth";
import { cn } from "@/lib/cn";
import { Icon } from "../icons";

const ITEMS = [
  ["/hesap", "Genel bakış", "home"],
  ["/hesap/favoriler", "Favoriler", "heart"],
  ["/hesap/alarmlar", "Fiyat alarmları", "bell"],
  ["/hesap/ucus-alarmlari", "Uçuş alarmları", "plane"],
  ["/hesap/bildirimler", "Bildirimler", "info"],
  ["/hesap/aramalar", "Kayıtlı aramalar", "search"],
  ["/hesap/ayarlar", "Ayarlar ve gizlilik", "settings"],
] as const;

export function AccountNav() {
  const path = usePathname();
  return (
    <nav aria-label="Hesap menüsü" className="-mx-4 overflow-x-auto px-4 lg:mx-0 lg:px-0">
      <ul className="flex gap-1 lg:flex-col">
        {ITEMS.map(([href, label, icon]) => {
          const active = href === "/hesap" ? path === "/hesap" : path.startsWith(href);
          return (
            <li key={href}>
              <Link href={href} aria-current={active ? "page" : undefined} className={cn("flex h-10 items-center gap-2.5 whitespace-nowrap rounded-md px-3 text-[13.5px]", active ? "bg-surface font-semibold shadow-card ring-1 ring-line" : "text-ink-2 hover:bg-surface-2 hover:text-ink")}>
                <Icon name={icon} className="size-[18px]" />
                {label}
              </Link>
            </li>
          );
        })}
        <li>
          <form action={logout}>
            <button className="flex h-10 w-full items-center gap-2.5 whitespace-nowrap rounded-md px-3 text-[13.5px] text-ink-2 hover:bg-surface-2 hover:text-ink">
              <Icon name="logout" className="size-[18px]" />
              Çıkış yap
            </button>
          </form>
        </li>
      </ul>
    </nav>
  );
}
