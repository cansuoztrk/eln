/**
 * ASLAN 2035 OMEGA — shared design data model.
 *
 * Every module (DNA engine, material lab, light show, time machine, what-if,
 * AI architect, archive, share links…) reads and writes this one structure.
 * The 3D world renders whatever DesignConfig is "effective" at the moment
 * (the user's design, or a temporary preview such as a time-machine phase).
 */

export const SCHEMA_VERSION = 1 as const;

export const DNA_IDS = ['classic', 'redgold', 'pure', 'future', 'green'] as const;
export type DnaId = (typeof DNA_IDS)[number];

export const VISUAL_LANGUAGES = ['heritage', 'iconic', 'minimal', 'futurist', 'organic'] as const;
export type VisualLanguage = (typeof VISUAL_LANGUAGES)[number];

export const ROOF_FORMS = ['current', 'halo', 'extended-canopy'] as const;
export type RoofForm = (typeof ROOF_FORMS)[number];

export const ROOF_LIGHTS = ['none', 'subtle-rim', 'halo-ring', 'segmented', 'full-crown'] as const;
export type RoofLightStyle = (typeof ROOF_LIGHTS)[number];

export const MATERIAL_IDS = [
  'brushed-metal',
  'dark-metal',
  'glass',
  'concrete',
  'composite',
  'translucent',
  'recycled',
  'gold-metal',
] as const;
export type MaterialId = (typeof MATERIAL_IDS)[number];

export const MATERIAL_TARGETS = ['facade', 'roof', 'structure', 'plinth'] as const;
export type MaterialTarget = (typeof MATERIAL_TARGETS)[number];

export const FACADE_LIGHTING = ['static', 'dynamic', 'media'] as const;
export type FacadeLighting = (typeof FACADE_LIGHTING)[number];

export const SCREEN_LAYOUTS = ['standard', 'ribbon', 'extended', 'media-facade'] as const;
export type ScreenLayout = (typeof SCREEN_LAYOUTS)[number];

export const PLAZA_CHARACTERS = ['urban', 'park', 'event', 'garden'] as const;
export type PlazaCharacter = (typeof PLAZA_CHARACTERS)[number];

export const CHOREOGRAPHIES = ['none', 'stripes', 'halves', 'wave', 'stars', 'mosaic-2035'] as const;
export type Choreography = (typeof CHOREOGRAPHIES)[number];

export const NIGHT_TINTS = ['istanbul-blue', 'crimson', 'amber', 'neutral', 'emerald'] as const;
export type NightTint = (typeof NIGHT_TINTS)[number];

export const SOLAR_MODES = ['existing', 'extended'] as const;
export type SolarMode = (typeof SOLAR_MODES)[number];

export const SHOW_PROFILES = ['static', 'breathe', 'chase', 'wave', 'sparkle', 'split'] as const;
export type ShowProfile = (typeof SHOW_PROFILES)[number];

export const LED_MODES = ['off', 'colors', 'wave', 'text', 'match'] as const;
export type LedMode = (typeof LED_MODES)[number];

export const SHOW_STARTS = ['fade-in', 'blackout-reveal', 'cut'] as const;
export type ShowStart = (typeof SHOW_STARTS)[number];

export const SHOW_ENDS = ['fade-out', 'hold', 'blackout'] as const;
export type ShowEnd = (typeof SHOW_ENDS)[number];

export const SHOW_PRESET_IDS = ['arrival', 'red-wave', 'golden-halo', 'european-night', 'roar', 'championship'] as const;
export type ShowPresetId = (typeof SHOW_PRESET_IDS)[number];

/** A single look of the stadium lighting system. */
export interface ShowLook {
  primary: string;
  secondary: string;
  /** Light ring intensity 0..1 */
  ring: number;
  /** Animation speed 0..1 (mapped to a photosensitivity-safe frequency) */
  speed: number;
  /** Fraction of the tribunes covered by show lighting 0..1 */
  tribune: number;
  led: LedMode;
  profile: ShowProfile;
}

