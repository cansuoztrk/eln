/**
 * Optional remote AI engine. Only active when VITE_ARCHITECT_ENDPOINT is set
 * at build time and points to a server you run (see server/README.md).
 * The API key lives on that server; the browser never sees it. Every value
 * returned by the server is re-validated here before it touches the design.
 */
import { flatten, setAt, type DesignConfig, type DesignPatch } from '@/core/model/design';
import { sanitizeDesign } from '@/core/model/sanitize';
import type { ArchitectResponse } from './engine';

export const REMOTE_ENDPOINT: string | undefined = import.meta.env.VITE_ARCHITECT_ENDPOINT || undefined;

interface RemoteChange {
  key: string;
  value: string;
  reason?: string;
}

interface RemoteBody {
  understood?: unknown;
  changes?: unknown;
  explanation?: unknown;
  unknowns?: unknown;
  constraints?: unknown;
  outOfScope?: unknown;
}

const strList = (v: unknown, max = 8) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string').map((x) => x.slice(0, 400)).slice(0, max) : []);

/** Convert remote string values to the type of the existing leaf. */
function coerce(current: unknown, raw: string): unknown {
  if (typeof current === 'boolean') return raw === 'true';
  if (typeof current === 'number') return Number(raw);
  return raw;
}

export async function interpretRemote(message: string, design: DesignConfig, locks: string[], signal?: AbortSignal): Promise<ArchitectResponse> {
  if (!REMOTE_ENDPOINT) throw new Error('Uzak AI motoru yapılandırılmamış.');
  const res = await fetch(REMOTE_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: message.slice(0, 600), design, locks }),
    signal,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(res.status === 429 ? 'Çok fazla istek; biraz sonra tekrar deneyin.' : `Sunucu hatası (${res.status}) ${text.slice(0, 120)}`);
  }
  const body = (await res.json()) as RemoteBody;
  const leaves = flatten(design);
  const changes = (Array.isArray(body.changes) ? body.changes : []).slice(0, 20) as RemoteChange[];
  let next = design;
  const rejected: string[] = [];
  for (const c of changes) {
    if (!c || typeof c.key !== 'string' || typeof c.value !== 'string' || !(c.key in leaves) || c.key.startsWith('show.sequence') || c.key === 'v') {
      rejected.push(String(c?.key));
      continue;
    }
    if (locks.includes(c.key)) {
      rejected.push(`${c.key} (kilitli)`);
      continue;
    }
    next = setAt(next, c.key, coerce(leaves[c.key], c.value));
  }
  const { config, warnings } = sanitizeDesign(next);
  const constraints = strList(body.constraints);
  if (rejected.length) constraints.push(`Uygulanmayan öneriler: ${rejected.join(', ')}.`);
  if (warnings.length) constraints.push(`${warnings.length} geçersiz değer reddedildi.`);
  constraints.push('AI Architect teknik mühendislik onayı yerine geçmez.');
  // express the validated result as a full patch of changed top-level groups
  const patch: DesignPatch = {};
  for (const [k, v] of Object.entries(config)) if (JSON.stringify(v) !== JSON.stringify((design as unknown as Record<string, unknown>)[k])) (patch as Record<string, unknown>)[k] = v;
  return {
    engine: 'remote',
    understood: strList(body.understood),
    patch: Object.keys(patch).length ? patch : null,
    view: {},
    explanation: strList(body.explanation),
    unknowns: strList(body.unknowns),
    constraints,
    outOfScope: strList(body.outOfScope),
  };
}
