/** Minimal hash router: #/module?key=value */
import { useSyncExternalStore } from 'react';
import { MODULE_IDS, type ModuleId } from './modules';

export interface Route {
  module: ModuleId;
  params: URLSearchParams;
}

function parse(hash: string): Route {
  const clean = hash.replace(/^#\/?/, '');
  const [path, query = ''] = clean.split('?');
  const id = (path || 'home') as ModuleId;
  return { module: (MODULE_IDS as readonly string[]).includes(id) ? id : 'home', params: new URLSearchParams(query) };
}

let current = typeof window !== 'undefined' ? parse(window.location.hash) : parse('');
const listeners = new Set<() => void>();

if (typeof window !== 'undefined') {
  window.addEventListener('hashchange', () => {
    current = parse(window.location.hash);
    listeners.forEach((l) => l());
  });
}

export function useRoute(): Route {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => current,
  );
}

export function navigate(module: ModuleId, params?: Record<string, string>) {
  const q = params ? `?${new URLSearchParams(params).toString()}` : '';
  const next = `#/${module === 'home' ? '' : module}${q}`;
  if (window.location.hash !== next) window.location.hash = next;
}

/** Remove query params from the current hash without adding history entries. */
export function clearParams() {
  const r = parse(window.location.hash);
  history.replaceState(null, '', `#/${r.module === 'home' ? '' : r.module}`);
  current = parse(window.location.hash);
  listeners.forEach((l) => l());
}

export function shareUrl(module: ModuleId, params: Record<string, string>) {
  const base = window.location.href.split('#')[0];
  return `${base}#/${module === 'home' ? '' : module}?${new URLSearchParams(params).toString()}`;
}
