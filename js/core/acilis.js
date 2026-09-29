/* Eln'in Krallığı — Açılış Töreni: Eln kaleye ilk kez girdiğinde, açılış filminden önce kapıdaki pembe kurdeleyi o keser.
   Makası kurdeleye sürükler (ya da kurdeleye dokunur); kurdele iki yana düşer, kapılar açılır, kısa bir mektup gelir.
   Kale sahibine "kurdeleyi kesti" bildirimi gider. Kale sahibi töreni panelden önizleyebilir. */
(function () {
  'use strict';
  const K = window.K;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  function ceremony(done, preview) {
    const A = K.art;
    const AC = D.acilis || {};
    const onDay = C.openingDate && T.todayKey() === C.openingDate;
    const lines = (onDay ? AC.onDay : AC.other) || [];
    const el = K.el(`<div class="ac" role="dialog" aria-modal="true" aria-label="${K.esc(AC.title || 'Açılış')}">
      <div class="ac-sky" aria-hidden="true">${Array.from({ length: 40 }, (_, i) => `<i style="left:${(i * 37) % 100}%;top:${(i * 53) % 60}%;--d:${(i % 9) * 0.4}s"></i>`).join('')}</div>
      <p class="ac-top">${onDay ? 'Tanışmamızın birinci yılı' : T.fmt(T.todayKey(), true)}</p>
      <h2 class="ac-title">${K.esc(C.herName)}'in Krallığı</h2>
      <div class="ac-gate">
        <div class="ac-door l"><span></span></div><div class="ac-door r"><span></span></div>
        <div class="ac-kitty">${A.kitty({ crown: true, eyes: 'heart' })}</div>
        <button class="ac-ribbon no-burst" aria-label="Kurdeleyi kes"><i class="ac-rl"></i><i class="ac-rr"></i><span class="ac-bow"><svg viewBox="-62 -42 124 84">${A.bowShape('#E3174D', '#8C1033')}</svg></span></button>
      </div>
      <div class="ac-scissors" aria-hidden="true"><svg viewBox="0 0 64 64"><circle cx="16" cy="48" r="9" fill="none" stroke="#fff" stroke-width="5"/><circle cx="36" cy="54" r="9" fill="none" stroke="#fff" stroke-width="5"/><path class="ac-b1" d="M22 42 L56 8" stroke="#fff" stroke-width="5" stroke-linecap="round"/><path class="ac-b2" d="M30 47 L58 14" stroke="#FFD0E1" stroke-width="5" stroke-linecap="round"/></svg></div>
      <p class="ac-hint">${K.esc(AC.hint || 'Kurdeleye dokun.')}</p>
      <div class="ac-letter" hidden>${lines.map((l, i) => `<p style="--d:${0.3 + i * 1.1}s">${K.esc(K.fill(l))}</p>`).join('')}<p class="ac-sign" style="--d:${0.3 + lines.length * 1.1}s">— ${K.esc(K.fill(AC.sign || '{myPet}'))}</p>${K.voice && K.voice.has('acilis') ? `<div class="ac-voice" style="--d:${0.6 + lines.length * 1.1}s">${K.voice.btn('acilis', 'Sesimle dinle')}</div>` : ''}<button class="btn red big ac-go" style="--d:${0.8 + lines.length * 1.1}s">Kaleye gir</button></div>
    </div>`);
    document.body.appendChild(el);
    document.body.classList.add('has-modal');
    const sc = K.$('.ac-scissors', el);
    const rib = K.$('.ac-ribbon', el);
    let cut = false;
    const place = (x, y) => {
      sc.style.left = x + 'px';
      sc.style.top = y + 'px';
    };
    const r0 = () => rib.getBoundingClientRect();
    // Makas parmağı takip eder; kurdelenin üstünden geçince keser
    const move = (e) => {
      if (cut) return;
      const p = e.touches ? e.touches[0] : e;
      place(p.clientX, p.clientY);
      sc.classList.add('on');
      const r = r0();
      if (p.clientY > r.top - 10 && p.clientY < r.bottom + 10 && p.clientX > r.left + r.width * 0.3 && p.clientX < r.right - r.width * 0.3) snip();
    };
    el.addEventListener('pointermove', move);
    el.addEventListener('touchmove', move, { passive: true });
    rib.addEventListener('click', snip);
    function snip() {
      if (cut) return;
      cut = true;
      const r = r0();
      place(r.left + r.width / 2, r.top + r.height / 2);
      sc.classList.add('on', 'snip');
      K.audio.sfx.pop();
      K.vibrate([30, 40, 80]);
      setTimeout(() => {
        el.classList.add('cut');
        K.audio.sfx.chime();
        K.fx.fireworks ? K.fx.fireworks() : K.fx.confetti({ count: 200 });
        K.fx.confetti({ count: 160, shapes: ['heart', 'bow', 'star'] });
      }, 250);
      setTimeout(() => {
        el.classList.add('open');
        K.$('.ac-letter', el).hidden = false;
      }, 1500);
      if (!preview) {
        K.store.set('acilis', T.todayKey());
        K.stickers.award('kurdele');
        K.notify(`${C.herName} kurdeleyi kesti`, 'Kalenin kapıları açıldı. Şu an içeride.', ['ribbon', 'tada'], { priority: 5 });
        if (K.cloud && K.cloud.ready) K.cloud.ready.then((on) => on && K.cloud.add('opened', { at: Date.now() }));
      }
    }
    K.$('.ac-go', el).addEventListener('click', () => {
      el.classList.add('out');
      setTimeout(() => {
        el.remove();
        document.body.classList.remove('has-modal');
        done && done();
      }, 600);
    });
  }
  K.acilis = { play: ceremony };

  // İlk girişte açılış filminden önce (kale sahibi hariç)
  const wrap = () => {
    if (!K.prologue || K.prologue.__acilis) return;
    const orig = K.prologue.play;
    K.prologue.play = (lines, done) => {
      if (K.isOwner() || !D.acilis || K.store.get('acilis')) return orig(lines, done);
      ceremony(() => orig(lines, done));
    };
    K.prologue.__acilis = true;
  };
  wrap();
  K.on('unlocked', wrap);
})();
