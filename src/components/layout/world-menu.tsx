"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Gift, LogOut, PenLine, UserRound, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Dialog } from "radix-ui";
import { useEffect, useTransition } from "react";
import { EASE_SOFT } from "@/components/motion/reveal";
import { StarField } from "@/components/motion/star-field";
import { isActive, WORLD_NAV } from "@/content/navigation";
import { logoutAction } from "@/features/auth/actions";
import { cn } from "@/lib/cn";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isOwner: boolean;
  partnerName: string;
  ownerName: string;
  hiddenRooms: string[];
};

/** The whole world on one dusk-coloured page. */
export function WorldMenu({ open, onOpenChange, isOwner, partnerName, ownerName, hiddenRooms }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const reduce = useReducedMotion();
  const [leaving, startLeaving] = useTransition();

  // Any navigation closes the menu.
  useEffect(() => {
    onOpenChange(false);
  }, [pathname, onOpenChange]);

  function signOut() {
    startLeaving(async () => {
      await logoutAction();
      router.replace("/login");
      router.refresh();
    });
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-night/60 backdrop-blur-sm data-[state=open]:animate-[fade-up_0.3s_ease_both]" />
        <Dialog.Content
          aria-describedby={undefined}
          className="dusk fixed inset-0 z-50 flex flex-col overflow-y-auto outline-none data-[state=open]:animate-[fade-up_0.5s_var(--ease-soft)_both]"
        >
          <StarField tone="dusk" density={0.7} className="fixed" />

          <div className="shell relative flex h-16 shrink-0 items-center justify-between md:h-20">
            <Dialog.Title className="font-display text-[1.7rem] leading-none text-pearl italic md:text-3xl">
              Elnare
            </Dialog.Title>
            <Dialog.Close
              aria-label="Menüyü kapat"
              className="grid size-11 place-items-center rounded-full bg-pearl/10 text-pearl transition-colors hover:bg-pearl/20"
            >
              <X className="size-5" aria-hidden="true" />
            </Dialog.Close>
          </div>

          <nav aria-label="Tüm bölümler" className="shell relative flex-1 py-6 md:py-12">
            <ul className="grid gap-x-12 gap-y-1 sm:grid-cols-2 lg:grid-cols-3">
              {WORLD_NAV.filter((item) => !hiddenRooms.includes(item.href)).map((item, index) => {
                const active = isActive(pathname, item.href);
                return (
                  <motion.li
                    key={item.href}
                    initial={{ opacity: 0, y: reduce ? 0 : 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: reduce ? 0 : 0.06 + index * 0.03, ease: EASE_SOFT }}
                  >
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className="group flex items-baseline justify-between gap-4 border-b border-pearl/10 py-4 md:py-5"
                    >
                      <span>
                        <span className="eyebrow block text-[10px]">{item.eyebrow}</span>
                        <span
                          className={cn(
                            "mt-1.5 block font-display text-3xl leading-tight transition-[color,transform] duration-500 ease-soft group-hover:translate-x-1.5 md:text-4xl",
                            active ? "text-powder italic" : "text-pearl group-hover:text-powder",
                          )}
                        >
                          {item.label}
                        </span>
                      </span>
                      <span className="hidden max-w-[11rem] text-right text-[13px] leading-snug text-pearl/50 md:block">
                        {item.description}
                      </span>
                    </Link>
                  </motion.li>
                );
              })}
            </ul>
          </nav>

          <div className="shell relative flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-pearl/10 py-6 pb-10 text-[13px] text-pearl/70">
            <Link href="/gift" className="inline-flex items-center gap-2 transition-colors hover:text-pearl">
              <Gift className="size-4" aria-hidden="true" />
              Hediyeyi yeniden aç
            </Link>
            <Link href="/account" className="inline-flex items-center gap-2 transition-colors hover:text-pearl">
              <UserRound className="size-4" aria-hidden="true" />
              Hesabım
            </Link>
            {isOwner ? (
              <Link href="/studio" className="inline-flex items-center gap-2 transition-colors hover:text-pearl">
                <PenLine className="size-4" aria-hidden="true" />
                Studio
              </Link>
            ) : null}
            <button
              type="button"
              onClick={signOut}
              disabled={leaving}
              className="inline-flex items-center gap-2 transition-colors hover:text-pearl disabled:opacity-50"
            >
              <LogOut className="size-4" aria-hidden="true" />
              Çıkış yap
            </button>
            <span className="ml-auto hidden font-hand text-lg text-champagne/80 sm:block">
              {ownerName} → {partnerName}
            </span>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
