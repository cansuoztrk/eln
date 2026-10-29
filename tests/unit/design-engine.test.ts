import { describe, expect, it } from 'vitest';
import { FACADE_LIGHTING, PLAZA_CHARACTERS, ROOF_FORMS, ROOF_LIGHTS, SCREEN_LAYOUTS, VISUAL_LANGUAGES, getAt, DEFAULT_DESIGN } from '@/core/model/design';
import { FIN_STYLES, finLayout } from '@/world/stadium/finStyles';
import { PARAM_GUIDE, paramHint } from '@/modules/dna/paramGuide';
import { VIEWS } from '@/world/camera/views';
import { QUESTIONS } from '@/modules/whatif/scenarios';
import * as THREE from 'three';
import { ribbonGeometry } from '@/world/stadium/ribbon';

describe('visual language drives the facade fins', () => {
  const signature = (lang: (typeof VISUAL_LANGUAGES)[number]) =>
    finLayout(lang, 220)
      .map((f) => [f.depth, f.width, f.yaw, f.drop].map((v) => v.toFixed(3)).join(','))
      .join('|');

  it('gives every language a different fin layout', () => {
    const all = VISUAL_LANGUAGES.map(signature);
    expect(new Set(all).size).toBe(VISUAL_LANGUAGES.length);
  });

  it('keeps heritage as the regular reference rhythm', () => {
    const fins = finLayout('heritage', 220);
    expect(fins).toHaveLength(220);
    expect(new Set(fins.map((f) => f.depth)).size).toBe(1);
    expect(fins.every((f) => f.yaw === 0 && f.drop === 0)).toBe(true);
  });

  it('articulates the others: minimal halves the rhythm, futurist turns, organic waves the top', () => {
    expect(finLayout('minimal', 220)).toHaveLength(110);
    const fut = finLayout('futurist', 220).map((f) => f.yaw);
    expect(Math.max(...fut) - Math.min(...fut)).toBeGreaterThan(1);
    const org = finLayout('organic', 220).map((f) => f.drop);
    expect(Math.max(...org)).toBeGreaterThan(6);
    expect(Math.min(...org)).toBeLessThan(0.5);
  });

  it('keeps fins inside sane physical bounds', () => {
    for (const lang of VISUAL_LANGUAGES) {
      expect(FIN_STYLES[lang].density).toBeGreaterThan(0);
      for (const f of finLayout(lang, 220)) {
        expect(f.depth).toBeGreaterThan(0.5);
        expect(f.depth).toBeLessThan(4);
        expect(Math.abs(f.yaw)).toBeLessThan(Math.PI / 2);
        expect(f.drop).toBeGreaterThanOrEqual(0);
        expect(f.drop).toBeLessThan(10);
      }
    }
  });
});

describe('DNA parameter guide', () => {
  const enums: [string, readonly string[]][] = [
    ['language', VISUAL_LANGUAGES],
    ['roof.form', ROOF_FORMS],
    ['roof.light', ROOF_LIGHTS],
    ['facade.lighting', FACADE_LIGHTING],
    ['screens.layout', SCREEN_LAYOUTS],
    ['plaza.character', PLAZA_CHARACTERS],
    ['plaza.social', ['current', 'expanded']],
  ];

  it('explains every value of every enumerated parameter', () => {
    for (const [key, values] of enums) {
      for (const v of values) expect(PARAM_GUIDE[key].values?.[v], `${key}=${v}`).toBeTruthy();
    }
  });

  it('points every parameter at an existing camera view', () => {
    for (const [key, g] of Object.entries(PARAM_GUIDE)) expect(VIEWS[g.view], key).toBeDefined();
  });

  it('marks the lighting parameters as night views', () => {
    for (const key of ['roof.light', 'roof.ring', 'facade.lighting', 'palette.night']) expect(PARAM_GUIDE[key].night, key).toBe(true);
  });

  it('describes the current value and falls back to the parameter note', () => {
    expect(paramHint('language', getAt(DEFAULT_DESIGN, 'language'))).toBe(PARAM_GUIDE.language.values?.heritage);
    expect(paramHint('roof.ring', 0.4)).toBe(PARAM_GUIDE['roof.ring'].note);
    expect(paramHint('unknown.key', 'x')).toBeUndefined();
  });
});

describe('What-If comparisons are taken in the light they are about', () => {
  it('captures the match-night question at night and the roof question at dusk', () => {
    expect(QUESTIONS.find((q) => q.id === 'night')?.env).toBe('night');
    expect(QUESTIONS.find((q) => q.id === 'roof')?.env).toBe('dusk');
  });
});

describe('ground ribbons (routes, paths, swales)', () => {
  it('face up so they are drawn when seen from above, whichever way the path runs', () => {
    const paths = [
      [new THREE.Vector3(0, 0, 0), new THREE.Vector3(10, 0, 0), new THREE.Vector3(20, 0, 5)],
      [new THREE.Vector3(0, 0, 0), new THREE.Vector3(-5, 0, -10), new THREE.Vector3(-20, 0, -12)],
    ];
    for (const pts of paths) {
      const g = ribbonGeometry(pts, 3);
      const pos = g.getAttribute('position');
      const idx = g.getIndex()!;
      const v = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];
      for (let i = 0; i < idx.count; i += 3) {
        v.forEach((p, j) => p.fromBufferAttribute(pos, idx.getX(i + j)));
        const n = new THREE.Vector3().subVectors(v[1], v[0]).cross(new THREE.Vector3().subVectors(v[2], v[0]));
        expect(n.y).toBeGreaterThan(0);
      }
    }
  });
});

describe('NaN-safe bump mapping', () => {
  it('patches the three.js bump map chunk so a degenerate pixel keeps its normal', async () => {
    const THREE_ = await import('three');
    await import('@/world/shaderFixes');
    const chunk = THREE_.ShaderChunk.bumpmap_pars_fragment;
    expect(chunk).toContain('return surf_norm;');
    expect(chunk).not.toMatch(/return normalize\( abs\( fDet \) \* surf_norm - vGrad \);/);
  });
});
