import { create } from 'zustand';
import type { DesignConfig } from '../model/design';
import { DEFAULT_LAYERS, type LayerId } from '../layers';
import type { ModuleId } from '../modules';
import { detectDevice, prefersReducedMotion, type Quality } from '../quality';
import { readJSON, writeJSON } from '../storage';

export type CameraMode = 'explorer' | 'walkthrough' | 'seat';
export type SectionMode = 'off' | 'long' | 'short';
export type EnvMode = 'night' | 'dusk' | 'day';
export type AtmosphereId = 'silent' | 'ambient' | 'prematch' | 'kickoff' | 'goal' | 'championship';

export interface Toast {
  id: number;
  kind: 'info' | 'success' | 'warning' | 'error';
  text: string;
}

interface Prefs {
  quality: Quality;
  qualityAuto: boolean;
  reducedMotion: boolean;
  view2D: boolean;
  introSeen: boolean;
}

interface ViewState extends Prefs {
  module: ModuleId;
  mobile: boolean;
  webgl: boolean;
  deviceReason: string;
  cameraMode: CameraMode;
  poi: string | null;
  layers: Record<LayerId, boolean>;
  exploded: boolean;
  section: SectionMode;
  selected: string | null;
  focusLayer: LayerId | null;
  highlight: LayerId[];
  /** Temporary configuration override rendered instead of the user's design. */
  preview: DesignConfig | null;
  previewLabel: string;
  env: EnvMode;
  atmosphere: AtmosphereId;
  /** 0..1 crowd occupancy shown on the tribunes */
  occupancy: number;
  soundOn: boolean;
  volume: number;
  crowdIn3D: boolean;
  introPlaying: boolean;
  capturing: boolean;
  panelOpen: boolean;
  toasts: Toast[];
  announcement: string;
  set: (p: Partial<ViewState>) => void;
  setLayer: (id: LayerId, on: boolean) => void;
  setPreview: (cfg: DesignConfig | null, label?: string) => void;
  toast: (text: string, kind?: Toast['kind']) => void;
  dismissToast: (id: number) => void;
  announce: (text: string) => void;
}

const device = typeof window !== 'undefined' ? detectDevice() : { quality: 'medium' as Quality, mobile: false, webgl: true, reason: '' };
const savedPrefs = typeof window !== 'undefined' ? readJSON<Partial<Prefs>>('prefs') : null;
const sysReduced = typeof window !== 'undefined' ? prefersReducedMotion() : false;

let toastSeq = 1;

export const useView = create<ViewState>()((set, get) => ({
  module: 'home',
  mobile: device.mobile,
  webgl: device.webgl,
  deviceReason: device.reason,
  quality: savedPrefs?.qualityAuto === false && savedPrefs.quality ? savedPrefs.quality : device.quality,
  qualityAuto: savedPrefs?.qualityAuto ?? true,
  reducedMotion: savedPrefs?.reducedMotion ?? sysReduced,
  view2D: !device.webgl || (savedPrefs?.view2D ?? false),
  introSeen: savedPrefs?.introSeen ?? false,
  cameraMode: 'explorer',
  poi: null,
  layers: { ...DEFAULT_LAYERS },
  exploded: false,
  section: 'off',
  selected: null,
  focusLayer: null,
  highlight: [],
  preview: null,
  previewLabel: '',
  env: 'night',
  atmosphere: 'silent',
  occupancy: 0.15,
  soundOn: false,
  volume: 0.6,
  crowdIn3D: false,
  introPlaying: false,
  capturing: false,
  panelOpen: true,
  toasts: [],
  announcement: '',
  set: (p) => set(p),
  setLayer: (id, on) => set({ layers: { ...get().layers, [id]: on } }),
  setPreview: (cfg, label = '') => set({ preview: cfg, previewLabel: cfg ? label : '' }),
  toast: (text, kind = 'info') => {
    const id = toastSeq++;
    set({ toasts: [...get().toasts.slice(-3), { id, kind, text }], announcement: text });
    setTimeout(() => get().dismissToast(id), kind === 'error' ? 9000 : 5000);
  },
  dismissToast: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
  announce: (text) => set({ announcement: text }),
}));

useView.subscribe((s, p) => {
  if (s.quality !== p.quality || s.qualityAuto !== p.qualityAuto || s.reducedMotion !== p.reducedMotion || s.view2D !== p.view2D || s.introSeen !== p.introSeen) {
    writeJSON('prefs', { quality: s.quality, qualityAuto: s.qualityAuto, reducedMotion: s.reducedMotion, view2D: s.view2D, introSeen: s.introSeen });
  }
});
