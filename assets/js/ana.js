/* Kızıl Kapsül — yönlendirme, ana sayfa etkileşimleri ve simülasyon kurulumu. */
(function (kok) {
  'use strict';
  const KK = kok.KK;
  const $ = (s, k) => (k || document).querySelector(s);
  const $$ = (s, k) => Array.from((k || document).querySelectorAll(s));
  const GORUNUMLER = ['ana', 'oyna', 'oyun', 'kurucu'];
  let ayarDegisti = false;

  function goster(ad) {
    for (const g of GORUNUMLER) { const el = $('#gorunum-' + g); if (el) el.hidden = g !== ad; }
    document.body.dataset.gorunum = ad;
    $$('.ana-nav a[data-hedef]').forEach((a) => a.setAttribute('aria-current', a.dataset.hedef === ad ? 'page' : 'false'));
  }
  KK.Uygulama = { goster };

  function rota() {
    const h = decodeURIComponent(location.hash.slice(1));
    if (h === 'oyun') {
      if (KK.OyunArayuz.aktifMi() || document.body.dataset.gorunum === 'oyun') { goster('oyun'); return; }
      location.replace('#oyna'); return;
    }
    if (document.body.dataset.gorunum === 'oyun') KK.OyunArayuz.cik();
    if (h === 'oyna') { goster('oyna'); rozetleriCiz(); window.scrollTo(0, 0); return; }
    if (h === 'kurucu') { goster('kurucu'); KK.Kurucu.ciz(); window.scrollTo(0, 0); return; }
    goster('ana');
    const hedef = h && h !== 'ana' ? document.getElementById(h) : null;
    if (hedef) requestAnimationFrame(() => hedef.scrollIntoView({ block: 'start' }));
    else window.scrollTo(0, 0);
  }

  /* ---------- kurulum formu ---------- */
  function ayarOku() {
    const f = $('#kurulum-formu');
    const v = (n) => { const el = f.querySelector('[name="' + n + '"]:checked') || f.querySelector('[name="' + n + '"]'); return el ? el.value : null; };
    return {
      insanAd: ($('#kur-ad').value || '').trim() || 'Sen',
      oyuncuSayisi: Number($('#kur-sayi').value),
      zorluk: v('zorluk'),
      insanRol: $('#kur-rol').value,
      lanet: $('#kur-lanet').value,
      kimlik: $('#kur-kimlik').value,
      olaylar: $('#kur-olaylar').checked,
      medik: $('#kur-medik').checked,
      halBilir: $('#kur-halbilir').checked,
      hiz: v('hiz')
    };
  }

  function ayarYaz(a) {
    if (!a) return;
    if (a.insanAd && a.insanAd !== 'Sen') $('#kur-ad').value = a.insanAd;
    if (a.oyuncuSayisi) $('#kur-sayi').value = a.oyuncuSayisi;
    const isaretle = (n, v) => { const el = $('#kurulum-formu [name="' + n + '"][value="' + v + '"]'); if (el) el.checked = true; };
    if (a.zorluk) isaretle('zorluk', a.zorluk);
    if (a.hiz) isaretle('hiz', a.hiz);
    for (const [id, k] of [['kur-rol', 'insanRol'], ['kur-lanet', 'lanet'], ['kur-kimlik', 'kimlik']]) if (a[k]) $('#' + id).value = a[k];
    for (const [id, k] of [['kur-olaylar', 'olaylar'], ['kur-medik', 'medik'], ['kur-halbilir', 'halBilir']]) if (typeof a[k] === 'boolean') $('#' + id).checked = a[k];
    ayarDegisti = true;
  }

  function sayiGoster() {
    const n = Number($('#kur-sayi').value);
    $('#kur-sayi-deger').textContent = n;
    const yanci = n >= 10 ? 2 : 1;
    const medik = $('#kur-medik').checked;
    const kalan = n - 1 - yanci - 2 - (medik ? 1 : 0);
    $('#kur-dagilim').innerHTML = '<i class="rol-cip t-hain">Suikastçı</i> <i class="rol-cip t-hain">Yancı × ' + yanci + '</i> <i class="rol-cip t-masum">Halüsinatif</i> <i class="rol-cip t-masum">Gizli Kaptan</i>' +
      (medik ? ' <i class="rol-cip t-masum">Medik</i>' : '') + ' <i class="rol-cip t-masum">Mürettebat × ' + kalan + '</i>';
    const rol = $('#kur-rol');
    const medikSecenek = rol.querySelector('option[value="medik"]');
    medikSecenek.disabled = !medik;
    if (!medik && rol.value === 'medik') rol.value = 'rastgele';
  }

  function rozetleriCiz() {
    const k = KK.Rozet.kazanilan();
    const kutu = $('#rozet-izgara');
    const sayi = KK.Rozet.liste.filter((r) => k[r.id]).length;
    $('#rozet-sayi').textContent = sayi + ' / ' + KK.Rozet.liste.length;
    kutu.innerHTML = KK.Rozet.liste.map((r) => '<li class="rozet-yama' + (k[r.id] ? ' kazanildi' : '') + '"><b>' + r.ad + '</b><small>' + r.kosul + '</small>' + (k[r.id] ? '<em>' + k[r.id] + '</em>' : '') + '</li>').join('');
  }

  /* ---------- ana sayfa süsleri ---------- */
  function heroAvatarlari() {
    $$('[data-avatar]').forEach((img) => { img.src = KK.avatar(Number(img.dataset.avatar), Number(img.dataset.olcek || 4)); });
  }

  function o2Gostergesi() {
    const el = $('#hero-o2'); if (!el) return;
    const yazi = $('#hero-o2-deger');
    const azHareket = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let v = 38;
    const ciz = () => {
      el.style.setProperty('--o2', v);
      yazi.textContent = '%' + v;
      el.classList.toggle('kritik', v <= 20);
    };
    ciz();
    if (azHareket) return;
    setInterval(() => { v = v <= 9 ? 64 : v - 1; ciz(); }, 2600);
  }

  function rolKartlari() {
    $$('.dosya-kart').forEach((k) => {
      const b = $('.dosya-cevir', k);
      b.addEventListener('click', () => {
        const acik = k.classList.toggle('cevrik');
        b.setAttribute('aria-expanded', acik ? 'true' : 'false');
        b.textContent = acik ? 'Kimliğe dön' : 'Taktikleri gör';
      });
    });
  }

  function basla() {
    heroAvatarlari();
    o2Gostergesi();
    rolKartlari();
    KK.OyunArayuz.bagla();
    KK.Kurucu.bagla();
    KK.Kurucu.sayacCiz();

    try { ayarYaz(JSON.parse(localStorage.getItem('kk-ayar') || 'null')); } catch (e) { /* yok */ }
    $('#kur-sayi').addEventListener('input', sayiGoster);
    $('#kur-medik').addEventListener('change', sayiGoster);
    $$('#kurulum-formu [name="zorluk"]').forEach((r) => r.addEventListener('change', () => {
      if (!ayarDegisti) $('#kur-kimlik').value = r.value === 'kolay' ? 'takim' : 'gizli';
    }));
    $('#kur-kimlik').addEventListener('change', () => { ayarDegisti = true; });
    sayiGoster();
    $('#kurulum-formu').addEventListener('submit', (e) => {
      e.preventDefault();
      const a = ayarOku();
      try { localStorage.setItem('kk-ayar', JSON.stringify(a)); } catch (err) { /* yok */ }
      KK.Ses.uyandir();
      location.hash = '#oyun';
      KK.OyunArayuz.baslat(a);
    });
    window.addEventListener('hashchange', rota);
    rota();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', basla);
  else basla();
})(typeof window !== 'undefined' ? window : globalThis);
