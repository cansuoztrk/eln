import type { L10n } from './exams';

/**
 * Tulips and gardens. Every finished focus session of 10+ minutes plants a
 * tulip; longer sessions grow rarer varieties. Names are inspired by
 * Istanbul's tulip heritage (the Ottoman "Lale Devri", the Emirgan festival)
 * without claiming to be historical cultivars.
 */
export type Shape = 'cup' | 'lily' | 'almond' | 'fringed' | 'peony' | 'parrot';
export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic';

export interface Variety {
  id: string;
  name: L10n;
  rarity: Rarity;
  shape: Shape;
  /** Main petal colour, accent (edge/flame) colour. */
  color: string;
  accent: string;
  /** Flamed petals (accent stripes) instead of an accent edge. */
  flamed?: boolean;
  premium?: boolean;
}

const v = (id: string, tr: string, en: string, de: string, es: string, rarity: Rarity, shape: Shape, color: string, accent: string, extra: Partial<Variety> = {}): Variety => ({
  id,
  name: { tr, en, de, es },
  rarity,
  shape,
  color,
  accent,
  ...extra,
});

export const VARIETIES: Variety[] = [
  v('kirmizi', 'Kırmızı Lale', 'Red Tulip', 'Rote Tulpe', 'Tulipán rojo', 'common', 'cup', '#d7263d', '#a3162a'),
  v('sari', 'Sarı Lale', 'Yellow Tulip', 'Gelbe Tulpe', 'Tulipán amarillo', 'common', 'cup', '#f6c330', '#e09f12'),
  v('pembe', 'Pembe Lale', 'Pink Tulip', 'Rosa Tulpe', 'Tulipán rosa', 'common', 'cup', '#f497b6', '#e0628f'),
  v('beyaz', 'Beyaz Lale', 'White Tulip', 'Weiße Tulpe', 'Tulipán blanco', 'common', 'cup', '#f8f4ec', '#dcd2c2'),
  v('turuncu', 'Turuncu Lale', 'Orange Tulip', 'Orange Tulpe', 'Tulipán naranja', 'common', 'cup', '#f28c28', '#d4651a'),
  v('mor', 'Mor Lale', 'Purple Tulip', 'Lila Tulpe', 'Tulipán morado', 'common', 'cup', '#8a4bb0', '#62307f'),
  v('seftali', 'Şeftali', 'Peach', 'Pfirsich', 'Melocotón', 'common', 'cup', '#ffb4a2', '#f28482', { premium: true }),

  v('gulhane', 'Gülhane Pembesi', 'Gülhane Pink', 'Gülhane-Rosa', 'Rosa de Gülhane', 'uncommon', 'lily', '#ff6f9c', '#ffd1e0'),
  v('emirgan', 'Emirgan Alı', 'Emirgan Scarlet', 'Emirgan-Scharlach', 'Escarlata de Emirgan', 'uncommon', 'cup', '#c1121f', '#ffd166'),
  v('bogaz', 'Boğaz Mavisi', 'Bosphorus Blue', 'Bosporus-Blau', 'Azul del Bósforo', 'uncommon', 'cup', '#5f6fd8', '#c7cdfb'),
  v('safran', 'Safran', 'Saffron', 'Safran', 'Azafrán', 'uncommon', 'lily', '#ffb703', '#fb8500'),
  v('leylak', 'Leylak', 'Lilac', 'Flieder', 'Lila', 'uncommon', 'fringed', '#c9a2d8', '#9c6cb5'),
  v('mercan', 'Mercan', 'Coral', 'Koralle', 'Coral', 'uncommon', 'peony', '#ff7f6e', '#ffb3a7'),
  v('kehribar', 'Kehribar', 'Amber', 'Bernstein', 'Ámbar', 'uncommon', 'peony', '#ffbf00', '#ffe28a', { premium: true }),
  v('gulkurusu', 'Gül Kurusu', 'Dusty Rose', 'Altrosa', 'Rosa palo', 'uncommon', 'lily', '#c08081', '#ead1d2', { premium: true }),
  v('lavanta', 'Lavanta', 'Lavender', 'Lavendel', 'Lavanda', 'uncommon', 'fringed', '#b8a1e8', '#8a6fd1', { premium: true }),

  v('istanbul', 'İstanbul Lalesi', 'Istanbul Tulip', 'Istanbul-Tulpe', 'Tulipán de Estambul', 'rare', 'almond', '#b5172b', '#f2c14e'),
  v('geceyarisi', 'Gece Yarısı', 'Midnight', 'Mitternacht', 'Medianoche', 'rare', 'cup', '#2f2145', '#5b3f86'),
  v('alev', 'Alev', 'Flame', 'Flamme', 'Llama', 'rare', 'cup', '#fff0a6', '#e63946', { flamed: true }),
  v('papagan', 'Papağan', 'Parrot', 'Papagei', 'Loro', 'rare', 'parrot', '#e76f51', '#2a9d8f'),
  v('kartanesi', 'Kar Tanesi', 'Snowflake', 'Schneeflocke', 'Copo de nieve', 'rare', 'fringed', '#ffffff', '#a8dadc'),
  v('yakut', 'Yakut', 'Ruby', 'Rubin', 'Rubí', 'rare', 'peony', '#9b111e', '#d64550'),
  v('cini', 'Çini Mavisi', 'İznik Blue', 'İznik-Blau', 'Azul de İznik', 'rare', 'cup', '#f4f7fb', '#1f4e99', { flamed: true, premium: true }),
  v('bahar', 'Bahar Şenliği', 'Spring Festival', 'Frühlingsfest', 'Fiesta de primavera', 'rare', 'fringed', '#ff99c8', '#fcf6bd', { premium: true }),
  v('altinvarak', 'Altın Varak', 'Gold Leaf', 'Blattgold', 'Pan de oro', 'rare', 'almond', '#f5d78e', '#b5172b', { flamed: true, premium: true }),

  v('laledevri', 'Lale Devri', 'Tulip Era', 'Tulpenzeit', 'Era del Tulipán', 'epic', 'almond', '#fdf0e3', '#c1121f', { flamed: true }),
  v('sultan', 'Sultan', 'Sultan', 'Sultan', 'Sultán', 'epic', 'almond', '#d4a017', '#7f0000'),
  v('zumrut', 'Zümrüt', 'Emerald', 'Smaragd', 'Esmeralda', 'epic', 'lily', '#e9f5db', '#40916c', { flamed: true }),
  v('tekir', 'Tekir Lalesi', 'Tabby Tulip', 'Tigerkatzen-Tulpe', 'Tulipán atigrado', 'epic', 'parrot', '#f4a259', '#6b5b4f', { flamed: true }),
  v('lacivert', 'Saray Laciverti', 'Palace Navy', 'Palastblau', 'Azul palacio', 'epic', 'almond', '#14213d', '#e9c46a', { premium: true }),
  v('gokkusagi', 'Gökkuşağı', 'Rainbow', 'Regenbogen', 'Arcoíris', 'epic', 'parrot', '#ffd166', '#7b2cbf', { flamed: true, premium: true }),
  v('mehtap', 'Mehtap', 'Moonlight', 'Mondschein', 'Luz de luna', 'epic', 'lily', '#dfe7fd', '#8ea6e8', { premium: true }),
];

