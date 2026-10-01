/* Kale 2.0 — Barış Köprüsü: küsünce de buradayız.
   Aramız nasıl (iyi / kırgın / alan / hazır), beyaz bayrak (her bayrak köprünün bir yarısını indirir), Kalpten Mektup
   (o "okumaya hazırım" diyene kadar mühürlü), çiçekli ve sesli özür, ortak mola (iki ekranda aynı anda nefes),
   "ışığım açık" (konuşmasam da buradayım), küs ama iyi geceler. İkiniz de bayrağı kaldırınca Barış Töreni: kırık kalbin
   iki yarısı birleşir, çatlak altınla dolar (kintsugi), birer söz yazılır. Altın Kalp her barışmada bir altın damar kazanır.
   Barış Defteri (kaç kez küstük, hep barıştık), Barış Antlaşması (ikinizin de imzaladığı maddeler).
   Kayıtlar: aramiz {s, lvl, until, note} · bayrak {} · kmektup {feel, need, what, ask} · kmokundu {ref} · kmcevap {ref, text}
   ozur {text, flower, audio, dur} + ozurses {b64, mime} · ozurcevap {ref, k} · mola {min} · isik {on}
   baristi {ep, dur, first} · barissoz {ep, text} · kural {text} · kuralimza {ref} */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  const B = () => D.baris || { states: [], intro: [] };
  const mine = () => (K.isOwner() ? 'me' : 'her');
  const other = () => (K.isOwner() ? 'her' : 'me');
  const nameOf = (w) => (w === 'me' ? C.myPet : C.herPet);
  const on = () => Boolean(K.cloud && K.cloud.enabled);
  const KINDS = ['aramiz', 'bayrak', 'kmektup', 'kmokundu', 'kmcevap', 'ozur', 'ozurcevap', 'mola', 'isik', 'baristi', 'barissoz', 'kural', 'kuralimza'];
  // 48 saat hiçbir şey olmazsa bölüm sessizce kapanır (altın damar sayılmaz)
  const STALE = 48 * 36e5;
  const BREATH = () => B().breath || [['Nefes al', 4], ['Tut', 4], ['Ver', 6], ['Bekle', 2]];
  const myHour = () => T.parts(K.isOwner() ? C.tzIstanbul : C.tzBaku).h;
  const ping = (title, msg, tags, extra) => K.ping && K.ping(title, msg, tags, Object.assign({ click: K.roomUrl('baris') }, extra || {}));

  let rows = [], loaded = false, root = null, ticker = 0, uid = 0;
  const of = (k) => rows.filter((r) => r.kind === k);
  const stateDef = (s) => (B().states || []).find((x) => x[0] === s) || ['iyi', '💗', 'İyiyiz', ''];
  const dur = (ms) => {
    const m = Math.max(1, Math.round(ms / 6e4));
    if (m < 60) return `${m} dakika`;
    const h = Math.floor(m / 60), r = m % 60;
    if (h < 24) return `${h} saat${r ? ` ${r} dakika` : ''}`;
    const d = Math.floor(h / 24);
    return `${d} gün${h % 24 ? ` ${h % 24} saat` : ''}`;
  };
  const add = async (kind, data) => {
    const r = await K.cloud.add(kind, data);
    if (r && !rows.some((x) => x.id === r.id)) rows.push(r);
    return r;
  };

  /* ---------- Bölümler: küslükten barışa ---------- */
  const SIGNAL = (r) => (r.kind === 'aramiz' && (r.data.s === 'kirgin' || r.data.s === 'alan')) || r.kind === 'bayrak' || r.kind === 'ozur' || r.kind === 'kmektup' || (r.kind === 'mola' && r.data.min > 0);
  // Barışa uzanan el: bayrak, özür, özrü kabul, "iyiyiz"
  const FLAG = (r) => r.kind === 'bayrak' || r.kind === 'ozur' || (r.kind === 'ozurcevap' && r.data.k === 'kabul') || (r.kind === 'aramiz' && r.data.s === 'iyi');
  let cache = null;
  function build() {
    if (cache) return cache;
    const sorted = rows.slice().sort((a, b) => a.at - b.at);
    const peaceBy = {};
    of('baristi').sort((a, b) => a.at - b.at).forEach((r) => (peaceBy[r.data.ep] = peaceBy[r.data.ep] || r));
    const eps = [];
    let cur = null;
    for (const r of sorted) {
      if (r.kind === 'baristi' || r.kind === 'barissoz' || r.kind === 'kural' || r.kind === 'kuralimza') continue;
      if (cur && r.at - cur.lastAt > STALE) {
        cur.stale = true;
        eps.push(cur);
        cur = null;
      }
      if (!cur) {
        if (!SIGNAL(r)) continue;
        cur = { start: r, rows: [], flag: { me: 0, her: 0 }, lastAt: r.at };
      }
      cur.rows.push(r);
      cur.lastAt = r.at;
      if (FLAG(r) && !cur.flag[r.who]) cur.flag[r.who] = r.at;
      if (cur.flag.me && cur.flag.her) {
        cur.done = true;
        cur.doneAt = r.at;
        cur.first = cur.flag.me <= cur.flag.her ? 'me' : 'her';
        cur.peace = peaceBy[cur.start.id] || null;
        eps.push(cur);
        cur = null;
      }
    }
    if (cur && Date.now() - cur.lastAt > STALE) {
      cur.stale = true;
      eps.push(cur);
      cur = null;
    }
    cache = { eps, done: eps.filter((e) => e.done), cur };
    return cache;
  }
  const active = () => build().cur;
  const lastDone = () => build().done.slice(-1)[0] || null;
  function stateOf(w) {
    const r = of('aramiz').filter((x) => x.who === w).sort((a, b) => a.at - b.at).pop();
    if (!r) return null;
    const ld = lastDone();
    if (ld && r.at <= ld.doneAt && r.data.s !== 'iyi') return null;
    if (Date.now() - r.at > STALE) return null;
    return r;
  }
  function molaNow() {
    const r = of('mola').sort((a, b) => a.at - b.at).pop();
    if (!r || !r.data.min) return null;
    const end = r.at + r.data.min * 6e4;
    return end > Date.now() ? { r, end } : null;
  }
  const isikOf = (w) => {
    const r = of('isik').filter((x) => x.who === w).sort((a, b) => a.at - b.at).pop();
    const c = active();
    return r && r.data.on && c && r.at >= c.start.at && Date.now() - r.at < 12 * 36e5 ? r : null;
  };
  const read = (id) => of('kmokundu').some((r) => r.data.ref === id);
  const heardOf = (id) => of('kmcevap').filter((r) => r.data.ref === id);
  const answerOf = (id) => of('ozurcevap').filter((r) => r.data.ref === id).sort((a, b) => a.at - b.at).pop();
  const lettersTo = (w) => of('kmektup').filter((r) => r.who !== w).sort((a, b) => b.at - a.at);
  const apologiesTo = (w) => of('ozur').filter((r) => r.who !== w).sort((a, b) => b.at - a.at);
  const promisesOf = (ep) => of('barissoz').filter((r) => r.data.ep === ep).sort((a, b) => a.at - b.at);

  /* ---------- Altın Kalp (kintsugi) ---------- */
  const HEART = 'M100 172 C42 134 8 100 8 60 C8 28 32 8 60 8 C80 8 93 19 100 34 C107 19 120 8 140 8 C168 8 192 28 192 60 C192 100 158 134 100 172 Z';
  const CRACK = 'M100 34 L91 58 L109 82 L93 110 L105 138 L100 172';
  function rng(seed) {
    let x = (seed * 9301 + 49297) % 233280;
    return () => (x = (x * 9301 + 49297) % 233280) / 233280;
  }
  function seamPath(i) {
    const r = rng(i * 7 + 3);
    let x = 34 + r() * 132, y = 14 + r() * 26;
    let d = `M${x.toFixed(0)} ${y.toFixed(0)}`;
    const n = 4 + Math.floor(r() * 3);
    let bx = 0, by = 0;
    for (let k = 0; k < n; k++) {
      x = K.clamp(x + (r() - 0.5) * 56, 14, 186);
      y += 15 + r() * 17;
      d += ` L${x.toFixed(0)} ${y.toFixed(0)}`;
      if (k === 1) [bx, by] = [x, y];
    }
    if (bx) d += ` M${bx.toFixed(0)} ${by.toFixed(0)} L${(bx + (r() > 0.5 ? 1 : -1) * (14 + r() * 18)).toFixed(0)} ${(by + 6 + r() * 12).toFixed(0)}`;
    return d;
  }
  function defs(id) {
    return `<defs><linearGradient id="brGold${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFF0B8"/><stop offset=".45" stop-color="#EDBE45"/><stop offset="1" stop-color="#B98326"/></linearGradient>
      <radialGradient id="brPink${id}" cx=".34" cy=".28" r=".95"><stop offset="0" stop-color="#FFE0EB"/><stop offset=".6" stop-color="#FF9DC0"/><stop offset="1" stop-color="#F0628F"/></radialGradient>
      <clipPath id="brClip${id}"><path d="${HEART}"/></clipPath></defs>`;
  }
  function heartSvg(n, crack, fresh) {
    const id = ++uid;
    const seams = Array.from({ length: n }, (_, i) => {
      const d = seamPath(i);
      return `<path class="br-glow" d="${d}" stroke="url(#brGold${id})"/><path class="br-seam ${fresh && i === n - 1 ? 'new' : ''}" d="${d}" stroke="url(#brGold${id})"/>`;
    }).join('');
    return `<svg class="br-kalp" viewBox="0 0 200 180" role="img" aria-label="Altın Kalp: ${n} altın damar">${defs(id)}
      <path d="${HEART}" fill="url(#brPink${id})"/>
      <g clip-path="url(#brClip${id})" fill="none" stroke-linecap="round" stroke-linejoin="round">${seams}${crack ? `<path class="br-crack" d="${CRACK}"/>` : ''}</g>
      <path d="${HEART}" fill="none" stroke="#4A2138" stroke-width="4" stroke-linejoin="round"/>
      <path d="M50 30 C38 36 30 46 30 60" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" opacity=".5"/></svg>`;
  }
  // Tören kalbi: çatlaktan ikiye ayrılmış iki yarım
  function ceremonyHeart() {
    const id = ++uid;
    const L = 'M-10 -10 H100 V34 L91 58 L109 82 L93 110 L105 138 L100 172 V190 H-10 Z';
    const R = 'M100 -10 H210 V190 H100 V172 L105 138 L93 110 L109 82 L91 58 L100 34 Z';
    const half = (side, clip) => `<g class="br-half ${side}"><g clip-path="url(#${clip}${id})"><path d="${HEART}" fill="url(#brPink${id})" stroke="#4A2138" stroke-width="4" stroke-linejoin="round"/>${side === 'l' ? '<path d="M50 30 C38 36 30 46 30 60" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" opacity=".5"/>' : ''}</g></g>`;
    return `<svg class="br-cer-heart" viewBox="-24 -14 248 204" aria-hidden="true">${defs(id)}<clipPath id="brL${id}"><path d="${L}"/></clipPath><clipPath id="brR${id}"><path d="${R}"/></clipPath>
      ${half('l', 'brL')}${half('r', 'brR')}
      <path class="br-gold-glow" d="${CRACK}" stroke="url(#brGold${id})"/><path class="br-gold-crack" d="${CRACK}" stroke="url(#brGold${id})"/></svg>`;
  }
  // Köprü: her bayrak bir yarıyı indirir
  function bridgeSvg(fm, fh, joined) {
    const tower = (x, fill, up) => `<g class="br-tw"><rect x="${x}" y="38" width="44" height="66" rx="4" fill="${fill}" stroke="#4A2138" stroke-width="3"/><path d="M${x} 38 v-10 h9 v8 h8 v-8 h10 v8 h8 v-8 h9 v10" fill="${fill}" stroke="#4A2138" stroke-width="3" stroke-linejoin="round"/><rect x="${x + 16}" y="58" width="12" height="16" rx="6" fill="#FFF6D8" stroke="#4A2138" stroke-width="2.4"/>
      <g class="br-wflag ${up ? 'up' : ''}" style="transform-origin:${x + 22}px 28px"><path d="M${x + 22} 28 V2" stroke="#4A2138" stroke-width="2.6" stroke-linecap="round"/><path d="M${x + 22} 4 C${x + 30} 0 ${x + 34} 8 ${x + 42} 4 V18 C${x + 34} 22 ${x + 30} 14 ${x + 22} 18 Z" fill="#fff" stroke="#4A2138" stroke-width="2.2" stroke-linejoin="round"/></g></g>`;
    return `<svg class="br-bridge ${joined ? 'joined' : ''}" viewBox="0 -24 320 152" role="img" aria-label="${joined ? 'Köprü birleşti' : 'Köprü ayrık'}">
      <path d="M0 116 Q20 108 40 116 T80 116 T120 116 T160 116 T200 116 T240 116 T280 116 T320 116" fill="none" stroke="#8FD3FF" stroke-width="4" stroke-linecap="round"/>
      <g class="br-deck l ${fm ? 'down' : ''}"><rect x="52" y="64" width="110" height="9" rx="3" fill="#F7C9A8" stroke="#4A2138" stroke-width="3"/><path d="M58 64 V54 M80 64 V54 M102 64 V54 M124 64 V54 M146 64 V54 M56 54 H160" stroke="#4A2138" stroke-width="2.2" stroke-linecap="round"/></g>
      <g class="br-deck r ${fh ? 'down' : ''}"><rect x="158" y="64" width="110" height="9" rx="3" fill="#F7C9A8" stroke="#4A2138" stroke-width="3"/><path d="M174 64 V54 M196 64 V54 M218 64 V54 M240 64 V54 M262 64 V54 M160 54 H264" stroke="#4A2138" stroke-width="2.2" stroke-linecap="round"/></g>
      ${tower(8, '#FFD0E1', fm)}${tower(268, '#E3D7FF', fh)}
      <path class="br-bheart" d="M160 46 C147 38 145 26 153 24 C157 23 160 26 160 28 C160 26 163 23 167 24 C175 26 173 38 160 46 Z" fill="#E3174D" stroke="#4A2138" stroke-width="2.4" stroke-linejoin="round"/></svg>`;
  }

  /* ---------- Ana salon ruh hali: bulut, gökkuşağı, kulelerin arasındaki kalp ---------- */
  function mood() {
    const c = active();
    const ld = lastDone();
    const rainbow = !c && ld && Date.now() - ld.doneAt < 24 * 36e5;
    document.body.classList.toggle('kale-bulut', Boolean(c));
    document.body.classList.toggle('kale-gokkusagi', Boolean(rainbow));
    const center = K.$('.hero-scene .scene-center');
    if (!center) return;
    let b = K.$('.hero-baris', center);
    if (!c && !rainbow) return b && b.remove();
    if (!b) {
      b = K.el('<a class="hero-baris" href="#baris"></a>');
      center.appendChild(b);
    }
    const so = c && stateOf(other());
    b.className = `hero-baris ${c ? 'kus' : 'gold'}`;
    b.innerHTML = c ? `<span aria-hidden="true">${heartSvg(0, true)}</span><small>${so ? `${K.esc(nameOf(other()))}: ${stateDef(so.data.s)[1]}` : 'Köprüde buluşalım'}</small>` : `<span aria-hidden="true">${heartSvg(build().done.length, false)}</span><small>Barıştık</small>`;
    b.setAttribute('aria-label', c ? 'Barış Köprüsü: aranızda küçük bir bulut var' : 'Barıştınız: Altın Kalp');
    let rb = K.$('#hero .hero-rainbow');
    if (rainbow && !rb) K.$('#hero .hero-sky') && K.$('#hero .hero-sky').insertAdjacentHTML('beforeend', '<div class="hero-rainbow" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i></div>');
    if (!rainbow && rb) rb.remove();
    let rain = K.$('#hero .hero-kusrain');
    if (c && !rain) K.$('#hero .hero-sky') && K.$('#hero .hero-sky').insertAdjacentHTML('beforeend', `<div class="hero-kusrain" aria-hidden="true">${Array.from({ length: 22 }, (_, i) => `<i style="left:${(i * 47) % 100}%;--d:${((i * 0.37) % 1.6).toFixed(2)}s"></i>`).join('')}</div>`);
    if (!c && rain) rain.remove();
  }

  /* ---------- Eylemler ---------- */
  async function setState(s, extra = {}) {
    if (!on()) return K.fx.toast('Bulut kapalı; Barış Köprüsü için bulut gerekiyor.');
    const r = await add('aramiz', Object.assign({ s }, extra));
    if (!r) return K.fx.toast('Gönderilemedi. İnternet bağlantını kontrol et.');
    const d = stateDef(s);
    K.audio.sfx.tap();
    K.fx.toast(`${d[1]} <b>${K.esc(d[2])}</b> · ${K.esc(nameOf(other()))} ${K.cloud.otherHere() ? 'şu an görüyor' : 'kaleye girince görecek'}.`, { duration: 3500 });
    const msg = { kirgin: 'Bir şey canını acıttı. Barış Köprüsü\'ne bak.', alan: extra.until ? `Biraz alana ihtiyacı var · ${untilText(extra.until)}` : 'Biraz alana ihtiyacı var.', hazir: 'Konuşmaya hazır. Köprüde seni bekliyor.', iyi: 'Aranız iyi.' }[s];
    ping(`${d[1]} ${K.meName()}: ${d[2]}`, (extra.note ? extra.note + '\n' : '') + msg, ['dove']);
    changed();
    if (s === 'iyi') checkPeace(true);
  }
  function untilText(u) {
    if (!u) return '';
    const p = T.parts(K.isOwner() ? C.tzIstanbul : C.tzBaku, new Date(u));
    return `${K.pad(p.h)}:${K.pad(p.mi)}'e kadar`;
  }
  async function raiseFlag() {
    if (!on()) return K.fx.toast('Bulut kapalı; Barış Köprüsü için bulut gerekiyor.');
    const c = active();
    if (c && c.flag[mine()]) return K.fx.toast('Bayrağın zaten kalkık. Şimdi onun yarısını bekliyoruz.', { duration: 3000 });
    const r = await add('bayrak', {});
    if (!r) return K.fx.toast('Gönderilemedi. İnternet bağlantını kontrol et.');
    K.audio.sfx.whoosh();
    K.vibrate([30, 40, 30]);
    dove(true);
    const c2 = (cache = null, active());
    if (c2 && !c2.done) K.fx.toast(`🕊️ <b>Bayrağın kalktı.</b> Köprünün senin yarısı indi; ${K.esc(K.ek(nameOf(other()), 'in'))} yarısı bekleniyor.`, { duration: 5000 });
    ping(`🕊️ ${K.meName()} beyaz bayrak kaldırdı`, 'Köprünün yarısı indi. Öbür yarısı sende.', ['dove'], { priority: 5 });
    changed();
    checkPeace(true);
  }
  async function light() {
    const cur = isikOf(mine());
    const r = await add('isik', { on: !cur });
    if (!r) return;
    K.audio.sfx.sparkle();
    if (!cur) {
      K.fx.toast(`🕯️ <b>Işığın açık.</b> ${K.esc(nameOf(other()))} konuşmasan da burada olduğunu bilecek.`, { duration: 4000 });
      ping(`🕯️ ${K.meName()}: Işığım açık`, 'Konuşmasa da burada. Kapı aralık.', ['candle']);
    }
    changed();
  }
  const GECE = ['Küs olsak da iyi geceler. Seni seviyorum.', 'Kızgınım ama yine de iyi uykular.', 'Sabah konuşalım. İyi geceler, kalbim.'];
  async function kusGece(text) {
    text = text || K.pick(GECE);
    const r = await K.cloud.add('selam', { k: 'gece', text });
    if (!r) return K.fx.toast('Gönderilemedi.');
    K.cloud.send('kalp', { k: 'gece', text });
    K.store.set('kusGece-' + mine(), T.todayKey());
    K.audio.sfx.chime();
    K.fx.toast(`🌙 <b>Gönderildi:</b> ${K.esc(text)}`, { duration: 4000 });
    ping(`🌙 ${K.meName()}: ${text}`, 'Küs olsanız da.', ['crescent_moon']);
    changed();
  }

  /* Kalpten Mektup: "ben" diliyle, suçlamadan */
  function letterText(d) {
    const out = [];
    if (d.what) out.push(`Olan şu: ${d.what}`);
    if (d.feel && d.feel.length) out.push(`${listTr(d.feel).replace(/^./, (c) => c.toLocaleUpperCase('tr'))} hissettim.`);
    if (d.need && d.need.length) out.push(`İhtiyacım olan: ${listTr(d.need)}.`);
    if (d.ask) out.push(`Senden bir ricam var: ${d.ask}`);
    return out;
  }
  const listTr = (a) => (a.length > 1 ? `${a.slice(0, -1).join(', ')} ve ${a[a.length - 1]}` : a[0] || '');
  function letterCompose() {
    if (!on()) return K.fx.toast('Bulut kapalı; Barış Köprüsü için bulut gerekiyor.');
    const d = { feel: [], need: [], what: '', ask: '' };
    const m = K.ui.modal({
      label: 'Kalpten Mektup',
      cls: 'br-sheet br-letter-sheet',
      html: `<p class="card-eyebrow">Kalpten Mektup · ${K.esc(K.ek(nameOf(other()), 'e'))}</p><h2>Ne hissettin?</h2><p class="muted small">${K.esc(B().letterIntro || '')}</p>
        <label class="br-lab">Ne oldu? <small>(suçlamadan, sadece olanı)</small><textarea class="textarea" rows="2" maxlength="300" data-f="what" placeholder="Dün akşam mesajıma uzun süre cevap gelmeyince..."></textarea></label>
        <p class="br-lab">Ne hissettin?</p><div class="br-chips" data-g="feel">${(B().feelings || []).map((x) => `<button type="button" class="chip">${K.esc(x)}</button>`).join('')}</div>
        <p class="br-lab">Neye ihtiyacın var?</p><div class="br-chips" data-g="need">${(B().needs || []).map((x) => `<button type="button" class="chip">${K.esc(x)}</button>`).join('')}</div>
        <label class="br-lab">Ondan bir rican <small>(isteğe bağlı)</small><textarea class="textarea" rows="2" maxlength="300" data-f="ask" placeholder="Bir dahaki sefere geç kalacaksan bir kelime yazman yeter."></textarea></label>
        <div class="br-paper preview" aria-live="polite"></div>
        <button type="button" class="btn red" data-br-send>${A.icon('letter')} Mühürle ve gönder</button>`,
    });
    const b = m.body;
    const pv = K.$('.preview', b);
    const draw = () => {
      const lines = letterText(d);
      pv.innerHTML = lines.length ? `<p class="card-eyebrow">Mektubun böyle görünecek</p>${lines.map((l) => `<p class="hand">${K.esc(l)}</p>`).join('')}<p class="br-sign">— ${K.esc(nameOf(mine()))}</p>` : '';
      pv.hidden = !lines.length;
    };
    draw();
    b.addEventListener('input', (e) => {
      const f = e.target.dataset.f;
      if (f) {
        d[f] = e.target.value.trim();
        draw();
      }
    });
    b.addEventListener('click', async (e) => {
      const ch = e.target.closest('.br-chips .chip');
      if (ch) {
        const g = ch.parentElement.dataset.g;
        const v = ch.textContent;
        ch.classList.toggle('on');
        d[g] = ch.classList.contains('on') ? d[g].concat(v) : d[g].filter((x) => x !== v);
        return draw();
      }
      const s = e.target.closest('[data-br-send]');
      if (!s) return;
      if (!d.what && !d.feel.length) return K.fx.toast('En azından ne olduğunu ya da ne hissettiğini yaz.');
      s.disabled = true;
      const r = await add('kmektup', d);
      if (!r) {
        s.disabled = false;
        return K.fx.toast('Gönderilemedi. İnternet bağlantını kontrol et.');
      }
      m.close();
      K.audio.sfx.paper();
      K.stickers.award('kmektup');
      K.fx.toast(`💌 <b>Mühürlendi.</b> ${K.esc(nameOf(other()))} okumaya hazır olduğunda açacak.`, { duration: 4500 });
      ping(`💌 ${K.meName()} sana kalpten bir mektup yazdı`, 'Mühürlü bekliyor. Hazır olduğunda oku.', ['love_letter']);
      changed();
    });
  }
  function letterRead(r) {
    const mineL = r.who === mine();
    const lines = letterText(r.data);
    const heard = heardOf(r.id);
    const m = K.ui.modal({
      label: 'Kalpten Mektup',
      cls: 'br-sheet br-read',
      html: `<div class="br-paper open"><p class="card-eyebrow">${K.esc(nameOf(r.who))} · ${K.esc(T.fmtShort(new Date(r.at)))}</p>${lines.map((l) => `<p class="hand">${K.esc(l)}</p>`).join('')}<p class="br-sign">— ${K.esc(nameOf(r.who))}</p></div>
        ${heard.map((h) => `<div class="br-heard"><p class="card-eyebrow">${K.esc(nameOf(h.who))} · seni duydum</p><p class="hand">${K.esc(h.data.text)}</p></div>`).join('')}
        ${mineL ? '' : `<div class="br-hear"><p class="card-eyebrow">Seni duydum</p><p class="muted small">${K.esc(B().heardIntro || '')}</p>
          <textarea class="textarea" rows="3" maxlength="400" placeholder="Anladığım kadarıyla sen ${K.esc(listTr((r.data.feel || []).slice(0, 2)) || '...')} hissettin..."></textarea>
          <div class="row"><button type="button" class="btn red" data-br-heard>${A.ui('heart')} Seni duydum</button><button type="button" class="btn soft" data-br-own>${A.icon('letter')} Ben de yazmak istiyorum</button></div></div>`}`,
    });
    m.body.addEventListener('click', async (e) => {
      if (e.target.closest('[data-br-own]')) {
        m.close();
        return letterCompose();
      }
      const h = e.target.closest('[data-br-heard]');
      if (!h) return;
      const ta = K.$('textarea', m.body);
      const text = ta.value.trim() || 'Seni duydum. Hissettiklerin benim için önemli.';
      h.disabled = true;
      const a = await add('kmcevap', { ref: r.id, text });
      if (!a) {
        h.disabled = false;
        return K.fx.toast('Gönderilemedi.');
      }
      m.close();
      K.audio.sfx.chime();
      K.fx.toast(`💗 <b>Gönderildi.</b> Duyulmak bazen her şeyden önce gelir.`, { duration: 3500 });
      ping(`💗 ${K.meName()}: Seni duydum`, text.slice(0, 160), ['heart']);
      changed();
    });
  }
  async function letterOpen(r) {
    if (!read(r.id) && r.who !== mine()) {
      const a = await add('kmokundu', { ref: r.id });
      if (a) ping(`💌 ${K.meName()} mektubunu okudu`, 'Kalpten mektubun açıldı.', ['envelope_with_arrow']);
      changed();
    }
    letterRead(r);
  }

  /* Özür: birkaç cümle, bir çiçek, istersen sesin */
  function apologyCompose() {
    if (!on()) return K.fx.toast('Bulut kapalı; Barış Köprüsü için bulut gerekiyor.');
    const FL = B().flowers || [['lale', '🌷', 'Lale']];
    let flower = FL[0][0], voice = null, recr = null;
    const m = K.ui.modal({
      label: 'Özür dile',
      cls: 'br-sheet',
      html: `<p class="card-eyebrow">Özür · ${K.esc(K.ek(nameOf(other()), 'e'))}</p><h2>Özür dilemek küçültmez.</h2>
        <div class="br-chips one">${(B().apologies || []).map((x) => `<button type="button" class="chip" data-ap>${K.esc(x)}</button>`).join('')}</div>
        <textarea class="textarea" rows="3" maxlength="500" placeholder="Kendi cümlelerinle..."></textarea>
        <p class="br-lab">Yanına bir çiçek</p><div class="br-flowers">${FL.map(([id, e, n], i) => `<button type="button" class="${i ? '' : 'on'}" data-fl="${id}"><span>${e}</span><small>${K.esc(n)}</small></button>`).join('')}</div>
        <div class="br-rec" hidden><span class="br-rec-dot"></span><b class="br-rec-t">0 / 60 sn</b><audio controls hidden></audio></div>
        <div class="row"><button type="button" class="btn soft" data-br-mic>${A.ui('mic')} Sesinle söyle</button><button type="button" class="btn red" data-br-send>${A.icon('lily')} Gönder</button></div>`,
    });
    const b = m.body;
    const ta = K.$('textarea', b);
    const recBox = K.$('.br-rec', b), micB = K.$('[data-br-mic]', b);
    async function toggleRec() {
      if (recr && recr.r.state === 'recording') return recr.r.stop();
      const mime = window.MediaRecorder ? ['audio/mp4;codecs=mp4a.40.2', 'audio/mp4', 'audio/webm;codecs=opus', 'audio/webm'].find((x) => MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(x)) || '' : null;
      if (mime === null || !navigator.mediaDevices) return K.fx.toast('Bu cihaz ses kaydını desteklemiyor.');
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      } catch (err) {
        return K.fx.toast('Mikrofon izni verilmedi. Tarayıcı ayarlarından izin verip tekrar dene.');
      }
      const chunks = [];
      const r = new MediaRecorder(stream, mime ? { mimeType: mime, audioBitsPerSecond: 48000 } : { audioBitsPerSecond: 48000 });
      recr = { r, start: Date.now() };
      r.ondataavailable = (ev) => ev.data.size && chunks.push(ev.data);
      r.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        clearInterval(recr.tick);
        const blob = new Blob(chunks, { type: r.mimeType || mime || 'audio/webm' });
        voice = { blob, dur: Math.round((Date.now() - recr.start) / 100) / 10 };
        recBox.classList.remove('on');
        const au = K.$('audio', recBox);
        au.src = URL.createObjectURL(blob);
        au.hidden = false;
        micB.innerHTML = `${A.ui('mic')} Yeniden kaydet`;
      };
      r.start();
      recBox.hidden = false;
      recBox.classList.add('on');
      K.$('audio', recBox).hidden = true;
      micB.innerHTML = `${A.ui('pause')} Bitir`;
      recr.tick = setInterval(() => {
        const sec = (Date.now() - recr.start) / 1000;
        K.$('.br-rec-t', recBox).textContent = `${Math.floor(sec)} / 60 sn`;
        if (sec >= 60 && r.state === 'recording') r.stop();
      }, 200);
    }
    b.addEventListener('click', async (e) => {
      const ap = e.target.closest('[data-ap]');
      if (ap) {
        ta.value = (ta.value.trim() ? ta.value.trim() + ' ' : '') + ap.textContent;
        return ta.focus();
      }
      const fl = e.target.closest('[data-fl]');
      if (fl) {
        flower = fl.dataset.fl;
        K.$$('[data-fl]', b).forEach((x) => x.classList.toggle('on', x === fl));
        return;
      }
      if (e.target.closest('[data-br-mic]')) return toggleRec();
      const s = e.target.closest('[data-br-send]');
      if (!s) return;
      if (recr && recr.r.state === 'recording') return K.fx.toast('Önce kaydı bitir.');
      const text = ta.value.trim();
      if (!text && !voice) return ta.focus();
      s.disabled = true;
      s.classList.add('loading');
      const data = { text, flower };
      if (voice) {
        const b64 = await new Promise((res) => {
          const fr = new FileReader();
          fr.onload = () => res(String(fr.result).split(',')[1] || '');
          fr.onerror = () => res('');
          fr.readAsDataURL(voice.blob);
        });
        const au = b64 && b64.length < 2.4e6 && (await K.cloud.add('ozurses', { b64, mime: voice.blob.type || 'audio/webm' }));
        if (!au) {
          s.disabled = false;
          s.classList.remove('loading');
          return K.fx.toast('Ses gönderilemedi. Daha kısa bir kayıt dene.');
        }
        data.audio = au.id;
        data.dur = voice.dur;
      }
      const r = await add('ozur', data);
      if (!r) {
        s.disabled = false;
        s.classList.remove('loading');
        return K.fx.toast('Gönderilemedi. İnternet bağlantını kontrol et.');
      }
      m.close();
      const f = FL.find((x) => x[0] === flower) || FL[0];
      K.audio.sfx.chime();
      K.fx.rain({ count: 26, shapes: ['heart'], colors: ['#FFB3CB', '#FFFFFF', '#FFD34E'] });
      K.fx.toast(`${f[1]} <b>Özrün gitti.</b> Özür dilemek aynı zamanda bayrağı kaldırmaktır.`, { duration: 4500 });
      ping(`${f[1]} ${K.meName()} özür diledi`, voice ? 'Bir çiçek ve sesli bir not bıraktı.' : 'Bir çiçek ve birkaç cümle bıraktı.', ['tulip'], { priority: 5 });
      changed();
      checkPeace(true);
    });
  }
  let apAudio = null;
  async function playApology(r, btn) {
    if (apAudio) {
      try {
        apAudio.pause();
      } catch (e) {}
      apAudio = null;
      btn && btn.classList.remove('playing');
      return;
    }
    btn && btn.classList.add('loading');
    const h = await K.cloud.get(r.data.audio);
    btn && btn.classList.remove('loading');
    if (!h || !h.data || !h.data.b64) return K.fx.toast('Ses bulunamadı.');
    const bin = atob(h.data.b64);
    const u8 = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
    apAudio = new Audio(URL.createObjectURL(new Blob([u8], { type: h.data.mime || 'audio/mp4' })));
    K.audio.music && K.audio.music.stop && K.audio.music.stop();
    apAudio.play().catch(() => {});
    btn && btn.classList.add('playing');
    apAudio.onended = () => {
      apAudio = null;
      btn && btn.classList.remove('playing');
    };
  }
  async function apologyAnswer(r, k) {
    const a = await add('ozurcevap', { ref: r.id, k });
    if (!a) return K.fx.toast('Gönderilemedi.');
    if (k === 'kabul') {
      K.audio.sfx.success();
      dove(true);
      ping(`🕊️ ${K.meName()} özrünü kabul etti`, 'Köprünün iki yarısı birleşiyor.', ['dove'], { priority: 5 });
    } else {
      K.audio.sfx.tap();
      K.fx.toast('Tamam. Zaman da iyileştirir; acele yok.', { duration: 3000 });
      ping(`⏳ ${K.meName()} biraz zamana ihtiyaç duyuyor`, 'Özrünü gördü. Biraz bekle; köprü burada.', ['hourglass_flowing_sand']);
    }
    changed();
    checkPeace(true);
  }

  /* Mola: iki ekranda aynı anda nefes */
  function molaCompose() {
    if (!on()) return K.fx.toast('Bulut kapalı; Barış Köprüsü için bulut gerekiyor.');
    const m = K.ui.modal({
      label: 'Mola',
      cls: 'br-sheet',
      html: `<p class="card-eyebrow">Mola</p><h2>Biraz nefes alalım mı?</h2><p class="muted small">${K.esc((B().tips || [])[3] || '')}</p>
        <div class="br-mins">${[10, 20, 30, 60].map((n) => `<button type="button" data-min="${n}"><b>${n}</b><small>dakika</small></button>`).join('')}</div>`,
    });
    m.body.addEventListener('click', async (e) => {
      const b = e.target.closest('[data-min]');
      if (!b) return;
      const min = +b.dataset.min;
      const r = await add('mola', { min });
      if (!r) return K.fx.toast('Gönderilemedi.');
      m.close();
      K.audio.sfx.chime();
      K.fx.toast(`⏳ <b>${min} dakikalık mola.</b> İkinizin ekranında da aynı nefes.`, { duration: 3500 });
      ping(`⏳ ${K.meName()} ${min} dakikalık mola verdi`, 'Kaçmak değil, dönmek için nefes. Bitince köprüde buluşun.', ['hourglass_flowing_sand']);
      const lt = K.later(r.at + min * 6e4);
      if (lt) ping('⏳ Mola bitti', B().molaEnd || 'Hazır olduğunda köprü burada.', ['dove'], lt);
      if (K.activeRoom !== 'baris') location.hash = 'baris';
      changed();
    });
  }
  async function molaStop() {
    await add('mola', { min: 0 });
    changed();
  }
  function breathAt(at) {
    const cyc = BREATH().reduce((s, x) => s + x[1], 0);
    let t = ((Date.now() - at) / 1000) % cyc;
    for (const [label, sec] of BREATH()) {
      if (t < sec) return { label, left: Math.ceil(sec - t) };
      t -= sec;
    }
    return { label: BREATH()[0][0], left: BREATH()[0][1] };
  }

  /* Beyaz güvercin: bayrak kalkınca ekrandan uçar */
  function dove(big) {
    if (K.reduced) return;
    const el = K.el(`<div class="br-dove ${big ? 'big' : ''}" aria-hidden="true">${A.icon('pigeon')}</div>`);
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 4200);
  }

  /* ---------- Barış Töreni ---------- */
  let cerOpen = null;
  async function checkPeace(live) {
    cache = null;
    const done = build().done;
    for (const ep of done) {
      if (ep.peace) continue;
      // İkinci eli uzatan (ya da ilk gören) töreni kayda geçer
      const r = await add('baristi', { ep: ep.start.id, dur: ep.doneAt - ep.start.at, first: ep.first });
      cache = null;
      if (r && live) ping('🕊️ Barıştınız', 'Altın Kalp\'e bir damar daha eklendi. Töreni aç.', ['dove', 'sparkles'], { priority: 5 });
    }
    const fresh = build().done.filter((e) => Date.now() - e.doneAt < 3 * 864e5 && !K.store.get(`barisSeen-${mine()}-${e.start.id}`));
    if (fresh.length && live && !cerOpen && !K.$('.modal')) ceremony(fresh[fresh.length - 1]);
    changed();
  }
  function ceremony(ep) {
    if (cerOpen) return;
    K.store.set(`barisSeen-${mine()}-${ep.start.id}`, Date.now());
    const n = build().done.findIndex((e) => e.start.id === ep.start.id) + 1 || build().done.length;
    const lines = B().ceremony || ['Barıştınız.'];
    const m = K.ui.modal({
      label: 'Barış Töreni',
      cls: 'br-ceremony',
      html: `<div class="br-cer-stage">${ceremonyHeart()}<div class="br-cer-rays" aria-hidden="true"></div></div>
        <div class="br-cer-lines">${lines.map((l, i) => `<p style="--i:${i}" class="${i ? '' : 'big'}">${K.esc(l)}</p>`).join('')}<p style="--i:${lines.length}" class="br-cer-n">${n}. altın damar · ${K.esc(dur(ep.doneAt - ep.start.at))} sürdü</p></div>
        <div class="br-cer-promise"><p class="card-eyebrow">Bu barışa bir söz</p>
          <div class="br-chips one">${(B().promises || []).map((x) => `<button type="button" class="chip" data-pr>${K.esc(x)}</button>`).join('')}</div>
          <textarea class="textarea" rows="2" maxlength="200" placeholder="Bir dahakine..."></textarea>
          <div class="row"><button type="button" class="btn red" data-br-soz>${A.icon('kintsugi')} Sözümü mühürle</button>${K.radyo && K.radyo.start && K.sarkidefteri && K.sarkidefteri.songs().length ? `<button type="button" class="btn soft" data-br-song>${A.ui('music')} Barış şarkımızı aç</button>` : ''}</div>
          <div class="br-cer-soz"></div></div>`,
      onClose: () => {
        cerOpen = null;
        render();
      },
    });
    cerOpen = { m, ep };
    const el = m.el;
    const drawSoz = () => {
      const box = K.$('.br-cer-soz', el);
      const ps = promisesOf(ep.start.id);
      box.innerHTML = ps.map((p) => `<p><b>${K.esc(nameOf(p.who))}:</b> <span class="hand">${K.esc(p.data.text)}</span></p>`).join('');
      const mineP = ps.some((p) => p.who === mine());
      K.$('.br-cer-promise textarea', el).hidden = mineP;
      K.$('.br-cer-promise .br-chips', el).hidden = mineP;
      K.$('[data-br-soz]', el).hidden = mineP;
    };
    cerOpen.draw = drawSoz;
    drawSoz();
    K.audio.sfx.paper();
    setTimeout(() => el.classList.add('join'), 500);
    setTimeout(() => {
      el.classList.add('gold');
      K.audio.sfx.success();
      K.vibrate([40, 60, 120]);
    }, 1900);
    setTimeout(() => {
      K.fx.confetti({ count: 160, shapes: ['heart', 'spark'], colors: ['#EDBE45', '#FFF0B8', '#FF8FB8', '#FFFFFF'] });
      dove(true);
    }, 2600);
    K.stickers.award('baris');
    m.body.addEventListener('click', async (e) => {
      const pr = e.target.closest('[data-pr]');
      if (pr) {
        K.$('.br-cer-promise textarea', el).value = pr.textContent;
        return;
      }
      if (e.target.closest('[data-br-song]')) {
        const songs = K.sarkidefteri.songs();
        const s = K.pick(songs);
        m.close();
        location.hash = 'radyo';
        setTimeout(() => K.radyo.start(s.id), 600);
        return;
      }
      const sz = e.target.closest('[data-br-soz]');
      if (!sz) return;
      const text = K.$('.br-cer-promise textarea', el).value.trim();
      if (!text) return K.$('.br-cer-promise textarea', el).focus();
      sz.disabled = true;
      const r = await add('barissoz', { ep: ep.start.id, text });
      sz.disabled = false;
      if (!r) return K.fx.toast('Gönderilemedi.');
      K.audio.sfx.chime();
      ping(`💛 ${K.meName()} bu barışa bir söz verdi`, text, ['sparkles']);
      drawSoz();
    });
  }

  /* ---------- Barış Antlaşması ---------- */
  const signers = (r) => [r.who].concat(of('kuralimza').filter((x) => x.data.ref === r.id).map((x) => x.who)).filter((w, i, a) => a.indexOf(w) === i);
  async function addRule(text) {
    const r = await add('kural', { text });
    if (!r) return K.fx.toast('Eklenemedi.');
    K.audio.sfx.paper();
    ping(`📜 ${K.meName()} Barış Antlaşması'na bir madde ekledi`, `"${text}" İmzanı bekliyor.`, ['scroll']);
    changed();
  }
  async function signRule(id) {
    const r = await add('kuralimza', { ref: id });
    if (!r) return;
    K.audio.sfx.success();
    K.stickers.award('antlasma');
    K.fx.toast('📜 <b>İmzalandı.</b> Bu madde artık ikinizin.', { duration: 3000 });
    changed();
  }

  /* ---------- Oda ---------- */
  function render() {
    if (!root || K.activeRoom !== 'baris') return;
    cache = null;
    const { done, cur } = build();
    const so = stateOf(other()), sm = stateOf(mine());
    const o = other(), me = mine();
    const mo = molaNow();
    // Altın Kalp
    const n = done.length;
    K.$('#brHeart', root).innerHTML = `<div class="br-kalp-wrap ${cur ? 'kus' : ''}">${heartSvg(n, Boolean(cur))}</div>
      <div class="br-kalp-text"><p class="card-eyebrow">Altın Kalp</p><h3>${n ? K.esc(K.fill(B().count || '{n}').replace(/\{n\}/g, n)) : cur ? 'İlk çatlak' : 'Kalp tertemiz'}</h3>
        <p class="muted">${K.esc(cur ? (n ? 'Bu çatlak da altınla dolacak. Her seferinde olduğu gibi.' : 'Barıştığınızda bu çatlak altınla dolacak ve kalp hiç olmadığı kadar güzel olacak.') : n ? B().kintsugi || '' : B().countZero || '')}</p>
        ${cur ? `<p class="br-now"><span aria-hidden="true">☁️</span> Şu an aranızda küçük bir bulut var · ${K.esc(K.ago(cur.start.at))} başladı</p>` : ''}</div>`;
    // Köprü ve bayraklar
    const fm = cur ? cur.flag.me : 1, fh = cur ? cur.flag.her : 1;
    K.$('#brBridge', root).innerHTML = `${bridgeSvg(fm, fh, !cur)}
      <div class="br-bridge-cap">${cur ? `<span class="${cur.flag[me] ? 'ok' : ''}">${K.esc(nameOf(me))}: ${cur.flag[me] ? 'bayrak kalktı ✓' : 'bekliyor'}</span><span class="${cur.flag[o] ? 'ok' : ''}">${K.esc(nameOf(o))}: ${cur.flag[o] ? 'bayrak kalktı ✓' : 'bekliyor'}</span>` : `<span class="ok">Köprü sağlam. Kalbin iki yarısı bir arada.</span>`}</div>
      ${cur && !cur.flag[me] ? `<button type="button" class="btn red br-flag-btn" data-br="bayrak">${A.icon('flag')} Beyaz bayrağı kaldır</button>` : cur ? `<p class="muted small br-wait">Senin yarın indi. Şimdi ${K.esc(K.ek(nameOf(o), 'in'))} yarısını bekliyoruz; acele yok.</p>` : `<button type="button" class="btn soft small br-flag-btn" data-br="bayrak">${A.icon('flag')} Bir şey mi oldu? Bayrağı ilk sen kaldır</button>`}`;
    // Aramız nasıl
    const side = (w, st) => {
      const d = st ? stateDef(st.data.s) : stateDef('iyi');
      const isik = isikOf(w);
      return `<div class="br-side ${st ? 'st-' + st.data.s : 'st-iyi'}">${K.avatar(w, 'yan-av')}<div><small>${K.esc(nameOf(w))}${w === me ? ' (sen)' : ''}</small><b>${d[1]} ${K.esc(d[2])}</b>
        ${st && st.data.lvl && st.data.s === 'kirgin' ? `<span class="br-lvl" aria-label="${st.data.lvl}/5">${'☁️'.repeat(st.data.lvl)}</span>` : ''}
        ${st && st.data.until ? `<small>${K.esc(untilText(st.data.until))}</small>` : ''}${st && st.data.note ? `<p class="hand">"${K.esc(st.data.note)}"</p>` : ''}
        ${isik ? `<span class="br-isik">🕯️ Işığı açık · konuşmasa da burada</span>` : ''}${st ? `<small class="muted">${K.esc(K.ago(st.at))}</small>` : ''}</div></div>`;
    };
    K.$('#brState', root).innerHTML = `<p class="card-eyebrow">Aramız nasıl?</p><div class="br-sides">${side(me, sm)}${side(o, so)}</div>
      <p class="br-lab">Senin durumun</p><div class="br-states">${(B().states || []).map(([id, e, l, t]) => `<button type="button" class="${(sm ? sm.data.s : 'iyi') === id ? 'on' : ''}" data-st="${id}"><span>${e}</span><b>${K.esc(l)}</b><small>${K.esc(t)}</small></button>`).join('')}</div>`;
    // Eylemler
    const acts = [
      ['mektup', 'letter', 'Kalpten Mektup', 'Suçlamadan, kendi tarafından'],
      ['ozur', 'lily', 'Özür dile', 'Bir çiçek, birkaç cümle, istersen sesin'],
      ['mola', 'hourglass', 'Mola ver', 'İki ekranda aynı anda nefes'],
    ];
    if (cur) acts.push(['isik', 'candle', isikOf(me) ? 'Işığımı kapat' : 'Işığım açık', 'Konuşmasam da buradayım']);
    if (cur || myHour() >= 21 || myHour() < 4) acts.push(['gece', 'moon', 'Küs ama iyi geceler', 'Küs yatsak da iyi geceler diyelim']);
    K.$('#brActs', root).innerHTML = acts.map(([id, ic, t, s]) => `<button type="button" class="br-act" data-br="${id}">${A.icon(ic)}<b>${K.esc(t)}</b><small>${K.esc(s)}</small></button>`).join('');
    // Canlı: mola, mektuplar, özürler
    const live = [];
    if (mo) {
      const b = breathAt(mo.r.at);
      const cyc = BREATH().reduce((s, x) => s + x[1], 0);
      const off = (((Date.now() - mo.r.at) / 1000) % cyc).toFixed(2);
      const both = K.yan && K.yan.where() && K.yan.where().room === 'baris';
      live.push(`<section class="card br-mola"><p class="card-eyebrow">Mola · ${K.esc(nameOf(mo.r.who))} başlattı</p>
        <div class="br-breath" style="--cyc:${cyc}s;--off:-${off}s"><i></i><b data-br-bl>${K.esc(b.label)}</b><small data-br-bs>${b.left}</small></div>
        <p class="br-mola-left"><b data-br-left>${K.esc(dur(mo.end - Date.now()))}</b> kaldı${both ? ` · <span class="dot on"></span> ${K.esc(nameOf(o))} da şu an seninle nefes alıyor` : ''}</p>
        <button type="button" class="btn ghost small" data-br="molabit">Molayı bitir</button></section>`);
    }
    const recent = (r) => (cur && r.at >= cur.start.at) || Date.now() - r.at < 3 * 864e5;
    lettersTo(me).filter((r) => !read(r.id) || recent(r)).slice(0, 3).forEach((r) => {
      const isRead = read(r.id);
      live.push(`<section class="card br-env ${isRead ? 'read' : ''}"><div class="br-env-ic" aria-hidden="true">${isRead ? '💌' : '✉️'}</div><div><p class="card-eyebrow">${K.esc(nameOf(r.who))} · ${K.esc(K.ago(r.at))}</p>
        <h3>${isRead ? 'Kalpten mektup' : 'Mühürlü bir mektup var'}</h3><p class="muted small">${isRead ? (heardOf(r.id).some((h) => h.who === me) ? 'Ona "seni duydum" dedin.' : 'Okudun. Duyduğunu söylemek ister misin?') : 'Kendini hazır hissettiğinde aç. Acele yok.'}</p>
        <button type="button" class="btn ${isRead ? 'soft' : 'red'} small" data-br-letter="${r.id}">${isRead ? 'Yeniden oku' : 'Okumaya hazırım'}</button></div></section>`);
    });
    of('kmektup').filter((r) => r.who === me && recent(r)).sort((a, b) => b.at - a.at).slice(0, 2).forEach((r) => {
      const h = heardOf(r.id).filter((x) => x.who !== me);
      live.push(`<section class="card br-env mine"><div class="br-env-ic" aria-hidden="true">📨</div><div><p class="card-eyebrow">Senin mektubun · ${K.esc(K.ago(r.at))}</p>
        <h3>${h.length ? `${K.esc(nameOf(o))}: "Seni duydum"` : read(r.id) ? 'Okudu' : 'Mühürlü; henüz açmadı'}</h3>${h.length ? `<p class="hand">${K.esc(h[h.length - 1].data.text)}</p>` : ''}
        <button type="button" class="btn ghost small" data-br-letter="${r.id}">Mektubu gör</button></div></section>`);
    });
    const FL = B().flowers || [];
    apologiesTo(me).filter(recent).slice(0, 2).forEach((r) => {
      const f = FL.find((x) => x[0] === r.data.flower) || ['', '🌷', ''];
      const a = answerOf(r.id);
      live.push(`<section class="card br-apology"><div class="br-flower" aria-hidden="true">${f[1]}</div><div><p class="card-eyebrow">${K.esc(nameOf(r.who))} özür diledi · ${K.esc(K.ago(r.at))}</p>
        ${r.data.text ? `<p class="hand">${K.esc(r.data.text)}</p>` : ''}${r.data.audio ? `<button type="button" class="btn soft small br-voice" data-br-voice="${r.id}">${A.ui('play')} Sesini dinle · ${Math.round(r.data.dur || 0)} sn</button>` : ''}
        ${a ? `<p class="br-ans">${a.data.k === 'kabul' ? '🕊️ Kabul ettin.' : '⏳ Biraz zaman istedin.'}</p>` : ''}
        ${!a || a.data.k !== 'kabul' ? `<div class="row"><button type="button" class="btn red small" data-br-ans="kabul" data-ref="${r.id}">🕊️ Kabul ediyorum</button>${a ? '' : `<button type="button" class="btn ghost small" data-br-ans="zaman" data-ref="${r.id}">Biraz zamana ihtiyacım var</button>`}</div>` : ''}</div></section>`);
    });
    of('ozur').filter((r) => r.who === me && recent(r)).sort((a, b) => b.at - a.at).slice(0, 1).forEach((r) => {
      const a = answerOf(r.id);
      const f = FL.find((x) => x[0] === r.data.flower) || ['', '🌷', ''];
      live.push(`<section class="card br-apology mine"><div class="br-flower" aria-hidden="true">${f[1]}</div><div><p class="card-eyebrow">Senin özrün · ${K.esc(K.ago(r.at))}</p>
        <h3>${a ? (a.data.k === 'kabul' ? `🕊️ ${K.esc(nameOf(o))} kabul etti` : `⏳ ${K.esc(nameOf(o))} biraz zaman istiyor`) : 'Henüz cevap yok'}</h3>${a && a.data.k !== 'kabul' ? '<p class="muted small">Zaman ver. Beklemek de sevgidir.</p>' : ''}</div></section>`);
    });
    K.$('#brLive', root).innerHTML = live.join('');
    // Kızgınken aç (sadece Eln)
    const km = D.kizginMektup;
    const kz = K.$('#brKizgin', root);
    kz.hidden = K.isOwner() || !km;
    if (!kz.hidden) kz.innerHTML = `<div class="br-env-ic" aria-hidden="true">💌</div><div><p class="card-eyebrow">${K.esc(C.myPet)} · önceden yazdı</p><h3>${K.esc(km.title)}</h3><p class="muted small">Sadece ona kızgınken açılmak için yazıldı.</p><button type="button" class="btn red small" data-br="kizgin">Aç</button></div>`;
    // İpucu
    const tips = B().tips || [];
    const ti = K.store.get('brTip', 0) % Math.max(1, tips.length);
    K.$('#brTip', root).innerHTML = tips.length ? `<p class="card-eyebrow">Küçük bir hatırlatma</p><p class="br-tip-t">${K.esc(tips[ti])}</p><button type="button" class="linkish" data-br="tip">Bir tane daha</button>` : '';
    // Antlaşma
    const rules = of('kural').sort((a, b) => a.at - b.at);
    K.$('#brAnt', root).innerHTML = `<p class="card-eyebrow">Barış Antlaşması</p><h3>İkimizin kuralları</h3><p class="muted small">Sakinken yazılır, kızgınken hatırlanır. Bir madde ikiniz de imzalayınca mühürlenir.</p>
      <ol class="br-rules">${rules.map((r) => {
        const s = signers(r);
        const sealed = s.includes('me') && s.includes('her');
        return `<li class="${sealed ? 'sealed' : ''}"><p>${K.esc(r.data.text)}</p><div class="br-sigs">${['me', 'her'].map((w) => (s.includes(w) ? `<span class="sig">${K.esc(nameOf(w))}</span>` : w === me ? `<button type="button" class="btn red small" data-br-sign="${r.id}">İmzala</button>` : `<span class="sig wait">${K.esc(nameOf(w))} bekleniyor</span>`)).join('')}${sealed ? '<span class="br-seal" aria-label="Mühürlü">💮</span>' : ''}${!sealed && r.who === me ? `<button type="button" class="linkish" data-br-unrule="${r.id}">Sil</button>` : ''}</div></li>`;
      }).join('') || '<li class="empty">Henüz madde yok. İlk maddeyi sen yaz.</li>'}</ol>
      <form class="br-rule-add" autocomplete="off"><input class="input" maxlength="140" placeholder="Ör. Gece ikiden sonra tartışmayız." name="t"><button class="btn soft small" type="submit">${A.ui('plus')} Ekle</button></form>
      <div class="br-chips one">${(B().promises || []).slice(0, 4).map((x) => `<button type="button" class="chip" data-rule-idea>${K.esc(x)}</button>`).join('')}</div>`;
    // Defter
    const list = done.slice().reverse();
    const avg = n ? done.reduce((s, e) => s + (e.doneAt - e.start.at), 0) / n : 0;
    const fastest = n ? done.reduce((a, e) => (e.doneAt - e.start.at < a.doneAt - a.start.at ? e : a)) : null;
    const firstBy = { me: done.filter((e) => e.first === 'me').length, her: done.filter((e) => e.first === 'her').length };
    K.$('#brDef', root).innerHTML = `<p class="card-eyebrow">Barış Defteri</p><h3>${n ? K.esc(K.fill(B().count || '').replace(/\{n\}/g, n)) : 'Henüz sayfa yok'}</h3>
      ${n ? `<div class="br-stats"><div><b>${K.esc(dur(avg))}</b><small>ortalama küslük</small></div><div><b>${K.esc(dur(fastest.doneAt - fastest.start.at))}</b><small>en hızlı barışma</small></div><div><b>${firstBy.me} · ${firstBy.her}</b><small>bayrağı ilk kaldıran: ${K.esc(nameOf('me'))} · ${K.esc(nameOf('her'))}</small></div></div>` : ''}
      <ul class="br-pages">${list.map((e, i) => {
        const ps = promisesOf(e.start.id);
        return `<li><span class="br-pg-n">${n - i}</span><div><b>${K.esc(T.fmtShort(new Date(e.start.at)))} · ${K.esc(dur(e.doneAt - e.start.at))}</b><small>Bayrağı ilk ${K.esc(nameOf(e.first))} kaldırdı</small>${ps.map((p) => `<p><b>${K.esc(nameOf(p.who))}:</b> <span class="hand">${K.esc(p.data.text)}</span></p>`).join('')}</div></li>`;
      }).join('')}</ul>
`;
    tick();
  }
  function tick() {
    if (!root || K.activeRoom !== 'baris') return;
    const mo = molaNow();
    const box = K.$('.br-mola', root);
    if (!mo) {
      if (box) {
        render();
        if (!K.store.get('molaEnd-' + mine() + '-' + of('mola').length)) {
          K.store.set('molaEnd-' + mine() + '-' + of('mola').length, 1);
          K.audio.sfx.chime();
          K.fx.toast(`⏳ <b>Mola bitti.</b> ${K.esc(B().molaEnd || '')}`, { duration: 6000 });
        }
      }
      return;
    }
    if (!box) return render();
    const b = breathAt(mo.r.at);
    K.$('[data-br-bl]', box).textContent = b.label;
    K.$('[data-br-bs]', box).textContent = b.left;
    K.$('[data-br-left]', box).textContent = dur(mo.end - Date.now());
  }
  let rT = 0;
  function changed() {
    cache = null;
    clearTimeout(rT);
    rT = setTimeout(() => {
      mood();
      render();
      K.renderSpecials && !K.activeRoom && K.renderSpecials();
    }, 60);
  }

  /* ---------- Karşıdan gelenler ---------- */
  function incoming(r) {
    if (r.who === mine()) return;
    const from = nameOf(r.who);
    const d = r.data;
    if (r.kind === 'aramiz') {
      const s = stateDef(d.s);
      K.fx.toast(`${s[1]} <b>${K.esc(from)}:</b> ${K.esc(s[2])}${d.note ? ` · "${K.esc(d.note)}"` : ''} <a href="#baris">Köprüye git</a>`, { duration: 8000, log: true });
    }
    if (r.kind === 'bayrak') {
      dove(true);
      K.audio.sfx.chime();
      K.vibrate([60, 40, 60]);
      const c = active();
      if (!c || !c.done) K.fx.toast(`🕊️ <b>${K.esc(from)} beyaz bayrak kaldırdı.</b> Köprünün onun yarısı indi. <a href="#baris">Senin yarın</a>`, { duration: 10000 });
    }
    if (r.kind === 'kmektup') {
      K.audio.sfx.paper();
      K.fx.toast(`💌 <b>${K.esc(from)} sana kalpten bir mektup yazdı.</b> Hazır olduğunda. <a href="#baris">Köprüye git</a>`, { duration: 10000 });
    }
    if (r.kind === 'kmokundu') K.fx.toast(`💌 <b>${K.esc(from)} mektubunu okudu.</b>`, { duration: 5000 });
    if (r.kind === 'kmcevap') K.fx.toast(`💗 <b>${K.esc(from)}: Seni duydum.</b> ${K.esc(d.text.slice(0, 120))}`, { duration: 9000 });
    if (r.kind === 'ozur') {
      const f = (B().flowers || []).find((x) => x[0] === d.flower) || ['', '🌷'];
      K.audio.sfx.chime();
      K.fx.rain({ count: 22, shapes: ['heart'], colors: ['#FFB3CB', '#FFFFFF'] });
      K.fx.toast(`${f[1]} <b>${K.esc(from)} özür diledi.</b> <a href="#baris">Gör</a>`, { duration: 10000 });
    }
    if (r.kind === 'ozurcevap') K.fx.toast(d.k === 'kabul' ? `🕊️ <b>${K.esc(from)} özrünü kabul etti.</b>` : `⏳ <b>${K.esc(from)} biraz zamana ihtiyaç duyuyor.</b> Beklemek de sevgidir.`, { duration: 7000 });
    if (r.kind === 'mola' && d.min) K.fx.toast(`⏳ <b>${K.esc(from)} ${d.min} dakikalık mola verdi.</b> Birlikte nefes alın. <a href="#baris">Nefes</a>`, { duration: 9000 });
    if (r.kind === 'isik' && d.on) K.fx.toast(`🕯️ <b>${K.esc(from)} ışığını açık bıraktı.</b> Konuşmasa da burada.`, { duration: 7000 });
    if (r.kind === 'kural') K.fx.toast(`📜 <b>${K.esc(from)} antlaşmaya bir madde ekledi:</b> ${K.esc(d.text)} <a href="#baris">İmzala</a>`, { duration: 9000 });
    if (r.kind === 'barissoz' && cerOpen && cerOpen.draw) cerOpen.draw();
  }

  /* ---------- Bağlantılar ---------- */
  K.on('cloud', async (ok) => {
    if (!ok) return;
    rows = await K.cloud.many(KINDS, { limit: 1500 });
    loaded = true;
    KINDS.forEach((k) =>
      K.cloud.on(k, (r) => {
        if (rows.some((x) => x.id === r.id)) return;
        rows.push(r);
        cache = null;
        incoming(r);
        changed();
        checkPeace(r.who !== mine());
      })
    );
    K.cloud.on('deleted', ({ id }) => {
      if (!rows.some((r) => r.id === id)) return;
      rows = rows.filter((r) => r.id !== id);
      changed();
    });
    changed();
    checkPeace(false);
    setInterval(() => {
      cache = null;
      mood();
    }, 6e4);
  });
  K.on('built', () => setTimeout(mood, 400));
  setInterval(() => K.activeRoom === 'baris' && tick(), 250);

  K.specialHooks = (K.specialHooks || []).concat(() => {
    if (!loaded) return [];
    const out = [];
    const { cur, done } = build();
    const me = mine(), o = other();
    const fresh = done.filter((e) => Date.now() - e.doneAt < 3 * 864e5 && !K.store.get(`barisSeen-${me}-${e.start.id}`));
    if (fresh.length) out.push({ icon: 'kintsugi', title: '🕊️ Barıştınız', text: 'Kırık kalbin çatlağı altınla doluyor. Töreni aç, bu barışa bir söz yaz.', run: () => ceremony(fresh[fresh.length - 1]), cta: 'Töreni aç' });
    const mo = molaNow();
    if (mo) out.push({ icon: 'hourglass', title: `⏳ Mola: ${dur(mo.end - Date.now())} kaldı`, text: `${nameOf(mo.r.who)} başlattı. İkinizin ekranında da aynı nefes.`, room: 'baris', cta: 'Birlikte nefes al' });
    const unread = lettersTo(me).filter((r) => !read(r.id));
    if (unread.length) out.push({ icon: 'letter', title: `💌 ${nameOf(unread[0].who)} sana kalpten bir mektup yazdı`, text: 'Mühürlü bekliyor. Kendini hazır hissettiğinde aç.', room: 'baris', cta: 'Köprüye git' });
    const ap = cur && apologiesTo(me).find((r) => !answerOf(r.id) && r.at >= cur.start.at);
    if (ap) out.push({ icon: 'lily', title: `🌷 ${nameOf(ap.who)} özür diledi`, text: 'Bir çiçek ve birkaç cümle bıraktı.', room: 'baris', cta: 'Gör' });
    if (cur) {
      const so = stateOf(o), sm = stateOf(me);
      if (cur.flag[o] && !cur.flag[me]) out.push({ icon: 'flag', title: `🕊️ ${nameOf(o)} beyaz bayrak kaldırdı`, text: 'Köprünün onun yarısı indi. Seninki indiğinde kalp altınla onarılır.', room: 'baris', cta: 'Köprüye git' });
      else if (so && (so.data.s === 'kirgin' || so.data.s === 'alan')) out.push({ icon: 'cloud', title: K.fill((B().partnerCard || {})[so.data.s] || '').replace('{who}', nameOf(o)), text: B().partnerHint || '', room: 'baris', cta: 'Barış Köprüsü' });
      else if (so && so.data.s === 'hazir') out.push({ icon: 'bridge', title: K.fill((B().partnerCard || {}).hazir || '').replace('{who}', nameOf(o)), text: 'Köprüde seni bekliyor.', room: 'baris', cta: 'Köprüye git' });
      if (sm && (sm.data.s === 'kirgin' || sm.data.s === 'alan')) {
        if (!K.isOwner() && D.kizginMektup) out.push({ icon: 'letter', title: `💌 ${D.kizginMektup.title}`, text: `${C.myPet} bunu tam şu an için yazmıştı.`, run: kizgin, cta: 'Aç' });
        else out.push({ icon: 'heart', title: 'Kendine iyi bak', text: `${B().selfHint || ''} ${K.pick(B().tips || [''])}`, room: 'baris', cta: 'Nefes al' });
      }
      const h = myHour();
      if ((h >= 22 || h < 3) && K.store.get('kusGece-' + me) !== T.todayKey()) out.push({ icon: 'moon', title: '🌙 Küs yatmayalım', text: 'Konuşmaya hazır olmasan da bir "iyi geceler" köprüyü ayakta tutar.', run: () => kusGece(), cta: 'Küs ama iyi geceler' });
    }
    return out.slice(0, 3);
  });

  function kizgin() {
    const km = D.kizginMektup;
    if (!km) return;
    K.ui.modal({
      label: km.title,
      cls: 'br-sheet br-read',
      html: `<div class="br-paper open kizgin"><p class="card-eyebrow">${K.esc(km.title)}</p>${(km.body || []).map((p) => `<p class="hand">${K.esc(K.fill(p))}</p>`).join('')}<p class="br-sign">${K.esc(km.sign || '')}</p></div>`,
    });
    K.audio.sfx.paper();
  }

  K.baris = { active, done: () => build().done, ceremony, flag: raiseFlag, mood, stateOf };

  K.room({
    id: 'baris',
    wing: 'kalp',
    title: 'Barış Köprüsü',
    sub: 'Küsünce de buradayız',
    icon: 'bridge',
    color: '#FFE7C2',
    hidden: () => !D.baris || !K.cloud || !K.cloud.enabled,
    badge: () => {
      if (!loaded) return '';
      const c = active();
      if (lettersTo(mine()).some((r) => !read(r.id))) return 'Mektup';
      if (c && c.flag[other()] && !c.flag[mine()]) return 'Bayrak';
      if (molaNow()) return 'Mola';
      return c ? 'Bulutlu' : '';
    },
    init(el) {
      root = el;
      el.innerHTML = `<div class="room-intro">${K.paras(B().intro || [])}</div>
        <section class="card br-heart" id="brHeart"></section>
        <section class="card br-bridge-card" id="brBridge"></section>
        <section class="card br-state" id="brState"></section>
        <div class="br-acts" id="brActs"></div>
        <div class="br-live" id="brLive"></div>
        <section class="card br-env br-kizgin" id="brKizgin" hidden></section>
        <section class="card br-tip" id="brTip"></section>
        <section class="card br-ant" id="brAnt"></section>
        <section class="card br-def" id="brDef"></section>`;
      el.addEventListener('click', (e) => {
        const st = e.target.closest('[data-st]');
        if (st) return stateSheet(st.dataset.st);
        const b = e.target.closest('[data-br]');
        if (b) {
          const k = b.dataset.br;
          if (k === 'bayrak') return raiseFlag();
          if (k === 'mektup') return letterCompose();
          if (k === 'ozur') return apologyCompose();
          if (k === 'mola') return molaCompose();
          if (k === 'molabit') return molaStop();
          if (k === 'isik') return light();
          if (k === 'gece') return kusGece();
          if (k === 'kizgin') return kizgin();
          if (k === 'tip') {
            K.store.set('brTip', K.store.get('brTip', 0) + 1);
            return render();
          }
        }
        const l = e.target.closest('[data-br-letter]');
        if (l) {
          const r = rows.find((x) => x.id === l.dataset.brLetter);
          return r && letterOpen(r);
        }
        const v = e.target.closest('[data-br-voice]');
        if (v) {
          const r = rows.find((x) => x.id === v.dataset.brVoice);
          return r && playApology(r, v);
        }
        const an = e.target.closest('[data-br-ans]');
        if (an) {
          const r = rows.find((x) => x.id === an.dataset.ref);
          return r && apologyAnswer(r, an.dataset.brAns);
        }
        const sg = e.target.closest('[data-br-sign]');
        if (sg) return signRule(sg.dataset.brSign);
        const un = e.target.closest('[data-br-unrule]');
        if (un) {
          K.cloud.remove(un.dataset.brUnrule);
          rows = rows.filter((r) => r.id !== un.dataset.brUnrule);
          return changed();
        }
        const ri = e.target.closest('[data-rule-idea]');
        if (ri) {
          const f = K.$('.br-rule-add input', el);
          f.value = ri.textContent;
          return f.focus();
        }
      });
      el.addEventListener('submit', (e) => {
        if (!e.target.closest('.br-rule-add')) return;
        e.preventDefault();
        const t = e.target.t.value.trim();
        if (!t) return;
        e.target.reset();
        addRule(t);
      });
    },
    enter() {
      render();
    },
    leave() {
      if (apAudio) {
        try {
          apAudio.pause();
        } catch (e) {}
        apAudio = null;
      }
    },
  });

  // Durum seçimi: kırgınsa ne kadar, alan istiyorsa ne zamana kadar, bir cümle
  function stateSheet(s) {
    if (s === 'iyi' || s === 'hazir') return setState(s);
    const d = stateDef(s);
    let lvl = 3, until = 0;
    const m = K.ui.modal({
      label: d[2],
      cls: 'br-sheet',
      html: `<p class="card-eyebrow">Senin durumun</p><h2>${d[1]} ${K.esc(d[2])}</h2>
        ${s === 'kirgin' ? `<p class="br-lab">Ne kadar?</p><div class="br-lvls">${[1, 2, 3, 4, 5].map((n) => `<button type="button" class="${n === 3 ? 'on' : ''}" data-lvl="${n}">${'☁️'.repeat(n)}</button>`).join('')}</div>` : ''}
        ${s === 'alan' ? `<p class="br-lab">Ne zamana kadar?</p><div class="br-untils">${(B().untils || []).map(([v, l], i) => `<button type="button" class="chip ${i === (B().untils || []).length - 1 ? 'on' : ''}" data-un="${v}">${K.esc(l)}</button>`).join('')}</div>` : ''}
        <label class="br-lab">Bir cümle <small>(isteğe bağlı)</small><input class="input" maxlength="120" placeholder="${s === 'kirgin' ? 'Biraz canım yandı.' : 'Sabah konuşalım, olur mu?'}"></label>
        <button type="button" class="btn red" data-go>${d[1]} Ona göster</button>`,
    });
    m.body.addEventListener('click', (e) => {
      const l = e.target.closest('[data-lvl]');
      if (l) {
        lvl = +l.dataset.lvl;
        K.$$('[data-lvl]', m.body).forEach((x) => x.classList.toggle('on', x === l));
        return;
      }
      const u = e.target.closest('[data-un]');
      if (u) {
        K.$$('[data-un]', m.body).forEach((x) => x.classList.toggle('on', x === u));
        const v = u.dataset.un;
        if (v === 'sabah') {
          const tz = K.isOwner() ? C.tzIstanbul : C.tzBaku;
          const p = T.parts(tz);
          until = Date.UTC(p.y, p.mo - 1, p.d + (p.h >= 9 ? 1 : 0), 9, 0) - tz * 36e5;
        } else until = v ? Date.now() + +v * 6e4 : 0;
        return;
      }
      if (e.target.closest('[data-go]')) {
        const note = K.$('input', m.body).value.trim();
        m.close();
        setState(s, Object.assign(s === 'kirgin' ? { lvl } : {}, until ? { until } : {}, note ? { note } : {}));
      }
    });
  }
})();
