import type { Lang } from '../content/types';

/**
 * The journey: 30 Istanbul neighbourhoods, 10 levels each. Finishing a
 * neighbourhood adds a rare book to Tekir's antique shelf (the collection).
 */
export const LEVELS_PER_CHAPTER = 10;

export interface Chapter {
  name: string;
  color: string;
  book: Record<Lang, string>;
}

const C = (name: string, color: string, tr: string, en: string, de: string, es: string): Chapter => ({ name, color, book: { tr, en, de, es } });

export const CHAPTERS: readonly Chapter[] = [
  C('Kadıköy', '#8a2f2a', 'Vapurdaki Kedi', 'The Cat on the Ferry', 'Die Katze auf der Fähre', 'El gato del ferry'),
  C('Moda', '#2b4a7a', 'Moda’da Gün Batımı', 'Sunset at Moda', 'Sonnenuntergang in Moda', 'Atardecer en Moda'),
  C('Yeldeğirmeni', '#2f6150', 'Rüzgâr Değirmeni Masalları', 'Windmill Tales', 'Windmühlenmärchen', 'Cuentos del molino'),
  C('Beyoğlu', '#62407a', 'İstiklal’de Bir Gece', 'A Night on İstiklal', 'Eine Nacht auf der İstiklal', 'Una noche en İstiklal'),
  C('Cihangir', '#b0801f', 'Merdivenli Sokaklar', 'Streets of Stairs', 'Treppengassen', 'Calles de escaleras'),
  C('Sahaflar Çarşısı', '#5a3a22', 'Kayıp Sayfa', 'The Lost Page', 'Die verlorene Seite', 'La página perdida'),
  C('Balat', '#a8582e', 'Renkli Kapılar', 'Colourful Doors', 'Bunte Türen', 'Puertas de colores'),
  C('Fener', '#8a2f2a', 'Kırmızı Okulun Sırrı', 'Secret of the Red School', 'Das Geheimnis der roten Schule', 'El secreto de la escuela roja'),
  C('Üsküdar', '#2a7176', 'Kız Kulesi’nin Bekçisi', 'Keeper of the Tower', 'Der Wächter des Turms', 'El guardián de la torre'),
  C('Kuzguncuk', '#2f6150', 'Bostan ve Kediler', 'Gardens and Cats', 'Gärten und Katzen', 'Huertos y gatos'),
  C('Ortaköy', '#2b4a7a', 'Köprü Altındaki Kumpir', 'Kumpir Under the Bridge', 'Kumpir unter der Brücke', 'Kumpir bajo el puente'),
  C('Bebek', '#b0801f', 'Badem Ezmesi Defteri', 'The Marzipan Notebook', 'Das Marzipanheft', 'El cuaderno de mazapán'),
  C('Arnavutköy', '#62407a', 'Ahşap Yalılar', 'Wooden Mansions', 'Hölzerne Villen', 'Mansiones de madera'),
  C('Rumeli Hisarı', '#5a3a22', 'Kale Burçlarında', 'Upon the Fortress Walls', 'Auf den Festungsmauern', 'Sobre las murallas'),
  C('Sarıyer', '#a8582e', 'Börekçinin Kedisi', 'The Baker’s Cat', 'Die Katze des Bäckers', 'El gato del panadero'),
  C('Emirgan', '#8a2f2a', 'Lale Bahçesi', 'The Tulip Garden', 'Der Tulpengarten', 'El jardín de tulipanes'),
  C('Eminönü', '#b0801f', 'Baharat Kokulu Defter', 'The Spice-Scented Notebook', 'Das Gewürzheft', 'El cuaderno de especias'),
  C('Sultanahmet', '#2a7176', 'Kubbelerin Altında', 'Beneath the Domes', 'Unter den Kuppeln', 'Bajo las cúpulas'),
  C('Karaköy', '#2b4a7a', 'Simitçi ve Martı', 'The Simit Seller and the Gull', 'Der Simitverkäufer und die Möwe', 'El vendedor de simit y la gaviota'),
  C('Galata', '#62407a', 'Kuleden Bakınca', 'View from the Tower', 'Blick vom Turm', 'Vista desde la torre'),
  C('Beşiktaş', '#2f6150', 'Çarşının Ritmi', 'Rhythm of the Market', 'Rhythmus des Marktes', 'El ritmo del mercado'),
  C('Nişantaşı', '#5a3a22', 'Vitrindeki Şapka', 'The Hat in the Window', 'Der Hut im Schaufenster', 'El sombrero del escaparate'),
  C('Çengelköy', '#2f6150', 'Salatalık Mevsimi', 'Cucumber Season', 'Gurkenzeit', 'Temporada de pepinos'),
  C('Kandilli', '#2b4a7a', 'Yıldız Gözlemcisi', 'The Stargazer', 'Der Sterngucker', 'El observador de estrellas'),
  C('Anadolu Hisarı', '#a8582e', 'Göksu’da Sandal', 'A Rowboat on the Göksu', 'Ein Ruderboot auf dem Göksu', 'Una barca en el Göksu'),
  C('Kınalıada', '#8a2f2a', 'Ada Vapuru', 'The Island Ferry', 'Die Inselfähre', 'El ferry de las islas'),
  C('Burgazada', '#62407a', 'Yazarın Evi', 'The Writer’s House', 'Das Haus des Schriftstellers', 'La casa del escritor'),
  C('Heybeliada', '#2f6150', 'Çam Ormanında', 'In the Pine Forest', 'Im Kiefernwald', 'En el pinar'),
  C('Büyükada', '#2a7176', 'Bisikletli Tekir', 'Tekir on a Bicycle', 'Tekir auf dem Fahrrad', 'Tekir en bicicleta'),
  C('Topkapı', '#b0801f', 'Sarayın Kütüphanesi', 'The Palace Library', 'Die Palastbibliothek', 'La biblioteca del palacio'),
];

export const CHAPTER_REWARD = 150;

/** Chapter index (0-based) of a journey level; levels beyond the 30 chapters cycle the names. */
export function chapterOf(level: number): number {
  return Math.floor((level - 1) / LEVELS_PER_CHAPTER);
}

export function chapterInfo(level: number): { index: number; chapter: Chapter; done: number; total: number } {
  const index = chapterOf(level);
  return { index, chapter: CHAPTERS[index % CHAPTERS.length], done: (level - 1) % LEVELS_PER_CHAPTER, total: LEVELS_PER_CHAPTER };
}

/** True when `level` is the last level of its chapter. */
export function endsChapter(level: number): boolean {
  return level % LEVELS_PER_CHAPTER === 0;
}
