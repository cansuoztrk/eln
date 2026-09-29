/* Oda: Bilet Kumbarası — ilk buluşmanın bileti için ortak birikim. İkisi de atar (TL ya da AZN), her atışın küçük bir notu olur.
   Kumbara camdan bir kavanoz: içindeki paralar birikimle yükselir, çeyreklerde bir not açılır, dolunca kutlama olur.
   Hedef ve kur Kale Paneli'nden değişir (bulut). */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  let root, rows = [], cfgRows = [];
  const KB = () => D.kumbara || { intro: [], milestones: [] };
  const mine = () => (K.isOwner() ? 'me' : 'her');
  const nameOf = (w) => (w === 'me' ? C.myPet : C.herPet);
  const cfg = () => Object.assign({ target: 8000, currency: 'TL', azn: 26 }, C.kumbara || {}, ...cfgRows.map((r) => r.data));
  const toTL = (r) => (r.data.cur === 'AZN' ? r.data.amount * cfg().azn : r.data.amount);
  const total = () => rows.reduce((a, r) => a + toTL(r), 0);
  const fmt = (n) => `${K.num(Math.round(n))} ${cfg().currency}`;

  function jar(p) {
    // Kavanozun içi 30..190 arası; paralar dolulukla artar
    const rnd = K.rng(7);
    const n = Math.round(Math.min(1, p) * 46);
    const coins = Array.from({ length: n }, (_, i) => {
      const row = Math.floor(i / 6), col = i % 6;
      const x = 52 + col * 19 + (row % 2) * 9 + rnd() * 4;
      const y = 186 - row * 12 - rnd() * 3;
      const c = i % 5 === 4 ? '#FF8FB8' : '#FFD34E';
      return `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${Math.round(rnd() * 40 - 20)})"><ellipse rx="9" ry="5" fill="${c}" stroke="#8A5A00" stroke-width="1.6"/><ellipse rx="5" ry="2.6" fill="none" stroke="#8A5A00" stroke-width="1" opacity=".6"/></g>`;
    }).join('');
    return `<svg class="kmb-jar" viewBox="0 0 200 230" role="img" aria-label="Kumbara, yüzde ${Math.round(p * 100)} dolu">
      <rect x="62" y="8" width="76" height="20" rx="6" fill="#FF8FB8" stroke="#4A2138" stroke-width="4"/>
      <rect x="92" y="12" width="16" height="4" rx="2" fill="#4A2138"/>
      <path d="M58 30 H142 C142 44 168 52 168 84 V192 C168 212 152 222 132 222 H68 C48 222 32 212 32 192 V84 C32 52 58 44 58 30 Z" fill="#EAF7FF" stroke="#4A2138" stroke-width="4"/>
      <clipPath id="kbClip"><path d="M60 32 H140 C140 46 166 54 166 84 V192 C166 210 151 220 132 220 H68 C49 220 34 210 34 192 V84 C34 54 60 46 60 32 Z"/></clipPath>
      <g clip-path="url(#kbClip)">${coins}</g>
      <path d="M48 90 C46 120 46 160 50 190" stroke="#fff" stroke-width="6" stroke-linecap="round" opacity=".7"/>
      <g transform="translate(100 118)"><rect x="-44" y="-18" width="88" height="36" rx="8" fill="#fff" stroke="#4A2138" stroke-width="3"/><text y="7" text-anchor="middle" font-family="Fredoka, sans-serif" font-weight="700" font-size="20" fill="#E3174D">%${Math.min(100, Math.round(p * 100))}</text></g>
      <path d="M150 58 L176 30 L186 42 Z" fill="#fff" stroke="#4A2138" stroke-width="3"/><path d="M160 50 L178 34" stroke="#4FA3E3" stroke-width="3"/>
    </svg>`;
  }

  // Uçuş çizgisi: birikim arttıkça uçak İstanbul'dan Bakü'ye ilerler
  function flight(p) {
    const q = Math.min(1, p);
    const a = [24, 70], b = [296, 56], ctl = [160, -6];
    const at = (t) => [(1 - t) * (1 - t) * a[0] + 2 * (1 - t) * t * ctl[0] + t * t * b[0], (1 - t) * (1 - t) * a[1] + 2 * (1 - t) * t * ctl[1] + t * t * b[1]];
    const [x, y] = at(q);
    const [x2, y2] = at(Math.min(1, q + 0.01));
    const ang = (Math.atan2(y2 - y, x2 - x) * 180) / Math.PI;
    const done = Array.from({ length: 41 }, (_, i) => at((i / 40) * q)).map((pt, i) => `${i ? 'L' : 'M'}${pt[0].toFixed(1)} ${pt[1].toFixed(1)}`).join(' ');
    return `<svg class="kmb-fly" viewBox="0 0 320 96" role="img" aria-label="İstanbul'dan Bakü'ye, yolun yüzde ${Math.round(q * 100)}'ü">
      <path d="M${a[0]} ${a[1]} Q${ctl[0]} ${ctl[1]} ${b[0]} ${b[1]}" fill="none" stroke="currentColor" stroke-width="2.5" stroke-dasharray="3 6" opacity=".35"/>
      <path d="${done}" fill="none" stroke="#E3174D" stroke-width="3" stroke-linecap="round"/>
      <circle cx="${a[0]}" cy="${a[1]}" r="6" fill="#4FA3E3" stroke="#fff" stroke-width="2"/><text x="${a[0]}" y="${a[1] + 20}" text-anchor="middle" class="kmb-city">İstanbul</text>
      <circle cx="${b[0]}" cy="${b[1]}" r="6" fill="#E3174D" stroke="#fff" stroke-width="2"/><text x="${b[0]}" y="${b[1] + 20}" text-anchor="middle" class="kmb-city">Bakü</text>
      <g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${ang.toFixed(1)})"><path d="M-12 0 L10 0 M-2 0 L-8 -9 M-2 0 L-8 9 M-12 0 L-15 -4 M-12 0 L-15 4" stroke="#4A2138" stroke-width="3.5" stroke-linecap="round"/><path d="M10 0 L14 0" stroke="#E3174D" stroke-width="4" stroke-linecap="round"/></g>
    </svg>`;
  }

  function render() {
    if (!root) return;
    const c = cfg();
    const sum = total();
    const p = c.target ? sum / c.target : 0;
    const fl = K.bilet && K.bilet.get();
    K.$('#kbJar', root).innerHTML = jar(p) + (fl ? `<a class="kmb-stamp" href="#bilet">Bilet alındı<small>${K.esc(T.fmt(fl.date))}</small></a>` : '');
    K.$('#kbFly', root).innerHTML = `${flight(p)}${c.label ? `<p class="kmb-label">${K.esc(c.label)}</p>` : ''}`;
    K.$('#kbSum', root).innerHTML = `<b>${fmt(sum)}</b> / ${fmt(c.target)}`;
    K.$('#kbLeft', root).textContent = sum >= c.target ? 'Kumbara doldu!' : `Bilete ${fmt(c.target - sum)} kaldı`;
    const by = { her: 0, me: 0 };
    rows.forEach((r) => (by[r.who] = (by[r.who] || 0) + toTL(r)));
    K.$('#kbSplit', root).innerHTML = `<span class="her"><i style="width:${sum ? (by.her / sum) * 100 : 50}%"></i></span><small>${K.esc(C.herPet)} ${fmt(by.her)} · ${K.esc(C.myPet)} ${fmt(by.me)}</small>`;
    const ms = KB().milestones.filter(([pc]) => p * 100 >= pc).pop();
    K.$('#kbMile', root).innerHTML = ms ? `<p class="hand">${K.esc(K.fill(ms[1]))}</p>` : '';
    K.$('#kbLog', root).innerHTML = rows.length
      ? rows
          .slice()
          .reverse()
          .map((r) => {
            const d = T.baku(new Date(r.at));
            return `<li class="${r.who}"><span class="kmb-amt">+${K.num(r.data.amount)} ${K.esc(r.data.cur)}</span><div><b>${K.esc(nameOf(r.who))}</b><small>${d.d} ${K.MONTHS[d.mo - 1]}</small>${r.data.note ? `<p class="hand">${K.esc(r.data.note)}</p>` : ''}</div>${r.who === mine() ? `<button class="wn-x" data-del="${r.id}" aria-label="Sil">${A.ui('close')}</button>` : ''}</li>`;
          })
          .join('')
      : '<li class="muted">Kumbara boş. İlk parayı kim atacak?</li>';
    K.$('#kbCur', root).innerHTML = ['TL', 'AZN'].map((x) => `<option ${x === (K.isOwner() ? 'TL' : 'AZN') ? 'selected' : ''}>${x}</option>`).join('');
    K.$('#kbRate', root).textContent = `1 AZN ≈ ${K.num(c.azn)} TL sayılıyor.`;
  }

  // Bir çeyreği geçince kutlama (her çeyrek bir kez)
  function celebrate(before, after) {
    const c = cfg();
    const hit = KB().milestones.find(([pc]) => (before / c.target) * 100 < pc && (after / c.target) * 100 >= pc);
    if (!hit) return;
    K.fx.confetti({ count: hit[0] === 100 ? 220 : 90, shapes: ['heart', 'star'], colors: ['#FFD34E', '#FF8FB8', '#E3174D'] });
    K.audio.sfx.success();
    K.fx.toast(`<b>%${hit[0]}!</b> ${K.esc(K.fill(hit[1]))}`, { icon: A.icon('plane'), duration: 7000 });
    if (hit[0] === 100) K.stickers.award('kumbara');
  }

  K.on('cloud', async (on) => {
    if (!on) return;
    [rows, cfgRows] = await Promise.all([K.cloud.list('coin'), K.cloud.list('kumbaracfg')]);
    cfgRows = cfgRows.filter((r) => r.who === 'me');
    K.cloud.on('coin', (r) => {
      if (rows.some((x) => x.id === r.id)) return;
      const before = total();
      rows.push(r);
      celebrate(before, total());
      if (r.who !== mine()) K.fx.toast(`<b>${K.esc(nameOf(r.who))} kumbaraya ${K.num(r.data.amount)} ${K.esc(r.data.cur)} attı.</b>${r.data.note ? ` "${K.esc(r.data.note)}"` : ''}`, { icon: A.icon('jar') });
      if (K.activeRoom === 'kumbara') render();
    });
    K.cloud.on('kumbaracfg', (r) => {
      if (r.who !== 'me') return;
      cfgRows.push(r);
      if (K.activeRoom === 'kumbara') render();
    });
    K.cloud.on('deleted', ({ id }) => {
      rows = rows.filter((r) => r.id !== id);
      if (K.activeRoom === 'kumbara') render();
    });
  });
  K.kumbara = { cfg, total };

  K.room({
    id: 'kumbara',
    wing: 'kalp',
    title: 'Bilet Kumbarası',
    sub: () => `${(cfg().label || 'İlk buluşmanın bileti')}, ikimizden`,
    icon: 'jar',
    color: '#E6F4FF',
    hidden: () => !D.kumbara || !K.cloud || !K.cloud.enabled,
    badge: () => {
      const c = cfg();
      return c.target && rows.length ? `%${Math.min(100, Math.round((total() / c.target) * 100))}` : '';
    },
    init(el) {
      root = el;
      el.innerHTML = `
        <div class="room-intro">${K.paras(KB().intro)}</div>
        <div class="kmb-flywrap" id="kbFly"></div>
        <section class="kmb-top">
          <div id="kbJar"></div>
          <div class="kmb-stats">
            <p class="kmb-sum" id="kbSum"></p>
            <p class="kmb-left" id="kbLeft"></p>
            <div class="kmb-split" id="kbSplit"></div>
            <div id="kbMile"></div>
          </div>
        </section>
        <form class="card kmb-form" id="kbForm" autocomplete="off">
          <p class="card-eyebrow">Kumbaraya at</p>
          <div class="row"><input class="input" id="kbAmt" name="kbAmt" type="number" inputmode="decimal" min="1" step="any" placeholder="Miktar"><select class="input" id="kbCur" name="kbCur" aria-label="Para birimi"></select></div>
          <input class="input" id="kbNote" name="kbNote" maxlength="120" placeholder="Nereden geldi? (ör. Bugün kahve almadım)">
          <button class="btn red" type="submit">${A.icon('jar')} At</button>
          <p class="muted small" id="kbRate"></p>
        </form>
        <ul class="kmb-log" id="kbLog"></ul>`;
      K.$('#kbForm', el).addEventListener('submit', async (e) => {
        e.preventDefault();
        const amount = Math.round(parseFloat(String(K.$('#kbAmt', el).value).replace(',', '.')) * 100) / 100;
        if (!(amount > 0)) return K.$('#kbAmt', el).focus();
        const before = total();
        const r = await K.cloud.add('coin', { amount, cur: K.$('#kbCur', el).value, note: K.$('#kbNote', el).value.trim() });
        if (!r) return K.fx.toast('Atılamadı. İnterneti kontrol et.');
        K.$('#kbAmt', el).value = '';
        K.$('#kbNote', el).value = '';
        K.audio.sfx.sparkle();
        if (before === total()) render();
        if (!K.isOwner()) K.notify(`${C.herName} kumbaraya para attı`, `${amount} ${K.$('#kbCur', el).value}${r.data.note ? `: ${r.data.note}` : ''}`, ['moneybag']);
        render();
      });
      el.addEventListener('click', async (e) => {
        const d = e.target.closest('[data-del]');
        if (!d) return;
        if (d.dataset.armed !== '1') {
          d.dataset.armed = '1';
          d.classList.add('armed');
          return;
        }
        await K.cloud.remove(d.dataset.del);
        render();
      });
    },
    enter() {
      render();
    },
  });
})();
