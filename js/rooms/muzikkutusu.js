/* Oda: Müzik Kutusu — kurmalı bir müzik kutusu. Silindire pimleri dizerek bir melodi yazarsın, adını koyup öbürüne
   gönderirsin. O, kolu parmağıyla çevirdikçe melodi çalar: ne kadar hızlı çevirirse o kadar hızlı, durursa durur.
   Kayıtlar: muzikkutusu {name, pins: [[adım, nota], ...]} */
(function () {
  'use strict';
  const K = window.K;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  const mine = () => (K.isOwner() ? 'me' : 'her');
  const other = () => (K.isOwner() ? 'her' : 'me');
  const nameOf = (w) => (w === 'me' ? C.myPet : C.herPet);
  const ADIM = 32, NOTA = [84, 83, 81, 79, 77, 76, 74, 72, 71, 67];
  const ADIM_ACI = 30; // her pim adımı için kolun dönmesi gereken derece
  let rows = [], root = null, pins = new Set(), acik = null;
  const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
  // Müzik kutusu tınısı: iki kısmi + hızlı sönüm
  function tin(m) {
    const c = K.audio.ensure && K.audio.ensure();
    if (!c) return;
    const t = c.currentTime, g = c.createGain();
    g.connect(c.destination);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.22, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.001, t + 1.4);
    [1, 2.76].forEach((k, i) => {
      const o = c.createOscillator();
      o.frequency.value = hz(m) * k;
      const gg = c.createGain();
      gg.gain.value = i ? 0.18 : 1;
      o.connect(gg).connect(g);
      o.start(t);
      o.stop(t + 1.5);
    });
  }
  const silindir = (set, aktifAdim, yazilir) =>
    `<div class="mk-silindir ${yazilir ? 'yaz' : ''}" style="--a:${ADIM}">${Array.from({ length: ADIM }, (_, a) => `<div class="mk-kol ${a === aktifAdim ? 'su' : ''}">${NOTA.map((_, i) => `<button type="button" class="mk-pim ${set.has(`${a}:${i}`) ? 'on' : ''}" ${yazilir ? `data-mk-pim="${a}:${i}"` : 'tabindex="-1"'} aria-label="Adım ${a + 1}"></button>`).join('')}</div>`).join('')}</div>`;
  function render() {
    if (!root || K.activeRoom !== 'muzikkutusu') return;
    const gelen = rows.filter((r) => r.who === other()).sort((a, b) => b.at - a.at), giden = rows.filter((r) => r.who === mine()).sort((a, b) => b.at - a.at);
    K.$('#mkListe', root).innerHTML = `<p class="card-eyebrow">${K.esc(K.ek(nameOf(other()), 'den'))} gelen kutular</p>${gelen.length ? gelen.map((r) => `<button type="button" class="mk-kutu" data-mk-ac="${r.id}">🎁 <b>${K.esc(r.data.name)}</b><small>${K.esc(T.fmt(new Date(r.at)))}</small></button>`).join('') : '<p class="muted small">Henüz kutu gelmedi.</p>'}
      ${giden.length ? `<p class="card-eyebrow">Gönderdiklerin</p>${giden.map((r) => `<button type="button" class="mk-kutu mini" data-mk-ac="${r.id}">🎵 ${K.esc(r.data.name)}</button>`).join('')}` : ''}`;
    K.$('#mkYaz', root).innerHTML = `<p class="card-eyebrow">Yeni kutu yaz · ${pins.size} pim</p><div class="mk-kaydir">${silindir(pins, -1, true)}</div>
      <div class="row"><input class="input" id="mkAd" maxlength="40" placeholder="Melodinin adı"><button type="button" class="btn soft small" data-mk-dene>▶ Dene</button><button type="button" class="btn red small" data-mk-gonder>🎁 Gönder</button></div>`;
  }
  function oynatici(r) {
    const set = new Set(r.data.pins.map(([a, i]) => `${a}:${i}`));
    const m = K.ui.modal({
      label: r.data.name,
      cls: 'mk-modal',
      html: `<p class="card-eyebrow">${K.esc(nameOf(r.who))} · müzik kutusu</p><h3>${K.esc(r.data.name)}</h3><div class="mk-sahne"><div class="mk-kaydir" id="mkOyn">${silindir(set, -1, false)}</div>
        <div class="mk-krank" id="mkKrank" aria-label="Kolu çevir"><div class="mk-kol-kol"><i></i></div></div></div><p class="muted small center" id="mkBilgi">Kolu parmağınla çevir.</p>`,
      onClose: () => (acik = null),
    });
    const kr = K.$('#mkKrank', m.el), kol = K.$('.mk-kol-kol', m.el);
    let son = null, toplam = 0, adim = -1;
    const aci = (e) => {
      const b = kr.getBoundingClientRect();
      return (Math.atan2(e.clientY - (b.top + b.height / 2), e.clientX - (b.left + b.width / 2)) * 180) / Math.PI;
    };
    const ilerle = () => {
      const yeni = Math.floor(toplam / ADIM_ACI);
      while (adim < yeni) {
        adim++;
        const a = ((adim % ADIM) + ADIM) % ADIM;
        NOTA.forEach((n, i) => set.has(`${a}:${i}`) && tin(n));
        K.$$('#mkOyn .mk-kol', m.el).forEach((el, k) => el.classList.toggle('su', k === a));
        const sc = K.$('#mkOyn', m.el), ak = K.$$('#mkOyn .mk-kol', m.el)[a];
        ak && sc && (sc.scrollLeft = ak.offsetLeft - sc.clientWidth / 2);
      }
      if (adim >= ADIM && r.who === other()) K.stickers.award('muzikkutusudinle');
    };
    kr.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      kr.setPointerCapture(e.pointerId);
      son = aci(e);
      K.audio.ensure && K.audio.ensure();
    });
    kr.addEventListener('pointermove', (e) => {
      if (son == null) return;
      const a = aci(e);
      let d = a - son;
      if (d > 180) d -= 360;
      if (d < -180) d += 360;
      son = a;
      if (d > 0) toplam += d;
      kol.style.transform = `rotate(${toplam}deg)`;
      ilerle();
    });
    const birak = () => (son = null);
    kr.addEventListener('pointerup', birak);
    kr.addEventListener('pointercancel', birak);
    acik = { cevir: (deg) => ((toplam += deg), (kol.style.transform = `rotate(${toplam}deg)`), ilerle()) };
  }
  K.on('cloud', async (ok) => {
    if (!ok) return;
    rows = await K.cloud.list('muzikkutusu', 100);
    K.cloud.on('muzikkutusu', (r) => rows.some((x) => x.id === r.id) || (rows.push(r), render()));
  });
  K.room({
    id: 'muzikkutusu',
    wing: 'oyun',
    title: 'Müzik Kutusu',
    sub: 'Kolu çevirdikçe çalar',
    icon: 'gift',
    color: '#FFF0F5',
    hidden: () => !K.cloud || !K.cloud.enabled,
    init(el) {
      root = el;
      el.innerHTML = `<div class="room-intro"><p>Silindire pimleri dizerek bir melodi yaz, öbürüne gönder. O kolu parmağıyla çevirdikçe melodi çalar: ne kadar hızlı çevirirse o kadar hızlı.</p></div>
        <section class="card" id="mkListe"></section><section class="card" id="mkYaz"></section>`;
      el.addEventListener('click', async (e) => {
        const p = e.target.closest('[data-mk-pim]');
        if (p) {
          const k = p.dataset.mkPim;
          pins.has(k) ? pins.delete(k) : (pins.add(k), tin(NOTA[+k.split(':')[1]]));
          p.classList.toggle('on', pins.has(k));
          K.$('#mkYaz .card-eyebrow', root).textContent = `Yeni kutu yaz · ${pins.size} pim`;
          return;
        }
        const ac = e.target.closest('[data-mk-ac]');
        if (ac) return oynatici(rows.find((r) => r.id === ac.dataset.mkAc));
        const veri = () => [...pins].map((k) => k.split(':').map(Number)).sort((a, b) => a[0] - b[0]);
        if (e.target.closest('[data-mk-dene]')) return pins.size && oynatici({ who: mine(), data: { name: K.$('#mkAd', root).value.trim() || 'Deneme', pins: veri() } });
        if (!e.target.closest('[data-mk-gonder]')) return;
        if (pins.size < 4) return K.fx.toast('Birkaç pim daha diz.');
        const name = K.$('#mkAd', root).value.trim() || 'Adsız melodi';
        const r = await K.cloud.add('muzikkutusu', { name, pins: veri() });
        if (!r) return;
        rows.some((x) => x.id === r.id) || rows.push(r);
        pins = new Set();
        K.stickers.award('muzikkutusu');
        K.ping(`🎁 ${K.meName()} sana bir müzik kutusu gönderdi: ${name}`, 'Kolu çevir.', ['musical_note'], { click: K.roomUrl('muzikkutusu') });
        render();
      });
    },
    enter() {
      render();
    },
  });
  K.muzikkutusu = { cevir: (d) => acik && acik.cevir(d) };
})();
