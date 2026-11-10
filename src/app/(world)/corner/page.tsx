import type { Metadata } from "next";
import { OwnerHint } from "@/components/layout/owner-hint";
import { PageHeader } from "@/components/layout/page-header";
import { getSection } from "@/features/content/queries";
import { LittleWorld } from "@/features/corner/components/little-world";
import { getPreferences } from "@/features/corner/queries";
import { viewerToday } from "@/features/dates/queries";
import { people, requireMember } from "@/lib/auth/session";
import { daysBetween } from "@/lib/dates";

export const metadata: Metadata = { title: "Minik Dünya" };

export default async function CornerPage() {
  const session = await requireMember();
  const [prefs, { messages }] = await Promise.all([getPreferences(session), getSection(session, "corner.messages")]);
  const written = messages.filter((m) => m.trim().length > 0);
  // One of Arda's lines per day, chosen by the calendar alone.
  const dayNumber = daysBetween({ year: 2025, month: 12, day: 6 }, viewerToday(session));
  const message = written.length > 0 ? written[((dayNumber % written.length) + written.length) % written.length] : null;

  return (
    <>
      <PageHeader eyebrow="Eln's Little World" title="Minik Dünya" align="center" lead="Buranın sevimli köşesi. Burada dizdiklerin yalnızca sana görünür." />
      <div className="shell">
        <LittleWorld initial={prefs} message={message} name={people(session).me.name} />
      </div>
      {session.role === "owner" && written.length === 0 ? (
        <div className="shell pt-16">
          <OwnerHint href="/studio/texts" label="Mesajları yaz">
            Bu köşede her gün senin yazdığın tatlı bir cümle görünebilir. Henüz hiç yazılmadı.
          </OwnerHint>
        </div>
      ) : null}
    </>
  );
}
