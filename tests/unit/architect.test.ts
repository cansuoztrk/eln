import { describe, expect, it } from 'vitest';
import { DEFAULT_DESIGN, applyPatch, diffDesigns } from '@/core/model/design';
import { EXAMPLES, interpret, normalize } from '@/modules/architect/engine';
// @ts-expect-error -- plain ESM module without type declarations
import { PARAMETERS } from '../../server/schema.mjs';
import { CHOREOGRAPHIES, DNA_IDS, FACADE_LIGHTING, LED_MODES, NIGHT_TINTS, PLAZA_CHARACTERS, ROOF_FORMS, ROOF_LIGHTS, SCREEN_LAYOUTS, SHOW_PRESET_IDS, SHOW_PROFILES, SOLAR_MODES, VISUAL_LANGUAGES } from '@/core/model/design';
import { materialsFor } from '@/core/model/materials';

const ctx = { design: DEFAULT_DESIGN, locks: [] as string[], previous: null, archive: [] };

describe('normalize', () => {
  it('folds Turkish characters and case', () => {
    expect(normalize('Çatı IŞIKLARINI İnce yap!')).toBe('cati isiklarini ince yap');
  });
});

describe('rule-based AI Architect', () => {
  it('understands every example prompt from the brief', () => {
    for (const ex of EXAMPLES) {
      const r = interpret(ex, ctx);
      expect(r.help, ex).not.toBe(true);
      expect(r.understood.length, ex).toBeGreaterThan(0);
    }
  });

  it('makes roof lights minimal', () => {
    const r = interpret('Çatı ışıklarını daha minimal yap.', ctx);
    const after = applyPatch(DEFAULT_DESIGN, r.patch!);
    expect(after.roof.light).toBe('subtle-rim');
    expect(after.roof.ring).toBeLessThan(DEFAULT_DESIGN.roof.ring);
  });

  it('greens the plaza without repainting the palette green', () => {
    const r = interpret('Çevre meydanını daha yeşil bir tasarımla yeniden düzenle.', ctx);
    const after = applyPatch(DEFAULT_DESIGN, r.patch!);
    expect(after.plaza.character).toBe('garden');
    expect(after.green.landscape).toBe(true);
    expect(after.palette.primary).toBe(DEFAULT_DESIGN.palette.primary);
  });

  it('answers risk questions without changing the design', () => {
    const r = interpret('Bu tasarımın teknik risklerini açıkla.', ctx);
    expect(r.patch).toBeNull();
    expect(r.analysis?.length).toBeGreaterThan(0);
  });

  it('refuses out-of-scope structural requests honestly', () => {
    const r = interpret('Kapasiteyi 80 bin yap ve açılır çatı ekle', ctx);
    expect(r.outOfScope?.length).toBe(2);
    expect(r.patch).toBeNull();
  });

  it('reports locked keys that could not change', () => {
    const r = interpret('Çatı ışıklarını daha minimal yap.', { ...ctx, locks: ['roof.light'] });
    expect(r.constraints.join(' ')).toContain('roof.light');
    const after = applyPatch(DEFAULT_DESIGN, r.patch!, new Set(['roof.light']));
    expect(after.roof.light).toBe(DEFAULT_DESIGN.roof.light);
  });

  it('sets explicit palette colours', () => {
    const r = interpret('Ana renk mor, ikinci renk beyaz olsun', ctx);
    const after = applyPatch(DEFAULT_DESIGN, r.patch!);
    expect(diffDesigns(DEFAULT_DESIGN, after).map((d) => d.key)).toEqual(['palette.primary', 'palette.secondary']);
  });

  it('falls back to help for unknown requests', () => {
    expect(interpret('merhaba nasılsın', ctx).help).toBe(true);
  });
});

describe('server schema stays in sync with the design model', () => {
  const same = (a: readonly string[], b: readonly string[]) => expect([...a].sort()).toEqual([...b].sort());
  it('enumerations match', () => {
    same(PARAMETERS['dna'], [...DNA_IDS, 'custom']);
    same(PARAMETERS['language'], VISUAL_LANGUAGES);
    same(PARAMETERS['roof.form'], ROOF_FORMS);
    same(PARAMETERS['roof.light'], ROOF_LIGHTS);
    same(PARAMETERS['facade.lighting'], FACADE_LIGHTING);
    same(PARAMETERS['screens.layout'], SCREEN_LAYOUTS);
    same(PARAMETERS['seats.choreography'], CHOREOGRAPHIES);
    same(PARAMETERS['palette.night'], NIGHT_TINTS);
    same(PARAMETERS['plaza.character'], PLAZA_CHARACTERS);
    same(PARAMETERS['green.solar'], SOLAR_MODES);
    same(PARAMETERS['show.preset'], [...SHOW_PRESET_IDS, 'custom']);
    same(PARAMETERS['show.led'], LED_MODES);
    same(PARAMETERS['show.profile'], SHOW_PROFILES);
    for (const t of ['facade', 'roof', 'structure', 'plinth'] as const)
      same(
        PARAMETERS[`materials.${t}`],
        materialsFor(t).map((m) => m.id),
      );
  });
});
