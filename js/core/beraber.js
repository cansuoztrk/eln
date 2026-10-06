/* Kale 2.0 — Birlikte Gez ve Aynı Saniyede Kalp.
   Birlikte Gez: ikiniz aynı odadayken birbirinizin parmağı ekranda küçük bir ışık olarak görünür, dokunduğun yerde
   onun ekranında halka açılır. "Beni takip et" deyince o kabul ederse senin kaydırdığın yere onun ekranı da kayar:
   birlikte mektup okumak, birlikte albüme bakmak. Aynı Saniyede Kalp: ikiniz de aynı saniyede alttaki kalbe
   dokunursanız gökyüzünden bir yıldız kayar. Kayıtlar: aynikalp {} · canlı: iz, takip, ayni */
(function () {
  'use strict';
  const K = window.K;
  const D = window.ELN;
  const C = D.config;

  const mine = () => (K.isOwner() ? 'me' : 'her');
  const nameOf = (w) => (w === 'me' ? C.myPet : C.herPet);
  const on = () => Boolean(K.cloud && K.cloud.enabled);
  const view = () => K.$('#roomView');
  let lastSend = 0, pill = null, leading = false, following = false, dot = null, dotT = 0, seenFinger = false;

  function sendIz(e, tap) {
    if (!on() || !K.activeRoom || !(K.yan && K.yan.same())) return;
    const now = Date.now();
    if (!tap && now - lastSend < 70) return;
    lastSend = now;
    const v = view();
    const r = v.getBoundingClientRect();
    K.cloud.send('iz', { room: K.activeRoom, x: +((e.clientX - r.left) / r.width).toFixed(3), y: Math.round(e.clientY - r.top + v.scrollTop), tap: Boolean(tap) });
  }
  function showIz(m) {
    if (m.who === mine() || m.room !== K.activeRoom) return;
    const v = view();
    if (!dot || !dot.isConnected) {
      dot = K.el(`<i class="iz-parmak ${m.who}" aria-hidden="true"><b>${K.esc(nameOf(m.who).slice(0, 1))}</b></i>`);
      v.appendChild(dot);
    }
    dot.style.left = (m.x * v.clientWidth).toFixed(0) + 'px';
    dot.style.top = m.y + 'px';
    dot.classList.add('on');
    clearTimeout(dotT);
    dotT = setTimeout(() => dot && dot.classList.remove('on'), 2500);
    if (m.tap) {
      const h = K.el(`<i class="iz-halka ${m.who}" aria-hidden="true" style="left:${dot.style.left};top:${m.y}px"></i>`);
      v.appendChild(h);
      setTimeout(() => h.remove(), 900);
    }
    if (!seenFinger) {
      seenFinger = true;
      K.stickers.award('birliktegez');
    }
  }

  /* ---------- Beni takip et ---------- */
  function paintPill() {
    const same = on() && K.activeRoom && K.yan && K.yan.same();
    if (!same) {
      leading = following = false;
      pill && pill.remove();
      pill = null;
      return;
    }
    if (!pill) {
      pill = K.el('<div class="bg-pill" role="group" aria-label="Birlikte gez"></div>');
      document.body.appendChild(pill);
      pill.addEventListener('click', (e) => {
        const b = e.target.closest('[data-bg]');
        if (!b) return;
        const a = b.dataset.bg;
        if (a === 'lead') {
          leading = !leading;
          K.cloud.send('takip', { room: K.activeRoom, on: leading });
          if (leading) sendScroll(true);
        }
        if (a === 'follow') {
          following = true;
          pill.dataset.ask = '';
        }
        if (a === 'no') pill.dataset.ask = '';
        if (a === 'stop') following = false;
        paintPill();
      });
    }
    const ask = pill.dataset.ask === '1';
    pill.innerHTML = ask
      ? `<span>👣 ${K.esc(nameOf(mine() === 'me' ? 'her' : 'me'))} seni gezdirmek istiyor</span><button type="button" data-bg="follow">Takip et</button><button type="button" data-bg="no" class="ghost">Hayır</button>`
      : following
      ? `<span>👣 ${K.esc(K.ek(nameOf(mine() === 'me' ? 'her' : 'me'), 'in'))} ekranını takip ediyorsun</span><button type="button" data-bg="stop" class="ghost">Bırak</button>`
      : `<span>👀 İkiniz de buradasınız</span><button type="button" data-bg="lead" class="${leading ? 'on' : ''}">${leading ? '👣 Gezdiriyorsun · durdur' : '👣 Beni takip et'}</button>`;
  }
  let scT = 0;
  function sendScroll(force) {
    if (!leading || !K.activeRoom) return;
    clearTimeout(scT);
    scT = setTimeout(() => {
      const v = view();
      K.cloud.send('kaydir', { room: K.activeRoom, r: +(v.scrollTop / Math.max(1, v.scrollHeight - v.clientHeight)).toFixed(4) });
    }, force ? 0 : 90);
  }

  /* ---------- Aynı Saniyede Kalp ---------- */
  let myTap = 0, theirTap = 0;
  function star() {
    const s = K.el('<div class="kayan-yildiz" aria-hidden="true"><i></i></div>');
    document.body.appendChild(s);
    setTimeout(() => s.remove(), 2400);
    K.audio.sfx.sparkle();
    K.vibrate([30, 40, 30]);
    K.fx.toast('✨ <b>Aynı saniyede!</b> Gökyüzünden bir yıldız kaydı.', { duration: 3000 });
    K.stickers.award('aynisaniye');
    if (K.isOwner()) K.cloud.add('aynikalp', {});
  }
  function heartTap() {
    if (!on()) return;
    myTap = Date.now();
    K.cloud.send('ayni', {});
    if (Math.abs(myTap - theirTap) < 1200) (theirTap = 0), star();
  }
  document.addEventListener('pointerdown', (e) => e.target.closest('.dock-kalp') && heartTap());

  document.addEventListener('pointermove', (e) => K.activeRoom && e.pointerType !== 'touch' && sendIz(e, false), { passive: true });
  document.addEventListener('touchmove', (e) => K.activeRoom && e.touches[0] && sendIz(e.touches[0], false), { passive: true });
  document.addEventListener('pointerdown', (e) => K.activeRoom && e.target.closest('#roomView') && sendIz(e, true));

  K.on('cloud', (ok) => {
    if (!ok) return;
    K.cloud.onLive('iz', showIz);
    K.cloud.onLive('takip', (m) => {
      if (m.who === mine() || m.room !== K.activeRoom || !pill) return;
      if (m.on) pill.dataset.ask = '1';
      else following = false;
      paintPill();
    });
    K.cloud.onLive('kaydir', (m) => {
      if (m.who === mine() || !following || m.room !== K.activeRoom) return;
      const v = view();
      v.scrollTo({ top: m.r * (v.scrollHeight - v.clientHeight), behavior: K.reduced ? 'auto' : 'smooth' });
    });
    K.cloud.onLive('ayni', (m) => {
      if (m.who === mine()) return;
      theirTap = Date.now();
      if (Math.abs(theirTap - myTap) < 1200) (myTap = 0), star();
    });
    setTimeout(() => {
      const v = view();
      v && v.addEventListener('scroll', () => sendScroll(false), { passive: true });
    }, 500);
  });
  K.on('room', () => setTimeout(paintPill, 400));
  K.on('presence', paintPill);
  window.addEventListener('hashchange', () => setTimeout(paintPill, 300));
  setInterval(paintPill, 8000);
  K.beraber = { star };
})();
