/* Oda: Gök Takvimi — önümüzdeki on iki ayın gökyüzü: dolunaylar (geleneksel adlarıyla), yıldız kayması geceleri (o gece
   ay ne kadar parlak, izlemeye uygun mu) ve 2 Ağustos 2027 güneş tutulması (İstanbul'dan %59, Bakü'den %27). Her olayın
   gecesi bir dilek kutusu açılır: ikiniz de dileğinizi yazarsınız, dilekler mühürlenir ve tam bir yıl sonra açılır.
   Kayıtlar: dilek {ev, title, text, open} */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  const mine = () => (K.isOwner() ? 'me' : 'her');
  const nameOf = (w) => (w === 'me' ? C.myPet : C.herPet);
  const MOON_NAMES = ['Kurt Ayı', 'Kar Ayı', 'Solucan Ayı', 'Pembe Ay', 'Çiçek Ayı', 'Çilek Ayı', 'Geyik Ayı', 'Mersin Balığı Ayı', 'Hasat Ayı', 'Avcı Ayı', 'Kunduz Ayı', 'Soğuk Ay'];
  const SHOWERS = [
    ['quadrantid', '01-03', 'Kuadrantid yağmuru', 'Saatte 40 yıldıza kadar. Gece yarısından sonra kuzeydoğuya bak.'],
    ['lyrid', '04-22', 'Lirid yağmuru', 'Saatte 15-20 yıldız, Vega\'nın yakınından.'],
    ['etaaquariid', '05-06', 'Eta Akuarid yağmuru', 'Halley kuyruklu yıldızının tozu; sabaha karşı.'],
    ['perseid', '08-12', 'Perseid yağmuru', 'Yılın en güzeli: saatte 60 yıldıza kadar, sıcak bir yaz gecesi.'],
    ['draconid', '10-08', 'Drakonid yağmuru', 'Akşam saatlerinde, kuzey gökyüzünde.'],
    ['orionid', '10-21', 'Orionid yağmuru', 'Halley\'in tozu yine; tam da 21\'imize denk gelen yağmur.'],
    ['leonid', '11-17', 'Leonid yağmuru', 'Hızlı ve parlak; sabaha karşı.'],
    ['geminid', '12-13', 'Geminid yağmuru', 'Kışın en bereketlisi: saatte 100 yıldıza kadar.'],
    ['ursid', '12-22', 'Ursid yağmuru', 'Yılın en uzun gecesinin ertesi; küçük bir hediye.'],
  ];
  const ECLIPSES = [{ key: 'tutulma-2027', day: '2027-08-02', title: 'Güneş tutulması', desc: 'Yüzyılın en uzun tutulması. İstanbul\'dan güneşin %59\'u kapanır (en çok 12:39), Bakü\'den %27\'si (en çok 14:11). Gözünü korumadan bakma: tutulma gözlüğü şart.' }];
  let rows = [], loaded = false, root = null;

  const illum = (ms) => (1 - Math.cos(2 * Math.PI * K.gok.phase(new Date(ms)))) / 2;
  const bakuDay = (ms) => T.key(T.baku(new Date(ms)));
  function showers() {
    const today = T.todayKey(), y = T.baku().y;
    return SHOWERS.map(([key, mmdd, name, desc]) => {
      const day = `${y}-${mmdd}` >= today ? `${y}-${mmdd}` : `${y + 1}-${mmdd}`;
      const il = illum(T.at(day).getTime() + 22 * 36e5);
      return { key: `${key}-${day.slice(0, 4)}`, day, name, desc: `${desc} ${il > 0.6 ? 'O gece ay parlak; sönük olanlar görünmez.' : il < 0.3 ? 'Ay karanlık: izlemek için harika bir gece.' : 'Ay yarım; yine de güzel.'}`, il };
    }).sort((a, b) => a.day.localeCompare(b.day));
  }
  function events() {
    const now = Date.now(), today = T.todayKey(), limit = T.key(T.baku(new Date(now + 366 * 864e5)));
    const out = [];
    K.gok.fullMoons(now - 864e5, 14).forEach((t) => {
      const day = bakuDay(t);
      if (day < today || day > limit) return;
      const mo = T.baku(new Date(t)).mo;
      const vis = ['ist', 'baku'].map((c) => K.gok.moonAlt(new Date(T.at(day).getTime() + (c === 'ist' ? 23 : 22) * 36e5 - (c === 'ist' ? C.tzIstanbul - C.tzBaku : 0) * 36e5), c) > 5);
      out.push({ key: `dolunay-${day}`, kind: 'dolunay', day, at: t, emoji: '🌕', title: MOON_NAMES[mo - 1], desc: `Dolunay. Bakü ${hm(t, C.tzBaku)}, İstanbul ${hm(t, C.tzIstanbul)}. ${vis[0] && vis[1] ? 'Gece ikinizin gökyüzünde de.' : 'Gece yükselince bak.'} İkiniz de aynı aya bakın.` });
    });
    showers().forEach((s) => s.day <= limit && out.push({ key: s.key, kind: 'yagmur', day: s.day, emoji: '🌠', title: s.name, desc: s.desc }));
    ECLIPSES.forEach((e) => e.day >= today && e.day <= limit && out.push(Object.assign({ kind: 'tutulma', emoji: '🌘' }, e)));
    return out.sort((a, b) => a.day.localeCompare(b.day));
  }
  const hm = (ms, tz) => {
    const p = T.parts(tz, new Date(ms));
    return `${K.pad(p.h)}:${K.pad(p.mi)}`;
  };
  // Dilek kutusu: olayın günü (Bakü takvimi) ve ertesi sabaha kadar açık
  const openEvent = () => {
    const today = T.todayKey(), h = T.baku().h;
    const y = T.key(T.baku(new Date(Date.now() - 864e5)));
    return events().find((e) => e.day === today) || (h < 7 ? events().concat(pastToday(y)).find((e) => e.day === y) : null);
  };
  const pastToday = (y) => {
    const f = K.gok.fullMoons(T.at(y).getTime() - 864e5, 2).find((t) => bakuDay(t) === y);
    return f ? [{ key: `dolunay-${y}`, kind: 'dolunay', day: y, emoji: '🌕', title: MOON_NAMES[T.baku(new Date(f)).mo - 1] }] : [];
  };
  function render() {
    if (!root || K.activeRoom !== 'goktakvimi') return;
    const evs = events();
    const ev = openEvent();
    const myW = ev && rows.find((r) => r.data.ev === ev.key && r.who === mine());
    const ph = K.gok.phase(new Date());
    K.$('#gtSimdi', root).innerHTML = `<div class="gt-ay">${A.moonSvg ? A.moonSvg(ph) : '🌙'}</div><div><p class="card-eyebrow">Bu gece</p><p><b>Ay %${Math.round(illum(Date.now()) * 100)} aydınlık</b>${ph < 0.5 ? ', büyüyor' : ', küçülüyor'}.</p><p class="muted small">Bir sonraki dolunay: ${K.esc(T.fmt(new Date(K.gok.fullMoons(Date.now(), 1)[0])))}.</p></div>`;
    K.$('#gtKutu', root).innerHTML = ev
      ? `<div class="gt-kutu"><p class="card-eyebrow">${ev.emoji} Bu gecenin dilek kutusu açık · ${K.esc(ev.title)}</p>${
          myW
            ? `<p class="gt-muhur">🔒 Dileğin mühürlendi. ${K.esc(T.fmt(new Date(myW.data.open)))} günü açılacak.</p>`
            : `<textarea class="input" id="gtDilek" maxlength="200" rows="2" placeholder="Bu gece için bir dilek..."></textarea><div class="row"><button type="button" class="btn red" data-gt-dilek="${K.esc(ev.key)}" data-t="${K.esc(ev.title)}">🌠 Dileğimi kutuya at</button></div>`
        }<p class="muted small">${rows.filter((r) => r.data.ev === ev.key).length}/2 dilek kutuda. Dilekler tam bir yıl sonra açılır.</p></div>`
      : '';
    const months = {};
    evs.forEach((e) => (months[e.day.slice(0, 7)] = months[e.day.slice(0, 7)] || []).push(e));
    K.$('#gtListe', root).innerHTML = Object.entries(months)
      .map(([m, list]) => `<section class="gt-ay-blok"><h3>${K.MONTHS[+m.slice(5) - 1]} ${m.slice(0, 4)}</h3>${list
        .map((e) => `<article class="gt-olay ${e.kind}"><span class="gt-gun"><b>${+e.day.slice(8)}</b><i>${e.emoji}</i></span><div><b>${K.esc(e.title)}</b><p>${K.esc(e.desc)}</p>${rows.some((r) => r.data.ev === e.key) ? `<small>🔒 ${rows.filter((r) => r.data.ev === e.key).length} dilek mühürlü</small>` : ''}</div></article>`)
        .join('')}</section>`)
      .join('');
    const opened = rows.filter((r) => r.data.open <= Date.now()).sort((a, b) => b.data.open - a.data.open);
    K.$('#gtAcilan', root).innerHTML = opened.length
      ? `<p class="card-eyebrow">Bir yıl önceki dilekler</p>${opened.map((r) => `<blockquote class="gt-acik"><p class="hand">${K.esc(r.data.text)}</p><footer>${K.esc(nameOf(r.who))} · ${K.esc(r.data.title)} · ${K.esc(T.fmt(new Date(r.at)))}</footer></blockquote>`).join('')}`
      : `<p class="muted small center">Mühürlü dilekler: ${rows.length}. İlki ${rows.length ? K.esc(T.fmt(new Date(Math.min(...rows.map((r) => r.data.open))))) + ' günü' : 'ilk gök olayından bir yıl sonra'} açılacak.</p>`;
  }
  async function dilek(btn) {
    const ta = K.$('#gtDilek', root);
    const text = (ta.value || '').trim().slice(0, 200);
    if (!text) return ta.focus();
    btn.disabled = true;
    const r = await K.cloud.add('dilek', { ev: btn.dataset.gtDilek, title: btn.dataset.t, text, open: Date.now() + 365 * 864e5 });
    btn.disabled = false;
    if (!r) return K.fx.toast('Kutuya atılamadı.');
    rows.push(r);
    K.audio.sfx.sparkle();
    K.fx.rain({ count: 24, shapes: ['star'], colors: ['#FFFFFF', '#FFE38A', '#CDB8FF'] });
    K.stickers.award('goktakvimi');
    K.ping('🌠 Dilek kutusuna bir dilek atıldı', `${K.meName()} bu geceki gök olayında bir dilek tuttu. Bir yıl sonra açılacak; senin dileğin de kutuya gelsin.`, ['sparkles'], { click: K.roomUrl('goktakvimi') });
    render();
  }
  K.on('cloud', async (ok) => {
    if (!ok) return;
    rows = await K.cloud.list('dilek', 800);
    loaded = true;
    K.cloud.on('dilek', (r) => rows.some((x) => x.id === r.id) || (rows.push(r), render()));
  });
  K.specialHooks = (K.specialHooks || []).concat(() => {
    if (!loaded || !K.gok) return [];
    const ev = openEvent();
    if (!ev || rows.some((r) => r.data.ev === ev.key && r.who === mine()) || T.baku().h < 17 && ev.day === T.todayKey()) return [];
    return [{ key: 'goktakvimi', icon: 'moon', title: `${ev.emoji} Bu gece ${ev.title}`, text: 'Gök Takvimi\'nin dilek kutusu açık. Dilekler bir yıl sonra açılacak.', room: 'goktakvimi', cta: 'Dilek tut' }];
  });

  K.room({
    id: 'goktakvimi',
    wing: 'mevsim',
    title: 'Gök Takvimi',
    sub: 'Dolunaylar, yıldız kaymaları, tutulmalar',
    icon: 'moon',
    color: '#E6E2FF',
    hidden: () => !K.gok,
    badge: () => (openEvent() ? '1' : ''),
    init(el) {
      root = el;
      el.innerHTML = `<div class="room-intro"><p>Önümüzdeki on iki ayın gökyüzü. Her gök olayının gecesi bir dilek kutusu açılıyor: ikimiz de dileğimizi yazıyoruz, kutu mühürleniyor ve dilekler tam bir yıl sonra açılıyor.</p></div>
        <section class="card gt-simdi" id="gtSimdi"></section>
        <div id="gtKutu"></div>
        <div class="gt-liste" id="gtListe"></div>
        <section class="card" id="gtAcilan"></section>`;
      el.addEventListener('click', (e) => {
        const b = e.target.closest('[data-gt-dilek]');
        b && (K.cloud && K.cloud.enabled ? dilek(b) : K.fx.toast('Dilek kutusu için ortak kale gerekiyor.'));
      });
    },
    enter() {
      render();
    },
  });
  K.goktakvimi = { events, showers };
})();
