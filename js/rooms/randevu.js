/* Oda: Randevu Gecesi — uzaktan randevu için üç şey:
   1) Aşık olmak için 36 soru (üç bölüm; onun cevabı sen de cevaplayınca açılır; sonunda senkron 4 dakika göz göze)
   2) İkimizden Hangisi? (ikiniz de seçersiniz, sonra aynı fikirde miydiniz görürsünüz)
   3) Randevu Çarkı (bu akşamın randevusunu seçer; ikinizin ekranında aynı anda döner)
   Kayıtlar: r36 {i, text, talked} · hangi {i, pick} · cark {pick, day} · canlı: rd {t: q|spin|eyes|eyesoff} */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  const RD = () => D.randevu || { intro: [], s36: [[], [], []], hangi: [], cark: [] };
  const mine = () => (K.isOwner() ? 'me' : 'her');
  const other = () => (K.isOwner() ? 'her' : 'me');
  const nameOf = (w) => (w === 'me' ? C.myPet : C.herPet);
  const Q36 = () => RD().s36.flat();
  const EYES = 4 * 60 * 1000;

  let root, rows = [], loaded = null, tab = K.store.get('rdTab', '36'), qi = K.store.get('rdQ', 0), theirQ = null, spinning = false, eyesT = null;

  const last = (kind, i, w) => rows.filter((r) => r.kind === kind && r.data.i === i && r.who === w).sort((a, b) => a.at - b.at).pop();
  const a36 = (i, w) => last('r36', i, w);
  const hg = (i, w) => last('hangi', i, w);
  const both36 = () => Q36().filter((_, i) => a36(i, 'me') && a36(i, 'her')).length;
  const todayCark = () => rows.filter((r) => r.kind === 'cark' && r.data.day === T.todayKey()).sort((a, b) => a.at - b.at).pop();
  const roomExists = (id) => K.rooms.some((r) => r.id === id);

  /* ---------- 36 Soru ---------- */
  function setOf(i) {
    return i < 12 ? 0 : i < 24 ? 1 : 2;
  }
  function ans(r, w) {
    if (!r) return '';
    return `<div class="rd-ans ${w === mine() ? 'own' : 'other'}"><small>${K.esc(nameOf(w))}</small>${r.data.talked ? '<p class="muted"><em>Aramada konuştuk.</em></p>' : `<p class="hand">${K.esc(r.data.text)}</p>`}</div>`;
  }
  function render36() {
    const qs = Q36();
    qi = K.clamp(qi, 0, qs.length - 1);
    const s = setOf(qi);
    const my = a36(qi, mine()), th = a36(qi, other());
    const sets = RD().sets || ['Bölüm 1', 'Bölüm 2', 'Bölüm 3'];
    const setProg = (k) => {
      let n = 0;
      for (let i = k * 12; i < k * 12 + 12; i++) if (a36(i, 'me') && a36(i, 'her')) n++;
      return n;
    };
    const their = theirQ != null && theirQ !== qi && K.cloud.otherHere() ? `<button type="button" class="chip rd-there" data-rd-go="${theirQ}"><span class="dot on"></span>${K.esc(nameOf(other()))} şu an ${theirQ + 1}. soruda · git</button>` : '';
    let body;
    if (my && th) body = `<div class="rd-pair">${ans(my, mine())}${ans(th, other())}</div>`;
    else if (my) body = `${ans(my, mine())}<p class="muted small">${K.esc(nameOf(other()))} henüz cevaplamadı. Cevaplayınca yan yana görünür.</p>`;
    else
      body = `${th ? `<p class="rd-seal">${A.icon('letter')} ${K.esc(nameOf(other()))} cevapladı; senin cevabınla birlikte açılacak.</p>` : ''}
        <form class="rd-form" autocomplete="off"><textarea class="textarea" name="t" rows="3" maxlength="700" placeholder="Cevabın..."></textarea>
        <div class="row"><button class="btn red small" type="submit">${A.ui('send')} Cevapla</button><button class="btn ghost small" type="button" data-rd-talked>Aramada konuştuk</button></div></form>`;
    const done = both36();
    const allDone = done === qs.length;
    K.$('#rdBody', root).innerHTML = `<p class="muted small">${K.esc(RD().s36intro || '')}</p>
      <div class="seg rd-sets">${sets.map((n, k) => `<button type="button" class="${k === s ? 'on' : ''}" data-rd-set="${k}">${K.esc(n)}<small>${setProg(k)}/12</small></button>`).join('')}</div>
      ${their}
      <article class="rd-q card">
        <p class="rd-num">Soru ${qi + 1} <span>/ ${qs.length}</span></p>
        <h3>${K.esc(K.fill(qs[qi]))}</h3>
        ${body}
        <div class="rd-nav"><button type="button" class="btn ghost small" data-rd-q="${qi - 1}" ${qi ? '' : 'disabled'}>${A.ui('back')} Önceki</button><span class="rd-dots">${Array.from({ length: 12 }, (_, j) => {
          const i = s * 12 + j;
          const st = a36(i, 'me') && a36(i, 'her') ? 'd' : a36(i, mine()) ? 'm' : a36(i, other()) ? 't' : '';
          return `<button type="button" class="${st} ${i === qi ? 'cur' : ''}" data-rd-q="${i}" aria-label="Soru ${i + 1}"></button>`;
        }).join('')}</span><button type="button" class="btn ghost small" data-rd-q="${qi + 1}" ${qi < qs.length - 1 ? '' : 'disabled'}>Sonraki ${A.ui('next')}</button></div>
      </article>
      <section class="card rd-eyes-card ${allDone ? 'ready' : ''}"><p class="card-eyebrow">Son adım · 4 dakika</p><p>${K.esc(RD().s36end || '')}</p>
        <p class="muted small">${allDone ? '36 sorunun hepsi bitti. Sıra gözlerde.' : `${done}/36 soru ikinizce cevaplandı. Dört dakikayı istediğin zaman da deneyebilirsiniz.`}</p>
        <button type="button" class="btn red" data-rd-eyes>${A.icon('candle')} Dört dakikayı birlikte başlat</button></section>`;
  }
  async function save36(text, talked) {
    const r = await K.cloud.add('r36', { i: qi, text: talked ? '' : text, talked: Boolean(talked) });
    if (!r) return K.fx.toast('Kaydedilemedi. İnternet bağlantını kontrol et.');
    if (!rows.some((x) => x.id === r.id)) rows.push(r);
    K.audio.sfx.pop();
    if (a36(qi, other())) {
      K.audio.sfx.chime();
      K.fx.burst(window.innerWidth / 2, window.innerHeight / 2, { count: 12 });
    }
    if (!K.isOwner() && !talked) K.notify(`${C.herName} 36 Soru'da cevap verdi`, `${qi + 1}. ${Q36()[qi]} → ${text.slice(0, 140)}`, ['candle']);
    render();
  }
  function goQ(i) {
    qi = K.clamp(i, 0, Q36().length - 1);
    K.store.set('rdQ', qi);
    if (K.cloud.enabled) K.cloud.send('rd', { t: 'q', i: qi });
    render();
  }

  /* ---------- Dört dakika ---------- */
  function eyes(startAt) {
    if (document.querySelector('.rd-eyes')) return;
    const ov = K.el(`<div class="rd-eyes" role="dialog" aria-modal="true" aria-label="Dört dakika">
      <div class="rd-flames">${A.icon('candle')}</div>
      <p class="rd-eyes-t" id="rdEyesT">4:00</p>
      <p class="rd-eyes-s">Konuşmadan. Sadece bak.</p>
      <button type="button" class="btn ghost small" data-rd-eyes-x>Bitir</button></div>`);
    document.body.appendChild(ov);
    requestAnimationFrame(() => ov.classList.add('in'));
    if (K.audio.music.on) K.audio.music.stop(false);
    const tEl = K.$('#rdEyesT', ov);
    const end = startAt + EYES;
    const tick = () => {
      const now = Date.now();
      if (now < startAt) {
        tEl.textContent = String(Math.ceil((startAt - now) / 1000));
        ov.classList.add('wait');
        return;
      }
      ov.classList.remove('wait');
      const left = Math.max(0, end - now);
      const s = Math.ceil(left / 1000);
      tEl.textContent = `${Math.floor(s / 60)}:${K.pad(s % 60)}`;
      if (left <= 0) finish(true);
    };
    const finish = (full) => {
      clearInterval(eyesT);
      eyesT = null;
      ov.classList.remove('in');
      setTimeout(() => ov.remove(), 500);
      if (full) {
        K.audio.sfx.success();
        K.fx.confetti({ count: 120 });
        K.stickers.award('randevu');
        K.fx.toast('<b>Dört dakika bitti.</b> Şimdi söyle: ne gördün?', { icon: A.icon('candle'), duration: 9000 });
      }
    };
    clearInterval(eyesT);
    eyesT = setInterval(tick, 250);
    tick();
    ov.addEventListener('click', (e) => {
      if (e.target.closest('[data-rd-eyes-x]')) {
        if (K.cloud.enabled) K.cloud.send('rd', { t: 'eyesoff' });
        finish(Date.now() > end - 5000);
      }
    });
    ov._finish = finish;
  }

  /* ---------- İkimizden Hangisi? ---------- */
  function renderHangi() {
    const qs = RD().hangi;
    const nextI = qs.findIndex((_, i) => !hg(i, mine()));
    const pairs = qs.map((q, i) => ({ q, i, a: hg(i, mine()), b: hg(i, other()) })).filter((x) => x.a && x.b);
    const same = pairs.filter((x) => x.a.data.pick === x.b.data.pick).length;
    const waiting = qs.filter((_, i) => hg(i, mine()) && !hg(i, other())).length;
    const pickBtn = (w) => `<button type="button" class="rd-who ${w}" data-rd-pick="${w}"><span class="rd-av">${K.esc(nameOf(w).slice(0, 1))}</span><b>${K.esc(nameOf(w))}</b></button>`;
    K.$('#rdBody', root).innerHTML = `<section class="card rd-hq">
        ${nextI >= 0 ? `<p class="rd-num">${nextI + 1} <span>/ ${qs.length}</span></p><h3>${K.esc(qs[nextI])}</h3><div class="rd-whos">${pickBtn('me')}${pickBtn('her')}</div>` : `<p class="rd-num">Bitti</p><h3>Hepsini cevapladın.</h3><p class="muted">${waiting ? `${K.esc(nameOf(other()))} ${waiting} soruyu henüz cevaplamadı.` : 'İkiniz de bitirdiniz.'}</p>`}
        <p class="rd-score">${pairs.length ? `<b>${same}</b> / ${pairs.length} soruda aynı fikirdesiniz${same === pairs.length && pairs.length > 4 ? '. Tek beyin!' : ''}` : 'İkiniz de cevapladıkça sonuçlar burada açılır.'}</p>
      </section>
      ${pairs.length ? `<section class="card"><p class="card-eyebrow">Sonuçlar</p><ul class="rd-res">${pairs
        .slice()
        .reverse()
        .map((x) => {
          const ok = x.a.data.pick === x.b.data.pick;
          return `<li class="${ok ? 'ok' : 'no'}"><span>${K.esc(x.q)}</span><b>${ok ? `İkiniz de: ${K.esc(nameOf(x.a.data.pick))}` : `Sen: ${K.esc(nameOf(x.a.data.pick))} · O: ${K.esc(nameOf(x.b.data.pick))}`}</b></li>`;
        })
        .join('')}</ul></section>` : ''}`;
  }
  async function pick(w) {
    const qs = RD().hangi;
    const i = qs.findIndex((_, j) => !hg(j, mine()));
    if (i < 0) return;
    const r = await K.cloud.add('hangi', { i, pick: w });
    if (!r) return K.fx.toast('Kaydedilemedi. İnternet bağlantını kontrol et.');
    if (!rows.some((x) => x.id === r.id)) rows.push(r);
    const th = hg(i, other());
    if (th) {
      const ok = th.data.pick === w;
      if (ok) K.audio.sfx.success();
      else K.audio.sfx.giggle ? K.audio.sfx.giggle() : K.audio.sfx.pop();
      K.fx.toast(ok ? `<b>Aynı fikirdesiniz:</b> ${K.esc(nameOf(w))}!` : `<b>Farklı düşünüyorsunuz.</b> ${K.esc(nameOf(other()))} ${th.data.pick === other() ? 'kendini' : 'seni'} seçti. Tartışın!`, { icon: A.icon('candle'), duration: 5000 });
    } else K.audio.sfx.tap();
    render();
  }

  /* ---------- Randevu Çarkı ---------- */
  const PAL = ['#FFD0E1', '#FFF1C9', '#DDF0FF', '#E9D9FF', '#D8F5E8', '#FFE3D6'];
  function wheel() {
    const items = RD().cark;
    const n = items.length;
    const R = 140;
    const seg = (360 / n) * (Math.PI / 180);
    const slices = items
      .map(([id, name], k) => {
        const a0 = k * seg - Math.PI / 2, a1 = (k + 1) * seg - Math.PI / 2;
        const x0 = R * Math.cos(a0), y0 = R * Math.sin(a0), x1 = R * Math.cos(a1), y1 = R * Math.sin(a1);
        const mid = (a0 + a1) / 2;
        const tx = 88 * Math.cos(mid), ty = 88 * Math.sin(mid);
        const rot = (mid * 180) / Math.PI;
        return `<path d="M0 0 L${x0.toFixed(1)} ${y0.toFixed(1)} A${R} ${R} 0 0 1 ${x1.toFixed(1)} ${y1.toFixed(1)} Z" fill="${PAL[k % PAL.length]}" stroke="#2B2024" stroke-width="2"/><text x="${tx.toFixed(1)}" y="${ty.toFixed(1)}" transform="rotate(${rot.toFixed(1)} ${tx.toFixed(1)} ${ty.toFixed(1)})" text-anchor="middle" dominant-baseline="middle">${K.esc(name)}</text>`;
      })
      .join('');
    return `<svg viewBox="-150 -150 300 300" class="rd-wheel" aria-hidden="true"><g class="rd-spin" id="rdSpin">${slices}</g><circle r="18" fill="#E3174D" stroke="#2B2024" stroke-width="3"/><path d="M-4 -4 L0 -8 L4 -4" fill="none"/></svg>`;
  }
  function renderCark() {
    const t = todayCark();
    const it = t && RD().cark.find((c) => c[0] === t.data.pick);
    K.$('#rdBody', root).innerHTML = `<section class="card rd-cark">
      <div class="rd-wheel-wrap"><span class="rd-pin" aria-hidden="true"></span>${wheel()}</div>
      <div class="rd-cark-side">${it ? resultHTML(it, t) : `<p class="card-eyebrow">Bu akşam ne yapsak?</p><p>Çark dönsün, randevuyu o seçsin. ${K.cloud.otherHere() ? `${K.esc(nameOf(other()))} da kalede; ikinizin ekranında aynı anda döner.` : ''}</p>`}
        <button type="button" class="btn red" data-rd-spin>${A.ui('refresh')} ${it ? 'Yeniden çevir' : 'Çarkı çevir'}</button></div></section>`;
    if (it) {
      const k = RD().cark.indexOf(it);
      const g = K.$('#rdSpin', root);
      g.style.transition = 'none';
      g.style.transform = `rotate(${-(k + 0.5) * (360 / RD().cark.length)}deg)`;
    }
  }
  function resultHTML(it, t) {
    const target = it[0] === 'randevu' ? '' : roomExists(it[0]) ? it[0] : '';
    return `<p class="card-eyebrow">Bu akşamın randevusu${t ? ` · ${K.esc(nameOf(t.who))} çevirdi` : ''}</p><h3 class="rd-pick">${K.esc(it[1])}</h3><p>${K.esc(it[2])}</p>${target ? `<a class="btn soft small" href="#${target}">${K.esc(it[1])} odasına git ${A.ui('next')}</a>` : it[0] === 'randevu' ? `<button type="button" class="btn soft small" data-rd-tab="36">36 Soru'ya geç</button>` : ''}`;
  }
  function spinTo(k, then) {
    const n = RD().cark.length;
    const g = K.$('#rdSpin', root);
    if (!g) return then && then();
    spinning = true;
    const cur = parseFloat((g.style.transform.match(/-?[\d.]+/) || [0])[0]) || 0;
    const target = -(k + 0.5) * (360 / n);
    let end = target - 360 * 5;
    while (end > cur - 360 * 4) end -= 360;
    g.style.transition = 'none';
    g.style.transform = `rotate(${cur}deg)`;
    g.getBoundingClientRect();
    g.style.transition = 'transform 4.2s cubic-bezier(.17,.67,.21,1)';
    g.style.transform = `rotate(${end}deg)`;
    K.audio.sfx.whoosh();
    let ticks = 0;
    const tk = setInterval(() => {
      if (++ticks > 16) return clearInterval(tk);
      K.audio.sfx.tick && K.audio.sfx.tick();
    }, 150 + ticks * 12);
    setTimeout(() => {
      spinning = false;
      g.style.transition = 'none';
      g.style.transform = `rotate(${target}deg)`;
      then && then();
    }, 4300);
  }
  async function spin() {
    if (spinning) return;
    const items = RD().cark;
    const prev = todayCark();
    let k = Math.floor(Math.random() * items.length);
    if (prev && items[k][0] === prev.data.pick) k = (k + 1 + Math.floor(Math.random() * (items.length - 1))) % items.length;
    if (K.cloud.enabled) K.cloud.send('rd', { t: 'spin', k });
    spinTo(k, async () => {
      const r = await K.cloud.add('cark', { pick: items[k][0], day: T.todayKey() });
      if (r && !rows.some((x) => x.id === r.id)) rows.push(r);
      K.audio.sfx.success();
      K.fx.burst(window.innerWidth / 2, window.innerHeight / 2.5, { count: 18 });
      if (!K.isOwner()) K.notify(`${C.herName} randevu çarkını çevirdi`, `Bu akşam: ${items[k][1]}`, ['candle']);
      if (tab === 'cark') render();
    });
  }

  /* ---------- Genel ---------- */
  function render() {
    if (!root) return;
    K.$$('[data-rd-tab]', K.$('#rdTabs', root)).forEach((b) => b.classList.toggle('on', b.dataset.rdTab === tab));
    if (tab === 'hangi') renderHangi();
    else if (tab === 'cark') renderCark();
    else render36();
  }
  function onLive(m) {
    if (!m || m.who === mine()) return;
    if (m.t === 'q') {
      theirQ = m.i;
      if (K.activeRoom === 'randevu' && tab === '36') render36();
    }
    if (m.t === 'spin' && K.activeRoom === 'randevu') {
      if (tab !== 'cark') {
        tab = 'cark';
        render();
      }
      K.fx.toast(`<b>${K.esc(nameOf(other()))} çarkı çeviriyor...</b>`, { icon: A.icon('candle'), duration: 3000 });
      spinTo(m.k, () => {
        const it = RD().cark[m.k];
        if (it) K.$('.rd-cark-side', root).innerHTML = `${resultHTML(it, { who: other() })}<button type="button" class="btn red" data-rd-spin>${A.ui('refresh')} Yeniden çevir</button>`;
      });
    }
    if (m.t === 'eyes') eyes(m.at);
    if (m.t === 'eyesoff') {
      const ov = document.querySelector('.rd-eyes');
      if (ov && ov._finish) ov._finish(false);
      K.fx.toast(`${K.esc(nameOf(other()))} dört dakikayı bitirdi.`);
    }
  }

  const KINDS = ['r36', 'hangi', 'cark'];
  function loadAll() {
    if (!K.cloud || !K.cloud.enabled) return Promise.resolve();
    return (loaded = loaded || (async () => {
      const got = await Promise.all(KINDS.map((k) => K.cloud.list(k, 400)));
      got.flat().forEach((r) => rows.some((x) => x.id === r.id) || rows.push(r));
      if (K.activeRoom === 'randevu' && !spinning) render();
    })());
  }
  K.on('cloud', async (on) => {
    if (!on) return;
    K.cloud.onLive('rd', onLive);
    const recent = await K.cloud.list('cark', 3);
    recent.forEach((r) => rows.some((x) => x.id === r.id) || rows.push(r));
    KINDS.forEach((k) =>
      K.cloud.on(k, (r) => {
        if (rows.some((x) => x.id === r.id)) return;
        rows.push(r);
        if (r.who !== mine()) {
          if (k === 'r36' && K.activeRoom !== 'randevu') K.fx.toast(`<b>${K.esc(nameOf(r.who))} 36 Soru'da ${r.data.i + 1}. soruyu cevapladı.</b> <a href="#randevu">Randevu Gecesi</a>`, { icon: A.icon('candle'), duration: 7000 });
          if (k === 'cark' && K.activeRoom !== 'randevu') {
            const it = RD().cark.find((c) => c[0] === r.data.pick);
            if (it) K.fx.toast(`<b>Bu akşamın randevusu: ${K.esc(it[1])}.</b> ${K.esc(nameOf(r.who))} çarkı çevirdi.`, { icon: A.icon('candle'), duration: 9000 });
          }
        }
        if (K.activeRoom === 'randevu' && !spinning) render();
        else if (K.activeRoom !== 'randevu') K.renderSpecials && K.renderSpecials();
      })
    );
  });
  K.specialHooks = (K.specialHooks || []).concat(() => {
    const t = todayCark();
    const it = t && RD().cark.find((c) => c[0] === t.data.pick);
    return it && t.who === other() ? [{ icon: 'candle', title: `Bu akşamın randevusu: ${it[1]}`, text: `${nameOf(t.who)} çarkı çevirdi. ${it[2]}`, room: roomExists(it[0]) ? it[0] : 'randevu', cta: 'Hadi' }] : [];
  });
  K.randevu = { both36, hangiScore: () => {
    const qs = RD().hangi;
    const pairs = qs.map((_, i) => [hg(i, 'me'), hg(i, 'her')]).filter(([a, b]) => a && b);
    return { n: pairs.length, same: pairs.filter(([a, b]) => a.data.pick === b.data.pick).length };
  }, load: loadAll };

  K.room({
    id: 'randevu',
    wing: 'oyun',
    title: 'Randevu Gecesi',
    sub: '36 soru, İkimizden Hangisi?, randevu çarkı',
    icon: 'candle',
    color: '#FFE0D1',
    hidden: () => !D.randevu || !K.cloud || !K.cloud.enabled,
    badge: () => {
      const t = todayCark();
      return t ? 'Bu akşam randevu var' : '';
    },
    init(el) {
      root = el;
      el.innerHTML = `<div class="room-intro">${K.paras(RD().intro)}</div>
        <div class="seg rd-tabs" id="rdTabs" role="tablist"><button type="button" data-rd-tab="36">36 Soru</button><button type="button" data-rd-tab="hangi">İkimizden Hangisi?</button><button type="button" data-rd-tab="cark">Randevu Çarkı</button></div>
        <div id="rdBody"></div>`;
      el.addEventListener('click', (e) => {
        const tb = e.target.closest('[data-rd-tab]');
        if (tb) {
          tab = tb.dataset.rdTab;
          K.store.set('rdTab', tab);
          return render();
        }
        const st = e.target.closest('[data-rd-set]');
        if (st) {
          const k = +st.dataset.rdSet;
          const first = Array.from({ length: 12 }, (_, j) => k * 12 + j).find((i) => !a36(i, mine()));
          return goQ(first != null ? first : k * 12);
        }
        const q = e.target.closest('[data-rd-q]');
        if (q && !q.disabled) return goQ(+q.dataset.rdQ);
        const go = e.target.closest('[data-rd-go]');
        if (go) return goQ(+go.dataset.rdGo);
        if (e.target.closest('[data-rd-talked]')) return save36('', true);
        if (e.target.closest('[data-rd-eyes]')) {
          const at = Date.now() + 5000;
          if (K.cloud.enabled) K.cloud.send('rd', { t: 'eyes', at });
          return eyes(at);
        }
        const p = e.target.closest('[data-rd-pick]');
        if (p) {
          K.$$('[data-rd-pick]', root).forEach((b) => (b.disabled = true));
          return pick(p.dataset.rdPick);
        }
        if (e.target.closest('[data-rd-spin]')) return spin();
      });
      el.addEventListener('submit', (e) => {
        if (!e.target.closest('.rd-form')) return;
        e.preventDefault();
        const text = String(e.target.t.value || '').trim();
        if (!text) return e.target.t.focus();
        K.$$('button', e.target).forEach((b) => (b.disabled = true));
        save36(text, false);
      });
    },
    enter() {
      render();
      loadAll();
      if (K.cloud.enabled && tab === '36') K.cloud.send('rd', { t: 'q', i: qi });
    },
    leave() {
      theirQ = null;
    },
  });
})();
