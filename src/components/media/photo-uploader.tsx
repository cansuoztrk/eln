"use client";

import { ImagePlus, TriangleAlert } from "lucide-react";
import { useCallback, useId, useRef, useState, type DragEvent } from "react";
import { cn } from "@/lib/cn";
import { IMAGE_TYPES } from "@/lib/media/rules";
import { uploadFile } from "@/lib/media/upload-client";

type Item = { id: number; name: string; progress: number; state: "uploading" | "done" | "error"; error?: string };

type Props = {
  /**
   * Called once a file is safely stored and verified. Create whatever row
   * should wrap the asset here. Return an error message to show it on the item.
   */
  onAsset: (assetId: string, file: File) => Promise<string | null>;
  /** Called after the whole batch has settled. */
  onSettled?: () => void;
  multiple?: boolean;
  className?: string;
  label?: string;
  hint?: string;
};

/**
 * Drop zone and file picker for photos. Files go straight to private storage;
 * each shows its own progress and its own error, and one failure never stops
 * the rest.
 */
export function PhotoUploader({
  onAsset,
  onSettled,
  multiple = true,
  className,
  label = "Fotoğraf ekle",
  hint = "Sürükleyip bırak ya da seç · JPEG, PNG, WebP",
}: Props) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const counter = useRef(0);
  const [items, setItems] = useState<Item[]>([]);
  const [dragging, setDragging] = useState(false);
  const busy = items.some((item) => item.state === "uploading");

  const patch = (id: number, changes: Partial<Item>) =>
    setItems((list) => list.map((item) => (item.id === id ? { ...item, ...changes } : item)));

  const handle = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return;
      const batch = files.map((file) => ({ file, id: ++counter.current }));
      setItems((list) => [
        ...list.filter((item) => item.state !== "done"),
        ...batch.map(({ file, id }) => ({ id, name: file.name, progress: 0, state: "uploading" as const })),
      ]);

      // Two at a time keeps a phone connection responsive.
      const queue = [...batch];
      const worker = async () => {
        for (let next = queue.shift(); next; next = queue.shift()) {
          const { file, id } = next;
          const result = await uploadFile("image", file, (progress) => patch(id, { progress }));
          if (!result.ok) {
            patch(id, { state: "error", error: result.error });
            continue;
          }
          const error = await onAsset(result.assetId, file);
          patch(id, error ? { state: "error", error } : { state: "done", progress: 1 });
        }
      };
      await Promise.all([worker(), worker()]);
      onSettled?.();
    },
    [onAsset, onSettled],
  );

  function onDrop(event: DragEvent) {
    event.preventDefault();
    setDragging(false);
    void handle(Array.from(event.dataTransfer.files).filter((file) => file.type.startsWith("image/")));
  }

  return (
    <div className={cn("space-y-3", className)}>
      <label
        htmlFor={inputId}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors duration-300",
          dragging ? "border-accent bg-accent-wash" : "border-line-strong bg-pearl/60 hover:border-accent hover:bg-accent-wash/50",
        )}
      >
        <ImagePlus className="size-7 text-rose" strokeWidth={1.5} aria-hidden="true" />
        <span className="text-[15px] font-medium text-ink">{label}</span>
        <span className="text-[13px] text-muted">{hint}</span>
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept={IMAGE_TYPES.join(",")}
          multiple={multiple}
          disabled={busy}
          className="sr-only"
          onChange={(event) => {
            void handle(Array.from(event.target.files ?? []));
            event.target.value = "";
          }}
        />
      </label>

      {items.length > 0 ? (
        <ul className="space-y-2" aria-live="polite">
          {items.map((item) => (
            <li key={item.id} className="rounded-xl border border-line bg-pearl px-4 py-3 text-[13px]">
              <div className="flex items-center justify-between gap-3">
                <span className="truncate text-ink">{item.name}</span>
                <span className={cn("shrink-0", item.state === "error" ? "text-[#a94442]" : "text-muted")}>
                  {item.state === "done"
                    ? "Yüklendi"
                    : item.state === "error"
                      ? "Yüklenemedi"
                      : item.progress >= 1
                        ? "Hazırlanıyor…"
                        : `%${Math.round(item.progress * 100)}`}
                </span>
              </div>
              {item.state === "error" ? (
                <p className="mt-1.5 flex items-start gap-1.5 text-[#a94442]">
                  <TriangleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                  {item.error}
                </p>
              ) : (
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-beige">
                  <div
                    className={cn(
                      "h-full rounded-full bg-accent transition-[width] duration-300",
                      item.state === "uploading" && item.progress >= 1 && "animate-pulse",
                    )}
                    style={{ width: `${Math.max(4, item.progress * 100)}%` }}
                  />
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
