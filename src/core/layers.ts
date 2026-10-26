/** The digital twin's independently controllable layers. */
export const LAYER_IDS = [
  'massing',
  'facade',
  'roof',
  'structure',
  'lowerTier',
  'upperTier',
  'pitch',
  'screens',
  'lighting',
  'concourse',
  'surroundings',
  'landscape',
  'solar',
  'access',
  'transit',
] as const;
export type LayerId = (typeof LAYER_IDS)[number];

export const LAYER_LABEL: Record<LayerId, string> = {
  massing: 'Ana stadyum kütlesi',
  facade: 'Dış cephe',
  roof: 'Çatı',
  structure: 'Kavramsal taşıyıcı sistem',
  lowerTier: 'Alt tribün',
  upperTier: 'Üst tribün',
  pitch: 'Saha',
  screens: 'LED ekranlar',
  lighting: 'Aydınlatma bileşenleri',
  concourse: 'İç dolaşım bölgeleri',
  surroundings: 'Çevre yapıları',
  landscape: 'Peyzaj alanları',
  solar: 'Güneş enerjisi konsept elemanları',
  access: 'Erişilebilirlik güzergâhları',
  transit: 'Ulaşım ve giriş bölgeleri',
};

/** Vertical offsets (m) used by the exploded architecture view. */
export const EXPLODE_OFFSET: Record<LayerId, number> = {
  massing: 0,
  pitch: -6,
  lowerTier: 6,
  concourse: 22,
  upperTier: 40,
  screens: 52,
  lighting: 64,
  structure: 76,
  roof: 92,
  solar: 104,
  facade: 0,
  surroundings: 0,
  landscape: 0,
  access: 0,
  transit: 0,
};

/** Facade moves outwards (radial scale) in the exploded view. */
export const EXPLODE_FACADE_SCALE = 0.22;

export const DEFAULT_LAYERS: Record<LayerId, boolean> = {
  massing: true,
  facade: true,
  roof: true,
  structure: true,
  lowerTier: true,
  upperTier: true,
  pitch: true,
  screens: true,
  lighting: true,
  concourse: true,
  surroundings: true,
  landscape: true,
  solar: true,
  access: true,
  transit: true,
};
