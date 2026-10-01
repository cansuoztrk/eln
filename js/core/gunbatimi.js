/* Kale 2.0 — Gün Batımı Köprüsü: güneş önce Bakü'de, yaklaşık bir saat sonra İstanbul'da batar. Bakü'de batmadan
   bir saat önce ana salonda (Bugün sekmesi) bir kart belirir; iki şehrin göğü ve iki güneş canlı olarak alçalır.
   Arada "Güneşi birlikte uğurla"ya basılır; ikiniz de basınca o günün gün batımı ortak olur. Kayıt: gunbatimi {day} */
(function () {
  'use strict';
  const K = window.K;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  const GB = () => D.gunbatimi || { title: 'Gün Batımı Köprüsü', button: 'Güneşi birlikte uğurla' };
  const CITY = { baku: [40.4093, 49.8671], ist: [41.0082, 28.9784] };
  const mine = () => (K.isOwner() ? 'me' : 'her');
  const other = () => (K.isOwner() ? 'her' : 'me');
  const nameOf = (w) => (w === 'me' ? C.myPet : C.herPet);
  let rows = [], loaded = false;
  const rad = Math.PI / 180;

  // Gün doğumu/batımı denklemi (NOAA'nın sadeleştirilmiş hâli, birkaç dakikalık hassasiyet). key: 'YYYY-MM-DD'
  function sunset(key, [lat, lng]) {
    const [y, m, d] = key.split('-').map(Number);
    const jd = Date.UTC(y, m - 1, d, 12) / 864e5 + 2440587.5;
    const n = Math.round(jd - 2451545.0 + 0.0008);
    const js = n - lng / 360;
    const M = (357.5291 + 0.98560028 * js) % 360;
    const Cc = 1.9148 * Math.sin(M * rad) + 0.02 * Math.sin(2 * M * rad) + 0.0003 * Math.sin(3 * M * rad);
    const L = (M + Cc + 180 + 102.9372) % 360;
    const jt = 2451545.0 + js + 0.0053 * Math.sin(M * rad) - 0.0069 * Math.sin(2 * L * rad);
    const dec = Math.asin(Math.sin(L * rad) * Math.sin(23.4397 * rad));
    const cosw = (Math.sin(-0.833 * rad) - Math.sin(lat * rad) * Math.sin(dec)) / (Math.cos(lat * rad) * Math.cos(dec));
    const w = Math.acos(Math.max(-1, Math.min(1, cosw))) / rad;
    return Math.round((jt + w / 360 - 2440587.5) * 864e5);
  }
  const hmAt = (ms, tz) => {
    const p = T.parts(tz, new Date(ms));
    return `${K.pad(p.h)}:${K.pad(p.mi)}`;
  };
  function state(now = T.now().getTime()) {
    const k = T.todayKey();
    const b = sunset(k, CITY.baku), i = sunset(k, CITY.ist);
    let phase = '';
    if (now >= b - 60 * 6e4 && now < b) phase = 'before';
    else if (now >= b && now < i) phase = 'between';
    else if (now >= i && now < i + 40 * 6e4) phase = 'after';
    return { k, b, i, phase, now };
  }
  const pressed = (k, w) => rows.some((r) => r.data.day === k && r.who === w);
  // Güneşin gökteki yüksekliği: batıma 90 dk kala tepede (%0), batımda ufukta (%100), sonra altında
  const sink = (now, at) => Math.max(-10, Math.min(118, 100 - ((at - now) / (90 * 6e4)) * 100));

  function sky(s, name, tz, at, side) {
    const y = sink(s.now, at);
    const gone = s.now >= at;
    return `<div class="gb-sky ${side} ${gone ? 'gone' : ''}" style="--y:${y.toFixed(1)}%"><span class="gb-sun" aria-hidden="true"></span><span class="gb-sea" aria-hidden="true"></span>
      <p class="gb-city"><b>${K.esc(name)}</b><small>${gone ? 'Güneş battı' : `Batış ${hmAt(at, tz)}`} · şimdi ${K.esc(T.hm(tz))}</small></p></div>`;
  }
  function render() {
    const box = K.$('#gunbatimi');
    if (!box) return;
    const s = state();
    const on = Boolean(s.phase);
    box.hidden = !on;
    if (!on) return (box.innerHTML = '');
    const me = pressed(s.k, mine()), ot = pressed(s.k, other());
    const both = me && ot;
    const left = Math.max(0, Math.round((s.i - s.now) / 6e4));
    const line = both ? GB().both : s.phase === 'before' ? GB().before : s.phase === 'between' ? String(GB().between || '').replace('{n}', left) : GB().after;
    box.innerHTML = `<div class="gb-card ${s.phase} ${both ? 'both' : ''}"><p class="card-eyebrow">🌅 ${K.esc(GB().title)}</p>
      <div class="gb-skies">${sky(s, C.myCity, C.tzIstanbul, s.i, 'west')}${sky(s, C.herCity, C.tzBaku, s.b, 'east')}</div>
      <p class="gb-line">${K.esc(line)}</p>
      <div class="gb-who"><span class="${me ? 'on' : ''}">${me ? '☀️' : '○'} Sen</span><span class="${ot ? 'on' : ''}">${ot ? '☀️' : '○'} ${K.esc(nameOf(other()))}</span></div>
      ${me || s.phase === 'after' ? '' : `<button type="button" class="btn red" data-gb>${K.esc(GB().button)}</button>`}</div>`;
  }
  async function press(btn) {
    if (!K.cloud || !K.cloud.enabled) return K.fx.toast('Bunun için bulut gerekiyor.');
    const s = state();
    if (pressed(s.k, mine())) return;
    btn && (btn.disabled = true);
    const r = await K.cloud.add('gunbatimi', { day: s.k });
    if (!r) {
      btn && (btn.disabled = false);
      return K.fx.toast('Gönderilemedi.');
    }
    if (!rows.some((x) => x.id === r.id)) rows.push(r);
    K.cloud.send('gunbatimi', { day: s.k });
    const both = pressed(s.k, other());
    K.audio.sfx.chime();
    if (both) {
      K.stickers.award('gunbatimi');
      K.fx.confetti && K.fx.confetti();
    }
    K.ping(`🌅 ${K.meName()} güneşi seninle uğurluyor`, both ? 'İkiniz de bastınız: bugünün gün batımı ortak.' : 'Sen de bas, güneşi birlikte uğurlayın.', ['sunrise'], { click: K.roomUrl('') });
    K.fx.toast(both ? `🌅 <b>Birlikte uğurladınız.</b> ${K.esc(GB().both)}` : `🌅 Gönderildi. ${K.esc(nameOf(other()))} da basınca köprü tamamlanır.`, { duration: 4000 });
    render();
  }

  K.on('built', () => {
    const sp = K.$('#special');
    if (sp && !K.$('#gunbatimi')) sp.insertAdjacentHTML('beforebegin', '<section class="wrap gunbatimi" id="gunbatimi" hidden></section>');
    render();
  });
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-gb]');
    if (b) press(b);
  });
  K.on('cloud', async (ok) => {
    if (!ok) return;
    rows = await K.cloud.list('gunbatimi', 60);
    loaded = true;
    K.cloud.on('gunbatimi', (r) => {
      if (rows.some((x) => x.id === r.id)) return;
      rows.push(r);
      if (r.who !== mine() && r.data.day === T.todayKey()) {
        const both = pressed(r.data.day, mine());
        if (both) K.stickers.award('gunbatimi');
        K.fx.toast(both ? `🌅 <b>${K.esc(nameOf(r.who))} da bastı.</b> Güneşi birlikte uğurladınız.` : `🌅 <b>${K.esc(nameOf(r.who))} güneşi seninle uğurluyor.</b> Ana salonda sen de bas.`, { duration: 7000 });
      }
      render();
    });
    render();
  });
  setInterval(() => !K.activeRoom && render(), 30000);
  K.gunbatimi = { state, sunset: (k, c) => sunset(k, CITY[c] || CITY.baku), loaded: () => loaded, render };
})();
