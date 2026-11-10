import type { Metadata } from "next";
import Link from "next/link";
import { OwnerHint } from "@/components/layout/owner-hint";
import { PageHeader } from "@/components/layout/page-header";
import { SmartImage } from "@/components/media/smart-image";
import { Reveal } from "@/components/motion/reveal";
import { EmptyState } from "@/components/ui/empty-state";
import { GalleryView } from "@/features/gallery/components/gallery-view";
import { listAlbums, listGalleryPhotos, listPhotoMemories } from "@/features/gallery/queries";
import { people, requireMember } from "@/lib/auth/session";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "Galeri" };

type Query = { album?: string; tag?: string; fav?: string; view?: string };

function href(current: Query, change: Partial<Query>): string {
  const next = { ...current, ...change };
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(next)) if (value) params.set(key, value);
  const query = params.toString();
  return query ? `/gallery?${query}` : "/gallery";
}

function Chip({ active, children, ...props }: { active: boolean; href: string; children: React.ReactNode }) {
  return (
    <Link
      {...props}
      scroll={false}
      aria-current={active ? "true" : undefined}
      className={cn(
        "inline-flex h-9 shrink-0 items-center rounded-full px-4 text-[13px] whitespace-nowrap transition-colors",
        active ? "bg-ink text-pearl" : "border border-line-strong text-ink-soft hover:border-accent hover:text-accent",
      )}
    >
      {children}
    </Link>
  );
}

export default async function GalleryPage({ searchParams }: PageProps<"/gallery">) {
  const session = await requireMember();
  const raw = await searchParams;
  const one = (value: string | string[] | undefined) => (typeof value === "string" && value ? value : undefined);
  const query: Query = { album: one(raw.album), tag: one(raw.tag), fav: one(raw.fav) ? "1" : undefined, view: one(raw.view) === "polaroid" ? "polaroid" : undefined };
  const uuid = /^[0-9a-f-]{36}$/i;
  if (query.album && !uuid.test(query.album)) query.album = undefined;

  const [all, albums] = await Promise.all([listGalleryPhotos(session), listAlbums(session)]);
  const photos = all.filter(
    (photo) =>
      (!query.album || photo.albumId === query.album) &&
      (!query.tag || photo.tags.includes(query.tag)) &&
      (!query.fav || photo.isFavorite),
  );
  const memories = await listPhotoMemories(session, photos.map((p) => p.id));
  const tags = [...new Set(all.flatMap((photo) => photo.tags))].sort((a, b) => a.localeCompare(b, "tr"));
  const album = albums.find((a) => a.id === query.album);
  const { partner } = people(session);
  const filtered = Boolean(query.album || query.tag || query.fav);

  return (
    <>
      <PageHeader eyebrow="Eln's Gallery" title={album ? album.title : "Galeri"} lead={album?.description || undefined} />

      <div className="shell space-y-14">
        {all.length === 0 ? (
          <>
            <EmptyState title="Henüz fotoğraf yok">Fotoğraflar yüklendiğinde burada görünecek.</EmptyState>
            {session.role === "owner" ? (
              <OwnerHint href="/studio/photos" label="Fotoğraf yükle">
                Galeri yalnızca senin yüklediğin gerçek fotoğrafları gösterir.
              </OwnerHint>
            ) : null}
          </>
        ) : (
          <>
            {albums.length > 0 && !query.album ? (
              <section aria-labelledby="albums-heading">
                <Reveal>
                  <p className="eyebrow">Albums</p>
                  <h2 id="albums-heading" className="mt-2 font-display text-3xl text-ink italic">
                    Albümler
                  </h2>
                </Reveal>
                <ul className="no-scrollbar -mx-5 mt-6 flex snap-x gap-5 overflow-x-auto px-5 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 lg:grid-cols-4">
                  {albums.map((item) => (
                    <li key={item.id} className="w-56 shrink-0 snap-start sm:w-auto">
                      <Link href={href(query, { album: item.id })} className="group block">
                        <div className="aspect-[4/5] overflow-hidden rounded-[3px] bg-beige shadow-paper transition-shadow duration-500 group-hover:shadow-lift">
                          {item.cover ? (
                            <SmartImage
                              image={item.cover}
                              alt=""
                              sizes="(min-width: 1024px) 22vw, (min-width: 640px) 30vw, 14rem"
                              mode="fill"
                              imgClassName="transition-transform duration-[1400ms] ease-soft group-hover:scale-[1.04]"
                            />
                          ) : null}
                        </div>
                        <p className="mt-3 font-display text-xl text-ink transition-colors group-hover:text-accent">{item.title}</p>
                        <p className="text-[12px] text-taupe">{item.photoCount} fotoğraf</p>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            <nav aria-label="Galeri filtreleri" className="no-scrollbar -mx-5 flex items-center gap-2 overflow-x-auto px-5 sm:mx-0 sm:flex-wrap sm:px-0">
              <div className="flex shrink-0 rounded-full border border-line-strong p-1" role="group" aria-label="Görünüm">
                {(["editorial", "polaroid"] as const).map((mode) => {
                  const active = (query.view ?? "editorial") === mode;
                  return (
                    <Link
                      key={mode}
                      href={href(query, { view: mode === "polaroid" ? "polaroid" : undefined })}
                      scroll={false}
                      aria-current={active ? "true" : undefined}
                      className={cn("h-7 rounded-full px-3.5 text-[13px] leading-7 transition-colors", active ? "bg-ink text-pearl" : "text-ink-soft")}
                    >
                      {mode === "editorial" ? "Editoryal" : "Polaroid"}
                    </Link>
                  );
                })}
              </div>
              <Chip href={href(query, { fav: query.fav ? undefined : "1" })} active={Boolean(query.fav)}>
                Favoriler
              </Chip>
              {query.album && album ? (
                <Chip href={href(query, { album: undefined })} active>
                  {album.title} ×
                </Chip>
              ) : null}
              {tags.map((tag) => (
                <Chip key={tag} href={href(query, { tag: query.tag === tag ? undefined : tag })} active={query.tag === tag}>
                  #{tag}
                </Chip>
              ))}
              {filtered ? (
                <Link href={href({ view: query.view }, {})} scroll={false} className="shrink-0 px-2 text-[13px] text-accent underline-offset-4 hover:underline">
                  Temizle
                </Link>
              ) : null}
            </nav>

            {photos.length === 0 ? (
              <EmptyState title="Bu seçime uyan fotoğraf yok">Filtreleri temizleyip tümüne bakabilirsin.</EmptyState>
            ) : (
              <GalleryView photos={photos} view={query.view === "polaroid" ? "polaroid" : "editorial"} memories={memories} fallbackAlt={partner.fullName} />
            )}
          </>
        )}

        {session.role === "partner" ? (
          <p className="text-center text-sm text-muted">
            İstersen sen de fotoğraf ekleyebilirsin.{" "}
            <Link href="/gallery/mine" className="text-accent underline-offset-4 hover:underline">
              Fotoğraflarım
            </Link>
          </p>
        ) : null}
      </div>
    </>
  );
}