export interface ShowStep {
  id: string;
  preset: ShowPresetId;
  /** seconds */
  duration: number;
}

export interface LightShowConfig extends ShowLook {
  /** When false the stadium uses its architectural lighting (palette). */
  active: boolean;
  preset: ShowPresetId | 'custom';
  start: ShowStart;
  end: ShowEnd;
  sequence: ShowStep[];
}

export interface DesignConfig {
  v: typeof SCHEMA_VERSION;
  dna: DnaId | 'custom';
  language: VisualLanguage;
  roof: {
    form: RoofForm;
    light: RoofLightStyle;
    /** Light ring intensity 0..1 */
    ring: number;
  };
  facade: { lighting: FacadeLighting };
  materials: Record<MaterialTarget, MaterialId>;
  screens: { layout: ScreenLayout };
  seats: { choreography: Choreography };
  palette: { primary: string; secondary: string; night: NightTint };
  plaza: { character: PlazaCharacter; social: 'current' | 'expanded' };
  district: {
    fanZone: boolean;
    museum: boolean;
    eventLawn: boolean;
    transitHub: boolean;
    meetingPoints: boolean;
  };
  green: {
    solar: SolarMode;
    rainwater: boolean;
    efficientLighting: boolean;
    pitchCare: boolean;
    landscape: boolean;
    waste: boolean;
    transitLink: boolean;
  };
  access: { routes: boolean; servicePoints: boolean };
  show: LightShowConfig;
}

/** Parameters that can be locked so presets / AI changes leave them alone. */
export const LOCKABLE_KEYS = [
  'language',
  'roof.form',
  'roof.light',
  'roof.ring',
  'facade.lighting',
  'materials.facade',
  'materials.roof',
  'materials.structure',
  'materials.plinth',
  'screens.layout',
  'seats.choreography',
  'palette.primary',
  'palette.secondary',
  'palette.night',
  'plaza.character',
  'plaza.social',
] as const;
export type LockableKey = (typeof LOCKABLE_KEYS)[number];

export const DEFAULT_SHOW: LightShowConfig = {
  active: false,
  preset: 'arrival',
  primary: '#d4213d',
  secondary: '#f2b631',
  ring: 0.8,
  speed: 0.35,
  tribune: 0.4,
  led: 'colors',
  profile: 'chase',
  start: 'fade-in',
  end: 'fade-out',
  sequence: [
    { id: 's1', preset: 'arrival', duration: 8 },
    { id: 's2', preset: 'red-wave', duration: 8 },
    { id: 's3', preset: 'golden-halo', duration: 8 },
  ],
};

/** The default design = "Classic Evolution" DNA. */
export const DEFAULT_DESIGN: DesignConfig = {
  v: SCHEMA_VERSION,
  dna: 'classic',
  language: 'heritage',
  roof: { form: 'current', light: 'halo-ring', ring: 0.55 },
  facade: { lighting: 'dynamic' },
  materials: { facade: 'brushed-metal', roof: 'translucent', structure: 'dark-metal', plinth: 'concrete' },
  screens: { layout: 'ribbon' },
  seats: { choreography: 'stripes' },
  palette: { primary: '#c8102e', secondary: '#f2b631', night: 'istanbul-blue' },
  plaza: { character: 'urban', social: 'expanded' },
  district: { fanZone: true, museum: true, eventLawn: false, transitHub: true, meetingPoints: true },
  green: {
    solar: 'existing',
    rainwater: false,
    efficientLighting: true,
    pitchCare: false,
    landscape: true,
    waste: false,
    transitLink: true,
  },
  access: { routes: false, servicePoints: false },
  show: DEFAULT_SHOW,
};

/**
 * Approximate representation of today's stadium, used by the Time Machine
 * as phase 0. It is a simplified visual reference, not a survey of the building.
 */
