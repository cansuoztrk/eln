/*
  ELN — sayfanın kalbi.
  İçerik şifreli gelir (kasa/icerik.bin), anahtar bağlantıdadır.
  Her şey Bakü saatine göre her gün kendini yeniler.
*/
import { anahtarBul, anahtarYaz, icerikAc, fotoAc, depo } from './kasa.js';
import * as Z from './zaman.js';
import { Sahne } from './sahne.js';
import { Ses } from './ses.js';
import { Ipek } from './ipek.js';
import { zambakSvg, buket, kurutulmus, susCizgi, muhurSvg } from './zambak.js';

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const el = (tag, cls, html) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html != null) e.innerHTML = html;
  return e;
};
const kacis = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const bekle = (ms) => new Promise((r) => setTimeout(r, ms));
const titret = (p) => {
  try {
    navigator.vibrate && navigator.vibrate(p);
  } catch (e) {}
};
const AZ_HAREKET = matchMedia('(prefers-reduced-motion: reduce)').matches;
const sayiYaz = (n) => n.toLocaleString('tr-TR');

let I; // içerik
let A; // anahtar
const ses = new Ses();
const sahne = new Sahne($('#sahne'));
const ipek = new Ipek($('#ipek'));
let sahneVar = false;

/* -------------------------------------------------------------------
   Başlangıç
------------------------------------------------------------------- */
async function basla() {
  A = anahtarBul();
  if (!A) return kilitGoster();
  try {
    I = await icerikAc(A);
  } catch (e) {
    console.warn(e);
    return kilitGoster(true);
  }
  // Bağlantıdaki anahtarı adres çubuğunda tutmaya gerek yok; tarayıcı hatırladı.
  // (Ana ekrana eklenen uygulamada kaybolmasın diye # kısmını yerinde bırakıyoruz.)
  if (!ipek.baslat()) document.documentElement.classList.add('ipeksiz');
  sahneVar = sahne.baslat();
  if (!sahneVar) document.documentElement.classList.add('zerresiz');
  temaAyarla(Z.vakit(Z.an(Z.BAKU).h), true);
  sahne.yaziHazirla(I.kisiler.ad);
  hazirla();
  await giris();
}

function kilitGoster(hatali) {
  document.body.classList.add('kilitli');
  $('#kilit').hidden = false;
  if (hatali) $('.kilit-alt').textContent = 'Bu bağlantı kapıyı açmadı. Bir kez daha dene.';
  $('#anahtarFormu').addEventListener('submit', (e) => {
    e.preventDefault();
    if (anahtarYaz($('#anahtarGirdi').value)) location.reload();
  });
  if (ipek.baslat()) {
    ipek.ambHedef = 0.05;
    ipek.serbest = true;
  } else document.documentElement.classList.add('ipeksiz');
  if (sahne.baslat()) sahne.dimHedef = 0.6;
  temaAyarla(Z.vakit(Z.an(Z.BAKU).h), true);
}

/* -------------------------------------------------------------------
   Metin doldurma
------------------------------------------------------------------- */
function durum() {
  const b = Z.an(Z.BAKU);
  const i = Z.an(Z.IST);
  const t = I.tarihler;
  const gun = b.no - Z.gunNo(t.sevgili) + 1;
  const tanisali = b.no - Z.gunNo(t.tanisma);
  const sevY = +t.sevgili.slice(0, 4);
  const ay = (b.y - sevY) * 12 + (b.m - +t.sevgili.slice(5, 7)) - (b.d < 21 ? 1 : 0);
  return { b, i, gun, tanisali, ay, gunIdx: Math.max(0, b.no - Z.gunNo(t.acilis)), anahtar: Z.gunAnahtari(b) };
}
let D;
function doldur(s, ek = {}) {
  const v = {
    ad: I.kisiler.ad,
    ben: I.kisiler.ben,
    gun: sayiYaz(D.gun),
    tanisali: sayiYaz(D.tanisali),
    km: sayiYaz(I.sehirler.km),
    ay: D.ay,
    bakuSaat: Z.saatYaz(Z.an(Z.BAKU)),
    istSaat: Z.saatYaz(Z.an(Z.IST)),
    ...ek,
  };
  return String(s).replace(/\{(\w+)\}/g, (m, k) => (k in v ? v[k] : m));
}
// Kelimelere böl (yumuşak görünme için)
function kelimeli(metin, baslangic = 0) {
  return kacis(metin)
    .split(/(\s+)/)
    .map((w, j) => (/^\s+$/.test(w) ? w : `<span class="kelime" style="--k:${baslangic + j}">${w}</span>`))
    .join('');
}

/* -------------------------------------------------------------------
   Sayfayı kur
------------------------------------------------------------------- */
function hazirla() {
  D = durum();
  $$('[data-imza]').forEach((e) => (e.textContent = '— ' + I.kisiler.ben));
  // Her parça kendi başına: biri bozulursa diğerleri yine çalışır
  const parcalar = [ziyaretSay, susle, acilisKur, bugunKur, hikayeKur, mesafeKur, galeriKur, mektuplarKur, yazKur, sebeplerKur, sarkilarKur, defterKur, yildizlarKur, kapsulKur, sonKur, menuKur, saatleriBaslat, havaGetir, gozlemci, kaydirma, imlec, dokunusIsigi, sekmeBasligi, gizliAyrintilar, sesDugmesi, lambaKur, imzaKur];
  for (const f of parcalar) {
    try {
      f();
    } catch (e) {
      console.warn(f.name, e);
    }
  }
}

/* ---------- tema: gündüz pudra, gece gül ---------- */
function temaAyarla(v, ilk = false) {
  const q = new URLSearchParams(location.search).get('tema');
  const gunduz = v === 'sabah' || v === 'gun';
  const acik = q ? q === 'acik' : gunduz;
  const kok = document.documentElement;
  kok.dataset.vakit = v;
  kok.dataset.tema = acik ? 'acik' : 'koyu';
  ipek.vakit(acik ? (gunduz ? v : 'gun') : gunduz ? 'aksam' : v);
  if (ilk) ipek.hemen();
  sahne.tema(acik);
  const m = document.querySelector('meta[name="theme-color"]');
  if (m) m.content = acik ? '#f6e6e8' : '#13060d';
}

/* ---------- zambak süsleri ---------- */
function susle() {
  $$('.bolum-bas').forEach((b) => b.insertAdjacentHTML('afterbegin', susCizgi()));
  $('#buketler').innerHTML = buket({ tohum: 3 }).replace('class="buket"', 'class="buket ust-sag kapali"') + buket({ tohum: 8 }).replace('class="buket"', 'class="buket alt-sol kapali"');
  $('#tutIc').innerHTML = zambakSvg({ R: 100, tohum: 12 });
  $('#sonZambak').innerHTML = zambakSvg({ R: 100, tohum: 21, sinif: 'cicek-ac kapali' });
  $('#kagitCicek').innerHTML = kurutulmus(9);
  $('#lambaCicek').innerHTML = zambakSvg({ R: 100, tohum: 14, renk: 'beyaz' });
  $('#menu').insertAdjacentHTML('afterbegin', buket({ tohum: 5 }));
  // Görününce açan zambaklar
  const o = new IntersectionObserver(
    (es) => {
      for (const e of es)
        if (e.isIntersecting) {
          setTimeout(() => e.target.classList.remove('kapali'), 300);
          o.unobserve(e.target);
        }
    },
    { threshold: 0.4 }
  );
  setTimeout(() => $$('.cicek-ac.kapali').forEach((c) => o.observe(c)), 500);
}

/* ---------- ziyaret ---------- */
function ziyaretSay() {
  const z = depo.al('eln.ziyaret', { n: 0, gunler: [], son: null });
  z.n++;
  if (!z.gunler.includes(D.anahtar)) z.gunler.push(D.anahtar);
  z.ilkBugun = z.son !== D.anahtar;
  z.son = D.anahtar;
  depo.koy('eln.ziyaret', z);
  D.ziyaret = z;
}

/* ---------- açılış ---------- */
function acilisKur() {
  const b = D.b;
  $('#tarihYazi').textContent = `${b.d} ${Z.AYLAR[b.m - 1]} ${b.y} · ${Z.GUNLER[b.hg]}`;
  const v = Z.vakit(b.h);
  const secim = Z.gununSecimi(I.selam[v], 'selam' + v, D.gunIdx);
  $('#selam').textContent = doldur(secim.oge);
  $('#acilisAd').textContent = I.kisiler.ad;
  $('#sayacAlt').textContent = `birlikte · ${Z.isoUzun(I.tarihler.sevgili)}’dan beri`;
  $('#bugunBaslik').textContent = `Seninle ${sayiYaz(D.gun)}. günüm`;
  $('#ustOrta').textContent = `${sayiYaz(D.gun)}. gün`;
}

