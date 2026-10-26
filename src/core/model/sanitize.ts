/**
 * Validation for any DesignConfig that arrives from outside the running app:
 * share links, imported JSON files, localStorage and (optionally) a remote
 * AI endpoint. Unknown keys are dropped, enums are checked, numbers clamped,
 * colors must be #rrggbb. Invalid fields fall back to the default design.
 */
import {
  CHOREOGRAPHIES,
  DEFAULT_DESIGN,
  DNA_IDS,
  FACADE_LIGHTING,
  LED_MODES,
  MATERIAL_IDS,
  MATERIAL_TARGETS,
  NIGHT_TINTS,
  PLAZA_CHARACTERS,
  ROOF_FORMS,
  ROOF_LIGHTS,
  SCHEMA_VERSION,
  SCREEN_LAYOUTS,
  SHOW_ENDS,
  SHOW_PRESET_IDS,
  SHOW_PROFILES,
  SHOW_STARTS,
  SOLAR_MODES,
  VISUAL_LANGUAGES,
  type DesignConfig,
  type ShowStep,
} from './design';

export interface SanitizeResult {
  config: DesignConfig;
  /** Human-readable notes about fields that were invalid and replaced. */
  warnings: string[];
}

const HEX = /^#[0-9a-f]{6}$/i;

type Obj = Record<string, unknown>;
const obj = (v: unknown): Obj => (typeof v === 'object' && v !== null && !Array.isArray(v) ? (v as Obj) : {});

