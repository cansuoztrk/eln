/* Ana sayfa ve Kurucu Paneli için uçtan uca kontrol: NODE_PATH=$(npm root -g) node tests/kurucu-akisi.js [adres] [klasör] */
'use strict';
const { chromium } = require('playwright');
const path = require('path');

const ADRES = process.argv[2] || 'http://localhost:8765/index.html';
const KLASOR = process.argv[3] || null;

(async () => {
  const tarayici = await chromium.launch();
  const hatalar = [];
  const sorunlar = [];
  for (const [ad, vp] of [['masaustu', { width: 1440, height: 900 }], ['telefon', { width: 390, height: 844 }]]) {
    const baglam = await tarayici.newContext({ ignoreHTTPSErrors: true, viewport: vp });
    const s = await baglam.newPage();
    s.on('pageerror', (e) => hatalar.push(ad + ': ' + e.message));
    await s.goto(ADRES);
    await s.waitForTimeout(800);
    if (KLASOR) await s.screenshot({ path: path.join(KLASOR, 'ana-' + ad + '.png'), fullPage: true });
    if (await s.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)) sorunlar.push(ad + ': ana sayfa yatay taşıyor');
    await s.click('.dosya-kart .dosya-cevir');
    await s.goto(ADRES + '#oyna');
    if (KLASOR) await s.screenshot({ path: path.join(KLASOR, 'kurulum-' + ad + '.png'), fullPage: true });
    if (await s.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)) sorunlar.push(ad + ': kurulum yatay taşıyor');

    // Kurucu paneli: kadro → roller → tam bir tur → final
    await s.goto(ADRES + '#kurucu');
    await s.evaluate(() => localStorage.removeItem('kk-kurucu'));
    await s.reload();
    await s.fill('#k-isimler', 'Pırıl\nLale\nDeniz\nMert\nCeren\nEfe\nAyaz\nSu\nBarış');
    await s.check('#k-medik', { force: true });
    await s.click('#k-dagit');
    if (KLASOR) await s.screenshot({ path: path.join(KLASOR, 'kurucu-roller-' + ad + '.png'), fullPage: true });
    await s.check('#kurucu-gizle', { force: true });
    await s.click('#k-tur-baslat');
    for (let tur = 0; tur < 8; tur++) {
      const adim = await s.evaluate(() => document.querySelector('.kurucu-adimlar [aria-current="step"]').dataset.adim);
      if (adim !== 'tur') break;
      const tik = async (sec) => { const el = await s.$(sec); if (el) await el.click(); return !!el; };
      await tik('[data-is="olay"]');
      await tik('[data-is="kabin"]');
      for (const inp of await s.$$('input[data-kabin]')) await inp.fill('ELMA');
      await tik('[data-is="salter"]');
      const kisiler = await s.$$eval('.k-renk', (l) => l.length);
      for (let i = 0; i < kisiler; i++) await s.click('.k-renk >> nth=' + i + ' >> button >> nth=' + (i === 0 ? 1 : 0));
      await tik('[data-is="kamera"]');
      if (await s.$('#k-arayan')) { await s.selectOption('#k-arayan', { index: 1 }); await tik('[data-is="telefon"]'); }
      if (!(await tik('[data-karar="oylama"]'))) { /* zorunlu */ }
      if (await s.$('#k-atilan')) { await s.selectOption('#k-atilan', { index: 1 }); await tik('[data-is="atil"]'); }
      if (await s.$('#k-kurban')) { await s.selectOption('#k-kurban', { index: 1 }); await tik('[data-is="gece"]'); }
      await tik('[data-is="gece-sessiz"]');
      if (tur === 0 && KLASOR) await s.screenshot({ path: path.join(KLASOR, 'kurucu-tur-' + ad + '.png'), fullPage: true });
      if (!(await tik('[data-is="tur-bitir"]'))) { sorunlar.push(ad + ': tur ' + (tur + 1) + ' bitirilemedi'); break; }
    }
    const adim = await s.evaluate(() => document.querySelector('.kurucu-adimlar [aria-current="step"]').dataset.adim);
    if (adim !== 'final') sorunlar.push(ad + ': finale ulaşılamadı (' + adim + ')');
    for (let i = 0; i < 3; i++) if (await s.$('#k-koltuk-' + i)) await s.selectOption('#k-koltuk-' + i, { index: i + 1 });
    const ac = await s.$('[data-is="final-ac"]');
    if (ac && !(await ac.isDisabled())) await ac.click();
    if (KLASOR) await s.screenshot({ path: path.join(KLASOR, 'kurucu-final-' + ad + '.png'), fullPage: true });
    const sonuc = await s.evaluate(() => (document.querySelector('.k-final-sonuc h3') || {}).textContent || 'yok');
    if (await s.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)) sorunlar.push(ad + ': kurucu yatay taşıyor');
    console.log(ad, '· kurucu sonucu:', sonuc);
    await baglam.close();
  }
  await tarayici.close();
  [...hatalar, ...sorunlar].forEach((h) => console.log('SORUN', h));
  process.exit(hatalar.length + sorunlar.length ? 1 : 0);
})();
