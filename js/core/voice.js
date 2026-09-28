/* Eln'in Krallığı — sesli notlar: şifreli ses dosyalarını çözer, alttan açılan bir çalar ve senkron yazıyla oynatır.
   Dosyası olmayan ses hiçbir yerde görünmez. */
(function () {
  'use strict';
  const K = window.K;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  const heard = () => K.store.get('voicesHeard', {});
  const def = (id) => D.voices.find((v) => v.id === id);
  const exists = (id) => Boolean((C.voiceFiles || {})[id]) && Boolean(def(id));
  // Kilit: 'YYYY-MM-DD' o günden sonra; 'MM-DD' her yıl sadece o gün (bir kez dinlenince açık kalır)
  function unlocked(v) {
    if (!v.lock || heard()[v.id]) return true;
    if (v.lock.length === 5) {
      const p = T.baku();
      return `${K.pad(p.mo)}-${K.pad(p.d)}` === v.lock;
    }
    return T.daysUntil(v.lock) <= 0;
  }
  const has = (id) => exists(id) && unlocked(def(id));
  const list = () => D.voices.filter((v) => exists(v.id));
  const any = () => list().length > 0;

  const btn = (id, label, cls = '') =>
    has(id) ? `<button type="button" class="voice-btn ${cls}" data-voice="${K.esc(id)}"><span class="vb-wave" aria-hidden="true"><i></i><i></i><i></i><i></i></span>${K.esc(label || 'Sesini dinle')}</button>` : '';

  let el, audio, raf, resumeMusic = false, current = null;
  function sheet() {
    if (el) return el;
    el = K.el(`<div class="vp" role="dialog" aria-label="Sesli not" hidden>
      <div class="vp-in">
        <div class="vp-top">
          <span class="vp-disc" aria-hidden="true">${K.art.kitty({ bow: '#4FA3E3', blush: true, eyes: 'happy' })}</span>
          <div class="vp-titles"><p class="vp-by"></p><h3 class="vp-title"></h3></div>
          <button class="icon-btn vp-x" aria-label="Kapat">${K.art.ui('close')}</button>
        </div>
        <div class="vp-lines" aria-live="off"></div>
        <div class="vp-ctrl">
          <button class="vp-play" aria-label="Oynat">${K.art.ui('pause')}</button>
          <div class="vp-bar"><i></i></div>
          <span class="vp-time tnum">0:00</span>
        </div>
      </div>
    </div>`);
    document.body.appendChild(el);
    K.$('.vp-x', el).addEventListener('click', close);
    K.$('.vp-play', el).addEventListener('click', () => {
      if (!audio) return;
      if (audio.paused) audio.play().catch(() => {});
      else audio.pause();
    });
    K.$('.vp-bar', el).addEventListener('click', (e) => {
      if (!audio || !audio.duration) return;
      const r = e.currentTarget.getBoundingClientRect();
      audio.currentTime = K.clamp((e.clientX - r.left) / r.width, 0, 1) * audio.duration;
    });
    return el;
  }
  const fmt = (s) => `${Math.floor(s / 60)}:${K.pad(Math.floor(s % 60))}`;

  function sync() {
    if (!audio) return;
    const d = audio.duration || 0;
    const t = audio.currentTime || 0;
    K.$('.vp-bar i', el).style.width = d ? (t / d) * 100 + '%' : '0%';
    K.$('.vp-time', el).textContent = fmt(d ? d - t : 0);
    // Yazı, satır uzunluğuna göre sesle birlikte ilerler
    const lines = K.$$('.vp-lines p', el);
    const lens = lines.map((p) => p.textContent.length + 12);
    const total = lens.reduce((a, b) => a + b, 0);
    let acc = 0;
    const at = d ? (t / d) * total : 0;
    lines.forEach((p, i) => {
      const on = at >= acc && at < acc + lens[i];
      if (on && !p.classList.contains('on')) p.scrollIntoView({ block: 'center', behavior: K.reduced ? 'auto' : 'smooth' });
      p.classList.toggle('on', on);
      p.classList.toggle('past', at >= acc + lens[i]);
      acc += lens[i];
    });
    raf = requestAnimationFrame(sync);
  }

  async function play(id) {
    const v = def(id);
    if (!v || !has(id)) return;
    sheet();
    stop(false);
    current = id;
    K.$('.vp-by', el).textContent = `${C.myPet}'un sesi · ${v.where || ''}`.replace(/ · $/, '');
    K.$('.vp-title', el).textContent = v.title;
    K.$('.vp-lines', el).innerHTML = v.text.map((l) => `<p>${K.esc(K.fill(l))}</p>`).join('');
    el.hidden = false;
    el.classList.add('loading');
    document.body.classList.add('has-voice');
    requestAnimationFrame(() => el.classList.add('in'));
    if (K.audio.music.on) {
      resumeMusic = true;
      K.audio.music.stop(false);
    }
    let url;
    try {
      url = await K.vault.audio(id);
    } catch (e) {
      K.$('.vp-lines', el).insertAdjacentHTML('afterbegin', '<p class="muted">Ses şu an açılamadı. İnternetini kontrol edip tekrar dene.</p>');
      el.classList.remove('loading');
      return;
    }
    if (current !== id) return;
    audio = new Audio(url);
    audio.addEventListener('play', () => {
      el.classList.add('playing');
      K.$('.vp-play', el).innerHTML = K.art.ui('pause');
    });
    audio.addEventListener('pause', () => {
      el.classList.remove('playing');
      K.$('.vp-play', el).innerHTML = K.art.ui('play');
    });
    audio.addEventListener('ended', () => done(v));
    el.classList.remove('loading');
    audio.play().catch(() => {
      el.classList.remove('playing');
      K.$('.vp-play', el).innerHTML = K.art.ui('play');
    });
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(sync);
  }
  function done(v) {
    const h = heard();
    const first = !h[v.id];
    h[v.id] = T.todayKey();
    K.store.set('voicesHeard', h);
    K.stickers.award('ses');
    if (first) {
      K.fx.rain({ count: 30, duration: 1400 });
      K.notify(`${C.herName} sesini dinledi`, `"${v.title}" sesli notun dinlendi.`, ['headphones']);
    }
    K.emit('voice-heard', v.id);
  }
  function stop(hide = true) {
    cancelAnimationFrame(raf);
    if (audio) {
      audio.pause();
      audio = null;
    }
    current = null;
    if (hide && el) {
      el.classList.remove('in', 'playing');
      document.body.classList.remove('has-voice');
      setTimeout(() => el && !el.classList.contains('in') && (el.hidden = true), 350);
      if (resumeMusic) {
        resumeMusic = false;
        K.audio.music.start();
      }
    }
  }
  const close = () => stop(true);

  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-voice]');
    if (!b) return;
    e.preventDefault();
    K.audio.sfx.tap();
    play(b.dataset.voice);
  });
  document.addEventListener('keydown', (e) => e.key === 'Escape' && el && !el.hidden && close());

  K.voice = { def, has, exists, unlocked, list, any, heard, btn, play, stop: close };
})();
