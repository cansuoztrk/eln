/**
 * The Istanbul tour: 8 districts, each with its own skyline, palette and
 * time of day. After Adalar the tour starts again at Karaköy with one more
 * star (tour 2, 3 …), goals keep growing.
 */
export type Landmark =
  | 'galata'
  | 'yenicami'
  | 'pier'
  | 'haydarpasa'
  | 'maiden'
  | 'houses'
  | 'school'
  | 'bluemosque'
  | 'hagia'
  | 'clocktower'
  | 'palace'
  | 'bridge'
  | 'ortakoy'
  | 'island'
  | 'lighthouse';

export interface DistrictDef {
  id: string;
  /** Sky gradient top → horizon. */
  sky: [string, string];
  sun: string;
  /** Moon instead of sun (night scenes) */
  night?: boolean;
  water: [string, string];
  /** Far and near silhouette colours. */
  far: string;
  near: string;
  /** Window / light colour in night scenes. */
  lights: string;
  landmarks: Landmark[];
  /** Accent used by the UI for this district (chips, goal bar). */
  accent: string;
}

export const DISTRICTS: readonly DistrictDef[] = [
  { id: 'karakoy', sky: ['#7ec8f2', '#ffe1b8'], sun: '#fff1b8', water: ['#3b97c4', '#1f5f8f'], far: '#9db8cf', near: '#56708a', lights: '#ffe08a', landmarks: ['yenicami', 'galata', 'pier'], accent: '#e8553e' },
  { id: 'kadikoy', sky: ['#5fb6ef', '#c9ecff'], sun: '#fffbe0', water: ['#2f8fc0', '#175a88'], far: '#a7c3d8', near: '#5b7590', lights: '#ffe08a', landmarks: ['haydarpasa', 'maiden'], accent: '#2a9d8f' },
  { id: 'balat', sky: ['#f7b267', '#ffe8c2'], sun: '#fff3c4', water: ['#3e8fb0', '#21607e'], far: '#c9a98f', near: '#7b5e57', lights: '#ffd166', landmarks: ['school', 'houses'], accent: '#f4845f' },
  { id: 'sultanahmet', sky: ['#f6a96c', '#ffd9a0'], sun: '#ffe6a3', water: ['#4a8db7', '#244f75'], far: '#c79a86', near: '#6f4f5f', lights: '#ffd166', landmarks: ['hagia', 'bluemosque'], accent: '#3d5a80' },
  { id: 'besiktas', sky: ['#ef7b5a', '#ffc58f'], sun: '#ffd27a', water: ['#3f7fa8', '#1f4a6e'], far: '#b4848c', near: '#5c4a63', lights: '#ffd166', landmarks: ['palace', 'clocktower'], accent: '#111111' },
  { id: 'galata', sky: ['#6a4c93', '#f28f79'], sun: '#ffb38a', water: ['#3b5f8f', '#1e3557'], far: '#8f6f9c', near: '#3f3456', lights: '#ffcf70', landmarks: ['yenicami', 'galata', 'bridge'], accent: '#b5179e' },
  { id: 'ortakoy', sky: ['#141a3c', '#3f3a7a'], sun: '#f4f1de', night: true, water: ['#1d2c5c', '#0b1430'], far: '#2b2f5e', near: '#171a38', lights: '#ffd166', landmarks: ['bridge', 'ortakoy'], accent: '#7b61ff' },
  { id: 'adalar', sky: ['#ffafcc', '#ffe5d9'], sun: '#fff0e6', water: ['#5fa8d3', '#2c6e9a'], far: '#b7c9a8', near: '#5b7b5a', lights: '#ffd166', landmarks: ['island', 'lighthouse'], accent: '#52b788' },
];

export const TOUR = DISTRICTS.length;

export function districtDef(d: number): DistrictDef {
  return DISTRICTS[((d % TOUR) + TOUR) % TOUR];
}

/** Tour number (1-based): Karaköy ★1, then ★2 … */
export function tourOf(d: number): number {
  return Math.floor(d / TOUR) + 1;
}
