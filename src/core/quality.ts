export type Quality = 'low' | 'medium' | 'high';

export interface DeviceProfile {
  quality: Quality;
  mobile: boolean;
  webgl: boolean;
  reason: string;
}

export function hasWebGL(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

export function detectDevice(): DeviceProfile {
  const webgl = hasWebGL();
  const coarse = window.matchMedia?.('(pointer: coarse)').matches ?? false;
  const narrow = window.innerWidth < 820;
  const mobile = coarse && narrow;
  const cores = navigator.hardwareConcurrency ?? 4;
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
  let quality: Quality = 'high';
  let reason = 'Masaüstü sınıfı cihaz';
  if (mobile || mem <= 3 || cores <= 4) {
    quality = 'low';
    reason = mobile ? 'Mobil cihaz: sadeleştirilmiş 3D' : 'Sınırlı işlemci/bellek';
  } else if (mem <= 6 || cores <= 6) {
    quality = 'medium';
    reason = 'Orta seviye donanım';
  }
  return { quality, mobile: coarse && narrow, webgl, reason };
}

export function prefersReducedMotion(): boolean {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

export const QUALITY_SETTINGS: Record<Quality, { dpr: [number, number]; bloom: boolean; cityCount: number; trees: number; antialias: boolean }> = {
  low: { dpr: [1, 1.25], bloom: false, cityCount: 220, trees: 90, antialias: false },
  medium: { dpr: [1, 1.5], bloom: true, cityCount: 420, trees: 160, antialias: true },
  high: { dpr: [1, 2], bloom: true, cityCount: 700, trees: 240, antialias: true },
};
