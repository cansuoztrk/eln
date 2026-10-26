import { applyPatch, type DesignConfig, type DesignPatch, type ShowPresetId } from '@/core/model/design';
import { SHOW_BY_ID } from '@/core/model/lightshow';
import type { CameraPose } from '@/world/worldApi';

export interface Levers {
  roof: 'lighting-only' | 'halo' | 'canopy';
  social: 'current' | 'expanded';
  screens: 'standard' | 'ribbon' | 'extended' | 'media-facade';
  access: boolean;
  solar: 'existing' | 'extended';
  night: 'none' | ShowPresetId;
}

export const LEVER_LABELS = {
  roof: { 'lighting-only': 'Yalnızca aydınlatma', halo: 'Halo kenar eklentisi', canopy: 'Genişletilmiş kanopi' },
  social: { current: 'Mevcut sosyal alan', expanded: 'Genişletilmiş sosyal alan' },
  screens: { standard: 'Standart ekranlar', ribbon: '360° bant', extended: 'Genişletilmiş ekranlar', 'media-facade': 'Medya cephesi' },
  solar: { existing: 'Mevcut GES', extended: 'Genişletilmiş GES' },
} as const;

/** What each lever can and cannot tell us. */
export const LEVER_LIMITS: Record<keyof Levers, string> = {
  roof: 'Görsel etki karşılaştırılabilir; ek yük, rüzgâr/kar, drenaj ve maliyet bu modelden çıkarılamaz.',
  social: 'Mekânsal düzen görülebilir; gerçek parsel, imar durumu ve işletme modeli araştırılmalıdır.',
  screens: 'Görünüm ve ışık etkisi karşılaştırılabilir; parlaklık, ışık kirliliği ve enerji tüketimi ölçülmemiştir.',
  access: 'Örnek rotalar alanları nasıl bağladığını gösterir; eğim, mesafe ve mevcut koşullarda kullanılabilirlik doğrulanmamıştır.',
  solar: 'Yerleşim fikri görülebilir; üretim, taşıma kapasitesi ve şebeke bağlantısı mühendislik analizi gerektirir.',
  night: 'Atmosfer karşılaştırılabilir; gerçek aydınlatma altyapısı ve izinler değerlendirilmelidir.',
};

export function leversFromDesign(d: DesignConfig): Levers {
  return {
    roof: d.roof.form === 'extended-canopy' ? 'canopy' : d.roof.form === 'halo' ? 'halo' : 'lighting-only',
    social: d.plaza.social,
    screens: d.screens.layout,
    access: d.access.routes,
    solar: d.green.solar,
    night: d.show.active && d.show.preset !== 'custom' ? d.show.preset : 'none',
  };
}

export function applyLevers(base: DesignConfig, l: Levers): DesignConfig {
  const patch: DesignPatch = {
    roof: {
      form: l.roof === 'canopy' ? 'extended-canopy' : l.roof === 'halo' ? 'halo' : 'current',
      light: l.roof === 'lighting-only' ? 'halo-ring' : base.roof.light === 'none' ? 'halo-ring' : base.roof.light,
      ring: l.roof === 'lighting-only' ? Math.max(base.roof.ring, 0.75) : base.roof.ring,
    },
    plaza: { social: l.social, character: l.social === 'expanded' ? base.plaza.character : base.plaza.character === 'event' ? 'urban' : base.plaza.character },
    district: { eventLawn: l.social === 'expanded', fanZone: true },
    screens: { layout: l.screens },
    facade: { lighting: l.screens === 'media-facade' ? 'media' : base.facade.lighting === 'media' ? 'dynamic' : base.facade.lighting },
    access: { routes: l.access, servicePoints: l.access },
    green: { solar: l.solar },
  };
  let next = applyPatch(base, patch);
  if (l.night !== 'none') {
    const look = SHOW_BY_ID[l.night].look;
    next = applyPatch(next, { show: { ...look, active: true, preset: l.night } });
  } else next = applyPatch(next, { show: { active: false } });
  return next;
}

export interface Question {
  id: string;
  text: string;
  pose: CameraPose;
  slots: Partial<Levers>[];
  names: string[];
}

export const QUESTIONS: Question[] = [
  {
    id: 'roof',
    text: 'Daha kapsamlı çatı modernizasyonu yerine yalnızca aydınlatmayı geliştirmek nasıl görünür?',
    pose: { pos: [250, 110, 280], target: [0, 30, 0] },
    slots: [{ roof: 'lighting-only' }, { roof: 'halo' }, { roof: 'canopy' }],
    names: ['Yalnızca ışık', 'Halo eklentisi', 'Genişletilmiş kanopi'],
  },
  {
    id: 'social',
    text: 'Sosyal alanlara daha çok yer ayrılırsa çevre planı nasıl değişir?',
    pose: { pos: [-120, 330, 380], target: [-40, 0, 80] },
    slots: [{ social: 'current' }, { social: 'expanded' }],
    names: ['Mevcut ölçek', 'Genişletilmiş'],
  },
  {
    id: 'screens',
    text: 'Genişletilmiş dijital ekran sistemi stadyumun görünüşünü nasıl etkiler?',
    pose: { pos: [130, 40, 250], target: [0, 25, 60] },
    slots: [{ screens: 'standard' }, { screens: 'extended' }, { screens: 'media-facade' }],
    names: ['Standart', 'Genişletilmiş', 'Medya cephesi'],
  },
  {
    id: 'access',
    text: 'Erişilebilir güzergâhlar hangi alanları birbirine bağlar?',
    pose: { pos: [0, 520, 60], target: [0, 0, 0] },
    slots: [{ access: false }, { access: true }],
    names: ['Rotalar kapalı', 'Erişilebilir rotalar'],
  },
  {
    id: 'solar',
    text: 'Güneş enerjisi konsepti çatı üzerinde nerelere yerleşebilir?',
    pose: { pos: [90, 300, -330], target: [0, 20, -80] },
    slots: [{ solar: 'existing' }, { solar: 'extended' }],
    names: ['Mevcut GES (temsili)', 'Genişletilmiş konsept'],
  },
  {
    id: 'night',
    text: 'Bir maç gecesinde hangi aydınlatma düzeni daha güçlü bir atmosfer yaratır?',
    pose: { pos: [180, 80, 230], target: [0, 25, 0] },
    slots: [{ night: 'golden-halo' }, { night: 'red-wave' }, { night: 'european-night' }],
    names: ['Golden Halo', 'The Red Wave', 'European Night'],
  },
];
