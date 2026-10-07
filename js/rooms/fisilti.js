/* Oda: Yastık Fısıltıları — birbirimize otuz kısa fısıltı bırakırız ("İyi geceler prensesim", "Buradayım"...).
   Fısıltılar yastığın altında durur; liste görünmez, sürpriz kalır. Biri Birlikte Uyuyalım'da "Uyuyorum" deyince,
   beş dakika sonra (kale açıksa) öbürünün bıraktığı fısıltılardan henüz çalmamış biri çok alçak sesle çalar.
   Aynı fısıltı otuz gece tekrar etmez. İstersen "Şimdi bir tane" ile de dinlersin.
   Kayıtlar: fisilti {audio, dur} */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;

  const mine = () => (K.isOwner() ? 'me' : 'her');
  const other = () => (K.isOwner() ? 'her' : 'me');
  const nameOf = (w) => (w === 'me' ? C.myPet : C.herPet);
  const ORNEK = ['İyi geceler prensesim', 'Buradayım', 'Yarın daha güzel olacak', 'Gözlerini kapat, elini tutuyorum', 'Rüyanda görüşürüz', 'Seninle gurur duyuyorum', 'Uyurken bile seni düşünüyorum', 'Bugün de çok güzeldin'];
  let rows = [], root = null, timer = 0;
  const icin = () => rows.filter((r) => r.who === other());
  const benim = () => rows.filter((r) => r.who === mine());
  const caldi = () => K.store.get('fisiltiCaldi', []);
  function sec() {
    const list = icin();
    if (!list.length) return null;
    let played = caldi().filter((id) => list.some((r) => r.id === id));
    if (played.length >= list.length) played = [];
    const left = list.filter((r) => !played.includes(r.id));
    const r = left[Math.floor(Math.random() * left.length)];
    K.store.set('fisiltiCaldi', played.concat(r.id).slice(-60));
    return r;
  }
  async function fisilda(auto) {
    const r = sec();
    if (!r) return !auto && K.fx.toast(`${nameOf(other())} henüz yastığının altına fısıltı bırakmadı.`);
    const ov = K.el(`<div class="fs-ov" aria-live="polite"><div class="fs-ay"></div><p>🌙 ${K.esc(nameOf(r.who))} fısıldıyor...</p></div>`);
    document.body.appendChild(ov);
    requestAnimationFrame(() => ov.classList.add('in'));
    await K.medya.cal(r.data.audio, { volume: auto ? 0.35 : 0.8, onEnd: () => setTimeout(() => (ov.classList.remove('in'), setTimeout(() => ov.remove(), 600)), 1200) });
    ov.addEventListener('click', () => (K.medya.sus(), ov.remove()));
    K.stickers.award('fisilti');
  }
  function render() {
    if (!root || K.activeRoom !== 'fisilti') return;
    const n = icin().length, b = benim().length;
    K.$('#fsYastik', root).innerHTML = `<div class="fs-yastik" aria-hidden="true"><span></span></div><p class="center"><b>Yastığının altında ${n} fısıltı var.</b><br><small class="muted">${n ? `Birlikte Uyuyalım'da "Uyuyorum" dediğinde beş dakika sonra biri kendiliğinden çalar.` : `${K.esc(nameOf(other()))} bıraktıkça burada birikecek.`}</small></p>
      <div class="row center"><button type="button" class="btn soft" data-fs-simdi ${n ? '' : 'disabled'}>🌙 Şimdi bir tane</button></div>`;
    K.$('#fsBenim', root).innerHTML = `<p class="card-eyebrow">${K.esc(K.ek(nameOf(other()), 'in'))} yastığına · ${b}/30</p>
      <div class="fs-boncuk" aria-label="${b} fısıltı">${Array.from({ length: 30 }, (_, i) => `<i class="${i < b ? 'on' : ''}"></i>`).join('')}</div>
      <p class="muted small">Çok kısa ve çok alçak sesle. Fikir: ${K.esc(ORNEK[b % ORNEK.length])}</p>
      <div class="row center"><button type="button" class="btn red" data-fs-kaydet ${b >= 30 ? 'disabled' : ''}>🎙 Fısıltı kaydet</button></div>`;
  }
  K.on('cloud', async (ok) => {
    if (!ok) return;
    rows = await K.cloud.list('fisilti', 120);
    K.cloud.on('fisilti', (r) => rows.some((x) => x.id === r.id) || (rows.push(r), render()));
    // Birlikte Uyuyalım: ben "Uyuyorum" deyince beş dakika sonra bir fısıltı
    K.cloud.on('sleep', (r) => {
      if (r.who !== mine() || !icin().length) return;
      clearTimeout(timer);
      timer = setTimeout(() => document.visibilityState === 'visible' && fisilda(true), 5 * 60e3);
    });
    K.cloud.on('uyandim', (r) => r.who === mine() && clearTimeout(timer));
  });
  K.room({
    id: 'fisilti',
    wing: 'kalp',
    title: 'Yastık Fısıltıları',
    sub: 'Uyurken kulağına',
    icon: 'moon',
    color: '#E6E1FF',
    hidden: () => !K.cloud || !K.cloud.enabled,
    badge: () => (icin().length ? `${icin().length} fısıltı` : ''),
    init(el) {
      root = el;
      el.innerHTML = `<div class="room-intro"><p>Birbirimize otuz kısa fısıltı bırakırız. Liste görünmez, yastığın altında durur. Birlikte Uyuyalım'da "Uyuyorum" dediğinde beş dakika sonra biri çok alçak sesle çalar; aynısı otuz gece tekrar etmez.</p></div>
        <section class="card fs-kart" id="fsYastik"></section><section class="card" id="fsBenim"></section>`;
      el.addEventListener('click', async (e) => {
        if (e.target.closest('[data-fs-simdi]')) return fisilda(false);
        const b = e.target.closest('[data-fs-kaydet]');
        if (!b) return;
        const res = await K.medya.kaydet(b, 15);
        if (!res) return;
        const r = await K.cloud.add('fisilti', { audio: res.audio, dur: res.dur });
        if (!r) return;
        rows.some((x) => x.id === r.id) || rows.push(r);
        K.stickers.award('fisiltibirak');
        if (benim().length === 1 || benim().length % 10 === 0) K.ping(`🌙 ${K.meName()} yastığının altına fısıltı bıraktı`, `Şu an ${benim().length} fısıltı var. Uyurken birini duyacaksın.`, ['crescent_moon'], { click: K.roomUrl('fisilti') });
        render();
      });
    },
    enter() {
      render();
    },
  });
  K.fisilti = { fisilda, count: () => icin().length };
})();
