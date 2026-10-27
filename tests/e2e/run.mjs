/**
 * End-to-end interaction tests (Playwright, software WebGL).
 *
 *   npm run build && npm run test:e2e
 *
 * Starts `vite preview`, drives the real UI and asserts the resulting
 * application state through the test hook exposed with `?e2e=1`.
 * Set E2E_URL to test an already running server instead, E2E_ONLY to a
 * regular expression to run only the matching tests, and E2E_TIMEOUT_SCALE
 * (default 3) to stretch every timeout on slow software rendering.
 */
import { spawn } from 'node:child_process';
import { mkdirSync, existsSync } from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';
import { chromium } from 'playwright';

const PORT = 4317;
const BASE = process.env.E2E_URL ?? `http://localhost:${PORT}/`;
const OUT = new URL('./output/', import.meta.url).pathname;
const ONLY = process.env.E2E_ONLY ? new RegExp(process.env.E2E_ONLY, 'i') : null;
/** timeout multiplier: headless Chromium draws WebGL on the CPU (SwiftShader), which can take seconds per frame */
const SCALE = Number(process.env.E2E_TIMEOUT_SCALE ?? 3);
const T = (ms) => ms * SCALE;
mkdirSync(OUT, { recursive: true });

if (!process.env.E2E_URL && !existsSync(new URL('../../dist/index.html', import.meta.url))) {
  console.error('dist/ not found — run `npm run build` first.');
  process.exit(1);
}

let server;
if (!process.env.E2E_URL) {
  server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { stdio: 'pipe', cwd: new URL('../../', import.meta.url).pathname });
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(BASE);
      if (r.ok) break;
    } catch {
      /* not up yet */
    }
    await sleep(500);
  }
}

const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });

const results = [];
const pageErrors = [];
/** every open browser context; a test closes the ones it opened even when it fails */
const contexts = new Set();

async function newPage({ viewport = { width: 1440, height: 900 }, prefs = { introSeen: true, quality: 'low', qualityAuto: false }, hash = '#/', hasTouch = false, clearStorage = true } = {}) {
  const context = await browser.newContext({ viewport, hasTouch, acceptDownloads: true, permissions: ['clipboard-read', 'clipboard-write'] });
  contexts.add(context);
  context.on('close', () => contexts.delete(context));
  context.setDefaultTimeout(T(30000));
  await context.addInitScript(
    ({ prefs, clearStorage }) => {
      try {
        if (!sessionStorage.getItem('e2e-init')) {
          if (clearStorage) localStorage.clear();
          if (prefs) localStorage.setItem('aslan2035.prefs', JSON.stringify(prefs));
          sessionStorage.setItem('e2e-init', '1');
        }
      } catch {
        /* storage unavailable */
      }
    },
    { prefs, clearStorage },
  );
  const page = await context.newPage();
  page.on('pageerror', (e) => pageErrors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') pageErrors.push(m.text());
  });
  await page.goto(`${BASE}?e2e=1${hash}`);
  await page.waitForFunction(() => window.__aslan, null, { timeout: T(30000) });
  return page;
}

