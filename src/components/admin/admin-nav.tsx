"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { Icon } from "../icons";

const GROUPS: { title: string; items: [string, string, string, ("ADMIN" | "EDITOR")?][] }[] = [
  { title: "Genel", items: [["/admin", "Kontrol merkezi", "radar"], ["/admin/raporlar", "Raporlar", "chart"]] },
  {
    title: "Katalog",
    items: [
      ["/admin/urunler", "Ürünler", "tag"],
      ["/admin/teklifler", "Teklifler ve şüpheli fiyatlar", "alert"],
      ["/admin/eslestirme", "Eşleştirme incelemesi", "compare"],
      ["/admin/kategoriler", "Kategoriler", "grid", "ADMIN"],
      ["/admin/kuponlar", "Kuponlar", "ticket"],
    ],
  },
  {
    title: "Otomasyon",
    items: [
      ["/admin/kaynaklar", "Veri kaynakları", "database", "ADMIN"],
      ["/admin/gorevler", "Görevler ve zamanlama", "clock", "ADMIN"],
      ["/admin/puanlama", "Fırsat puanı", "settings", "ADMIN"],
      ["/admin/rotalar", "Uçuş rotaları", "plane", "ADMIN"],
    ],
  },
  {
    title: "İçerik ve ticari",
    items: [
      ["/admin/icerik", "Editoryal içerik", "book"],
      ["/admin/sponsorlu", "Sponsorlu yerleşimler", "spark", "ADMIN"],
      ["/admin/magazalar", "Mağazalar ve satış ortaklığı", "store", "ADMIN"],
    ],
  },
  { title: "Sistem", items: [["/admin/kullanicilar", "Kullanıcılar", "user", "ADMIN"], ["/admin/denetim", "Denetim kaydı", "shield", "ADMIN"]] },
];

export function AdminNav({ role }: { role: string }) {
  const path = usePathname();
  return (
    <nav aria-label="Yönetim menüsü" className="flex gap-4 overflow-x-auto px-3 pb-3 lg:block lg:space-y-4 lg:overflow-visible">
      {GROUPS.map((g) => (
        <div key={g.title} className="shrink-0">
          <p className="eyebrow mb-1 hidden px-2 lg:block">{g.title}</p>
          <ul className="flex gap-1 lg:block lg:space-y-0.5">
            {g.items
              .filter(([, , , r]) => !r || r === role || role === "ADMIN")
              .map(([href, label, icon]) => {
                const active = href === "/admin" ? path === "/admin" : path.startsWith(href);
                return (
                  <li key={href}>
                    <Link href={href} aria-current={active ? "page" : undefined} className={cn("flex h-9 items-center gap-2.5 whitespace-nowrap rounded-md px-2.5 text-[13px]", active ? "bg-brand-soft font-semibold text-brand-ink" : "text-ink-2 hover:bg-surface-2 hover:text-ink")}>
                      <Icon name={icon} className="size-4" />
                      {label}
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