export function sanitizeDesign(input: unknown): SanitizeResult {
  const warnings: string[] = [];
  const src = obj(input);
  const d = DEFAULT_DESIGN;

  function pick<T extends string>(path: string, value: unknown, allowed: readonly T[], fallback: T): T {
    if (value === undefined) return fallback;
    if (typeof value === 'string' && (allowed as readonly string[]).includes(value)) return value as T;
    warnings.push(`${path}: geçersiz değer, varsayılan kullanıldı`);
    return fallback;
  }
  function num(path: string, value: unknown, fallback: number, min = 0, max = 1): number {
    if (value === undefined) return fallback;
    if (typeof value === 'number' && Number.isFinite(value)) return Math.min(max, Math.max(min, value));
    warnings.push(`${path}: sayı bekleniyordu`);
    return fallback;
  }
  function bool(path: string, value: unknown, fallback: boolean): boolean {
    if (value === undefined) return fallback;
    if (typeof value === 'boolean') return value;
    warnings.push(`${path}: true/false bekleniyordu`);
    return fallback;
  }
  function color(path: string, value: unknown, fallback: string): string {
    if (value === undefined) return fallback;
    if (typeof value === 'string' && HEX.test(value)) return value.toLowerCase();
    warnings.push(`${path}: renk #rrggbb biçiminde olmalı`);
    return fallback;
  }

  if (src.v !== undefined && src.v !== SCHEMA_VERSION) warnings.push(`Sürüm ${String(src.v)} tanınmadı; uyumlu alanlar yüklendi`);

  const roof = obj(src.roof);
  const facade = obj(src.facade);
  const materials = obj(src.materials);
  const screens = obj(src.screens);
  const seats = obj(src.seats);
  const palette = obj(src.palette);
  const plaza = obj(src.plaza);
  const district = obj(src.district);
  const green = obj(src.green);
  const access = obj(src.access);
  const show = obj(src.show);

  const mats = {} as DesignConfig['materials'];
  for (const t of MATERIAL_TARGETS) mats[t] = pick(`materials.${t}`, materials[t], MATERIAL_IDS, d.materials[t]);

  let sequence: ShowStep[] = d.show.sequence;
  if (show.sequence !== undefined) {
    if (Array.isArray(show.sequence)) {
      sequence = show.sequence.slice(0, 12).flatMap((raw, i) => {
        const s = obj(raw);
        if (typeof s.preset !== 'string' || !(SHOW_PRESET_IDS as readonly string[]).includes(s.preset)) {
          warnings.push(`show.sequence[${i}]: bilinmeyen gösteri atlandı`);
          return [];
        }
        return [
          {
            id: typeof s.id === 'string' && s.id.length <= 24 ? s.id : `s${i + 1}`,
            preset: s.preset as ShowStep['preset'],
            duration: num(`show.sequence[${i}].duration`, s.duration, 8, 3, 60),
          },
        ];
      });
    } else warnings.push('show.sequence: liste bekleniyordu');
  }

  const config: DesignConfig = {
    v: SCHEMA_VERSION,
    dna: src.dna === 'custom' ? 'custom' : pick('dna', src.dna, DNA_IDS, d.dna),
    language: pick('language', src.language, VISUAL_LANGUAGES, d.language),
    roof: {
      form: pick('roof.form', roof.form, ROOF_FORMS, d.roof.form),
      light: pick('roof.light', roof.light, ROOF_LIGHTS, d.roof.light),
      ring: num('roof.ring', roof.ring, d.roof.ring),
    },
    facade: { lighting: pick('facade.lighting', facade.lighting, FACADE_LIGHTING, d.facade.lighting) },
    materials: mats,
    screens: { layout: pick('screens.layout', screens.layout, SCREEN_LAYOUTS, d.screens.layout) },
    seats: { choreography: pick('seats.choreography', seats.choreography, CHOREOGRAPHIES, d.seats.choreography) },
    palette: {
      primary: color('palette.primary', palette.primary, d.palette.primary),
      secondary: color('palette.secondary', palette.secondary, d.palette.secondary),
      night: pick('palette.night', palette.night, NIGHT_TINTS, d.palette.night),
    },
    plaza: {
      character: pick('plaza.character', plaza.character, PLAZA_CHARACTERS, d.plaza.character),
      social: pick('plaza.social', plaza.social, ['current', 'expanded'] as const, d.plaza.social),
    },
    district: {
      fanZone: bool('district.fanZone', district.fanZone, d.district.fanZone),
      museum: bool('district.museum', district.museum, d.district.museum),
      eventLawn: bool('district.eventLawn', district.eventLawn, d.district.eventLawn),
      transitHub: bool('district.transitHub', district.transitHub, d.district.transitHub),
      meetingPoints: bool('district.meetingPoints', district.meetingPoints, d.district.meetingPoints),
    },
    green: {
      solar: pick('green.solar', green.solar, SOLAR_MODES, d.green.solar),
      rainwater: bool('green.rainwater', green.rainwater, d.green.rainwater),
      efficientLighting: bool('green.efficientLighting', green.efficientLighting, d.green.efficientLighting),
      pitchCare: bool('green.pitchCare', green.pitchCare, d.green.pitchCare),
      landscape: bool('green.landscape', green.landscape, d.green.landscape),
      waste: bool('green.waste', green.waste, d.green.waste),
      transitLink: bool('green.transitLink', green.transitLink, d.green.transitLink),
    },
    access: {
      routes: bool('access.routes', access.routes, d.access.routes),
      servicePoints: bool('access.servicePoints', access.servicePoints, d.access.servicePoints),
    },
    show: {
      active: bool('show.active', show.active, d.show.active),
      preset: show.preset === 'custom' ? 'custom' : pick('show.preset', show.preset, SHOW_PRESET_IDS, d.show.preset),
      primary: color('show.primary', show.primary, d.show.primary),
      secondary: color('show.secondary', show.secondary, d.show.secondary),
      ring: num('show.ring', show.ring, d.show.ring),
      speed: num('show.speed', show.speed, d.show.speed),
      tribune: num('show.tribune', show.tribune, d.show.tribune),
      led: pick('show.led', show.led, LED_MODES, d.show.led),
      profile: pick('show.profile', show.profile, SHOW_PROFILES, d.show.profile),
      start: pick('show.start', show.start, SHOW_STARTS, d.show.start),
      end: pick('show.end', show.end, SHOW_ENDS, d.show.end),
      sequence,
    },
  };
  return { config, warnings };
}

/* ---------- Share-link encoding (base64url of UTF-8 JSON) ---------- */

export function encodeDesign(d: DesignConfig): string {
  const bytes = new TextEncoder().encode(JSON.stringify(d));
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export const MAX_SHARE_LENGTH = 8000;

export function decodeDesign(encoded: string): SanitizeResult {
  if (encoded.length > MAX_SHARE_LENGTH) throw new Error('Paylaşım bağlantısı çok uzun');
  if (!/^[A-Za-z0-9_-]+$/.test(encoded)) throw new Error('Paylaşım bağlantısı geçersiz karakter içeriyor');
  const b64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4));
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  const json = JSON.parse(new TextDecoder().decode(bytes)) as unknown;
  return sanitizeDesign(json);
}
