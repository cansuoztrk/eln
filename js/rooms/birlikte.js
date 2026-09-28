/* Oda: Birlikte — ikisi aynı anda kaledeyken: iki kişilik sarılma (ikisi de basılı tutunca dolar),
   ekrandan ekrana dokunuş ve kalp atışı. Kalp atışı kalenin her yerinde hissedilir. */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;

  let root, raf = null, pingT = null;
  let meHold = false, otherAt = 0, prog = 0, last = 0, lastHug = 0, hugs = 0;
  const HOLD_MS = 3000;
  const otherHolding = () => Date.now() - otherAt < 1100;

  /* Kalp atışı: her yerde */
  function beatFx() {
    const el = K.el(`<div class="bt-beat" aria-hidden="true"><svg viewBox="-13 -14 26 23"><path d="M0 7 C-11 -1 -11 -12 -4.5 -12 C-1.5 -12 0 -9.5 0 -8 C0 -9.5 1.5 -12 4.5 -12 C11 -12 11 -1 0 7 Z"/></svg><p>${K.esc(K.otherName())}'un kalbi</p></div>`);
    document.body.appendChild(el);
    K.vibrate([90, 110, 90]);
    K.audio.sfx.note('C4', 0.18);
    setTimeout(() => K.audio.sfx.note('C4', 0.12), 220);
    setTimeout(() => el.remove(), 2200);
  }
  K.on('cloud', (on) => {
    if (!on) return;
    K.cloud.onLive('beat', beatFx);
    K.cloud.onLive('hold', (m) => {
      if (m.on) otherAt = Date.now();
      else otherAt = 0;
    });
    K.cloud.onLive('touch', (m) => ripple(m.x, m.y, false));
    K.cloud.onLive('hugged', () => celebrate(false));
    K.cloud.list('hug').then((r) => (hugs = r.length));
    K.cloud.on('hug', () => {
      hugs++;
      updateCount();
    });
  });
  K.on('presence', () => K.activeRoom === 'birlikte' && status());

  function status() {
    if (!root) return;
    const here = K.cloud.otherHere();
    const other = K.otherName();
    root.classList.toggle('both', here);
    K.$('#btStatus', root).innerHTML = here
      ? `<b>Şu an ikiniz de buradasınız.</b> ${K.esc(other)} de kalede; ne yaparsan anında onun ekranına düşer.`
      : `<b>${K.esc(other)} şu an kalede değil.</b> Geldiğinde yıldızlar birleşecek. İstersen haber ver.`;
    K.$('#btCall', root).hidden = here;
  }
  function updateCount() {
    const el = root && K.$('#btCount', root);
    if (el) el.textContent = hugs ? `Birlikte ${K.num(hugs)} kez sarıldınız` : 'Henüz birlikte sarılmadınız';
  }

  /* İki kişilik sarılma */
  function loop(t) {
    const dt = last ? t - last : 0;
    last = t;
    const both = meHold && otherHolding();
    prog = both ? Math.min(1, prog + dt / HOLD_MS) : Math.max(0, prog - dt / 1200);
    const ring = K.$('#btRing', root);
    if (ring) ring.style.strokeDashoffset = String(339 * (1 - prog));
    K.$('#btMe', root).classList.toggle('on', meHold);
    K.$('#btOther', root).classList.toggle('on', otherHolding());
    K.$('#btHug', root).classList.toggle('both', both);
    if (prog >= 1 && Date.now() - lastHug > 4000) {
      prog = 0;
      K.cloud.send('hugged', {});
      celebrate(true);
    }
    raf = requestAnimationFrame(loop);
  }
  function celebrate(mine) {
    if (Date.now() - lastHug < 4000) return;
    lastHug = Date.now();
    K.vibrate([200, 100, 400]);
    K.audio.sfx.chime();
    K.fx.confetti({ count: 150, shapes: ['heart'], colors: ['#FF6FA3', '#E3174D', '#FFB3CE', '#8FD3FF'] });
    K.fx.toast(`<b>Sarıldınız!</b> ${K.esc(C.myPet)} ile ${K.esc(C.herPet)}, ${K.num(C.distanceKm)} km'yi aynı anda kapattı.`, { icon: A.icon('hugs'), duration: 5000 });
    K.stickers.award('sarilma');
    // Sayıyı sadece bir taraf yazsın ki çift sayılmasın
    if (!K.isOwner()) K.cloud.add('hug', {});
  }
  function hold(on) {
    meHold = on;
    K.cloud.send('hold', { on });
    clearInterval(pingT);
    if (on) pingT = setInterval(() => K.cloud.send('hold', { on: true }), 400);
  }

  /* Dokunuş */
  function ripple(x, y, mine) {
    const pad = root && K.$('#btPad', root);
    if (!pad || K.activeRoom !== 'birlikte') return;
    const r = K.el(`<i class="bt-rip ${mine ? 'me' : 'other'}" style="left:${(x * 100).toFixed(1)}%;top:${(y * 100).toFixed(1)}%"></i>`);
    pad.appendChild(r);
    setTimeout(() => r.remove(), 1400);
    if (!mine) K.vibrate(35);
  }

  K.room({
    id: 'birlikte',
    wing: 'kalp',
    title: 'Birlikte',
    sub: 'Aynı anda kaledeyken: sarıl, dokun, kalbini gönder',
    icon: 'hugs',
    color: '#FFD6E5',
    hidden: () => !K.cloud || !K.cloud.enabled,
    badge: () => (K.cloud && K.cloud.otherHere() ? 'Şu an burada' : ''),
    init(el) {
      root = el;
      const meSide = K.isOwner() ? 'me' : 'her';
      el.innerHTML = `
        <div class="bt-sky">
          <span class="bt-star ${meSide === 'her' ? 'her' : 'me'}">${A.kitty({ cls: 'is-happy', crown: meSide === 'her', bow: meSide === 'her' ? '#E3174D' : '#4FA3E3' })}<small>Sen</small></span>
          <span class="bt-line" aria-hidden="true"></span>
          <span class="bt-star ${meSide === 'her' ? 'me' : 'her'} other">${A.kitty({ cls: 'is-happy', crown: meSide !== 'her', bow: meSide === 'her' ? '#4FA3E3' : '#E3174D' })}<small>${K.esc(K.otherName())}</small></span>
        </div>
        <p class="bt-status" id="btStatus"></p>
        <div class="actions" style="justify-content:center"><button class="btn soft small" id="btCall" type="button">${A.ui('send')} Kaleye çağır</button></div>
        <section class="bt-hug card">
          <p class="card-eyebrow">İki kişilik sarılma</p>
          <p class="muted small">İkiniz de kalbe aynı anda basılı tutun. Kalp sadece ikiniz birlikte tutarken dolar.</p>
          <button class="bt-heart no-burst" id="btHug" type="button" aria-label="Basılı tut">
            <svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="54" fill="none" stroke="#FFE1EC" stroke-width="10"/><circle id="btRing" cx="60" cy="60" r="54" fill="none" stroke="#E3174D" stroke-width="10" stroke-linecap="round" stroke-dasharray="339" stroke-dashoffset="339" transform="rotate(-90 60 60)"/><path transform="translate(60 64) scale(3)" d="M0 7 C-11 -1 -11 -12 -4.5 -12 C-1.5 -12 0 -9.5 0 -8 C0 -9.5 1.5 -12 4.5 -12 C11 -12 11 -1 0 7 Z" fill="#FF6FA3"/></svg>
          </button>
          <div class="bt-holds"><span id="btMe">Sen</span><span id="btOther">${K.esc(K.otherName())}</span></div>
          <p class="muted small" id="btCount"></p>
        </section>
        <section class="bt-touch card">
          <p class="card-eyebrow">Ekrandan ekrana dokunuş</p>
          <p class="muted small">Buraya dokun: parmağının izi aynı anda onun ekranında belirir.</p>
          <div class="bt-pad" id="btPad"></div>
          <div class="actions" style="justify-content:center"><button class="btn red" id="btBeat" type="button">${A.ui('heart')} Kalbimi gönder</button></div>
        </section>`;
      const hug = K.$('#btHug', el);
      hug.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        hug.setPointerCapture && hug.setPointerCapture(e.pointerId);
        hold(true);
      });
      ['pointerup', 'pointercancel', 'pointerleave'].forEach((ev) => hug.addEventListener(ev, () => meHold && hold(false)));
      hug.addEventListener('contextmenu', (e) => e.preventDefault());
      const pad = K.$('#btPad', el);
      pad.addEventListener('pointerdown', (e) => {
        const r = pad.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        ripple(x, y, true);
        K.cloud.send('touch', { x, y });
      });
      K.$('#btBeat', el).addEventListener('click', () => {
        K.cloud.send('beat', {});
        K.audio.sfx.pop();
        K.fx.toast('Kalbin yola çıktı.', { icon: A.icon('heart') });
      });
      K.$('#btCall', el).addEventListener('click', async () => {
        if (K.isOwner()) await K.cloud.add('live', { text: 'Kaleye gel, Birlikte odasında bekliyorum ♥' });
        else await K.notify(`${C.herName} seni kaleye çağırıyor`, 'Birlikte odasında bekliyor. Aynı anda sarılmak için gel.', ['castle'], { priority: 5 });
        K.fx.toast('Haber verildi.', { icon: A.icon('radio') });
      });
    },
    enter() {
      status();
      updateCount();
      last = 0;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(loop);
    },
    leave() {
      cancelAnimationFrame(raf);
      if (meHold) hold(false);
    },
  });
})();
