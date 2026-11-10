import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { MemoryList } from "@/features/story/components/memory-list";
import { listEditableMemories } from "@/features/story/queries";
import { requireOwner } from "@/lib/auth/session";
import { StudioPage } from "../studio-page";

export const metadata: Metadata = { title: "Hikâye" };

export default async function StudioStoryPage() {
  const session = await requireOwner();
  const memories = await listEditableMemories(session);

  return (
    <StudioPage
      title="Hikâye"
      description="Anılar zaman çizelgesinde tarih sırasıyla durur. İki dönüm noktası hazır geldi; açıklamalarını ve diğer bütün anıları sen yazarsın. Hatırlamadığın bir ayrıntıyı yazmak zorunda değilsin."
      actions={
        <Button asChild variant="accent">
          <Link href="/studio/story/new">
            <Plus aria-hidden="true" />
            Yeni anı
          </Link>
        </Button>
      }
    >
      {memories.length === 0 ? (
        <div className="paper">
          <EmptyState title="Henüz anı yok">İlk anıyı eklediğinde zaman çizelgesi burada başlar.</EmptyState>
        </div>
      ) : (
        <MemoryList memories={memories} editBase="/studio/story/" />
      )}
    </StudioPage>
  );
}
