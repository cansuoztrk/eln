import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { LAYER_IDS, LAYER_PARTS, LAYER_ZONES } from '@/core/layers';
import { componentInfo } from '@/content/components';

const WORLD = new URL('../../src/world/', import.meta.url).pathname;

function sources(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? sources(join(dir, e.name)) : e.name.endsWith('.tsx') ? [readFileSync(join(dir, e.name), 'utf8')] : []));
}

const selectableIds = [...new Set(sources(WORLD).flatMap((src) => [...src.matchAll(/<Selectable id="([^"]+)"/g)].map((m) => m[1])))];
const listedParts = Object.values(LAYER_PARTS).flat();

describe('component browser stays in sync with the 3D scene', () => {
  it('lists every selectable part of the scene exactly once', () => {
    expect(selectableIds.length).toBeGreaterThan(10);
    expect([...selectableIds].sort()).toEqual([...listedParts].sort());
    expect(new Set(listedParts).size).toBe(listedParts.length);
  });

  it('places every layer in exactly one zone', () => {
    const zoned = LAYER_ZONES.flatMap((z) => z.layers);
    expect([...zoned].sort()).toEqual([...LAYER_IDS].sort());
  });

  it('has Object Inspector content for every layer and part', () => {
    for (const id of [...LAYER_IDS, ...listedParts]) expect(componentInfo(id).name, id).not.toBe(id);
  });
});