export const CURRENT_REFERENCE: DesignConfig = {
  v: SCHEMA_VERSION,
  dna: 'custom',
  language: 'heritage',
  roof: { form: 'current', light: 'subtle-rim', ring: 0.25 },
  facade: { lighting: 'static' },
  materials: { facade: 'brushed-metal', roof: 'translucent', structure: 'brushed-metal', plinth: 'concrete' },
  screens: { layout: 'standard' },
  seats: { choreography: 'none' },
  palette: { primary: '#c8102e', secondary: '#f2b631', night: 'neutral' },
  plaza: { character: 'urban', social: 'current' },
  district: { fanZone: false, museum: false, eventLawn: false, transitHub: false, meetingPoints: false },
  green: {
    solar: 'existing',
    rainwater: false,
    efficientLighting: false,
    pitchCare: false,
    landscape: false,
    waste: false,
    transitLink: false,
  },
  access: { routes: false, servicePoints: false },
  show: { ...DEFAULT_SHOW, active: false },
};

export function cloneDesign(d: DesignConfig): DesignConfig {
  return structuredClone(d);
}

/** Read a dotted key such as "roof.ring" from a design. */
export function getAt(d: DesignConfig, key: string): unknown {
  return key.split('.').reduce<unknown>((acc, k) => (acc && typeof acc === 'object' ? (acc as Record<string, unknown>)[k] : undefined), d);
}

/** Immutable set of a dotted key. */
export function setAt(d: DesignConfig, key: string, value: unknown): DesignConfig {
  const next = cloneDesign(d);
  const parts = key.split('.');
  let cur = next as unknown as Record<string, unknown>;
  for (let i = 0; i < parts.length - 1; i++) cur = cur[parts[i]] as Record<string, unknown>;
  cur[parts[parts.length - 1]] = value;
  return next;
}

/** Deep partial used for presets, AI patches and scenario patches. */
export type DesignPatch = {
  [K in keyof DesignConfig]?: DesignConfig[K] extends object
    ? DesignConfig[K] extends unknown[]
      ? DesignConfig[K]
      : { [P in keyof DesignConfig[K]]?: DesignConfig[K][P] extends object ? Partial<DesignConfig[K][P]> : DesignConfig[K][P] }
    : DesignConfig[K];
};

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** Deep-merge a patch into a design (arrays are replaced, not merged). */
export function applyPatch(d: DesignConfig, patch: DesignPatch, locked: ReadonlySet<string> = new Set()): DesignConfig {
  const next = cloneDesign(d) as unknown as Record<string, unknown>;
  const walk = (target: Record<string, unknown>, src: Record<string, unknown>, prefix: string) => {
    for (const [k, v] of Object.entries(src)) {
      if (v === undefined) continue;
      const key = prefix ? `${prefix}.${k}` : k;
      if (locked.has(key)) continue;
      if (isPlainObject(v) && isPlainObject(target[k])) walk(target[k] as Record<string, unknown>, v, key);
      else target[k] = structuredClone(v);
    }
  };
  walk(next, patch as Record<string, unknown>, '');
  return next as unknown as DesignConfig;
}

/** Flatten a design into dotted leaf keys (arrays treated as leaves). */
export function flatten(d: unknown, prefix = '', out: Record<string, unknown> = {}): Record<string, unknown> {
  if (isPlainObject(d)) {
    for (const [k, v] of Object.entries(d)) flatten(v, prefix ? `${prefix}.${k}` : k, out);
  } else out[prefix] = d;
  return out;
}

export interface DesignDiff {
  key: string;
  from: unknown;
  to: unknown;
}

export function diffDesigns(a: DesignConfig, b: DesignConfig): DesignDiff[] {
  const fa = flatten(a);
  const fb = flatten(b);
  const keys = new Set([...Object.keys(fa), ...Object.keys(fb)]);
  const diffs: DesignDiff[] = [];
  for (const key of keys) {
    if (key === 'v') continue;
    const va = fa[key];
    const vb = fb[key];
    if (JSON.stringify(va) !== JSON.stringify(vb)) diffs.push({ key, from: va, to: vb });
  }
  return diffs.sort((x, y) => x.key.localeCompare(y.key));
}
