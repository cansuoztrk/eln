/* Oda: Kalp Haritası — bir yılın kalbi tek sayfada. On iki satır (aylar), her satırda günler. Her kare çapraz ikiye
   bölünür: sol üst Eln'in o günkü içinin havası, sağ alt Ardoş'unki (Kalbin Hava Durumu'ndan). Hava yoksa üçgen,
   o gün kalede olanların yoğunluğuyla pembeleşir. Bir güne dokununca o günün özeti; ay adına dokununca ayın özeti.
   Yeni kayıt tutmaz; akıştaki kayıtları okur. */
(function () {
  'use strict';
  const K = window.K;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  const KH = () => D.kalpharita || { intro: [] };
  const nameOf = (w) => (w === 'me' ? C.myPet : C.herPet);
  const MOOD = { gunes: ['#FFC93C', '☀️', 'Güneşli'], gokkusagi: ['#FF8FB8', '🌈', 'Gökkuşağı'], parcali: ['#9FD3EE', '⛅', 'Parçalı'], sis: ['#B9B4CC', '🌫️', 'Sisli'], yagmur: ['#5B8DEF', '🌧️', 'Yağmurlu'], firtina: ['#5B4B8A', '⛈️', 'Fırtınalı'], kar: ['#DCEBFF', '❄️', 'Karlı'] };
  const SUNNY = ['gunes', 'gokkusagi', 'parcali'];
  const M3 = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];

  let root = null, items = null, year = null, by = {};

  function build() {
    by = {};
    (items || []).forEach((x) => {
      const d = (by[x.day] = by[x.day] || { n: 0, her: null, me: null, kinds: {} });
      d.n++;
      const kd = (d.kinds[x.kind] = d.kinds[x.kind] || { n: 0, emoji: x.emoji || '', title: x.title || x.kind });
      kd.n++;
      if (x.kind === 'hava' && x.row && x.row.data && MOOD[x.row.data.type]) {
        const cur = d[x.who];
        if (!cur || cur.at < x.at) d[x.who] = { type: x.row.data.type, at: x.at, note: x.row.data.note || '' };
      }
    });
  }
  const years = () => {
    const y0 = +(C.metDate || C.togetherDate).slice(0, 4), y1 = +T.todayKey().slice(0, 4);
    const out = [];
    for (let y = y1; y >= y0; y--) out.push(y);
    return out;
  };

  function grid(y) {
    const P = 12, S = 10, L = 28, TOP = 14;
    const today = T.todayKey();
    const max = Math.max(4, ...Object.entries(by).filter(([k]) => k.startsWith(String(y))).map(([, v]) => v.n));
    const tri = (x0, y0, a, color, op) => {
      const pts = a === 'tl' ? `${x0},${y0} ${x0 + S},${y0} ${x0},${y0 + S}` : `${x0 + S},${y0} ${x0 + S},${y0 + S} ${x0},${y0 + S}`;
      return `<polygon points="${pts}" fill="${color}"${op != null ? ` fill-opacity="${op}"` : ''}/>`;
    };
    let s = '';
    for (let d = 1; d <= 31; d += d === 1 ? 4 : 5) s += `<text x="${L + (d - 1) * P + S / 2}" y="9" class="kh-dn">${d}</text>`;
    for (let m = 0; m < 12; m++) {
      const len = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
      const yy = TOP + m * P;
      s += `<text x="0" y="${yy + 8.5}" class="kh-mn" data-kh-m="${m}">${M3[m]}</text>`;
      for (let d = 1; d <= len; d++) {
        const k = `${y}-${K.pad(m + 1)}-${K.pad(d)}`;
        const x0 = L + (d - 1) * P;
        if (k > today || k < (C.metDate || '')) {
          s += `<rect x="${x0}" y="${yy}" width="${S}" height="${S}" rx="2" class="kh-off"/>`;
          continue;
        }
        const v = by[k];
        const act = v ? 0.12 + Math.min(1, v.n / max) * 0.6 : 0;
        s += `<g class="kh-d ${k === today ? 'today' : ''}" data-kh="${k}"><rect x="${x0}" y="${yy}" width="${S}" height="${S}" rx="2" class="kh-bg"/>`;
        s += v && v.her ? tri(x0, yy, 'tl', MOOD[v.her.type][0]) : act ? tri(x0, yy, 'tl', '#FF6FA3', act) : '';
        s += v && v.me ? tri(x0, yy, 'br', MOOD[v.me.type][0]) : act ? tri(x0, yy, 'br', '#FF6FA3', act) : '';
        s += `<rect x="${x0}" y="${yy}" width="${S}" height="${S}" rx="2" class="kh-hit"/></g>`;
      }
    }
    return `<svg class="kh-svg" viewBox="0 0 ${L + 31 * P} ${TOP + 12 * P}" role="img" aria-label="${y} yılının kalp haritası">${s}</svg>`;
  }
  function stats(y, mo) {
    const pre = mo == null ? String(y) : `${y}-${K.pad(mo + 1)}`;
    const ds = Object.entries(by).filter(([k]) => k.startsWith(pre));
    const cnt = (w) => {
      const c = {};
      ds.forEach(([, v]) => v[w] && (c[v[w].type] = (c[v[w].type] || 0) + 1));
      return c;
    };
    const both = ds.filter(([, v]) => v.her && v.me && SUNNY.includes(v.her.type) && SUNNY.includes(v.me.type)).length;
    const top = ds.slice().sort((a, b) => b[1].n - a[1].n)[0];
    return { days: ds.length, her: cnt('her'), me: cnt('me'), both, top, total: ds.reduce((a, [, v]) => a + v.n, 0) };
  }
  const moodRow = (c) =>
    Object.keys(MOOD)
      .filter((t) => c[t])
      .map((t) => `<span class="kh-mc"><i style="--c:${MOOD[t][0]}"></i>${MOOD[t][1]} ${c[t]}</span>`)
      .join('') || '<span class="muted">Hava paylaşılmamış</span>';
  function render() {
    if (!root || K.activeRoom !== 'kalpharita') return;
    const y = year || +T.todayKey().slice(0, 4);
    K.$('#khYears', root).innerHTML = years().map((x) => `<button type="button" class="chip ${x === y ? 'on' : ''}" data-kh-y="${x}">${x}</button>`).join('');
    if (!items) return (K.$('#khMap', root).innerHTML = '<p class="muted center">Harita çiziliyor...</p>');
    const st = stats(y);
    K.$('#khMap', root).innerHTML = `${grid(y)}<div class="kh-leg"><span class="kh-tri" aria-hidden="true"><i class="tl"></i><i class="br"></i></span><small>Sol üst <b>${K.esc(nameOf('her'))}</b>, sağ alt <b>${K.esc(nameOf('me'))}</b></small></div>
      <div class="kh-key">${Object.keys(MOOD).map((t) => `<span><i style="--c:${MOOD[t][0]}"></i>${MOOD[t][2]}</span>`).join('')}<span><i class="act"></i>Hava yok, kalede bir şeyler</span></div>`;
    K.$('#khStats', root).innerHTML = `<div class="kh-big"><span><b class="tnum">${st.days}</b><small>gün kalede</small></span><span><b class="tnum">${st.both}</b><small>ikinizin de içi güneşli</small></span><span><b class="tnum">${K.num(st.total)}</b><small>an</small></span></div>
      ${['her', 'me'].map((w) => `<p class="kh-who">${K.avatar(w, 'rp-av')}<b>${K.esc(nameOf(w))}</b></p><div class="kh-moods">${moodRow(st[w])}</div>`).join('')}
      ${st.top ? `<p class="muted small">En dolu gün: <button type="button" class="linkish" data-kh="${st.top[0]}">${K.esc(T.fmt(st.top[0]))}</button> · ${st.top[1].n} an</p>` : ''}`;
  }
  const KIND_L = { hava: '🌤️ hava', hikaye: '📸 hikâye', kalpk: '🫙 kavanoz', minnet: '🙏 minnet', tsmesaj: '📼 ses', kare: '🖼️ kare', selam: '💗 selam', kucak: '🤗 sarılma', dusun: '💭 düşündüm', ozlem: '🥺 özlem', pin: '📍 iğne', iyilik: '⭐ iyilik', opucuk: '💋 öpücük', nabiz: '💓 kalp atışı', soz: '🤞 söz', soztut: '✅ söz tutuldu', sabahses: '☀️ günaydın sesi', aynigok: '🌍 aynı gökyüzü', kedikart: '📮 kartpostal', prenses: '📖 hikâye seçimi', bulmacacoz: '🔐 şifre çözüldü', emojisarki: '🎶 emoji şarkı', emojicevap: '⭐ şarkı bilindi' };
  function showDay(k) {
    const v = by[k] || { n: 0, kinds: {} };
    const side = (w) => (v[w] ? `<p>${MOOD[v[w].type][1]} <b>${K.esc(MOOD[v[w].type][2])}</b>${v[w].note ? ` · <i>${K.esc(v[w].note)}</i>` : ''}</p>` : '<p class="muted">Hava paylaşmadı</p>');
    const m = K.ui.modal({
      label: 'Gün',
      cls: 'kh-day',
      html: `<p class="card-eyebrow">${K.esc(T.fmt(k, true))}</p><h2>${v.n ? `O gün kalede ${v.n} an` : 'Sessiz bir gün'}</h2>
        <div class="kh-dd">${['her', 'me'].map((w) => `<div>${K.avatar(w, 'rp-av')}<b>${K.esc(nameOf(w))}</b>${side(w)}</div>`).join('')}</div>
        ${Object.keys(v.kinds).length ? `<p class="kh-kinds">${Object.entries(v.kinds).map(([kd, o]) => `<span>${K.esc(KIND_L[kd] || `${o.emoji} ${o.title.length > 26 ? o.title.slice(0, 25) + '…' : o.title}`)}${o.n > 1 ? ` ×${o.n}` : ''}</span>`).join('')}</p>` : ''}
        ${v.n && K.gungun ? `<button type="button" class="btn red" data-kh-go>📖 Gün Gün'de aç</button>` : ''}`,
    });
    m.body.addEventListener('click', (e) => {
      if (!e.target.closest('[data-kh-go]')) return;
      m.close();
      K.go('gungun');
      setTimeout(() => K.gungun.open(k), 300);
    });
  }
  function showMonth(mo) {
    const y = year || +T.todayKey().slice(0, 4);
    const st = stats(y, mo);
    K.ui.modal({
      label: 'Ay',
      cls: 'kh-day',
      html: `<p class="card-eyebrow">${K.MONTHS[mo]} ${y}</p><h2>${st.days} gün · ${st.total} an</h2>${['her', 'me'].map((w) => `<p class="kh-who">${K.avatar(w, 'rp-av')}<b>${K.esc(nameOf(w))}</b></p><div class="kh-moods">${moodRow(st[w])}</div>`).join('')}<p class="muted">İkinizin de içinin güneşli olduğu gün: <b>${st.both}</b></p>`,
    });
  }

  K.room({
    id: 'kalpharita',
    wing: 'kalp',
    title: 'Kalp Haritası',
    sub: 'Bir yılın kalbi tek sayfada',
    icon: 'calendar',
    color: '#FFE3EE',
    hidden: () => !D.kalpharita || !K.cloud || !K.cloud.enabled,
    init(el) {
      root = el;
      el.innerHTML = `<div class="room-intro">${K.paras(KH().intro || [])}</div>
        <div class="kh-years" id="khYears"></div>
        <section class="card kh-card" id="khMap"></section>
        <section class="card kh-stats" id="khStats"></section>`;
      el.addEventListener('click', (e) => {
        const yb = e.target.closest('[data-kh-y]');
        if (yb) return (year = +yb.dataset.khY), render();
        const mb = e.target.closest('[data-kh-m]');
        if (mb) return showMonth(+mb.getAttribute('data-kh-m'));
        const d = e.target.closest('[data-kh]');
        if (d) return showDay(d.getAttribute('data-kh'));
      });
    },
    async enter() {
      render();
      const all = await K.akis.all();
      items = all;
      build();
      render();
    },
  });
})();
