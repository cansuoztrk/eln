/* Kale 2.0 — Kalp Menüsü ve Alevimiz.
   Alt menünün ortasındaki kalp: dokununca yukarı açılan bir menü. Üstte "ona" gidenler (dürt, sarıl, günaydın / iyi geceler,
   seni düşündüm, özledim), altta birlikte yapılanlar (hikâye, radyo, pinpon, günün kelimesi, hava). Basılı tutunca direkt dürter.
   Alevimiz: ikinizin de kaleye uğradığı ardışık günler (her gün bir "gun" kaydı). 7, 30, 100 günde kutlama.
   Kayıtlar: gun {day} · selam {k, text} · dusun {} · ozlem {} · kucak {} · canlı: kalp {k} */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  const KP = () => D.kalp || {};
  const AL = () => D.alev || { marks: {} };
  const mine = () => (K.isOwner() ? 'me' : 'her');
  const other = () => (K.isOwner() ? 'her' : 'me');
  const nameOf = (w) => (w === 'me' ? C.myPet : C.herPet);
  const on = () => Boolean(K.cloud && K.cloud.enabled);
  // Gönderenin kendi şehrindeki saat: günaydın mı iyi geceler mi?
  const myHour = () => T.parts(K.isOwner() ? C.tzIstanbul : C.tzBaku).h;
  const isNight = () => {
    const h = myHour();
    return h >= 19 || h < 4;
  };

  let gun = [], today = { dusun: [], ozlem: [], selam: [], kucak: [] }, durumlar = [];
  // Şu an ne yapıyorsun? Dört saat geçerli ya da yenisi gelene kadar
  const DURUM = [['musait', '📞', 'Müsaitim, ara'], ['dusun', '💭', 'Seni düşünüyorum'], ['ders', '📚', 'Derste'], ['calisma', '💻', 'Çalışıyorum'], ['yol', '🚌', 'Yoldayım'], ['yemek', '🍽️', 'Yemekteyim'], ['disari', '🌳', 'Dışarıdayım'], ['film', '🎬', 'Film izliyorum'], ['spor', '🏃', 'Spordayım'], ['uyku', '😴', 'Uyuyorum']];
  const DUR_H = 4 * 36e5;
  const durumOf = (w) => {
    const r = durumlar.filter((x) => x.who === w).sort((a, b) => a.at - b.at).pop();
    return r && r.data.k && Date.now() - r.at < DUR_H ? r : null;
  };

  /* ---------- Alev ---------- */
  function streak() {
    const by = {};
    gun.forEach((r) => {
      by[r.data.day] = by[r.data.day] || {};
      by[r.data.day][r.who] = true;
    });
    const t = T.todayKey();
    const both = (k) => by[k] && by[k].me && by[k].her;
    const prev = (k) => {
      const d = new Date(k + 'T12:00:00Z');
      d.setUTCDate(d.getUTCDate() - 1);
      return d.toISOString().slice(0, 10);
    };
    // Bugün henüz ikiniz de yoksa dünden geriye sayılır (alev bugün hâlâ yanabilir)
    let k = both(t) ? t : prev(t), n = 0;
    while (both(k)) {
      n++;
      k = prev(k);
    }
    return { n, todayMe: Boolean(by[t] && by[t][mine()]), todayOther: Boolean(by[t] && by[t][other()]), lit: both(t) };
  }
  async function markDay() {
    if (!on()) return;
    const t = T.todayKey();
    if (gun.some((r) => r.who === mine() && r.data.day === t)) return;
    if (K.store.get('gunMarked-' + mine()) === t) return;
    K.store.set('gunMarked-' + mine(), t);
    const r = await K.cloud.add('gun', { day: t });
    if (r && !gun.some((x) => x.id === r.id)) gun.push(r);
    chips();
  }
  function celebrate() {
    const s = streak();
    if (!s.lit) return;
    const marks = AL().marks || {};
    const done = K.store.get('alevMarks', {});
    const hit = Object.keys(marks).map(Number).filter((m) => s.n >= m && !done[m]).pop();
    if (!hit) return;
    done[hit] = T.todayKey();
    K.store.set('alevMarks', done);
    setTimeout(() => {
      K.fx.confetti({ count: 140, shapes: ['heart', 'spark'] });
      K.fx.toast(`<b>🔥 ${hit} gün!</b> ${K.esc(marks[hit])}`, { icon: A.icon('heart'), duration: 7000 });
      K.stickers.award('alev');
    }, 1500);
  }

  /* ---------- Ana salon: alev ve bugünün sayaçları ---------- */
  function chips() {
    const box = K.$('#kalpBar');
    if (!box) return;
    if (!on()) {
      box.hidden = true;
      return;
    }
    const s = streak();
    const o = other();
    const n = (k) => today[k].filter((r) => r.who === o).length;
    const parts = [];
    const du = durumOf(o);
    if (du) parts.push(`<span class="kb-chip durum">${du.data.emoji} <b>${K.esc(nameOf(o))}:</b> ${K.esc(du.data.text)} <small>${K.esc(K.ago(du.at))}</small></span>`);
    parts.push(`<button type="button" class="kb-chip alev ${s.lit ? 'lit' : s.n ? 'warm' : 'cold'}" data-kb="alev"><span class="kb-fl" aria-hidden="true">🔥</span><b>${s.n}</b> gün${s.lit ? '' : s.n ? ' · bugün yak' : ''}</button>`);
    if (n('dusun')) parts.push(`<span class="kb-chip">💭 ${K.esc(nameOf(o))} bugün seni <b>${n('dusun')}</b> kez düşündü</span>`);
    if (n('ozlem')) parts.push(`<span class="kb-chip">🥺 <b>${n('ozlem')}</b> kez özledi</span>`);
    const sel = today.selam.filter((r) => r.who === o).pop();
    if (sel) parts.push(`<span class="kb-chip">${sel.data.k === 'gece' ? '🌙' : '☀️'} ${K.esc(sel.data.text)}</span>`);
    box.hidden = false;
    box.innerHTML = parts.join('');
    const st = K.$('#dockSt');
    if (st) {
      st.textContent = du ? du.data.emoji : '';
      st.hidden = !du;
    }
    K.emit('kalpbar');
    // Dock'taki kalpte alev sayısı
    const f = K.$('#dockFlame');
    if (f) {
      f.textContent = s.n ? `🔥${s.n}` : '';
      f.hidden = !s.n;
    }
  }
  function alevSheet() {
    const s = streak();
    const marks = AL().marks || {};
    const next = Object.keys(marks).map(Number).find((m) => m > s.n);
    K.ui.modal({
      label: AL().title || 'Alevimiz',
      cls: 'alev-sheet',
      html: `<div class="alev-big ${s.lit ? 'lit' : ''}"><span aria-hidden="true">🔥</span><b>${s.n}</b><small>gün</small></div><h2>${K.esc(AL().title || 'Alevimiz')}</h2><p class="muted">${K.esc(AL().text || '')}</p>
        <ul class="alev-today"><li class="${s.todayMe ? 'ok' : ''}">${K.avatar(mine())}<span>Sen bugün ${s.todayMe ? 'uğradın ✓' : 'henüz yok'}</span></li><li class="${s.todayOther ? 'ok' : ''}">${K.avatar(other())}<span>${K.esc(nameOf(other()))} ${s.todayOther ? 'bugün uğradı ✓' : 'bugün henüz uğramadı'}</span></li></ul>
        ${next ? `<p class="alev-next">Sıradaki kutlama: <b>${next} gün</b> (${next - s.n} gün kaldı)</p>` : ''}
        ${!s.todayOther && K.yan ? `<button type="button" class="btn red" data-kb-durt>${A.ui('heart')} ${K.esc(nameOf(other()))} dürt, alev sönmesin</button>` : ''}`,
    }).body.addEventListener('click', (e) => e.target.closest('[data-kb-durt]') && K.yan.nudge());
  }

  /* ---------- Durumum ---------- */
  function durumSheet() {
    const cur = durumOf(mine());
    const m = K.ui.modal({
      label: 'Durumum',
      cls: 'durum-sheet',
      html: `<p class="card-eyebrow">Şu an ne yapıyorsun?</p><h2>Durumum</h2><p class="muted small">${K.esc(nameOf(other()))} alt menüde kulenin üstünde görür. Dört saat sonra kendiliğinden kalkar.</p>
        <div class="durum-grid">${DURUM.map(([k, e, t]) => `<button type="button" class="${cur && cur.data.k === k ? 'on' : ''}" data-du="${k}"><span>${e}</span><small>${K.esc(t)}</small></button>`).join('')}</div>
        ${cur ? `<button type="button" class="btn ghost small" data-du="">Durumu kaldır</button>` : ''}`,
    });
    m.body.addEventListener('click', async (e) => {
      const b = e.target.closest('[data-du]');
      if (!b) return;
      const d = DURUM.find((x) => x[0] === b.dataset.du);
      const r = await K.cloud.add('durum', d ? { k: d[0], emoji: d[1], text: d[2] } : { k: '' });
      if (r) durumlar.push(r);
      m.close();
      K.audio.sfx.tap();
      if (d) {
        K.cloud.send('kalp', { k: 'durum' });
        K.fx.toast(`${d[1]} Durumun: <b>${K.esc(d[2])}</b>`, { duration: 2500 });
        K.ping(`${K.meName()}: ${d[1]} ${d[2]}`, d[0] === 'musait' ? 'Şu an müsait, arayabilirsin.' : 'Durumunu güncelledi.', ['speech_balloon'], d[0] === 'musait' ? { priority: 4 } : undefined);
      }
      chips();
    });
  }
  K.durum = { of: (w) => durumOf(w) };

  /* ---------- Menü ---------- */
  let menu = null;
  function openMenu() {
    if (menu) return closeMenu();
    const night = isNight();
    const o = other();
    const ona = [
      ['durt', '💗', 'Dürt'],
      ['saril', '🤗', 'Sarıl'],
      [night ? 'gece' : 'sabah', night ? '🌙' : '☀️', night ? 'İyi geceler' : 'Günaydın'],
      ['dusun', '💭', KP().dusundum || 'Seni düşündüm'],
      ['ozlem', '🥺', KP().ozledim || 'Özledim'],
    ];
    const birlikte = [
      ['baris', 'bridge', 'Barış'],
      ['hikaye', 'camera', 'Hikâye'],
      ['radyo', 'music', 'Radyo'],
      ['pinpon', 'heart', 'Pinpon'],
      ['kelime', 'cards', 'Kelime'],
      ['hava', 'cloud', 'Hava'],
      ['durum', 'chat', 'Durumum'],
      ['zamanli', 'hourglass', 'Zamanlı'],
      ['kare', 'camera', 'Günün Karesi'],
    ].filter(([id]) => id === 'hikaye' || id === 'durum' || id === 'zamanli' || K.rooms.some((r) => r.id === id && !(typeof r.hidden === 'function' ? r.hidden() : r.hidden)));
    menu = K.el(`<div class="kmenu" role="dialog" aria-modal="true" aria-label="Kalp menüsü">
      <div class="kmenu-back" data-km-x></div>
      <div class="kmenu-panel">
        <p class="kmenu-to">${K.avatar(o, 'yan-av ' + (K.cloud && K.cloud.otherHere() ? 'on' : ''))}<span><small>${K.esc(K.ek(nameOf(o), 'e'))}</small><b>${K.cloud && K.cloud.otherHere() ? 'Şu an kalede' : 'Kaleye girince görür'}</b></span></p>
        <div class="kmenu-arc">${ona.map(([id, emo, label], i) => `<button type="button" class="kmenu-b" data-km="${id}" style="--i:${i}"><span>${emo}</span><small>${K.esc(label)}</small></button>`).join('')}</div>
        ${K.baris && K.baris.active() ? `<a class="kmenu-bulut" href="#baris" data-km-x>☁️ Aranızda küçük bir bulut var · <b>Köprüye git</b></a>` : ''}
        <div class="kmenu-row">${birlikte.map(([id, ic, label]) => `<button type="button" data-km="${id}" class="${id === 'baris' && K.baris && K.baris.active() ? 'glow' : ''}">${A.icon(ic)}<small>${K.esc(label)}</small></button>`).join('')}</div>
        <p class="kmenu-hint">${K.esc(KP().hint || '')}</p>
      </div></div>`);
    document.body.appendChild(menu);
    document.body.classList.add('kmenu-open');
    requestAnimationFrame(() => menu && menu.classList.add('in'));
    K.audio.sfx.pop();
    menu.addEventListener('click', (e) => {
      if (e.target.closest('[data-km-x]')) return closeMenu();
      const b = e.target.closest('[data-km]');
      if (b) act(b.dataset.km, b);
    });
    const esc = (e) => e.key === 'Escape' && closeMenu();
    document.addEventListener('keydown', esc, { once: true });
  }
  function closeMenu() {
    if (!menu) return;
    const m = menu;
    menu = null;
    m.classList.remove('in');
    document.body.classList.remove('kmenu-open');
    setTimeout(() => m.remove(), 280);
  }
  async function act(id, btn) {
    const o = other();
    if (id === 'zamanli') {
      closeMenu();
      if (!on()) return K.fx.toast('Bulut kapalı; bunun için Kale Paneli\'nden bulutu açın.');
      return K.surpriz && K.surpriz.compose();
    }
    if (['radyo', 'pinpon', 'kelime', 'hava', 'kare', 'baris'].includes(id)) {
      closeMenu();
      location.hash = id;
      return;
    }
    if (id === 'hikaye') {
      closeMenu();
      return K.stories && K.stories.compose();
    }
    if (id === 'durum') {
      closeMenu();
      return durumSheet();
    }
    if (!on()) return K.fx.toast('Bulut kapalı; bunun için Kale Paneli\'nden bulutu açın.');
    if (id === 'durt') {
      closeMenu();
      return K.yan && K.yan.nudge();
    }
    btn.classList.add('sent');
    const r = btn.getBoundingClientRect();
    K.fx.burst(r.left + r.width / 2, r.top + r.height / 2, { count: 12, power: 5 });
    K.vibrate(25);
    K.audio.sfx.sparkle();
    if (id === 'saril') {
      await K.cloud.add('kucak', {});
      K.cloud.send('kalp', { k: 'saril' });
      K.fx.toast(`<b>Sarıldın.</b> ${K.esc(nameOf(o))} ${K.cloud.otherHere() ? 'şu an hissediyor' : 'kaleye girince hissedecek'}.`, { icon: A.icon('hugs'), duration: 3000 });
      K.ping(`${K.meName()} sana sarıldı`, '🤗', ['hugging_face']);
    }
    if (id === 'sabah' || id === 'gece') {
      const pool = ((KP()[id] || {})[mine()] || []).filter(Boolean);
      const text = K.fill(K.pick(pool.length ? pool : [id === 'gece' ? 'İyi geceler' : 'Günaydın']));
      await K.cloud.add('selam', { k: id, text });
      K.cloud.send('kalp', { k: id, text });
      K.fx.toast(`<b>${id === 'gece' ? '🌙' : '☀️'} Gönderildi:</b> ${K.esc(text)}`, { icon: A.icon(id === 'gece' ? 'moon' : 'sun'), duration: 3500 });
      K.ping(`${K.meName()}: ${text}`, id === 'gece' ? 'İyi geceler' : 'Günaydın', [id === 'gece' ? 'crescent_moon' : 'sunny']);
    }
    if (id === 'dusun' || id === 'ozlem') {
      await K.cloud.add(id, {});
      K.cloud.send('kalp', { k: id });
      const n = today[id].filter((x) => x.who === mine()).length;
      K.fx.toast(id === 'dusun' ? `💭 Bugün onu <b>${n}</b>. kez düşündün.` : `🥺 Bugün <b>${n}</b>. kez özledin.`, { duration: 2200 });
      if (n === 1 || n % 5 === 0) K.ping(`${K.meName()} ${id === 'dusun' ? 'seni düşündü' : 'seni özledi'}`, `Bugün ${n}. kez`, [id === 'dusun' ? 'thought_balloon' : 'pleading_face']);
    }
    K.stickers.award('kalpmenu');
    chips();
  }
  // Karşıdan gelen canlı kalp işaretleri
  function received(m) {
    if (m.who === mine()) return;
    const from = nameOf(m.who);
    const fx = (emo) => {
      const ov = K.el(`<div class="yan-pulse soft" aria-hidden="true">${Array.from({ length: 14 }, (_, i) => `<i style="--x:${(i * 61) % 100}%;--d:${(i % 5) * 0.14}s;--s:${0.8 + (i % 3) * 0.25};--side:${i % 2 ? 1 : -1}">${emo}</i>`).join('')}</div>`);
      document.body.appendChild(ov);
      setTimeout(() => ov.remove(), 2600);
    };
    if (m.k !== 'durum') K.audio.sfx.chime();
    if (m.k === 'saril') {
      fx('🤗');
      K.vibrate([80, 40, 160]);
      K.fx.toast(`<b>${K.esc(from)} sana sımsıkı sarıldı.</b> <button type="button" class="linkish" data-kp-back="saril">Ben de sarıl</button>`, { icon: A.icon('hugs'), duration: 7000 });
    }
    if (m.k === 'sabah' || m.k === 'gece') {
      fx(m.k === 'gece' ? '🌙' : '☀️');
      K.fx.toast(`<b>${K.esc(from)}:</b> ${K.esc(m.text || '')}`, { icon: A.icon(m.k === 'gece' ? 'moon' : 'sun'), duration: 8000 });
    }
    if (m.k === 'durum') return chips();
    if (m.k === 'dusun') {
      fx('💭');
      K.fx.toast(K.esc(K.fill((KP().dusundumToast || '{from} seni düşündü.').replace('{from}', from))), { icon: A.icon('heart'), duration: 4000 });
    }
    if (m.k === 'ozlem') {
      fx('🥺');
      K.fx.toast(`<b>${K.esc(K.fill((KP().ozledimToast || '{from} seni özledi.').replace('{from}', from)))}</b> <button type="button" class="linkish" data-kp-back="ozlem">Ben de</button>`, { icon: A.icon('heart'), duration: 7000 });
    }
  }

  /* ---------- Bağlantılar ---------- */
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-kp-back]');
    if (b) act(b.dataset.kpBack, b);
    const c = e.target.closest('[data-kb="alev"]');
    if (c) alevSheet();
  });
  K.on('built', () => {
    // Alev ve sayaç çipleri: hikâye halkalarının altında
    const st = K.$('#stories');
    if (st && !K.$('#kalpBar')) st.insertAdjacentHTML('afterend', '<div class="wrap kalp-bar" id="kalpBar" hidden></div>');
    chips();
  });
  K.on('cloud', async (ok) => {
    if (!ok) return;
    const since = T.at(T.todayKey()).getTime();
    const [g, t] = await Promise.all([K.cloud.list('gun', 800), K.cloud.many(['dusun', 'ozlem', 'selam', 'kucak'], { since, limit: 500 })]);
    gun = g;
    t.forEach((r) => today[r.kind] && today[r.kind].push(r));
    durumlar = await K.cloud.many(['durum'], { since: Date.now() - DUR_H, limit: 20 });
    K.cloud.on('durum', (r) => {
      if (durumlar.some((x) => x.id === r.id)) return;
      durumlar.push(r);
      if (r.who !== mine() && r.data.k) K.fx.toast(`${r.data.emoji} <b>${K.esc(nameOf(r.who))}:</b> ${K.esc(r.data.text)}`, { duration: 5000 });
      chips();
    });
    markDay();
    chips();
    celebrate();
    K.cloud.onLive('kalp', received);
    K.cloud.on('gun', (r) => {
      if (gun.some((x) => x.id === r.id)) return;
      gun.push(r);
      chips();
      celebrate();
    });
    ['dusun', 'ozlem', 'selam', 'kucak'].forEach((k) =>
      K.cloud.on(k, (r) => {
        if (today[k].some((x) => x.id === r.id)) return;
        if (K.akis.dayOf(r.at) !== T.todayKey()) return;
        today[k].push(r);
        chips();
      })
    );
  });
  // Gece yarısı geçince yeni gün
  setInterval(() => {
    const t = T.todayKey();
    if (K.store.get('gunMarked-' + mine()) !== t && on()) {
      today = { dusun: [], ozlem: [], selam: [], kucak: [] };
      markDay();
    }
  }, 60000);
  K.specialHooks = (K.specialHooks || []).concat(() => {
    if (!on()) return [];
    const s = streak();
    const h = myHour();
    if (s.n >= 2 && s.todayMe && !s.todayOther && h >= 18) return [{ icon: 'heart', title: `🔥 ${s.n} günlük alev sönmesin`, text: K.fill((AL().riskOther || '').replace('{other}', nameOf(other()))), run: () => K.yan && K.yan.nudge(), cta: 'Onu dürt' }];
    return [];
  });
  K.kalp = { openMenu, closeMenu, streak, act, alevSheet, chips };
})();
