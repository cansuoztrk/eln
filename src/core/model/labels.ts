/** Turkish UI labels for every enum value of the design model. */
import type {
  Choreography,
  DnaId,
  FacadeLighting,
  LedMode,
  MaterialTarget,
  NightTint,
  PlazaCharacter,
  RoofForm,
  RoofLightStyle,
  ScreenLayout,
  ShowEnd,
  ShowProfile,
  ShowStart,
  SolarMode,
  VisualLanguage,
} from './design';

export const DNA_LABEL: Record<DnaId | 'custom', string> = {
  classic: 'Classic Evolution',
  redgold: 'Red & Gold Icon',
  pure: 'Pure Architecture',
  future: 'Future Arena',
  green: 'Green Stadium',
  custom: 'Özel kombinasyon',
};

export const LANGUAGE_LABEL: Record<VisualLanguage, string> = {
  heritage: 'Miras odaklı',
  iconic: 'İkonik',
  minimal: 'Sade / minimal',
  futurist: 'Fütürist',
  organic: 'Organik / yeşil',
};

export const ROOF_FORM_LABEL: Record<RoofForm, string> = {
  current: 'Mevcut çatı formu (referans)',
  halo: 'Halo çatı kenarı eklentisi',
  'extended-canopy': 'Genişletilmiş kanopi (mühendislik değerlendirmesi gerekir)',
};

export const ROOF_LIGHT_LABEL: Record<RoofLightStyle, string> = {
  none: 'Kapalı',
  'subtle-rim': 'İnce kenar ışığı',
  'halo-ring': 'Halo ışık halkası',
  segmented: 'Segmentli ritim',
  'full-crown': 'Tam taç (iç + dış halka)',
};

export const FACADE_LIGHTING_LABEL: Record<FacadeLighting, string> = {
  static: 'Sabit aydınlatma',
  dynamic: 'Dinamik renk geçişi',
  media: 'Medya cephesi',
};

export const SCREEN_LABEL: Record<ScreenLayout, string> = {
  standard: 'Standart (2 ana ekran + saha bandı)',
  ribbon: 'Ribbon (360° tribün bandı)',
  extended: 'Genişletilmiş (büyük + köşe ekranları)',
  'media-facade': 'Medya cephesi + 360° bant',
};

export const PLAZA_LABEL: Record<PlazaCharacter, string> = {
  urban: 'Kentsel meydan',
  park: 'Park karakteri',
  event: 'Etkinlik meydanı',
  garden: 'Bahçe / gölgeli',
};

export const CHOREO_LABEL: Record<Choreography, string> = {
  none: 'Yok (nötr koltuk)',
  stripes: 'Sarı-kırmızı şeritler',
  halves: 'İki yarım',
  wave: 'Dalga',
  stars: 'Yıldız kümeleri',
  'mosaic-2035': 'Mozaik "2035"',
};

export const NIGHT_LABEL: Record<NightTint, string> = {
  'istanbul-blue': 'İstanbul mavisi',
  crimson: 'Kızıl gece',
  amber: 'Kehribar',
  neutral: 'Nötr',
  emerald: 'Zümrüt',
};

export const SOLAR_LABEL: Record<SolarMode, string> = {
  existing: 'Mevcut çatı GES referansı',
  extended: 'Genişletilmiş GES konsepti',
};

export const PROFILE_LABEL: Record<ShowProfile, string> = {
  static: 'Sabit',
  breathe: 'Nefes (yavaş)',
  chase: 'Takip (dönen)',
  wave: 'Dalga',
  sparkle: 'Yıldızlanma (yavaş)',
  split: 'İkiye bölünmüş',
};

export const LED_LABEL: Record<LedMode, string> = {
  off: 'Kapalı',
  colors: 'Renk blokları',
  wave: 'Dalga',
  text: 'Yazı akışı',
  match: 'Maç bilgisi (örnek)',
};

export const START_LABEL: Record<ShowStart, string> = {
  'fade-in': 'Yavaş açılış',
  'blackout-reveal': 'Karartma → açılış',
  cut: 'Doğrudan',
};

export const END_LABEL: Record<ShowEnd, string> = {
  'fade-out': 'Yavaş kapanış',
  hold: 'Son sahnede kal',
  blackout: 'Karartma',
};

export const MATERIAL_TARGET_LABEL: Record<MaterialTarget, string> = {
  facade: 'Dış cephe kanatları',
  roof: 'Çatı yüzeyi',
  structure: 'Kavramsal taşıyıcı sistem',
  plinth: 'Kaide / zemin kütlesi',
};

