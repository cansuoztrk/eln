// Hızlı Açılış: dev.html'deki ~130 ayrı CSS/JS dosyasını sırası bozulmadan tek bir CSS ve tek bir JS paketine çevirir
// (esbuild ile küçültülmüş), dist/ klasörüne içerik özetli adla yazar ve index.html'i bu iki dosyayı yükleyecek şekilde üretir.
// Her dosya kendi try/catch'i içinde: birinde hata olursa diğerleri yine yüklenir (ayrı dosyalardaki gibi).
//
//   node tools/bundle.mjs           paketle (dev.html'i düzenledikten ya da js/css değiştirdikten sonra)
//   node tools/bundle.mjs --check   index.html ve dist/ güncel mi? Değilse çıkış kodu 1
//
// Geliştirirken dev.html açılır (dosyalar tek tek yüklenir); yayına index.html gider.
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { spawnSync } from 'child_process';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const CHECK = process.argv.includes('--check');
const ESBUILD = 'esbuild@0.24.0';
const rd = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');

const dev = rd('dev.html');
const cssRe = /^<link rel="stylesheet" href="(css\/[^"]+\.css)">\n/gm;
const jsRe = /^<script src="(js\/[^"]+\.js)" defer><\/script>\n/gm;
const css = [...dev.matchAll(cssRe)].map((m) => m[1]);
const js = [...dev.matchAll(jsRe)].map((m) => m[1]);
if (!css.length || !js.length) throw new Error('dev.html içinde css/js satırı bulunamadı');

function minify(code, loader) {
  const r = spawnSync('npx', ['--yes', ESBUILD, `--loader=${loader}`, '--minify', '--charset=utf8', '--legal-comments=none', '--log-level=error'], { input: code, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, cwd: ROOT });
  if (r.status !== 0 || !r.stdout) {
    console.warn(`esbuild çalışmadı (${loader}); küçültülmemiş paket yazılıyor.`, (r.stderr || '').slice(0, 400));
    return code;
  }
  return r.stdout;
}
const cssCode = minify(css.map((f) => `/* ${f} */\n${rd(f)}`).join('\n'), 'css');
const jsCode = minify(
  js.map((f) => `try {\n${rd(f)}\n} catch (e) { console.error(${JSON.stringify('[kale] ' + f)}, e); window.__kaleHata && window.__kaleHata(${JSON.stringify(f)}, e); }`).join('\n'),
  'js'
);
const h = (s) => crypto.createHash('sha256').update(s).digest('hex').slice(0, 10);
const cssName = `dist/kale.${h(cssCode)}.css`;
const jsName = `dist/kale.${h(jsCode)}.js`;

let first = true;
let html = dev.replace(cssRe, () => (first ? ((first = false), `<link rel="stylesheet" href="${cssName}">\n`) : ''));
first = true;
html = html.replace(jsRe, () => (first ? ((first = false), `<script src="${jsName}" defer></script>\n`) : ''));
html = html.replace('<!doctype html>\n', "<!doctype html>\n<!-- Bu dosya tools/bundle.mjs ile dev.html'den üretilir. Düzenlemeyi dev.html'de yap, sonra: node tools/bundle.mjs -->\n");

// Service worker: önbellek adı ve önceden indirilecek paketler
const swCur = rd('sw.js');
const sw = swCur
  .replace(/^const CACHE = .*;$/m, `const CACHE = 'eln-kale-${jsName.slice(10, 20)}';`)
  .replace(/^const BUNDLE = .*;$/m, `const BUNDLE = ['${jsName}', '${cssName}'];`);

if (CHECK) {
  const cur = fs.existsSync(path.join(ROOT, 'index.html')) ? rd('index.html') : '';
  const ok = cur === html && sw === swCur && fs.existsSync(path.join(ROOT, cssName)) && fs.existsSync(path.join(ROOT, jsName));
  console.log(ok ? `Paket güncel: ${jsName}, ${cssName}` : 'Paket eski: node tools/bundle.mjs çalıştır.');
  process.exit(ok ? 0 : 1);
}

fs.mkdirSync(path.join(ROOT, 'dist'), { recursive: true });
for (const f of fs.readdirSync(path.join(ROOT, 'dist'))) if (/^kale\.[0-9a-f]{10}\.(js|css)$/.test(f) && `dist/${f}` !== cssName && `dist/${f}` !== jsName) fs.unlinkSync(path.join(ROOT, 'dist', f));
fs.writeFileSync(path.join(ROOT, cssName), cssCode);
fs.writeFileSync(path.join(ROOT, jsName), jsCode);
fs.writeFileSync(path.join(ROOT, 'index.html'), html);
fs.writeFileSync(path.join(ROOT, 'sw.js'), sw);
const kb = (s) => `${Math.round(Buffer.byteLength(s) / 1024)} KB`;
const raw = (list) => list.reduce((a, f) => a + Buffer.byteLength(rd(f)), 0);
console.log(`${js.length} JS → ${jsName} (${kb(jsCode)}, kaynak ${Math.round(raw(js) / 1024)} KB)`);
console.log(`${css.length} CSS → ${cssName} (${kb(cssCode)}, kaynak ${Math.round(raw(css) / 1024)} KB)`);
