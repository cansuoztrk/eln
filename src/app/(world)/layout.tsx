import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { Toaster } from "@/components/ui/toast";
import { ThemeApplier } from "@/features/corner/components/theme-applier";
import { getPreferences } from "@/features/corner/queries";
import { getHiddenRooms } from "@/features/home/queries";
import { requireMember } from "@/lib/auth/session";

/** Everything inside the world. Only members ever reach this layout. */
export default async function WorldLayout({ children }: LayoutProps<"/">) {
  const session = await requireMember();
  const { space, role } = session;
  const [{ theme }, hiddenRooms] = await Promise.all([getPreferences(session), getHiddenRooms(session)]);

  return (
    <div data-theme={theme === "blush" ? undefined : theme}>
      <ThemeApplier theme={theme} />
      <a
        href="#icerik"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[80] focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:text-pearl"
      >
        İçeriğe geç
      </a>
      <SiteHeader isOwner={role === "owner"} partnerName={space.partner_name} ownerName={space.owner_name} hiddenRooms={hiddenRooms} />
      <main id="icerik" className="min-h-dvh">
        {children}
      </main>
      <SiteFooter
        ownerName={space.owner_name}
        partnerName={space.partner_name}
        ownerCity={space.owner_city}
        partnerCity={space.partner_city}
      />
      <Toaster />
    </div>
  );
}
