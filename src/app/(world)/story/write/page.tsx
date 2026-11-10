import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { listAlbums } from "@/features/gallery/queries";
import { VersionHistory } from "@/features/history/components/version-history";
import { listVersions } from "@/features/history/queries";
import { MemoryEditor } from "@/features/story/components/memory-editor";
import { listMyVoiceOptions } from "@/features/voice/queries";
import { MemoryList } from "@/features/story/components/memory-list";
import { toDraft } from "@/features/story/draft";
import { getMemory, listEditableMemories } from "@/features/story/queries";
import { viewerTimezone } from "@/features/dates/queries";
import { requireMember } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Anı yaz" };

/** A desk for adding a memory of one's own. Entirely optional. */
export default async function WriteMemoryPage({ searchParams }: PageProps<"/story/write">) {
  const session = await requireMember();
  const { id } = await searchParams;

  const [existing, all] = await Promise.all([
    typeof id === "string" ? getMemory(session, id) : null,
    listEditableMemories(session),
  ]);
  if (typeof id === "string" && (!existing || !existing.mine)) notFound();
  const mine = all.filter((m) => m.mine);
  const [albums, voices, versions] = await Promise.all([
    listAlbums(session),
    listMyVoiceOptions(session),
    existing ? listVersions(session, "memories", existing.id) : [],
  ]);

  return (
    <>
      <PageHeader eyebrow="Write" title={existing ? "Anıyı düzenle" : "Bir anı yaz"} />
      <div className="shell space-y-16">
        <MemoryEditor key={existing?.id ?? "new"} initial={toDraft(existing)} initialPhotos={existing?.photos ?? []} backHref="/story/write" albums={albums} voices={voices} />
        <VersionHistory table="memories" versions={versions} timeZone={viewerTimezone(session)} />
        {mine.length > 0 ? (
          <section aria-labelledby="mine-heading">
            <h2 id="mine-heading" className="mb-5 font-display text-3xl text-ink">
              Yazdıkların
            </h2>
            <MemoryList memories={mine} editBase="/story/write?id=" />
          </section>
        ) : null}
      </div>
    </>
  );
}
