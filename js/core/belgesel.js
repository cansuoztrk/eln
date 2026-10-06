/* Kale film motoru — Zaman Tüneli Belgeseli, Doğum Günü Filmi ve On Saniyelik Anlar montajı bunu kullanır.
   K.belgesel.play(scenes, {mood, onEnd, cls}) tam ekran bir perde açar; sahneler hikâye gibi akar (üstte ilerleme
   çizgileri, sağa dokun: ileri, sola: geri, basılı tut: dur). Sahne türleri:
     baslik {eyebrow, title, sub} · foto {src, full, caption, sub} (Ken Burns) · yazi {text, by} (harf harf)
     sayi {title, items: [[n, etiket]]} · ses {audio, by, text} · video {vid, by, caption} · kapanis {text, sub}
     ozel {html, onShow(el, next)} (pasta, dilek...)
   K.belgesel.music(mood) tarayıcıda üretilen arka plan müziği: 'sicak' | 'nostalji' | 'kutlama' | 'gece'. */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;

  /* ---------- Müzik ---------- */
  const MOODS = {
    sicak: { bpm: 76, prog: [[60, 64, 67], [55, 59, 62], [57, 60, 64], [53, 57, 60]], arp: [0, 1, 2, 1] },
    nostalji: { bpm: 68, prog: [[57, 60, 64], [53, 57, 60], [60, 64, 67], [55, 59, 62]], arp: [0, 2, 1, 2] },
    kutlama: { bpm: 104, prog: [[53, 57, 60], [60, 64, 67], [55, 59, 62], [60, 64, 67]], arp: [0, 1, 2, 3] },
    gece: { bpm: 60, prog: [[57, 60, 64], [52, 55, 59], [53, 57, 60], [52, 56, 59]], arp: [0, 2, 1, 0] },
  };
  const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
  function music(mood = 'sicak') {
    const c = K.audio.ensure && K.audio.ensure();
    if (!c || (K.atolye && K.atolye.get().ses === false)) return { stop() {}, duck() {} };
    K.audio.music.on && K.audio.music.stop(false);
    const M = MOODS[mood] || MOODS.sicak;
    const out = c.createGain();
    out.gain.setValueAtTime(0.0001, c.currentTime);
    out.gain.exponentialRampToValueAtTime(0.16, c.currentTime + 2.5);
    const lp = c.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 1800;
    lp.connect(out).connect(c.destination);
    const beat = 60 / M.bpm, bar = beat * 4;
    let next = c.currentTime + 0.1, i = 0, alive = true;
    function note(m, t, len, type, vol) {
      const o = c.createOscillator(), g = c.createGain();
      o.type = type;
      o.frequency.value = hz(m);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + (type === 'sine' ? 0.6 : 0.02));
      g.gain.exponentialRampToValueAtTime(0.0001, t + len);
      o.connect(g).connect(lp);
      o.start(t);
      o.stop(t + len + 0.05);
    }
    function schedule() {
      if (!alive) return;
      while (next < c.currentTime + bar * 1.5) {
        const ch = M.prog[i % M.prog.length];
        ch.forEach((m) => note(m - 12, next, bar * 1.05, 'sine', 0.07));
        note(ch[0] - 24, next, bar, 'triangle', 0.05);
        for (let s = 0; s < 8; s++) {
          const idx = M.arp[s % M.arp.length];
          const m = idx === 3 ? ch[0] + 12 : ch[idx] + 12;
          note(m, next + s * (beat / 2), beat * 0.9, 'triangle', s % 4 === 0 ? 0.05 : 0.032);
        }
        next += bar;
        i++;
      }
    }
    schedule();
    const t = setInterval(schedule, 500);
    return {
      duck(v) {
        out.gain.setTargetAtTime(alive ? 0.16 * v + 0.0001 : 0.0001, c.currentTime, 0.4);
      },
      stop(fade = 1.6) {
        if (!alive) return;
        alive = false;
        clearInterval(t);
        out.gain.setTargetAtTime(0.0001, c.currentTime, fade / 3);
        setTimeout(() => out.disconnect(), fade * 1000 + 400);
      },
    };
  }

  /* ---------- Perde ---------- */
  const DUR = { baslik: 4200, foto: 5200, yazi: 6200, sayi: 6000, kapanis: 7000, ozel: 0, ses: 0, video: 0 };
  function play(scenes, opt = {}) {
    if (!scenes || !scenes.length) return K.fx.toast('Bu filmde henüz sahne yok.');
    const el = K.el(`<div class="bg-perde ${opt.cls || ''}" role="dialog" aria-label="${K.esc(opt.label || 'Film')}">
      <div class="bg-cizgiler">${scenes.map(() => '<span><i></i></span>').join('')}</div>
      <button type="button" class="bg-kapat" aria-label="Kapat">×</button><button type="button" class="bg-dur" aria-label="Duraklat">❚❚</button>
      <div class="bg-sahne"></div><button type="button" class="bg-geri" aria-label="Geri"></button><button type="button" class="bg-ileri" aria-label="İleri"></button>
      <button type="button" class="bg-sesac" hidden>🔊 Sesi aç</button></div>`);
    document.body.appendChild(el);
    document.body.classList.add('bg-acik');
    const stage = K.$('.bg-sahne', el);
    const bars = K.$$('.bg-cizgiler i', el);
    const mus = music(opt.mood);
    // Tek video ve tek ses öğesi bütün sahnelerde kullanılır: iPhone bir kez dokunulan öğenin sonra kendiliğinden çalmasına izin verir
    const vEl = document.createElement('video');
    vEl.playsInline = true;
    vEl.setAttribute('playsinline', '');
    const aEl = new Audio();
    const sesac = K.$('.bg-sesac', el);
    let idx = -1, timer = 0, total = 0, startAt = 0, pausedAt = 0, paused = false, media = null, closed = false;
    function setBar(i, p) {
      bars.forEach((b, j) => (b.style.width = j < i ? '100%' : j > i ? '0%' : (p * 100).toFixed(1) + '%'));
    }
    let raf = 0;
    const prog = () => (total ? Math.min(1, ((paused ? pausedAt : performance.now()) - startAt) / total) : 0);
    function tick() {
      if (closed) return;
      if (media && media.duration) setBar(idx, media.currentTime / media.duration);
      else setBar(idx, prog());
      raf = requestAnimationFrame(tick);
    }
    function arm(ms) {
      clearTimeout(timer);
      total = ms;
      startAt = performance.now();
      if (ms) timer = setTimeout(() => go(idx + 1), ms);
    }
    function stopMedia() {
      if (media) {
        media.pause();
        media.onended = null;
        media = null;
      }
      sesac.hidden = true;
      mus.duck(1);
    }
    async function show(i) {
      stopMedia();
      const s = scenes[i];
      const d = s.dur || DUR[s.t] || 5000;
      stage.innerHTML = '';
      const box = K.el(`<div class="bg-s bg-${s.t}"></div>`);
      stage.appendChild(box);
      if (s.t === 'baslik') box.innerHTML = `${s.eyebrow ? `<p class="bg-ust">${K.esc(s.eyebrow)}</p>` : ''}<h2>${K.esc(s.title)}</h2>${s.sub ? `<p class="bg-alt">${K.esc(s.sub)}</p>` : ''}`;
      if (s.t === 'kapanis') box.innerHTML = `${A.kitty({ eyes: 'happy', cls: 'bg-kitty' })}<h2>${K.esc(s.text)}</h2>${s.sub ? `<p class="bg-alt">${K.esc(s.sub)}</p>` : ''}`;
      if (s.t === 'foto') {
        const dir = ['kb1', 'kb2', 'kb3', 'kb4'][i % 4];
        box.innerHTML = `<div class="bg-kb ${dir}" style="--d:${d}ms"><img src="${s.src}" alt=""></div><div class="bg-yazi">${s.caption ? `<b>${K.esc(s.caption)}</b>` : ''}${s.sub ? `<small>${K.esc(s.sub)}</small>` : ''}</div>`;
        if (s.full && K.medya) K.medya.rowUrl(s.full, 'img').then((u) => u && scenes[idx] === s && K.$('img', box) && (K.$('img', box).src = u));
      }
      if (s.t === 'yazi') {
        box.innerHTML = `<blockquote><p></p>${s.by ? `<cite>${K.esc(s.by)}</cite>` : ''}</blockquote>`;
        const p = K.$('p', box);
        const txt = String(s.text);
        let n = 0;
        const step = Math.max(18, Math.min(60, (d * 0.55) / Math.max(1, txt.length)));
        const ty = setInterval(() => {
          if (scenes[idx] !== s) return clearInterval(ty);
          p.textContent = txt.slice(0, ++n);
          if (n >= txt.length) clearInterval(ty);
        }, step);
      }
      if (s.t === 'sayi') {
        box.innerHTML = `${s.title ? `<p class="bg-ust">${K.esc(s.title)}</p>` : ''}<div class="bg-sayilar">${s.items.map(([n, l]) => `<div><b data-n="${n}">0</b><span>${K.esc(l)}</span></div>`).join('')}</div>`;
        K.$$('[data-n]', box).forEach((b) => {
          const to = +b.dataset.n, st = performance.now();
          const f = (now) => {
            const k = Math.min(1, (now - st) / 1600);
            b.textContent = K.num(Math.round(to * (1 - Math.pow(1 - k, 3))));
            k < 1 && scenes[idx] === s && requestAnimationFrame(f);
          };
          requestAnimationFrame(f);
        });
      }
      if (s.t === 'ses' || s.t === 'video') {
        box.innerHTML = s.t === 'ses' ? `<div class="bg-dalga">${Array.from({ length: 24 }, (_, j) => `<i style="--i:${j}"></i>`).join('')}</div><p class="bg-ust">${K.esc(s.by || '')}</p>${s.text ? `<h3>${K.esc(s.text)}</h3>` : ''}` : `<div class="bg-yazi">${s.caption ? `<b>${K.esc(s.caption)}</b>` : ''}${s.by ? `<small>${K.esc(s.by)}</small>` : ''}</div>`;
        if (s.t === 'video') box.prepend(vEl);
        let url = s.url;
        try {
          url = url || (K.medya && (await K.medya.rowUrl(s.t === 'ses' ? s.audio : s.vid, 'b64')));
        } catch (e) {
          url = null;
        }
        if (scenes[idx] !== s) return;
        if (!url) return arm(1500);
        media = s.t === 'ses' ? aEl : vEl;
        media.src = url;
        media.muted = false;
        media.onended = () => scenes[idx] === s && go(idx + 1);
        mus.duck(s.t === 'ses' ? 0.18 : 0.35);
        arm(0);
        media.play().catch(() => {
          if (scenes[idx] !== s || !media) return;
          // Kendiliğinden sesli çalmaya izin yoksa: video sessiz başlar, ses için bir dokunuş istenir
          sesac.hidden = false;
          sesac.textContent = s.t === 'ses' ? '▶ Sesi dinle' : '🔊 Sesi aç';
          if (s.t === 'video') {
            media.muted = true;
            media.play().catch(() => arm(4000));
          }
        });
        return;
      }
      if (s.t === 'ozel') {
        box.innerHTML = s.html || '';
        s.onShow && s.onShow(box, () => go(idx + 1), mus);
        return arm(s.dur || 0);
      }
      arm(d);
    }
    function go(i) {
      if (closed) return;
      const prev = scenes[idx];
      prev && prev.onLeave && prev.onLeave();
      if (i >= scenes.length) return close(true);
      idx = Math.max(0, i);
      el.classList.toggle('etkilesim', scenes[idx].t === 'ozel');
      paused = false;
      el.classList.remove('durdu');
      show(idx);
    }
    function close(done) {
      if (closed) return;
      closed = true;
      clearTimeout(timer);
      cancelAnimationFrame(raf);
      stopMedia();
      mus.stop();
      scenes.forEach((s) => s.onLeave && s.onLeave());
      el.classList.add('kapaniyor');
      setTimeout(() => el.remove(), 400);
      document.body.classList.remove('bg-acik');
      opt.onEnd && opt.onEnd(Boolean(done));
    }
    function pause(on) {
      if (paused === on) return;
      paused = on;
      el.classList.toggle('durdu', on);
      if (on) {
        clearTimeout(timer);
        pausedAt = performance.now();
        media && media.pause();
      } else {
        startAt += performance.now() - pausedAt;
        if (media) media.play().catch(() => {});
        else if (total) timer = setTimeout(() => go(idx + 1), Math.max(0, total - (performance.now() - startAt)));
      }
    }
    el.addEventListener('click', (e) => {
      if (e.target.closest('.bg-sesac')) {
        sesac.hidden = true;
        if (media) {
          media.muted = false;
          media.play().catch(() => {});
        }
        return;
      }
      if (e.target.closest('.bg-kapat')) return close(false);
      if (e.target.closest('.bg-dur')) return pause(!paused);
      if (e.target.closest('.bg-ileri')) return go(idx + 1);
      if (e.target.closest('.bg-geri')) return go(idx - 1);
    });
    const onKey = (e) => {
      if (closed) return document.removeEventListener('keydown', onKey);
      if (e.key === 'Escape') close(false);
      if (e.key === 'ArrowRight') go(idx + 1);
      if (e.key === 'ArrowLeft') go(idx - 1);
      if (e.key === ' ') pause(!paused);
    };
    document.addEventListener('keydown', onKey);
    go(0);
    raf = requestAnimationFrame(tick);
    return { close, go, el };
  }
  K.belgesel = { play, music, MOODS };
})();
