/* Oda: Özel Günler — geri sayımlar, ayımız takvimi ve mumları üflenen doğum günü pastası */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const C = window.ELN.config;
  const T = K.time;

  let root, blower = null;

  function events() {
    const [ty, tm, td] = C.togetherDate.split('-').map(Number);
    const p = T.baku();
    // Sıradaki ayın 21'i
    let y = p.y,
      m = p.mo;
    if (p.d > td) m++;
    if (m > 12) {
      m = 1;
      y++;
    }
    const monthKey = `${y}-${K.pad(m)}-${K.pad(td)}`;
    const monthN = (y - ty) * 12 + (m - tm);
    const ann = T.nextAnnual(C.togetherDate.slice(5));
    const annN = ann.year - ty;
    const list = [
      { id: 'herbd', title: `${C.herName}'in doğum günü`, icon: 'cake', ...T.nextAnnual(C.herBirthday), note: 'Türkiye\'de bayram, benim için daha da büyük bayram.' },
      { id: 'mybd', title: `${C.myName}'in doğum günü`, icon: 'cake', ...T.nextAnnual(C.myBirthday), note: 'O gün ilk mesajı sen atacaksın, anlaşmıştık.' },
      { id: 'met', title: 'Tanışma yıldönümümüz', icon: 'letter', ...T.nextAnnual(C.metDate.slice(5)), note: 'Nehir\'in bizi aynı gruba eklediği gün.' },
      { id: 'ann', title: annN === 1 ? 'İlk yıldönümümüz' : `${annN}. yıldönümümüz`, icon: 'heart', ...ann, note: '21 Mayıs: takvimdeki en sevdiğim gün.' },
      { id: 'month', title: `${monthN}. ayımız`, icon: 'calendar', days: T.daysUntil(monthKey), date: T.at(monthKey), note: 'Her ayın 21\'i bizim küçük bayramımız.' },
      { id: 'val', title: 'Sevgililer Günü', icon: 'heart', ...T.nextAnnual('02-14'), note: 'Bizim için her gün, ama olsun.' },
      { id: 'ny', title: 'Yeni yıl', icon: 'star', ...T.nextAnnual('01-01'), note: 'Yeni yılın ilk mesajı senin.' },
      { id: 'hk', title: 'Hello Kitty\'nin doğum günü', icon: 'bow', ...T.nextAnnual('11-01'), note: 'Kitty White, 1 Kasım. Senin kadar olmasa da önemli.' },
    ];
    return list.sort((a, b) => a.days - b.days);
  }

  function renderCountdowns() {
    K.$('#cdGrid', root).innerHTML = events()
      .map(
        (e, i) => `<div class="card cd ${e.days === 0 ? 'today' : ''} ${i === 0 ? 'first' : ''}" data-t="${e.date.getTime()}">
        <div class="cd-head">${A.icon(e.icon)}<div><h3>${K.esc(e.title)}</h3><p class="muted small">${T.fmt(e.date, true)}</p></div></div>
        ${e.days === 0 ? '<p class="cd-today">Bugün!</p>' : `<div class="cd-units tnum"><span><b data-u="d">${e.days}</b>gün</span><span><b data-u="h">00</b>saat</span><span><b data-u="m">00</b>dk</span><span><b data-u="s">00</b>sn</span></div>`}
        <p class="cd-note">${K.esc(e.note)}</p>
      </div>`
      )
      .join('');
    tickCountdowns();
  }
  function tickCountdowns() {
    const now = T.now().getTime();
    K.$$('.cd[data-t]', root).forEach((c) => {
      const s = T.split(+c.dataset.t - now);
      const set = (u, v) => {
        const b = c.querySelector(`[data-u="${u}"]`);
        if (b) b.textContent = u === 'd' ? v : K.pad(v);
      };
      set('d', s.d);
      set('h', s.h);
      set('m', s.m);
      set('s', s.s);
    });
  }

  function yearTrack() {
    const days = T.daysSince(C.togetherDate);
    const pct = K.clamp((days / 365) * 100, 0, 100);
    const [ty, tm, td] = C.togetherDate.split('-').map(Number);
    const dots = Array.from({ length: 12 }, (_, i) => {
      let m = tm + i + 1,
        y = ty;
      while (m > 12) {
        m -= 12;
        y++;
      }
      const key = `${y}-${K.pad(m)}-${K.pad(td)}`;
      const d = T.daysUntil(key);
      const st = d < 0 ? 'past' : d === 0 ? 'now' : 'future';
      return `<li class="mdot ${st}" title="${T.fmt(key)}"><span>${st === 'past' || st === 'now' ? A.ui('heart') : ''}</span><b>${i + 1}</b><small>${K.MONTHS[m - 1].slice(0, 3)}</small></li>`;
    }).join('');
    return `<div class="card year">
      <p class="card-eyebrow">İlk yılımız</p>
      <h3>${days >= 365 ? 'İlk yılımızı tamamladık!' : `İlk yılımızın %${Math.floor(pct)}'i geride kaldı`}</h3>
      <div class="year-bar"><i style="width:${pct}%"></i><span class="year-plane" style="left:${pct}%">${A.icon('plane')}</span></div>
      <div class="year-ends"><span>${T.fmtShort(C.togetherDate)} ${C.togetherDate.slice(0, 4)}</span><span>${T.fmtShort(C.firstAnniversary)} ${C.firstAnniversary.slice(0, 4)}</span></div>
      <ol class="mdots">${dots}</ol>
    </div>`;
  }

  /* ---------------- Pasta ---------------- */
  const CANDLES = [84, 107, 130, 153, 176];
  function cakeSvg() {
    const sprinkles = Array.from({ length: 22 }, (_, i) => {
      const x = 52 + ((i * 37) % 160),
        y = 170 + ((i * 23) % 40);
      return `<rect x="${x}" y="${y}" width="7" height="3" rx="1.5" fill="${['#fff', '#FFD34E', '#8FD3FF', '#C9B6FF'][i % 4]}" transform="rotate(${(i * 47) % 180} ${x} ${y})"/>`;
    }).join('');
    return `<svg viewBox="0 0 260 240" class="cake-svg" role="img" aria-label="Doğum günü pastası">
      <ellipse cx="130" cy="224" rx="116" ry="12" fill="#fff" stroke="#E7C6D6" stroke-width="3"/>
      <rect x="36" y="150" width="188" height="72" rx="14" fill="#FFB3CE" stroke="#4A2138" stroke-width="4"/>
      ${sprinkles}
      <path d="M36 164 q12 16 24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t20 0 V152 H36 Z" fill="#fff" stroke="#4A2138" stroke-width="3" stroke-linejoin="round"/>
      <rect x="62" y="96" width="136" height="60" rx="12" fill="#fff" stroke="#4A2138" stroke-width="4"/>
      <path d="M62 110 q11 14 22 0 t23 0 t23 0 t23 0 t23 0 t22 0 V98 H62 Z" fill="#FF8FB8" stroke="#4A2138" stroke-width="3" stroke-linejoin="round"/>
      ${A.kitty({ eyes: 'normal' }).replace('<svg ', '<svg x="104" y="112" width="52" height="44" ')}
      ${CANDLES.map(
        (x, i) => `<g class="candle" data-i="${i}">
          <rect x="${x - 5}" y="60" width="10" height="38" rx="3" fill="${['#8FD3FF', '#FFD34E', '#FF8FB8', '#C9B6FF', '#7ED6A5'][i]}" stroke="#4A2138" stroke-width="2.5"/>
          <path d="M${x - 5} 70 l10 -5 M${x - 5} 82 l10 -5 M${x - 5} 94 l10 -5" stroke="#fff" stroke-width="2"/>
          <path d="M${x} 60 v-6" stroke="#4A2138" stroke-width="2"/>
          <g class="flame" style="transform-origin:${x}px 54px"><path d="M${x} 30 C${x - 9} 42 ${x - 8} 52 ${x} 55 C${x + 8} 52 ${x + 9} 42 ${x} 30 Z" fill="#FFB547"/><path d="M${x} 40 C${x - 4} 46 ${x - 4} 51 ${x} 53 C${x + 4} 51 ${x + 4} 46 ${x} 40 Z" fill="#FFF3B0"/></g>
          <g class="smoke"><circle cx="${x}" cy="44" r="4" fill="#D9CFE3"/><circle cx="${x + 4}" cy="36" r="5" fill="#E6DDEE"/><circle cx="${x - 2}" cy="27" r="6" fill="#F0EAF6"/></g>
          <rect class="candle-hit" x="${x - 12}" y="24" width="24" height="76" fill="transparent"/>
        </g>`
      ).join('')}
    </svg>`;
  }
  function isBirthday() {
    return T.nextAnnual(C.herBirthday).days === 0;
  }
  function outCandle(i) {
    const c = K.$(`.candle[data-i="${i}"]`, root);
    if (!c || c.classList.contains('out')) return;
    c.classList.add('out');
    K.audio.sfx.whoosh();
    if (K.$$('.candle:not(.out)', root).length === 0) celebrate();
  }
  function blowAll() {
    stopBlow();
    CANDLES.forEach((_, i) => setTimeout(() => outCandle(i), i * 120));
  }
  function celebrate() {
    stopBlow();
    K.stickers.award('mum');
    K.fx.confetti({ count: 180 });
    setTimeout(() => K.fx.rain({ count: 60 }), 600);
    K.audio.play('birthday', {});
    const msg = K.$('#cakeMsg', root);
    msg.innerHTML = isBirthday()
      ? `<b>İyi ki doğdun, ${K.esc(C.herName)}!</b> Dileğin kabul olsun. Ben de İstanbul'dan üfledim; rüzgârımız ${K.esc(C.herCity)}'de buluştu.`
      : `<b>Prova başarılı!</b> Asıl mumlar 23 Nisan'da yanacak. O gün bu pasta gerçekten senin için olacak.`;
    K.$('#cakeRelight', root).hidden = false;
    K.$('#cakeBlow', root).hidden = true;
  }
  function relight() {
    K.$$('.candle', root).forEach((c) => c.classList.remove('out'));
    K.$('#cakeMsg', root).textContent = isBirthday() ? 'Bir dilek tut, sonra üfle.' : 'Bu bir prova. Dilek tutmak serbest.';
    K.$('#cakeRelight', root).hidden = true;
    K.$('#cakeBlow', root).hidden = false;
  }
  async function startBlow() {
    const btn = K.$('#cakeBlow', root);
    const meter = K.$('#blowMeter', root);
    if (blower) return stopBlow();
    try {
      K.audio.ensure();
      blower = await K.audio.blowDetector(blowAll, (lv) => (meter.style.width = Math.min(100, lv * 700) + '%'));
      btn.innerHTML = `${A.ui('mic')} Dinliyorum... şimdi üfle!`;
      btn.classList.add('listening');
      K.$('.blow-meter', root).hidden = false;
      setTimeout(() => blower && stopBlow(), 25000);
    } catch (e) {
      K.$('#cakeMsg', root).textContent = 'Mikrofona ulaşılamadı. Mumlara tek tek dokunarak da söndürebilirsin.';
    }
  }
  function stopBlow() {
    if (blower) {
      blower.stop();
      blower = null;
    }
    const btn = K.$('#cakeBlow', root);
    if (btn) {
      btn.innerHTML = `${A.ui('mic')} Mikrofona üfle`;
      btn.classList.remove('listening');
    }
    const m = K.$('.blow-meter', root);
    if (m) m.hidden = true;
  }

  K.room({
    id: 'ozel',
    title: 'Özel Günler',
    sub: 'Geri sayımlar ve bir pasta',
    icon: 'cake',
    color: '#FFE9B8',
    badge: () => {
      const e = events()[0];
      return e.days === 0 ? 'Bugün!' : `${e.days} gün`;
    },
    init(el) {
      root = el;
      const bday = isBirthday();
      el.innerHTML = `
        <p class="room-intro">Takvimimizdeki özel günler. Her biri geldiğinde kalede bir şeyler değişiyor: yeni mektuplar açılıyor, ana salon süsleniyor.</p>
        ${yearTrack()}
        <div class="cd-grid" id="cdGrid"></div>
        <div class="card cake-card ${bday ? 'is-bday' : ''}">
          <p class="card-eyebrow">${bday ? 'Bugün senin günün' : 'Doğum günü pastası · prova'}</p>
          <h3>${bday ? `İyi ki doğdun, Prenses ${K.esc(C.herName)}!` : `23 Nisan'a ${K.num(T.nextAnnual(C.herBirthday).days)} gün var`}</h3>
          <div class="cake-stage">${cakeSvg()}</div>
          <p class="cake-msg" id="cakeMsg">${bday ? 'Bir dilek tut, sonra üfle.' : 'Bu bir prova. Dilek tutmak serbest.'}</p>
          <div class="blow-meter" hidden><i id="blowMeter"></i></div>
          <div class="actions" style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center;margin-top:12px">
            <button class="btn" id="cakeBlow">${A.ui('mic')} Mikrofona üfle</button>
            <button class="btn soft" id="cakeRelight" hidden>${A.ui('refresh')} Mumları yeniden yak</button>
          </div>
          <p class="muted small" style="text-align:center;margin-top:8px">Mikrofon yoksa mumlara tek tek dokun.</p>
        </div>`;
      K.$('.cake-stage', el).addEventListener('click', (e) => {
        const c = e.target.closest('.candle');
        if (c) outCandle(+c.dataset.i);
      });
      K.$('#cakeBlow', el).addEventListener('click', startBlow);
      K.$('#cakeRelight', el).addEventListener('click', relight);
      renderCountdowns();
      K.on('tick', () => K.activeRoom === 'ozel' && tickCountdowns());
    },
    enter() {
      renderCountdowns();
    },
    leave() {
      stopBlow();
    },
  });
})();
