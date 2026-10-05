/* Kale 2.0 — Pamuk, ortak kedimiz. Bir sabah kalenin kapısında, iki kulenin ortasında bulunan yavru bir kedi; ikimizin.
   Sahiplenilir, adı birlikte konur (biri önerir, öbürü onaylar). Beslenir (İstanbul'dan hamsi, Bakü'den kütüm), parmakla
   okşanır (mırlar), yumakla oynanır. Tokluk, neşe ve iki ayrı sevgi çubuğu var: ikinizin de sevgisini ister; biri uzun süre
   gelmezse kapısının önünde onu bekler. Bakü saatiyle gece uyur (o saatlerde acıkmaz). Küsünce köprüde beyaz bayrakla
   oturur. Yaşı büyüdükçe büyür (yavru → minik → genç → kraliçe); ikinizin de baktığı günler biriktikçe numara öğrenir.
   Kayıtlar: kedisahip {} · kediad {name} · kedionay {ref} · mama {f} · sev {n} · oyna {n} · canlı: kedi {t} */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  const KD = () => D.kedi || { intro: [], stages: [[0, 'Yavru', '']], foods: { me: [], her: [] }, moods: {}, tricks: [] };
  const mine = () => (K.isOwner() ? 'me' : 'her');
  const other = () => (K.isOwner() ? 'her' : 'me');
  const nameOf = (w) => (w === 'me' ? C.myPet : C.herPet);
  const on = () => Boolean(K.cloud && K.cloud.enabled);
  const KINDS = ['kedisahip', 'kediad', 'kedionay', 'mama', 'sev', 'oyna', 'kedikart'];
  const ping = (title, msg, tags, extra) => K.ping && K.ping(title, msg, tags, Object.assign({ click: K.roomUrl('kedi') }, extra || {}));

  let rows = [], loaded = false, root = null;
  const of = (k) => rows.filter((r) => r.kind === k).sort((a, b) => a.at - b.at);
  // Bulut kaydı hem dönüşte hem dinleyicide gelebilir; bir kez say
  const push = (r) => r && !rows.some((x) => x.id === r.id) && rows.push(r);
  const adoption = () => of('kedisahip')[0] || null;
  const dayOf = (at) => T.key(T.baku(new Date(at)));
  function name() {
    const ok = of('kedionay').pop();
    const r = ok && rows.find((x) => x.id === ok.data.ref);
    return r ? r.data.name : '';
  }
  const shown = () => name() || KD().defaultName || 'Pamuk';
  const pending = () => {
    const ok = of('kedionay').pop();
    return of('kediad').filter((r) => !ok || r.at > ok.at).pop() || null;
  };

  /* ---------- Hâl: tokluk, neşe, iki sevgi (Bakü gecesi 00–08 arası azalmaz) ---------- */
  function awakeH(t0, t1) {
    if (t1 <= t0) return 0;
    let h = (t1 - t0) / 36e5;
    for (let d = T.at(dayOf(t0)).getTime() - 864e5; d < t1; d += 864e5) {
      const a = Math.max(t0, d), b = Math.min(t1, d + 8 * 36e5);
      if (b > a) h -= (b - a) / 36e5;
    }
    return Math.max(0, h);
  }
  function level(list, gain, decay, start) {
    const ad = adoption();
    if (!ad) return 0;
    let v = start, t = ad.at;
    list.forEach((r) => {
      if (r.at < ad.at) return;
      v = Math.max(0, v - decay * awakeH(t, r.at));
      v = Math.min(100, v + gain(r));
      t = r.at;
    });
    return Math.round(Math.max(0, v - decay * awakeH(t, Date.now())));
  }
  const food = () => level(of('mama'), (r) => (r.data.f === 'odul' ? 18 : 35), 4, 70);
  const fun = () => level(of('oyna').concat(of('mama').filter((r) => r.data.f === 'odul')).sort((a, b) => a.at - b.at), (r) => (r.kind === 'mama' ? 12 : Math.min(45, 8 + r.data.n * 6)), 4, 55);
  const love = (w) => level(of('sev').filter((r) => r.who === w), (r) => Math.min(42, 8 + r.data.n * 1.4), 3, 60);
  function careDays() {
    const by = {};
    ['mama', 'sev', 'oyna'].forEach((k) => of(k).forEach((r) => ((by[dayOf(r.at)] = by[dayOf(r.at)] || {})[r.who] = true)));
    return Object.values(by).filter((x) => x.me && x.her).length;
  }
  const ageDays = () => (adoption() ? Math.max(0, T.daysSince(dayOf(adoption().at))) : 0);
  function stage() {
    const st = KD().stages || [[0, 'Yavru', '']];
    let i = 0;
    st.forEach((s, k) => ageDays() >= s[0] && (i = k));
    return { i, name: st[i][1], text: st[i][2] };
  }
  const tricks = () => (KD().tricks || []).filter((t) => careDays() >= t[0]);
  const has = (emo) => tricks().some((t) => t[1] === emo);
  const sleeping = () => T.baku().h < 8;
  function mood() {
    if (K.baris && K.baris.active()) return { k: 'kus' };
    if (sleeping()) return { k: 'uyku' };
    if (food() < 25) return { k: 'ac' };
    const lm = love('me'), lh = love('her');
    if (Math.min(lm, lh) < 22) return { k: 'ozlem', who: lm < lh ? 'me' : 'her' };
    if (fun() < 22) return { k: 'sikilmis' };
    return { k: 'mutlu' };
  }
  function moodLine(m) {
    const list = (KD().moods || {})[m.k] || [''];
    return K.fill(list[(T.dayNumber(T.now()) + new Date().getHours()) % list.length]).replace('{who}', m.who ? nameOf(m.who) : '');
  }

  /* ---------- Çizim ---------- */
  function eyes(k) {
    if (k === 'uyku') return '<path d="M78 98 Q88 105 98 98 M122 98 Q132 105 142 98" fill="none" stroke="#2B2024" stroke-width="3.4" stroke-linecap="round"/>';
    if (k === 'mutlu') return '<path d="M78 100 Q88 88 98 100 M122 100 Q132 88 142 100" fill="none" stroke="#2B2024" stroke-width="3.6" stroke-linecap="round"/>';
    if (k === 'sev') return `<g fill="#E3174D">${A.heartPath(88, 99, 0.62, '#E3174D')}${A.heartPath(132, 99, 0.62, '#E3174D')}</g>`;
    const sad = k === 'kus' || k === 'ozlem' || k === 'ac';
    return `<g class="kd-blink"><ellipse cx="88" cy="97" rx="7.5" ry="${sad ? 8 : 9.5}" fill="#2B2024"/><ellipse cx="132" cy="97" rx="7.5" ry="${sad ? 8 : 9.5}" fill="#2B2024"/><circle cx="90.5" cy="93" r="2.8" fill="#fff"/><circle cx="134.5" cy="93" r="2.8" fill="#fff"/></g>
      ${sad ? '<path d="M76 84 L96 89 M144 84 L124 89" stroke="#4A2138" stroke-width="3" stroke-linecap="round"/>' : ''}${k === 'kus' ? '<path d="M80 108 C78 114 82 118 85 114 C86 111 83 109 80 108 Z" fill="#8FD3FF"/>' : ''}`;
  }
  function kitten(m, opt = {}) {
    const st = stage().i;
    const k = opt.face || m.k;
    const fur = '#FFF9F2', ink = '#4A2138';
    return `<svg class="kd-svg st-${st} m-${m.k}" viewBox="0 0 220 230" aria-hidden="true">
      <ellipse cx="110" cy="214" rx="70" ry="10" fill="rgba(74,33,56,.12)"/>
      <g class="kd-tail"><path d="M150 186 C196 184 206 140 190 116 C182 104 170 110 174 120 C184 140 176 168 148 170" fill="${fur}" stroke="${ink}" stroke-width="3.4" stroke-linejoin="round"/>${has('💞') && (k === 'mutlu' || k === 'sev') ? `<g class="kd-theart">${A.heartPath(194, 104, 0.9, '#FF6FA3')}</g>` : ''}</g>
      <g class="kd-body"><path d="M58 186 C50 146 70 122 110 122 C150 122 170 146 162 186 C160 204 60 204 58 186 Z" fill="${fur}" stroke="${ink}" stroke-width="3.4"/>
        <path d="M92 132 C98 150 122 150 128 132" fill="none" stroke="#F1DCCB" stroke-width="6" stroke-linecap="round"/>
        <g class="kd-paw l"><ellipse cx="88" cy="200" rx="17" ry="11" fill="${fur}" stroke="${ink}" stroke-width="3.2"/><path d="M82 204 v-5 M88 205 v-6 M94 204 v-5" stroke="${ink}" stroke-width="2" stroke-linecap="round"/></g>
        <g class="kd-paw r"><ellipse cx="132" cy="200" rx="17" ry="11" fill="${fur}" stroke="${ink}" stroke-width="3.2"/><path d="M126 204 v-5 M132 205 v-6 M138 204 v-5" stroke="${ink}" stroke-width="2" stroke-linecap="round"/></g></g>
      <g class="kd-head">
        <path class="kd-ear l" d="M58 82 L52 30 L94 58 Z" fill="${fur}" stroke="${ink}" stroke-width="3.4" stroke-linejoin="round"/><path d="M64 72 L61 44 L84 59 Z" fill="#FFC2D6"/>
        <path class="kd-ear r" d="M162 82 L168 30 L126 58 Z" fill="${fur}" stroke="${ink}" stroke-width="3.4" stroke-linejoin="round"/><path d="M156 72 L159 44 L136 59 Z" fill="#FFC2D6"/>
        <ellipse cx="110" cy="94" rx="60" ry="48" fill="${fur}" stroke="${ink}" stroke-width="3.4"/>
        <path transform="translate(78 64) scale(.95)" d="M0 7 C-11 -1 -11 -12 -4.5 -12 C-1.5 -12 0 -9.5 0 -8 C0 -9.5 1.5 -12 4.5 -12 C11 -12 11 -1 0 7 Z" fill="#F4B183"/>
        ${eyes(k)}
        <ellipse cx="72" cy="114" rx="10" ry="5.5" fill="#FFB3CB" opacity=".75"/><ellipse cx="148" cy="114" rx="10" ry="5.5" fill="#FFB3CB" opacity=".75"/>
        <path d="M105 108 L115 108 L110 114 Z" fill="#FF8FB8" stroke="${ink}" stroke-width="2" stroke-linejoin="round"/>
        <path d="M110 114 Q104 121 98 117 M110 114 Q116 121 122 117" fill="none" stroke="${ink}" stroke-width="2.6" stroke-linecap="round"/>
        ${k === 'ac' ? '<ellipse cx="110" cy="124" rx="5" ry="4" fill="#FF8FB8" stroke="#4A2138" stroke-width="2"/>' : ''}
        <path d="M66 106 L36 100 M66 114 L36 118 M154 106 L184 100 M154 114 L184 118" stroke="${ink}" stroke-width="2.2" stroke-linecap="round"/>
        ${has('🎀') ? `<g transform="translate(150 48) rotate(16) scale(.34)">${A.bowShape('#E3174D', ink)}</g>` : ''}
        ${has('👑') || st >= 3 ? `<path d="M90 44 L94 24 L104 36 L110 18 L116 36 L126 24 L130 44 Z" fill="#FFD34E" stroke="${ink}" stroke-width="3" stroke-linejoin="round"/>` : ''}
      </g>
      <path d="M70 134 Q110 150 150 134" fill="none" stroke="#FF6FA3" stroke-width="7" stroke-linecap="round"/><circle cx="110" cy="146" r="7" fill="#FFD34E" stroke="${ink}" stroke-width="2.6"/>
      ${k === 'kus' ? `<g class="kd-wflag"><path d="M150 196 V136" stroke="${ink}" stroke-width="3" stroke-linecap="round"/><path d="M150 138 C160 132 166 142 178 136 V154 C168 160 160 150 150 156 Z" fill="#fff" stroke="${ink}" stroke-width="2.4" stroke-linejoin="round"/></g>` : ''}
      ${k === 'uyku' ? '<g class="kd-z"><text x="166" y="58">z</text><text x="180" y="40">z</text><text x="196" y="22">Z</text></g>' : ''}
    </svg>`;
  }
  const box = () => `<svg class="kd-box" viewBox="0 0 220 200" aria-hidden="true"><path d="M30 96 L110 120 L190 96 L190 176 L110 196 L30 176 Z" fill="#E8B98A" stroke="#4A2138" stroke-width="3.4" stroke-linejoin="round"/><path d="M110 120 V196" stroke="#4A2138" stroke-width="3"/><path d="M30 96 L10 70 L92 92 Z M190 96 L210 70 L128 92 Z" fill="#F2CFA6" stroke="#4A2138" stroke-width="3" stroke-linejoin="round"/>
    <g class="kd-peek"><path d="M70 100 L66 70 L90 88 Z M150 100 L154 70 L130 88 Z" fill="#FFF9F2" stroke="#4A2138" stroke-width="3" stroke-linejoin="round"/><path d="M68 104 C68 82 152 82 152 104" fill="#FFF9F2" stroke="#4A2138" stroke-width="3"/><circle cx="94" cy="96" r="6" fill="#2B2024"/><circle cx="126" cy="96" r="6" fill="#2B2024"/><circle cx="96" cy="93.5" r="2" fill="#fff"/><circle cx="128" cy="93.5" r="2" fill="#fff"/></g>
    <text x="110" y="166" text-anchor="middle" font-size="20" fill="#4A2138" font-family="var(--font-hand)">Beni sahiplenir misin?</text></svg>`;
  const bar = (label, v, cls) => `<div class="kd-bar ${cls || ''} ${v < 25 ? 'low' : ''}"><span>${label}</span><i><b style="width:${v}%"></b></i><small>${v}</small></div>`;

  /* ---------- Oda ---------- */
  let mode = '', petN = 0, petT = 0, playN = 0, playT = 0, lastLive = 0, trickT = 0;
  /* ---------- Kedimizin Dünyası: her gün hayal haritamızdan bir kartpostal, bakım günleriyle açılan oyuncaklar ---------- */
  const KW = () => D.kedidunya || { cards: [], toys: [] };
  const FALLBACK = [{ ref: 'f1', name: 'Kız Kulesi', place: 'İstanbul', emoji: '🗼' }, { ref: 'f2', name: 'Qız Qalası', place: 'Bakü', emoji: '🏰' }, { ref: 'f3', name: 'Hazar kıyısı', place: 'Bakü', emoji: '🌊' }];
  function postcard(day) {
    const pl = (K.harita && K.harita.places && K.harita.places().length ? K.harita.places() : FALLBACK);
    const p = pl[K.hash(day + 'yer') % pl.length];
    const cards = KW().cards || [''];
    const yer = p.place ? `${p.name}, ${p.place.split(',')[0]}` : p.name;
    const n = p.name;
    const text = String(cards[K.hash(day + 'kart') % cards.length] || '')
      .replace(/\{yer\}'den/g, K.ek(n, 'den'))
      .replace(/\{yer\}'deyim/g, K.ek(n, 'de') + 'yim')
      .replace(/\{yer\}'de/g, K.ek(n, 'de'))
      .replace(/\{yer\}'e/g, K.ek(n, 'e'))
      .replace(/\{yer\}/g, yer);
    return { day, p, yer, text: K.fill(text) };
  }
  const toys = () => (KW().toys || []).filter((t) => careDays() >= t[0]);
  const album = () => of('kedikart').filter((r, i, a) => a.findIndex((x) => x.data.day === r.data.day) === i);
  async function keepCard() {
    const day = T.todayKey();
    if (!adoption() || of('kedikart').some((r) => r.data.day === day)) return;
    const c = postcard(day);
    rows.push({ id: 'tmp-kk', kind: 'kedikart', data: { day, yer: c.yer, emoji: c.p.emoji }, at: Date.now(), who: mine() });
    const r = await K.cloud.add('kedikart', { day, yer: c.yer, emoji: c.p.emoji });
    rows = rows.filter((x) => x.id !== 'tmp-kk');
    push(r);
    K.stickers.award('kedikart');
  }
  function world() {
    const el = root && K.$('#kdWorld', root);
    if (!el || !adoption()) return;
    const c = postcard(T.todayKey());
    const al = album();
    const cd = careDays();
    el.innerHTML = `<p class="card-eyebrow">🌍 ${K.esc(K.ek(shown(), 'in'))} dünyası</p>
      <div class="kd-post"><div class="kd-post-img" aria-hidden="true"><span>${c.p.emoji}</span><i class="kd-post-cat">🐈</i><b class="kd-stamp">${K.esc(c.p.emoji)}</b></div>
        <div class="kd-post-txt"><small>${K.esc(T.fmt(T.todayKey()))} · ${K.esc(c.yer)}</small><p class="hand">${K.esc(c.text)}</p><span class="kd-sign">🐾 ${K.esc(shown())}</span></div></div>
      <p class="muted small">Her gün hayal haritanızdaki bir yerden kartpostal yollar. Albüm: <b>${al.length}</b> kart</p>
      ${al.length > 1 ? `<div class="kd-album">${al.slice(-14).reverse().map((r) => `<span title="${K.esc(r.data.yer)} · ${K.esc(T.fmtShort(r.data.day))}">${K.esc(r.data.emoji || '📍')}<small>${K.esc(T.fmtShort(r.data.day))}</small></span>`).join('')}</div>` : ''}
      <p class="card-eyebrow">🧸 Oyuncakları</p>
      <ul class="kd-toys">${(KW().toys || []).map(([d, id, e, l]) => `<li class="${cd >= d ? 'on' : ''}"><span>${cd >= d ? e : '🔒'}</span><small>${K.esc(l)}${cd >= d ? '' : ` · ${d} gün`}</small></li>`).join('')}</ul>`;
  }

  function render() {
    if (!root || K.activeRoom !== 'kedi') return;
    const ad = adoption();
    const stg = K.$('#kdStage', root);
    K.$$('.kd-after', root).forEach((x) => (x.hidden = !ad));
    if (!ad) {
      stg.innerHTML = `<div class="kd-scene door"><div class="kd-gate" aria-hidden="true">${A.kizKulesi()}${A.qizQalasi()}</div>${box()}</div>
        <p class="kd-say">${K.esc(KD().found || '')}</p>${K.isOwner() ? `<p class="kd-secret">🤫 Bu kutuyu ${K.esc(C.herPet)} bulsun. Bulduğunda sana haber gelecek.</p>` : `<button type="button" class="btn red" data-kd="sahip">${A.icon('paw')} ${K.esc(KD().adopt || 'Sahiplen')}</button>`}`;
      return;
    }
    const m = mood();
    const s = stage();
    const p = pending();
    const nm = name();
    if (K.$('#roomTitle')) K.$('#roomTitle').textContent = shown();
    K.$('#kdName', root).hidden = Boolean(nm && !p);
    stg.innerHTML = `<div class="kd-scene ${m.k} ${mode}">
        <div class="kd-window" aria-hidden="true"><span class="kd-sky ${sleeping() ? 'night' : ''}"></span></div>
        <div class="kd-cushion" aria-hidden="true"></div>
        <button type="button" class="kd-bowl ${food() > 70 ? 'full' : food() > 30 ? 'half' : ''}" data-kd="besle" aria-label="Mama kabı"><span></span></button>
        <div class="kd-cat" id="kdCat" role="img" aria-label="${K.esc(shown())}: ${K.esc(moodLine(m))}">${kitten(m)}</div>
        <span class="kd-yarn" id="kdYarn" aria-hidden="true"></span>
        <div class="kd-fx" id="kdFx" aria-hidden="true"></div>
        ${toys().map(([, id, e]) => `<span class="kd-toy t-${id}" aria-hidden="true">${e}</span>`).join('')}
      </div>
      <div class="kd-tag"><b>${K.esc(shown())}</b>${nm ? '' : ' <small>(adı henüz konmadı)</small>'}<span>${K.esc(s.name)} · ${ageDays() + 1}. gün</span></div>
      <p class="kd-say">${K.esc(moodLine(m))}</p>
      ${m.k === 'kus' ? '<a class="btn soft small" href="#baris">🕊️ Barış Köprüsü</a>' : ''}`;
    K.$('#kdBars', root).innerHTML = `${bar('🍽️ Tokluk', food())}${bar('🧶 Neşe', fun())}${bar(`💗 ${K.esc(nameOf('me'))}`, love('me'), 'me')}${bar(`💗 ${K.esc(nameOf('her'))}`, love('her'), 'her')}`;
    const foods = (KD().foods || {})[mine()] || [];
    K.$('#kdActs', root).innerHTML = `<button type="button" class="kd-act ${mode === 'besle' ? 'on' : ''}" data-kd="besle"><span>🍽️</span><b>Besle</b></button>
      <button type="button" class="kd-act ${mode === 'sev' ? 'on' : ''}" data-kd="sev"><span>🤲</span><b>Sev</b></button>
      <button type="button" class="kd-act ${mode === 'oyna' ? 'on' : ''}" data-kd="oyna" ${sleeping() ? 'disabled' : ''}><span>🧶</span><b>${sleeping() ? 'Uyuyor' : 'Oyna'}</b></button>
      <div class="kd-foods" ${mode === 'besle' ? '' : 'hidden'}>${foods.map(([id, e, l]) => `<button type="button" data-food="${id}"><span>${e}</span><small>${K.esc(l)}</small></button>`).join('')}</div>
      <p class="kd-hint">${mode === 'sev' ? 'Parmağını kedinin üstünde gezdir; mırlamaya başlar.' : mode === 'oyna' ? 'Odada bir yere dokun; yumak oraya yuvarlanır, o da peşinden atlar.' : sleeping() ? 'Uyuyor. Usulca sevebilirsin.' : 'Bir şey seç ya da doğrudan sev.'}</p>`;
    // Ad
    if (!nm || p) {
      const mineP = p && p.who === mine();
      K.$('#kdName', root).innerHTML = `<p class="card-eyebrow">Adını birlikte koyun</p>
        ${p && !mineP ? `<p class="kd-prop"><b>${K.esc(nameOf(p.who))}</b> onun adını <b class="hand">"${K.esc(p.data.name)}"</b> koymak istiyor.</p><div class="row"><button type="button" class="btn red small" data-kd-ok="${p.id}">Evet, ${K.esc(p.data.name)} olsun</button></div><p class="muted small">Ya da başka bir ad öner:</p>` : ''}
        ${mineP ? `<p class="kd-prop">"${K.esc(p.data.name)}" önerdin. ${K.esc(nameOf(other()))} onaylayınca adı bu olacak.</p>` : ''}
        <form class="kd-nameform" autocomplete="off"><input class="input" name="n" maxlength="20" placeholder="Bir ad yaz..."><button class="btn soft small" type="submit">Öner</button></form>
        <div class="br-chips">${(KD().names || []).map((x) => `<button type="button" class="chip" data-kd-nm="${K.esc(x)}">${K.esc(x)}</button>`).join('')}</div>`;
    }
    // Numaralar
    const cd = careDays();
    K.$('#kdTricks', root).innerHTML = `<p class="card-eyebrow">Numaraları · ${cd} birlikte bakım günü</p><p class="muted small">${K.esc(KD().tricksIntro || '')}</p>
      <ul class="kd-tricks">${(KD().tricks || []).map(([d, e, t, x]) => `<li class="${cd >= d ? 'on' : ''}"><span>${cd >= d ? e : '🔒'}</span><div><b>${K.esc(t)}</b><small>${cd >= d ? K.esc(x) : `${d} günde`}</small></div>${cd >= d && ['🐾', '🌀', '🤸', '🗼'].includes(e) ? `<button type="button" class="btn ghost small" data-trick="${e}">Göster</button>` : ''}</li>`).join('')}</ul>`;
    // Günlük
    const FD = Object.fromEntries([...((KD().foods || {}).me || []), ...((KD().foods || {}).her || [])].map((f) => [f[0], f]));
    const log = rows.filter((r) => ['mama', 'sev', 'oyna', 'kedisahip', 'kedionay'].includes(r.kind)).sort((a, b) => b.at - a.at).slice(0, 12);
    K.$('#kdLog', root).innerHTML = `<p class="card-eyebrow">${K.esc(shown())}'un günlüğü</p><ul class="kd-log">${log.map((r) => {
      const who = nameOf(r.who);
      const t = r.kind === 'mama' ? `${(FD[r.data.f] || ['', '🍽️'])[1]} ${who} besledi${FD[r.data.f] ? `: ${FD[r.data.f][2].toLocaleLowerCase('tr')}` : ''}` : r.kind === 'sev' ? `🤲 ${who} sevdi (${r.data.n} okşama)` : r.kind === 'oyna' ? `🧶 ${who} oynadı (${r.data.n} yakalama)` : r.kind === 'kedisahip' ? `🐾 ${who} onu kapıda buldu ve sahiplendi` : `🎀 Adı kondu: ${name()}`;
      return `<li><span>${K.esc(t)}</span><small>${K.esc(K.ago(r.at))}</small></li>`;
    }).join('')}</ul>`;
    world();
  }
  const scene = () => root && K.$('.kd-scene', root);
  function hearts(x, y, emo, n = 1) {
    const fx = root && K.$('#kdFx', root);
    if (!fx) return;
    for (let i = 0; i < n; i++) {
      const el = K.el(`<i style="left:${x + (Math.random() * 30 - 15)}px;top:${y}px;--dx:${Math.random() * 40 - 20}px">${emo}</i>`);
      fx.appendChild(el);
      setTimeout(() => el.remove(), 1600);
    }
  }
  function face(k, ms) {
    const cat = root && K.$('#kdCat', root);
    if (!cat) return;
    cat.innerHTML = kitten(mood(), { face: k });
    clearTimeout(face.t);
    face.t = setTimeout(() => (cat.innerHTML = kitten(mood())), ms);
  }

  /* ---------- Eylemler ---------- */
  async function adopt() {
    if (!on()) return K.fx.toast('Bulut kapalı; Pamuk için bulut gerekiyor.');
    if (adoption()) return render();
    if (K.isOwner()) return K.fx.toast(`Bu kutuyu ${K.esc(C.herPet)} bulsun.`, { duration: 3000 });
    const r = await K.cloud.add('kedisahip', {});
    if (!r) return K.fx.toast('Olmadı. İnternet bağlantını kontrol et.');
    push(r);
    K.audio.sfx.meow(1.3);
    K.fx.confetti({ count: 90, shapes: ['heart', 'spark'] });
    K.stickers.award('kedi');
    K.fx.toast(`🐾 <b>Artık ikinizin bir kedisi var.</b> Şimdi adını birlikte koyun.`, { duration: 5000 });
    ping(`🐾 ${K.meName()} kalenin kapısında bir yavru kedi buldu`, 'Sahiplendi. Şimdi adını birlikte koyacaksınız.', ['cat'], { priority: 5 });
    render();
  }
  async function feed(f) {
    if (food() >= 95) {
      K.fx.toast('Karnı tıka basa tok. Biraz sonra.', { duration: 2500 });
      return face('mutlu', 1500);
    }
    const r = await K.cloud.add('mama', { f });
    if (!r) return K.fx.toast('Olmadı. İnterneti kontrol et.');
    push(r);
    mode = '';
    K.cloud.send('kedi', { t: 'mama', f });
    K.audio.sfx.pop();
    render();
    const sc = scene();
    sc && sc.classList.add('eating');
    setTimeout(() => {
      const s2 = scene();
      s2 && s2.classList.remove('eating');
      K.audio.sfx.meow(1.2);
      face('mutlu', 2500);
    }, 2600);
  }
  async function commitPet() {
    if (petN < 3) return (petN = 0);
    const n = petN;
    petN = 0;
    const r = await K.cloud.add('sev', { n });
    push(r);
    render();
  }
  async function commitPlay() {
    if (!playN) return;
    const n = playN;
    playN = 0;
    const r = await K.cloud.add('oyna', { n });
    push(r);
    render();
  }
  function stroke(x, y) {
    petN++;
    clearTimeout(petT);
    petT = setTimeout(commitPet, 1600);
    const sc = scene();
    sc && sc.classList.add('purr');
    clearTimeout(stroke.t);
    stroke.t = setTimeout(() => {
      const s2 = scene();
      s2 && s2.classList.remove('purr');
    }, 900);
    if (petN % 3 === 0) hearts(x, y, '💗');
    if (petN % 8 === 1) K.audio.sfx.purr(1.4);
    if (petN === 6) face(sleeping() ? 'uyku' : 'sev', 2600);
    if (Date.now() - lastLive > 1200) {
      lastLive = Date.now();
      K.cloud.send('kedi', { t: 'sev' });
    }
  }
  function throwYarn(x, y) {
    const sc = scene(), cat = K.$('#kdCat', root), yarn = K.$('#kdYarn', root);
    if (!sc || !cat || !yarn) return;
    const w = sc.clientWidth;
    yarn.classList.add('on');
    yarn.style.left = `${x - 14}px`;
    yarn.style.top = `${Math.max(40, y - 14)}px`;
    const dx = K.clamp(x - w / 2, -w / 2 + 70, w / 2 - 70);
    cat.style.setProperty('--x', `${dx}px`);
    cat.classList.remove('pounce');
    void cat.offsetWidth;
    cat.classList.add('pounce');
    playN++;
    clearTimeout(playT);
    playT = setTimeout(commitPlay, 4000);
    setTimeout(() => hearts(x, y - 20, '✨'), 450);
    if (playN % 4 === 0) K.audio.sfx.meow(1.5);
    if (Date.now() - lastLive > 1200) {
      lastLive = Date.now();
      K.cloud.send('kedi', { t: 'oyna' });
    }
  }
  function trick(e) {
    const cat = root && K.$('#kdCat', root);
    if (!cat) return;
    const cls = { '🐾': 't-pati', '🌀': 't-don', '🤸': 't-takla', '🗼': 't-kule' }[e];
    cat.classList.remove('t-pati', 't-don', 't-takla', 't-kule');
    void cat.offsetWidth;
    cat.classList.add(cls);
    clearTimeout(trickT);
    trickT = setTimeout(() => cat.classList.remove(cls), 1600);
    K.audio.sfx.sparkle();
    K.$('#kdStage', root).scrollIntoView({ behavior: K.reduced ? 'auto' : 'smooth', block: 'center' });
  }
  async function propose(n) {
    n = String(n || '').trim().slice(0, 20);
    if (!n) return;
    const r = await K.cloud.add('kediad', { name: n });
    if (!r) return K.fx.toast('Olmadı.');
    push(r);
    K.audio.sfx.chime();
    K.fx.toast(`🎀 "${K.esc(n)}" önerildi. ${K.esc(nameOf(other()))} onaylayınca adı bu olacak.`, { duration: 3500 });
    ping(`🎀 ${K.meName()} kedimize bir ad önerdi: ${n}`, 'Beğenirsen onayla; beğenmezsen başka bir ad öner.', ['cat']);
    render();
  }
  async function approve(id) {
    const r = await K.cloud.add('kedionay', { ref: id });
    if (!r) return K.fx.toast('Olmadı.');
    push(r);
    K.audio.sfx.success();
    K.fx.confetti({ count: 80, shapes: ['heart'] });
    K.fx.toast(`🎀 <b>Adı artık ${K.esc(name())}!</b>`, { duration: 4000 });
    ping(`🎀 Kedimizin adı artık ${name()}`, `${K.meName()} onayladı.`, ['cat']);
    render();
  }

  /* ---------- Karşıdan ---------- */
  function liveIn(m) {
    if (m.who === mine() || K.activeRoom !== 'kedi') return;
    const sc = scene();
    if (!sc) return;
    const w = sc.clientWidth;
    if (m.t === 'sev') {
      hearts(w / 2 + (Math.random() * 60 - 30), 70, '💗', 2);
      sc.classList.add('purr');
      setTimeout(() => sc.classList.remove('purr'), 1200);
    }
    if (m.t === 'oyna') hearts(w / 2, 60, '🧶');
    if (m.t === 'mama') hearts(60, 140, '🍽️');
    const n = K.$('.kd-live', root);
    if (n) {
      n.textContent = `${nameOf(m.who)} şu an ${m.t === 'sev' ? 'onu seviyor' : m.t === 'oyna' ? 'onunla oynuyor' : 'onu besledi'}`;
      n.classList.add('on');
      clearTimeout(liveIn.t);
      liveIn.t = setTimeout(() => n.classList.remove('on'), 2500);
    }
  }
  function incoming(r) {
    if (r.who === mine()) return;
    const who = K.esc(nameOf(r.who));
    if (r.kind === 'kedisahip') K.fx.toast(`🐾 <b>${who} kalenin kapısında bir yavru kedi buldu.</b> Artık ikinizin. <a href="#kedi">Tanış</a>`, { duration: 10000 });
    if (r.kind === 'kediad') K.fx.toast(`🎀 <b>${who} kedimize "${K.esc(r.data.name)}" adını önerdi.</b> <a href="#kedi">Bak</a>`, { duration: 9000 });
    if (r.kind === 'kedionay') K.fx.toast(`🎀 <b>Kedimizin adı artık ${K.esc(name())}.</b>`, { duration: 6000 });
    if (r.kind === 'mama' && K.activeRoom !== 'kedi') K.fx.toast(`🍽️ ${who} ${K.esc(K.ek(shown(), 'i'))} besledi.`, { duration: 3000, log: false });
  }

  /* ---------- Ana salon: kulelerin arasında küçük kedi ---------- */
  function heroCat() {
    const sc = K.$('.hero-scene');
    if (!sc) return;
    let el = K.$('.hero-kedi', sc);
    if (!loaded || !on()) return el && el.remove();
    if (!el) {
      el = K.el('<a class="hero-kedi" href="#kedi"></a>');
      sc.appendChild(el);
    }
    const ad = adoption();
    const m = ad ? mood() : null;
    const bubble = !ad ? '❔' : { ac: '🍽️', uyku: '💤', ozlem: '🥺', kus: '🕊️', sikilmis: '🧶', mutlu: '💗' }[m.k];
    el.innerHTML = `${ad ? kitten(m) : box()}<span class="hk-bub">${bubble}</span>`;
    el.classList.toggle('boxed', !ad);
    el.setAttribute('aria-label', ad ? `${shown()}: ${moodLine(m)}` : 'Kalenin kapısında bir kutu var');
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
        incoming(r);
        render();
        heroCat();
        K.renderSpecials && !K.activeRoom && K.renderSpecials();
      })
    );
    K.cloud.onLive('kedi', liveIn);
    heroCat();
    K.renderSpecials && !K.activeRoom && K.renderSpecials();
  });
  K.on('built', () => setTimeout(heroCat, 600));
  setInterval(() => {
    heroCat();
    if (K.activeRoom === 'kedi' && !mode && !petN && !playN) render();
  }, 60000);

  K.specialHooks = (K.specialHooks || []).concat(() => {
    if (!loaded || !on() || !D.kedi) return [];
    const ad = adoption();
    if (!ad && K.isOwner()) return [];
    if (!ad) return [{ icon: 'paw', title: '🐾 Kalenin kapısında bir kutu var', text: 'İçinden iki minik kulak görünüyor. Biri seni bekliyor.', room: 'kedi', cta: 'Kapıya bak' }];
    const p = pending();
    if (p && p.who !== mine()) return [{ icon: 'paw', title: `🎀 ${nameOf(p.who)} kedimize "${p.data.name}" adını önerdi`, text: 'Beğenirsen onayla, beğenmezsen başka bir ad öner.', room: 'kedi', cta: 'Bak' }];
    const m = mood();
    if (m.k === 'ac') return [{ icon: 'paw', title: `🍽️ ${shown()} acıktı`, text: 'Mama kabının başında oturmuş, kapıya bakıyor.', room: 'kedi', cta: 'Besle' }];
    if (love(mine()) < 22) return [{ icon: 'paw', title: `🥺 ${shown()} seni özledi`, text: 'Bir süredir onu sevmedin. Kokunu arıyor.', room: 'kedi', cta: 'Sev' }];
    return [];
  });
  K.kedi = { name: shown, mood: () => (adoption() ? mood().k : ''), adopted: () => Boolean(adoption()), postcard, album: () => album().length };

  K.room({
    id: 'kedi',
    wing: 'kalp',
    title: () => (loaded && adoption() ? shown() : 'Kapıdaki Kedi'),
    sub: 'Ortak kedimiz',
    icon: 'paw',
    color: '#FFEFD9',
    hidden: () => !D.kedi || !K.cloud || !K.cloud.enabled,
    badge: () => {
      if (!loaded) return '';
      if (!adoption()) return 'Kapıda biri var';
      const m = mood().k;
      return m === 'ac' ? 'Acıktı' : m === 'ozlem' ? 'Özledi' : '';
    },
    init(el) {
      root = el;
      el.innerHTML = `<div class="room-intro">${K.paras(KD().intro || [])}</div>
        <section class="card kd-stage" id="kdStage"></section>
        <p class="kd-live" aria-live="polite"></p>
        <div class="kd-bars kd-after" id="kdBars"></div>
        <div class="kd-acts kd-after" id="kdActs"></div>
        <section class="card kd-name kd-after" id="kdName" hidden></section>
        <section class="card kd-after kd-world" id="kdWorld"></section>
        <section class="card kd-after" id="kdTricks"></section>
        <section class="card kd-after" id="kdLog"></section>`;
      el.addEventListener('click', (e) => {
        const b = e.target.closest('[data-kd]');
        if (b) {
          const k = b.dataset.kd;
          if (k === 'sahip') return adopt();
          if (sleeping() && k === 'oyna') return;
          mode = mode === k ? '' : k;
          render();
          return;
        }
        const f = e.target.closest('[data-food]');
        if (f) return feed(f.dataset.food);
        const t = e.target.closest('[data-trick]');
        if (t) return trick(t.dataset.trick);
        const ok = e.target.closest('[data-kd-ok]');
        if (ok) return approve(ok.dataset.kdOk);
        const nm = e.target.closest('[data-kd-nm]');
        if (nm) return propose(nm.dataset.kdNm);
        // Oyun: sahnede bir yere dokun
        const sc = e.target.closest('.kd-scene');
        if (sc && mode === 'oyna' && !sleeping()) {
          const r = sc.getBoundingClientRect();
          throwYarn(e.clientX - r.left, e.clientY - r.top);
        }
      });
      el.addEventListener('submit', (e) => {
        if (!e.target.closest('.kd-nameform')) return;
        e.preventDefault();
        propose(e.target.n.value);
        e.target.reset();
      });
      // Okşama: parmak ya da fare kedinin üstünde gezerken
      let last = null;
      el.addEventListener('pointerdown', (e) => {
        if (!e.target.closest('#kdCat') || mode === 'oyna') return;
        last = { x: e.clientX, y: e.clientY, d: 0 };
        try {
          e.target.closest('#kdCat').setPointerCapture(e.pointerId);
        } catch (err) {}
      });
      el.addEventListener('pointermove', (e) => {
        if (!last) return;
        last.d += Math.hypot(e.clientX - last.x, e.clientY - last.y);
        last.x = e.clientX;
        last.y = e.clientY;
        if (last.d > 28) {
          last.d = 0;
          const r = scene() && scene().getBoundingClientRect();
          if (r) stroke(e.clientX - r.left, e.clientY - r.top - 20);
        }
      });
      const up = () => (last = null);
      el.addEventListener('pointerup', up);
      el.addEventListener('pointercancel', up);
    },
    enter() {
      mode = '';
      render();
      if (loaded) keepCard().then(world);
    },
    leave() {
      commitPet();
      commitPlay();
    },
  });
})();
