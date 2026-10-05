/* Kale 2.0 — Dokunuşlar (kalp menüsünden): Uzaktan Öpücük ve Kalp Atışı.
   Öpücük: ekranda bir (en fazla üç) yere dokunulur; onun ekranında tam o noktalarda ruj izi belirir, Pamuk utanıp
   gözlerini kapatır. Kalp Atışı: parmak arka kameraya konur, 15 sn'de nabız ölçülür (kırmızı ışık değişiminden);
   kamera yoksa nabzı hissettikçe ekrana dokunulur. Onun ekranında kalp aynı ritimde atar, ses ve titreşimle.
   O kalede değilse ana salonda kart olarak bekler. Kayıtlar: opucuk {pts, c} · nabiz {bpm, how, line} */
(function () {
  'use strict';
  const K = window.K;
  const D = window.ELN;
  const C = D.config;

  const DK = () => D.dokunus || { kissColors: [['kirmizi', '#E3174D', 'Kırmızı']], pulseLines: [''] };
  const mine = () => (K.isOwner() ? 'me' : 'her');
  const nameOf = (w) => (w === 'me' ? C.myPet : C.herPet);
  const on = () => Boolean(K.cloud && K.cloud.enabled);
  let rows = [], loaded = false;
  const seen = () => K.store.get('dokunusSeen', {});
  const markSeen = (id) => {
    const s = seen();
    s[id] = 1;
    K.store.set('dokunusSeen', s);
  };
  const unseen = () => rows.filter((r) => r.who !== mine() && !seen()[r.id] && Date.now() - r.at < 5 * 864e5).sort((a, b) => a.at - b.at);

  /* ---------- Dudak izi ---------- */
  const lips = (c) => `<svg class="dt-lips" viewBox="0 0 100 62" aria-hidden="true"><g fill="${c}">
    <path d="M50 19C44 7 31 4 21 11 13 17 7 21 2 24c8 2 16 0 24-2 8-2 16 0 24 2 8-2 16-4 24-2 8 2 16 4 24 2-5-3-11-7-19-13C69 4 56 7 50 19Z"/>
    <path d="M2 27c12 4 22 21 48 25 26-4 36-21 48-25-10 4-22 6-32 4-8-2-12 0-16 0s-8-2-16 0C24 33 12 31 2 27Z"/></g>
    <g stroke="#fff" stroke-opacity=".35" stroke-width="1.2" fill="none" stroke-linecap="round"><path d="M30 12q2 5 1 9M40 10q1 5 0 10M60 10q-1 5 0 10M70 12q-2 5-1 9M28 33q2 6 1 12M40 36q1 6 0 11M60 36q-1 6 0 11M72 33q-2 6-1 12"/></g></svg>`;

  function kiss() {
    if (!on()) return K.fx.toast('Bunun için bulut gerekiyor.');
    K.kalp && K.kalp.closeMenu();
    const colors = DK().kissColors || [['kirmizi', '#E3174D', 'Kırmızı']];
    let c = colors[0][1];
    const pts = [];
    const ov = K.el(`<div class="dt-kiss pick" role="dialog" aria-label="Uzaktan öpücük">
      <p class="dt-tip">💋 ${K.esc(DK().kissIntro || '')}</p>
      <div class="dt-marks"></div>
      <div class="dt-bar"><div class="dt-colors">${colors.map(([id, hex, l], i) => `<button type="button" class="${i ? '' : 'on'}" data-dt-c="${hex}" aria-label="${K.esc(l)}" style="--c:${hex}"></button>`).join('')}</div>
        <button type="button" class="btn ghost small" data-dt-x>Vazgeç</button><button type="button" class="btn red small" data-dt-send disabled>💋 Gönder</button></div></div>`);
    document.body.appendChild(ov);
    requestAnimationFrame(() => ov.classList.add('in'));
    const close = () => {
      ov.classList.remove('in');
      setTimeout(() => ov.remove(), 300);
    };
    ov.addEventListener('click', async (e) => {
      const cb = e.target.closest('[data-dt-c]');
      if (cb) {
        c = cb.dataset.dtC;
        K.$$('[data-dt-c]', ov).forEach((b) => b.classList.toggle('on', b === cb));
        K.$$('.dt-lips g:first-child', ov).forEach((g) => g.setAttribute('fill', c));
        return;
      }
      if (e.target.closest('[data-dt-x]')) return close();
      const sb = e.target.closest('[data-dt-send]');
      if (sb) {
        sb.disabled = true;
        const r = await K.cloud.add('opucuk', { pts, c });
        if (!r) return (sb.disabled = false), K.fx.toast('Gönderilemedi.');
        push(r);
        K.cloud.send('dokunus', { t: 'kiss', id: r.id });
        K.ping(`💋 ${K.meName()} sana bir öpücük gönderdi`, 'Ekranına dokununca göreceksin.', ['kiss'], { click: K.roomUrl('') });
        K.audio.sfx.sparkle();
        K.stickers.award('opucuk');
        K.fx.toast(`💋 ${K.esc(DK().kissSent || 'Gönderildi.')}`, { duration: 2600 });
        return close();
      }
      if (e.target.closest('.dt-bar, .dt-tip') || pts.length >= 3) return;
      const x = e.clientX / innerWidth, y = e.clientY / innerHeight;
      pts.push([+x.toFixed(3), +y.toFixed(3)]);
      K.$('.dt-marks', ov).insertAdjacentHTML('beforeend', `<span class="dt-mark" style="left:${x * 100}%;top:${y * 100}%;--r:${(Math.random() * 30 - 15).toFixed(0)}deg">${lips(c)}</span>`);
      K.audio.sfx.pop();
      K.vibrate(20);
      K.$('[data-dt-send]', ov).disabled = false;
      K.$('[data-dt-send]', ov).textContent = `💋 Gönder${pts.length > 1 ? ` (${pts.length})` : ''}`;
    });
  }
  function showKiss(r) {
    markSeen(r.id);
    const ov = K.el(`<div class="dt-kiss show" role="dialog" aria-label="Öpücük">
      <div class="dt-marks">${(r.data.pts || [[0.5, 0.45]]).map(([x, y], i) => `<span class="dt-mark" style="left:${x * 100}%;top:${y * 100}%;--d:${i * 0.35}s;--r:${(i * 13) % 30 - 15}deg">${lips(r.data.c || '#E3174D')}</span>`).join('')}</div>
      <div class="dt-cat" aria-hidden="true">🙈</div>
      <p class="dt-from">💋 ${K.esc(K.fill((DK().kissGot || '{from} sana bir öpücük bıraktı').replace('{from}', nameOf(r.who))))}<small>${K.esc(K.ago(r.at))} · dokun, kapansın</small></p></div>`);
    document.body.appendChild(ov);
    requestAnimationFrame(() => ov.classList.add('in'));
    K.audio.sfx.chime();
    K.vibrate([60, 50, 120]);
    const close = () => {
      ov.classList.remove('in');
      setTimeout(() => ov.remove(), 400);
    };
    ov.addEventListener('click', close);
    setTimeout(close, 6500);
  }

  /* ---------- Kalp atışı ---------- */
  function thump(ctx, t, f, g) {
    const o = ctx.createOscillator(), v = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(f, t);
    o.frequency.exponentialRampToValueAtTime(f * 0.6, t + 0.12);
    v.gain.setValueAtTime(0.0001, t);
    v.gain.exponentialRampToValueAtTime(g, t + 0.015);
    v.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
    o.connect(v).connect(ctx.destination);
    o.start(t);
    o.stop(t + 0.2);
  }
  function beat(el, bpm, n, sound) {
    const ms = 60000 / bpm;
    let i = 0;
    const ctx = sound && K.audio.ensure() ? K.audio.ctx : null;
    const tick = () => {
      if (!el.isConnected || i++ >= n) return;
      el.classList.remove('beat');
      void el.offsetWidth;
      el.classList.add('beat');
      if (ctx) {
        thump(ctx, ctx.currentTime, 70, 0.5);
        thump(ctx, ctx.currentTime + 0.17, 58, 0.3);
      }
      K.vibrate([40, 120, 30]);
      setTimeout(tick, ms);
    };
    tick();
  }
  function pulse() {
    if (!on()) return K.fx.toast('Bunun için bulut gerekiyor.');
    K.kalp && K.kalp.closeMenu();
    let stream = null, raf = 0, taps = [];
    const m = K.ui.modal({
      label: 'Kalp atışım',
      cls: 'dt-pulse',
      onClose: () => stop(),
      html: `<div class="dt-heart" aria-hidden="true">💓</div><h2>Kalp atışım</h2><p class="muted">${K.esc(DK().pulseIntro || '')}</p>
        <canvas class="dt-wave" width="300" height="70" aria-hidden="true"></canvas>
        <p class="dt-bpm"><b data-bpm>--</b><small>atış/dk</small></p><p class="dt-st muted small" data-st></p>
        <div class="row center"><button type="button" class="btn red" data-dt-cam>📷 Kamerayla ölç</button><button type="button" class="btn soft" data-dt-tap>👆 Dokunarak ölç</button></div>
        <button type="button" class="btn red dt-send" data-dt-go hidden>💓 Ona gönder</button>`,
    });
    const el = m.body;
    const st = (t) => (K.$('[data-st]', el).textContent = t);
    const setBpm = (b) => {
      K.$('[data-bpm]', el).textContent = b ? Math.round(b) : '--';
      m.bpm = b;
      K.$('[data-dt-go]', el).hidden = !b;
      if (b) beat(K.$('.dt-heart', el), b, 6, false);
    };
    function stop() {
      cancelAnimationFrame(raf);
      if (stream) stream.getTracks().forEach((t) => t.stop());
      stream = null;
    }
    async function camera() {
      stop();
      setBpm(0);
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: { ideal: 160 }, height: { ideal: 120 } }, audio: false });
      } catch (e) {
        return st('Kamera açılamadı. "Dokunarak ölç"ü dene.');
      }
      const track = stream.getVideoTracks()[0];
      try {
        const cap = track.getCapabilities ? track.getCapabilities() : {};
        if (cap.torch) await track.applyConstraints({ advanced: [{ torch: true }] });
      } catch (e) {}
      const v = document.createElement('video');
      v.playsInline = true;
      v.muted = true;
      v.srcObject = stream;
      await v.play().catch(() => {});
      const cv = document.createElement('canvas');
      cv.width = 40;
      cv.height = 30;
      const cx = cv.getContext('2d', { willReadFrequently: true });
      const wave = K.$('.dt-wave', el).getContext('2d');
      const samples = [];
      const t0 = performance.now();
      const DUR = 15000;
      const loop = () => {
        if (!stream) return;
        cx.drawImage(v, 0, 0, 40, 30);
        const d = cx.getImageData(0, 0, 40, 30).data;
        let r = 0, g = 0;
        for (let i = 0; i < d.length; i += 4) (r += d[i]), (g += d[i + 1]);
        const n = d.length / 4;
        const t = performance.now() - t0;
        samples.push([t, r / n, g / n]);
        drawWave(wave, samples);
        const finger = r / n > 60 && r / n > (g / n) * 1.3;
        st(finger ? `Ölçülüyor... ${Math.ceil((DUR - t) / 1000)} sn` : 'Parmağını kameranın üstüne hafifçe bastır.');
        if (!finger && t > 3000 && samples.filter((s) => s[1] > 60 && s[1] > s[2] * 1.3).length < samples.length * 0.2) {
          // parmak yoksa süreyi yeniden başlat
          samples.length = 0;
          return (raf = requestAnimationFrame(() => camera()));
        }
        if (t >= DUR) {
          stop();
          const b = analyze(samples);
          if (b) {
            st('Ölçüldü.');
            setBpm(b);
          } else st('Ritim net değil. Parmağını kıpırdatmadan tekrar dene ya da dokunarak ölç.');
          return;
        }
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    }
    function tapMode() {
      stop();
      taps = [];
      setBpm(0);
      st('Nabzını bileğinde ya da boynunda hisset; her vuruşta kalbe dokun.');
      const h = K.$('.dt-heart', el);
      h.classList.add('tappable');
      h.onclick = () => {
        taps.push(performance.now());
        h.classList.remove('beat');
        void h.offsetWidth;
        h.classList.add('beat');
        K.vibrate(15);
        if (taps.length >= 6) {
          const iv = taps.slice(-9).slice(1).map((t, i, a) => t - taps.slice(-9)[i]);
          const med = iv.slice().sort((a, b) => a - b)[Math.floor(iv.length / 2)];
          const b = 60000 / med;
          if (b > 40 && b < 180) {
            K.$('[data-bpm]', el).textContent = Math.round(b);
            m.bpm = b;
            K.$('[data-dt-go]', el).hidden = false;
          }
        }
        st(taps.length < 6 ? `${6 - taps.length} vuruş daha...` : 'Güzel. İstersen biraz daha devam et, sonra gönder.');
      };
    }
    el.addEventListener('click', async (e) => {
      if (e.target.closest('[data-dt-cam]')) return camera();
      if (e.target.closest('[data-dt-tap]')) return tapMode();
      const g = e.target.closest('[data-dt-go]');
      if (!g || !m.bpm) return;
      g.disabled = true;
      const line = K.pick(DK().pulseLines || ['']);
      const r = await K.cloud.add('nabiz', { bpm: Math.round(m.bpm), how: stream || !taps.length ? 'kamera' : 'dokunus', line });
      if (!r) return (g.disabled = false), K.fx.toast('Gönderilemedi.');
      push(r);
      K.cloud.send('dokunus', { t: 'pulse', id: r.id });
      K.ping(`💓 ${K.meName()} kalp atışını gönderdi: ${r.data.bpm}`, line, ['heartbeat'], { click: K.roomUrl('') });
      K.stickers.award('nabiz');
      K.audio.sfx.chime();
      m.close();
      K.fx.toast(`💓 Kalbin ona ulaştı: <b>${r.data.bpm}</b> atış/dk`, { duration: 3000 });
    });
  }
  function drawWave(g, s) {
    const W = 300, H = 70;
    g.clearRect(0, 0, W, H);
    const tail = s.slice(-120);
    if (tail.length < 2) return;
    const vs = tail.map((x) => x[1]);
    const lo = Math.min(...vs), hi = Math.max(...vs);
    g.strokeStyle = '#E3174D';
    g.lineWidth = 2;
    g.beginPath();
    tail.forEach((x, i) => {
      const px = (i / 119) * W, py = H - 6 - ((x[1] - lo) / Math.max(1, hi - lo)) * (H - 12);
      i ? g.lineTo(px, py) : g.moveTo(px, py);
    });
    g.stroke();
  }
  // Kırmızı kanal: yavaş değişimi çıkar, tepeleri bul, aralıkların ortancası → atış/dk
  function analyze(s) {
    if (s.length < 60) return 0;
    const t = s.map((x) => x[0]), v = s.map((x) => x[1]);
    const win = Math.max(5, Math.round(s.length / (t[t.length - 1] / 1000)));
    const det = v.map((x, i) => {
      const a = Math.max(0, i - win), b = Math.min(v.length, i + win);
      let m = 0;
      for (let k = a; k < b; k++) m += v[k];
      return x - m / (b - a);
    });
    const sm = det.map((x, i) => (det[i - 1] || x) * 0.25 + x * 0.5 + (det[i + 1] || x) * 0.25);
    const sd = Math.sqrt(sm.reduce((a, x) => a + x * x, 0) / sm.length);
    const peaks = [];
    for (let i = 2; i < sm.length - 2; i++) {
      if (sm[i] > sd * 0.4 && sm[i] >= sm[i - 1] && sm[i] >= sm[i + 1] && sm[i] >= sm[i - 2] && sm[i] >= sm[i + 2] && (!peaks.length || t[i] - peaks[peaks.length - 1] > 330)) peaks.push(t[i]);
    }
    if (peaks.length < 6) return 0;
    const iv = peaks.slice(1).map((p, i) => p - peaks[i]).sort((a, b) => a - b);
    const med = iv[Math.floor(iv.length / 2)];
    const spread = (iv[Math.floor(iv.length * 0.75)] - iv[Math.floor(iv.length * 0.25)]) / med;
    const bpm = 60000 / med;
    return bpm > 42 && bpm < 175 && spread < 0.45 ? bpm : 0;
  }
  function showPulse(r) {
    markSeen(r.id);
    const bpm = r.data.bpm || 72;
    const ov = K.el(`<div class="dt-pulse-show" role="dialog" aria-label="Kalp atışı"><div class="dt-heart big" aria-hidden="true">💓</div>
      <p class="dt-from">${K.esc(K.fill((DK().pulseGot || '{from} kalbinin atışını gönderdi').replace('{from}', nameOf(r.who))))}<b>${bpm} <small>atış/dk</small></b><span class="hand">${K.esc(r.data.line || '')}</span><small>${K.esc(K.ago(r.at))} · dokun, kapansın</small></p></div>`);
    document.body.appendChild(ov);
    requestAnimationFrame(() => ov.classList.add('in'));
    beat(K.$('.dt-heart', ov), bpm, 14, true);
    const close = () => {
      ov.classList.remove('in');
      setTimeout(() => ov.remove(), 400);
    };
    ov.addEventListener('click', close);
    setTimeout(close, (60000 / bpm) * 14 + 1500);
  }

  const push = (r) => r && !rows.some((x) => x.id === r.id) && rows.push(r);
  function show(r) {
    if (r.kind === 'opucuk') showKiss(r);
    else showPulse(r);
    K.renderSpecials && !K.activeRoom && K.renderSpecials();
  }
  K.on('cloud', async (ok) => {
    if (!ok) return;
    rows = await K.cloud.many(['opucuk', 'nabiz'], { since: Date.now() - 30 * 864e5, limit: 300 });
    loaded = true;
    ['opucuk', 'nabiz'].forEach((k) =>
      K.cloud.on(k, (r) => {
        if (!push(r) || r.who === mine()) return;
        if (document.visibilityState === 'visible') show(r);
        K.renderSpecials && !K.activeRoom && K.renderSpecials();
      })
    );
    K.renderSpecials && !K.activeRoom && K.renderSpecials();
  });
  K.specialHooks = (K.specialHooks || []).concat(() => {
    if (!loaded) return [];
    const u = unseen();
    if (!u.length) return [];
    const k = u.filter((r) => r.kind === 'opucuk'), p = u.filter((r) => r.kind === 'nabiz');
    const who = nameOf(u[0].who);
    return [
      k.length ? { icon: 'heart', title: `💋 ${who} sana ${k.length > 1 ? `${k.length} öpücük` : 'bir öpücük'} bıraktı`, text: 'Ekranında tam bıraktığı yerde duruyor.', run: () => k.forEach((r, i) => setTimeout(() => show(r), i * 7000)), cta: 'Gör' } : null,
      p.length ? { icon: 'heart', title: `💓 ${who} kalp atışını gönderdi`, text: `${p[p.length - 1].data.bpm} atış/dk. Dokun, hisset.`, run: () => p.forEach((r, i) => setTimeout(() => show(r), i * 9000)), cta: 'Hisset' } : null,
    ].filter(Boolean);
  });
  K.dokunus = { kiss, pulse, analyze, count: (k) => rows.filter((r) => r.kind === k).length };
})();
