/**
 * Light show presets and the photosensitivity guard.
 *
 * All animation profiles are smooth (sinusoidal / gradient) changes. The
 * maximum modulation frequency is capped well below the 3-flashes-per-second
 * threshold used by WCAG 2.3.1, and brightness never drops to black during
 * an animation, so there are no hard on/off flashes.
 */
import type { LightShowConfig, ShowLook, ShowPresetId } from './design';

export const MAX_SHOW_HZ = 1.2;
/** Minimum brightness during animated profiles (never full blackout flicker). */
export const MIN_SHOW_LEVEL = 0.35;

export function speedToHz(speed: number, reducedMotion: boolean): number {
  if (reducedMotion) return 0;
  const s = Math.min(1, Math.max(0, speed));
  return 0.04 + s * (MAX_SHOW_HZ - 0.04);
}

export interface ShowPreset {
  id: ShowPresetId;
  name: string;
  mood: string;
  look: ShowLook;
}

export const SHOW_PRESETS: ShowPreset[] = [
  {
    id: 'arrival',
    name: 'Arrival of the Lions',
    mood: 'Takımın sahaya çıkışı: altın bir halka yavaşça dönerek açılır, tribünler kırmızıya geçer.',
    look: { primary: '#f2b631', secondary: '#c8102e', ring: 0.85, speed: 0.25, tribune: 0.35, led: 'text', profile: 'chase' },
  },
  {
    id: 'red-wave',
    name: 'The Red Wave',
    mood: 'Tribünleri dolaşan geniş bir kırmızı dalga; LED bantlar dalgayla senkron.',
    look: { primary: '#d4213d', secondary: '#5a0614', ring: 0.75, speed: 0.4, tribune: 0.8, led: 'wave', profile: 'wave' },
  },
  {
    id: 'golden-halo',
    name: 'Golden Halo',
    mood: 'Sakin, nefes alan altın bir hale. Mimari kütle sade bir taç gibi okunur.',
    look: { primary: '#f6c453', secondary: '#fff1cf', ring: 1, speed: 0.15, tribune: 0.15, led: 'colors', profile: 'breathe' },
  },
  {
    id: 'european-night',
    name: 'European Night',
    mood: 'Derin lacivert gece içinde beyaz-altın yıldızlanma; büyük gecelerin gerilimi.',
    look: { primary: '#e9eefc', secondary: '#1b2a6b', ring: 0.7, speed: 0.2, tribune: 0.5, led: 'match', profile: 'sparkle' },
  },
  {
    id: 'roar',
    name: 'The Roar',
    mood: 'Gol anı: iki renk tribünü ikiye böler, halka güçlü ama kontrollü bir ritimle döner.',
    look: { primary: '#ff3045', secondary: '#ffc23d', ring: 1, speed: 0.6, tribune: 1, led: 'colors', profile: 'split' },
  },
  {
    id: 'championship',
    name: 'Championship Celebration',
    mood: 'Şampiyonluk gecesi: altın ve kırmızı dönüşümlü takip, bütün tribün ışıkta.',
    look: { primary: '#ffc23d', secondary: '#d4213d', ring: 1, speed: 0.5, tribune: 1, led: 'text', profile: 'chase' },
  },
];

export const SHOW_BY_ID = Object.fromEntries(SHOW_PRESETS.map((p) => [p.id, p])) as Record<ShowPresetId, ShowPreset>;

export function lookFromShow(show: LightShowConfig): ShowLook {
  const { primary, secondary, ring, speed, tribune, led, profile } = show;
  return { primary, secondary, ring, speed, tribune, led, profile };
}

export const SHOW_FACTS = [
  'Bu bir web tabanlı görsel simülasyondur; gerçek stadyum aydınlatma altyapısına bağlı değildir.',
  `Animasyon hızı en fazla ${MAX_SHOW_HZ} Hz ile sınırlandırılmıştır; ani yanıp sönme ve karartma flaşı üretilmez.`,
  '“Azaltılmış hareket” açıkken bütün gösteriler sabit renkle önizlenir.',
];