async function test(name, fn) {
  if (ONLY && !ONLY.test(name)) return;
  const t0 = Date.now();
  const before = new Set(contexts);
  try {
    await fn();
    results.push({ name, ok: true, ms: Date.now() - t0 });
    console.log(`  ✔ ${name} (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
  } catch (e) {
    results.push({ name, ok: false, ms: Date.now() - t0, error: e.message });
    console.log(`  ✘ ${name}\n      ${e.message.split('\n')[0]}`);
  } finally {
    // a page left open by a failed test keeps rendering and slows every later test
    for (const c of contexts) if (!before.has(c)) await c.close().catch(() => {});
  }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

const view = (page) => page.evaluate(() => {
  const s = window.__aslan.useView.getState();
  return { module: s.module, cameraMode: s.cameraMode, poi: s.poi, layers: s.layers, exploded: s.exploded, section: s.section, selected: s.selected, highlight: s.highlight, previewLabel: s.previewLabel, hasPreview: !!s.preview, atmosphere: s.atmosphere, occupancy: s.occupancy, soundOn: s.soundOn, view2D: s.view2D, reducedMotion: s.reducedMotion, introPlaying: s.introPlaying, crowdIn3D: s.crowdIn3D, env: s.env, capturing: s.capturing };
});
const design = (page) => page.evaluate(() => window.__aslan.useDesign.getState().design);
const go = async (page, hash) => {
  await page.evaluate((h) => (location.hash = h), hash);
  await page.waitForTimeout(400);
};
async function until(page, fn, arg, timeout = 15000) {
  await page.waitForFunction(fn, arg, { timeout: T(timeout), polling: 200 });
}
const worldReady = (page) => until(page, () => window.__aslan.worldApi.ready, null, 40000);
const btn = (page, name, exact = false) => page.getByRole('button', { name, exact }).first();
const canonical = (o) => JSON.stringify(o, (k, v) => (v && typeof v === 'object' && !Array.isArray(v) ? Object.fromEntries(Object.entries(v).sort(([a], [b]) => a.localeCompare(b))) : v));

/* ======================= Desktop session ======================= */
console.log('\nDesktop session');
const page = await newPage();
await worldReady(page);

await test('home: hero shows title, slogan and 5 working CTAs', async () => {
  await page.getByRole('heading', { name: /ASLAN 2035/ }).waitFor();
  const labels = ['ENTER THE STADIUM', 'START DESIGNING', 'EXPLORE THE MASTERPLAN', 'ENTER MATCHDAY MODE', 'VIEW THE FUTURE'];
  const targets = ['explore', 'design', 'city', 'matchday', 'time'];
  for (let i = 0; i < labels.length; i++) {
    await go(page, '#/');
    await btn(page, new RegExp(labels[i])).click();
    await until(page, (m) => window.__aslan.useView.getState().module === m, targets[i]);
  }
  await until(page, () => window.__aslan.useView.getState().previewLabel === '' || !window.__aslan.useView.getState().preview, null);
});

await test('walkthrough: ENTER THE STADIUM flies to the main entrance in walkthrough mode', async () => {
  await go(page, '#/');
  await btn(page, /ENTER THE STADIUM/).click();
  await until(page, () => window.__aslan.useView.getState().poi === 'main-entrance', null);
  const v = await view(page);
  assert(v.cameraMode === 'walkthrough', `camera mode ${v.cameraMode}`);
});

await test('walkthrough: every walkthrough point can be visited from the list', async () => {
  await go(page, '#/explore');
  const names = ['Dış giriş meydanı', 'Ana giriş', 'İç dolaşım alanı', 'Tribün girişi', 'Koltuk sırası', 'Saha kenarı', 'Oyuncu tüneli', 'Çatıya bakan özel kamera', 'Taraftar meydanı', 'Müze ve deneyim alanı'];
  for (const n of names) {
    await page.locator('#panel').getByRole('button', { name: new RegExp(`^\\d+\\s*${n}`) }).click();
    await page.waitForTimeout(700);
  }
  const v = await view(page);
  assert(v.poi === 'museum', `last poi ${v.poi}`);
});

await test('camera dock: next/previous point, keyboard N and reset view', async () => {
  await go(page, '#/explore');
  await page.evaluate(() => window.__aslan.worldApi.flyToPoi('museum', { instant: true }));
  await until(page, () => window.__aslan.useView.getState().poi === 'museum', null);
  await page.getByRole('button', { name: 'Sonraki gezinti noktası' }).click();
  await until(page, () => window.__aslan.useView.getState().poi === 'entry-plaza', null);
  await page.getByRole('button', { name: 'Önceki gezinti noktası' }).click();
  await until(page, () => window.__aslan.useView.getState().poi === 'museum', null);
  await page.locator('#world-canvas').focus();
  await page.keyboard.press('n');
  await until(page, () => window.__aslan.useView.getState().poi === 'entry-plaza', null);
  // walk from a settled pose: snap to the point instead of waiting out the camera transition
  await page.evaluate(() => window.__aslan.worldApi.flyToPoi('entry-plaza', { instant: true }));
  const before = await page.evaluate(() => window.__aslan.worldApi.getPose().pos);
  // hold W until the walker moves: each frame walks 3.2 m/s × min(dt, 0.1 s), so a fixed hold fails on very slow software GL
  await page.keyboard.down('w');
  try {
    await until(page, (b) => { const p = window.__aslan.worldApi.getPose().pos; return Math.hypot(p[0] - b[0], p[2] - b[2]) > 0.3; }, before, 20000);
  } catch {
    throw new Error('W key did not move the walker');
  } finally {
    await page.keyboard.up('w');
  }
  const after = await page.evaluate(() => window.__aslan.worldApi.getPose().pos);
  assert(Math.abs(after[1] - before[1]) < 0.01, 'walker left the eye height');
  await page.getByRole('button', { name: 'Başlangıç görünümüne dön' }).click();
  await until(page, () => window.__aslan.useView.getState().cameraMode === 'explorer', null);
});

await test('walkthrough: keyboard movement stays inside the walk radius', async () => {
  await page.evaluate(() => window.__aslan.worldApi.flyToPoi('player-tunnel', { instant: true }));
  await page.waitForTimeout(500);
  await page.locator('#world-canvas').focus();
  await page.keyboard.down('d');
  await page.waitForTimeout(3000);
  await page.keyboard.up('d');
  const p = await page.evaluate(() => window.__aslan.worldApi.getPose().pos);
  assert(Math.abs(p[0]) <= 3.05, `walker escaped the tunnel (x=${p[0].toFixed(2)})`);
});

await test('environment: night / dusk / day buttons', async () => {
  await go(page, '#/explore'); // the time-of-day buttons live in the camera dock, shown with a module panel
  for (const [label, env] of [['Alacakaranlık', 'dusk'], ['Gündüz', 'day'], ['Gece', 'night']]) {
    await page.getByRole('button', { name: label, exact: true }).click();
    await until(page, (e) => window.__aslan.useView.getState().env === e, env);
  }
});

await test('digital twin: layers, presets, exploded view, focus and section', async () => {
  await go(page, '#/architecture');
  await page.getByRole('switch', { name: 'Çatı', exact: true }).click();
  assert((await view(page)).layers.roof === false, 'roof layer did not hide');
  await page.getByRole('switch', { name: 'Çatı', exact: true }).click();
  await btn(page, 'Yalnızca kase').click();
  let v = await view(page);
  assert(!v.layers.facade && v.layers.lowerTier, 'bowl-only preset failed');
  await btn(page, 'Tümü', true).click();
  await btn(page, 'Katmanları ayır').click();
  await until(page, () => window.__aslan.useView.getState().exploded === true, null);
  await page.getByRole('button', { name: 'Çatı katmanını incele' }).click();
  await until(page, () => window.__aslan.useView.getState().focusLayer === 'roof', null);
  await btn(page, 'Önceki görünüme dön').click();
  await until(page, () => window.__aslan.useView.getState().focusLayer === null, null);
  await btn(page, 'Katmanları birleştir').click();
  await btn(page, 'Uzun eksen').click();
  await until(page, () => window.__aslan.useView.getState().section === 'long', null);
  await page.getByText('Kavramsal kesit — mühendislik çizimi değildir').first().waitFor();
  await btn(page, 'Kısa eksen').click();
  await until(page, () => window.__aslan.useView.getState().section === 'short', null);
  await btn(page, 'Kapalı', true).click();
  v = await view(page);
  assert(v.section === 'off', 'section did not turn off');
});

await test('object inspector: clicking the model selects a component; close button works', async () => {
  await go(page, '#/architecture');
  await page.evaluate(() => window.__aslan.worldApi.flyTo({ pos: [0, 330, 40], target: [0, 0, 0] }, { instant: true, mode: 'explorer' }));
  await page.waitForTimeout(1200);
  const box = await page.locator('#world-canvas canvas').boundingBox();
  await page.mouse.click(box.x + box.width / 2 - 200, box.y + box.height / 2);
  await until(page, () => window.__aslan.useView.getState().selected !== null, null);
  await page.getByRole('complementary', { name: 'Object Inspector' }).waitFor();
  await page.getByRole('button', { name: "Inspector'ı kapat" }).click();
  assert((await view(page)).selected === null, 'inspector did not close');
});

await test('DNA engine: presets apply, confirm dialog protects customisations, locks hold', async () => {
  await go(page, '#/design');
  await page.locator('#panel').getByRole('button', { name: /^Red & Gold Icon/ }).click();
  assert((await design(page)).dna === 'redgold', 'Red & Gold not applied');
  await page.locator('#panel').getByRole('combobox', { name: 'Dijital ekran düzeni' }).selectOption('standard');
  await page.locator('#panel').getByRole('button', { name: 'Cephe aydınlatması: kilitle (ön ayarlar değiştirmesin)' }).click();
  const lighting = (await design(page)).facade.lighting;
  await page.locator('#panel').getByRole('button', { name: /^Pure Architecture/ }).click();
  await page.getByRole('alertdialog').waitFor();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Uygula' }).click();
  const d = await design(page);
  assert(d.dna === 'pure', 'Pure not applied');
  assert(d.facade.lighting === lighting && lighting !== 'static', 'locked facade lighting changed');
  await page.locator('#panel').getByRole('button', { name: 'Cephe aydınlatması: kilidi aç' }).click();
});

await test('DNA engine: conflict detection and one-click alternatives', async () => {
  await go(page, '#/design');
  await page.locator('#panel').getByRole('combobox', { name: 'Görsel dil' }).selectOption('minimal');
  await page.locator('#panel').getByRole('combobox', { name: 'Dijital ekran düzeni' }).selectOption('media-facade');
  await page.getByText('Sade mimari dil ile yoğun ışık/ekran birbirini zayıflatıyor').waitFor();
  await btn(page, 'Ekranları 360° banda indir').click();
  const d = await design(page);
  assert(d.screens.layout === 'ribbon', 'suggestion not applied');
});

await test('top bar: undo / redo', async () => {
  await go(page, '#/design');
  const before = (await design(page)).seats.choreography;
  const next = before === 'stars' ? 'wave' : 'stars';
  await page.locator('#panel').getByRole('combobox', { name: 'Tribün koreografisi' }).selectOption(next);
  assert((await design(page)).seats.choreography === next, 'choreography not set');
  await page.getByRole('button', { name: 'Geri al', exact: true }).click();
  assert((await design(page)).seats.choreography === before, 'undo had no effect');
  await page.getByRole('button', { name: 'Yinele' }).click();
  assert((await design(page)).seats.choreography === next, 'redo had no effect');
});

await test('material lab: materials apply to the model; A/B comparison renders two images', async () => {
  await go(page, '#/materials');
  await page.locator('#panel').getByRole('button', { name: 'Koyu metal' }).click();
  assert((await design(page)).materials.facade === 'dark-metal', 'facade material not applied');
  await btn(page, 'Çatı', true).click();
  await page.locator('#panel').getByRole('button', { name: 'Kompozit cephe' }).click();
  assert((await design(page)).materials.roof === 'composite', 'roof material not applied');
  await btn(page, 'A’yı göster').click();
  assert((await view(page)).hasPreview, 'A preview missing');
  await btn(page, 'Yan yana görsel').click();
  await page.locator('#panel img[alt^="Alternatif A"]').waitFor({ timeout: T(60000) });
  await page.locator('#panel img[alt^="Alternatif B"]').waitFor({ timeout: T(60000) });
  await page.getByRole('button', { name: 'Tasarıma dön' }).click();
});

await test('light show: preset applies, sequence preview plays, speed is capped', async () => {
  await go(page, '#/lightshow');
  await page.locator('#panel').getByRole('button', { name: /^The Red Wave/ }).click();
  let d = await design(page);
  assert(d.show.active && d.show.preset === 'red-wave', 'preset not applied');
  await btn(page, 'Sahne ekle').click();
  assert((await design(page)).show.sequence.length === 4, 'scene not added');
  await btn(page, 'Önizlemeyi oynat').click();
  // show time advances per rendered frame, so poll instead of waiting a fixed time on slow software GL
  await until(page, () => parseFloat(document.querySelector('[role=progressbar] > div').style.width) > 0, null, 30000).catch(() => {
    throw new Error('progress did not advance');
  });
  await btn(page, 'Durdur', true).click();
  const hz = await page.locator('#panel').getByText(/Şu anki geçiş frekansı/).textContent();
  assert(parseFloat(hz.match(/([\d.]+) Hz/)[1]) <= 1.2, 'frequency above cap');
  await page.locator('#panel').getByRole('switch', { name: 'Işık gösterisini stadyuma uygula' }).click();
  d = await design(page);
  assert(!d.show.active, 'show did not switch off');
});

await test('time machine: phases change the preview; leaving restores the design', async () => {
  await go(page, '#/time');
  await page.locator('#panel').getByRole('button', { name: 'Aşama 2' }).click();
  await until(page, () => /Aşama 2/.test(window.__aslan.useView.getState().previewLabel), null);
  await page.getByText('Dijital ve operasyonel dönüşüm').first().waitFor();
  await page.locator('#panel').getByRole('button', { name: 'Bugün' }).click();
  await until(page, () => /Bugün/.test(window.__aslan.useView.getState().previewLabel), null);
  await go(page, '#/explore');
  assert(!(await view(page)).hasPreview, 'preview leaked after leaving');
});

await test('what-if: question presets and side-by-side comparison', async () => {
  await go(page, '#/whatif');
  await page.locator('#panel').getByRole('button', { name: /Sosyal alanlara daha çok yer/ }).click();
  await page.locator('#panel').getByRole('button', { name: '3D’de göster' }).nth(1).click();
  assert((await view(page)).hasPreview, 'scenario preview missing');
  await btn(page, 'Yan yana karşılaştır').click();
  await page.locator('#panel img[alt^="Senaryo A"]').waitFor({ timeout: T(60000) });
  await page.locator('#panel img[alt^="Senaryo B"]').waitFor({ timeout: T(60000) });
  await page.getByRole('button', { name: 'Tasarıma dön' }).click();
});

await test('matchday: atmospheres change lighting state; sound turns on and off', async () => {
  await go(page, '#/matchday');
  await page.locator('#panel').getByRole('button', { name: /^Gol anı/ }).click();
  let v = await view(page);
  assert(v.atmosphere === 'goal' && v.occupancy === 1, 'goal atmosphere not applied');
  await page.locator('#panel').getByRole('button', { name: 'Sesi aç' }).click();
  await until(page, () => window.__aslan.useView.getState().soundOn === true, null);
  await page.locator('#panel').getByRole('button', { name: 'Düdük' }).click();
  await page.locator('#panel').getByRole('button', { name: 'Sesi kapat' }).click();
  await until(page, () => window.__aslan.useView.getState().soundOn === false, null);
  await page.locator('#panel').getByRole('button', { name: /^Sessiz mimari keşif/ }).click();
  v = await view(page);
  assert(v.atmosphere === 'silent', 'silent atmosphere not applied');
});

await test('seat experience: pick two seats, camera moves, comparison renders', async () => {
  await go(page, '#/seats');
  await until(page, () => window.__aslan.useView.getState().cameraMode === 'seat', null);
  await page.getByRole('button', { name: /Alt Kuzey · Blok L13 — koltuk A/ }).click();
  await btn(page, 'Koltuk B').click();
  await page.getByRole('button', { name: /Üst Doğu · Blok U07 — koltuk B/ }).click();
  await page.locator('#panel table').getByText('C-değeri (yaklaşık)').waitFor();
  await btn(page, 'İki görüşü yan yana göster').click();
  await page.locator('#panel img[alt="Koltuk A görüşü"]').waitFor({ timeout: T(60000) });
  await page.locator('#panel img[alt="Koltuk B görüşü"]').waitFor({ timeout: T(60000) });
});

await test('crowd flow: simulation runs, gate closure and strategy change reset it', async () => {
  await go(page, '#/crowd');
  await btn(page, 'Başlat').click();
  await until(page, () => (document.querySelector('[data-stat="Simüle süre"]')?.textContent ?? '0:00') !== '0:00', null, 30000).catch(async () => {
    throw new Error(`sim time did not advance (${await page.locator('[data-stat="Simüle süre"]').textContent()})`);
  });
  await btn(page, 'Kapı E', true).click();
  await btn(page, 'Dengeli').click();
  await page.locator('#panel').getByRole('switch', { name: 'Akışı 3D modelde göster' }).click();
  assert((await view(page)).crowdIn3D, '3D crowd toggle failed');
  await btn(page, 'Başlat').click();
  await page.waitForTimeout(1500);
  await btn(page, 'Sıfırla').click();
});

await test('stadium OS: modules highlight layers; charts have a table view', async () => {
  await go(page, '#/os');
  await page.locator('#panel').getByRole('button', { name: /^Access & Inclusion/ }).click();
  await until(page, () => window.__aslan.useView.getState().highlight.includes('access'), null);
  await page.locator('#panel').getByRole('button', { name: /^Energy Management/ }).click();
  await btn(page, 'Tablo').click();
  await page.locator('#panel table').first().waitFor();
  await go(page, '#/explore');
  assert((await view(page)).highlight.length === 0, 'highlight leaked');
});

await test('green engine: systems toggle in the shared design', async () => {
  await go(page, '#/green');
  const before = (await design(page)).green.rainwater;
  await page.locator('#panel').getByRole('switch', { name: 'Yağmur suyu yönetimi' }).click();
  assert((await design(page)).green.rainwater === !before, 'rainwater did not toggle');
  await btn(page, 'Genişletilmiş konsept').click();
  assert((await design(page)).green.solar === 'extended', 'solar did not extend');
  await btn(page, 'Karşılaştırma için kaydet').click();
  await page.locator('#panel').getByText('Kaydedilen senaryo').first().waitFor();
});

await test('stadium city: zones fly the camera and open descriptions; disabled zones can be added', async () => {
  await page.evaluate(() => window.__aslan.useDesign.getState().patch({ district: { eventLawn: false } }, 'test', { respectLocks: false }));
  await go(page, '#/city');
  await page.locator('#panel').getByRole('button', { name: /Etkinlik çimi/ }).first().click();
  await btn(page, 'Bu alanı tasarıma ekle').click();
  assert((await design(page)).district.eventLawn === true, 'event lawn not added');
  await page.locator('#panel').getByRole('button', { name: /Kulüp müzesi/ }).first().click();
  await page.locator('#panel').getByText('Stadyum turu başlangıç noktası').waitFor();
});

await test('scenario economy and roadmap respond to selection', async () => {
  await go(page, '#/economy');
  await page.locator('#panel').getByRole('button', { name: /Scenario B/ }).click();
  await until(page, () => /Senaryo B/.test(window.__aslan.useView.getState().previewLabel), null);
  await go(page, '#/roadmap');
  await page.locator('#panel').getByRole('button', { name: /^R6:/ }).click();
  await page.locator('#panel').getByText('Daha büyük mimari müdahalelerin araştırılması').first().waitFor();
});

await test('fan journey: personas, editing and markdown download', async () => {
  await go(page, '#/journey');
  await page.locator('#panel').getByRole('button', { name: /Erişilebilir güzergâha ihtiyaç/ }).click();
  await page.locator('#panel').getByRole('button', { name: 'Duraktan çıkar' }).first().click();
  await btn(page, 'Ekle', true).click();
  const dl = page.waitForEvent('download');
  await btn(page, 'Planı indir (.md)').click();
  const file = await dl;
  assert(/\.md$/.test(file.suggestedFilename()), 'no markdown download');
  await btn(page, 'Rotayı 3D’de oynat').click();
  await page.waitForTimeout(1200);
  await btn(page, 'Turu durdur').click();
});

await test('AI architect: example prompts change the design, explain, and can be undone', async () => {
  await go(page, '#/architect');
  // start from a roof light the "more minimal" request can actually change
  await page.evaluate(() => window.__aslan.useDesign.getState().setKey('roof.light', 'halo-ring', 'e2e başlangıç'));
  const before = await design(page);
  await page.locator('#panel').getByRole('button', { name: 'Çatı ışıklarını daha minimal yap.' }).click();
  await page.locator('#panel').getByText('Değişen özellikler').first().waitFor();
  assert((await design(page)).roof.light === 'subtle-rim', 'roof light not minimal');
  await page.locator('#panel').getByRole('button', { name: 'Bu değişikliği geri al' }).last().click();
  assert((await design(page)).roof.light === before.roof.light, 'undo did not restore');
  await page.locator('#architect-input').fill('Kapasiteyi 70 bin yap');
  await page.keyboard.press('Enter');
  await page.locator('#panel').getByText('Kapsam dışı').first().waitFor();
  await page.locator('#architect-input').fill('merhaba');
  await page.keyboard.press('Enter');
  await page.locator('#panel').getByText(/desteklenen bir tasarım parametresiyle eşleştiremedim/).first().waitFor();
});

await test('design archive: save, version, restore, compare and delete', async () => {
  await go(page, '#/archive');
  await page.locator('#panel').getByLabel('Tasarım adı', { exact: true }).fill('Red Halo Concept');
  await btn(page, 'Kaydet', true).click();
  await page.locator('#panel input[aria-label="Tasarım adını düzenle"]').first().waitFor();
  await page.evaluate(() => window.__aslan.useDesign.getState().applyDna('green'));
  await page.locator('#panel').getByLabel('Tasarım adı', { exact: true }).fill('Green Stadium Concept');
  await btn(page, 'Kaydet', true).click();
  await until(page, () => JSON.parse(localStorage.getItem('aslan2035.archive.v1') || '[]').length === 2, null, 60000);
  for (const cb of await page.locator('#panel').getByLabel('Karşılaştırmaya ekle').all()) await cb.check();
  await page.locator('#panel').getByText('Sürüm karşılaştırması').waitFor();
  await btn(page, 'Yeni sürüm').first().click();
  await btn(page, 'Sürümler').first().click();
  await page.locator('#panel').getByText('v2').first().waitFor({ timeout: T(30000) });
  await page.locator('#panel').getByRole('button', { name: 'Aç', exact: true }).last().click();
  assert((await design(page)).dna === 'classic' || (await design(page)).dna !== 'green', 'restore failed');
  await page.locator('#panel').getByRole('button', { name: /kaydını sil$/ }).first().click();
  await btn(page, 'Silmeyi onayla').click();
  await until(page, () => JSON.parse(localStorage.getItem('aslan2035.archive.v1') || '[]').length === 1, null);
});

await test('share & export: JSON/summary downloads, image render, link round-trip', async () => {
  await go(page, '#/share');
  let dl = page.waitForEvent('download');
  await btn(page, 'Konfigürasyon (.json)').click();
  assert(/\.json$/.test((await dl).suggestedFilename()), 'no json');
  dl = page.waitForEvent('download');
  await btn(page, 'Tasarım özeti (.md)').click();
  assert(/\.md$/.test((await dl).suggestedFilename()), 'no md');
  await btn(page, /1920×1080 görsel/).click();
  await page.locator('#panel img[alt="Mevcut tasarımın 3D konsept görseli"]').waitFor({ timeout: T(60000) });
  dl = page.waitForEvent('download');
  await btn(page, 'PNG indir').click();
  assert(/\.png$/.test((await dl).suggestedFilename()), 'no png');
  const link = await page.locator('#panel input[aria-label="Paylaşım bağlantısı"]').inputValue();
  const shared = await design(page);
  // the link opens in a second tab; browsers stop drawing background tabs, headless pages need it done by hand
  await page.evaluate(() => window.__aslan.useView.setState({ worldCovered: 1 }));
  try {
    const other = await newPage({ hash: '' });
    await other.goto(link);
    await other.getByRole('dialog').getByRole('button', { name: 'Tasarımı yükle' }).click({ timeout: T(30000) });
    const loaded = await design(other);
    assert(canonical(loaded) === canonical(shared), 'shared design differs');
    await other.goto(`${BASE}?e2e=1#/design?d=@@broken`);
    await other.getByRole('alert').filter({ hasText: /Paylaşım bağlantısı okunamadı/ }).waitFor();
    await other.context().close();
  } finally {
    await page.evaluate(() => window.__aslan.useView.setState({ worldCovered: 0 }));
  }
});

