/**
 * Parameter-effect audit: renders the model with each alternative value of
 * every design parameter from a view that shows the part it should change,
 * and measures how many pixels differ from the first value. A value that
 * changes (almost) nothing is an inert control.
 *
 *   npm run build && npx vite preview --port 4317 &
 *   AUDIT_URL=http://localhost:4317/ node tests/audit/params.mjs
 *
 * AUDIT_ONLY (regular expression) limits the run to matching parameters.
 * Pairs flagged INERT (< 0.2 % of pixels changed) or SUBTLE (< 1 %) are saved
 * as A/B images to tests/audit/output/ for review.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright';

const BASE = process.env.AUDIT_URL ?? 'http://localhost:4317/';
const ONLY = process.env.AUDIT_ONLY ? new RegExp(process.env.AUDIT_ONLY) : null;
const OUT = new URL('./output/', import.meta.url).pathname;

/** the views the design tools frame (src/world/camera/views.ts) and the Green / City modules' own views */
const P = {
  aerial: { pos: [250, 135, 330], target: [0, 12, 0] },
  facade: { pos: [120, 30, 210], target: [0, 22, 80] },
  roof: { pos: [170, 140, 200], target: [0, 40, 0] },
  roofEdge: { pos: [60, 78, 190], target: [0, 36, -40] },
  structure: { pos: [150, 120, -180], target: [0, 40, 0] },
  plinth: { pos: [-150, 18, 200], target: [-40, 2, 100] },
  stands: { pos: [-60, 40, 30], target: [90, 24, -5] },
  plaza: { pos: [70, 60, 290], target: [0, 2, 165] },
  social: { pos: [-250, 60, 200], target: [-165, 2, 105] },
  museum: { pos: [235, 36, 205], target: [158, 8, 118] },
  eventLawn: { pos: [-280, 44, -20], target: [-178, 2, -60] },
  top: { pos: [0, 520, 60], target: [0, 0, 0] },
  solar: { pos: [90, 300, -330], target: [0, 20, -80] },
  rainwater: { pos: [-60, 90, 300], target: [0, 0, 170] },
  floods: { pos: [-30, 30, 20], target: [30, 40, -40] },
  pitch: { pos: [0, 70, 60], target: [0, 0, 0] },
  landscape: { pos: [280, 70, 60], target: [170, 0, -40] },
  waste: { pos: [70, 30, 190], target: [0, 0, 140] },
  transitLink: { pos: [220, 120, -260], target: [80, 0, -120] },
};

/** [parameter, view, time of day, values]: every value is compared with the first */
const CASES = [
  ['language', 'facade', 'day', ['heritage', 'iconic', 'minimal', 'futurist', 'organic']],
  ['roof.form', 'roof', 'day', ['current', 'halo', 'extended-canopy']],
  ['roof.light', 'roofEdge', 'night', ['none', 'subtle-rim', 'halo-ring', 'segmented', 'full-crown']],
  ['roof.ring', 'roofEdge', 'night', [0.55, 0.15, 0.95]],
  ['facade.lighting', 'facade', 'night', ['static', 'dynamic', 'media']],
  ['materials.facade', 'facade', 'day', ['brushed-metal', 'dark-metal', 'glass', 'composite', 'translucent', 'recycled', 'gold-metal']],
  ['materials.roof', 'roof', 'day', ['translucent', 'brushed-metal', 'dark-metal', 'composite', 'gold-metal']],
  ['materials.structure', 'structure', 'day', ['dark-metal', 'brushed-metal', 'concrete', 'recycled', 'gold-metal']],
  ['materials.plinth', 'plinth', 'day', ['concrete', 'dark-metal', 'glass', 'recycled']],
  ['screens.layout', 'stands', 'night', ['ribbon', 'standard', 'extended', 'media-facade']],
  ['seats.choreography', 'stands', 'day', ['stripes', 'none', 'halves', 'wave', 'stars', 'mosaic-2035']],
  ['palette.primary', 'aerial', 'night', ['#c8102e', '#1e5bd8']],
  ['palette.secondary', 'stands', 'night', ['#f2b631', '#3fbf8a']],
  ['palette.night', 'aerial', 'night', ['istanbul-blue', 'crimson', 'amber', 'neutral', 'emerald']],
  ['plaza.character', 'plaza', 'day', ['urban', 'park', 'event', 'garden']],
  ['plaza.social', 'social', 'day', ['expanded', 'current']],
  ['district.fanZone', 'plaza', 'day', [true, false]],
  ['district.museum', 'museum', 'day', [true, false]],
  ['district.eventLawn', 'eventLawn', 'day', [false, true]],
  ['district.transitHub', 'top', 'day', [true, false]],
  ['district.meetingPoints', 'plaza', 'day', [true, false]],
  ['green.solar', 'solar', 'day', ['existing', 'extended']],
  ['green.rainwater', 'rainwater', 'day', [false, true]],
  ['green.efficientLighting', 'floods', 'night', [true, false]],
  ['green.pitchCare', 'pitch', 'day', [false, true]],
  ['green.landscape', 'landscape', 'day', [true, false]],
  ['green.waste', 'waste', 'day', [false, true]],
  ['green.transitLink', 'transitLink', 'day', [true, false]],
  ['access.routes', 'top', 'day', [false, true]],
  ['access.servicePoints', 'top', 'day', [false, true]],
];

