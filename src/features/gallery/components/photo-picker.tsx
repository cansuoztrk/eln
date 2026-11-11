"use client";

import { Check, ImagePlus } from "lucide-react";
import { useCallback, useState, type ReactNode } from "react";
import { PhotoUploader } from "@/components/media/photo-uploader";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/cn";
import { createPhotoAction, loadLibraryAction } from "../actions";
import type { Photo } from "../queries";

type Props = {
  /** Currently chosen photo ids. */
  value: string[];
  onChange: (ids: string[], photos: Photo[]) => void;
  /** Pick one photo, or several. */
  multiple?: boolean;
  trigger?: ReactNode;
  title?: string;
};

/**
 * Choose from photos that were really uploaded — or upload a new one on the
 * spot. There is no other source of images on this site.
 */
export function PhotoPicker({ value, onChange, multiple = false, trigger, title = "Fotoğraf seç" }: Props) {
  const [open, setOpen] = useState(false);
  const [library, setLibrary] = useState<Photo[] | null>(null);
  const [selected, setSelected] = useState<string[]>(value);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const result = await loadLibraryAction();
    if (result.ok) {
      setLibrary(result.data);
      setError(null);
    } else {
      setError(result.error);
    }
  }, []);

  // Opening the picker starts from the current choice and a fresh library.
  function onOpenChange(next: boolean) {
    if (next) {
      setSelected(value);
      void load();
    }
    setOpen(next);
  }

  function toggle(id: string) {
    setSelected((current) => {
      if (!multiple) return current[0] === id ? [] : [id];
      return current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
    });
  }

  function confirm() {
    const byId = new Map((library ?? []).map((photo) => [photo.id, photo]));
    onChange(
      selected,
      selected.map((id) => byId.get(id)).filter((photo): photo is Photo => Boolean(photo)),
    );
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline">
            <ImagePlus aria-hidden="true" />
            Fotoğraf seç
          </Button>
        )}
      </DialogTrigger>
      <DialogContent
        size="xl"
        title={title}
        description="Yalnızca yüklediğin gerçek fotoğraflar burada görünür. Yeni yüklenen fotoğraf yayımlanmış olarak eklenir."
      >
        <PhotoUploader
          multiple={multiple}
          label="Yeni fotoğraf yükle"
          onAsset={async (assetId) => {
            const created = await createPhotoAction({ assetId, publish: true });
            if (!created.ok) return created.error;
            setSelected((current) => (multiple ? [...current, created.data.id] : [created.data.id]));
            return null;
          }}
          onSettled={() => void load()}
        />

        <div className="mt-6 min-h-40">
          {error ? (
            <p role="alert" className="py-10 text-center text-sm text-[#a94442]">
              {error}
            </p>
          ) : library === null ? (
            <div className="grid place-items-center py-14 text-rose">
              <Spinner className="size-5" />
            </div>
          ) : library.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted">Henüz yüklenmiş bir fotoğraf yok.</p>
          ) : (
            <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
              {library.map((photo) => {
                const chosen = selected.includes(photo.id);
                return (
                  <li key={photo.id}>
                    <button
                      type="button"
                      onClick={() => toggle(photo.id)}
                      aria-pressed={chosen}
                      aria-label={photo.caption || photo.altText || "Fotoğraf"}
                      className={cn(
                        "relative block aspect-square w-full overflow-hidden rounded-lg bg-beige outline-offset-2 transition-[box-shadow,transform] duration-200",
                        chosen ? "ring-3 ring-accent ring-offset-2 ring-offset-ivory" : "hover:scale-[0.98]",
                      )}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element -- signed thumbnail */}
                      <img src={photo.image.thumb} alt="" loading="lazy" className="size-full object-cover" />
                      {photo.status === "draft" ? (
                        <span className="absolute bottom-1 left-1 rounded-full bg-ink/70 px-1.5 py-0.5 text-[9px] font-medium tracking-wide text-pearl">
                          TASLAK
                        </span>
                      ) : null}
                      {chosen ? (
                        <span className="absolute top-1.5 right-1.5 grid size-6 place-items-center rounded-full bg-accent text-pearl">
                          <Check className="size-3.5" aria-hidden="true" />
                        </span>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="sticky bottom-0 -mx-6 mt-6 flex items-center justify-between gap-3 border-t border-line bg-ivory px-6 pt-4 sm:-mx-8 sm:px-8">
          <span className="text-[13px] text-muted">{selected.length > 0 ? `${selected.length} seçili` : "Seçim yok"}</span>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Vazgeç
            </Button>
            <Button onClick={confirm}>Tamam</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
