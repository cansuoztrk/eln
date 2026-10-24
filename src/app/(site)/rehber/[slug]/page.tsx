import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Markdown } from "@/components/markdown";
import { ProductCard } from "@/components/product/product-card";
import { Badge } from "@/components/ui/badge";
import { getCurrentUser } from "@/server/auth/session";
import { productCardsByIds } from "@/server/catalog/queries";
import { db } from "@/server/db";
import { formatDate } from "@/lib/time";
import { EDITORIAL_TYPE_LABEL } from "@/lib/editorial";

export async function generateMetadata(props: PageProps<"/rehber/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const c = await db.editorialContent.findUnique({ where: { slug } });
  return c && c.status === "PUBLISHED" ? { title: c.seoTitle ?? c.title, description: c.seoDescription ?? c.summary, alternates: { canonical: `/rehber/${c.slug}` } } : {};
}

export default async function GuidePage(props: PageProps<"/rehber/[slug]">) {
  const { slug } = await props.params;
  const c = await db.editorialContent.findUnique({ where: { slug }, include: { items: { orderBy: { sortOrder: "asc" } }, author: { select: { name: true } } } });
  if (!c || c.status !== "PUBLISHED") notFound();
  const user = await getCurrentUser();
  const cards = await productCardsByIds(c.items.map((i) => i.productId).filter((x): x is string => Boolean(x)));
  const notes = new Map(c.items.filter((i) => i.productId).map((i) => [i.productId!, i.note]));
  const routes = c.items.filter((i) => i.routeOrigin && i.routeDestination);
  return (
    <article className="container-page py-10">
      <header className="mx-auto max-w-3xl">
        <Badge tone="brand">{EDITORIAL_TYPE_LABEL[c.type]}</Badge>
        <h1 className="mt-3 font-display text-[32px] font-[700] leading-tight tracking-[-0.02em] md:text-[40px]">{c.title}</h1>
        <p className="mt-3 text-[16px] text-ink-2">{c.summary}</p>
        <p className="mt-3 font-mono text-[12px] text-ink-3">
          {c.author?.name ? `${c.author.name} · ` : ""}
          {c.publishedAt ? formatDate(c.publishedAt) : ""} · Editoryal içerik
        </p>
        {c.body ? (
          <div className="mt-6">
            <Markdown source={c.body} />
          </div>
        ) : null}
      </header>
      {cards.length ? (
        <section className="mt-10">
          <h2 className="mb-4 font-display text-[22px] font-[650]">Editörün seçimleri</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
            {cards.map((p) => (
              <div key={p.id} className="flex flex-col gap-2">
                <ProductCard p={p} loggedIn={Boolean(user)} />
                {notes.get(p.id) ? <p className="rounded-md bg-surface-2 px-3 py-2 text-[12.5px] text-ink-2">“{notes.get(p.id)}”</p> : null}
              </div>
            ))}
          </div>
          <p className="mt-3 text-[12px] text-ink-3">Kartlardaki fiyatlar seçim anındaki değil, son doğrulanmış güncel fiyatlardır.</p>
        </section>
      ) : null}
      {routes.length ? (
        <section className="mx-auto mt-10 max-w-3xl">
          <h2 className="mb-3 font-display text-[22px] font-[650]">Önerilen rotalar</h2>
          <ul className="space-y-2">
            {routes.map((r) => (
              <li key={r.id} className="card p-4">
                <Link href={`/ucak-bileti/rota/${r.routeOrigin}-${r.routeDestination}`} className="font-mono font-semibold hover:text-brand-ink">
                  {r.routeOrigin} → {r.routeDestination}
                </Link>
                {r.note ? <p className="mt-1 text-[13px] text-ink-2">{r.note}</p> : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </article>
  );
}
