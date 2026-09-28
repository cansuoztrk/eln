/* Oda: Müzik Kutusu — kolu çevir, Kitty dönsün; Kitty piyanosunda "İyi ki doğdun"u öğren */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;

  let root, auto = null, lesson = null, wasMusic = false;

  /* ---------------- Müzik kutusu ---------------- */
  function boxSvg() {
    return `<svg viewBox="0 0 300 220" class="mbox-svg" aria-hidden="true">
      <path d="M42 102 L64 16 Q150 4 236 16 L258 102 Z" fill="#FFB3CE" stroke="#4A2138" stroke-width="4" stroke-linejoin="round"/>
      <path d="M58 98 L76 28 Q150 18 224 28 L242 98 Z" fill="#FFE1EC"/>
      <ellipse cx="150" cy="58" rx="46" ry="28" fill="#EAF6FF" stroke="#FFD34E" stroke-width="5"/>
      <path d="M128 44 Q140 36 152 40" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round"/>
      <rect x="30" y="96" width="240" height="110" rx="14" fill="#FF8FB8" stroke="#4A2138" stroke-width="4"/>
      <rect x="30" y="96" width="240" height="26" rx="10" fill="#FFB3CE" stroke="#4A2138" stroke-width="4"/>
      <g fill="#FFD34E" stroke="#B9783E" stroke-width="2">${[60, 100, 140, 180, 220].map((x) => `<circle cx="${x + 10}" cy="164" r="7"/>`).join('')}</g>
      <path d="M44 138 H256 M44 190 H256" stroke="#fff" stroke-width="3" stroke-dasharray="2 8" stroke-linecap="round"/>
      <g transform="translate(150 164) scale(.34)">${A.bowShape('#E3174D')}</g>
      <ellipse cx="150" cy="98" rx="58" ry="9" fill="#FFE1EC" stroke="#4A2138" stroke-width="3"/>
    </svg>`;
  }
  let beat = 0,
    acc = 0,
    lastAng = null,
    spin = 0;
  const waltz = () => K.audio.melodies.waltz;
  function playBeat() {
    const m = waltz();
    const evs = m.events.filter((e) => e.beat === beat);
    evs.forEach((e) => K.audio.sfx.note(e.m, e.vol * 1.1));
    beat = (beat + 1) % m.beats;
    spin += 30;
    K.$('#mbDancer', root).style.transform = `rotateY(${spin}deg)`;
    if (evs.some((e) => e.vol > 0.15)) floatNote();
  }
  function floatNote() {
    const box = K.$('.mbox', root);
    const n = K.el(`<span class="float-note">${['♪', '♫', '♥'][Math.floor(Math.random() * 3)]}</span>`);
    n.style.left = 30 + Math.random() * 40 + '%';
    box.appendChild(n);
    setTimeout(() => n.remove(), 1600);
  }
  function initCrank() {
    const crank = K.$('#mbCrank', root);
    const knob = K.$('#mbKnob', root);
    let rot = 0,
      down = false;
    const center = () => {
      const r = crank.getBoundingClientRect();
      return [r.left + r.width / 2, r.top + r.height / 2];
    };
    crank.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      K.audio.ensure();
      stopAuto();
      down = true;
      crank.setPointerCapture(e.pointerId);
      const [x, y] = center();
      lastAng = Math.atan2(e.clientY - y, e.clientX - x);
    });
    crank.addEventListener('pointermove', (e) => {
      if (!down) return;
      const [x, y] = center();
      const a = Math.atan2(e.clientY - y, e.clientX - x);
      let d = a - lastAng;
      if (d > Math.PI) d -= Math.PI * 2;
      if (d < -Math.PI) d += Math.PI * 2;
      lastAng = a;
      const deg = Math.abs((d * 180) / Math.PI);
      rot += (d * 180) / Math.PI;
      knob.style.transform = `rotate(${rot}deg)`;
      acc += deg;
      while (acc >= 45) {
        acc -= 45;
        playBeat();
      }
    });
    const up = () => (down = false);
    crank.addEventListener('pointerup', up);
    crank.addEventListener('pointercancel', up);
    // Klavye: sağ ok ile çevir
    crank.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        rot += 45;
        knob.style.transform = `rotate(${rot}deg)`;
        playBeat();
      }
    });
  }
  function toggleAuto() {
    if (auto) return stopAuto();
    const btn = K.$('#mbAuto', root);
    btn.innerHTML = `${A.ui('pause')} Durdur`;
    K.$('.mbox', root).classList.add('playing');
    auto = K.audio.play('waltz', {
      loop: true,
      onNote: () => {
        spin += 40;
        K.$('#mbDancer', root).style.transform = `rotateY(${spin}deg)`;
        floatNote();
      },
    });
  }
  function stopAuto() {
    if (!auto) return;
    auto.stop();
    auto = null;
    K.$('#mbAuto', root).innerHTML = `${A.ui('play')} Kendi kendine çalsın`;
    K.$('.mbox', root).classList.remove('playing');
  }

  /* ---------------- Kitty piyanosu (G4–G5) ---------------- */
  const WHITE = ['G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F5', 'G5'];
  const BLACK = [['G#4', 0], ['A#4', 1], ['C#5', 3], ['D#5', 4], ['F#5', 6]];
  const KEYMAP = { a: 'G4', s: 'A4', d: 'B4', f: 'C5', g: 'D5', h: 'E5', j: 'F5', k: 'G5', w: 'G#4', e: 'A#4', t: 'C#5', y: 'D#5', u: 'F#5' };
  const LABEL = { G4: 'Sol', A4: 'La', B4: 'Si', C5: 'Do', D5: 'Re', E5: 'Mi', F5: 'Fa', G5: 'Sol' };
  function pianoHTML() {
    const keyOf = (n) => Object.keys(KEYMAP).find((k) => KEYMAP[k] === n).toUpperCase();
    return `<div class="piano" id="piano">
      ${WHITE.map((n, i) => `<button class="pkey white" data-n="${n}" style="--i:${i}" aria-label="${LABEL[n]}"><span class="pk-kitty">${i === 0 || i === 7 ? A.bow('#E3174D') : ''}</span><b>${LABEL[n]}</b><i>${keyOf(n)}</i></button>`).join('')}
      ${BLACK.map(([n, after]) => `<button class="pkey black" data-n="${n}" style="--after:${after}" aria-label="${n}"><i>${keyOf(n)}</i></button>`).join('')}
    </div>`;
  }
  function press(n, fromUser = true) {
    const key = K.$(`.pkey[data-n="${n}"]`, root);
    if (!key) return;
    K.audio.sfx.note(n, 0.3);
    key.classList.remove('down');
    void key.offsetWidth;
    key.classList.add('down');
    setTimeout(() => key.classList.remove('down'), 220);
    const r = key.getBoundingClientRect();
    if (fromUser) K.fx.burst(r.left + r.width / 2, r.top + 10, { count: 4, power: 3, shapes: ['heart', 'spark'] });
    if (fromUser && lesson) lessonStep(n);
  }
  const SONG = () => K.audio.melodies.birthday.events.map((e) => e.name);
  function lessonStart() {
    lesson = { i: 0, song: SONG(), miss: 0 };
    K.$('#lessonBtn', root).innerHTML = `${A.ui('close')} Dersi bitir`;
    hint();
  }
  function lessonEnd() {
    lesson = null;
    K.$$('.pkey', root).forEach((k) => k.classList.remove('next'));
    K.$('#lessonBtn', root).innerHTML = `${A.ui('sparkle')} Bana öğret`;
    K.$('#lessonNote', root).textContent = 'Klavyeden de çalabilirsin: A S D F G H J K beyaz, W E T Y U siyah tuşlar.';
  }
  function hint() {
    K.$$('.pkey', root).forEach((k) => k.classList.remove('next'));
    const n = lesson.song[lesson.i];
    const k = K.$(`.pkey[data-n="${n}"]`, root);
    k && k.classList.add('next');
    K.$('#lessonNote', root).textContent = `İyi ki doğdun · ${lesson.i + 1}/${lesson.song.length} · Parlayan tuşa bas (${LABEL[n] || n})`;
  }
  function lessonStep(n) {
    if (n === lesson.song[lesson.i]) {
      lesson.i++;
      if (lesson.i >= lesson.song.length) {
        K.stickers.award('muzisyen');
        K.fx.confetti({ count: 110 });
        K.audio.sfx.chime();
        lessonEnd();
        K.$('#lessonNote', root).textContent = `Bravo! Şarkıyı baştan sona çaldın. 23 Nisan'da bunu sana ben çalacağım.`;
        return;
      }
      hint();
    } else {
      lesson.miss++;
      K.$('#piano', root).classList.remove('oops');
      void K.$('#piano', root).offsetWidth;
      K.$('#piano', root).classList.add('oops');
    }
  }
  let demo = null;
  function listen() {
    if (demo) {
      demo.stop();
      demo = null;
      return;
    }
    demo = K.audio.play('birthday', { onNote: (e) => e.name && press(e.name, false), onEnd: () => (demo = null) });
  }

  K.room({
    id: 'muzik',
    wing: 'oyun',
    title: 'Müzik Kutusu',
    sub: 'Senin valsin ve bir Kitty piyanosu',
    icon: 'music',
    color: '#FFD6E5',
    init(el) {
      root = el;
      const pl = D.playlist || [];
      el.innerHTML = `
        <p class="room-intro">Bu müzik kutusunun çaldığı vals sadece senin için yazıldı; adı "${K.esc(C.herName)}'in Valsi". Kolu parmağınla çevir: Ne kadar hızlı çevirirsen o kadar hızlı çalar.</p>
        <div class="mb-layout">
          <div class="mbox card">
            <div class="mb-dancer-wrap"><div class="mb-dancer" id="mbDancer">${A.kitty({ crown: true, cls: 'is-happy' })}</div><div class="mb-stand"></div></div>
            ${boxSvg()}
            <div class="mb-crank" id="mbCrank" tabindex="0" role="button" aria-label="Müzik kutusunun kolunu çevir">
              <div class="mb-knob" id="mbKnob"><span class="mb-arm"></span><span class="mb-handle"></span></div>
            </div>
            <div class="mb-actions"><button class="btn soft" id="mbAuto">${A.ui('play')} Kendi kendine çalsın</button></div>
          </div>
          <div class="card piano-card">
            <p class="card-eyebrow">Kitty piyanosu</p>
            ${pianoHTML()}
            <p class="muted small" id="lessonNote">Klavyeden de çalabilirsin: A S D F G H J K beyaz, W E T Y U siyah tuşlar.</p>
            <div class="actions" style="display:flex;gap:10px;flex-wrap:wrap;margin-top:12px">
              <button class="btn" id="lessonBtn">${A.ui('sparkle')} Bana öğret</button>
              <button class="btn soft" id="listenBtn">${A.ui('speaker')} Önce dinle</button>
            </div>
          </div>
        </div>
        ${pl.length ? `<div class="card playlist"><p class="card-eyebrow">Bizim şarkılarımız</p><ul>${pl.map((s) => `<li><a href="${K.esc(s.url)}" target="_blank" rel="noopener">${A.ui('play')}<span><b>${K.esc(s.title)}</b>${K.esc(s.artist || '')}${s.note ? `<small>${K.esc(s.note)}</small>` : ''}</span></a></li>`).join('')}</ul></div>` : ''}`;
      initCrank();
      K.$('#mbAuto', el).addEventListener('click', toggleAuto);
      K.$('#piano', el).addEventListener('pointerdown', (e) => {
        const k = e.target.closest('.pkey');
        if (!k) return;
        e.preventDefault();
        press(k.dataset.n);
      });
      K.$('#piano', el).addEventListener('keydown', (e) => {
        const k = e.target.closest('.pkey');
        if (k && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          press(k.dataset.n);
        }
      });
      K.$('#lessonBtn', el).addEventListener('click', () => (lesson ? lessonEnd() : lessonStart()));
      K.$('#listenBtn', el).addEventListener('click', listen);
      document.addEventListener('keydown', (e) => {
        if (K.activeRoom !== 'muzik' || e.repeat || e.target.closest('input,textarea') || e.metaKey || e.ctrlKey) return;
        const n = KEYMAP[e.key.toLowerCase()];
        if (n) press(n);
      });
    },
    enter() {
      wasMusic = K.audio.music.on;
      if (wasMusic) K.audio.music.stop(false);
    },
    leave() {
      stopAuto();
      if (demo) {
        demo.stop();
        demo = null;
      }
      if (lesson) lessonEnd();
      if (wasMusic) K.audio.music.start();
    },
  });
})();
