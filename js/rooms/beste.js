/* Oda: Ortak Beste — on altı vuruşluk küçük bir beste masası. Eln melodiyi, Ardoş bası ve ritmi yazar; biri bir kareye
   dokununca iki ekranda da değişir ve döngü çalarken hemen duyulur. Biten parça "Kalenin marşı yap" ile Kalenin
   Melodisi'ne geçer: kale açılırken çalan müzik olur.
   Kayıtlar: beste {track: melodi|bas|ritim, grid: [[adım...] satır başına]} (her izin son kaydı geçerli) */
(function () {
  'use strict';
  const K = window.K;
  const D = window.ELN;
  const C = D.config;

  const nameOf = (w) => (w === 'me' ? C.myPet : C.herPet);
  const ADIM = 16;
  const IZ = {
    melodi: { ad: 'Melodi', kim: 'her', notalar: [88, 86, 84, 81, 79, 76, 74, 72], etiket: ['Mi', 'Re', 'Do', 'La', 'Sol', 'Mi', 'Re', 'Do'] },
    bas: { ad: 'Bas', kim: 'me', notalar: [45, 43, 41, 36], etiket: ['La', 'Sol', 'Fa', 'Do'] },
    ritim: { ad: 'Ritim', kim: 'me', notalar: ['hat', 'snare', 'kick'], etiket: ['Zil', 'Trampet', 'Davul'] },
  };
  let rows = [], root = null, calan = null, adim = 0, bpm = 96;
  const yerel = {}; // kendi izlerimin son hâli (hızlı dokunuşlarda bulut yanıtını beklemeden)
  const mine = () => (K.isOwner() ? 'me' : 'her');
  const bos = (t) => IZ[t].notalar.map(() => Array(ADIM).fill(0));
  const grid = (t) => {
    if (yerel[t]) return yerel[t];
    const r = rows.filter((x) => x.data.track === t).sort((a, b) => b.at - a.at)[0];
    return r ? r.data.grid : bos(t);
  };
  const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
  function ses(t, i, zaman) {
    const c = K.audio.ensure && K.audio.ensure();
    if (!c) return;
    const g = c.createGain();
    g.connect(c.destination);
    if (t === 'ritim') {
      const tur = IZ.ritim.notalar[i];
      if (tur === 'kick') {
        const o = c.createOscillator();
        o.frequency.setValueAtTime(140, zaman);
        o.frequency.exponentialRampToValueAtTime(40, zaman + 0.12);
        g.gain.setValueAtTime(0.5, zaman);
        g.gain.exponentialRampToValueAtTime(0.001, zaman + 0.18);
        o.connect(g);
        o.start(zaman);
        o.stop(zaman + 0.2);
      } else {
        const n = c.createBufferSource(), len = tur === 'hat' ? 0.05 : 0.14;
        const b = c.createBuffer(1, Math.ceil(c.sampleRate * len), c.sampleRate), d = b.getChannelData(0);
        for (let k = 0; k < d.length; k++) d[k] = (Math.random() * 2 - 1) * (1 - k / d.length);
        n.buffer = b;
        const f = c.createBiquadFilter();
        f.type = tur === 'hat' ? 'highpass' : 'bandpass';
        f.frequency.value = tur === 'hat' ? 7000 : 1800;
        g.gain.setValueAtTime(tur === 'hat' ? 0.12 : 0.28, zaman);
        n.connect(f).connect(g);
        n.start(zaman);
      }
      return;
    }
    const o = c.createOscillator();
    o.type = t === 'bas' ? 'triangle' : 'sine';
    o.frequency.value = hz(IZ[t].notalar[i]);
    const v = t === 'bas' ? 0.3 : 0.18, dur = t === 'bas' ? 0.32 : 0.28;
    g.gain.setValueAtTime(0.0001, zaman);
    g.gain.exponentialRampToValueAtTime(v, zaman + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, zaman + dur);
    o.connect(g);
    o.start(zaman);
    o.stop(zaman + dur + 0.02);
  }
  function cal() {
    if (calan) return dur();
    const c = K.audio.ensure && K.audio.ensure();
    if (!c) return;
    K.audio.music && K.audio.music.on && K.audio.music.stop(false);
    adim = 0;
    let sonraki = c.currentTime + 0.05;
    calan = setInterval(() => {
      const aralik = 60 / bpm / 2;
      while (sonraki < c.currentTime + 0.12) {
        Object.keys(IZ).forEach((t) => grid(t).forEach((satir, i) => satir[adim] && ses(t, i, sonraki)));
        const a = adim;
        setTimeout(() => isaret(a), Math.max(0, (sonraki - c.currentTime) * 1000));
        adim = (adim + 1) % ADIM;
        sonraki += aralik;
      }
    }, 25);
    render();
  }
  function dur() {
    clearInterval(calan);
    calan = null;
    isaret(-1);
    render();
  }
  function isaret(a) {
    if (!root) return;
    K.$$('.bs-kol', root).forEach((el) => el.classList.toggle('su', +el.dataset.a === a));
  }
  function render() {
    if (!root || K.activeRoom !== 'beste') return;
    K.$('#bsMasa', root).innerHTML = Object.keys(IZ)
      .map((t) => {
        const z = IZ[t], g = grid(t), benim = z.kim === mine();
        return `<section class="bs-iz ${t} ${benim ? '' : 'kilit'}"><h4>${z.ad} <small>${K.esc(nameOf(z.kim))}${benim ? '' : ' yazıyor'}</small></h4><div class="bs-grid" style="--s:${z.notalar.length}">${Array.from({ length: ADIM }, (_, a) => `<div class="bs-kol ${a % 4 === 0 ? 'vurgu' : ''}" data-a="${a}">${z.notalar.map((_, i) => `<button type="button" class="bs-h ${g[i][a] ? 'on' : ''}" data-bs="${t}" data-i="${i}" data-a="${a}" ${benim ? '' : 'disabled'} aria-label="${z.etiket[i]} ${a + 1}"></button>`).join('')}</div>`).join('')}</div></section>`;
      })
      .join('');
    K.$('#bsCal', root).textContent = calan ? '⏸ Durdur' : '▶ Çal';
  }
  async function degis(t, i, a) {
    const g = grid(t).map((s) => s.slice());
    g[i][a] = g[i][a] ? 0 : 1;
    yerel[t] = g;
    if (g[i][a] && K.audio.ensure && K.audio.ensure()) ses(t, i, K.audio.ctx.currentTime);
    render();
    const r = await K.cloud.add('beste', { track: t, grid: g });
    r && !rows.some((x) => x.id === r.id) && rows.push(r);
  }
  // Melodiyi Kalenin Melodisi'nin nota biçimine çevir: [[midi, önceki notadan ms], ...] (iki tur)
  function notalar() {
    const g = grid('melodi'), ms = (60 / bpm / 2) * 1000, out = [];
    let son = -1;
    for (let tur = 0; tur < 2; tur++)
      for (let a = 0; a < ADIM; a++) {
        const i = g.findIndex((s) => s[a]);
        if (i < 0) continue;
        const t = tur * ADIM + a;
        out.push([IZ.melodi.notalar[i], son < 0 ? 0 : Math.round((t - son) * ms)]);
        son = t;
      }
    return out;
  }
  async function mars() {
    const n = notalar();
    if (n.length < 4) return K.fx.toast('Marş için melodide en az birkaç nota olmalı.');
    const r = await K.cloud.add('mirildan', { name: 'Ortak Beste', notes: n, beste: true });
    if (!r) return;
    await K.cloud.add('kalemelodi', { id: 'm:' + r.id });
    K.stickers.award('beste');
    K.fx.confetti({ count: 120, shapes: ['star'] });
    K.fx.toast('🎼 Ortak beste kalenin marşı oldu. Kalenin Melodisi odasından değiştirebilirsin.', { duration: 4000 });
    K.ping(`🎼 Ortak beste kalenin marşı oldu`, 'Kale açılırken artık bizim bestemiz çalıyor.', ['musical_score'], { click: K.roomUrl('kalemelodi') });
  }
  K.on('cloud', async (ok) => {
    if (!ok) return;
    rows = await K.cloud.list('beste', 300);
    K.cloud.on('beste', (r) => rows.some((x) => x.id === r.id) || (rows.push(r), render()));
  });
  K.room({
    id: 'beste',
    wing: 'oyun',
    title: 'Ortak Beste',
    sub: 'On altı vuruş, iki ekran',
    icon: 'music',
    color: '#EDE7FF',
    hidden: () => !K.cloud || !K.cloud.enabled,
    init(el) {
      root = el;
      el.innerHTML = `<div class="room-intro"><p>On altı vuruşluk küçük bir beste masası. ${K.esc(C.herPet)} melodiyi, ${K.esc(C.myPet)} bası ve ritmi yazıyor. Bir kareye dokununca iki ekranda da değişir; döngü çalarken hemen duyulur.</p></div>
        <div class="row center"><button type="button" class="btn red" id="bsCal" data-bs-cal>▶ Çal</button><label class="bs-tempo">Tempo <input type="range" min="70" max="140" value="96" id="bsTempo"></label></div>
        <div class="bs-masa" id="bsMasa"></div><div class="row center"><button type="button" class="btn soft small" data-bs-mars>🎼 Kalenin marşı yap</button></div>`;
      el.addEventListener('click', (e) => {
        if (e.target.closest('[data-bs-cal]')) return cal();
        if (e.target.closest('[data-bs-mars]')) return mars();
        const h = e.target.closest('[data-bs]');
        if (h) degis(h.dataset.bs, +h.dataset.i, +h.dataset.a);
      });
      el.addEventListener('input', (e) => e.target.id === 'bsTempo' && (bpm = +e.target.value));
    },
    enter() {
      render();
    },
    leave() {
      calan && dur();
    },
  });
  K.beste = { notalar, grid };
})();
