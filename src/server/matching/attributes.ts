/**
 * Ürün başlığı ve özelliklerinden varyant niteliklerini çıkarır — saf fonksiyonlar.
 *
 * Varyant anahtarı yalnızca ürünü gerçekten farklılaştıran niteliklerden oluşur: renk, bağlantı
 * tipi, kapasite ve ekran boyutu. Aynı modelin kablolu/kablosuz sürümleri veya farklı renkleri
 * aynı ürün sayfasında AYRI varyantlar olarak gösterilir.
 */

import { normalizeText, tokenize } from "@/lib/text";

export type VariantAttributes = {
  color?: string;
  connectivity?: "kablosuz" | "kablolu" | "bluetooth";
  capacity?: string; // "512gb", "1tb", "16gb"
  size?: string; // "27inc"
};

const COLORS: [RegExp, string][] = [
  [/\b(siyah|black|kara)\b/, "siyah"],
  [/\b(beyaz|white)\b/, "beyaz"],
  [/\b(gri|grey|gray|uzay grisi|space gray|grafit|graphite)\b/, "gri"],
  [/\b(gumus|silver)\b/, "gumus"],
  [/\b(kirmizi|red)\b/, "kirmizi"],
  [/\b(mavi|blue|lacivert|navy)\b/, "mavi"],
  [/\b(yesil|green)\b/, "yesil"],
  [/\b(pembe|pink)\b/, "pembe"],
  [/\b(mor|purple|lila|lilac)\b/, "mor"],
  [/\b(sari|yellow)\b/, "sari"],
  [/\b(turuncu|orange)\b/, "turuncu"],
  [/\b(altin|gold)\b/, "altin"],
  [/\b(bej|beige|krem|cream)\b/, "bej"],
];

const COLOR_LABEL: Record<string, string> = {
  siyah: "Siyah",
  beyaz: "Beyaz",
  gri: "Gri",
  gumus: "Gümüş",
  kirmizi: "Kırmızı",
  mavi: "Mavi",
  yesil: "Yeşil",
  pembe: "Pembe",
  mor: "Mor",
  sari: "Sarı",
  turuncu: "Turuncu",
  altin: "Altın",
  bej: "Bej",
};

export function extractAttributes(title: string, specs: Record<string, string> = {}, explicit: Partial<VariantAttributes> = {}): VariantAttributes {
  const text = normalizeText(`${title} ${Object.values(specs).join(" ")}`);
  const attrs: VariantAttributes = {};

  const colorSource = explicit.color ? normalizeText(explicit.color) : normalizeText(title);
  for (const [re, value] of COLORS) {
    if (re.test(colorSource)) {
      attrs.color = value;
      break;
    }
  }

  if (explicit.connectivity) attrs.connectivity = explicit.connectivity;
  else if (/\b(kablosuz|wireless|lightspeed|2\.4 ?ghz)\b/.test(text)) attrs.connectivity = "kablosuz";
  else if (/\bbluetooth\b/.test(text) && !/\bkablolu\b/.test(text)) attrs.connectivity = "bluetooth";
  else if (/\b(kablolu|wired|usb kablolu)\b/.test(text)) attrs.connectivity = "kablolu";

  const cap = (explicit.capacity ? normalizeText(explicit.capacity) : normalizeText(title)).match(/\b(\d{2,4}|[1-9])\s?(gb|tb)\b/);
  if (cap) attrs.capacity = `${Number(cap[1])}${cap[2]}`;

  const size = normalizeText(title).match(/\b(\d{2}(?:\.\d)?)\s?(inc|inch|in|")\b/) ?? normalizeText(title).match(/\b(\d{2}(?:\.\d)?)"/);
  if (size) attrs.size = `${size[1]}inc`;

  return attrs;
}

export function variantKey(attrs: VariantAttributes): string {
  const parts: string[] = [];
  for (const k of ["connectivity", "capacity", "size", "color"] as const) {
    if (attrs[k]) parts.push(`${k}=${attrs[k]}`);
  }
  return parts.length ? parts.join("|") : "default";
}

export function variantLabel(attrs: VariantAttributes): string {
  const parts: string[] = [];
  if (attrs.connectivity) parts.push(attrs.connectivity === "kablosuz" ? "Kablosuz" : attrs.connectivity === "kablolu" ? "Kablolu" : "Bluetooth");
  if (attrs.capacity) parts.push(attrs.capacity.toUpperCase());
  if (attrs.size) parts.push(`${attrs.size.replace("inc", "")}"`);
  if (attrs.color) parts.push(COLOR_LABEL[attrs.color] ?? attrs.color);
  return parts.length ? parts.join(" · ") : "Standart";
}

/** İki varyant kümesi arasında çelişen nitelikler (ikisinde de var ama farklı). */
export function attributeConflicts(a: VariantAttributes, b: VariantAttributes): string[] {
  const out: string[] = [];
  for (const k of ["connectivity", "capacity", "size", "color"] as const) {
    if (a[k] && b[k] && a[k] !== b[k]) out.push(k);
  }
  return out;
}

const STOP = new Set([
  "ve", "ile", "icin", "the", "and", "with", "for", "yeni", "orijinal", "original", "urun", "model", "turkiye", "garantili",
  "distributor", "garanti", "resmi", "ithalatci", "adet", "set", "pro", "plus",
]);

/**
 * Model kodu benzeri belirteçler: hem harf hem rakam içeren (g502, rtx4070, sm-s921b) veya
 * en az 3 haneli sayılar. Bunlar kimlik için güçlü sinyaldir.
 */
const UNIT_AFTER = /^(dpi|mah|hz|mhz|ghz|w|watt|mm|cm|gb|tb|mb|inc|inch|ms|v|k|rpm|pa|l|lt|kg|g|gr|mp|fps|cd|lm|db|ml|adet|sayfa)$/;

export function modelTokens(title: string): string[] {
  const out = new Set<string>();
  const toks = tokenize(title);
  for (let i = 0; i < toks.length; i++) {
    const t = toks[i].replace(/[.\-+]/g, "");
    if (t.length < 2) continue;
    if (/\d/.test(t) && /[a-z]/.test(t)) {
      if (/^\d+(gb|tb|mb|hz|mhz|ghz|w|mah|mm|cm|inc|dpi|ms|v|k|pa|l|kg|g|mp|fps)$/.test(t)) continue; // ölçü birimleri model kodu değildir
      out.add(t);
    } else if (/^\d{3,}$/.test(t) && !UNIT_AFTER.test(toks[i + 1] ?? "")) {
      out.add(t);
    }
  }
  return [...out];
}

export function significantTokens(title: string): string[] {
  return tokenize(title).filter((t) => t.length > 1 && !STOP.has(t));
}
