import type { Metadata } from "next";
import Link from "next/link";
import { deleteSavedSearch } from "@/app/actions/account";
import { EmptyState } from "@/components/ui/empty-state";
import { requireUser } from "@/server/auth/guards";
import { db } from "@/server/db";
import { formatDate } from "@/lib/time";

export const metadata: Metadata = { title: "Kayıtlı aramalar", robots: { index: false } };

export default async function SavedSearchesPage() {
  const user = await requireUser("/hesap/aramalar");
  const items = await db.savedSearch.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } });
  return (
    <section>
      <h2 className="mb-1 font-display text-[20px] font-[650]">Kayıtlı aramalar</h2>
      <p className="mb-4 text-[13px] text-ink-3">Filtrelenmiş listeleri ve uçuş aramalarını “Aramayı kaydet” ile buraya ekleyebilirsiniz.</p>
      {items.length ? (
        <ul className="card divide-y divide-line">
          {items.map((s) => (
            <li key={s.id} className="flex items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <Link href={s.query} className="font-medium hover:text-brand-ink">
                  {s.name}
                </Link>
                <p className="truncate font-mono text-[11.5px] text-ink-3">
                  {s.kind === "FLIGHT" ? "Uçuş" : "Ürün"} · {formatDate(s.createdAt)} · {s.query}
                </p>
              </div>
              <form action={deleteSavedSearch.bind(null, s.id)}>
                <button className="text-[12.5px] text-bad-ink hover:underline">Sil</button>
              </form>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState icon="search" title="Kayıtlı arama yok" />
      )}
    </section>
  );
}