await test('gallery: renders concept images and the lightbox opens and closes', async () => {
  await go(page, '#/gallery');
  await btn(page, 'Galeriyi oluştur').click();
  await page.locator('#panel').getByRole('button', { name: 'Gece silueti görselini büyüt' }).click({ timeout: T(120000) });
  await page.getByRole('dialog', { name: /Galeri/ }).waitFor();
  await page.keyboard.press('ArrowRight');
  await page.getByRole('dialog', { name: /Alacakaranlık/ }).waitFor();
  await page.keyboard.press('Escape');
  assert((await page.getByRole('dialog').count()) === 0, 'lightbox did not close');
});

await test('presentation mode: slides advance with keys, apply their state, and exit', async () => {
  await go(page, '#/present');
  await page.getByRole('heading', { name: 'Bir Efsaneyi İzleme. Geleceğini Tasarla.' }).waitFor();
  await page.keyboard.press('ArrowRight');
  await page.getByRole('heading', { name: 'RAMS Park bugün' }).waitFor();
  await page.getByRole('tab', { name: /Kavramsal kesit|Tribünler, dolaşım/ }).click();
  await until(page, () => window.__aslan.useView.getState().section === 'long', null);
  await btn(page, 'Sunumu kapat').click();
  await until(page, () => window.__aslan.useView.getState().module === 'home', null);
  assert((await view(page)).section === 'off', 'section leaked after presentation');
});