export const VARIETY_BY_ID: ReadonlyMap<string, Variety> = new Map(VARIETIES.map((x) => [x.id, x]));

export const RARITY_ORDER: Rarity[] = ['common', 'uncommon', 'rare', 'epic'];

/** Tulip tier for a focus length; null below the 10-minute minimum. */
export function rarityFor(minutes: number): Rarity | null {
  if (minutes < 10) return null;
  if (minutes < 25) return 'common';
  if (minutes < 50) return 'uncommon';
  if (minutes < 90) return 'rare';
  return 'epic';
}

/** Deterministic 32-bit hash for seeded choices. */
export function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Picks the tulip for a finished session. Unseen varieties of the tier are
 * favoured (collection pull); premium varieties need Lale Bahçıvan.
 */
export function pickVariety(minutes: number, seed: string, premium: boolean, collected: Record<string, number>): Variety | null {
  const tier = rarityFor(minutes);
  if (!tier) return null;
  const pool = VARIETIES.filter((x) => x.rarity === tier && (premium || !x.premium));
  const unseen = pool.filter((x) => !collected[x.id]);
  const h = hash(seed);
  const list = unseen.length && h % 100 < 60 ? unseen : pool;
  return list[(h >>> 8) % list.length];
}

export interface District {
  id: string;
  name: L10n;
  /** Focus hours needed to unlock (free districts). */
  hours: number;
  premium?: boolean;
  /** Scene palette: sky top, sky bottom, ground. */
  sky: [string, string];
  ground: string;
  night?: boolean;
}

export const DISTRICTS: District[] = [
  { id: 'gulhane', name: { tr: 'Gülhane Parkı', en: 'Gülhane Park', de: 'Gülhane-Park', es: 'Parque de Gülhane' }, hours: 0, sky: ['#bfe3ff', '#fff3e0'], ground: '#7cb66b' },
  { id: 'emirgan', name: { tr: 'Emirgan Korusu', en: 'Emirgan Grove', de: 'Emirgan-Hain', es: 'Bosque de Emirgan' }, hours: 5, sky: ['#ffd6a5', '#fff7e8'], ground: '#6aa75c' },
  { id: 'yildiz', name: { tr: 'Yıldız Parkı', en: 'Yıldız Park', de: 'Yıldız-Park', es: 'Parque de Yıldız' }, hours: 15, sky: ['#a8dadc', '#f1faee'], ground: '#5f9e57' },
  { id: 'fethipasa', name: { tr: 'Fethi Paşa Korusu', en: 'Fethi Paşa Grove', de: 'Fethi-Paşa-Hain', es: 'Bosque de Fethi Paşa' }, hours: 30, sky: ['#ffcad4', '#fff0f3'], ground: '#679e5e' },
  { id: 'topkapi', name: { tr: 'Topkapı Lale Bahçesi', en: 'Topkapı Tulip Garden', de: 'Tulpengarten Topkapı', es: 'Jardín de tulipanes de Topkapı' }, hours: 0, premium: true, sky: ['#f6e7c1', '#fffaf0'], ground: '#6f9f4f' },
  { id: 'bogaz', name: { tr: 'Boğaz Gecesi', en: 'Bosphorus Night', de: 'Bosporus bei Nacht', es: 'Noche en el Bósforo' }, hours: 0, premium: true, sky: ['#1b2a49', '#465a8c'], ground: '#2f5e46', night: true },
  { id: 'laledevri', name: { tr: 'Lale Devri Köşkü', en: 'Tulip Era Pavilion', de: 'Pavillon der Tulpenzeit', es: 'Pabellón de la Era del Tulipán' }, hours: 0, premium: true, sky: ['#ffe5ec', '#fdf6e3'], ground: '#719b58' },
];

export function districtUnlocked(d: District, focusHours: number, premium: boolean): boolean {
  return d.premium ? premium : focusHours >= d.hours;
}
