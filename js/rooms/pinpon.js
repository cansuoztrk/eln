/* Oda: İki Kıyı Pinpon — masanın yarısı İstanbul'da, yarısı Bakü'de. Top (bir kalp) senin ekranının tepesinden çıkınca
   canlı mesajla onun ekranının tepesine düşer; o vurunca sana döner. Aynı anda sadece topun olduğu ekran hesaplar, gecikme sorun olmaz.
   O kalede değilse Kitty ile antrenman: Kitty topu hızlandıkça bazen kaçırır. Yedi sayı alan kazanır.
   Canlı: pp {t: invite|ready|ball|point|bye, gid} · Kayıt: ppwin {gid, winner, score} */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;

  const PP = () => D.pinpon || { intro: [] };
  const mine = () => (K.isOwner() ? 'me' : 'her');
  const other = () => (K.isOwner() ? 'her' : 'me');
  const nameOf = (w) => (w === 'me' ? C.myPet : C.herPet);
  const W = 360, H = 560, PY = 516, PW = 84, PH = 14, R = 13, WIN = 7;

  let root, cv, ctx, raf = 0, last = 0;
  let g = null; // oyun durumu
  let invite = null, incoming = null, wins = [];
  const px = { x: W / 2, target: W / 2 };

  function newGame(mode, gid, serveMe) {
    g = { mode, gid: gid || 'p' + Date.now().toString(36), score: { me: 0, her: 0 }, ball: null, wait: 0, serveAt: 0, hits: 0, over: null, trail: [] };
    if (serveMe) serve();
    else g.away = true;
    status();
  }
  function serve() {
    g.away = false;
    g.ball = null;
    g.serveAt = performance.now() + 1100;
  }
  function launch() {
    const ang = (Math.random() * 0.8 - 0.4);
    const sp = 6.2;
    g.ball = { x: px.x, y: PY - 30, vx: Math.sin(ang) * sp, vy: -Math.cos(ang) * sp, sp };
    g.serveAt = 0;
  }
  // Top ekranın tepesinden çıktı: onun ekranına
  function sendAway(b) {
    g.ball = null;
    g.away = true;
    if (g.mode === 'duo') {
      K.cloud.send('pp', { t: 'ball', gid: g.gid, x: b.x / W, vx: b.vx, vy: b.vy, sp: b.sp });
    } else {
      // Kitty: hız arttıkça kaçırma olasılığı artar
      const miss = Math.random() < K.clamp((b.sp - 8) / 14, 0, 0.45);
      const delay = K.clamp(1400 - b.sp * 45, 520, 1200);
      setTimeout(() => {
        if (!g || g.mode !== 'solo' || g.over) return;
        if (miss) return point(mine());
        const x = K.clamp(W - b.x + (Math.random() * 120 - 60), 30, W - 30);
        const sp = Math.min(17, b.sp * 1.04);
        const ang = Math.random() * 1 - 0.5;
        g.away = false;
        g.ball = { x, y: -R, vx: Math.sin(ang) * sp, vy: Math.cos(ang) * sp, sp };
      }, delay);
    }
    status();
  }
  function arrive(m) {
    if (!g || g.gid !== m.gid) return;
    // Karşı taraf bize bakıyor: x aynalanır, yön aşağı döner
    g.away = false;
    g.ball = { x: K.clamp((1 - m.x) * W, R, W - R), y: -R, vx: -m.vx, vy: Math.abs(m.vy), sp: m.sp };
    status();
  }
  function point(to) {
    if (!g || g.over) return;
    g.score[to]++;
    g.ball = null;
    const me = to === mine();
    K.audio.sfx[me ? 'success' : 'fail']();
    K.vibrate(me ? 30 : [40, 40, 40]);
    const done = g.score[to] >= WIN;
    if (done) {
      g.over = to;
      finish(to);
    } else if (me) {
      // Sayıyı alan değil kaybeden servis atar (antrenmanda Kitty)
      g.away = true;
      if (g.mode === 'solo') {
        const gid = g.gid;
        setTimeout(() => {
          if (!g || g.gid !== gid || g.over) return;
          const ang = Math.random() * 0.8 - 0.4;
          g.away = false;
          g.ball = { x: 60 + Math.random() * (W - 120), y: -R, vx: Math.sin(ang) * 6.2, vy: Math.cos(ang) * 6.2, sp: 6.2 };
        }, 1300);
      }
    } else serve();
    status();
  }
  async function finish(winner) {
    const me = winner === mine();
    if (me) K.fx.confetti({ count: 140 });
    K.fx.toast(`<b>${me ? K.pick(PP().win || ['Kazandın!']) : K.pick(PP().lose || ['Kaybettin.'])}</b> ${g.score.me}–${g.score.her}`, { icon: A.icon('heart'), duration: 6000 });
    if (g.mode === 'duo') {
      K.stickers.award('pinpon');
      // Sonucu kaybeden taraf yazar (son sayıyı o gönderdi)
      if (!me) {
        const r = await K.cloud.add('ppwin', { gid: g.gid, winner, score: g.score });
        if (r) wins.push(r);
        if (!K.isOwner()) K.notify(`Pinpon: ${nameOf(winner)} kazandı`, `${g.score.me}–${g.score.her}`, ['ping_pong']);
      }
    } else if (me) {
      const best = K.store.get('ppSolo', 0) + 1;
      K.store.set('ppSolo', best);
    }
    status();
  }

  /* ---------- Döngü ---------- */
  function step(dt) {
    px.x += (px.target - px.x) * Math.min(1, dt * 0.018);
    if (!g || g.over) return;
    if (!g.ball && g.serveAt && performance.now() > g.serveAt) launch();
    const b = g.ball;
    if (!b) return;
    const k = dt / 16.67;
    b.x += b.vx * k;
    b.y += b.vy * k;
    if (b.x < R) {
      b.x = R;
      b.vx = Math.abs(b.vx);
      K.audio.sfx.tick && K.audio.sfx.tick();
    }
    if (b.x > W - R) {
      b.x = W - R;
      b.vx = -Math.abs(b.vx);
      K.audio.sfx.tick && K.audio.sfx.tick();
    }
    // Raket
    if (b.vy > 0 && b.y + R >= PY - PH / 2 && b.y + R <= PY + PH / 2 + b.vy * k + 2 && Math.abs(b.x - px.x) <= PW / 2 + R * 0.7) {
      const off = K.clamp((b.x - px.x) / (PW / 2), -1, 1);
      b.sp = Math.min(18, b.sp * 1.06);
      const ang = off * 1.0;
      b.vx = Math.sin(ang) * b.sp;
      b.vy = -Math.cos(ang) * b.sp;
      b.y = PY - PH / 2 - R;
      g.hits++;
      K.audio.sfx.tap();
      K.vibrate(8);
    }
    g.trail.push([b.x, b.y]);
    if (g.trail.length > 10) g.trail.shift();
    if (b.y < -R * 1.5) sendAway(b);
    else if (b.y > H + R) {
      // Kaçırdık: sayı onun
      const to = other();
      if (g.mode === 'duo') K.cloud.send('pp', { t: 'point', gid: g.gid, to });
      point(to);
    }
  }
  function heart(x, y, s, fill) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.beginPath();
    ctx.moveTo(0, 7);
    ctx.bezierCurveTo(-11, -1, -11, -12, -4.5, -12);
    ctx.bezierCurveTo(-1.5, -12, 0, -9.5, 0, -8);
    ctx.bezierCurveTo(0, -9.5, 1.5, -12, 4.5, -12);
    ctx.bezierCurveTo(11, -12, 11, -1, 0, 7);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.restore();
  }
  function draw() {
    const gr = ctx.createLinearGradient(0, 0, 0, H);
    const me = mine() === 'me';
    gr.addColorStop(0, me ? '#FFE3EE' : '#DDF0FF');
    gr.addColorStop(1, me ? '#DDF0FF' : '#FFE3EE');
    ctx.fillStyle = gr;
    ctx.fillRect(0, 0, W, H);
    // Masa çizgileri
    ctx.strokeStyle = 'rgba(255,255,255,.9)';
    ctx.lineWidth = 3;
    ctx.strokeRect(10, 10, W - 20, H - 20);
    ctx.setLineDash([2, 10]);
    ctx.beginPath();
    ctx.moveTo(W / 2, 10);
    ctx.lineTo(W / 2, H - 10);
    ctx.stroke();
    ctx.setLineDash([]);
    // Ağ: tepede, onun şehri
    ctx.fillStyle = 'rgba(74,33,56,.08)';
    ctx.fillRect(0, 0, W, 8);
    ctx.fillStyle = '#4A2138';
    ctx.font = '600 13px Fredoka, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`↑ ${me ? C.herCity || 'Bakü' : C.myCity || 'İstanbul'} · ${nameOf(other())}`, W / 2, 28);
    // Skor
    if (g) {
      ctx.font = '700 64px Fredoka, sans-serif';
      ctx.fillStyle = 'rgba(74,33,56,.12)';
      ctx.fillText(String(g.score[other()]), W / 2, H / 2 - 30);
      ctx.fillText(String(g.score[mine()]), W / 2, H / 2 + 70);
    }
    // İz
    if (g && g.ball) {
      g.trail.forEach(([x, y], i) => heart(x, y + 4, 0.35 + i * 0.05, `rgba(255,111,163,${0.05 + i * 0.03})`));
      heart(g.ball.x, g.ball.y + 5, 1.15, '#E3174D');
    }
    // Raket
    ctx.fillStyle = '#FF6FA3';
    ctx.strokeStyle = '#4A2138';
    ctx.lineWidth = 3;
    const x0 = px.x - PW / 2;
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(x0, PY - PH / 2, PW, PH, 7) : ctx.rect(x0, PY - PH / 2, PW, PH);
    ctx.fill();
    ctx.stroke();
    heart(px.x, PY + 2, 0.55, '#fff');
    // Durum yazıları
    ctx.fillStyle = '#4A2138';
    ctx.font = '600 15px Fredoka, sans-serif';
    if (g && g.serveAt) ctx.fillText('Servis sende...', W / 2, H / 2 + 120);
    else if (g && g.away && !g.over) ctx.fillText(`Top ${g.mode === 'duo' ? K.ek(nameOf(other()), 'de') : 'Kitty\'de'}...`, W / 2, H / 2 + 120);
    if (g && g.over) {
      ctx.font = '700 26px Fredoka, sans-serif';
      ctx.fillText(g.over === mine() ? 'Kazandın! ♥' : `${nameOf(g.over)} kazandı`, W / 2, H / 2 + 125);
    }
  }
  function loop(t) {
    const dt = Math.min(40, t - (last || t));
    last = t;
    step(dt);
    draw();
    raf = requestAnimationFrame(loop);
  }

  /* ---------- Arayüz ---------- */
  function status() {
    if (!root) return;
    const box = K.$('#ppBar', root);
    const here = K.cloud && K.cloud.enabled && K.cloud.otherHere();
    const s = g ? `<b>${K.esc(nameOf(mine()))} ${g.score[mine()]}</b> – <b>${g.score[other()]} ${K.esc(g.mode === 'duo' ? nameOf(other()) : 'Kitty')}</b>` : '';
    let acts = '';
    if (incoming && (!g || g.mode !== 'duo' || g.over)) acts = `<span>${K.esc(nameOf(other()))} seni maça çağırıyor!</span><button type="button" class="btn red small" data-pp-accept>Kabul</button>`;
    else if (invite) acts = `<span class="pb-status"><span class="dot on"></span>${K.esc(nameOf(other()))} bekleniyor...</span><button type="button" class="btn ghost small" data-pp-cancel>Vazgeç</button>`;
    else if (!g || g.over || g.mode === 'solo') acts = `${here ? `<button type="button" class="btn red small" data-pp-invite>${A.ui('heart')} ${K.esc(nameOf(other()))} ile maç</button>` : `<span class="muted small">${K.esc(nameOf(other()))} kalede değil</span>`}<button type="button" class="btn soft small" data-pp-solo>${g && g.mode === 'solo' && !g.over ? 'Baştan' : 'Kitty ile antrenman'}</button>`;
    const w = wins.filter((r) => r.data && r.data.winner);
    const tally = w.length ? `<small class="pp-tally">Maçlar: ${K.esc(C.myPet)} ${w.filter((r) => r.data.winner === 'me').length} · ${K.esc(C.herPet)} ${w.filter((r) => r.data.winner === 'her').length}</small>` : '';
    box.innerHTML = `<div class="pp-score">${s || 'Masa hazır'}</div><div class="pp-acts">${acts}</div>${tally}`;
  }
  function resize() {
    if (!cv) return;
    const r = window.devicePixelRatio || 1;
    const w = cv.clientWidth;
    cv.width = Math.round(w * r);
    cv.height = Math.round((w * H) / W * r);
    ctx.setTransform((w * r) / W, 0, 0, (w * r) / W, 0, 0);
  }
  function onLive(m) {
    if (!m || m.who === mine()) return;
    if (m.t === 'invite') {
      incoming = { gid: m.gid, at: Date.now() };
      if (K.activeRoom !== 'pinpon') K.fx.toast(`<b>${K.esc(nameOf(m.who))} seni pinpona çağırıyor.</b> <a href="#pinpon">Masaya geç</a>`, { icon: A.icon('heart'), duration: 12000 });
      else K.audio.sfx.chime();
      return status();
    }
    if (m.t === 'ready' && invite && m.gid === invite.gid) {
      invite = null;
      newGame('duo', m.gid, true);
      K.fx.toast('Maç başladı! Servis sende.', { icon: A.icon('heart'), duration: 2500 });
      return;
    }
    if (m.t === 'cancel' && incoming && incoming.gid === m.gid) {
      incoming = null;
      return status();
    }
    if (m.t === 'ball') return arrive(m);
    if (m.t === 'point' && g && g.gid === m.gid) return point(m.to);
    if (m.t === 'bye' && g && g.gid === m.gid && g.mode === 'duo' && !g.over) {
      K.fx.toast(`${K.esc(nameOf(m.who))} masadan kalktı.`);
      g.over = 'none';
      status();
    }
  }

  K.on('cloud', async (on) => {
    if (!on) return;
    K.cloud.onLive('pp', onLive);
    wins = await K.cloud.list('ppwin', 200);
    K.cloud.on('ppwin', (r) => wins.some((x) => x.id === r.id) || (wins.push(r), status()));
  });
  K.on('presence', () => K.activeRoom === 'pinpon' && status());

  K.room({
    id: 'pinpon',
    wing: 'oyun',
    title: 'İki Kıyı Pinpon',
    sub: 'Masanın yarısı İstanbul\'da, yarısı Bakü\'de',
    icon: 'heart',
    color: '#DDF0FF',
    hidden: () => !D.pinpon,
    badge: () => (incoming && Date.now() - incoming.at < 60000 ? 'Davet var' : ''),
    init(el) {
      root = el;
      el.innerHTML = `<div class="room-intro">${K.paras(PP().intro)}</div>
        <div class="pp-bar card" id="ppBar"></div>
        <div class="pp-stage"><canvas id="ppCv" aria-label="Pinpon masası"></canvas></div>
        <p class="muted small center">Parmağını ekranda sağa sola kaydır ya da ok tuşlarını kullan.</p>`;
      cv = K.$('#ppCv', el);
      ctx = cv.getContext('2d');
      const move = (e) => {
        const r = cv.getBoundingClientRect();
        px.target = K.clamp(((e.clientX - r.left) / r.width) * W, PW / 2, W - PW / 2);
      };
      cv.addEventListener('pointermove', move);
      cv.addEventListener('pointerdown', (e) => {
        move(e);
        try {
          cv.setPointerCapture(e.pointerId);
        } catch (x) {}
      });
      el.addEventListener('click', (e) => {
        if (e.target.closest('[data-pp-solo]')) {
          newGame('solo', null, true);
          return;
        }
        if (e.target.closest('[data-pp-invite]')) {
          invite = { gid: 'p' + Date.now().toString(36) };
          K.cloud.send('pp', { t: 'invite', gid: invite.gid });
          if (!K.isOwner()) K.notify(`${C.herName} seni pinpona çağırıyor`, 'İki Kıyı Pinpon', ['ping_pong']);
          return status();
        }
        if (e.target.closest('[data-pp-cancel]')) {
          if (invite) K.cloud.send('pp', { t: 'cancel', gid: invite.gid });
          invite = null;
          return status();
        }
        if (e.target.closest('[data-pp-accept]') && incoming) {
          K.cloud.send('pp', { t: 'ready', gid: incoming.gid });
          newGame('duo', incoming.gid, false);
          incoming = null;
          return status();
        }
      });
      window.addEventListener('resize', resize);
    },
    enter() {
      const key = (e) => {
        if (K.activeRoom !== 'pinpon') return document.removeEventListener('keydown', key);
        if (e.key === 'ArrowLeft') px.target = Math.max(PW / 2, px.target - 36);
        if (e.key === 'ArrowRight') px.target = Math.min(W - PW / 2, px.target + 36);
      };
      document.addEventListener('keydown', key);
      requestAnimationFrame(() => {
        resize();
        cancelAnimationFrame(raf);
        last = 0;
        raf = requestAnimationFrame(loop);
      });
      if (!g) newGame('solo', null, true);
      status();
    },
    leave() {
      cancelAnimationFrame(raf);
      if (g && g.mode === 'duo' && !g.over) K.cloud.send('pp', { t: 'bye', gid: g.gid });
      if (invite) K.cloud.send('pp', { t: 'cancel', gid: invite.gid });
      invite = null;
      if (g && g.mode === 'duo') g = null;
    },
  });
  K.pinpon = { now: () => g && { mode: g.mode, score: Object.assign({}, g.score), away: g.away, ball: g.ball && Object.assign({}, g.ball), over: g.over, gid: g.gid }, px };
})();
