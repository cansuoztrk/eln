/**
 * Stadium DNA presets. A preset is not a colour filter: it is a coherent
 * bundle of architectural choices (lighting, materials, screen layout,
 * plaza landscape, tribune choreography, night atmosphere).
 */
import type { DesignPatch, DnaId } from './design';

export interface DnaPreset {
  id: DnaId;
  name: string;
  tagline: string;
  description: string;
  /** Short bullet list of what this DNA changes in the model. */
  changes: string[];
  patch: DesignPatch;
}

export const DNA_PRESETS: DnaPreset[] = [
  {
    id: 'classic',
    name: 'Classic Evolution',
    tagline: 'Mevcut mimari kimliğe saygılı modernizasyon',
    description:
      'Bugünkü kütle ve çatı formu korunur. Değişiklikler aydınlatma, dijital bant ve meydan deneyimiyle sınırlı tutulur; sarı-kırmızı kimlik ölçülü bir dille öne çıkar.',
    changes: ['Mevcut çatı formu', 'Halo ışık halkası (orta)', 'Fırçalanmış metal cephe', '360° LED bant', 'Şeritli tribün koreografisi'],
    patch: {
      dna: 'classic',
      language: 'heritage',
      roof: { form: 'current', light: 'halo-ring', ring: 0.55 },
      facade: { lighting: 'dynamic' },
      materials: { facade: 'brushed-metal', roof: 'translucent', structure: 'dark-metal', plinth: 'concrete' },
      screens: { layout: 'ribbon' },
      seats: { choreography: 'stripes' },
      palette: { primary: '#c8102e', secondary: '#f2b631', night: 'istanbul-blue' },
      plaza: { character: 'urban', social: 'expanded' },
    },
  },
  {
    id: 'redgold',
    name: 'Red & Gold Icon',
    tagline: 'Kırmızı ve altın mimari ışığın ikon hâline gelmesi',
    description:
      'Çatı iç ve dış halkası birlikte yanar, cephe dinamik renk geçişleri kullanır. Altın tonlu metal cephe kanatları gece ışığını yansıtır; tribünlerde iki renkli koreografi.',
    changes: ['Tam taç aydınlatma', 'Altın tonlu metal cephe', 'Yoğun ışık halkası', 'Kızıl gece atmosferi', 'İki yarım koreografi'],
    patch: {
      dna: 'redgold',
      language: 'iconic',
      roof: { form: 'halo', light: 'full-crown', ring: 0.9 },
      facade: { lighting: 'dynamic' },
      materials: { facade: 'gold-metal', roof: 'translucent', structure: 'dark-metal', plinth: 'dark-metal' },
      screens: { layout: 'ribbon' },
      seats: { choreography: 'halves' },
      palette: { primary: '#d4213d', secondary: '#f2b631', night: 'crimson' },
      plaza: { character: 'event', social: 'expanded' },
    },
  },
  {
    id: 'pure',
    name: 'Pure Architecture',
    tagline: 'Işık geri çekilir, malzeme ve geometri öne çıkar',
    description:
      'İnce bir çatı kenar ışığı, sabit cephe aydınlatması ve standart ekran düzeni. Koyu metal ve beton dokular geometriyi okutur; tribünler nötr bırakılır.',
    changes: ['İnce kenar ışığı', 'Koyu metal cephe', 'Sabit cephe ışığı', 'Standart ekranlar', 'Nötr gece'],
    patch: {
      dna: 'pure',
      language: 'minimal',
      roof: { form: 'current', light: 'subtle-rim', ring: 0.3 },
      facade: { lighting: 'static' },
      materials: { facade: 'dark-metal', roof: 'composite', structure: 'brushed-metal', plinth: 'concrete' },
      screens: { layout: 'standard' },
      seats: { choreography: 'none' },
      palette: { primary: '#c8102e', secondary: '#e6dccb', night: 'neutral' },
      plaza: { character: 'urban', social: 'current' },
    },
  },
  {
    id: 'future',
    name: 'Future Arena',
    tagline: 'Cesur dijital ekranlar, medya cephesi ve kanopi',
    description:
      'Medya cephesi, genişletilmiş ekranlar ve segmentli çatı ritmi. Genişletilmiş kanopi önerisi ayrı bir mühendislik senaryosu olarak işaretlenir.',
    changes: ['Medya cephesi', 'Genişletilmiş kanopi (senaryo)', 'Segmentli çatı ışığı', 'Kompozit cephe', 'Mozaik "2035" koreografisi'],
    patch: {
      dna: 'future',
      language: 'futurist',
      roof: { form: 'extended-canopy', light: 'segmented', ring: 0.8 },
      facade: { lighting: 'media' },
      materials: { facade: 'composite', roof: 'translucent', structure: 'dark-metal', plinth: 'dark-metal' },
      screens: { layout: 'media-facade' },
      seats: { choreography: 'mosaic-2035' },
      palette: { primary: '#e0263f', secondary: '#ffc23d', night: 'istanbul-blue' },
      plaza: { character: 'event', social: 'expanded' },
    },
  },
  {
    id: 'green',
    name: 'Green Stadium',
    tagline: 'Sürdürülebilirlik ve peyzaj ön planda',
    description:
      'Çatı GES’inin genişletilmesi konsepti, yağmur suyu yönetimi, gölgeli peyzaj ve toplu taşıma bağlantısı. Işık daha az ama daha verimli kullanılır.',
    changes: ['Genişletilmiş GES konsepti', 'Bahçe karakterli meydan', 'Yağmur suyu + peyzaj', 'Geri dönüştürülmüş malzeme esinli cephe', 'Zümrüt gece'],
    patch: {
      dna: 'green',
      language: 'organic',
      roof: { form: 'current', light: 'halo-ring', ring: 0.4 },
      facade: { lighting: 'static' },
      materials: { facade: 'recycled', roof: 'translucent', structure: 'brushed-metal', plinth: 'recycled' },
      screens: { layout: 'ribbon' },
      seats: { choreography: 'wave' },
      palette: { primary: '#c8102e', secondary: '#f2b631', night: 'emerald' },
      plaza: { character: 'garden', social: 'expanded' },
      district: { eventLawn: true },
      green: {
        solar: 'extended',
        rainwater: true,
        efficientLighting: true,
        pitchCare: true,
        landscape: true,
        waste: true,
        transitLink: true,
      },
    },
  },
];

export const DNA_BY_ID = Object.fromEntries(DNA_PRESETS.map((p) => [p.id, p])) as Record<DnaId, DnaPreset>;
