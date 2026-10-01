/* Oda: Kalbin Hava Durumu — iki pencere: solda İstanbul, sağda Bakü. Pencerelerde dışarının değil, içimizin havası.
   Her gün içinin havasını seçersin; onunki yağmurluysa ona şemsiye, fırtınalıysa kalkan, karlıysa sıcak çikolata gönderirsin.
   Paket onun ekranında animasyonla açılır; gönderen Ardoş'sa yanında kasadaki sesi çalar.
   Kayıtlar: hava {day, type, note} · hvcare {to, kind, wx, day} · hvopen {care} */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  const HV = () => D.hava || { intro: [], types: [], care: {}, always: [] };
  const mine = () => (K.isOwner() ? 'me' : 'her');
  const other = () => (K.isOwner() ? 'her' : 'me');
  const nameOf = (w) => (w === 'me' ? C.myPet : C.herPet);
  const EMO = { gunes: '☀️', gokkusagi: '🌈', parcali: '⛅', sis: '🌫️', yagmur: '🌧️', firtina: '⛈️', kar: '❄️' };
  const CARE_EMO = { gozluk: '🕶️', konfeti: '🎉', isin: '✨', cay: '🫖', semsiye: '☂️', kalkan: '🛡️', kakao: '☕', sarilma: '🤗', ara: '📞' };
  const BAD = ['sis', 'yagmur', 'firtina', 'kar'];
  const typeOf = (id) => HV().types.find((t) => t[0] === id);
  const careDef = (kind) => {
    const c = Object.values(HV().care).find((x) => x[0] === kind);
    return c || HV().always.find((x) => x[0] === kind);
  };

  let root, rows = [], loaded = null;

  const days = (n) => {
    const out = [];
    const base = new Date(T.todayKey() + 'T12:00:00');
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date(base.getTime() - i * 864e5);
      out.push(`${d.getFullYear()}-${K.pad(d.getMonth() + 1)}-${K.pad(d.getDate())}`);
    }
    return out;
  };
  const wxOf = (w, day = T.todayKey()) => rows.filter((r) => r.kind === 'hava' && r.who === w && r.data.day === day).sort((a, b) => a.at - b.at).pop();
  const cares = () => rows.filter((r) => r.kind === 'hvcare').sort((a, b) => a.at - b.at);
  const openedIds = () => new Set(rows.filter((r) => r.kind === 'hvopen').map((r) => r.data.care));
  const unopened = () => cares().filter((r) => r.data.to === mine() && !openedIds().has(r.id));
  const sentToday = () => cares().filter((r) => r.who === mine() && r.data.day === T.todayKey());

  /* ---------- Pencere ---------- */
  function scene(type) {
    const drops = (n, cls) => Array.from({ length: n }, (_, i) => `<i style="--x:${(i * 37) % 100}%;--d:${(0.5 + ((i * 7) % 10) / 14).toFixed(2)}s;--l:${((i * 13) % 20) / 10}s"></i>`).join('');
    const parts = {
      gunes: `<span class="hv-sun"></span>`,
      gokkusagi: `<span class="hv-sun small"></span><span class="hv-bow"></span>`,
      parcali: `<span class="hv-sun small"></span><span class="hv-cloud c1"></span><span class="hv-cloud c2"></span>`,
      sis: `<span class="hv-fog f1"></span><span class="hv-fog f2"></span><span class="hv-fog f3"></span>`,
      yagmur: `<span class="hv-cloud c1 grey"></span><span class="hv-cloud c3 grey"></span><span class="hv-rain">${drops(26)}</span>`,
      firtina: `<span class="hv-cloud c1 dark"></span><span class="hv-cloud c3 dark"></span><span class="hv-rain heavy">${drops(40)}</span><span class="hv-flash"></span>`,
      kar: `<span class="hv-snow">${drops(30)}</span>`,
    };
    return parts[type] || '';
  }
  function windowHTML(w) {
    const r = wxOf(w);
    const t = r && typeOf(r.data.type);
    const city = w === 'me' ? 'İstanbul' : 'Bakü';
    const sky = w === 'me' ? A.kizKulesi('hv-tower') : A.qizQalasi('hv-tower');
    const cared = cares().filter((c) => c.data.to === w && c.data.day === T.todayKey());
    const umb = cared.some((c) => c.data.kind === 'semsiye');
    return `<figure class="hv-win ${t ? 'wx-' + t[0] : 'closed'} ${umb ? 'umb' : ''}">
      <div class="hv-glass">${t ? scene(t[0]) : ''}<div class="hv-city">${sky}</div>${umb ? `<span class="hv-umb" aria-label="Şemsiye açık">${umbrella()}</span>` : ''}
        <span class="hv-curtain l"></span><span class="hv-curtain r"></span><span class="hv-bars"></span></div>
      <figcaption><small>${city} · ${K.esc(nameOf(w))}</small>${t ? `<b>${EMO[t[0]]} ${K.esc(t[1])}</b><span>${K.esc(r.data.note || t[2])}</span>` : `<b>Perde kapalı</b><span>${w === mine() ? 'Bugün içinin havası nasıl?' : 'Bugün henüz seçmedi.'}</span>`}
        ${cared.length ? `<em class="hv-got">${cared.map((c) => CARE_EMO[c.data.kind] || '♥').join(' ')} ${K.esc(nameOf(c0(cared).who))} gönderdi</em>` : ''}</figcaption>
    </figure>`;
  }
  const c0 = (arr) => arr[arr.length - 1];
  function umbrella() {
    return `<svg viewBox="0 0 100 100" aria-hidden="true"><path d="M8 48 C12 20 36 8 50 8 C64 8 88 20 92 48 C84 42 76 42 70 48 C64 42 56 42 50 48 C44 42 36 42 30 48 C24 42 16 42 8 48 Z" fill="#FF6FA3" stroke="#2B2024" stroke-width="3" stroke-linejoin="round"/><path d="M30 48 C32 26 42 12 50 8 C58 12 68 26 70 48" fill="none" stroke="#2B2024" stroke-width="2.4"/><path d="M50 8 V82 C50 92 38 92 38 84" fill="none" stroke="#2B2024" stroke-width="3.4" stroke-linecap="round"/><circle cx="50" cy="6" r="3" fill="#2B2024"/></svg>`;
  }

  /* ---------- Çizim ---------- */
  function render() {
    if (!root) return;
    const me = wxOf(mine()), them = wxOf(other());
    const same = me && them && me.data.type === them.data.type;
    K.$('#hvWins', root).innerHTML = `${windowHTML('me')}${windowHTML('her')}`;
    K.$('#hvSame', root).hidden = !same;
    // Seçici
    K.$('#hvPick', root).innerHTML = `<p class="card-eyebrow">Bugün içinin havası${me ? ' · değiştirebilirsin' : ''}</p>
      <div class="hv-types">${HV().types.map(([id, n, d]) => `<button type="button" class="hv-t ${me && me.data.type === id ? 'on' : ''}" data-hv-type="${id}" title="${K.esc(d)}"><span>${EMO[id]}</span><b>${K.esc(n)}</b><small>${K.esc(d)}</small></button>`).join('')}</div>
      <div class="row hv-note"><input class="input" id="hvNote" maxlength="80" placeholder="Tek cümle (isteğe bağlı): neden böyle?" value="${me ? K.esc(me.data.note || '') : ''}"></div>`;
    // Bakım paketi
    const o = other();
    const ot = them && typeOf(them.data.type);
    const sent = sentToday().map((c) => c.data.kind);
    const main = ot && HV().care[ot[0]];
    const btn = ([kind, n]) => `<button type="button" class="hv-care ${sent.includes(kind) ? 'sent' : ''}" data-hv-care="${kind}" ${sent.includes(kind) ? 'disabled' : ''}><span>${CARE_EMO[kind] || '♥'}</span><b>${K.esc(n)}</b>${sent.includes(kind) ? '<small>gönderildi</small>' : ''}</button>`;
    K.$('#hvCare', root).innerHTML = `<p class="card-eyebrow">${K.esc(K.ek(nameOf(o), 'e'))} gönder</p>
      ${ot ? `<p class="hv-lead">${K.esc(K.ek(nameOf(o), 'in'))} içi bugün <b>${EMO[ot[0]]} ${K.esc(ot[1].toLocaleLowerCase('tr'))}</b>.${BAD.includes(ot[0]) ? ' Biraz ilgiye ihtiyacı olabilir.' : ''}</p>` : `<p class="hv-lead muted">${K.esc(nameOf(o))} bugünün havasını henüz seçmedi. Sarılma her havada gönderilebilir.</p>`}
      <div class="hv-cares">${main ? btn(main) : ''}${HV().always.map(btn).join('')}</div>`;
    // Gelen paketler
    const un = unopened();
    K.$('#hvGifts', root).hidden = !un.length;
    K.$('#hvGifts', root).innerHTML = un.length ? `<p class="card-eyebrow">Sana gelenler</p><div class="hv-boxes">${un.map((c) => `<button type="button" class="hv-box" data-hv-open="${c.id}"><span class="hv-ribbon"></span><b>${K.esc(nameOf(c.who))}</b><small>${K.esc(T.fmtShort(new Date(c.at)))}</small></button>`).join('')}</div>` : '';
    // Geçmiş
    const ds = days(14);
    const cell = (w, d) => {
      const r = wxOf(w, d);
      return `<td title="${K.esc(d)}">${r ? EMO[r.data.type] || '' : '<i>·</i>'}</td>`;
    };
    let sameN = 0;
    const allDays = [...new Set(rows.filter((r) => r.kind === 'hava').map((r) => r.data.day))];
    allDays.forEach((d) => {
      const a = wxOf('me', d), b = wxOf('her', d);
      if (a && b && a.data.type === b.data.type) sameN++;
    });
    const got = cares().filter((c) => c.data.to === mine()).length, gave = cares().filter((c) => c.who === mine()).length;
    K.$('#hvHist', root).innerHTML = `<p class="card-eyebrow">Son iki hafta</p><div class="hv-tbl"><table><thead><tr><th></th>${ds.map((d) => `<th class="${d === T.todayKey() ? 'today' : ''}">${+d.slice(8)}</th>`).join('')}</tr></thead>
      <tbody><tr><th>${K.esc(C.myPet)}</th>${ds.map((d) => cell('me', d)).join('')}</tr><tr><th>${K.esc(C.herPet)}</th>${ds.map((d) => cell('her', d)).join('')}</tr>
      <tr class="hv-sameRow"><th></th>${ds.map((d) => {
        const a = wxOf('me', d), b = wxOf('her', d);
        return `<td>${a && b && a.data.type === b.data.type ? '<b>♥</b>' : ''}</td>`;
      }).join('')}</tr></tbody></table></div>
      <p class="muted small">${sameN ? `<b>${sameN}</b> gün ikinizin de içinde aynı hava vardı. ` : ''}Sen ${gave} paket gönderdin, ${got} paket aldın.</p>`;
  }

  /* ---------- Eylemler ---------- */
  async function setType(type) {
    const note = String((K.$('#hvNote', root) || {}).value || '').trim();
    const r = await K.cloud.add('hava', { day: T.todayKey(), type, note });
    if (!r) return K.fx.toast('Kaydedilemedi. İnternet bağlantını kontrol et.');
    if (!rows.some((x) => x.id === r.id)) rows.push(r);
    const t = typeOf(type);
    K.audio.sfx.tap();
    if (BAD.includes(type)) K.ping(`${K.meName()}: içim bugün ${t[1].toLocaleLowerCase('tr')}`, note || t[2], ['cloud_with_rain']);
    if (!BAD.includes(type)) K.ping(`${K.meName()}: içim bugün ${t[1].toLocaleLowerCase('tr')}`, note || t[2], ['sunny']);
    const them = wxOf(other());
    if (them && them.data.type === type) K.fx.toast(`<b>Aynı gökyüzü.</b> ${K.esc(HV().same || '')}`, { icon: A.icon('cloud'), duration: 6000 });
    render();
  }
  async function sendCare(kind) {
    const them = wxOf(other());
    const r = await K.cloud.add('hvcare', { to: other(), kind, wx: them ? them.data.type : '', day: T.todayKey() });
    if (!r) return K.fx.toast('Gönderilemedi. İnternet bağlantını kontrol et.');
    if (!rows.some((x) => x.id === r.id)) rows.push(r);
    const c = careDef(kind);
    K.audio.sfx.whoosh();
    K.fx.toast(`<b>${K.esc(c ? c[1] : 'Paket')} yola çıktı.</b> ${K.esc(nameOf(other()))} kaleye girince açacak.`, { icon: A.icon('cloud') });
    K.stickers.award('hava');
    K.ping(`${K.meName()} sana bir ${c ? c[1].toLocaleLowerCase('tr') : 'paket'} gönderdi`, c ? c[2] : '', ['gift']);
    render();
  }
  function openGift(id) {
    const c = cares().find((x) => x.id === id);
    if (!c) return;
    const def = careDef(c.data.kind) || ['', 'Paket', ''];
    const vmap = HV().voice || {};
    const vid = c.who === 'me' && (vmap[c.data.kind] || vmap[c.data.wx]);
    const isUmb = c.data.kind === 'semsiye';
    const ov = K.el(`<div class="hv-gift ${isUmb ? 'rainy' : ''} k-${c.data.kind}" role="dialog" aria-modal="true" aria-label="${K.esc(def[1])}">
      ${isUmb ? `<div class="hv-grain">${Array.from({ length: 50 }, (_, i) => `<i style="--x:${(i * 29) % 100}%;--d:${(0.45 + ((i * 7) % 10) / 16).toFixed(2)}s;--l:${((i * 11) % 20) / 10}s"></i>`).join('')}</div>` : ''}
      <div class="hv-gcard">
        <div class="hv-gbig">${isUmb ? umbrella() : `<span>${CARE_EMO[c.data.kind] || '♥'}</span>`}</div>
        <p class="card-eyebrow">${K.esc(nameOf(c.who))} gönderdi</p>
        <h2>${K.esc(def[1])}</h2>
        <p class="hand">${K.esc(K.fill(def[2]))}</p>
        ${vid && K.voice.has(vid) ? K.voice.btn(vid, `${C.myPet}'un sesi`) : ''}
        ${c.data.kind === 'ara' ? `<p class="muted small">Müsait olunca ara. O bekliyor.</p>` : ''}
        <button type="button" class="btn red" data-hv-close>Teşekkürler ♥</button>
      </div></div>`);
    document.body.appendChild(ov);
    requestAnimationFrame(() => ov.classList.add('in'));
    K.audio.sfx.chime();
    if (c.data.kind === 'konfeti') K.fx.confetti({ count: 140 });
    else if (!isUmb) K.fx.burst(window.innerWidth / 2, window.innerHeight / 2.4, { count: 22, power: 6 });
    K.vibrate([40, 60, 40]);
    const close = () => {
      ov.classList.remove('in');
      setTimeout(() => ov.remove(), 400);
    };
    ov.addEventListener('click', (e) => {
      if (e.target.closest('[data-hv-close]') || e.target === ov) close();
    });
    K.cloud.add('hvopen', { care: id }).then((r) => {
      if (r && !rows.some((x) => x.id === r.id)) rows.push(r);
      K.ping(`${K.meName()} paketini açtı`, `${def[1]}: açıldı.`, ['white_check_mark']);
      render();
      K.renderSpecials && K.renderSpecials();
    });
  }

  /* ---------- Bulut ---------- */
  const KINDS = ['hava', 'hvcare', 'hvopen'];
  function loadAll() {
    if (!K.cloud || !K.cloud.enabled) return Promise.resolve();
    return (loaded = loaded || (async () => {
      const got = await Promise.all(KINDS.map((k) => K.cloud.list(k, 400)));
      got.flat().forEach((r) => rows.some((x) => x.id === r.id) || rows.push(r));
      if (K.activeRoom === 'hava') render();
      else K.renderSpecials && !K.activeRoom && K.renderSpecials();
    })());
  }
  K.on('cloud', async (on) => {
    if (!on) return;
    const got = await Promise.all(KINDS.map((k) => K.cloud.list(k, 30)));
    got.flat().forEach((r) => rows.some((x) => x.id === r.id) || rows.push(r));
    heroWx();
    KINDS.forEach((k) =>
      K.cloud.on(k, (r) => {
        if (rows.some((x) => x.id === r.id)) return;
        if (k === 'hava') setTimeout(heroWx, 0);
        rows.push(r);
        if (r.who !== mine()) {
          if (k === 'hvcare' && r.data.to === mine()) {
            const c = careDef(r.data.kind);
            K.fx.toast(`<b>${K.esc(nameOf(r.who))} sana bir ${K.esc(c ? c[1].toLocaleLowerCase('tr') : 'paket')} gönderdi.</b> <a href="#hava">Aç</a>`, { icon: A.icon('cloud'), duration: 10000 });
          }
          if (k === 'hava') {
            const t = typeOf(r.data.type);
            if (t && BAD.includes(t[0])) K.fx.toast(`<b>${K.esc(K.ek(nameOf(r.who), 'in'))} içi bugün ${EMO[t[0]]} ${K.esc(t[1].toLocaleLowerCase('tr'))}.</b> <a href="#hava">Yanına git</a>`, { icon: A.icon('cloud'), duration: 9000 });
          }
          if (k === 'hvopen') {
            const c = cares().find((x) => x.id === r.data.care);
            const d = c && careDef(c.data.kind);
            if (d) K.fx.toast(`<b>${K.esc(nameOf(r.who))} ${K.esc(d[1].toLocaleLowerCase('tr'))} paketini açtı.</b>`, { icon: A.icon('heart'), duration: 6000 });
          }
        }
        if (K.activeRoom === 'hava') render();
        else K.renderSpecials && K.renderSpecials();
      })
    );
    K.renderSpecials && !K.activeRoom && K.renderSpecials();
  });

  K.specialHooks = (K.specialHooks || []).concat(() => {
    const un = unopened();
    if (un.length) {
      const c = un[un.length - 1];
      const d = careDef(c.data.kind);
      return [{ icon: 'cloud', title: `${nameOf(c.who)} sana bir ${d ? d[1].toLocaleLowerCase('tr') : 'paket'} gönderdi`, text: un.length > 1 ? `${un.length} paket seni bekliyor.` : 'Kalbin Hava Durumu\'nda seni bekliyor.', room: 'hava', cta: 'Paketi aç' }];
    }
    const them = wxOf(other());
    const t = them && typeOf(them.data.type);
    if (t && BAD.includes(t[0]) && !sentToday().length) return [{ icon: 'cloud', title: `${K.ek(nameOf(other()), 'in')} içi bugün ${t[1].toLocaleLowerCase('tr')}`, text: them.data.note ? `"${them.data.note}"` : t[2], room: 'hava', cta: HV().care[t[0]] ? `${HV().care[t[0]][1]} gönder` : 'Yanına git' }];
    if (t && !wxOf(mine())) return [{ icon: 'cloud', title: `${nameOf(other())} bugün içinin havasını paylaştı: ${EMO[t[0]]}`, text: 'Seninki nasıl? Pencereni aç.', room: 'hava', cta: 'Havamı seç' }];
    return [];
  });
  // Ana salondaki iki kulenin üstünde bugünün iç havası (İstanbul solda, Bakü sağda)
  function heroWx() {
    const towers = K.$$('.hero-scene .scene-tower');
    if (towers.length < 2) return;
    [['me', towers[0]], ['her', towers[towers.length - 1]]].forEach(([w, el]) => {
      const r = wxOf(w);
      let b = K.$('.hero-wx', el);
      if (!r) return b && b.remove();
      const t = typeOf(r.data.type);
      if (!t) return;
      if (!b) {
        b = K.el('<a class="hero-wx" href="#hava"></a>');
        el.appendChild(b);
      }
      b.className = `hero-wx wx-${t[0]}`;
      b.title = `${nameOf(w)}: içi ${t[1].toLocaleLowerCase('tr')}${r.data.note ? ' · ' + r.data.note : ''}`;
      b.setAttribute('aria-label', b.title);
      b.innerHTML = `<span>${EMO[t[0]]}</span>${['yagmur', 'firtina', 'kar'].includes(t[0]) ? `<i class="hw-fall">${'<b></b>'.repeat(7)}</i>` : ''}`;
    });
  }
  K.on('built', () => setTimeout(heroWx, 300));
  K.hava = { today: (w) => wxOf(w), load: loadAll, emo: EMO, careEmo: CARE_EMO, care: careDef, type: typeOf };

  K.room({
    id: 'hava',
    wing: 'kalp',
    title: 'Kalbin Hava Durumu',
    sub: 'İki pencere, iki gökyüzü',
    icon: 'cloud',
    color: '#DDF0FF',
    hidden: () => !D.hava || !K.cloud || !K.cloud.enabled,
    badge: () => (unopened().length ? `${unopened().length} paket` : ''),
    init(el) {
      root = el;
      el.innerHTML = `<div class="room-intro">${K.paras(HV().intro)}</div>
        <div class="hv-wins" id="hvWins"></div>
        <p class="hv-same" id="hvSame" hidden>${K.esc(HV().same || '')}</p>
        <section class="card hv-gifts" id="hvGifts" hidden></section>
        <section class="card" id="hvPick"></section>
        <section class="card" id="hvCare"></section>
        <section class="card hv-hist" id="hvHist"></section>`;
      el.addEventListener('click', (e) => {
        const t = e.target.closest('[data-hv-type]');
        if (t) return setType(t.dataset.hvType);
        const c = e.target.closest('[data-hv-care]');
        if (c && !c.disabled) {
          c.disabled = true;
          return sendCare(c.dataset.hvCare);
        }
        const o = e.target.closest('[data-hv-open]');
        if (o) return openGift(o.dataset.hvOpen);
      });
      el.addEventListener('keydown', (e) => {
        if (e.target.id === 'hvNote' && e.key === 'Enter') {
          const me = wxOf(mine());
          if (me) setType(me.data.type);
        }
      });
    },
    enter() {
      render();
      loadAll();
    },
  });
})();
