import { create } from 'zustand';
import {
  DEFAULT_DESIGN,
  applyPatch,
  cloneDesign,
  setAt,
  type DesignConfig,
  type DesignPatch,
  type DnaId,
} from '../model/design';
import { DNA_BY_ID } from '../model/dna';
import { sanitizeDesign } from '../model/sanitize';
import { readJSON, writeJSON } from '../storage';

export interface HistoryEntry {
  id: string;
  label: string;
  at: number;
  design: DesignConfig;
}

interface DesignState {
  design: DesignConfig;
  locks: string[];
  past: HistoryEntry[];
  future: HistoryEntry[];
  /** label of the most recent change, for screen-reader announcements */
  lastChange: string;
  setDesign: (next: DesignConfig, label: string) => void;
  patch: (patch: DesignPatch, label: string, opts?: { respectLocks?: boolean }) => void;
  setKey: (key: string, value: unknown, label: string) => void;
  applyDna: (id: DnaId) => void;
  undo: () => void;
  redo: () => void;
  revertTo: (entryId: string) => void;
  toggleLock: (key: string) => void;
}

const HISTORY_LIMIT = 60;
let seq = 0;
const newId = () => `${Date.now().toString(36)}-${(seq++).toString(36)}`;

function loadInitial(): { design: DesignConfig; locks: string[] } {
  const saved = readJSON<{ design: unknown; locks: unknown }>('current');
  if (!saved) return { design: cloneDesign(DEFAULT_DESIGN), locks: [] };
  const { config } = sanitizeDesign(saved.design);
  const locks = Array.isArray(saved.locks) ? saved.locks.filter((x): x is string => typeof x === 'string').slice(0, 40) : [];
  return { design: config, locks };
}

const initial = typeof window !== 'undefined' ? loadInitial() : { design: cloneDesign(DEFAULT_DESIGN), locks: [] };

export const useDesign = create<DesignState>()((set, get) => {
  const commit = (next: DesignConfig, label: string) => {
    const { design, past } = get();
    if (JSON.stringify(next) === JSON.stringify(design)) return;
    const entry: HistoryEntry = { id: newId(), label, at: Date.now(), design };
    set({ design: next, past: [...past, entry].slice(-HISTORY_LIMIT), future: [], lastChange: label });
  };
  return {
    design: initial.design,
    locks: initial.locks,
    past: [],
    future: [],
    lastChange: '',
    setDesign: (next, label) => commit(cloneDesign(next), label),
    patch: (patch, label, opts) => {
      const locked = opts?.respectLocks === false ? new Set<string>() : new Set(get().locks);
      commit(applyPatch(get().design, patch, locked), label);
    },
    setKey: (key, value, label) => commit(setAt(get().design, key, value), label),
    applyDna: (id) => {
      const preset = DNA_BY_ID[id];
      const locked = new Set(get().locks);
      commit(applyPatch(get().design, preset.patch, locked), `DNA: ${preset.name}`);
    },
    undo: () => {
      const { past, design, future } = get();
      const prev = past[past.length - 1];
      if (!prev) return;
      set({
        design: prev.design,
        past: past.slice(0, -1),
        future: [{ id: newId(), label: prev.label, at: Date.now(), design }, ...future].slice(0, HISTORY_LIMIT),
        lastChange: `Geri alındı: ${prev.label}`,
      });
    },
    redo: () => {
      const { past, design, future } = get();
      const next = future[0];
      if (!next) return;
      set({
        design: next.design,
        future: future.slice(1),
        past: [...past, { id: newId(), label: next.label, at: Date.now(), design }].slice(-HISTORY_LIMIT),
        lastChange: `Yinelendi: ${next.label}`,
      });
    },
    revertTo: (entryId) => {
      const entry = get().past.find((e) => e.id === entryId);
      if (entry) commit(cloneDesign(entry.design), `Sürüme dönüldü: ${entry.label}`);
    },
    toggleLock: (key) => {
      const locks = get().locks;
      const next = locks.includes(key) ? locks.filter((k) => k !== key) : [...locks, key];
      set({ locks: next });
    },
  };
});

/* Autosave current design so work survives reloads (debounced). */
let saveTimer: ReturnType<typeof setTimeout> | undefined;
export let lastAutosaveError: string | null = null;
useDesign.subscribe((s, prev) => {
  if (s.design === prev.design && s.locks === prev.locks) return;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    const r = writeJSON('current', { design: s.design, locks: s.locks });
    lastAutosaveError = r.ok ? null : r.reason;
  }, 400);
});

/** Number of parameters that differ from the active DNA preset. */
export function customizationCount(d: DesignConfig): number {
  if (d.dna === 'custom') return 0;
  const preset = DNA_BY_ID[d.dna];
  const applied = applyPatch(d, preset.patch);
  let n = 0;
  const walk = (a: unknown, b: unknown) => {
    if (a && typeof a === 'object' && !Array.isArray(a)) {
      for (const k of Object.keys(a as object)) walk((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k]);
    } else if (JSON.stringify(a) !== JSON.stringify(b)) n++;
  };
  walk(applied, d);
  return n;
}
