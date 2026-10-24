/**
 * Doğal dil sorgusunu filtrelere çevirir — kural tabanlı, dil modeli GEREKTİRMEZ.
 *
 *   "bütçem 1500 TL, kablosuz oyuncu faresi arıyorum"
 *     → { kategori: "oyuncu-fareleri", max: 150000, attrs: { connectivity: "kablosuz" } }
 *
 * İleride bir dil modeli eklenirse yalnızca bu dosyanın çıktısını zenginleştirmesi yeterlidir;
 * temel arama model bağlantısı olmadan çalışmaya devam eder.
 */
import { normalizeText } from "@/lib/text";

export type CategoryKeywordRow = { id: string; slug: string; keywords: string[]; name: string; parentId: string | null };

export type NlResult = {
  kategori?: string;
  min?: number;
  max?: number;
  attrs: Record<string, string>;
  q?: string;
  understood: string[]; // kullanıcıya gösterilen "şunu anladık" açıklamaları
};

const FILLER = new Set([
  "butcem", "butce", "butceli", "ariyorum", "istiyorum", "lazim", "icin", "bir", "en", "iyi", "uygun", "ucuz", "fiyatli", "tl", "lira",
  "alti", "altinda", "kadar", "maksimum", "maks", "max", "en fazla", "fazla", "ustu", "uzeri", "arasi", "ile", "ve", "veya", "bana", "oneri",
  "onerir", "misin", "olsun", "olan", "model", "urun", "civari", "civarinda", "toplam", "min", "minimum",
]);

function toMinor(n: string): number | null {
  const cleaned = n.replace(/\./g, "").replace(",", ".");
  const v = Number(cleaned);
  if (!Number.isFinite(v) || v <= 0) return null;
  const withK = /k$/i.test(n) ? v * 1000 : v;
  return Math.round(withK * 100);
}

export function parseNaturalQuery(input: string, categories: CategoryKeywordRow[]): NlResult {
  const text = normalizeText(input);
  const out: NlResult = { attrs: {}, understood: [] };
  let rest = ` ${text} `;
  const num = "(\\d{1,3}(?:[.]\\d{3})+|\\d+(?:[,.]\\d+)?k?)";

  // Aralık: "1000-2000 tl", "1000 ile 2000 arasi"
  const range = rest.match(new RegExp(`${num}\\s*(?:tl|lira)?\\s*(?:-|ile)\\s*${num}\\s*(?:tl|lira)?\\s*(?:arasi)?`));
  if (range) {
    const a = toMinor(range[1]);
    const b = toMinor(range[2]);
    if (a !== null && b !== null && a < b) {
      out.min = a;
      out.max = b;
      rest = rest.replace(range[0], " ");
    }
  }
  if (out.max === undefined) {
    const maxRe = new RegExp(`(?:butcem|butce|en fazla|maksimum|max|maks)\\s*:?\\s*${num}\\s*(?:tl|lira)?|${num}\\s*(?:tl|lira)?\\s*(?:alti|altinda|kadar|civari|civarinda)`);
    const m = rest.match(maxRe);
    if (m) {
      const v = toMinor(m[1] ?? m[2]);
      if (v !== null) {
        out.max = v;
        rest = rest.replace(m[0], " ");
      }
    }
  }
  if (out.min === undefined) {
    const m = rest.match(new RegExp(`${num}\\s*(?:tl|lira)?\\s*(?:ustu|uzeri|ve uzeri)`));
    if (m) {
      const v = toMinor(m[1]);
      if (v !== null) {
        out.min = v;
        rest = rest.replace(m[0], " ");
      }
    }
  }
  if (out.max === undefined) {
    // Yalnızca "1500 tl" → bütçe kabul edilir
    const m = rest.match(new RegExp(`${num}\\s*(?:tl|lira|try)\\b`));
    if (m) {
      const v = toMinor(m[1]);
      if (v !== null) {
        out.max = v;
        rest = rest.replace(m[0], " ");
      }
    }
  }

  // Nitelikler
  if (/\b(kablosuz|wireless)\b/.test(rest)) {
    out.attrs.connectivity = "kablosuz";
    rest = rest.replace(/\b(kablosuz|wireless)\b/g, " ");
  } else if (/\bbluetooth\b/.test(rest)) {
    out.attrs.connectivity = "bluetooth";
    rest = rest.replace(/\bbluetooth\b/g, " ");
  } else if (/\b(kablolu|wired)\b/.test(rest)) {
    out.attrs.connectivity = "kablolu";
    rest = rest.replace(/\b(kablolu|wired)\b/g, " ");
  }
  const cap = rest.match(/\b(\d{2,4}|[1-9])\s?(gb|tb)\b/);
  if (cap) {
    out.attrs.capacity = `${Number(cap[1])}${cap[2]}`;
    rest = rest.replace(cap[0], " ");
  }

  // Kategori: en çok anahtar kelime eşleşen yaprak kategori
  const leaves = categories.filter((c) => !categories.some((x) => x.parentId === c.id));
  let best: { c: CategoryKeywordRow; score: number; matched: string[] } | null = null;
  for (const c of leaves) {
    const matched = c.keywords.filter((k) => k && rest.includes(` ${k}`));
    const nameHit = rest.includes(` ${normalizeText(c.name)}`) ? 3 : 0;
    const score = matched.reduce((s, k) => s + (k.includes(" ") ? 2 : 1), 0) + nameHit;
    if (score > 0 && (!best || score > best.score)) best = { c, score, matched: nameHit ? [normalizeText(c.name), ...matched] : matched };
  }
  // "oyuncu" bağlamı: oyuncu faresi/klavyesi/kulaklığı ayrımı
  if (best) {
    out.kategori = best.c.slug;
    for (const k of best.matched.sort((a, b) => b.length - a.length)) rest = rest.replace(` ${k}`, " ");
    out.understood.push(`Kategori: ${best.c.name}`);
  }
  if (out.max !== undefined) out.understood.push(`En fazla ${(out.max / 100).toLocaleString("tr-TR")} TL`);
  if (out.min !== undefined) out.understood.push(`En az ${(out.min / 100).toLocaleString("tr-TR")} TL`);
  if (out.attrs.connectivity) out.understood.push(`Bağlantı: ${out.attrs.connectivity}`);
  if (out.attrs.capacity) out.understood.push(`Kapasite: ${out.attrs.capacity.toUpperCase()}`);

  const leftover = rest
    .split(/\s+/)
    .filter((t) => t.length > 1 && !FILLER.has(t) && !/^(oyuncu|gaming|faresi|klavyesi|kulakligi)$/.test(t) && !/^\d+$/.test(t))
    .join(" ")
    .trim();
  if (leftover) out.q = leftover;
  return out;
}

/** Sorgu doğal dil gibi mi görünüyor? (bütçe veya istek ifadeleri) */
export function looksNatural(input: string): boolean {
  const t = normalizeText(input);
  return /\b(butcem|butce|ariyorum|istiyorum|altinda|en fazla|arasi|lazim)\b/.test(t) || /\d+\s*(tl|lira)\b/.test(t);
}
