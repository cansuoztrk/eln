import { ArrowUpRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Bow } from "@/components/decor";
import { Toaster } from "@/components/ui/toast";
import { requireOwner } from "@/lib/auth/session";
import { StudioSidebar, StudioTabs } from "./studio-nav";

export const metadata: Metadata = { title: { default: "Studio", template: "%s · Studio" } };

/** Arda's workshop. Partners and strangers never get past `requireOwner`. */
export default async function StudioLayout({ children }: LayoutProps<"/studio">) {
  await requireOwner();

  return (
    <div className="min-h-dvh bg-[linear-gradient(180deg,var(--color-beige)_0%,var(--color-ivory)_22rem)]">
      <header className="sticky top-0 z-30 border-b border-line bg-ivory/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[90rem] items-center justify-between gap-4 px-5 lg:px-8">
          <Link href="/studio" className="flex items-center gap-3">
            <Bow className="w-8 text-rose-deep" />
            <span className="font-display text-2xl leading-none text-ink italic">Studio</span>
          </Link>
          <Link
            href="/"
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line-strong px-4 text-[13px] font-medium text-ink-soft transition-colors hover:border-accent hover:text-accent"
          >
            Dünyayı gör
            <ArrowUpRight className="size-3.5" aria-hidden="true" />
          </Link>
        </div>
        <div className="mx-auto max-w-[90rem] px-5 pb-3 lg:hidden">
          <StudioTabs />
        </div>
      </header>

      <div className="mx-auto flex max-w-[90rem] gap-10 px-5 py-8 lg:px-8 lg:py-10">
        <aside className="sticky top-24 hidden h-max w-52 shrink-0 lg:block">
          <StudioSidebar />
        </aside>
        <main className="min-w-0 flex-1 pb-24">{children}</main>
      </div>
      <Toaster />
    </div>
  );
}
