// Test robotu — her değişiklikte (GitHub Actions'ta ve yerelde) kalenin bozulmadığını denetler; kasa şifresi gerekmez.
//   1) Bütün JS dosyaları sözdizimi denetimi (node --check)
//   2) Paket güncel mi (node tools/bundle.mjs --check)
//   3) Pul tutarlılığı: verilen her pulun tanımı var, kimlikler tekrar etmiyor
//   4) Tarayıcı (Playwright varsa): index.html ve dev.html açılır, kapı ekranı görünür, konsolda hata yok,
//      her oda kimlik/başlık/ikonla kayıtlı ve kimlikler eşsiz, yatay taşma yok.
// Kullanım: node tools/ci.mjs [--tarayicisiz]   (PORT ortam değişkeni: varsayılan 8123)
import { execFileSync, spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';

const KOK = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const hatalar = [];
const bolum = (ad) => console.log(`\n▸ ${ad}`);
const tara = (dir, uz) => fs.readdirSync(path.join(KOK, dir), { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? (['vendor', 'node_modules'].includes(e.name) ? [] : tara(path.join(dir, e.name), uz)) : uz.some((u) => e.name.endsWith(u)) ? [path.join(dir, e.name)] : []));

bolum('Sözdizimi');
const dosyalar = ['js', 'functions', 'workers'].filter((d) => fs.existsSync(path.join(KOK, d))).flatMap((d) => tara(d, ['.js', '.mjs'])).concat(['sw.js', 'tools/bundle.mjs', 'tools/vault.mjs', 'tools/ci.mjs']);
for (const f of dosyalar) {
  try {
    execFileSync(process.execPath, ['--check', path.join(KOK, f)], { stdio: 'pipe' });
  } catch (e) {
    hatalar.push(`sözdizimi: ${f}\n${String(e.stderr).slice(0, 400)}`);
  }
}
console.log(`  ${dosyalar.length} dosya`);

bolum('Paket');
try {
  execFileSync(process.execPath, [path.join(KOK, 'tools/bundle.mjs'), '--check'], { stdio: 'pipe', cwd: KOK });
  console.log('  güncel');
} catch (e) {
  hatalar.push('paket güncel değil: node tools/bundle.mjs çalıştırılmalı\n' + String(e.stdout || e.stderr).slice(0, 400));
}

bolum('Pullar');
const st = fs.readFileSync(path.join(KOK, 'js/core/stickers.js'), 'utf8');
const tanimli = [...st.matchAll(/\{ id: '([a-z0-9-]+)'/g)].map((m) => m[1]);
const tekrar = tanimli.filter((x, i) => tanimli.indexOf(x) !== i);
tekrar.length && hatalar.push('tekrarlanan pul kimliği: ' + [...new Set(tekrar)].join(', '));
const verilen = new Set(tara('js', ['.js']).flatMap((f) => [...fs.readFileSync(path.join(KOK, f), 'utf8').matchAll(/award\('([a-z0-9-]+)'\)/g)].map((m) => m[1])));
const eksik = [...verilen].filter((x) => !tanimli.includes(x));
eksik.length && hatalar.push('tanımı olmayan pul: ' + eksik.join(', '));
console.log(`  ${tanimli.length} tanım, ${verilen.size} verilen`);

async function tarayici() {
  let pw;
  try {
    pw = await import('playwright');
  } catch (e) {
    try {
      pw = await import('/opt/node22/lib/node_modules/playwright/index.mjs');
    } catch (e2) {
      return console.log('  Playwright yok, atlandı');
    }
  }
  const PORT = +(process.env.PORT || 8123);
  const TUR = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json', '.bin': 'application/octet-stream', '.woff2': 'font/woff2' };
  const sunucu = http.createServer((req, res) => {
    const p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    const f = path.join(KOK, p === '/' ? 'index.html' : p);
    if (!f.startsWith(KOK) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) return res.writeHead(404).end();
    res.writeHead(200, { 'content-type': TUR[path.extname(f)] || 'application/octet-stream' });
    fs.createReadStream(f).pipe(res);
  });
  await new Promise((r) => sunucu.listen(PORT, r));
  const browser = await pw.chromium.launch(fs.existsSync('/opt/pw-browsers/chromium') ? {} : {});
  try {
    for (const sayfa of ['index.html', 'dev.html']) {
      const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
      await ctx.route(/^https:\/\/(?!localhost)/, (r) => r.fulfill({ status: 200, body: '' }));
      const p = await ctx.newPage();
      const konsol = [];
      p.on('pageerror', (e) => konsol.push(e.message));
      p.on('console', (m) => m.type() === 'error' && !/Failed to load resource/.test(m.text()) && konsol.push(m.text()));
      await p.goto(`http://localhost:${PORT}/${sayfa}`, { waitUntil: 'load' });
      await p.waitForTimeout(2500);
      const s = await p.evaluate(() => {
        const R = (window.K && window.K.rooms) || [];
        const ids = R.map((r) => r.id);
        return {
          kapi: Boolean(document.querySelector('#gateBow, .gate')),
          oda: R.length,
          eksik: R.filter((r) => !r.id || !r.title || !r.icon).map((r) => r.id || '?'),
          tekrar: ids.filter((x, i) => ids.indexOf(x) !== i),
          tasma: document.documentElement.scrollWidth > window.innerWidth + 1,
        };
      });
      console.log(`  ${sayfa}: kapı ${s.kapi ? '✓' : '✕'} · ${s.oda} oda · konsol hatası ${konsol.length}`);
      if (!s.kapi) hatalar.push(`${sayfa}: kapı ekranı görünmedi`);
      if (s.oda < 100) hatalar.push(`${sayfa}: oda sayısı az (${s.oda})`);
      if (s.eksik.length) hatalar.push(`${sayfa}: eksik alanlı oda: ${s.eksik.join(', ')}`);
      if (s.tekrar.length) hatalar.push(`${sayfa}: tekrarlanan oda kimliği: ${s.tekrar.join(', ')}`);
      if (s.tasma) hatalar.push(`${sayfa}: yatay taşma`);
      konsol.forEach((k) => hatalar.push(`${sayfa} konsol: ${k}`));
      await ctx.close();
    }
  } finally {
    await browser.close();
    sunucu.close();
  }
}
if (!process.argv.includes('--tarayicisiz')) {
  bolum('Tarayıcı');
  await tarayici();
}
console.log(hatalar.length ? `\n✕ ${hatalar.length} sorun:\n- ${hatalar.join('\n- ')}` : '\n✓ Kale sağlam.');
process.exit(hatalar.length ? 1 : 0);
