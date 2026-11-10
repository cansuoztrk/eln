import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { viewerToday } from "@/features/dates/queries";
import { Journal } from "@/features/journal/components/journal";
import { listEntries } from "@/features/journal/queries";
import { people, requireMember } from "@/lib/auth/session";
import { toISODate } from "@/lib/dates";

export const metadata: Metadata = { title: "Günlük" };

export default async function JournalPage() {
  const session = await requireMember();
  const entries = await listEntries(session);
  const { other } = people(session);

  return (
    <>
      <PageHeader eyebrow="Shared Journal" title="Günlük" align="center" lead="İkimizin defteri. Taslaklar ve “yalnızca ben” kayıtları yazanda kalır." />
      <div className="shell-narrow">
        <Journal entries={entries} today={toISODate(viewerToday(session))} otherName={other.name} />
      </div>
    </>
  );
}
