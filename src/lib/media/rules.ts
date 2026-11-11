/**
 * What may be uploaded. Shared by the browser (to reject early, kindly) and
 * the server (to reject for real).
 */

export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const AUDIO_TYPES = [
  "audio/webm",
  "audio/ogg",
  "audio/mp4",
  "audio/mpeg",
  "audio/wav",
  "audio/x-m4a",
  "audio/aac",
] as const;

export const MAX_IMAGE_BYTES = 30 * 1024 * 1024;
export const MAX_AUDIO_BYTES = 40 * 1024 * 1024;

export type MediaKind = "image" | "audio";

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "audio/webm": "webm",
  "audio/ogg": "ogg",
  "audio/mp4": "m4a",
  "audio/x-m4a": "m4a",
  "audio/aac": "aac",
  "audio/mpeg": "mp3",
  "audio/wav": "wav",
};

/** "audio/webm;codecs=opus" → "audio/webm" */
export function baseMime(type: string): string {
  return type.split(";")[0].trim().toLowerCase();
}

export function extensionFor(mime: string): string | null {
  return EXTENSIONS[baseMime(mime)] ?? null;
}

export function isAllowed(kind: MediaKind, mime: string): boolean {
  const base = baseMime(mime);
  return kind === "image"
    ? (IMAGE_TYPES as readonly string[]).includes(base)
    : (AUDIO_TYPES as readonly string[]).includes(base);
}

export function maxBytes(kind: MediaKind): number {
  return kind === "image" ? MAX_IMAGE_BYTES : MAX_AUDIO_BYTES;
}

/** A human message for a file that cannot be accepted, or null when it can. */
export function rejectionReason(kind: MediaKind, file: { type: string; size: number }): string | null {
  if (file.size === 0) return "Bu dosya boş görünüyor.";
  if (!isAllowed(kind, file.type)) {
    return kind === "image"
      ? "Yalnızca JPEG, PNG ya da WebP fotoğraflar yüklenebilir."
      : "Bu ses biçimi desteklenmiyor.";
  }
  if (file.size > maxBytes(kind)) {
    return `Dosya çok büyük (en fazla ${Math.round(maxBytes(kind) / 1024 / 1024)} MB).`;
  }
  return null;
}

/**
 * Checks the first bytes of a file against what its type claims to be.
 * A renamed file does not get through on its extension alone.
 */
export function sniff(bytes: Uint8Array): string | null {
  const b = bytes;
  const ascii = (start: number, length: number) => String.fromCharCode(...b.subarray(start, start + length));

  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b[0] === 0x89 && ascii(1, 3) === "PNG") return "image/png";
  if (ascii(0, 4) === "RIFF" && ascii(8, 4) === "WEBP") return "image/webp";
  if (ascii(0, 4) === "RIFF" && ascii(8, 4) === "WAVE") return "audio/wav";
  if (b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3) return "audio/webm";
  if (ascii(0, 4) === "OggS") return "audio/ogg";
  if (ascii(4, 4) === "ftyp") return "audio/mp4";
  if (ascii(0, 3) === "ID3" || (b[0] === 0xff && (b[1] & 0xe0) === 0xe0)) return "audio/mpeg";
  return null;
}

/** Does the sniffed type agree with the declared one? */
export function sniffMatches(declared: string, sniffed: string | null): boolean {
  if (!sniffed) return false;
  const base = baseMime(declared);
  if (base === sniffed) return true;
  const mp4Family = ["audio/mp4", "audio/x-m4a", "audio/aac"];
  if (mp4Family.includes(base) && (sniffed === "audio/mp4" || sniffed === "audio/mpeg")) return true;
  return false;
}
