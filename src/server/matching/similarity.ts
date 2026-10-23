/**
 * Başlık tabanlı eşleştirme güven puanı — saf fonksiyonlar.
 *
 * Bu puan YALNIZCA aday önermek içindir. Varsayılan yapılandırmada başlık benzerliği tek başına
 * otomatik birleştirme yapmaz; aday "MatchCandidate" olarak yönetici incelemesine düşer.
 */

import { normalizeText } from "@/lib/text";
import { attributeConflicts, extractAttributes, modelTokens, significantTokens, type VariantAttributes } from "./attributes";

export type MatchSignals = {
  titleSimilarity: number;
  brandMatch: boolean | null;
  modelTokenOverlap: number | null;
  sharedModelTokens: string[];
  conflictingModelTokens: boolean;
  attributeConflicts: string[];
};

export type CandidateScore = { confidence: number; signals: MatchSignals };

function jaccard(a: string[], b: string[]): number {
  const A = new Set(a);
  const B = new Set(b);
  if (A.size === 0 && B.size === 0) return 0;
  let inter = 0;
  for (const x of A) if (B.has(x)) inter++;
  return inter / (A.size + B.size - inter);
}

export function scoreCandidate(
  listing: { title: string; brand: string | null; attributes?: VariantAttributes },
  candidate: { title: string; brand: string | null; attributes?: VariantAttributes },
): CandidateScore {
  const ta = significantTokens(listing.title);
  const tb = significantTokens(candidate.title);
  const titleSimilarity = jaccard(ta, tb);

  const ba = listing.brand ? normalizeText(listing.brand) : null;
  const bb = candidate.brand ? normalizeText(candidate.brand) : null;
  const brandMatch = ba && bb ? ba === bb : null;

  const ma = modelTokens(listing.title);
  const mb = modelTokens(candidate.title);
  const shared = ma.filter((x) => mb.includes(x));
  const modelTokenOverlap = ma.length && mb.length ? shared.length / Math.min(ma.length, mb.length) : null;
  const conflictingModelTokens = ma.length > 0 && mb.length > 0 && shared.length === 0;

  const attrsA = listing.attributes ?? extractAttributes(listing.title);
  const attrsB = candidate.attributes ?? extractAttributes(candidate.title);
  const conflicts = attributeConflicts(attrsA, attrsB);

  let confidence = 0.45 * titleSimilarity;
  if (modelTokenOverlap !== null) confidence += 0.4 * modelTokenOverlap;
  else confidence += 0.15 * titleSimilarity;
  if (brandMatch === true) confidence += 0.15;
  if (brandMatch === false) confidence -= 0.4;
  if (conflictingModelTokens) confidence -= 0.35;
  // Nitelik çelişkisi aynı model ailesinin farklı varyantı anlamına gelebilir: güveni düşürür
  // ama sıfırlamaz (ürün aynı, varyant farklı olabilir).
  confidence -= 0.05 * conflicts.length;

  return {
    confidence: Math.max(0, Math.min(1, Math.round(confidence * 1000) / 1000)),
    signals: {
      titleSimilarity: Math.round(titleSimilarity * 1000) / 1000,
      brandMatch,
      modelTokenOverlap: modelTokenOverlap === null ? null : Math.round(modelTokenOverlap * 1000) / 1000,
      sharedModelTokens: shared,
      conflictingModelTokens,
      attributeConflicts: conflicts,
    },
  };
}

const VARIANT_WORDS = new Set([
  "siyah", "beyaz", "gri", "gumus", "kirmizi", "mavi", "yesil", "pembe", "mor", "sari", "turuncu", "altin", "bej", "lacivert",
  "black", "white", "grey", "gray", "silver", "red", "blue", "green", "pink", "purple", "gold",
  "kablosuz", "kablolu", "wireless", "wired",
]);

/**
 * Ürün ailesi başlığı: varyant sözcükleri (renk, bağlantı tipi, "256GB"/"1 TB" kapasite) çıkarılmış
 * kanonik başlık. Belirteç tabanlıdır; Türkçe karakterlerde regex sözcük sınırı sorunları yaşanmaz.
 */
export function familyTitle(title: string): string {
  const tokens = title.split(/\s+/).filter(Boolean);
  const out: string[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const n = normalizeText(tokens[i]).replace(/[^a-z0-9]/g, "");
    const next = normalizeText(tokens[i + 1] ?? "");
    // "Kırmızı Switch" gibi renk adlı teknik özellikler korunur
    if (VARIANT_WORDS.has(n) && !/^(switch|switchli|anahtar|eksen)/.test(next)) continue;
    if (/^\d{1,4}(gb|tb)$/.test(n)) continue;
    if (/^\d{1,4}$/.test(n) && /^(gb|tb)$/i.test(tokens[i + 1] ?? "")) {
      i++;
      continue;
    }
    out.push(tokens[i]);
  }
  return out.join(" ").replace(/[,\-–(\s]+$/g, "").replace(/\(\s*\)/g, "").trim();
}

/** Aynı model ailesini birebir eşleştirmek için anahtar. */
export function familyKey(title: string): string {
  return normalizeText(familyTitle(title));
}
