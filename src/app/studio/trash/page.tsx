import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { TrashRowActions } from "@/features/studio/components/trash-row";
import { listTrash } from "@/features/studio/queries";
import { people, requireOwner } from "@/lib/auth/session";
import { formatDate, todayIn } from "@/lib/dates";
import { StudioPage } from "../studio-page";

export const metadata: Metadata = { title: "Çöp kutusu" };

export default async function StudioTrashPage() {
  const session = await requireOwner();
  const items = await listTrash(session);
  const { me } = people(session);

  return (
    <StudioPage
      title="Çöp kutusu"
      description="Sildiğin hiçbir şey hemen yok olmaz. Buradan geri alabilir ya da kalıcı olarak silebilirsin."
    >
      {items.length === 0 ? (
        <div className="paper">
          <EmptyState title="Çöp kutusu boş">Silinen içerikler burada bekler.</EmptyState>
        </div>
      ) : (
        <ul className="paper divide-y divide-line">
          {items.map((item) => (
            <li key={`${item.table}-${item.id}`} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
              <div className="min-w-0">
                <p className="truncate text-[15px] text-ink">{item.title}</p>
                <p className="mt-1 flex items-center gap-2 text-[13px] text-muted">
                  <Badge>{item.label}</Badge>
                  {formatDate(todayIn(me.timezone, new Date(item.deletedAt)))} tarihinde silindi
                </p>
              </div>
              <TrashRowActions table={item.table} id={item.id} />
            </li>
          ))}
        </ul>
      )}
    </StudioPage>
  );
}