await test('project report: renders 3D visuals and downloads HTML', async () => {
  await go(page, '#/report');
  await btn(page, '3D görselleri oluştur').click();
  await page.locator('.report-doc img').nth(5).waitFor({ timeout: T(120000) });
  const dl = page.waitForEvent('download');
  await btn(page, 'HTML indir').click();
  assert(/\.html$/.test((await dl).suggestedFilename()), 'no html');
  await btn(page, 'Kapat', true).click();
});

await test('2D plan view and reduced motion setting', async () => {
  await go(page, '#/explore');
  await page.getByRole('button', { name: /^2D$/ }).click();
  await page.getByRole('img', { name: 'Stadyum ve çevresinin 2D konsept planı' }).waitFor();
  await btn(page, '3D görünüme geç').click();
  await worldReady(page);
  await page.getByRole('button', { name: 'Görünüm ayarları' }).click();
  await btn(page, /Azaltılmış hareket/).click();
  assert((await view(page)).reducedMotion === true, 'reduced motion not enabled');
  await btn(page, 'Kapat', true).click();
});

await test('sources page lists verified facts with links', async () => {
  await go(page, '#/about');
  await page.locator('#panel').getByText('53.387 (2026 itibarıyla)').waitFor();
  const links = await page.locator('#panel a[href^="https://"]').count();
  assert(links >= 3, 'source links missing');
});