function sayacGuncelle() {
  // Sevgili olduğumuz gün, Bakü gece yarısından beri
  const t = I.tarihler.sevgili;
  const bas = Date.UTC(+t.slice(0, 4), +t.slice(5, 7) - 1, +t.slice(8, 10), -Z.BAKU);
  let f = Math.max(0, Z.simdiMs() - bas) / 1000;
  const g = Math.floor(f / 86400);
  f -= g * 86400;
  const s = Math.floor(f / 3600);
  f -= s * 3600;
  const d = Math.floor(f / 60);
  const sn = Math.floor(f - d * 60);
  const yaz = (k, v) => {
    const e = $(`#sayac [data-s="${k}"]`);
    if (e.textContent !== v) e.textContent = v;
  };
  yaz('g', sayiYaz(g));
  yaz('s', String(s).padStart(2, '0'));
  yaz('d', String(d).padStart(2, '0'));
  yaz('sn', String(sn).padStart(2, '0'));
}

/* ---------- bugün ---------- */
function bugunKur() {
  // Özel gün
  const oz = Z.ozelGun(D.b, I.tarihler);
  if (oz.length) {
    const o = oz[0];
    const kutu = $('#ozelGun');
    kutu.hidden = false;
    kutu.innerHTML = `<p class="ozel-ust">✦ ✦ ✦</p><p>${kacis(doldur(I.ozel[o.tur], { yil: o.yil, ay: o.ay }))}</p>`;
    document.documentElement.dataset.ozel = o.tur;
  }
  // Not
  const not = Z.gununSecimi(I.notlar, 'not', D.gunIdx);
  $('#gununNotu').textContent = doldur(not.oge);
  // Soru
  soruKur();
  // Sebep ve şarkı önizleme
  const acikSebep = sebepSayisi();
  $('#sebepMini').textContent = doldur(I.sebepler[acikSebep - 1]);
  const sarki = Z.gununSecimi(I.sarkilar, 'sarki', D.gunIdx);
  $('#sarkiMini').innerHTML = `${kacis(sarki.oge.ad)}<small>${kacis(sarki.oge.sanatci)}</small>`;
  // Yaklaşanlar
  const y = Z.yaklasanlar(D.b, I.tarihler).slice(0, 4);
  $('#yaklasan').innerHTML = y
    .map((x) => `<div class="yaklasan-oge"><b>${x.kalan === 0 ? '✦' : x.kalan}</b><span>${x.kalan === 0 ? 'bugün' : 'gün'}</span><p>${kacis(x.ad)}</p></div>`)
    .join('');
  // Ay
  ayCiz();
}

function soruKur() {
  const s = Z.gununSecimi(I.sorular, 'soru', D.gunIdx);
  const soru = s.oge;
  $('#soruNo').textContent = `No. ${String(s.index + 1).padStart(3, '0')}`;
  $('#gununSorusu').textContent = doldur(soru.q);
  const cevaplar = depo.al('eln.cevaplar', {});
  const mevcut = cevaplar[D.anahtar];
  const form = $('#soruFormu');
  const hal = $('#cevapHali');
  const goster = (c) => {
    form.hidden = true;
    hal.hidden = false;
    $('#cevapMetni').textContent = c.a;
    $('#cevapTarih').textContent = `${Z.isoUzun(D.anahtar)} · ${c.saat || ''}`;
    if (soru.a) {
      $('#benCevap').hidden = false;
      $('#benMetin').textContent = doldur(soru.a);
    }
  };
  if (mevcut && mevcut.q === soru.q) goster(mevcut);
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const a = $('#cevap').value.trim();
    if (!a) {
      $('#cevap').focus();
      return;
    }
    const c = { q: soru.q, a, saat: Z.saatYaz(Z.an(Z.BAKU)) };
    const hepsi = depo.al('eln.cevaplar', {});
    hepsi[D.anahtar] = c;
    depo.koy('eln.cevaplar', hepsi);
    ses.pirilti();
    sahne.nabiz(0.8);
    titret([12, 60, 18]);
    goster(c);
    defterKur();
    bildir('Kalbime kaydedildi.');
  });
  $('#cevapDuzenle').addEventListener('click', () => {
    const c = depo.al('eln.cevaplar', {})[D.anahtar];
    $('#cevap').value = c ? c.a : '';
    form.hidden = false;
    hal.hidden = true;
    $('#cevap').focus();
  });
  $('#cevapGonder').textContent = doldur(I.ayrinti.gonderSoru);
  $('#cevapGonder').addEventListener('click', () => {
    const c = depo.al('eln.cevaplar', {})[D.anahtar];
    if (c) paylas(`Günün sorusu: ${c.q}\n\n${c.a}\n\n— ${I.kisiler.ad}`);
  });
}

function ayCiz() {
  const a = Z.ayEvresi();
  $('#ayAd').textContent = a.ad;
  // Aydınlık kısım: iki yarım elips
  const r = 46;
  const f = a.f;
  const buyuyen = f < 0.5;
  const k = Math.cos(2 * Math.PI * f); // 1 yeni ay, -1 dolunay
  const rx = Math.abs(k) * r;
  const sag = buyuyen; // kuzey yarımkürede büyüyen ay sağdan aydınlanır
  const dis = `M 0 ${-r} A ${r} ${r} 0 0 ${sag ? 1 : 0} 0 ${r}`;
  const ic = `A ${rx} ${r} 0 0 ${(k > 0) === sag ? 0 : 1} 0 ${-r}`;
  $('#ay .ay-isik').setAttribute('d', a.isik < 0.02 ? '' : dis + ' ' + ic + ' Z');
}

/* ---------- saatler ---------- */
function saatleriBaslat() {
  const tik = () => {
    const b = Z.an(Z.BAKU);
    const i = Z.an(Z.IST);
    $$('[data-saat="baku"]').forEach((e) => (e.textContent = Z.saatYaz(b)));
    $$('[data-saat="ist"]').forEach((e) => (e.textContent = Z.saatYaz(i)));
    sayacGuncelle();
    // Gün değiştiyse sayfayı yenile (gece yarısını burada geçirirse)
    if (Z.gunAnahtari(b) !== D.anahtar && !document.hidden) location.reload();
    if (document.documentElement.dataset.vakit !== Z.vakit(b.h)) temaAyarla(Z.vakit(b.h));
    // 21:21
    if (b.h === 21 && b.mi === 21 && !tik.oldu) {
      tik.oldu = true;
      bildir(doldur(I.ozel.saat2121), 9000);
      sahne.nabiz(1);
      sahne.hedef('kalp');
      ses.kalp(0.8);
      titret([30, 120, 30, 120, 60]);
    }
  };
  tik();
  setInterval(tik, 1000);
}

