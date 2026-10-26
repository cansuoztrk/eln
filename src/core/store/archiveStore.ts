/**
 * Design Archive: named designs with version history, stored locally in
 * this browser only (no account, no server sync).
 */
import { create } from 'zustand';
import type { DesignConfig } from '../model/design';
import { sanitizeDesign } from '../model/sanitize';
import { readJSON, storageMessage, writeJSON } from '../storage';

export interface ArchiveVersion {
  id: string;
  at: number;
  config: DesignConfig;
  thumb: string | null;
  note?: string;
}

export interface ArchiveEntry {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  versions: ArchiveVersion[];
}

interface ArchiveState {
  entries: ArchiveEntry[];
  error: string | null;
  save: (name: string, config: DesignConfig, thumb: string | null) => ArchiveEntry;
  addVersion: (id: string, config: DesignConfig, thumb: string | null, note?: string) => void;
  rename: (id: string, name: string) => void;
  remove: (id: string) => void;
  removeVersion: (id: string, versionId: string) => void;
  importEntries: (raw: unknown) => number;
}

const KEY = 'archive.v1';
const uid = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

function load(): ArchiveEntry[] {
  const raw = readJSON<unknown>(KEY);
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((e) => {
    const x = e as Partial<ArchiveEntry>;
    if (typeof x?.id !== 'string' || typeof x.name !== 'string' || !Array.isArray(x.versions)) return [];
    const versions = x.versions.flatMap((v) => {
      const vv = v as Partial<ArchiveVersion>;
      if (typeof vv?.id !== 'string') return [];
      return [
        {
          id: vv.id,
          at: typeof vv.at === 'number' ? vv.at : Date.now(),
          config: sanitizeDesign(vv.config).config,
          thumb: typeof vv.thumb === 'string' && vv.thumb.startsWith('data:image/') ? vv.thumb : null,
          note: typeof vv.note === 'string' ? vv.note.slice(0, 120) : undefined,
        },
      ];
    });
    if (!versions.length) return [];
    return [{ id: x.id, name: x.name.slice(0, 80), createdAt: x.createdAt ?? Date.now(), updatedAt: x.updatedAt ?? Date.now(), versions }];
  });
}

export const useArchive = create<ArchiveState>()((set, get) => {
  const persist = (entries: ArchiveEntry[]) => {
    const r = writeJSON(KEY, entries);
    set({ entries, error: storageMessage(r) });
  };
  return {
    entries: typeof window !== 'undefined' ? load() : [],
    error: null,
    save: (name, config, thumb) => {
      const now = Date.now();
      const entry: ArchiveEntry = {
        id: uid(),
        name: name.trim().slice(0, 80) || 'Adsız tasarım',
        createdAt: now,
        updatedAt: now,
        versions: [{ id: uid(), at: now, config: structuredClone(config), thumb }],
      };
      persist([entry, ...get().entries]);
      return entry;
    },
    addVersion: (id, config, thumb, note) => {
      const now = Date.now();
      persist(
        get().entries.map((e) =>
          e.id === id ? { ...e, updatedAt: now, versions: [{ id: uid(), at: now, config: structuredClone(config), thumb, note }, ...e.versions].slice(0, 20) } : e,
        ),
      );
    },
    rename: (id, name) => persist(get().entries.map((e) => (e.id === id ? { ...e, name: name.trim().slice(0, 80) || e.name } : e))),
    remove: (id) => persist(get().entries.filter((e) => e.id !== id)),
    removeVersion: (id, versionId) =>
      persist(
        get()
          .entries.map((e) => (e.id === id ? { ...e, versions: e.versions.filter((v) => v.id !== versionId) } : e))
          .filter((e) => e.versions.length > 0),
      ),
    importEntries: (raw) => {
      const list = Array.isArray(raw) ? raw : [raw];
      let n = 0;
      const added: ArchiveEntry[] = [];
      for (const item of list.slice(0, 50)) {
        const it = item as { name?: unknown; config?: unknown };
        const cfg = it && typeof it === 'object' && 'config' in it ? it.config : item;
        const { config } = sanitizeDesign(cfg);
        const now = Date.now();
        added.push({
          id: uid(),
          name: typeof it?.name === 'string' ? it.name.slice(0, 80) : `İçe aktarılan tasarım ${n + 1}`,
          createdAt: now,
          updatedAt: now,
          versions: [{ id: uid(), at: now, config, thumb: null, note: 'İçe aktarıldı' }],
        });
        n++;
      }
      persist([...added, ...get().entries]);
      return n;
    },
  };
});
