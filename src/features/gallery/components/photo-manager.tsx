"use client";

import { ArrowDown, ArrowUp, Check, Heart, Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition, type FormEvent } from "react";
import { PhotoUploader } from "@/components/media/photo-uploader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Confirm } from "@/components/ui/confirm";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { describedBy, Field, Input, Select, Textarea } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/toast";
import { trashAction } from "@/features/trash/actions";
import { cn } from "@/lib/cn";
import type { ActionResult } from "@/lib/result";
import { useAction } from "@/lib/use-action";
import {
  createPhotoAction,
  movePhotosToAlbumAction,
  reorderAlbumsAction,
  reorderPhotosAction,
  saveAlbumAction,
  setPhotosStatusAction,
  trashPhotosAction,
  updatePhotoAction,
} from "../actions";
import type { Album, Photo } from "../queries";
import { parseTags } from "../schema";
import { PhotoPicker } from "./photo-picker";

type Props = {
  photos: Photo[];
  albums: Album[];
  /** The owner also manages albums and may tidy the partner's published photos. */
  canManageAlbums: boolean;
};

/**
 * The photo desk: upload, describe, arrange, publish. Everything starts as a
 * draft, so nothing reaches the gallery until it is deliberately published.
 */
export function PhotoManager({ photos, albums, canManageAlbums }: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [editing, setEditing] = useState<Photo | null>(null);
  const [albumDialog, setAlbumDialog] = useState<Album | "new" | null>(null);
  const [status, setStatus] = useState<"all" | "draft" | "published">("all");
  const [albumFilter, setAlbumFilter] = useState("all");
  const [busy, start] = useTransition();

  const visible = useMemo(
    () =>
      photos
        .filter((p) => status === "all" || p.status === status)
        .filter((p) => albumFilter === "all" || (albumFilter === "none" ? !p.albumId : p.albumId === albumFilter))
        .sort((a, b) => a.sortOrder - b.sortOrder || b.createdAt.localeCompare(a.createdAt)),
    [photos, status, albumFilter],
  );
  const albumName = (id: string | null) => albums.find((a) => a.id === id)?.title;
  const mine = (ids: string[]) => ids.filter((id) => photos.find((p) => p.id === id)?.mine);

  function run(action: () => Promise<ActionResult<unknown>>, after?: () => void) {
    start(async () => {
      const result = await action();
      toast(result.ok ? (result.message ?? "Kaydedildi.") : result.error, result.ok ? "ok" : "error");
      if (result.ok) {
        after?.();
        router.refresh();
      }
    });
  }

  function toggle(id: string) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  function move(id: string, step: -1 | 1) {
    const order = visible.map((p) => p.id);
    const from = order.indexOf(id);
    const to = from + step;
    if (to < 0 || to >= order.length) return;
    [order[from], order[to]] = [order[to], order[from]];
    run(() => reorderPhotosAction(order));
  }

  function moveAlbum(id: string, step: -1 | 1) {
    const order = albums.map((a) => a.id);
    const from = order.indexOf(id);
    const to = from + step;
    if (to < 0 || to >= order.length) return;
    [order[from], order[to]] = [order[to], order[from]];
    run(() => reorderAlbumsAction(order));
  }

  return (
    <div className="space-y-8">
      <PhotoUploader
        onAsset={async (assetId) => {
          const created = await createPhotoAction({ assetId, albumId: albumFilter !== "all" && albumFilter !== "none" ? albumFilter : null });
          return created.ok ? null : created.error;
        }}
        onSettled={() => router.refresh()}
        hint="Sürükleyip bırak ya da seç · JPEG, PNG, WebP · taslak olarak eklenir"
      />

      {canManageAlbums ? (
        <section aria-labelledby="albums-title" className="paper p-5 sm:p-7">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 id="albums-title" className="font-display text-2xl text-ink">
              Albümler
            </h2>
            <Button variant="outline" size="sm" onClick={() => setAlbumDialog("new")}>
              <Plus aria-hidden="true" />
              Yeni albüm
            </Button>
          </div>
          {albums.length === 0 ? (
            <p className="text-sm text-muted">Henüz albüm yok. Fotoğrafları gruplamak istersen bir tane oluştur.</p>
          ) : (
            <ul className="divide-y divide-line">
              {albums.map((album, i) => (
                <li key={album.id} className="flex items-center gap-3 py-3">
                  <div className="size-12 shrink-0 overflow-hidden rounded-lg bg-beige">
                    {album.cover ? (
                      // eslint-disable-next-line @next/next/no-img-element -- signed thumbnail
                      <img src={album.cover.thumb} alt="" className="size-full object-cover" />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] text-ink">{album.title}</p>
                    <p className="text-[12px] text-muted">{album.photoCount} fotoğraf</p>
                  </div>
                  <Badge tone={album.status === "published" ? "live" : "draft"}>{album.status === "published" ? "Yayında" : "Taslak"}</Badge>
                  <Button variant="ghost" size="icon-sm" aria-label={`${album.title}: yukarı taşı`} disabled={busy || i === 0} onClick={() => moveAlbum(album.id, -1)}>
                    <ArrowUp aria-hidden="true" />
                  </Button>
                  <Button variant="ghost" size="icon-sm" aria-label={`${album.title}: aşağı taşı`} disabled={busy || i === albums.length - 1} onClick={() => moveAlbum(album.id, 1)}>
                    <ArrowDown aria-hidden="true" />
                  </Button>
                  <Button variant="ghost" size="icon-sm" aria-label={`${album.title}: düzenle`} onClick={() => setAlbumDialog(album)}>
                    <Pencil aria-hidden="true" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      <section aria-labelledby="library-title">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 id="library-title" className="font-display text-2xl text-ink">
            Fotoğraflar <span className="text-base text-muted">({visible.length})</span>
          </h2>
          <div className="flex gap-2">
            <Select aria-label="Duruma göre süz" value={status} onChange={(e) => setStatus(e.target.value as typeof status)} className="h-10 w-36 text-[13px]">
              <option value="all">Tümü</option>
              <option value="draft">Taslaklar</option>
              <option value="published">Yayında</option>
            </Select>
            {albums.length > 0 ? (
              <Select aria-label="Albüme göre süz" value={albumFilter} onChange={(e) => setAlbumFilter(e.target.value)} className="h-10 w-40 text-[13px]">
                <option value="all">Tüm albümler</option>
                <option value="none">Albümsüz</option>
                {albums.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.title}
                  </option>
                ))}
              </Select>
            ) : null}
          </div>
        </div>

        {selected.length > 0 ? (
          <div className="sticky top-20 z-20 mb-4 flex flex-wrap items-center gap-2 rounded-2xl border border-line bg-ivory/95 p-3 shadow-lift backdrop-blur" role="toolbar" aria-label="Seçilenler için işlemler">
            <span className="px-2 text-[13px] font-medium text-ink">{selected.length} seçili</span>
            <Button size="sm" variant="accent" disabled={busy} onClick={() => run(() => setPhotosStatusAction(mine(selected), true), () => setSelected([]))}>
              Yayımla
            </Button>
            <Button size="sm" variant="outline" disabled={busy} onClick={() => run(() => setPhotosStatusAction(mine(selected), false), () => setSelected([]))}>
              Taslağa al
            </Button>
            {albums.length > 0 ? (
              <Select
                aria-label="Albüme taşı"
                value=""
                disabled={busy}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value) run(() => movePhotosToAlbumAction(selected, value === "none" ? null : value), () => setSelected([]));
                }}
                className="h-9 w-40 text-[13px]"
              >
                <option value="">Albüme taşı…</option>
                <option value="none">Albümden çıkar</option>
                {albums.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.title}
                  </option>
                ))}
              </Select>
            ) : null}
            <Confirm
              trigger={
                <Button size="sm" variant="ghost" className="text-[#8c3b3b]" disabled={busy}>
                  <Trash2 aria-hidden="true" />
                  Çöpe taşı
                </Button>
              }
              title={`${selected.length} fotoğraf çöp kutusuna taşınsın mı?`}
              description="Galeriden kalkar ama silinmez; çöp kutusundan geri alabilirsin."
              confirmLabel="Çöp kutusuna taşı"
              onConfirm={() => run(() => trashPhotosAction(selected), () => setSelected([]))}
            />
            <Button size="sm" variant="ghost" className="ml-auto" onClick={() => setSelected([])}>
              Seçimi bırak
            </Button>
          </div>
        ) : null}

        {visible.length === 0 ? (
          <div className="paper">
            <EmptyState title={photos.length === 0 ? "Henüz fotoğraf yüklenmedi" : "Bu süzgece uyan fotoğraf yok"}>
              {photos.length === 0 ? "Yukarıdaki alandan ilk fotoğrafları ekleyebilirsin." : null}
            </EmptyState>
          </div>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {visible.map((photo, i) => {
              const chosen = selected.includes(photo.id);
              return (
                <li key={photo.id} className={cn("paper group relative overflow-hidden", chosen && "ring-2 ring-accent")}>
                  <button type="button" onClick={() => setEditing(photo)} aria-label={`${photo.caption || "Fotoğraf"}: düzenle`} className="block aspect-square w-full bg-beige">
                    {/* eslint-disable-next-line @next/next/no-img-element -- signed thumbnail */}
                    <img src={photo.image.thumb} alt={photo.altText} loading="lazy" className="size-full object-cover" />
                  </button>
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={chosen}
                    aria-label={`${photo.caption || "Fotoğraf"}: seç`}
                    onClick={() => toggle(photo.id)}
                    className={cn(
                      "absolute top-2 left-2 grid size-7 place-items-center rounded-full border transition-colors",
                      chosen ? "border-accent bg-accent text-pearl" : "border-pearl/80 bg-ink/35 text-transparent hover:text-pearl",
                    )}
                  >
                    <Check className="size-4" aria-hidden="true" />
                  </button>
                  {photo.isFavorite ? <Heart className="absolute top-2.5 right-2.5 size-4 fill-powder text-powder drop-shadow" aria-label="Favori" /> : null}
                  <div className="space-y-1.5 p-2.5">
                    <p className="truncate text-[13px] text-ink">{photo.caption || <span className="text-taupe">Açıklama yok</span>}</p>
                    <div className="flex items-center justify-between gap-1">
                      <span className="flex min-w-0 flex-wrap gap-1">
                        <Badge tone={photo.status === "published" ? "live" : "draft"}>{photo.status === "published" ? "Yayında" : "Taslak"}</Badge>
                        {albumName(photo.albumId) ? <Badge>{albumName(photo.albumId)}</Badge> : null}
                        {!photo.mine ? <Badge tone="blush">{photo.authorName}</Badge> : null}
                      </span>
                      <span className="flex shrink-0">
                        <button type="button" disabled={busy || i === 0} onClick={() => move(photo.id, -1)} aria-label="Öne al" className="grid size-7 place-items-center rounded-full text-taupe hover:bg-beige hover:text-ink disabled:opacity-30">
                          <ArrowUp className="size-3.5" aria-hidden="true" />
                        </button>
                        <button type="button" disabled={busy || i === visible.length - 1} onClick={() => move(photo.id, 1)} aria-label="Arkaya al" className="grid size-7 place-items-center rounded-full text-taupe hover:bg-beige hover:text-ink disabled:opacity-30">
                          <ArrowDown className="size-3.5" aria-hidden="true" />
                        </button>
                      </span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {editing ? <PhotoEditDialog key={editing.id} photo={editing} albums={albums} onClose={() => setEditing(null)} /> : null}
      {albumDialog ? (
        <AlbumDialog key={albumDialog === "new" ? "new" : albumDialog.id} album={albumDialog === "new" ? null : albumDialog} onClose={() => setAlbumDialog(null)} />
      ) : null}
    </div>
  );
}

function PhotoEditDialog({ photo, albums, onClose }: { photo: Photo; albums: Album[]; onClose: () => void }) {
  const router = useRouter();
  const [form, setForm] = useState({
    caption: photo.caption,
    altText: photo.altText,
    takenOn: photo.takenOn ?? "",
    tags: photo.tags.join(", "),
    albumId: photo.albumId ?? "",
    isFavorite: photo.isFavorite,
    showInGallery: photo.showInGallery,
    displayStyle: photo.displayStyle,
  });
  const { run, pending, fieldErrors } = useAction(updatePhotoAction, {
    onSuccess: () => {
      onClose();
      router.refresh();
    },
  });
  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => setForm((f) => ({ ...f, [key]: value }));

  const save = (publish: boolean) => (event?: FormEvent) => {
    event?.preventDefault();
    run({ id: photo.id, ...form, tags: parseTags(form.tags), albumId: form.albumId || null, publish });
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent size="lg" title="Fotoğrafı düzenle" description={photo.mine ? undefined : `${photo.authorName} tarafından eklendi.`}>
        <div className="grid gap-6 md:grid-cols-[0.9fr_1.1fr]">
          <div className="overflow-hidden rounded-xl bg-beige">
            {/* eslint-disable-next-line @next/next/no-img-element -- signed preview */}
            <img src={photo.image.medium} alt={photo.altText} className="max-h-[60vh] w-full object-contain" />
          </div>
          <form method="post" onSubmit={save(photo.status === "published")} noValidate className="space-y-4">
            <Field htmlFor="p-caption" label="Açıklama" optional error={fieldErrors.caption}>
              <Textarea {...describedBy("p-caption", fieldErrors.caption)} rows={2} className="min-h-20" value={form.caption} maxLength={1000} onChange={(e) => set("caption", e.target.value)} />
            </Field>
            <Field htmlFor="p-alt" label="Fotoğrafın tarifi" optional hint="Ekran okuyucu kullananlar için: fotoğrafta ne görünüyor?" error={fieldErrors.altText}>
              <Input {...describedBy("p-alt", fieldErrors.altText, true)} value={form.altText} maxLength={300} onChange={(e) => set("altText", e.target.value)} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field htmlFor="p-date" label="Çekildiği gün" optional error={fieldErrors.takenOn}>
                <Input {...describedBy("p-date", fieldErrors.takenOn)} type="date" value={form.takenOn} onChange={(e) => set("takenOn", e.target.value)} />
              </Field>
              <Field htmlFor="p-album" label="Albüm">
                <Select id="p-album" value={form.albumId} onChange={(e) => set("albumId", e.target.value)}>
                  <option value="">Albümsüz</option>
                  {albums.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.title}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <Field htmlFor="p-tags" label="Etiketler" optional hint="Virgülle ayır: bakü, kış, gülüş" error={fieldErrors.tags}>
              <Input {...describedBy("p-tags", fieldErrors.tags, true)} value={form.tags} onChange={(e) => set("tags", e.target.value)} />
            </Field>
            <Field htmlFor="p-style" label="Görünüm">
              <Select id="p-style" value={form.displayStyle} onChange={(e) => set("displayStyle", e.target.value as Photo["displayStyle"])}>
                <option value="editorial">Editoryal</option>
                <option value="polaroid">Polaroid çerçeve</option>
              </Select>
            </Field>
            <label className="flex items-center justify-between gap-4 text-[14px] text-ink-soft">
              Favori
              <Switch checked={form.isFavorite} onCheckedChange={(v) => set("isFavorite", v)} />
            </label>
            <label className="flex items-center justify-between gap-4 text-[14px] text-ink-soft">
              Galeride göster
              <Switch checked={form.showInGallery} onCheckedChange={(v) => set("showInGallery", v)} />
            </label>
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <Button variant="outline" onClick={save(false)} disabled={pending}>
                {photo.status === "published" ? "Taslağa al" : "Taslak kaydet"}
              </Button>
              <Button variant="accent" onClick={save(true)} disabled={pending}>
                {pending ? <Spinner /> : null}
                {photo.status === "published" ? "Güncelle" : "Yayımla"}
              </Button>
              <Confirm
                trigger={
                  <Button variant="ghost" size="icon" className="ml-auto text-taupe hover:text-[#8c3b3b]" aria-label="Çöp kutusuna taşı">
                    <Trash2 aria-hidden="true" />
                  </Button>
                }
                title="Fotoğraf çöp kutusuna taşınsın mı?"
                description="Siteden kalkar ama silinmez; çöp kutusundan geri alabilirsin."
                confirmLabel="Çöp kutusuna taşı"
                onConfirm={async () => {
                  const result = await trashAction("photos", photo.id);
                  toast(result.ok ? (result.message ?? "Taşındı.") : result.error, result.ok ? "ok" : "error");
                  if (result.ok) {
                    onClose();
                    router.refresh();
                  }
                }}
              />
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AlbumDialog({ album, onClose }: { album: Album | null; onClose: () => void }) {
  const router = useRouter();
  const [title, setTitle] = useState(album?.title ?? "");
  const [description, setDescription] = useState(album?.description ?? "");
  const [coverId, setCoverId] = useState<string | null>(album?.coverPhotoId ?? null);
  const [coverThumb, setCoverThumb] = useState<string | null>(album?.coverPhotoId ? (album.cover?.thumb ?? null) : null);
  const { run, pending, fieldErrors } = useAction(saveAlbumAction, {
    onSuccess: () => {
      onClose();
      router.refresh();
    },
  });

  const save = (publish: boolean) => (event?: FormEvent) => {
    event?.preventDefault();
    run({ id: album?.id, title, description, coverPhotoId: coverId, publish });
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent size="sm" title={album ? "Albümü düzenle" : "Yeni albüm"}>
        <form method="post" onSubmit={save(album?.status === "published")} noValidate className="space-y-4">
          <Field htmlFor="a-title" label="Ad" error={fieldErrors.title}>
            <Input {...describedBy("a-title", fieldErrors.title)} value={title} maxLength={120} required onChange={(e) => setTitle(e.target.value)} />
          </Field>
          <Field htmlFor="a-desc" label="Açıklama" optional error={fieldErrors.description}>
            <Textarea {...describedBy("a-desc", fieldErrors.description)} rows={3} className="min-h-24" value={description} maxLength={2000} onChange={(e) => setDescription(e.target.value)} />
          </Field>
          <div>
            <p className="mb-2 text-[13px] font-medium text-ink-soft">Kapak</p>
            <div className="flex items-center gap-3">
              <div className="size-16 shrink-0 overflow-hidden rounded-lg bg-beige">
                {coverThumb ? (
                  // eslint-disable-next-line @next/next/no-img-element -- signed thumbnail
                  <img src={coverThumb} alt="" className="size-full object-cover" />
                ) : null}
              </div>
              <PhotoPicker
                title="Albüm kapağını seç"
                value={coverId ? [coverId] : []}
                onChange={(ids, picked) => {
                  setCoverId(ids[0] ?? null);
                  setCoverThumb(picked[0]?.image.thumb ?? null);
                }}
              />
            </div>
            <p className="mt-2 text-[12px] text-muted">Seçmezsen albümdeki ilk fotoğraf kapak olur.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <Button variant="outline" onClick={save(false)} disabled={pending}>
              Taslak kaydet
            </Button>
            <Button variant="accent" onClick={save(true)} disabled={pending}>
              {pending ? <Spinner /> : null}
              Yayımla
            </Button>
            {album ? (
              <Confirm
                trigger={
                  <Button variant="ghost" size="icon" className="ml-auto text-taupe hover:text-[#8c3b3b]" aria-label="Albümü çöp kutusuna taşı">
                    <Trash2 aria-hidden="true" />
                  </Button>
                }
                title="Albüm çöp kutusuna taşınsın mı?"
                description="Fotoğraflar silinmez; yalnızca albüm kalkar. Çöp kutusundan geri alabilirsin."
                confirmLabel="Çöp kutusuna taşı"
                onConfirm={async () => {
                  const result = await trashAction("albums", album.id);
                  toast(result.ok ? (result.message ?? "Taşındı.") : result.error, result.ok ? "ok" : "error");
                  if (result.ok) {
                    onClose();
                    router.refresh();
                  }
                }}
              />
            ) : null}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