const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
let weak = 0;
try {
  await context.addInitScript(() => localStorage.setItem('aslan2035.prefs', JSON.stringify({ introSeen: true, quality: 'medium', qualityAuto: false })));
  const page = await context.newPage();
  page.setDefaultTimeout(180000);
  await page.goto(`${BASE}?e2e=1#/about`);
  await page.waitForFunction(() => window.__aslan?.worldApi.ready, null, { timeout: 180000 });
  for (const [key, view, env, values] of CASES) {
    if (ONLY && !ONLY.test(key)) continue;
    const rows = await page.evaluate(
      async ({ key, pose, env, values }) => {
        const a = window.__aslan;
        const shot = (cfg) => a.worldApi.capture({ preview: cfg, pose, env, width: 480, height: 300, mime: 'image/png' });
        const pixels = async (url) => {
          const img = new Image();
          img.src = url;
          await img.decode();
          const c = document.createElement('canvas');
          c.width = img.width;
          c.height = img.height;
          const g = c.getContext('2d');
          g.drawImage(img, 0, 0);
          return g.getImageData(0, 0, c.width, c.height).data;
        };
        const set = (d, k, v) => {
          const n = structuredClone(d);
          const parts = k.split('.');
          let cur = n;
          for (const p of parts.slice(0, -1)) cur = cur[p];
          cur[parts.at(-1)] = v;
          return n;
        };
        const base = set(a.useDesign.getState().design, key, values[0]);
        const ref = await shot(base);
        const da = ref && (await pixels(ref));
        const out = [];
        for (const v of values.slice(1)) {
          const img = await shot(set(base, key, v));
          if (!da || !img) {
            out.push({ v, error: 'capture failed' });
            continue;
          }
          const db = await pixels(img);
          let changed = 0;
          let sum = 0;
          for (let i = 0; i < da.length; i += 4) {
            const d = Math.abs(da[i] - db[i]) + Math.abs(da[i + 1] - db[i + 1]) + Math.abs(da[i + 2] - db[i + 2]);
            sum += d;
            if (d > 30) changed++;
          }
          const n = da.length / 4;
          out.push({ v, changed: changed / n, mean: sum / n / 3, ref, img });
        }
        return out;
      },
      { key, pose: P[view], env, values },
    );
    for (const r of rows) {
      const flag = r.error ? 'ERROR' : r.changed < 0.002 ? 'INERT' : r.changed < 0.01 ? 'SUBTLE' : 'ok';
      console.log(`${flag.padEnd(6)} ${key} = ${JSON.stringify(values[0])} → ${JSON.stringify(r.v)}  changed ${(100 * (r.changed ?? 0)).toFixed(2)}%  mean ${(r.mean ?? 0).toFixed(2)}${r.error ? ` ${r.error}` : ''}`);
      if (flag === 'INERT' || flag === 'SUBTLE') {
        weak++;
        mkdirSync(OUT, { recursive: true });
        const name = `${key}-${String(r.v).replace(/[^a-z0-9]+/gi, '_')}`;
        writeFileSync(`${OUT}${name}-A.png`, Buffer.from(r.ref.split(',')[1], 'base64'));
        writeFileSync(`${OUT}${name}-B.png`, Buffer.from(r.img.split(',')[1], 'base64'));
      }
    }
  }
} finally {
  await context.close();
  await browser.close();
}
console.log(`\n${weak} weak or inert value(s)`);
