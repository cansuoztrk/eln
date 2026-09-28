/* Oda: Angela'nın Odası — dokununca tepki veren, sesini ince sesle tekrarlayan, soru cevaplayan Angela */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  let root, cat, bubbleEl, idleTimer, lastTouch = 0, mouthTimer;

  const REACT = {
    head: { t: 'Mırrr... Orası tam yeri.', fx: 'purr' },
    nose: { t: 'Hapşuu! Pardon, prenseslerin yanında olmaz.', fx: 'sneeze' },
    cheek: { t: 'Utandım ama devam et.', fx: 'blush' },
    eyes: { t: 'Göz göze geldik. Kim önce kırpacak?', fx: 'blink' },
    ear: { t: 'Kulağıma bir sır fısılda bakalım...', fx: 'tilt' },
    belly: { t: 'Hihihi, gıdıklanıyorum!', fx: 'giggle' },
    tail: { t: 'Kuyruğuma dokunma! ...Tamam, bir kere olur.', fx: 'tail' },
    paw: { t: 'Pati çak! Senin elin daha yumuşak ama.', fx: 'wave' },
  };
  const IDLE = [
    'Sıkıldım... Bana bir şey sor.',
    'Bugün tacımı mı taksam, fiyonkumu mu?',
    '{myName} şu an seni düşünüyor, eminim.',
    'Burnuma dokunursan hapşırırım, haberin olsun.',
    'Basılı tutup konuşursan söylediğini tekrar ederim.',
    'Kitty ile dedikodu yaptık. Konu: sen. Hep güzel şeyler.',
  ];

  function say(text, { voice = false, ms } = {}) {
    const t = K.fill(text);
    bubbleEl.textContent = t;
    bubbleEl.hidden = false;
    bubbleEl.classList.remove('pop');
    requestAnimationFrame(() => bubbleEl.classList.add('pop'));
    if (voice && K.$('#aVoice', root).checked) speak(t);
    else talkMouth(ms || Math.min(4000, t.length * 45));
  }
  function mouth(v) {
    const open = K.$('.a-mouth-open', cat);
    const closed = K.$('.a-mouth-closed', cat);
    const k = K.clamp(v, 0, 1);
    open.style.transform = `scaleY(${k})`;
    open.style.opacity = k > 0.08 ? 1 : 0;
    closed.style.opacity = k > 0.08 ? 0 : 1;
  }
  function talkMouth(ms) {
    clearInterval(mouthTimer);
    const end = performance.now() + ms;
    mouthTimer = setInterval(() => {
      if (performance.now() > end) {
        clearInterval(mouthTimer);
        mouth(0);
        return;
      }
      mouth(0.25 + Math.random() * 0.75);
    }, 95);
  }
  function speak(text) {
    const synth = window.speechSynthesis;
    if (!synth || !window.SpeechSynthesisUtterance) return talkMouth(text.length * 55);
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'tr-TR';
    const v = synth.getVoices().find((x) => /^tr/i.test(x.lang));
    if (v) u.voice = v;
    u.pitch = 1.9;
    u.rate = 1.05;
    let alive = true;
    u.onstart = () => {
      clearInterval(mouthTimer);
      mouthTimer = setInterval(() => alive && mouth(0.2 + Math.random() * 0.8), 90);
    };
    u.onend = u.onerror = () => {
      alive = false;
      clearInterval(mouthTimer);
      mouth(0);
    };
    synth.speak(u);
    // Bazı tarayıcılar onstart göndermez; yedek ağız animasyonu
    setTimeout(() => {
      if (alive && !synth.speaking) talkMouth(text.length * 55);
    }, 600);
  }

  function react(zone) {
    const r = REACT[zone];
    if (!r) return;
    lastTouch = Date.now();
    K.stickers.bump('angelaTouch', 10, 'angela');
    const svg = cat.querySelector('.angela');
    const flash = (cls, ms = 900) => {
      svg.classList.remove(cls);
      void svg.getBoundingClientRect();
      svg.classList.add(cls);
      setTimeout(() => svg.classList.remove(cls), ms);
    };
    const S = K.audio.sfx;
    switch (r.fx) {
      case 'purr':
        S.purr(1.6);
        flash('happy', 1800);
        hearts();
        break;
      case 'sneeze':
        S.sneeze();
        flash('sneeze', 700);
        break;
      case 'blush':
        S.pop();
        flash('blushing', 2200);
        break;
      case 'blink':
        S.tap();
        flash('blinking', 400);
        break;
      case 'tilt':
        S.tap();
        flash('tilt', 1400);
        break;
      case 'giggle':
        S.giggle();
        flash('wobble', 700);
        break;
      case 'tail':
        S.meow(1.15);
        flash('whip', 800);
        break;
      case 'wave':
        S.pop();
        flash('waving', 1400);
        break;
    }
    say(r.t);
  }
  function hearts() {
    const r = cat.getBoundingClientRect();
    K.fx.burst(r.left + r.width / 2, r.top + r.height * 0.18, { count: 10, power: 4, shapes: ['heart'] });
  }

  function answer(q) {
    const n = K.norm(q);
    const rule = D.angela.rules.find((r) => r.keys.some((k) => n.includes(K.norm(k))));
    let a = rule ? K.pick(rule.answers) : K.pick(D.angela.fallback);
    if (a === '__doing__') {
      const h = T.ist().h;
      const set = h < 7 ? 'night' : h < 11 ? 'morning' : h < 18 ? 'day' : 'evening';
      a = K.pick(D.angela.doing[set]);
    }
    if (a === '__sing__') return sing();
    say(a, { voice: true });
  }
  let singing = null;
  function sing() {
    if (singing) singing.stop();
    say('La la laaa... Bu vals {myName}\'in senin için yazdırdığı şarkı!', { ms: 1200 });
    const svg = cat.querySelector('.angela');
    svg.classList.add('singing');
    singing = K.audio.play('waltz', {
      onNote: () => {
        mouth(0.9);
        setTimeout(() => mouth(0.15), 160);
      },
    });
    setTimeout(() => {
      singing && singing.stop();
      singing = null;
      svg.classList.remove('singing');
      mouth(0);
    }, 12500);
  }

  /* Basılı tut → kaydet → ince sesle tekrar et */
  function initTalk() {
    const btn = K.$('#aTalk', root);
    const label = K.$('#aTalkLabel', root);
    const svg = cat.querySelector('.angela');
    let rec = null,
      recording = false,
      pending = false,
      maxT;
    const reset = () => {
      btn.classList.remove('rec');
      label.textContent = 'Basılı tut ve konuş';
      svg.classList.remove('listening');
    };
    const release = () => {
      pending = false;
      clearTimeout(maxT);
      if (!recording) return;
      recording = false;
      reset();
      const buf = rec.stop();
      rec = null;
      if (!buf) {
        say('Hiçbir şey duyamadım. Biraz daha yüksek sesle?');
        return;
      }
      lastTouch = Date.now();
      K.stickers.bump('angelaTouch', 10, 'angela');
      bubbleEl.hidden = true;
      K.audio.playChipmunk(buf, (lv) => mouth(lv * 5), () => mouth(0));
    };
    btn.addEventListener('pointerdown', async (e) => {
      e.preventDefault();
      if (recording || pending) return;
      pending = true;
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      try {
        rec = await K.audio.recorder();
      } catch (err) {
        pending = false;
        K.$('#aMicNote', root).textContent = 'Mikrofona ulaşılamadı. Aşağıya yaz, Angela okusun.';
        say('Mikrofonu açamadım. Yazarsan ben okurum!');
        K.$('#aInput', root).focus();
        return;
      }
      if (!pending) {
        rec.stop();
        rec = null;
        say('Tamam, izin geldi! Şimdi basılı tut ve konuş.');
        return;
      }
      recording = true;
      btn.classList.add('rec');
      label.textContent = 'Dinliyorum... bırakınca tekrar ederim';
      svg.classList.add('listening');
      maxT = setTimeout(release, 10000);
    });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => btn.addEventListener(ev, release));
    btn.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  function wardrobe() {
    const svg = cat.querySelector('.angela');
    const saved = K.store.get('angelaWear', { head: 'tiara', face: '' });
    const apply = () => {
      svg.classList.remove('wear-tiara', 'wear-bow', 'wear-flowers', 'wear-heartglasses', 'wear-teacher');
      if (saved.head) svg.classList.add('wear-' + saved.head);
      if (saved.face) svg.classList.add('wear-' + saved.face);
      K.$$('.wear', root).forEach((b) => b.setAttribute('aria-pressed', saved[b.dataset.slot] === b.dataset.v ? 'true' : 'false'));
    };
    apply();
    K.$('.wardrobe', root).addEventListener('click', (e) => {
      const b = e.target.closest('.wear');
      if (!b) return;
      saved[b.dataset.slot] = saved[b.dataset.slot] === b.dataset.v ? '' : b.dataset.v;
      K.store.set('angelaWear', saved);
      apply();
      K.audio.sfx.sparkle();
      const lines = {
        tiara: 'Taç bana çok yakıştı ama sana daha çok yakışır.',
        bow: 'Kitty\'den ödünç aldım, söyleme ona.',
        flowers: 'Bahar geldi sanki!',
        heartglasses: 'Aşk gözlüğüyle her şey pembe.',
        teacher: 'Good morning class! Bugün Öğretmen Eln\'i taklit ediyorum.',
      };
      if (saved[b.dataset.slot]) say(lines[b.dataset.v]);
    });
  }

  K.room({
    id: 'angela',
    title: 'Angela\'nın Odası',
    sub: 'Dokun, konuş, sor, giydir',
    icon: 'angela',
    color: '#D6F1FF',
    init(el) {
      root = el;
      const hasMic = Boolean(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
      el.innerHTML = `
        <div class="a-layout">
          <div class="a-scene">
            <div class="a-window" aria-hidden="true">${A.flameTowers('#FFB3CE')}<div class="a-window-bar"></div></div>
            <div class="a-frame" aria-hidden="true">${A.kitty({ crown: true, blush: true })}</div>
            <div class="a-stage">
              <p class="a-bubble" id="aBubble" hidden aria-live="polite"></p>
              <div class="a-cat" id="aCat">${A.angela({ body: true })}</div>
              <div class="a-cushion" aria-hidden="true"></div>
            </div>
            <p class="a-tip">Başına, burnuna, yanaklarına, göbeğine ya da kuyruğuna dokun.</p>
          </div>
          <div class="a-side">
            <div class="card a-talk-card">
              <button class="talk-btn no-burst" id="aTalk" ${hasMic ? '' : 'disabled'}>${A.ui('mic')}<span id="aTalkLabel">Basılı tut ve konuş</span></button>
              <p class="muted small" id="aMicNote">${hasMic ? 'Angela söylediğini ince sesiyle tekrar eder. İlk seferde mikrofon izni ister.' : 'Bu cihazda mikrofon yok. Aşağıya yaz, Angela okusun.'}</p>
            </div>
            <div class="card">
              <p class="card-eyebrow">Angela'ya sor</p>
              <form class="a-form" id="aForm" autocomplete="off">
                <input class="input" id="aInput" name="aInput" placeholder="Bir şey sor ya da yaz..." maxlength="120">
                <button class="btn small" type="submit" data-mode="ask">Sor</button>
                <button class="btn small soft" type="button" id="aSay">Söylesin</button>
              </form>
              <div class="a-chips">${D.angela.chips.map((c) => `<button class="chip" type="button">${K.esc(K.fill(c))}</button>`).join('')}</div>
              <label class="a-voice"><input type="checkbox" id="aVoice" checked> Angela cevapları sesli okusun</label>
            </div>
            <div class="card wardrobe">
              <p class="card-eyebrow">Angela'nın gardırobu</p>
              <div class="wear-row">
                <button class="wear" data-slot="head" data-v="tiara">Taç</button>
                <button class="wear" data-slot="head" data-v="bow">Fiyonk</button>
                <button class="wear" data-slot="head" data-v="flowers">Çiçek tacı</button>
                <button class="wear" data-slot="face" data-v="heartglasses">Kalp gözlük</button>
                <button class="wear" data-slot="face" data-v="teacher">Öğretmen gözlüğü</button>
              </div>
            </div>
          </div>
        </div>`;
      cat = K.$('#aCat', el);
      bubbleEl = K.$('#aBubble', el);
      mouth(0);
      cat.addEventListener('click', (e) => {
        const z = e.target.closest('[data-zone]');
        react(z ? z.dataset.zone : 'belly');
      });
      K.$('#aForm', el).addEventListener('submit', (e) => {
        e.preventDefault();
        const v = K.$('#aInput', el).value.trim();
        if (!v) return;
        lastTouch = Date.now();
        K.stickers.bump('angelaTouch', 10, 'angela');
        answer(v);
        K.$('#aInput', el).value = '';
      });
      K.$('#aSay', el).addEventListener('click', () => {
        const v = K.$('#aInput', el).value.trim();
        if (!v) return say('Önce bir şey yaz, sonra ben söyleyeyim.');
        lastTouch = Date.now();
        say(v, { voice: true });
      });
      K.$('.a-chips', el).addEventListener('click', (e) => {
        const c = e.target.closest('.chip');
        if (!c) return;
        lastTouch = Date.now();
        K.stickers.bump('angelaTouch', 10, 'angela');
        answer(c.textContent);
      });
      initTalk();
      wardrobe();
      if (window.speechSynthesis) window.speechSynthesis.getVoices();
    },
    enter() {
      lastTouch = Date.now();
      setTimeout(() => say(K.pick(D.angela.greet)), 500);
      clearInterval(idleTimer);
      idleTimer = setInterval(() => {
        if (Date.now() - lastTouch > 18000) {
          lastTouch = Date.now();
          say(K.pick(IDLE));
        }
      }, 4000);
    },
    leave() {
      clearInterval(idleTimer);
      clearInterval(mouthTimer);
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      if (singing) {
        singing.stop();
        singing = null;
      }
    },
  });
})();
