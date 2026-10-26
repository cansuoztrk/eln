import { describe, expect, it } from 'vitest';
import { DEFAULT_DESIGN, applyPatch, cloneDesign, diffDesigns, getAt, setAt, CURRENT_REFERENCE } from '@/core/model/design';
import { decodeDesign, encodeDesign, sanitizeDesign, MAX_SHARE_LENGTH } from '@/core/model/sanitize';
import { DNA_PRESETS } from '@/core/model/dna';
import { evaluateRules } from '@/core/model/rules';
import { PHASES, derivePhaseConfig } from '@/core/model/phases';
import { MAX_SHOW_HZ, speedToHz } from '@/core/model/lightshow';
import { MATERIALS } from '@/core/model/materials';

describe('sanitizeDesign', () => {
  it('returns the default design for garbage input', () => {
    const { config } = sanitizeDesign('nope');
    expect(config).toEqual(DEFAULT_DESIGN);
  });

  it('keeps valid values and rejects invalid ones with warnings', () => {
    const input = setAt(setAt(DEFAULT_DESIGN, 'roof.light', 'full-crown'), 'palette.primary', '#ABCDEF') as unknown as Record<string, unknown>;
    (input.roof as Record<string, unknown>).form = 'flying-saucer';
    (input.palette as Record<string, unknown>).secondary = 'javascript:alert(1)';
    (input.roof as Record<string, unknown>).ring = 7;
    const { config, warnings } = sanitizeDesign(input);
    expect(config.roof.light).toBe('full-crown');
    expect(config.palette.primary).toBe('#abcdef');
    expect(config.roof.form).toBe(DEFAULT_DESIGN.roof.form);
    expect(config.palette.secondary).toBe(DEFAULT_DESIGN.palette.secondary);
    expect(config.roof.ring).toBe(1);
    expect(warnings.length).toBe(2);
  });

  it('drops unknown keys and caps the show sequence', () => {
    const raw = { ...cloneDesign(DEFAULT_DESIGN), evil: '<script>', show: { ...DEFAULT_DESIGN.show, sequence: Array.from({ length: 40 }, (_, i) => ({ id: `x${i}`, preset: 'roar', duration: 999 })) } };
    const { config } = sanitizeDesign(raw);
    expect('evil' in config).toBe(false);
    expect(config.show.sequence).toHaveLength(12);
    expect(config.show.sequence[0].duration).toBe(60);
  });
});

describe('share links', () => {
  it('round-trips a design through the base64url encoding', () => {
    const d = setAt(DEFAULT_DESIGN, 'seats.choreography', 'mosaic-2035');
    const enc = encodeDesign(d);
    expect(enc).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(enc.length).toBeLessThan(MAX_SHARE_LENGTH);
    expect(decodeDesign(enc).config).toEqual(d);
  });

  it('rejects malformed or oversized links', () => {
    expect(() => decodeDesign('not base64!')).toThrow();
    expect(() => decodeDesign('a'.repeat(MAX_SHARE_LENGTH + 1))).toThrow();
  });
});

describe('patches, locks and diffs', () => {
  it('respects locked keys when applying a DNA preset', () => {
    const red = DNA_PRESETS.find((p) => p.id === 'redgold')!;
    const out = applyPatch(DEFAULT_DESIGN, red.patch, new Set(['materials.facade', 'roof.ring']));
    expect(out.materials.facade).toBe(DEFAULT_DESIGN.materials.facade);
    expect(out.roof.ring).toBe(DEFAULT_DESIGN.roof.ring);
    expect(out.roof.light).toBe('full-crown');
    expect(out.dna).toBe('redgold');
  });

  it('computes leaf-level diffs', () => {
    const b = setAt(setAt(DEFAULT_DESIGN, 'roof.ring', 0.1), 'green.waste', true);
    const keys = diffDesigns(DEFAULT_DESIGN, b).map((d) => d.key);
    expect(keys).toEqual(['green.waste', 'roof.ring']);
    expect(getAt(b, 'roof.ring')).toBe(0.1);
  });

  it('every DNA preset produces a valid design', () => {
    for (const p of DNA_PRESETS) {
      const d = applyPatch(DEFAULT_DESIGN, p.patch);
      expect(sanitizeDesign(d).warnings).toEqual([]);
    }
  });
});

describe('design rules', () => {
  it('flags minimal language with a media facade and offers fixes', () => {
    const d = applyPatch(DEFAULT_DESIGN, { language: 'minimal', screens: { layout: 'media-facade' } });
    const f = evaluateRules(d).find((x) => x.id === 'minimal-vs-intense');
    expect(f?.severity).toBe('conflict');
    const fixed = applyPatch(d, f!.suggestions[0].patch);
    expect(evaluateRules(fixed).some((x) => x.id === 'minimal-vs-intense')).toBe(false);
  });

  it('marks the extended canopy as an engineering scenario', () => {
    const d = applyPatch(DEFAULT_DESIGN, { roof: { form: 'extended-canopy' } });
    expect(evaluateRules(d).some((x) => x.id === 'canopy-engineering' && x.severity === 'engineering')).toBe(true);
  });

  it('the default design has no conflicts', () => {
    expect(evaluateRules(DEFAULT_DESIGN).filter((f) => f.severity === 'conflict')).toEqual([]);
  });
});

describe('time machine', () => {
  const vision = applyPatch(DEFAULT_DESIGN, DNA_PRESETS.find((p) => p.id === 'future')!.patch);
  it('phase 0 is the current reference', () => {
    expect(derivePhaseConfig(vision, 0)).toEqual(CURRENT_REFERENCE);
  });
  it('phase 1 only changes lighting and screens (no roof form, no media facade)', () => {
    const p1 = derivePhaseConfig(vision, 1);
    expect(p1.roof.form).toBe('current');
    expect(p1.screens.layout).not.toBe('media-facade');
    expect(p1.roof.light).toBe(vision.roof.light);
    expect(p1.plaza).toEqual(CURRENT_REFERENCE.plaza);
  });
  it('the last phase is the full design and is flagged for engineering', () => {
    expect(derivePhaseConfig(vision, 4)).toEqual(vision);
    expect(PHASES[4].engineering).toBe(true);
  });
});

describe('light show safety', () => {
  it('caps the modulation frequency and stops animation with reduced motion', () => {
    expect(speedToHz(1, false)).toBeLessThanOrEqual(MAX_SHOW_HZ);
    expect(speedToHz(5, false)).toBeLessThanOrEqual(MAX_SHOW_HZ);
    expect(MAX_SHOW_HZ).toBeLessThan(3);
    expect(speedToHz(1, true)).toBe(0);
  });
});

describe('material catalogue', () => {
  it('does not contain unverified performance numbers', () => {
    const text = JSON.stringify(MATERIALS);
    expect(text).not.toMatch(/\d+\s?(TL|€|\$|USD|kWh|dakika yangın|REI|EI\d)/i);
  });
});
