/* Oda: Pamuk Saklambaç — biri Pamuk'u kalenin bir odasına, bir köşeye saklar; öbürü odaları gezer. Ekranın kenarı
   "soğuk, ılık, sıcak, kaynar" diye renk değiştirir: doğru kanatta ılık, doğru odada sıcak, Pamuk'un saklandığı yere
   yaklaştıkça kaynar. Doğru yere dokununca Pamuk "miyav" diye fırlar. Saklayan, arayanın hangi odada olduğunu canlı
   görür ve ipucu (🔥 ❄️ 🐾) gönderebilir. Kayıtlar: saklambac {gid, room, x, y}, saklambacbuldu {gid, ms, tries} */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;

  const mine = () => (K.isOwner() ? 'me' : 'her');
  const other = () => (K.isOwner() ? 'her' : 'me');
  const nameOf = (w) => (w === 'me' ? C.myPet : C.herPet);
  const catName = () => (K.kedi && K.kedi.adopted() ? K.kedi.name() : 'Pamuk');
  const SKIP = ['saklambac', 'panel', 'panelek', 'son', 'kopus', 'hediye-kutusu'];
  let games = [], found = [], loaded = false, root = null, hiding = false, glow = null, tries = 0, t0 = 0;
  const roomOf = (id) => K.rooms.find((r) => r.id === id);
  const wingOf = (id) => (roomOf(id) ? K.val(roomOf(id).wing) : '');
  // Arayana düşen aktif oyun: öbürünün sakladığı, henüz bulunmamış
  const active = () => games.filter((g) => g.who === other() && !found.some((f) => f.data.gid === g.data.gid)).pop() || null;
  const myActive = () => games.filter((g) => g.who === mine() && !found.some((f) => f.data.gid === g.data.gid)).pop() || null;
  const catSvg = (cls = '') => `<svg class="sk-pamuk ${cls}" viewBox="0 0 64 56" aria-hidden="true"><path d="M8 52 C4 30 14 18 32 18 C50 18 60 30 56 52 Z" fill="#fff" stroke="#c9b6ff" stroke-width="2.5"/><path d="M14 24 L12 6 L26 16 Z M50 24 L52 6 L38 16 Z" fill="#fff" stroke="#c9b6ff" stroke-width="2.5" stroke-linejoin="round"/><circle cx="24" cy="32" r="3" fill="#4a2138"/><circle cx="40" cy="32" r="3" fill="#4a2138"/><path d="M30 38 h4 l-2 2.5 z" fill="#ff8fb8"/><path d="M20 38 h-9 M20 41 h-8 M44 38 h9 M44 41 h8" stroke="#c9b6ff" stroke-width="1.5"/></svg>`;

  /* ---------- Saklama ---------- */
  function startHide() {
    hiding = true;
    K.go('');
    banner(`🐱 ${K.ek(catName(), 'i')} saklamak için bir odaya gir ve bir yere dokun.`, true);
  }
  function banner(html, cancel) {
    let b = K.$('#skBanner');
    if (!b) {
      b = K.el('<div class="sk-banner" id="skBanner" role="status"></div>');
      document.body.appendChild(b);
    }
    b.innerHTML = `<span>${html}</span>${cancel ? '<button type="button" class="btn ghost small" data-sk-iptal>Vazgeç</button>' : ''}`;
    b.hidden = false;
    const x = K.$('[data-sk-iptal]', b);
    x && x.addEventListener('click', () => ((hiding = false), (b.hidden = true)));
  }
  const pos = (e, el) => {
    const r = el.getBoundingClientRect();
    return { x: K.clamp((e.clientX - r.left) / r.width, 0, 1), y: Math.max(0, e.clientY - r.top) };
  };
  document.addEventListener(
    'click',
    async (e) => {
      if (!K.activeRoom || SKIP.includes(K.activeRoom)) return;
      const el = K.$(`.room[data-room="${K.activeRoom}"]`);
      if (!el || !el.contains(e.target)) return;
      if (hiding) {
        e.preventDefault();
        e.stopPropagation();
        hiding = false;
        const p = pos(e, el);
        const g = await K.cloud.add('saklambac', { gid: 'g' + Date.now().toString(36), room: K.activeRoom, x: +p.x.toFixed(3), y: Math.round(p.y) });
        if (!g) return K.fx.toast('Saklanamadı.');
        games.push(g);
        const mark = K.el(`<span class="sk-iz" style="left:${e.clientX}px;top:${e.clientY}px">${catSvg()}</span>`);
        document.body.appendChild(mark);
        setTimeout(() => mark.remove(), 1400);
        K.audio.sfx.meow ? K.audio.sfx.meow() : K.audio.sfx.pop();
        banner(`🤫 ${catName()} saklandı: <b>${K.esc(K.val(roomOf(g.data.room).title))}</b>. ${K.esc(nameOf(other()))} aramaya başlayınca canlı görürsün.`);
        setTimeout(() => (K.$('#skBanner').hidden = true), 4500);
        K.ping(`🐱 ${catName()} saklandı!`, `${K.meName()} onu kalede bir yere sakladı. Ekranın kenarı sıcak-soğuk söyleyecek.`, ['cat'], { click: K.roomUrl('saklambac') });
        return;
      }
      const g = active();
      if (!g || K.activeRoom !== g.data.room) {
        g && (tries++, paintGlow());
        return;
      }
      const p = pos(e, el);
      const dx = (p.x - g.data.x) * el.getBoundingClientRect().width, dy = p.y - g.data.y;
      tries++;
      if (Math.hypot(dx, dy) < 95) {
        e.preventDefault();
        e.stopPropagation();
        foundIt(g, e.clientX, e.clientY);
      } else paintGlow();
    },
    true
  );
  async function foundIt(g, x, y) {
    const ms = t0 ? Date.now() - t0 : 0;
    const pop = K.el(`<span class="sk-bulundu" style="left:${x}px;top:${y}px">${catSvg('zipla')}<b>Miyav!</b></span>`);
    document.body.appendChild(pop);
    setTimeout(() => pop.remove(), 2200);
    K.audio.sfx.meow ? K.audio.sfx.meow() : K.audio.sfx.success();
    K.fx.confetti({ count: 90, y });
    const f = await K.cloud.add('saklambacbuldu', { gid: g.data.gid, ms, tries });
    f && found.push(f);
    tries = 0;
    t0 = 0;
    paintGlow();
    K.stickers.award('saklambac');
    K.ping(`🐱 ${K.meName()} ${K.ek(catName(), 'i')} buldu!`, `${K.val(roomOf(g.data.room).title)} odasında, ${ms ? Math.max(1, Math.round(ms / 60000)) + ' dakikada' : ''}. Sıra onda: o saklasın.`, ['cat'], { click: K.roomUrl('saklambac') });
  }
  /* ---------- Sıcak / soğuk ---------- */
  function heat() {
    const g = active();
    if (!g) return '';
    if (!K.activeRoom) return 'soguk';
    if (K.activeRoom !== g.data.room) return wingOf(K.activeRoom) === wingOf(g.data.room) ? 'ilik' : 'soguk';
    const el = K.$(`.room[data-room="${K.activeRoom}"]`);
    if (!el) return 'sicak';
    const r = el.getBoundingClientRect();
    const mid = window.innerHeight / 2 - r.top;
    const d = Math.abs(mid - g.data.y);
    return d < 160 ? 'kaynar' : 'sicak';
  }
  function paintGlow() {
    const h = heat();
    if (!glow) {
      glow = K.el('<div class="sk-kenar" aria-hidden="true"><span></span></div>');
      document.body.appendChild(glow);
    }
    glow.className = `sk-kenar ${h}`;
    K.$('span', glow).textContent = { soguk: '❄️ Soğuk', ilik: '🌤️ Ilık', sicak: '🔥 Sıcak', kaynar: '🔥🔥 Kaynar!' }[h] || '';
    if (h && !t0) t0 = Date.now();
    if (h) K.cloud.send('saklambac', { room: K.activeRoom || '', h });
  }
  K.on('room', () => active() && setTimeout(paintGlow, 300));
  window.addEventListener('hashchange', () => setTimeout(() => active() && paintGlow(), 50));
  document.addEventListener('scroll', () => active() && K.activeRoom === active().data.room && paintGlow(), { passive: true, capture: true });

  /* ---------- Oda: durum, canlı izleme, ipuçları ---------- */
  let live = null;
  function render() {
    if (!root || K.activeRoom !== 'saklambac') return;
    const a = active(), m = myActive();
    const last = found.slice(-6).reverse();
    K.$('#skDurum', root).innerHTML = a
      ? `<div class="sk-durum ara">${catSvg()}<div><b>${K.esc(nameOf(other()))} ${K.esc(K.ek(catName(), 'i'))} bir yere sakladı.</b><p>Kanatları gez; ekranın kenarı sıcak-soğuk söyler. Doğru yere dokununca bulursun.</p></div></div>`
      : m
      ? `<div class="sk-durum sakla">${catSvg()}<div><b>${K.esc(catName())} saklı: ${K.esc(K.val(roomOf(m.data.room).title))}</b><p id="skCanli">${live ? `${K.esc(nameOf(other()))} şu an: <b>${K.esc(live.room ? K.val((roomOf(live.room) || {}).title || '') : 'ana salonda')}</b> · ${{ soguk: '❄️ soğuk', ilik: '🌤️ ılık', sicak: '🔥 sıcak', kaynar: '🔥🔥 kaynar' }[live.h] || ''}` : `${K.esc(nameOf(other()))} henüz aramaya başlamadı.`}</p>
          <div class="sk-ipucu">${['🔥 Çok yaklaştın', '❄️ Buz gibi', '🐾 Pati izi: başka kanat', '🎀 Fiyonklu bir odada', '🌙 Gece gibi bir oda'].map((t) => `<button type="button" class="btn soft small" data-sk-ipucu="${K.esc(t)}">${K.esc(t)}</button>`).join('')}</div></div></div>`
      : `<div class="sk-durum">${catSvg()}<div><b>${K.esc(catName())} sıkıldı, saklanmak istiyor.</b><p>Onu kalenin bir odasına sen sakla; ${K.esc(nameOf(other()))} bulsun.</p><button type="button" class="btn red" data-sk-sakla>🤫 ${K.esc(K.ek(catName(), 'i'))} sakla</button></div></div>`;
    K.$('#skGecmis', root).innerHTML = last.length ? `<p class="card-eyebrow">Son oyunlar</p><ul class="sk-liste">${last.map((f) => {
      const g = games.find((x) => x.data.gid === f.data.gid);
      return `<li><b>${K.esc(nameOf(f.who))}</b> buldu · ${K.esc(g ? K.val((roomOf(g.data.room) || {}).title || '') : '')} · ${f.data.ms ? Math.max(1, Math.round(f.data.ms / 60000)) + ' dk' : ''} · ${f.data.tries || 1} dokunuş</li>`;
    }).join('')}</ul>` : '';
  }
  K.on('cloud', async (ok) => {
    if (!ok) return;
    [games, found] = await Promise.all([K.cloud.list('saklambac', 300), K.cloud.list('saklambacbuldu', 300)]);
    loaded = true;
    K.cloud.on('saklambac', (r) => games.some((x) => x.id === r.id) || (games.push(r), render(), K.renderSpecials && !K.activeRoom && K.renderSpecials()));
    K.cloud.on('saklambacbuldu', (r) => {
      if (found.some((x) => x.id === r.id)) return;
      found.push(r);
      live = null;
      render();
      if (r.who !== mine()) K.fx.toast(`🐱 ${K.esc(nameOf(r.who))} ${K.esc(K.ek(catName(), 'i'))} buldu!`, { duration: 4000 });
      glow && active() == null && (glow.className = 'sk-kenar');
    });
    K.cloud.onLive('saklambac', (m) => {
      if (m.who === mine()) return;
      live = m;
      const p = K.$('#skCanli');
      p ? render() : null;
    });
    K.cloud.onLive('sakipucu', (m) => m.who !== mine() && K.fx.toast(`🐱 İpucu: <b>${K.esc(m.text)}</b>`, { duration: 4500 }));
    active() && paintGlow();
  });
  K.specialHooks = (K.specialHooks || []).concat(() => {
    const a = loaded && active();
    return a ? [{ key: 'saklambac', icon: 'paw', title: `🐱 ${catName()} saklandı!`, text: `${nameOf(other())} onu kalede bir yere sakladı. Ekranın kenarı sıcak-soğuk söyleyecek.`, room: 'saklambac', cta: 'Aramaya başla' }] : [];
  });
  K.room({
    id: 'saklambac',
    wing: 'oyun',
    title: 'Pamuk Saklambaç',
    sub: 'Sıcak, soğuk, kaynar',
    icon: 'paw',
    color: '#F1EBFF',
    hidden: () => !K.cloud || !K.cloud.enabled,
    badge: () => (loaded && active() ? '1' : ''),
    init(el) {
      root = el;
      el.innerHTML = `<div class="room-intro"><p>Biri kedimizi kalenin bir odasına, bir köşeye saklar; öbürü odaları gezer. Ekranın kenarı söyler: doğru kanatta ılık, doğru odada sıcak, yaklaştıkça kaynar. Doğru yere dokununca kedi miyavlayarak fırlar.</p></div>
        <section class="card" id="skDurum"></section><section class="card" id="skGecmis"></section>`;
      el.addEventListener('click', (e) => {
        if (e.target.closest('[data-sk-sakla]')) return startHide();
        const t = e.target.closest('[data-sk-ipucu]');
        if (t) {
          K.cloud.send('sakipucu', { text: t.dataset.skIpucu });
          K.fx.toast('İpucu gönderildi.', { duration: 1400, log: false });
        }
      });
    },
    enter() {
      render();
    },
  });
  K.saklambac = { active, heat };
})();
