import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { AdminNav } from "@/components/admin/admin-nav";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { requireStaff } from "@/server/auth/guards";

export const metadata: Metadata = { title: { default: "Yönetim", template: "%s · Yönetim" }, robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireStaff("EDITOR");
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[232px_1fr]">
      <aside className="border-b border-line bg-surface lg:sticky lg:top-0 lg:h-dvh lg:overflow-y-auto lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between gap-2 px-4 py-4">
          <Link href="/admin" aria-label="Yönetim ana sayfası">
            <Logo />
          </Link>
          <ThemeToggle />
        </div>
        <AdminNav role={user.role} />
        <div className="hidden px-4 py-4 text-[12px] text-ink-3 lg:block">
          {user.email}
          <br />
          Rol: {user.role === "ADMIN" ? "Yönetici" : "Editör"} ·{" "}
          <Link href="/" className="underline">
            Siteye dön
          </Link>
        </div>
      </aside>
      <main className="min-w-0 px-4 py-6 md:px-8 md:py-8">{children}</main>
    </div>
  );
}
