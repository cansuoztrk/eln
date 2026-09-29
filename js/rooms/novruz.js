/* Oda: Novruz Bahçesi — onun şehrinin bahar bayramı. Bayramdan önceki dört salının (çərşənbə) her birinde bir kapı açılır:
   Su (dilek kayığı), Od (ateşe at, üstünden atla), Yel (fırıldağa üfle, rüzgâr bir not getirir),
   Torpaq / Axır Çərşənbə (kapıya papaq at, gelen papağı bayram tatlılarıyla doldur; qulaq falı).
   Səməni her gün uzar; bayram günü kırmızı kurdelesi bağlanır. Sezon dışında kale sahibi önizleme görür (bulut yazılmaz). */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  let root, rows = [];
  const NV = () => D.novruz;
  const mine = () => (K.isOwner() ? 'me' : 'her');
  const other = () => (K.isOwner() ? 'her' : 'me');
  const nameOf = (w) => (w === 'me' ? C.myPet : C.herPet);
  const year = () => NV().date.slice(0, 4);
  const inSeason = () => {
    const t = T.todayKey();
    return t >= NV().opens && t <= NV().closes;
  };
  const preview = () => K.isOwner() && !inSeason();
  const open = (d) => preview() || T.todayKey() >= d;
  const my = (kind) => rows.filter((r) => r.kind === kind && r.who === mine()).pop();
  const theirs = (kind) => rows.filter((r) => r.kind === kind && r.who === other()).pop();
  const local = K.store.get('novruz', {});
  const setLocal = (k, v) => {
    local[k] = v;
    K.store.set('novruz', local);
  };

  async function add(kind, data, notifyTitle, notifyText) {
    if (preview()) {
      // Önizleme: sadece bu cihazda, buluta yazılmaz
      const r = { id: 'p' + Date.now(), kind, who: mine(), at: Date.now(), data: Object.assign({ y: year() }, data) };
      rows.push(r);
      return r;
    }
    const r = await K.cloud.add(kind, Object.assign({ y: year() }, data));
    if (!r) K.fx.toast('Gönderilemedi. İnterneti kontrol et.');
    else if (!K.isOwner() && notifyTitle) K.notify(notifyTitle, notifyText || '', ['tulip']);
    return r;
  }

  /* ---------- Çizimler ---------- */
  function semeniSvg(p, tied) {
    const rnd = K.rng(20);
    const blades = Array.from({ length: 34 }, (_, i) => {
      const x = 58 + (i / 33) * 124 + (rnd() * 6 - 3);
      const h = (8 + p * 92) * (0.7 + rnd() * 0.4);
      const bend = (rnd() - 0.5) * 18 * p;
      const c = i % 3 ? '#5CC28D' : '#3FA37A';
      return `<path d="M${x.toFixed(1)} 150 Q${(x + bend / 2).toFixed(1)} ${(150 - h / 2).toFixed(1)} ${(x + bend).toFixed(1)} ${(150 - h).toFixed(1)}" stroke="${c}" stroke-width="3.2" stroke-linecap="round" fill="none"/>`;
    }).join('');
    const ry = 150 - (8 + p * 92) * 0.42;
    return `<svg class="nv-semeni" viewBox="0 0 240 190" role="img" aria-label="Səməni, yüzde ${Math.round(p * 100)} büyüdü">
      <ellipse cx="120" cy="160" rx="100" ry="18" fill="#fff" stroke="#E3C2CF" stroke-width="3"/>
      <ellipse cx="120" cy="155" rx="78" ry="11" fill="#F3E3CF"/>
      ${blades}
      ${tied ? `<g class="nv-ribbon"><path d="M52 ${ry.toFixed(1)} Q120 ${(ry + 12).toFixed(1)} 188 ${ry.toFixed(1)}" stroke="#E3174D" stroke-width="7" fill="none" stroke-linecap="round"/><g transform="translate(120 ${(ry + 6).toFixed(1)}) scale(.34)">${A.bowShape('#E3174D', '#8C1033')}</g></g>` : ''}
    </svg>`;
  }
  const pondSvg = () => `<svg class="nv-pond" viewBox="0 0 300 120" aria-hidden="true">
      <ellipse cx="150" cy="70" rx="140" ry="42" fill="#BFE6FF"/><ellipse cx="150" cy="70" rx="140" ry="42" fill="none" stroke="#8FD3FF" stroke-width="2"/>
      <g class="nv-ripples" fill="none" stroke="#fff" stroke-width="2"><ellipse cx="110" cy="72" rx="20" ry="6"/><ellipse cx="200" cy="62" rx="16" ry="5"/><ellipse cx="160" cy="84" rx="24" ry="7"/></g>
      <g class="nv-boat"><path d="M-22 0 L22 0 L14 12 L-14 12 Z" fill="#fff" stroke="#4A2138" stroke-width="2.4" stroke-linejoin="round"/><path d="M0 0 L0 -26 L16 -4 Z" fill="#FFD0E1" stroke="#4A2138" stroke-width="2.4" stroke-linejoin="round"/></g>
    </svg>`;
  const fireSvg = () => `<svg class="nv-fire" viewBox="0 0 200 150" aria-hidden="true">
      <ellipse cx="100" cy="138" rx="70" ry="8" fill="#4A2138" opacity=".15"/>
      <g stroke="#4A2138" stroke-width="3" stroke-linecap="round"><path d="M50 134 L150 112" stroke="#8B5A2B" stroke-width="12"/><path d="M50 112 L150 134" stroke="#A0522D" stroke-width="12"/></g>
      <g class="nv-flames"><path class="f1" d="M100 120 C60 100 78 60 96 40 C96 64 112 62 110 42 C132 64 142 104 100 120 Z" fill="#FF8A3D"/>
      <path class="f2" d="M100 120 C78 108 84 82 98 66 C100 84 110 82 110 70 C122 88 124 110 100 120 Z" fill="#FFD34E"/>
      <path class="f3" d="M100 120 C90 114 92 100 100 92 C108 100 110 114 100 120 Z" fill="#FFF4C7"/></g>
      <g class="nv-sparks" fill="#FFD34E"><circle cx="82" cy="40" r="2"/><circle cx="118" cy="30" r="2.4"/><circle cx="104" cy="18" r="1.8"/></g>
    </svg>`;
  const pinwheel = () => `<svg class="nv-pin" viewBox="-60 -60 120 170" aria-hidden="true">
      <path d="M0 0 L0 108" stroke="#8B5E6B" stroke-width="5" stroke-linecap="round"/>
      <g class="nv-blades">
        <path d="M0 0 L0 -52 L30 -22 Z" fill="#FF8FB8" stroke="#4A2138" stroke-width="2.4" stroke-linejoin="round"/>
        <path d="M0 0 L52 0 L22 30 Z" fill="#C9B6FF" stroke="#4A2138" stroke-width="2.4" stroke-linejoin="round"/>
        <path d="M0 0 L0 52 L-30 22 Z" fill="#FFD34E" stroke="#4A2138" stroke-width="2.4" stroke-linejoin="round"/>
        <path d="M0 0 L-52 0 L-22 -30 Z" fill="#8FD3FF" stroke="#4A2138" stroke-width="2.4" stroke-linejoin="round"/>
        <circle r="6" fill="#E3174D" stroke="#4A2138" stroke-width="2"/>
      </g>
    </svg>`;
  const papaqSvg = (cls = '') => `<svg class="nv-papaq ${cls}" viewBox="0 0 80 60" aria-hidden="true"><path d="M10 44 C8 18 24 6 40 6 C56 6 72 18 70 44 Z" fill="#5B3A29" stroke="#2B2024" stroke-width="3"/><g fill="#7A5037">${Array.from({ length: 14 }, (_, i) => `<circle cx="${16 + (i % 7) * 8}" cy="${18 + Math.floor(i / 7) * 12 + (i % 2) * 3}" r="3.4"/>`).join('')}</g><rect x="6" y="42" width="68" height="12" rx="5" fill="#3E2A1E" stroke="#2B2024" stroke-width="3"/></svg>`;
  const TREAT = {
    sekerbura: '<path d="M8 30 C8 14 24 6 32 6 C40 6 56 14 56 30 Z" fill="#F5D08A" stroke="#4A2138" stroke-width="2.6"/><path d="M16 24 L20 14 M24 26 L28 12 M34 26 L36 12 M42 24 L46 14" stroke="#B07A4F" stroke-width="2" stroke-linecap="round"/>',
    paxlava: '<path d="M32 4 L58 30 L32 56 L6 30 Z" fill="#E8B15A" stroke="#4A2138" stroke-width="2.6" stroke-linejoin="round"/><circle cx="32" cy="30" r="5" fill="#8B5A2B"/>',
    sorqogal: '<circle cx="32" cy="30" r="24" fill="#F0C27A" stroke="#4A2138" stroke-width="2.6"/><path d="M32 30 m-4 0 a4 4 0 1 1 8 0 a8 8 0 1 1 -16 0 a12 12 0 1 1 24 0 a16 16 0 1 1 -32 0" fill="none" stroke="#B07A4F" stroke-width="2"/>',
    qogal: '<circle cx="32" cy="30" r="24" fill="#F7D9A0" stroke="#4A2138" stroke-width="2.6"/><g fill="#B07A4F"><circle cx="24" cy="24" r="2.4"/><circle cx="40" cy="24" r="2.4"/><circle cx="32" cy="36" r="2.4"/><circle cx="22" cy="38" r="2"/><circle cx="42" cy="38" r="2"/></g>',
    konfet: '<path d="M4 20 L16 30 L4 40 Z M60 20 L48 30 L60 40 Z" fill="#FF8FB8" stroke="#4A2138" stroke-width="2.4" stroke-linejoin="round"/><ellipse cx="32" cy="30" rx="18" ry="12" fill="#E3174D" stroke="#4A2138" stroke-width="2.6"/>',
    yumurta: '<path d="M32 4 C46 4 54 24 54 36 C54 50 44 58 32 58 C20 58 10 50 10 36 C10 24 18 4 32 4 Z" fill="#C0392B" stroke="#4A2138" stroke-width="2.6"/><path d="M14 30 C22 26 42 26 50 30" stroke="#FFD34E" stroke-width="3" fill="none"/>',
  };
  const treat = (id) => `<svg class="nv-treat" viewBox="0 0 64 64" aria-hidden="true">${TREAT[id] || TREAT.qogal}</svg>`;
  const treatName = (id) => ((NV().treats || []).find(([k]) => k === id) || [id, id])[1];

  /* ---------- Ritüeller ---------- */
  function wishHtml() {
    const m = my('nvwish'), o = theirs('nvwish');
    return `${pondSvg()}
      ${m ? `<p class="hand nv-mine">"${K.esc(m.data.text)}"</p><p class="muted small">Dileğin suda.</p>` : `<textarea class="input nv-in" id="nvWish" name="nvWish" maxlength="140" rows="2" placeholder="Dileğin..."></textarea><button type="button" class="btn red small" data-act="wish">${A.icon('heart')} Suya bırak</button>`}
      ${m && o ? `<div class="nv-other"><b>${K.esc(K.ek(nameOf(other()), 'in'))} dileği</b><p class="hand">"${K.esc(o.data.text)}"</p></div>` : o ? `<p class="muted small">${K.esc(K.ek(nameOf(other()), 'in'))} dileği suda bekliyor; sen de bırakınca okuyacaksın.</p>` : m ? `<p class="muted small">${K.esc(K.ek(nameOf(other()), 'in'))} dileği henüz suda değil.</p>` : ''}`;
  }
  function fireHtml() {
    const jumps = local.jumps || 0;
    const o = theirs('nvjump');
    return `<div class="nv-firebox">${fireSvg()}<div class="nv-jumper">${A.kitty({ crown: true, eyes: 'happy' })}</div></div>
      <div class="nv-row"><input class="input" id="nvWorry" name="nvWorry" maxlength="80" placeholder="Geride bırakmak istediğin bir şey"><button type="button" class="btn soft small" data-act="burn">Ateşe at</button></div>
      <p class="muted small">Yazdığın hiçbir yere kaydedilmez; sadece yanar.</p>
      <div class="nv-row"><button type="button" class="btn red small" data-act="jump">Ateşin üstünden atla</button><span class="nv-count">${Math.min(3, jumps)} / 3</span></div>
      ${o ? `<p class="small">${A.icon('star')} ${K.esc(nameOf(other()))} da ateşin üstünden atladı.</p>` : ''}`;
  }
  function windHtml() {
    const done = local.wind || my('nvwind');
    const o = theirs('nvwind');
    return `<div class="nv-windbox">${pinwheel()}<div class="nv-meter"><i id="nvMeter" style="width:${done ? 100 : local.windE || 0}%"></i></div></div>
      ${done ? `<div class="nv-note hand">${K.esc(K.fill(NV().windNote || ''))}</div>` : `<div class="nv-row"><button type="button" class="btn red small" data-act="blow">${A.ui('mic')} Mikrofona üfle</button><span class="muted small">ya da fırıldağa hızlı hızlı dokun</span></div>`}
      ${o ? `<p class="small">${A.icon('star')} ${K.esc(nameOf(other()))} da rüzgârı estirdi.</p>` : ''}`;
  }
  function papaqHtml() {
    const mineP = my('papaq');
    const otherP = theirs('papaq');
    const myFill = mineP && rows.filter((r) => r.kind === 'papaqfill' && r.who === other() && r.data.to === mineP.id).pop();
    const iFilled = otherP && rows.filter((r) => r.kind === 'papaqfill' && r.who === mine() && r.data.to === otherP.id).pop();
    const q = local.qulaq;
    return `<div class="nv-doors">
        <div class="nv-door"><p class="card-eyebrow">${K.esc(K.ek(nameOf(other()), 'in'))} kapısı</p><div class="nv-doorart">${mineP ? papaqSvg(myFill ? 'full' : 'sit') : ''}</div>
          ${!mineP ? `<button type="button" class="btn red small" data-act="throw">${A.icon('heart')} Papağını at</button>` : myFill ? `<div class="nv-got"><p class="small"><b>Papağın doldu!</b></p><div class="nv-treats">${(myFill.data.treats || []).map(treat).join('')}</div>${myFill.data.note ? `<p class="hand">"${K.esc(myFill.data.note)}"</p>` : ''}</div>` : '<p class="muted small">Papağın kapıda. Doldurulmasını bekle; saklan!</p>'}</div>
        <div class="nv-door"><p class="card-eyebrow">Senin kapın</p><div class="nv-doorart">${otherP ? papaqSvg(iFilled ? 'full' : 'sit') : ''}</div>
          ${!otherP ? '<p class="muted small">Henüz papaq yok.</p>' : iFilled ? `<p class="small">Doldurdun: ${(iFilled.data.treats || []).map((t) => K.esc(treatName(t))).join(', ')}</p>` : `<p class="small"><b>Kapına bir papaq atıldı!</b> İçine ne koyalım?</p>
            <div class="nv-chips">${(NV().treats || []).map(([k, t]) => `<button type="button" class="chip" data-treat="${k}" aria-pressed="false">${K.esc(t)}</button>`).join('')}</div>
            <input class="input" id="nvFillNote" name="nvFillNote" maxlength="100" placeholder="Bir not (isteğe bağlı)"><button type="button" class="btn red small" data-act="fill" data-to="${otherP.id}">Doldur ve bırak</button>`}</div>
      </div>
      <div class="nv-qulaq"><button type="button" class="btn soft small" data-act="qulaq">Qulaq falı tut</button>${q ? `<p class="hand">Duvarın arkasından duyduğun: ${K.esc(q)}</p>` : '<p class="muted small">Önce içinden bir dilek tut.</p>'}</div>`;
  }
  const RIT = { wish: wishHtml, fire: fireHtml, wind: windHtml, papaq: papaqHtml };

  function render() {
    if (!root) return;
    const nv = NV();
    const today = T.todayKey();
    const days = T.daysUntil(nv.date);
    const tg = K.nezaman && K.nezaman.target();
    const near = tg && Math.abs(T.dayNumber(T.at(tg.from)) - T.dayNumber(T.at(nv.date))) <= 7;
    const meet = near && T.daysUntil(tg.from) > 0;
    const together = near && today >= tg.from && today <= tg.to;
    K.$('#nvTop', root).innerHTML = `${preview() ? `<p class="nv-prev">Önizleme: onun kalesinde ${K.esc(T.fmt(nv.opens))}'ta açılır. Burada yaptıkların buluta yazılmaz.</p>` : ''}
      <div class="nv-count-big"><b>${days > 0 ? K.num(days) : days === 0 ? 'Bugün' : 'Bayram'}</b><span>${days > 0 ? 'gün kaldı Novruz\'a' : days === 0 ? 'Novruz bayramı!' : 'mübarək!'}</span></div>
      ${meet ? `<p class="hand nv-meet">${K.esc(K.fill(nv.meet || '').replace('{days}', K.num(T.daysUntil(tg.from))))}</p>` : together ? `<p class="hand nv-meet">${K.esc(K.fill(nv.together || 'Bu Novruz\'u birlikte geçiriyoruz.'))}</p>` : ''}`;
    // Səməni
    const span = T.dayNumber(T.at(nv.date)) - T.dayNumber(T.at(nv.opens));
    const p = preview() ? Math.min(1, (local.previewGrow || 0.7)) : K.clamp((T.dayNumber(T.now()) - T.dayNumber(T.at(nv.opens)) + (local.water || 0) * 0.3) / span, 0.04, 1);
    const tied = Boolean(local.tied || rows.some((r) => r.kind === 'semeni'));
    const st = nv.semeni || [];
    const stTxt = tied ? nv.tied || 'Kurdelesi bağlandı. Bayramın mübarək!' : st[Math.min(st.length - 1, Math.floor(p * st.length))] || '';
    K.$('#nvSemeni', root).innerHTML = `${semeniSvg(p, tied)}<p class="hand">${K.esc(K.fill(stTxt))}</p>
      <div class="nv-row"><button type="button" class="btn soft small" data-act="water">${A.icon('lily')} Sula</button>${open(nv.date) && !tied ? `<button type="button" class="btn red small" data-act="tie">Kırmızı kurdeleyi bağla</button>` : ''}</div>`;
    // Salılar
    K.$('#nvDays', root).innerHTML = nv.tuesdays
      .map((t, i) => {
        const o = open(t.date);
        const cur = o && !(nv.tuesdays[i + 1] && open(nv.tuesdays[i + 1].date));
        return `<details class="card nv-tue ${o ? 'open' : 'locked'} nv-${t.id}" ${cur ? 'open' : ''}>
          <summary><span class="nv-el">${K.esc(t.name)}</span><small>${K.esc(T.fmt(t.date, true))}${o ? '' : ' · kilitli'}</small></summary>
          <p class="nv-txt">${K.esc(K.fill(t.text))}</p>
          ${o ? `<div class="nv-rit">${RIT[t.ritual]()}</div>` : `<p class="muted small">${A.ui('lock')} Bu kapı ${K.esc(T.fmtShort(t.date))} sabahı açılacak.</p>`}
        </details>`;
      })
      .join('');
    // Bayram
    K.$('#nvDay', root).hidden = !open(nv.date);
    if (open(nv.date)) K.$('#nvDay', root).innerHTML = `<p class="card-eyebrow">20 Mart</p>${(nv.day || []).map((l) => `<p class="hand">${K.esc(K.fill(l))}</p>`).join('')}`;
    const pin = K.$('.nv-blades', root);
    if (pin) pin.style.setProperty('--spin', `${Math.max(0.25, 3 - (local.windE || 0) / 40)}s`);
  }

  /* ---------- Rüzgâr ---------- */
  let windRaf = null, micStream = null;
  function addWind(n) {
    if (local.wind) return;
    setLocal('windE', Math.min(100, (local.windE || 0) + n));
    const m = K.$('#nvMeter', root);
    if (m) m.style.width = local.windE + '%';
    const pin = K.$('.nv-blades', root);
    if (pin) pin.style.setProperty('--spin', `${Math.max(0.25, 3 - local.windE / 40)}s`), pin.classList.add('go');
    if (local.windE >= 100) windDone();
  }
  async function windDone() {
    stopMic();
    setLocal('wind', true);
    K.audio.sfx.chime();
    K.fx.confetti({ count: 80, shapes: ['heart', 'star'], colors: ['#FF8FB8', '#C9B6FF', '#FFD34E', '#8FD3FF'] });
    if (!my('nvwind')) await add('nvwind', {}, `${C.herName} Yel Çərşənbəsi'nde rüzgârı estirdi`, 'Rüzgâr senin notunu ona getirdi.');
    render();
  }
  async function blow() {
    if (micStream) return stopMic();
    try {
      micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (e) {
      return K.fx.toast('Mikrofon açılamadı. Fırıldağa hızlı hızlı dokunabilirsin.');
    }
    const ac = new (window.AudioContext || window.webkitAudioContext)();
    const an = ac.createAnalyser();
    an.fftSize = 512;
    ac.createMediaStreamSource(micStream).connect(an);
    const buf = new Uint8Array(an.fftSize);
    const t0 = Date.now();
    const loop = () => {
      an.getByteTimeDomainData(buf);
      let s = 0;
      for (let i = 0; i < buf.length; i++) s += ((buf[i] - 128) / 128) ** 2;
      const rms = Math.sqrt(s / buf.length);
      if (rms > 0.08) addWind(rms * 6);
      if (Date.now() - t0 > 20000 || local.wind) return stopMic(ac);
      windRaf = requestAnimationFrame(loop);
    };
    loop();
    K.fx.toast('Şimdi fırıldağa üfle!', { icon: A.icon('star'), duration: 2500 });
  }
  function stopMic(ac) {
    cancelAnimationFrame(windRaf);
    if (micStream) micStream.getTracks().forEach((t) => t.stop());
    micStream = null;
    if (ac && ac.close) ac.close();
  }

  /* ---------- Eylemler ---------- */
  async function act(a, el) {
    if (a === 'wish') {
      const ta = K.$('#nvWish', root);
      const text = ta.value.trim();
      if (text.length < 2) return ta.focus();
      K.$('.nv-pond', root).classList.add('sail');
      K.audio.sfx.sparkle();
      await new Promise((r) => setTimeout(r, 1500));
      await add('nvwish', { text }, `${C.herName} dileğini suya bıraktı`, text);
      return render();
    }
    if (a === 'burn') {
      const inp = K.$('#nvWorry', root);
      const t = inp.value.trim();
      if (!t) return inp.focus();
      const paper = K.el(`<span class="nv-paper">${K.esc(t)}</span>`);
      K.$('.nv-firebox', root).appendChild(paper);
      inp.value = '';
      K.audio.sfx.pop();
      setTimeout(() => paper.remove(), 2200);
      return;
    }
    if (a === 'jump') {
      const j = K.$('.nv-jumper', root);
      j.classList.remove('jump');
      void j.offsetWidth;
      j.classList.add('jump');
      K.audio.sfx.pop();
      setLocal('jumps', (local.jumps || 0) + 1);
      K.fx.toast('<b>"Ağırlığım, uğurluğum odda yansın!"</b>', { icon: A.icon('star'), duration: 1800 });
      if (local.jumps === 3) {
        K.fx.confetti({ count: 90, shapes: ['star'], colors: ['#FF8A3D', '#FFD34E', '#E3174D'] });
        if (!my('nvjump')) await add('nvjump', {}, `${C.herName} ateşin üstünden atladı`, 'Od Çərşənbəsi: üç kez.');
      }
      const c = K.$('.nv-count', root);
      if (c) c.textContent = `${Math.min(3, local.jumps)} / 3`;
      if (local.jumps === 3) setTimeout(render, 900);
      return;
    }
    if (a === 'blow') return blow();
    if (a === 'throw') {
      const flying = K.el(`<div class="nv-fly">${papaqSvg()}</div>`);
      el.closest('.nv-door').appendChild(flying);
      K.audio.sfx.pop();
      await new Promise((r) => setTimeout(r, 900));
      await add('papaq', {}, `${C.herName} kapına papaq attı!`, 'Novruz Bahçesi\'nde papağı doldur.');
      K.fx.toast('Papağın kapıda. Şimdi saklan!', { icon: A.icon('heart') });
      return render();
    }
    if (a === 'fill') {
      const treats = K.$$('[data-treat][aria-pressed="true"]', root).map((b) => b.dataset.treat);
      if (!treats.length) return K.fx.toast('En az bir tatlı seç.');
      await add('papaqfill', { to: el.dataset.to, treats, note: (K.$('#nvFillNote', root).value || '').trim() }, `${C.herName} papağını doldurdu`, treats.map(treatName).join(', '));
      K.fx.confetti({ count: 70, shapes: ['heart'] });
      return render();
    }
    if (a === 'qulaq') {
      const qs = NV().qulaq || [];
      const n = (local.qn || 0) + 1;
      setLocal('qn', n);
      setLocal('qulaq', qs[(T.dayNumber(T.now()) + n) % qs.length] || '');
      K.audio.sfx.sparkle();
      return render();
    }
    if (a === 'water') {
      setLocal('water', Math.min(6, (local.water || 0) + 1));
      if (preview()) setLocal('previewGrow', Math.min(1, (local.previewGrow || 0.7) + 0.1));
      K.fx.confetti({ count: 24, shapes: ['heart'], colors: ['#8FD3FF', '#BFE6FF'] });
      return render();
    }
    if (a === 'tie') {
      setLocal('tied', true);
      K.audio.sfx.success();
      K.fx.confetti({ count: 200, shapes: ['heart', 'star', 'bow'], colors: ['#E3174D', '#3FA37A', '#FFD34E'] });
      K.stickers.award('novruz');
      if (!rows.some((r) => r.kind === 'semeni' && r.who === mine())) await add('semeni', {}, `${C.herName} səməniye kırmızı kurdeleyi bağladı`, 'Novruz bayramı mübarək!');
      return render();
    }
  }

  const KINDS = ['nvwish', 'nvjump', 'nvwind', 'papaq', 'papaqfill', 'semeni'];
  const MSG = {
    nvwish: (w) => `${nameOf(w)} dileğini suya bıraktı.`,
    nvjump: (w) => `${nameOf(w)} ateşin üstünden atladı.`,
    nvwind: (w) => `${nameOf(w)} rüzgârı estirdi.`,
    papaq: (w) => `${nameOf(w)} kapına papaq attı! İçini doldur.`,
    papaqfill: (w) => `${nameOf(w)} papağını doldurdu!`,
    semeni: (w) => `${nameOf(w)} səməniye kırmızı kurdeleyi bağladı.`,
  };
  K.on('cloud', async (on) => {
    if (!on || !D.novruz) return;
    const got = await Promise.all(KINDS.map((k) => K.cloud.list(k)));
    rows = got.flat().filter((r) => (r.data.y || year()) === year()).sort((a, b) => a.at - b.at);
    KINDS.forEach((k) =>
      K.cloud.on(k, (r) => {
        if (rows.some((x) => x.id === r.id) || (r.data.y || year()) !== year()) return;
        rows.push(r);
        if (r.who !== mine()) K.fx.toast(`<b>Novruz Bahçesi:</b> ${K.esc(MSG[k](r.who))}`, { icon: A.icon('lily'), duration: 7000 });
        if (K.activeRoom === 'novruz') render();
      })
    );
  });

  K.room({
    id: 'novruz',
    wing: 'mevsim',
    title: 'Novruz Bahçesi',
    sub: 'Dört salı, bir səməni, bir bayram',
    icon: 'lily',
    color: '#DDF5E6',
    hidden: () => !D.novruz || !K.cloud || !K.cloud.enabled || (!inSeason() && !K.isOwner()),
    badge: () => {
      if (!D.novruz) return '';
      const t = T.todayKey();
      if (NV().tuesdays.some((x) => x.date === t)) return 'Bugün!';
      const d = T.daysUntil(NV().date);
      return d > 0 ? `${d} gün` : d === 0 ? 'Bayram!' : '';
    },
    init(el) {
      root = el;
      el.innerHTML = `
        <div class="room-intro">${K.paras(NV().intro)}</div>
        <div class="nv-top" id="nvTop"></div>
        <section class="card nv-sem" id="nvSemeni"></section>
        <div class="nv-days" id="nvDays"></div>
        <section class="card nv-day" id="nvDay" hidden></section>`;
      el.addEventListener('click', (e) => {
        const b = e.target.closest('[data-act]');
        if (b) return act(b.dataset.act, b);
        const t = e.target.closest('[data-treat]');
        if (t) return t.setAttribute('aria-pressed', String(t.getAttribute('aria-pressed') !== 'true'));
        if (e.target.closest('.nv-pin')) addWind(7);
      });
    },
    enter() {
      render();
    },
    leave() {
      stopMic();
    },
  });
})();
