/* Motoru tarayıcısız çalıştırır: node tests/simulasyon.js [oyunSayisi]
 * Binlerce botlu oyun oynatır, istisna olmadığını ve denge istatistiklerini kontrol eder. */
'use strict';
const path = require('path');
for (const f of ['veri', 'inanc', 'motor']) require(path.join(__dirname, '..', 'assets', 'js', f + '.js'));
const KK = globalThis.KK;

const adet = Number(process.argv[2]) || 400;
const sonuc = { masum: 0, hain: 0 };
const zorlukSonuc = { kolay: [0, 0], normal: [0, 0], zor: [0, 0] }; // [oyuncunun takımı kazandı, toplam]
const takimSonuc = { masum: [0, 0], hain: [0, 0] };
const neden = {};
const turlar = [];
let hata = 0;
let hainAtildi = 0, masumAtildi = 0, oylama = 0, telefonYalan = 0, telefon = 0;
const zorluklar = ['kolay', 'normal', 'zor'];
const t0 = Date.now();

for (let i = 0; i < adet; i++) {
  const ayar = {
    oyuncuSayisi: 7 + (i % 6), otomatik: true, tohum: 1000 + i,
    zorluk: zorluklar[i % 3], olaylar: i % 4 !== 0, medik: i % 5 === 0,
    kimlik: ['gizli', 'takim', 'rol'][i % 3], halBilir: i % 2 === 0
  };
  try {
    const o = new KK.Oyun(ayar);
    const s = o.tamOyun();
    if (!s) throw new Error('oyun bitmedi');
    sonuc[s.kazanan]++;
    const z = zorlukSonuc[ayar.zorluk]; z[1]++; if (o.takim(o.insan()) === s.kazanan) z[0]++;
    const ts = takimSonuc[o.takim(o.insan())]; ts[1]++; if (o.takim(o.insan()) === s.kazanan) ts[0]++;
    neden[s.neden] = (neden[s.neden] || 0) + 1;
    turlar.push(o.tur);
    for (const t of o.kayit) {
      if (t.oylama) {
        oylama++;
        if (t.oylama.atilan != null) (o.hainMi(o.oyuncular[t.oylama.atilan]) ? hainAtildi++ : masumAtildi++);
      }
      if (t.telefon && t.telefon.bilgiler) for (const b of t.telefon.bilgiler) { telefon++; if (b.yalan) telefonYalan++; }
    }
    if (o.sohbet.some((m) => /undefined|NaN|\{\w+\}/.test(m.metin))) throw new Error('bozuk mesaj: ' + o.sohbet.find((m) => /undefined|NaN|\{\w+\}/.test(m.metin)).metin);
  } catch (e) {
    hata++;
    if (hata < 5) console.error('Oyun', i, JSON.stringify(ayar), e.stack);
  }
}

const ort = turlar.reduce((a, b) => a + b, 0) / Math.max(1, turlar.length);
console.log('Oyun:', adet, 'Hata:', hata, 'Süre:', Date.now() - t0, 'ms');
console.log('Kazanan:', sonuc, 'Neden:', neden);
console.log('Oyuncunun takımı kazandı:', Object.entries(zorlukSonuc).map(([k, v]) => k + ' %' + Math.round(100 * v[0] / Math.max(1, v[1]))).join(' · '));
console.log('Oyuncu masumken / hainken kazandı:', Object.entries(takimSonuc).map(([k, v]) => k + ' %' + Math.round(100 * v[0] / Math.max(1, v[1])) + ' (' + v[1] + ')').join(' · '));
console.log('Ortalama tur:', ort.toFixed(2), 'En az/çok:', Math.min(...turlar), Math.max(...turlar));
console.log('Oylama:', oylama, 'Atılan hain:', hainAtildi, 'Atılan masum:', masumAtildi);
console.log('Telefon bilgisi:', telefon, 'Çarpıtılan:', telefonYalan);
process.exit(hata ? 1 : 0);
