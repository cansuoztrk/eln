"use client";

import { beginUploadAction, finalizeUploadAction } from "./actions";
import { rejectionReason, type MediaKind } from "./rules";

export type UploadOutcome =
  | { ok: true; assetId: string; width: number | null; height: number | null }
  | { ok: false; error: string };

/**
 * Uploads one file: asks the server for a one-time URL, sends the bytes
 * straight to private storage (with progress), then asks the server to verify
 * and prepare it. The browser never holds a storage key.
 */
export async function uploadFile(
  kind: MediaKind,
  file: Blob & { name?: string },
  onProgress?: (fraction: number) => void,
): Promise<UploadOutcome> {
  const reason = rejectionReason(kind, file);
  if (reason) return { ok: false, error: reason };

  const begun = await beginUploadAction({
    kind,
    filename: file.name ?? `kayit-${Date.now()}`,
    mimeType: file.type,
    size: file.size,
  });
  if (!begun.ok) return { ok: false, error: begun.error };

  const sent = await put(begun.data.uploadUrl, file, onProgress);
  if (!sent) return { ok: false, error: "Yükleme yarıda kaldı. Bağlantını kontrol edip tekrar dene." };

  const done = await finalizeUploadAction(begun.data.assetId);
  if (!done.ok) return { ok: false, error: done.error };
  return { ok: true, ...done.data };
}

function put(url: string, file: Blob, onProgress?: (fraction: number) => void): Promise<boolean> {
  return new Promise((resolve) => {
    const request = new XMLHttpRequest();
    request.open("PUT", url);
    request.setRequestHeader("content-type", file.type.split(";")[0]);
    request.setRequestHeader("x-upsert", "false");
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress?.(event.loaded / event.total);
    };
    request.onload = () => resolve(request.status >= 200 && request.status < 300);
    request.onerror = () => resolve(false);
    request.onabort = () => resolve(false);
    request.send(file);
  });
}
