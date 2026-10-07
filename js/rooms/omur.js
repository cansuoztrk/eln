/* Oda: Ömür Takvimi — tanıştığımız haftadan başlayıp önümüzdeki elli yıla uzanan kocaman bir takvim; her hafta tek
   küçük nokta, her satır bir yıl. Tanıştığımız, sevgili olduğumuz ve ilk buluştuğumuz haftalar işaretli. Geçen her
   haftaya bir renk ve bir cümle verilir; boş noktalar birlikte dolduracağımız yerler. Bu hafta yanıp söner.
   Kayıtlar: hafta {w, text, color} (aynı haftanın son kaydı geçerli) */
(function () {
  'use strict';
  const K = window.K;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  const nameOf = (w) => (w === 'me' ? C.myPet : C.herPet);
  const YIL = 50, SUTUN = 52;
  const RENK = ['#FF8FB8', '#FFB86B', '#FFD34E', '#8FD694', '#7FCBEA', '#9C8CFF', '#E04F7A', '#B07A55'];
  let rows = [], root = null, sec = null;
  const bas = () => C.metDate || C.togetherDate || T.todayKey();
  const haftaOf = (day) => Math.floor((T.at(day).getTime() - T.at(bas()).getTime()) / (7 * 864e5));
  const gunOf = (w) => T.key(T.baku(new Date(T.at(bas()).getTime() + w * 7 * 864e5 + 12 * 3600e3)));
  const buHafta = () => haftaOf(T.todayKey());
  const of = (w) => rows.filter((r) => r.data.w === w).sort((a, b) => b.at - a.at)[0];
  const isaret = () => {
    const m = {};
    const ekle = (d, s, t) => d && (m[haftaOf(d)] = { s, t });
    ekle(C.metDate, '✦', 'Tanıştığımız hafta');
    ekle(C.togetherDate, '♥', 'Sevgili olduğumuz hafta');
    ekle(C.firstMeetDate, '✈', 'İlk buluşmamız');
    return m;
  };
  function ciz() {
    const cv = K.$('#omCv', root);
    if (!cv) return;
    const w = cv.clientWidth || 340;
    const cell = w / (SUTUN + 2), r = cell * 0.36;
    const h = cell * (YIL + 1);
    const dpr = Math.min(2, devicePixelRatio || 1);
    cv.width = w * dpr;
    cv.height = h * dpr;
    cv.style.height = h + 'px';
    const g = cv.getContext('2d');
    g.scale(dpr, dpr);
    const css = getComputedStyle(root);
    const ink = css.getPropertyValue('--plum').trim() || '#4A2138';
    const now = buHafta(), mk = isaret();
    const by = {};
    rows.forEach((x) => (!by[x.data.w] || by[x.data.w].at < x.at) && (by[x.data.w] = x));
    g.font = `600 ${Math.max(7, cell * 0.62)}px Nunito, system-ui, sans-serif`;
    g.textBaseline = 'middle';
    for (let y = 0; y < YIL; y++) {
      if (y % 5 === 0) {
        g.fillStyle = ink;
        g.globalAlpha = 0.5;
        g.fillText(String(y), 0, cell * (y + 1));
        g.globalAlpha = 1;
      }
      for (let x = 0; x < SUTUN; x++) {
        const i = y * SUTUN + x;
        const cx = cell * (x + 2), cy = cell * (y + 1);
        g.beginPath();
        g.arc(cx, cy, r, 0, Math.PI * 2);
        g.globalAlpha = by[i] || i === now ? 1 : i < now ? 0.42 : 0.13;
        g.fillStyle = by[i] ? by[i].data.color || RENK[0] : i === now ? '#E04F7A' : ink;
        g.fill();
        g.globalAlpha = 1;
        if (mk[i]) {
          g.fillStyle = ink;
          g.font = `800 ${cell * 0.9}px Nunito, system-ui, sans-serif`;
          g.textAlign = 'center';
          g.fillText(mk[i].s, cx, cy + 0.5);
          g.textAlign = 'left';
          g.font = `600 ${Math.max(7, cell * 0.62)}px Nunito, system-ui, sans-serif`;
        }
        if (i === sec) {
          g.lineWidth = 2;
          g.strokeStyle = ink;
          g.beginPath();
          g.arc(cx, cy, r + 2.5, 0, Math.PI * 2);
          g.stroke();
        }
      }
    }
    cv._cell = cell;
  }
  function detay() {
    const box = K.$('#omDetay', root);
    if (sec == null) {
      box.innerHTML = `<p class="muted small center">Bir noktaya dokun: o haftanın rengi ve cümlesi.</p>`;
      return;
    }
    const r = of(sec), mk = isaret()[sec], gecti = sec <= buHafta();
    const gun = gunOf(sec);
    box.innerHTML = `<p class="card-eyebrow">${sec + 1}. hafta · ${K.esc(T.fmt(gun))}${mk ? ` · ${K.esc(mk.t)}` : ''}${sec === buHafta() ? ' · bu hafta' : ''}</p>
      ${r ? `<p class="om-cumle" style="--c:${r.data.color}">"${K.esc(r.data.text)}" <small>— ${K.esc(nameOf(r.who))}</small></p>` : `<p class="muted small">${gecti ? 'Bu haftanın henüz bir cümlesi yok.' : 'Bu hafta henüz gelmedi. Bir hayal yazabilirsin.'}</p>`}
      <div class="om-renk">${RENK.map((c, i) => `<button type="button" class="om-r ${r && r.data.color === c ? 'on' : i === 0 && !r ? 'on' : ''}" style="--c:${c}" data-om-renk="${c}" aria-label="Renk"></button>`).join('')}</div>
      <div class="row"><input class="input" id="omMetin" maxlength="100" placeholder="${gecti ? 'Bu hafta tek cümleyle...' : 'Bu haftada ne olsun?'}" value="${r ? K.esc(r.data.text) : ''}"><button type="button" class="btn red small" data-om-yaz>Yaz</button></div>`;
  }
  function render() {
    if (!root || K.activeRoom !== 'omur') return;
    const now = buHafta(), dolu = new Set(rows.map((r) => r.data.w)).size;
    K.$('#omUst', root).innerHTML = `<div><b>${K.num(Math.max(0, now + 1))}</b><small>hafta geçti</small></div><div><b>${K.num(dolu)}</b><small>hafta bir cümle aldı</small></div><div><b>${K.num(YIL * SUTUN - now - 1)}</b><small>hafta önümüzde</small></div>`;
    ciz();
    detay();
  }
  K.on('cloud', async (ok) => {
    if (!ok) return;
    rows = await K.cloud.list('hafta', 1000);
    K.cloud.on('hafta', (r) => rows.some((x) => x.id === r.id) || (rows.push(r), render()));
  });
  K.room({
    id: 'omur',
    wing: 'zaman',
    title: 'Ömür Takvimi',
    sub: 'Her hafta bir nokta',
    icon: 'week',
    color: '#EFE8FF',
    hidden: () => !K.cloud || !K.cloud.enabled || !(C.metDate || C.togetherDate),
    init(el) {
      root = el;
      el.innerHTML = `<div class="room-intro"><p>Tanıştığımız haftadan önümüzdeki elli yıla: her nokta bir hafta, her satır bir yıl. ✦ tanıştığımız, ♥ sevgili olduğumuz, ✈ ilk buluştuğumuz hafta. Geçen haftalara bir renk ve bir cümle ver; boş noktalar birlikte dolduracağımız yerler.</p></div>
        <div class="om-ust" id="omUst"></div><div class="card om-kart"><canvas id="omCv" class="om-cv" aria-label="Ömür takvimi"></canvas></div><section class="card" id="omDetay"></section>`;
      let renk = RENK[0];
      el.addEventListener('click', async (e) => {
        const cv = e.target.closest('#omCv');
        if (cv) {
          const b = cv.getBoundingClientRect(), cell = cv._cell;
          const x = Math.round((e.clientX - b.left) / cell) - 2, y = Math.round((e.clientY - b.top) / cell) - 1;
          if (x < 0 || x >= SUTUN || y < 0 || y >= YIL) return;
          sec = y * SUTUN + x;
          renk = (of(sec) && of(sec).data.color) || RENK[0];
          ciz();
          return detay();
        }
        const rk = e.target.closest('[data-om-renk]');
        if (rk) {
          renk = rk.dataset.omRenk;
          K.$$('.om-r', root).forEach((b) => b.classList.toggle('on', b === rk));
          return;
        }
        if (e.target.closest('[data-om-yaz]') && sec != null) {
          const text = K.$('#omMetin', root).value.trim();
          if (!text) return;
          const r = await K.cloud.add('hafta', { w: sec, text, color: renk });
          if (!r) return;
          rows.some((x) => x.id === r.id) || rows.push(r);
          K.stickers.award(sec > buHafta() ? 'omurhayal' : 'omur');
          render();
        }
      });
      addEventListener('resize', () => K.activeRoom === 'omur' && ciz());
    },
    enter() {
      if (sec == null) sec = buHafta();
      render();
    },
  });
  K.omur = { haftaOf, gunOf, buHafta };
})();
