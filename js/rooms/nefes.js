/* Oda: Birlikte Nefes — uyumadan ya da sınavdan önce 4-7-8 nefesi: dört saniye al, yedi saniye tut, sekiz saniye ver.
   Biri başlatınca öbürünün ekranında "katıl" çıkar; ikiniz de aynı başlangıç anını kullandığınız için daireler aynı
   ritimde büyüyüp küçülür. Öbürünün dairesi yanında soluk görünür; ikiniz de nefes alırken daireler tek daireye birleşir.
   Dört tur sonra biter. Canlı: nefes {t: 'basla'|'var'|'bitti', start} · Kayıtlar: nefes {tur, birlikte} */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;

  const mine = () => (K.isOwner() ? 'me' : 'her');
  const other = () => (K.isOwner() ? 'her' : 'me');
  const nameOf = (w) => (w === 'me' ? C.myPet : C.herPet);
  const EVRE = [['Al', 4], ['Tut', 7], ['Ver', 8]];
  const TUR = EVRE.reduce((a, e) => a + e[1], 0);
  const KAC = 4;
  let root = null, start = 0, oStart = 0, oAt = 0, raf = 0, beat = 0, birlikteOldu = false;
  const oVar = () => oStart && Date.now() - oAt < 3000;
  function state(st) {
    const t = (Date.now() - st) / 1000;
    if (t < 0) return { faz: 'Hazır ol', s: 0, tur: 0, bitti: false, kalan: Math.ceil(-t) };
    const tur = Math.floor(t / TUR);
    let r = t % TUR;
    for (const [n, d] of EVRE) {
      if (r < d) {
        const k = r / d;
        const s = n === 'Al' ? k : n === 'Tut' ? 1 : 1 - k;
        return { faz: n, s, tur, bitti: tur >= KAC, kalan: Math.ceil(d - r) };
      }
      r -= d;
    }
    return { faz: 'Ver', s: 0, tur, bitti: true };
  }
  function draw() {
    if (!root || K.activeRoom !== 'nefes') return;
    const me = start ? state(start) : null;
    const ot = oVar() ? state(oStart) : null;
    const scale = (x) => (0.45 + 0.55 * x).toFixed(3);
    const c1 = K.$('#nfBen', root), c2 = K.$('#nfO', root);
    c1.style.transform = `scale(${me ? scale(me.s) : 0.45})`;
    c2.style.transform = `scale(${ot ? scale(ot.s) : 0.45})`;
    c2.style.opacity = ot ? '1' : '0';
    const ayni = me && ot && Math.abs(start - oStart) < 400;
    K.$('#nfSahne', root).classList.toggle('bir', Boolean(ayni));
    if (ayni && !birlikteOldu) {
      birlikteOldu = true;
      K.audio.sfx.chime();
    }
    K.$('#nfYazi', root).innerHTML = me ? (me.bitti ? '<b>Bitti</b><span>Omuzların biraz daha hafif mi?</span>' : `<b>${me.faz}</b><span>${me.kalan} · ${me.tur + 1}/${KAC}. tur${ayni ? ` · ${K.esc(nameOf(other()))} ile` : ''}</span>`) : ot ? `<b>${K.esc(nameOf(other()))} nefes alıyor</b><span>Katıl, aynı ritme gir</span>` : '<b>4 · 7 · 8</b><span>Başlayınca daire büyür</span>';
    if (me && me.bitti) return bitir();
    raf = requestAnimationFrame(draw);
  }
  function basla(st) {
    start = st || Date.now() + 3000;
    birlikteOldu = false;
    cancelAnimationFrame(raf);
    clearInterval(beat);
    K.cloud && K.cloud.send && K.cloud.send('nefes', { t: 'basla', start });
    beat = setInterval(() => K.cloud.send('nefes', { t: 'var', start }), 1500);
    K.$('[data-nf-basla]', root).textContent = 'Baştan';
    draw();
  }
  function bitir() {
    cancelAnimationFrame(raf);
    clearInterval(beat);
    K.cloud && K.cloud.send && K.cloud.send('nefes', { t: 'bitti' });
    if (K.cloud && K.cloud.enabled) K.cloud.add('nefes', { tur: KAC, birlikte: birlikteOldu });
    K.stickers.award(birlikteOldu ? 'nefesbirlikte' : 'nefes');
    start = 0;
    K.$('[data-nf-basla]', root) && (K.$('[data-nf-basla]', root).textContent = 'Yeniden');
    K.$('#nfYazi', root).innerHTML = `<b>Bitti</b><span>${birlikteOldu ? `${K.esc(nameOf(other()))} ile aynı ritimde dört tur.` : 'Dört tur.'} Omuzların biraz daha hafif mi?</span>`;
  }
  K.on('cloud', (ok) => {
    if (!ok) return;
    K.cloud.onLive('nefes', (m) => {
      if (m.who === mine()) return;
      if (m.t === 'bitti') return (oStart = 0);
      oStart = m.start;
      oAt = Date.now();
      if (m.t === 'basla' && K.activeRoom !== 'nefes') K.fx.toast(`🌬 ${K.esc(nameOf(m.who))} nefes almaya başladı. <a href="#nefes">Katıl</a>`, { duration: 7000 });
      if (K.activeRoom === 'nefes' && !start) draw();
    });
  });
  K.room({
    id: 'nefes',
    wing: 'kalp',
    title: 'Birlikte Nefes',
    sub: '4 · 7 · 8, iki şehirde',
    icon: 'cloud',
    color: '#E3F2FF',
    init(el) {
      root = el;
      el.innerHTML = `<div class="room-intro"><p>Uyumadan ya da sınavdan önce: dört saniye al, yedi saniye tut, sekiz saniye ver. Biriniz başlatınca öbürü katılır; iki daire aynı ritimde nefes alır.</p></div>
        <section class="card nf-kart"><div class="nf-sahne" id="nfSahne"><div class="nf-daire o" id="nfO"></div><div class="nf-daire ben" id="nfBen"></div><div class="nf-yazi" id="nfYazi"></div></div>
        <div class="row center"><button type="button" class="btn red" data-nf-basla>Başla</button><button type="button" class="btn soft" data-nf-katil>Ona katıl</button></div></section>`;
      el.addEventListener('click', (e) => {
        if (e.target.closest('[data-nf-basla]')) return basla();
        if (e.target.closest('[data-nf-katil]')) {
          if (!oVar()) return K.fx.toast(`${nameOf(other())} şu an nefes almıyor; sen başlat, o katılsın.`);
          return basla(oStart);
        }
      });
    },
    enter() {
      draw();
    },
    leave() {
      cancelAnimationFrame(raf);
      clearInterval(beat);
      start = 0;
    },
  });
})();
