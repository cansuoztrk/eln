/**
 * Walkthrough points. Each point has an eye position, a look target, a
 * zone (used to decide between a smooth flight and a safe fade transition)
 * and a walk radius: keyboard movement is clamped inside that radius at a
 * fixed eye height, so the visitor cannot walk into walls or fall.
 */
import { INNER, PROFILE, bowlPoint, lowerRowD, lowerRowY } from '../stadium/geometry';
import type { Vec3 } from '../worldApi';

export type PoiZone = 'outside' | 'interior' | 'bowl' | 'aerial';

export interface Poi {
  id: string;
  name: string;
  short: string;
  description: string;
  pos: Vec3;
  target: Vec3;
  zone: PoiZone;
  walkRadius: number;
  /** concept-level interior: geometry is illustrative */
  concept?: boolean;
}

const v = (x: { x: number; y: number; z: number }): Vec3 => [x.x, x.y, x.z];
const EYE = 1.7;

const seatRow = 12;
const seatPos = bowlPoint(0.03, lowerRowD(seatRow) + 0.4, lowerRowY(seatRow) + 1.15);

export const POIS: Poi[] = [
  {
    id: 'entry-plaza',
    name: 'Dış giriş meydanı',
    short: 'Giriş meydanı',
    description: 'Cephe önündeki kaide ve kapılar. Ziyaretçinin stadyumla ilk karşılaştığı ölçek.',
    pos: [-70, EYE, 150],
    target: [-20, 14, 100],
    zone: 'outside',
    walkRadius: 18,
  },
  {
    id: 'main-entrance',
    name: 'Ana giriş',
    short: 'Ana giriş',
    description: 'Kapı A: kanopili ana giriş konsepti. Cephe kanatları ve ışık bandı yakın ölçekte okunur.',
    pos: [6, EYE, INNER.hd + PROFILE.facadeD + 32],
    target: [0, 11, INNER.hd + PROFILE.facadeD - 6],
    zone: 'outside',
    walkRadius: 9,
  },
  {
    id: 'concourse',
    name: 'İç dolaşım alanı',
    short: 'Dolaşım',
    description: 'Zemin kat dolaşım halkası: kiosklar, yön bulma ve tribün girişleri. İç mekân konsept seviyesindedir.',
    pos: [24, EYE, INNER.hd + 36],
    target: [-20, 2.2, INNER.hd + 35],
    zone: 'interior',
    walkRadius: 10,
    concept: true,
  },
  {
    id: 'tribune-entrance',
    name: 'Tribün girişi',
    short: 'Tribün girişi',
    description: 'Orta seviyedeki vomitoryumdan kaseye çıkış anı: saha ilk kez görünür.',
    pos: v(bowlPoint(0.0, PROFILE.crossAisle[0] + 2.2, PROFILE.midSlabY + EYE)),
    target: [0, 4, 0],
    zone: 'bowl',
    walkRadius: 2.5,
    concept: true,
  },
  {
    id: 'seat-row',
    name: 'Koltuk sırası',
    short: 'Koltuk',
    description: `Alt tribün, ${seatRow + 1}. sıra (konsept model). Bakış açısı ve saha yakınlığı.`,
    pos: v(seatPos),
    target: [0, 0.5, 0],
    zone: 'bowl',
    walkRadius: 1.2,
  },
  {
    id: 'pitch-side',
    name: 'Saha kenarı',
    short: 'Saha kenarı',
    description: 'Teknik alan yakınından tribünlere ve çatıya bakış.',
    pos: [14, EYE, 38.5],
    target: [-14, 9, -10],
    zone: 'bowl',
    walkRadius: 6,
  },
  {
    id: 'player-tunnel',
    name: 'Oyuncu tüneli',
    short: 'Tünel',
    description: 'Kuzey tribün altındaki oyuncu tüneli konsepti; sahaya çıkış perspektifi.',
    pos: [0, EYE, -(INNER.hd + 13)],
    target: [0, 1.6, 0],
    zone: 'interior',
    walkRadius: 3,
    concept: true,
  },
  {
    id: 'roof-view',
    name: 'Çatıya bakan özel kamera',
    short: 'Çatı',
    description: 'Sahadan çatı halkasına, taşıyıcı ritme ve ışık bandına bakış.',
    pos: [-18, 2.2, 14],
    target: [30, PROFILE.roofInnerY + 4, -INNER.hd - 10],
    zone: 'bowl',
    walkRadius: 10,
  },
  {
    id: 'fan-plaza',
    name: 'Taraftar meydanı',
    short: 'Meydan',
    description: 'Maç öncesi buluşma ve etkinlik meydanı konsepti.',
    pos: [48, 12, 232],
    target: [0, 6, 160],
    zone: 'outside',
    walkRadius: 25,
  },
  {
    id: 'museum',
    name: 'Müze ve deneyim alanı',
    short: 'Müze',
    description: 'Kulüp müzesi ve stadyum turu başlangıcı için deneyim binası konsepti.',
    pos: [206, 8, 168],
    target: [158, 8, 118],
    zone: 'outside',
    walkRadius: 18,
  },
];

export const POI_BY_ID = Object.fromEntries(POIS.map((p) => [p.id, p])) as Record<string, Poi>;

export const HOME_POSE = { pos: [250, 135, 330] as Vec3, target: [0, 12, 0] as Vec3 };
export const INTRO_START = { pos: [900, 260, 1500] as Vec3, target: [0, 40, 0] as Vec3 };