export const NIGHT_COLORS: Record<NightTint, { sky: string; horizon: string; fog: string; accent: string }> = {
  'istanbul-blue': { sky: '#03060f', horizon: '#14233f', fog: '#0b1426', accent: '#5b7bd5' },
  crimson: { sky: '#070306', horizon: '#3a0f19', fog: '#1d0a10', accent: '#d4213d' },
  amber: { sky: '#070504', horizon: '#3b2410', fog: '#1d140b', accent: '#f2a531' },
  neutral: { sky: '#050607', horizon: '#1d2128', fog: '#111317', accent: '#c9ccd2' },
  emerald: { sky: '#020705', horizon: '#0f3326', fog: '#0a1a14', accent: '#3fbf8a' },
};

/** Generic pretty-printer for diff tables. */
export function prettyValue(key: string, value: unknown): string {
  if (typeof value === 'boolean') return value ? 'Açık' : 'Kapalı';
  if (typeof value === 'number') return `${Math.round(value * 100)}%`;
  if (Array.isArray(value)) return `${value.length} adım`;
  if (typeof value !== 'string') return String(value);
  const tables: Record<string, Record<string, string>> = {
    dna: DNA_LABEL,
    language: LANGUAGE_LABEL,
    'roof.form': ROOF_FORM_LABEL,
    'roof.light': ROOF_LIGHT_LABEL,
    'facade.lighting': FACADE_LIGHTING_LABEL,
    'screens.layout': SCREEN_LABEL,
    'seats.choreography': CHOREO_LABEL,
    'palette.night': NIGHT_LABEL,
    'plaza.character': PLAZA_LABEL,
    'green.solar': SOLAR_LABEL,
    'show.profile': PROFILE_LABEL,
    'show.led': LED_LABEL,
    'show.start': START_LABEL,
    'show.end': END_LABEL,
  };
  if (key.startsWith('materials.')) return MATERIAL_NAME[value] ?? value;
  if (key === 'plaza.social') return value === 'expanded' ? 'Genişletilmiş sosyal alan' : 'Mevcut ölçek';
  return tables[key]?.[value] ?? value;
}

export const MATERIAL_NAME: Record<string, string> = {
  'brushed-metal': 'Fırçalanmış metal',
  'dark-metal': 'Koyu metal',
  glass: 'Cam',
  concrete: 'Beton',
  composite: 'Kompozit cephe',
  translucent: 'Yarı saydam yüzey',
  recycled: 'Geri dönüştürülmüş malzeme esinli',
  'gold-metal': 'Altın tonlu metal',
};

export const KEY_LABEL: Record<string, string> = {
  dna: 'Stadium DNA',
  language: 'Görsel dil',
  'roof.form': 'Çatı formu',
  'roof.light': 'Çatı aydınlatma stili',
  'roof.ring': 'Işık halkası yoğunluğu',
  'facade.lighting': 'Cephe aydınlatması',
  'materials.facade': 'Cephe malzemesi',
  'materials.roof': 'Çatı malzemesi',
  'materials.structure': 'Taşıyıcı görünümü',
  'materials.plinth': 'Kaide malzemesi',
  'screens.layout': 'Dijital ekran düzeni',
  'seats.choreography': 'Tribün koreografisi',
  'palette.primary': 'Ana mimari renk',
  'palette.secondary': 'İkincil mimari renk',
  'palette.night': 'Gece atmosferi',
  'plaza.character': 'Meydan peyzaj karakteri',
  'plaza.social': 'Sosyal alan ölçeği',
  'district.fanZone': 'Taraftar meydanı',
  'district.museum': 'Müze ve deneyim alanı',
  'district.eventLawn': 'Etkinlik çimi',
  'district.transitHub': 'Ulaşım bağlantı noktası',
  'district.meetingPoints': 'Buluşma noktaları',
  'green.solar': 'Güneş enerjisi',
  'green.rainwater': 'Yağmur suyu yönetimi',
  'green.efficientLighting': 'Verimli aydınlatma',
  'green.pitchCare': 'Saha bakımı kaynak optimizasyonu',
  'green.landscape': 'Peyzaj ve gölgelendirme',
  'green.waste': 'Atık azaltma',
  'green.transitLink': 'Toplu taşıma bağlantısı',
  'access.routes': 'Erişilebilir güzergâhlar',
  'access.servicePoints': 'Erişilebilir hizmet noktaları',
  'show.active': 'Işık gösterisi',
  'show.preset': 'Gösteri',
  'show.primary': 'Gösteri ana rengi',
  'show.secondary': 'Gösteri ikinci rengi',
  'show.ring': 'Gösteri halka yoğunluğu',
  'show.speed': 'Gösteri hızı',
  'show.tribune': 'Tribün ışık kapsamı',
  'show.led': 'LED ekran görünümü',
  'show.profile': 'Animasyon profili',
  'show.start': 'Başlangıç sahnesi',
  'show.end': 'Bitiş sahnesi',
  'show.sequence': 'Sahne zaman çizelgesi',
};