await page.context().close();

/* ======================= Intro session ======================= */
console.log('\nFirst visit');
await test('first visit plays the cinematic intro, which can be skipped', async () => {
  const p = await newPage({ prefs: { quality: 'low', qualityAuto: false } });
  await until(p, () => window.__aslan.useView.getState().introPlaying === true, null, 30000);
  await p.getByRole('button', { name: 'Açılışı atla' }).click();
  await until(p, () => window.__aslan.useView.getState().introPlaying === false, null);
  await p.reload();
  await p.waitForFunction(() => window.__aslan);
  await p.waitForTimeout(1500);
  assert(!(await p.evaluate(() => window.__aslan.useView.getState().introPlaying)), 'intro replayed after being seen');
  await p.context().close();
});

/* ======================= Mobile session ======================= */
console.log('\nMobile session');
await test('mobile: menu navigation, bottom sheet and collapse', async () => {
  const p = await newPage({ viewport: { width: 390, height: 844 }, hasTouch: true });
  await p.getByRole('button', { name: 'Modül menüsünü aç' }).click();
  await p.getByRole('dialog', { name: 'Modül menüsü' }).getByRole('button', { name: /Stadium DNA Engine/ }).click();
  await until(p, () => window.__aslan.useView.getState().module === 'design', null);
  const sheet = await p.locator('#panel').boundingBox();
  assert(sheet.y > 300 && sheet.width >= 380, 'panel is not a bottom sheet');
  await p.getByRole('button', { name: 'Paneli küçült' }).click();
  const small = await p.locator('#panel').boundingBox();
  assert(small.height < 80, 'panel did not collapse');
  await p.getByRole('button', { name: 'Paneli genişlet' }).click();
  const overflow = await p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  assert(!overflow, 'horizontal overflow on mobile');
  await p.context().close();
});

/* ======================= Report ======================= */
await browser.close();
server?.kill();

const failed = results.filter((r) => !r.ok);
// software-GL driver noise and library deprecations are counted, not failed
const KNOWN = /THREE\.Clock|GPU stall|WebGL: INVALID_|GL_INVALID|Download the React DevTools/;
const uniqueErrors = [...new Set(pageErrors)].filter((e) => !KNOWN.test(e));
const known = [...new Set(pageErrors)].filter((e) => KNOWN.test(e));
console.log(`\n${results.length - failed.length}/${results.length} passed`);
if (uniqueErrors.length) console.log(`Page errors (${uniqueErrors.length}):\n  ${uniqueErrors.slice(0, 10).join('\n  ')}`);
console.log(`Known driver/library console errors ignored: ${known.length}${known.length ? `\n  ${known.slice(0, 5).join('\n  ')}` : ''}`);
process.exit(failed.length || uniqueErrors.length ? 1 : 0);
