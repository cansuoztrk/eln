/* Arayüzü uçtan uca oynatır: NODE_PATH=$(npm root -g) node tests/arayuz-oyna.js [adres] [ekranGörüntüsüKlasörü]
 * Her rolde bir oyun oynar, her istemi yanıtlar, konsol hatalarını toplar. */
'use strict';
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const ADRES = process.argv[2] || 'http://localhost:8765/index.html';
const KLASOR = process.argv[3] || null;
const ROLLER = ['kaptan', 'suikastci', 'halusinatif', 'medik', 'yanci', 'murettebat'];

(async () => {
  const tarayici = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' }).catch(() => chromium.launch());
  const hatalar = [];
  let toplamHata = 0;
  for (let r = 0; r < ROLLER.length; r++) {
    const rol = ROLLER[r];
    const baglam = await tarayici.newContext({ ignoreHTTPSErrors: true, viewport: r % 2 ? { width: 390, height: 844 } : { width: 1440, height: 900 } });
    const sayfa = await baglam.newPage();
    sayfa.on('pageerror', (e) => hatalar.push(rol + ': ' + e.message));
    sayfa.on('console', (m) => { if (m.type() === 'error' && !/favicon|404/.test(m.text() + (m.location().url || ''))) hatalar.push(rol + ' konsol: ' + m.text()); });
    await sayfa.addInitScript(() => { const st = window.setTimeout; window.setTimeout = (f, ms, ...a) => st(f, (ms || 0) * 0.05, ...a); });
    await sayfa.goto(ADRES + '#oyna');
    await sayfa.fill('#kur-ad', 'Test.Kaptan');
    if (rol === 'medik') await sayfa.check('#kur-medik', { force: true });
    if (rol === 'halusinatif') await sayfa.selectOption('#kur-lanet', 'salter');
    await sayfa.selectOption('#kur-rol', rol);
    await sayfa.selectOption('#kur-sayi', { index: 0 }).catch(() => {});
    await sayfa.click('#kurulum-formu button[type="submit"]');
    const gorulen = new Set();
    let adim = 0;
    let bitti = false;
    while (adim++ < 900) {
      const durum = await sayfa.evaluate(() => {
        const s = document.querySelector('#sahne');
        return { faz: s.dataset.faz, baslik: document.querySelector('#sahne-baslik').textContent, sonuc: s.dataset.sonuc || null };
      });
      if (KLASOR && durum.faz && !gorulen.has(durum.faz)) {
        gorulen.add(durum.faz);
        await sayfa.waitForTimeout(150);
        await sayfa.screenshot({ path: path.join(KLASOR, rol + '-' + durum.faz + '.png'), fullPage: r % 2 === 1 });
      }
      if (durum.sonuc && await sayfa.$('#tekrar')) { bitti = true; break; }
      const yapildi = await sayfa.evaluate(() => {
        const e = document.querySelector('#sahne-eylem');
        const tikla = (el) => { el.click(); return true; };
        const kelime = e.querySelector('#kelime-formu');
        if (kelime) { kelime.querySelector('button').click(); return 'kelime'; }
        const kol = document.querySelector('#kol');
        const cik = e.querySelector('#salter-cik');
        if (kol && cik && !kol.disabled) { kol.click(); cik.click(); return 'salter'; }
        const onay = e.querySelector('#coklu-onay');
        if (onay) {
          const kisiler = [...e.querySelectorAll('.secim-kisi')];
          const gerek = Number((onay.textContent.match(/\/(\d+)/) || [])[1] || 0);
          kisiler.slice(0, gerek).forEach((k) => k.click());
          if (!onay.disabled) onay.click();
          return 'coklu';
        }
        const kisi = [...e.querySelectorAll('.secim-kisi')].filter((k) => !k.classList.contains('cekimser'));
        if (kisi.length) return tikla(kisi[Math.floor(Math.random() * kisi.length)]) && 'kisi';
        const sec = e.querySelector('.secenekler button');
        if (sec) { const t = [...e.querySelectorAll('.secenekler button')]; return tikla(t[Math.floor(Math.random() * t.length)]) && 'secenek'; }
        const d = e.querySelector('#devam-dugme');
        if (d) return tikla(d) && 'devam';
        return null;
      });
      if (!yapildi) await sayfa.waitForTimeout(60);
      // hayalet moduna düşülürse yarı oyunlarda sonuca atla
      if (r % 2 === 0 && await sayfa.evaluate(() => !document.querySelector('#hayalet-serit').hidden)) await sayfa.click('#hayalet-atla');
      // bazen telsizden söz al
      if (yapildi === 'devam' && Math.random() < 0.15) {
        await sayfa.evaluate(() => { const b = document.querySelector('#soz-formu button[data-soz="sucla"]'); if (b && !b.disabled) b.click(); });
      }
    }
    const ozet = await sayfa.evaluate(() => ({
      baslik: document.querySelector('#sahne-baslik').textContent,
      alt: document.querySelector('#sahne-alt').textContent,
      mesaj: document.querySelectorAll('#telsiz li').length,
      defter: document.querySelectorAll('#panel-defter .defter-tur').length,
      tasma: document.documentElement.scrollWidth > window.innerWidth + 1
    }));
    console.log(rol.padEnd(12), bitti ? 'BİTTİ' : 'TAKILDI', '·', ozet.baslik, '·', ozet.alt, '· mesaj', ozet.mesaj, '· tur', ozet.defter, ozet.tasma ? '· YATAY TAŞMA!' : '');
    if (!bitti) toplamHata++;
    if (KLASOR) await sayfa.screenshot({ path: path.join(KLASOR, rol + '-son.png'), fullPage: true });
    await baglam.close();
  }
  await tarayici.close();
  if (hatalar.length) { console.log('HATALAR:'); [...new Set(hatalar)].forEach((h) => console.log('  ' + h)); }
  process.exit(hatalar.length || toplamHata ? 1 : 0);
})();