/* ---------- hava (Bakü ve İstanbul) ---------- */
const HAVA = (kod, ruzgar) => {
  if (kod === 0) return 'açık';
  if (kod <= 2) return 'parçalı bulutlu';
  if (kod === 3) return 'kapalı';
  if (kod <= 48) return 'sisli';
  if (kod <= 57) return 'çiseliyor';
  if (kod <= 67) return 'yağmurlu';
  if (kod <= 77) return 'kar yağıyor';
  if (kod <= 82) return 'sağanak';
  if (kod <= 86) return 'kar sağanağı';
  return 'fırtınalı';
};
async function havaGetir() {
  const getir = async (lat, lon) => {
    const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,wind_speed_10m,is_day`);
    if (!r.ok) throw 0;
    return (await r.json()).current;
  };
  try {
    const [b, i] = await Promise.all([getir(40.41, 49.87), getir(41.01, 28.98)]);
    const yaz = (h) => {
      let s = `${Math.round(h.temperature_2m)}° · ${HAVA(h.weather_code)}`;
      if (h.wind_speed_10m >= 25) s += ', rüzgârlı';
      return s;
    };
    $('#havaBaku').textContent = yaz(b);
    $('#havaIst').textContent = yaz(i);
    const yagiyor = (b.weather_code >= 51 && b.weather_code <= 67) || (b.weather_code >= 80 && b.weather_code <= 82) || b.weather_code >= 95;
    if (yagiyor || new URLSearchParams(location.search).has('yagmur')) yagmurBaslat();
  } catch (e) {
    $('#havaBaku').textContent = 'rüzgârlar şehri';
    $('#havaIst').textContent = 'martılar şehri';
  }
}
let yagmurVar = false;
function yagmurBaslat() {
  yagmurVar = true;
  const y = $('#yagmur');
  y.hidden = false;
  const n = innerWidth < 600 ? 46 : 90;
  for (let i = 0; i < n; i++) {
    const d = el('i');
    d.style.left = Math.random() * 110 + '%';
    d.style.animationDuration = 0.9 + Math.random() * 0.9 + 's';
    d.style.animationDelay = -Math.random() * 2 + 's';
    d.style.opacity = 0.3 + Math.random() * 0.7;
    y.appendChild(d);
  }
  requestAnimationFrame(() => y.classList.add('var'));
  mektuplarKur();
  setTimeout(() => bildir(I.ayrinti.yagmur, 7000), 4000);
}

/* ---------- hikâye ---------- */
function hikayeKur() {
  const liste = $('#hikayeListe');
  liste.innerHTML = '';
  I.hikaye.forEach((h, n) => {
    const a = el('article', 'hikaye-bolumu');
    const rakam = doldur(h.rakam || '');
    a.innerHTML = `
      <span class="hikaye-nokta"></span>
      ${rakam ? `<span class="hikaye-rakam" aria-hidden="true">${kacis(rakam)}</span>` : ''}
      <p class="eyebrow" data-goster>${kacis(h.tarih)}</p>
      <h3 class="hikaye-baslik" data-goster style="--i:1">${kelimeli(doldur(h.baslik))}</h3>
      ${h.metin
        .map((m, j) => {
          const t = doldur(m);
          const vurgu = t.length < 34 ? ' vurgu' : '';
          return `<p class="satir${vurgu}" data-goster style="--i:${j + 2}">${kacis(t)}</p>`;
        })
        .join('')}
      ${n === 5 || n === I.hikaye.length - 1 ? `<div class="hikaye-cicek cicek-ac kapali" style="--r:${n === 5 ? -10 : 14}deg">${zambakSvg({ R: 100, tohum: n * 3 + 1, renk: n === 5 ? 'pembe' : 'beyaz' })}</div>` : ''}`;
    liste.appendChild(a);
  });
}

/* ---------- mesafe ---------- */
function mesafeKur() {
  const m = I.mesafe;
  $('#mesafeMetin').textContent = doldur(m.metin);
  $('#mesafeIpucu').textContent = m.tut;
  $('#mesafeSonraMetin').textContent = m.sonra;
  const km = I.sehirler.km;
  const dugme = $('#tutDugme');
  const kmEl = $('#mesafeKm');
  let p = 0;
  let basili = false;
  let raf;
  let sonKalp = 0;
  let bitti = false;
  const SURE = 3.4;
  const dongu = (now) => {
    const dt = Math.min(0.25, (now - (dongu.son || now)) / 1000);
    dongu.son = now;
    if (basili && !bitti) p = Math.min(1, p + dt / SURE);
    else if (!bitti) p = Math.max(0, p - dt / 1.2);
    const e = 1 - Math.pow(1 - p, 2.2);
    dugme.style.setProperty('--p', p);
    kmEl.textContent = sayiYaz(Math.round(km * (1 - e)));
    sahne.hug = e;
    if (basili && !bitti) {
      const aralik = 900 - 520 * p;
      if (now - sonKalp > aralik) {
        sonKalp = now;
        ses.kalp(0.6 + p * 0.5);
        sahne.nabiz(0.4 + p * 0.6);
        titret(p > 0.6 ? [18, 90, 24] : [12]);
      }
    }
    if (p >= 1 && !bitti) {
      bitti = true;
      basili = false;
      dugme.classList.remove('basili');
      kmEl.textContent = '0';
      $('#mesafeIpucu').textContent = '';
      $('#mesafeSonra').hidden = false;
      ses.pirilti(0);
      sahne.nabiz(1.4);
      titret([40, 80, 40, 80, 220]);
      setTimeout(() => {
        bitti = false;
        p = 0.999;
      }, 9000);
    }
    if (p > 0 || basili) raf = requestAnimationFrame(dongu);
    else {
      raf = null;
      dongu.son = null;
    }
  };
  const bas = (e) => {
    e.preventDefault();
    basili = true;
    dugme.classList.add('basili');
    $('#mesafeIpucu').textContent = m.birak;
    if (!raf) raf = requestAnimationFrame(dongu);
  };
  const birak = () => {
    if (!basili) return;
    basili = false;
    dugme.classList.remove('basili');
    if (!bitti) $('#mesafeIpucu').textContent = m.tut;
  };
  dugme.addEventListener('pointerdown', bas);
  addEventListener('pointerup', birak);
  addEventListener('pointercancel', birak);
  dugme.addEventListener('contextmenu', (e) => e.preventDefault());
  dugme.addEventListener('keydown', (e) => (e.key === ' ' || e.key === 'Enter') && bas(e));
  dugme.addEventListener('keyup', birak);
  $('#sarilGonder').addEventListener('click', () => paylas(m.gonder));
}

/* ---------- galeri ---------- */
async function galeriKur() {
  const fotolar = I.fotolar || [];
  if (!fotolar.length) return;
  $('#yuzun').hidden = false;
  const g = $('#galeri');
  for (const f of fotolar) {
    const fig = el('figure', 'foto');
    fig.setAttribute('data-goster', '');
    fig.innerHTML = `<div class="cerceve"><img alt="" loading="lazy"></div><figcaption>${kacis(doldur(f.not || ''))}</figcaption>`;
    g.appendChild(fig);
    fotoAc(A, f.id)
      .then((url) => {
        $('img', fig).src = url;
        fig.addEventListener('click', () => isikKutusu(url, doldur(f.not || '')));
      })
      .catch(() => fig.remove());
  }
  // En sevdiği ilk fotoğraf açılışta adın arkasında belli belirsiz durur
  const kapak = fotolar.find((f) => f.kapak) || fotolar[0];
  fotoAc(A, kapak.id)
    .then((url) => {
      const k = $('#kamee');
      $('img', k).src = url;
      k.hidden = false;
      requestAnimationFrame(() => k.classList.add('var'));
    })
    .catch(() => {});
  gozlemci();
}
function isikKutusu(url, not) {
  const k = $('#isikKutusu');
  $('#isikResim').src = url;
  $('#isikNot').textContent = not;
  k.hidden = false;
  k.onclick = () => (k.hidden = true);
}

/* ---------- mektuplar ---------- */
function mektupDurumu(m) {
  const b = D.b;
  if (!m.kilit) return { acik: true };
  if (m.kilit === 'gece') return b.h < 5 ? { acik: true, yeni: true } : { acik: false, alt: 'gece yarısından sonra açılır' };
  if (m.kilit === 'yagmur') return yagmurVar ? { acik: true, yeni: true } : { acik: false, alt: 'Bakü’de yağmur yağınca açılır' };
  const kalan = Z.gunNo(m.kilit) - b.no;
  if (kalan <= 0) return { acik: true, yeni: kalan > -3 };
  return { acik: false, alt: `${Z.isoUzun(m.kilit)} · ${kalan} gün` };
}
const ZARF_RENK = ['#f7e6e2', '#f6dde3', '#efe3d8', '#f3d6dc', '#f8ece6'];
function zarfHtml(baslik, alt, harf, n = 0) {
  const r = Z.mulberry32(n * 31 + 7);
  const cicek = n % 3 === 1 ? `<span class="zarf-cicek">${kurutulmus(n + 2)}</span>` : '';
  return `<span class="zarf-govde" style="--zarf-renk:${ZARF_RENK[n % ZARF_RENK.length]};--egim:${((r() - 0.5) * 3).toFixed(2)}deg"><span class="zarf-kapak"></span><span class="muhur">${muhurSvg(harf, n + 3)}</span>${cicek}</span>
    <span class="zarf-baslik">${kacis(baslik)}</span><span class="zarf-alt">${kacis(alt)}</span>`;
}
function mektuplarKur() {
  const kap = $('#zarflar');
  kap.innerHTML = '';
  const harf = I.kisiler.ben[0];
  I.mektuplar.forEach((m, n) => {
    const d = mektupDurumu(m);
    const z = el('button', 'zarf' + (d.acik ? '' : ' kilitli') + (d.yeni ? ' yeni' : ''));
    z.type = 'button';
    z.setAttribute('data-goster', '');
    z.setAttribute('data-imlec', '');
    z.style.setProperty('--i', n % 4);
    z.innerHTML = zarfHtml(m.baslik, d.acik ? (d.yeni ? 'şimdi açıldı' : 'aç') : d.alt, harf, n);
    z.addEventListener('click', async () => {
      if (!d.acik) {
        z.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-5px)' }, { transform: 'translateX(5px)' }, { transform: 'translateX(0)' }], { duration: 380 });
        titret(20);
        bildir(`Bu mektup ${d.alt.includes('·') ? d.alt.split('·')[0].trim() + ' günü' : d.alt}.`);
        return;
      }
      z.classList.add('aciliyor');
      ses.pirilti(m.id === 'uyku' ? -12 : 0);
      titret([10, 40, 14]);
      await bekle(650);
      mektupOku({ ust: I.kisiler.ben + '’dan', baslik: m.baslik + ' aç', govde: m.govde, imza: I.kisiler.ben });
      setTimeout(() => z.classList.remove('aciliyor'), 900);
      const okunan = depo.al('eln.okunan', {});
      okunan[m.id] = D.anahtar;
      depo.koy('eln.okunan', okunan);
    });
    kap.appendChild(z);
  });
  if (kap.isConnected) gozlemci();
}

function mektupOku({ ust, baslik, govde, imza }) {
  const o = $('#okuyucu');
  $('#okuyucuUst').textContent = ust || '';
  $('#okuyucuBaslik').textContent = baslik;
  const g = $('#okuyucuGovde');
  g.innerHTML = govde.map((p, i) => `<p style="--i:${i}">${kacis(doldur(p))}</p>`).join('');
  const im = $('#okuyucuImza');
  im.textContent = imza || '';
  im.style.setProperty('--gecikme', 0.6 + govde.length * 0.42 + 0.4 + 's');
  o.hidden = false;
  o.classList.remove('gidiyor');
  o.scrollTop = 0;
  document.body.style.overflow = 'hidden';
  const kapat = () => {
    o.classList.add('gidiyor');
    setTimeout(() => {
      o.hidden = true;
      document.body.style.overflow = '';
    }, 650);
    removeEventListener('keydown', esc);
  };
  const esc = (e) => e.key === 'Escape' && kapat();
  addEventListener('keydown', esc);
  $$('[data-kapat]', o).forEach((b) => (b.onclick = kapat));
  $('.kagit-kapat', o).focus({ preventScroll: true });
}

/* ---------- sen de bana yaz ---------- */
function yazKur() {
  const y = I.yaz;
  $('#yazBaslik').textContent = y.baslik;
  $('#yazAlt').textContent = y.alt;
  $('#yazHitap').textContent = y.hitap;
  const ta = $('#yazMetin');
  const sayac = () => ($('#yazSayac').textContent = ta.value.trim() ? `${ta.value.trim().split(/\s+/).length} kelime` : '');
  ta.addEventListener('input', sayac);
  const taslak = depo.al('eln.taslak', '');
  if (taslak) ta.value = taslak;
  ta.addEventListener('input', () => depo.koy('eln.taslak', ta.value));
  sayac();
  const listele = () => {
    const l = depo.al('eln.mektuplarim', []);
    $('#yazilanlar').innerHTML = l
      .slice()
      .reverse()
      .map((m) => `<li><span class="tarih">${kacis(Z.isoUzun(m.t))} · mühürlü</span><p>${kacis(m.m)}</p></li>`)
      .join('');
  };
  listele();
  $('#yazFormu').addEventListener('submit', async (e) => {
    e.preventDefault();
    const metin = ta.value.trim();
    if (!metin) return ta.focus();
    const anim = $('#muhurAnim');
    $('.muhur', anim).innerHTML = muhurSvg(I.kisiler.ad[0], 11);
    anim.hidden = false;
    ses.pirilti(-5);
    titret([10, 30, 70]);
    await bekle(1500);
    const l = depo.al('eln.mektuplarim', []);
    l.push({ t: D.anahtar, m: metin });
    depo.koy('eln.mektuplarim', l);
    depo.koy('eln.taslak', '');
    ta.value = '';
    sayac();
    listele();
    anim.hidden = true;
    bildir(y.gonderildi);
    paylas(`${y.hitap}\n\n${metin}\n\n— ${I.kisiler.ad}`);
  });
}

/* ---------- sebepler ---------- */
function sebepSayisi() {
  return Math.min(I.sebepler.length, 21 + D.gunIdx);
}
function sebeplerKur() {
  const toplam = I.sebepler.length;
  const acik = sebepSayisi();
  let i = acik - 1;
  const cizgiler = $('#sebepCizgiler');
  cizgiler.innerHTML = I.sebepler.map((_, n) => `<i data-n="${n}" class="${n < acik ? 'acik' : ''}${n === acik - 1 ? ' bugun' : ''}"></i>`).join('');
  const goster = (yeni, anim = true) => {
    i = Math.max(0, Math.min(acik - 1, yeni));
    const m = $('#sebepMetni');
    const yaz = () => {
      m.textContent = doldur(I.sebepler[i]);
      $('#sebepNo').textContent = `No. ${i + 1}${i === acik - 1 ? ' · bugün açıldı' : ''}`;
      $$('i', cizgiler).forEach((c, n) => c.classList.toggle('secili', n === i));
      $('#sebepGeri').disabled = i === 0;
      $('#sebepIleri').disabled = i === acik - 1;
      m.classList.remove('degisiyor');
    };
    if (!anim) return yaz();
    m.classList.add('degisiyor');
    setTimeout(yaz, 380);
  };
  $('#sebepGeri').onclick = () => goster(i - 1);
  $('#sebepIleri').onclick = () => goster(i + 1);
  cizgiler.addEventListener('click', (e) => {
    const n = +e.target.dataset.n;
    if (!isNaN(n) && n < acik) goster(n);
  });
  // Kaydırarak
  let x0 = null;
  const kap = $('#sebepMetni');
  kap.addEventListener('touchstart', (e) => (x0 = e.touches[0].clientX), { passive: true });
  kap.addEventListener('touchend', (e) => {
    if (x0 == null) return;
    const dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 40) goster(i + (dx < 0 ? 1 : -1));
    x0 = null;
  });
  goster(i, false);
  $('#sebepAlt').textContent =
    acik < toplam ? `${toplam} sebebin ${acik} tanesi açık. Yarın bir tane daha.` : `${toplam} sebebin hepsi açık. Ama liste bitmedi; sadece yazmaya yer kalmadı.`;
}

/* ---------- şarkılar ---------- */
const linkler = (s) => {
  const q = encodeURIComponent(`${s.sanatci === 'Geleneksel' || s.sanatci.includes('halk') ? '' : s.sanatci + ' '}${s.ad}`);
  return `<a class="dugme" href="https://open.spotify.com/search/${q}" target="_blank" rel="noopener" data-imlec>Spotify</a>
          <a class="dugme ince" href="https://www.youtube.com/results?search_query=${q}" target="_blank" rel="noopener" data-imlec>YouTube</a>`;
};
function sarkilarKur() {
  const s = Z.gununSecimi(I.sarkilar, 'sarki', D.gunIdx);
  const o = s.oge;
  $('#gununSarkisi').innerHTML = `
    <div class="plak-sar"><div class="plak"><span class="plak-etiket">${zambakSvg({ R: 100, tohum: s.index + 2 })}</span></div></div>
    <div class="sarki-bilgi">
      <p class="eyebrow">No. ${String(s.index + 1).padStart(2, '0')} · bugünün şarkısı</p>
      <h3>${kacis(o.ad)}</h3>
      <p class="sanatci">${kacis(o.sanatci)}</p>
      <p class="sarki-notu">${kacis(doldur(o.not))}</p>
      <div class="sarki-linkler">${linkler(o)}</div>
    </div>`;
  const ol = $('#sarkiListe');
  ol.innerHTML = '';
  I.sarkilar.forEach((x, n) => {
    const li = el('li');
    li.innerHTML = `<button class="sarki-satir${n === s.index ? ' bugun' : ''}" type="button" data-imlec>
        <span class="no">${String(n + 1).padStart(2, '0')}</span><span class="ad">${kacis(x.ad)}</span><span class="kim">${kacis(x.sanatci)}</span>
      </button><div class="sarki-acik" hidden><p>${kacis(doldur(x.not))}</p><div class="sarki-linkler">${linkler(x)}</div></div>`;
    $('button', li).addEventListener('click', () => {
      const a = $('.sarki-acik', li);
      a.hidden = !a.hidden;
    });
    ol.appendChild(li);
  });
}

/* ---------- cevap defteri ---------- */
function defterKur() {
  const c = depo.al('eln.cevaplar', {});
  const g = Object.keys(c).sort().reverse();
  const kap = $('#defterListe');
  if (!g.length) return;
  $('#defter').hidden = false;
  kap.innerHTML = g
    .map(
      (k) => `<article class="defter-kayit" data-goster>
        <p class="defter-tarih">${kacis(Z.isoUzun(k))}</p>
        <p class="defter-soru">${kacis(c[k].q)}</p>
        <p class="defter-cevap">${kacis(c[k].a)}</p>
      </article>`
    )
    .join('');
  gozlemci();
  menuKur();
}

/* ---------- bir gün: takımyıldız ---------- */
function yildizlarKur() {
  const svg = $('#yildizSvg');
  const liste = I.gelecek;
  const n = liste.length;
  const ns = 'http://www.w3.org/2000/svg';
  // Kalp eğrisi üzerinde yıldızlar (son yıldız kalbin tam ortasında)
  // Kalbin çevresine eşit aralıklarla (yay uzunluğuna göre) dizilir; tepedeki çukurdan başlar
  const kalpXY = (t) => [16 * Math.pow(Math.sin(t), 3), 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)];
  const ince = [];
  for (let k = 0; k <= 600; k++) ince.push(kalpXY((k / 600) * Math.PI * 2));
  const birikim = [0];
  for (let k = 1; k < ince.length; k++) birikim.push(birikim[k - 1] + Math.hypot(ince[k][0] - ince[k - 1][0], ince[k][1] - ince[k - 1][1]));
  const L = birikim[birikim.length - 1];
  const noktalar = [];
  for (let i = 0; i < n - 1; i++) {
    const hedef = (i / (n - 1)) * L;
    let k = birikim.findIndex((v) => v >= hedef);
    if (k < 0) k = ince.length - 1;
    const [x, y] = ince[k];
    const r = Z.mulberry32(i * 977 + 3);
    noktalar.push([50 + x * 2.7 + (r() - 0.5) * 1.6, 47 - y * 2.7 + (r() - 0.5) * 1.6]);
  }
  noktalar.push([50, 52]);
  const bulunan = new Set(depo.al('eln.yildizlar', []));
  let secili = -1;
  svg.innerHTML = `<defs><radialGradient id="yildizIsik"><stop offset="0" stop-color="#fff3d6" stop-opacity="1"/><stop offset="1" stop-color="#f2deb3" stop-opacity="0"/></radialGradient></defs>`;
  // Arka plandaki silik yıldızlar
  const r = Z.mulberry32(42);
  for (let i = 0; i < 70; i++) {
    const c = document.createElementNS(ns, 'circle');
    c.setAttribute('cx', (r() * 104 - 2).toFixed(2));
    c.setAttribute('cy', (r() * 104 - 2).toFixed(2));
    c.setAttribute('r', (0.12 + r() * 0.28).toFixed(2));
    c.setAttribute('fill', `rgba(242,222,179,${(0.1 + r() * 0.35).toFixed(2)})`);
    svg.appendChild(c);
  }
  const yol = document.createElementNS(ns, 'path');
  yol.setAttribute('class', 'yildiz-yol');
  svg.appendChild(yol);
  const yolCiz = () => {
    // Bulunan yıldızları kalp sırasıyla birleştir
    const sira = [...Array(n - 1).keys()].filter((i) => bulunan.has(i));
    if (sira.length < 2) return yol.setAttribute('d', '');
    let d = '';
    for (let k = 0; k < sira.length; k++) {
      const [x, y] = noktalar[sira[k]];
      const onceki = k > 0 ? sira[k - 1] : -1;
      d += (k === 0 || sira[k] !== onceki + 1 ? 'M' : 'L') + x.toFixed(2) + ' ' + y.toFixed(2) + ' ';
    }
    if (bulunan.has(0) && bulunan.has(n - 2)) d += `M${noktalar[n - 2][0].toFixed(2)} ${noktalar[n - 2][1].toFixed(2)} L${noktalar[0][0].toFixed(2)} ${noktalar[0][1].toFixed(2)}`;
    yol.setAttribute('d', d);
    const tamam = bulunan.size >= n;
    $('#takimyildiz').classList.toggle('tamam', tamam);
  };
  const gruplar = noktalar.map(([x, y], i) => {
    const g = document.createElementNS(ns, 'g');
    g.setAttribute('class', 'yildiz' + (bulunan.has(i) ? ' bulundu' : ''));
    g.style.setProperty('--i', i);
    g.setAttribute('tabindex', '0');
    g.setAttribute('role', 'button');
    g.setAttribute('aria-label', `Yıldız ${i + 1}`);
    const son = i === n - 1;
    g.innerHTML = `<circle class="yildiz-alan" cx="${x}" cy="${y}" r="5"/><circle class="yildiz-hale" cx="${x}" cy="${y}" r="${son ? 4.5 : 3.2}"/><circle class="yildiz-ic" cx="${x}" cy="${y}" r="${son ? 1.1 : 0.75}"/>`;
    const sec = () => {
      secili = i;
      bulunan.add(i);
      depo.koy('eln.yildizlar', [...bulunan]);
      gruplar.forEach((gg, j) => {
        gg.classList.toggle('secili', j === i);
        gg.classList.toggle('bulundu', bulunan.has(j));
      });
      const m = $('#yildizMetin');
      m.classList.add('degisiyor');
      setTimeout(() => {
        const tamam = bulunan.size >= n;
        m.innerHTML = `${kacis(doldur(liste[i]))}<small>${bulunan.size} / ${n}${tamam ? ' · hepsi senin' : ''}</small>`;
        m.classList.remove('degisiyor');
      }, 350);
      yolCiz();
      ses.pirilti(5 + (i % 5) * 2);
      sahne.nabiz(0.3);
      titret(8);
    };
    g.addEventListener('click', sec);
    g.addEventListener('keydown', (e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), sec()));
    svg.appendChild(g);
    return g;
  });
  yolCiz();
  $('#yildizMetin').innerHTML = `<small>${bulunan.size ? `${bulunan.size} / ${n}` : 'Her yıldızın altında bir “bir gün” var.'}</small>`;

  // On yıl sonraki benden
  const o = I.onYil;
  const z = $('#onYilZarf');
  z.innerHTML = zarfHtml(o.baslik, o.alt, I.kisiler.ben[0]).replace('<span class="zarf-kapak"></span>', `<span class="zarf-kapak"></span><span class="zarf-yil">${kacis(o.tarih.slice(-4))}</span>`);
  z.addEventListener('click', async () => {
    z.classList.add('aciliyor');
    ses.pirilti(-12);
    await bekle(700);
    mektupOku({ ust: o.tarih, baslik: o.baslik, govde: o.govde, imza: I.kisiler.ben });
    setTimeout(() => z.classList.remove('aciliyor'), 900);
  });
}

/* ---------- zaman kapsülü ---------- */
function kapsulKur() {
  const k = I.kapsul;
  $('#kapsulBaslik').textContent = k.baslik;
  $('#kapsulAlt').textContent = k.alt;
  const md = I.tarihler.sevgili.slice(5);
  const sonraki = () => {
    let y = D.b.y;
    if (Z.gunNo(`${y}-${md}`) <= D.b.no) y++;
    return `${y}-${md}`;
  };
  const ciz = () => {
    const kayit = depo.al('eln.kapsul', null);
    const form = $('#kapsulFormu');
    const kil = $('#kapsulKilitli');
    if (!kayit) {
      form.hidden = false;
      kil.hidden = true;
      return;
    }
    form.hidden = true;
    kil.hidden = false;
    if (D.b.no >= Z.gunNo(kayit.acilis)) {
      kil.innerHTML = `${kacis(k.acik)}<br><br><span style="color:var(--inci);font-size:22px">${kacis(kayit.m)}</span><b>${kacis(Z.isoUzun(kayit.t))}</b>`;
    } else {
      kil.innerHTML = `${kacis(doldur(k.kilitli, { tarih: Z.isoUzun(kayit.acilis) }))}<b>${Z.gunNo(kayit.acilis) - D.b.no} gün</b>`;
    }
  };
  $('#kapsulFormu').addEventListener('submit', (e) => {
    e.preventDefault();
    const m = $('#kapsulMetin').value.trim();
    if (!m) return;
    depo.koy('eln.kapsul', { t: D.anahtar, m, acilis: sonraki() });
    ses.pirilti(-7);
    titret([10, 50, 10]);
    ciz();
  });
  ciz();
}

/* ---------- son ---------- */
function sonKur() {
  const s = $('#sonMetin');
  s.innerHTML = I.son
    .map((p, i) => {
      const t = doldur(p);
      return `<p class="son-p${i > 0 && t.length < 20 ? ' kisa' : ''}" data-goster>${kacis(t)}</p>`;
    })
    .join('');
  $('#sonDiller').innerHTML = I.sonDiller.map((d, i) => `<p class="dil" data-goster style="--i:${i * 3}">${kacis(d)}</p>`).join('');
  $('#yarin').textContent = I.yarin;
  $('#ziyaret').textContent = doldur(I.ayrinti.ziyaret, { n: D.ziyaret.n });
}

/* ---------- menü ---------- */
function menuKur() {
  const bolumler = [
    ['bugun', 'I', 'Bugün'],
    ['hikaye', 'II', 'Hikâyemiz'],
    ['mesafe', 'III', 'Mesafe'],
    ['yuzun', 'IV', 'Yüzün'],
    ['mektuplar', 'V', 'Mektuplar'],
    ['sebepler', 'VI', 'Sebepler'],
    ['sarkilar', 'VII', 'Şarkılarımız'],
    ['defter', 'VIII', 'Cevap defteri'],
    ['birgun', 'IX', 'Bir gün'],
    ['son', 'X', 'Son söz'],
  ].filter(([id]) => !$('#' + id).hidden);
  $('#menuListe').innerHTML = bolumler
    .map(([id, no, ad], i) => `<li style="--i:${i}"><a href="#${id}" data-imlec><span class="menu-no">${no}</span><span class="menu-ad">${ad}</span></a></li>`)
    .join('');
  $('#menuAlt').textContent = `${Z.uzunTarih(D.b)} · ${sayiYaz(D.gun)}. gün`;
}
function menuAcKapat() {
  const m = $('#menu');
  const ac = () => {
    m.hidden = false;
    m.classList.remove('gidiyor');
    document.body.style.overflow = 'hidden';
  };
  const kapat = () => {
    m.classList.add('gidiyor');
    setTimeout(() => {
      m.hidden = true;
      document.body.style.overflow = '';
    }, 550);
  };
  $('#menuAc').addEventListener('click', ac);
  $('#menuKapat').addEventListener('click', kapat);
  m.addEventListener('click', (e) => {
    const a = e.target.closest('a');
    if (a) {
      e.preventDefault();
      kapat();
      setTimeout(() => $(a.getAttribute('href')).scrollIntoView({ behavior: AZ_HAREKET ? 'auto' : 'smooth' }), 300);
    }
  });
  addEventListener('keydown', (e) => e.key === 'Escape' && !m.hidden && kapat());
}

/* -------------------------------------------------------------------
   Görünme, kaydırma, sahne geçişleri
------------------------------------------------------------------- */
let io;
function gozlemci() {
  if (!io)
    io = new IntersectionObserver(
      (es) => {
        for (const e of es)
          if (e.isIntersecting) {
            e.target.classList.add('gorundu');
            io.unobserve(e.target);
          }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.12 }
    );
  $$('[data-goster]:not(.gorundu)').forEach((e) => io.observe(e));
}

function kaydirma() {
  const ray = $('#ray');
  const rayKm = $('#rayKm');
  const buketler = $('#buketler');
  const ust = $('#ust');
  const bolumler = $$('main > section');
  const hikayeler = () => $$('.hikaye-bolumu');
  const ip = $('#hikayeIp');
  const hk = $('#hikaye .hikaye-kap');
  const km = I.sehirler.km;
  let sonSahne = null;
  let bekliyor = false;
  const guncelle = () => {
    bekliyor = false;
    const y = scrollY;
    const h = innerHeight;
    const max = document.documentElement.scrollHeight - h;
    const p = max > 0 ? Math.min(1, Math.max(0, y / max)) : 0;
    ray.style.setProperty('--p', p.toFixed(4));
    rayKm.textContent = `${sayiYaz(Math.round(km * (1 - p)))} km`;
    ust.classList.toggle('dolu', y > h * 0.6);
    buketler.classList.toggle('saklan', y > h * 0.55);
    ray.classList.toggle('saklan', y < h * 0.5);
    sahne.scroll = y / h;
    ipek.scroll = y / h;
    // Okurken ipek biraz kısılır, açılışta parlar
    if (girisBitti) {
      const k = Math.min(1, y / h);
      ipek.isikHedef[2] = 0.8 - k * 0.32;
      ipek.ambHedef = 0.075 - k * 0.02;
    }
    // Hangi bölümdeyiz? Ekranın ortasına göre
    const orta = h * 0.5;
    let aktif = bolumler[0];
    for (const b of bolumler) {
      if (b.hidden) continue;
      const r = b.getBoundingClientRect();
      if (r.top <= orta && r.bottom > orta) aktif = b;
    }
    const hedef = aktif.dataset.sahne || 'gok';
    if (girisBitti && hedef !== sonSahne) {
      sonSahne = hedef;
      sahne.hedef(hedef);
      sahne.dimHedef = hedef === 'gok' ? 0.55 : hedef === 'kalp' ? 0.85 : 1;
      if (hedef !== 'ikiz') sahne.hug = 0;
    }
    // Hikâye ipi ve paralaks rakamlar
    if (hk) {
      const r = hk.getBoundingClientRect();
      const pp = Math.min(1, Math.max(0, (orta - r.top) / r.height));
      ip.style.setProperty('--p', pp.toFixed(4));
      for (const a of hikayeler()) {
        const ar = a.getBoundingClientRect();
        a.classList.toggle('aktif', ar.top < orta);
        if (ar.bottom > -100 && ar.top < h + 100) {
          const rk = $('.hikaye-rakam', a);
          if (rk) rk.style.setProperty('--py', ((ar.top - h * 0.3) * -0.18).toFixed(1) + 'px');
        }
      }
    }
  };
  addEventListener(
    'scroll',
    () => {
      if (!bekliyor) {
        bekliyor = true;
        requestAnimationFrame(guncelle);
      }
    },
    { passive: true }
  );
  addEventListener('resize', guncelle);
  kaydirmaGuncelle = guncelle;
  guncelle();
}
let girisBitti = false;
let kaydirmaGuncelle = () => {};

/* -------------------------------------------------------------------
   Giriş töreni: karanlıkta bir ipek, üstünde mühürlü bir zarf.
   Mühre basılı tutunca kalp atışı; mühür kırılır, zarf açılır,
   mektupta adı el yazısıyla yazılır, sonra mektup yıldız tozuna döner.
------------------------------------------------------------------- */
function elYaz(svg, veri, { sure = 2600, gecikme = 0 } = {}) {
  if (!svg || !veri) return Promise.resolve();
  svg.setAttribute('viewBox', `0 0 ${veri.w} ${veri.h}`);
  svg.innerHTML = veri.d.map((d) => `<path d="${d}"/>`).join('');
  const yollar = $$('path', svg);
  const uz = yollar.map((p) => p.getTotalLength());
  const toplam = uz.reduce((x, y) => x + y, 0) || 1;
  let t = gecikme;
  yollar.forEach((p, i) => {
    const L = uz[i];
    p.style.strokeDasharray = L;
    p.style.strokeDashoffset = L;
    const d = Math.max(120, (sure * L) / toplam);
    p.animate([{ strokeDashoffset: L }, { strokeDashoffset: 0 }], { duration: AZ_HAREKET ? 1 : d, delay: AZ_HAREKET ? 0 : t, easing: 'cubic-bezier(.5,.1,.5,.95)', fill: 'forwards' });
    t += d * 0.9;
  });
  return bekle(AZ_HAREKET ? 50 : t + 250).then(() => svg.classList.add('doldu'));
}

function merkez(e) {
  const r = e.getBoundingClientRect();
  return [(r.left + r.width / 2) / innerWidth, (r.top + r.height / 2) / innerHeight];
}

async function giris() {
  const g = $('#giris');
  const satirlar = $('#girisSatirlar');
  g.hidden = false;
  sahne.dim = 0;
  sahne.dimHedef = 0.22;
  ipek.ambHedef = 0.025;
  ipek.isigaGotur(0.5, 0.42, 0.3);
  const ilk = D.ziyaret.n === 1 || D.ziyaret.ilkBugun;
  const metin = ilk ? I.giris.ilk : I.giris.tekrar;
  let gecildi = false;
  const gec = $('#girisGec');
  if (!ilk) gec.hidden = false;
  gec.onclick = (e) => {
    e.stopPropagation();
    gecildi = true;
  };

  // Işık parmağı izler
  const isikTakip = (e) => {
    if (g.dataset.tut) return;
    ipek.isigaGotur(e.clientX / innerWidth, e.clientY / innerHeight);
  };
  g.addEventListener('pointermove', isikTakip);

  for (let i = 0; i < metin.length && !gecildi; i++) {
    const sat = el('span', 'giris-satir' + (i === metin.length - 1 && ilk ? ' son' : ''));
    sat.textContent = metin[i];
    satirlar.appendChild(sat);
    await bekle(60);
    sat.classList.add('var');
    ipek.isikHedef[2] = 0.3 + (i + 1) * 0.08;
    await bekle(ilk ? (i === metin.length - 1 ? 1900 : 2300) : 1400);
  }
  satirlar.classList.add('gidiyor');
  await bekle(gecildi ? 0 : 900);

  // Zarf
  const gz = $('#gz');
  const muhur = $('#gzMuhur');
  const zarf = $('#gzZarf');
  const muhurIc = muhurSvg(I.kisiler.ben[0], 5);
  $$('.mum', gz).forEach((m) => (m.innerHTML = muhurIc));
  $('#gzCicek').outerHTML = kurutulmus(4);
  $('#mektupSus').innerHTML = zambakSvg({ R: 100, tohum: 6 });
  $('#girisIpucu').textContent = I.giris.tut;
  gz.hidden = false;
  await bekle(400);
  const [mx, my] = merkez(muhur);
  ipek.isigaGotur(mx, my - 0.06, 0.55);

  // Zarf parmağa doğru hafifçe eğilir
  const egim = (e) => {
    const x = e.clientX / innerWidth - 0.5;
    const y = e.clientY / innerHeight - 0.5;
    zarf.style.setProperty('--ry', (x * 14).toFixed(2) + 'deg');
    zarf.style.setProperty('--rx', (-y * 12).toFixed(2) + 'deg');
  };
  g.addEventListener('pointermove', egim);

  if (!gecildi)
    await new Promise((coz) => {
      let p = 0;
      let basili = false;
      let son = 0;
      let sonKalp = 0;
      let bitti = false;
      const SURE = ilk ? 2.8 : 1.4;
      const dongu = (now) => {
        if (bitti) return;
        const dt = Math.min(0.25, (now - (son || now)) / 1000);
        son = now;
        p = basili ? Math.min(1, p + dt / SURE) : Math.max(0, p - dt / 0.9);
        muhur.style.setProperty('--p', p.toFixed(4));
        ipek.isikHedef[2] = 0.55 + p * 0.9;
        ipek.ambHedef = 0.025 + p * 0.05;
        sahne.dimHedef = 0.22 + p * 0.3;
        if (basili && now - sonKalp > 1000 - p * 450) {
          sonKalp = now;
          ses.kalp(0.7 + p * 0.4);
          sahne.nabiz(0.4 + p);
          ipek.ptr = [ipek.isik[0], ipek.isik[1], 0.6 + p * 0.6];
          titret([16, 110, 22]);
        }
        if (p >= 1 || gecildi) {
          bitti = true;
          return coz();
        }
        requestAnimationFrame(dongu);
      };
      requestAnimationFrame(dongu);
      const bas = async (e) => {
        if (e.target.closest('.giris-gec')) return;
        basili = true;
        g.dataset.tut = '1';
        muhur.classList.add('basili');
        ipek.isigaGotur(mx, my - 0.04);
        if (!ses.acik && depo.al('eln.ses', true)) {
          await ses.ac();
          $('#sesDugme').classList.add('acik');
        }
        ses.kalp(0.7);
        titret(16);
      };
      const birak = () => {
        basili = false;
        delete g.dataset.tut;
        muhur.classList.remove('basili');
      };
      g.addEventListener('pointerdown', bas);
      g.addEventListener('pointerup', birak);
      g.addEventListener('pointercancel', birak);
      g.addEventListener('pointerleave', birak);
      g.addEventListener('contextmenu', (e) => e.preventDefault());
    });

  // Mühür kırılır, zarf açılır
  g.removeEventListener('pointermove', egim);
  zarf.style.setProperty('--rx', '0deg');
  zarf.style.setProperty('--ry', '0deg');
  titret([40, 60, 120]);
  if (ses.acik) {
    ses.muzigiBaslat(D.anahtar);
    ses.pirilti(-5);
  }
  sahne.nabiz(1.4);
  ipek.ptr = [ipek.isik[0], ipek.isik[1], 1.2];
  gz.classList.add('kirildi');
  const h = gecildi ? 0.25 : 1;
  await bekle(650 * h);
  gz.classList.add('acik');
  setTimeout(() => gz.classList.add('astarli'), 420 * h);
  await bekle(900 * h);
  gz.classList.add('cikti');
  await bekle(1100 * h);
  gz.classList.add('buyudu');
  const [lx, ly] = merkez($('#gzMektup'));
  ipek.isigaGotur(lx, ly - 0.12, 1.25);
  await bekle(900 * h);

  // El yazısıyla adı
  await elYaz($('#gzEl'), I.elYazisi && I.elYazisi[I.kisiler.ad + ','], { sure: gecildi ? 400 : ilk ? 2700 : 1700 });
  const satir = $('#gzSatir');
  satir.innerHTML = kelimeli(doldur(I.giris.mektup));
  requestAnimationFrame(() => satir.classList.add('gorundu'));
  await bekle(gecildi ? 300 : 1500);
  const imza = $('#gzImza');
  imza.textContent = '— ' + I.kisiler.ben;
  imza.classList.add('var');
  await bekle(gecildi ? 300 : ilk ? 2400 : 1400);

  // Mektup yıldız tozuna döner, gökyüzünde adı olur
  sahne.kartKonumu($('#gzMektup').getBoundingClientRect());
  sahne.dim = 0;
  sahne.hedef('kart', 0.01, true);
  await bekle(90);
  girisBitti = true;
  sahne.dimHedef = 1;
  sahne.hedef('ad', 3.6, true);
  sahne.nabiz(1.2);
  ses.pirilti(0);
  gz.classList.add('dagildi');
  $('#ana').hidden = false;
  $('#ust').hidden = false;
  $('#ray').hidden = false;
  document.body.classList.remove('kilitli');
  scrollTo(0, 0);
  ipek.ambHedef = 0.075;
  ipek.isikHedef[2] = 0.8;
  ipek.serbest = true;
  kaydirmaGuncelle();
  g.classList.add('bitiyor');
  g.removeEventListener('pointermove', isikTakip);
  setTimeout(() => $$('#buketler .buket').forEach((b, i) => setTimeout(() => b.classList.remove('kapali'), i * 500)), 600);
  await bekle(1900);
  g.hidden = true;
  gozlemci();
  kayanYildizlar();
  if (ilk && D.ziyaret.n === 1) setTimeout(() => bildir(I.giris.hosgeldin, 5000), 900);
}

/* -------------------------------------------------------------------
   Kayan yıldız ve dilek
------------------------------------------------------------------- */
function kayanYildizlar() {
  if (AZ_HAREKET || !I.dilek) return;
  const k = $('#kayan');
  let sayi = 0;
  const kur = (ms) => setTimeout(at, ms);
  const at = () => {
    if (sayi > 6) return;
    if (document.hidden || !$('#okuyucu').hidden || !$('#menu').hidden || !$('#dilek').hidden || !$('#lamba').hidden) return kur(15000);
    sayi++;
    const x0 = innerWidth * (0.45 + Math.random() * 0.5);
    const y0 = innerHeight * (0.06 + Math.random() * 0.22);
    k.style.setProperty('--x0', x0 + 'px');
    k.style.setProperty('--y0', y0 + 'px');
    k.style.setProperty('--x1', x0 - innerWidth * 0.42 + 'px');
    k.style.setProperty('--y1', y0 + innerWidth * 0.19 + 'px');
    k.hidden = false;
    k.style.animation = 'none';
    k.offsetWidth;
    k.style.animation = '';
    setTimeout(() => (k.hidden = true), 1900);
    kur(45000 + Math.random() * 50000);
  };
  k.onclick = () => {
    k.hidden = true;
    dilekAc();
  };
  kur(22000 + Math.random() * 15000);
}
function dilekAc() {
  const d = $('#dilek');
  $('#dilekSoru').textContent = I.dilek.soru;
  $('#dilekAlt').textContent = I.dilek.alt;
  d.hidden = false;
  ses.pirilti(12);
  titret([8, 40, 8]);
  const kapat = () => (d.hidden = true);
  $('#dilekKapat').onclick = kapat;
  $('#dilekFormu').onsubmit = (e) => {
    e.preventDefault();
    const m = $('#dilekMetin').value.trim();
    if (m) {
      const l = depo.al('eln.dilekler', []);
      l.push({ t: D.anahtar, m });
      depo.koy('eln.dilekler', l);
      $('#dilekMetin').value = '';
      bildir(I.dilek.kaydet);
      sahne.nabiz(0.8);
    }
    kapat();
  };
}

/* -------------------------------------------------------------------
   Gece lambası
------------------------------------------------------------------- */
function lambaKur() {
  if (!I.lamba) return ($('#lambaDugme').hidden = true);
  $('#lambaYazi').textContent = I.lamba.dugme;
  $('#lambaAlt').textContent = I.lamba.alt;
  $('#lambaDugme').addEventListener('click', lambaAc);
}
function lambaAc() {
  const l = $('#lamba');
  const alev = $('.alev', l);
  const satir = $('#lambaSatir');
  l.hidden = false;
  l.classList.remove('gidiyor', 'uyku');
  document.body.style.overflow = 'hidden';
  let i = 0;
  let acik = true;
  const titre = () => {
    if (!acik) return;
    const sx = 0.92 + Math.random() * 0.14;
    const sy = 0.9 + Math.random() * 0.18;
    const r = (Math.random() - 0.5) * 6;
    alev.style.transition = `transform ${90 + Math.random() * 140}ms ease-out`;
    alev.style.transform = `scale(${sx.toFixed(3)}, ${sy.toFixed(3)}) rotate(${r.toFixed(2)}deg)`;
    setTimeout(titre, 90 + Math.random() * 160);
  };
  titre();
  const yaz = async () => {
    while (acik) {
      satir.classList.add('gidiyor');
      await bekle(2400);
      if (!acik) break;
      satir.textContent = doldur(I.lamba.satirlar[i % I.lamba.satirlar.length]);
      satir.classList.remove('gidiyor');
      i++;
      await bekle(7000);
    }
  };
  yaz();
  if (!ses.acik && depo.al('eln.ses', true)) {
    ses.ac().then(() => {
      ses.muzigiBaslat(D.anahtar);
      $('#sesDugme').classList.add('acik');
    });
  }
  const uyku = setTimeout(() => l.classList.add('uyku'), 15 * 60e3);
  const kapat = () => {
    acik = false;
    clearTimeout(uyku);
    clearTimeout(son);
    l.classList.add('gidiyor');
    setTimeout(() => {
      l.hidden = true;
      document.body.style.overflow = '';
    }, 1300);
  };
  const son = setTimeout(kapat, 40 * 60e3);
  l.onclick = kapat;
}

/* ---------- son imza: el yazısıyla ---------- */
function imzaKur() {
  const kutu = $('#imza');
  $('#imzaYazi').textContent = I.imza;
  const veri = I.elYazisi && I.elYazisi[I.imza];
  if (!veri) {
    kutu.innerHTML = `<p style="font-family:var(--el);font-size:72px;margin:0;color:var(--altin-acik);text-align:center">${kacis(I.imza)}</p>`;
    return;
  }
  const svg = $('#imzaSvg');
  svg.setAttribute('viewBox', `0 0 ${veri.w} ${veri.h}`);
  const o = new IntersectionObserver(
    (es) => {
      if (es.some((e) => e.isIntersecting)) {
        o.disconnect();
        setTimeout(() => {
          elYaz(svg, veri, { sure: 3400 }).then(() => kutu.classList.add('doldu'));
          sahne.nabiz(0.6);
        }, 500);
      }
    },
    { threshold: 0.6 }
  );
  o.observe(kutu);
}

/* -------------------------------------------------------------------
   Küçük ayrıntılar
------------------------------------------------------------------- */
function sesDugmesi() {
  const d = $('#sesDugme');
  d.addEventListener('click', async () => {
    if (ses.acik) {
      ses.muzigiDurdur();
      ses.kapat();
      d.classList.remove('acik');
      depo.koy('eln.ses', false);
    } else {
      await ses.ac();
      ses.muzigiBaslat(D.anahtar);
      d.classList.add('acik');
      depo.koy('eln.ses', true);
    }
  });
  document.addEventListener('visibilitychange', () => {
    if (!ses.ctx) return;
    if (document.hidden) ses.ctx.suspend();
    else if (ses.acik) ses.ctx.resume();
  });
}

function sekmeBasligi() {
  const asil = I.kisiler.ad;
  document.title = asil;
  document.addEventListener('visibilitychange', () => {
    document.title = document.hidden ? I.ayrinti.sekme : asil;
  });
}

let bildiriZaman;
function bildir(metin, sure = 3600) {
  const b = $('#bildiri');
  b.textContent = metin;
  b.classList.add('var');
  clearTimeout(bildiriZaman);
  bildiriZaman = setTimeout(() => b.classList.remove('var'), sure);
}

async function paylas(metin) {
  try {
    if (navigator.share) {
      await navigator.share({ text: metin });
      return;
    }
  } catch (e) {
    if (e && e.name === 'AbortError') return;
  }
  window.open('https://wa.me/?text=' + encodeURIComponent(metin), '_blank', 'noopener');
}

function imlec() {
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches || AZ_HAREKET) return;
  document.body.classList.add('imlecli');
  const k = $('.imlec');
  const nokta = $('i', k);
  const halka = $('b', k);
  let x = innerWidth / 2;
  let y = innerHeight / 2;
  let hx = x;
  let hy = y;
  addEventListener('pointermove', (e) => {
    x = e.clientX;
    y = e.clientY;
    nokta.style.transform = `translate(${x}px, ${y}px)`;
    k.classList.toggle('ustunde', !!e.target.closest('[data-imlec], a, button, textarea, input, summary, .yildiz'));
  });
  const d = () => {
    hx += (x - hx) * 0.16;
    hy += (y - hy) * 0.16;
    halka.style.transform = `translate(${hx.toFixed(1)}px, ${hy.toFixed(1)}px)`;
    requestAnimationFrame(d);
  };
  d();
}

function dokunusIsigi() {
  if (AZ_HAREKET) return;
  addEventListener(
    'pointerdown',
    (e) => {
      if (e.pointerType !== 'touch' || e.target.closest('textarea, input, .tut, .giris')) return;
      const d = el('span', 'dokunus');
      d.style.left = e.clientX + 'px';
      d.style.top = e.clientY + 'px';
      document.body.appendChild(d);
      setTimeout(() => d.remove(), 1300);
    },
    { passive: true }
  );
}

function gizliAyrintilar() {
  // Monograma uzun bas: küçük bir sır
  const m = $('#menuAc');
  let z;
  m.addEventListener('pointerdown', () => {
    z = setTimeout(() => {
      z = 'oldu';
      bildir(I.ayrinti.gizliAd, 5000);
      sahne.nabiz(1);
      titret([20, 60, 20]);
    }, 900);
  });
  m.addEventListener('pointerup', () => clearTimeout(z));
  m.addEventListener('pointerleave', () => clearTimeout(z));
  m.addEventListener(
    'click',
    (e) => {
      if (z === 'oldu') {
        e.stopImmediatePropagation();
        z = null;
      }
    },
    true
  );
  menuAcKapat();
}

/* -------------------------------------------------------------------
   Çevrimdışı açılış
------------------------------------------------------------------- */
if ('serviceWorker' in navigator && location.protocol === 'https:') {
  addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}

basla();
