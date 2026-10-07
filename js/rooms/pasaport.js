/* Oda: İlk Buluşma Pasaportu — birlikte gittiğimiz her yer pasaporta bir damga basar. Haritamızdaki "Gittik!" işaretleri
   kendiliğinden damga olur; haritada olmayan bir yer (bir kafe, bir sokak) elle de damgalanabilir. Her damganın şekli,
   rengi ve eğimi yere göre değişir; altında tarih ve kısa bir not.
   Kayıtlar: damga {name, place, day, note} · (okunur) pin, pingittik */
(function () {
  'use strict';
  const K = window.K;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  const nameOf = (w) => (w === 'me' ? C.myPet : C.herPet);
  const RENK = ['#1f4e9c', '#b3123b', '#1f6e55', '#6b3fa0', '#a0581c', '#24356e'];
  let pins = [], gittik = [], damgalar = [], root = null;
  function liste() {
    // Haritadaki yer: tohum iğneler (seed:...) ve hayal iğneleri K.harita'dan, öbürleri doğrudan 'pin' kaydından
    const pinOf = (ref) => {
      const h = K.harita && K.harita.places && K.harita.places().find((p) => p.ref === ref);
      if (h) return h;
      const r = pins.find((x) => x.id === ref);
      return r ? r.data : null;
    };
    const h = gittik.map((g) => {
      const p = pinOf(g.data.ref);
      return p ? { id: g.id, name: p.name, place: p.place || '', emoji: p.emoji || '', day: g.data.day || T.key(T.baku(new Date(g.at))), note: g.data.note || '', who: g.who } : null;
    });
    const d = damgalar.map((r) => ({ id: r.id, name: r.data.name, place: r.data.place || '', emoji: '', day: r.data.day, note: r.data.note || '', who: r.who }));
    return h.filter(Boolean).concat(d).sort((a, b) => (a.day || '').localeCompare(b.day || ''));
  }
  function damga(x, i) {
    const r = K.rng(K.hash(x.id));
    const c = RENK[Math.floor(r() * RENK.length)], tilt = (r() * 24 - 12).toFixed(1), sekil = Math.floor(r() * 3);
    const ad = K.esc(x.name.toLocaleUpperCase('tr').slice(0, 22));
    const tarih = x.day ? K.esc(x.day.split('-').reverse().join('.')) : '';
    const cerceve = sekil === 0 ? `<circle cx="70" cy="70" r="62" fill="none" stroke="${c}" stroke-width="4"/><circle cx="70" cy="70" r="52" fill="none" stroke="${c}" stroke-width="1.6" stroke-dasharray="3 3"/>` : sekil === 1 ? `<rect x="8" y="22" width="124" height="96" rx="10" fill="none" stroke="${c}" stroke-width="4"/><rect x="16" y="30" width="108" height="80" rx="6" fill="none" stroke="${c}" stroke-width="1.6"/>` : `<path d="M70 6 L132 40 L132 100 L70 134 L8 100 L8 40 Z" fill="none" stroke="${c}" stroke-width="4"/>`;
    return `<figure class="ps-damga" style="--tilt:${tilt}deg;--c:${c}"><svg viewBox="0 0 140 140" aria-hidden="true">${cerceve}<text x="70" y="${sekil === 1 ? 56 : 58}" text-anchor="middle" class="ps-ad">${ad}</text><text x="70" y="78" text-anchor="middle" class="ps-yer">${K.esc((x.place || '').toLocaleUpperCase('tr').slice(0, 20))}</text><text x="70" y="98" text-anchor="middle" class="ps-tarih">${tarih}</text>${x.emoji ? `<text x="70" y="${sekil === 1 ? 40 : 36}" text-anchor="middle" font-size="16">${K.esc(x.emoji)}</text>` : ''}</svg><figcaption>${x.note ? K.esc(x.note) : `${i + 1}. damga`}</figcaption></figure>`;
  }
  function render() {
    if (!root || K.activeRoom !== 'pasaport') return;
    const l = liste();
    K.$('#psKapak', root).innerHTML = `<div class="ps-kapak"><small>İLK BULUŞMA</small><b>PASAPORT</b><svg viewBox="0 0 60 60" aria-hidden="true"><circle cx="30" cy="30" r="24" fill="none" stroke="currentColor" stroke-width="2.5"/><path d="M6 30h48M30 6c-10 10-10 38 0 48M30 6c10 10 10 38 0 48" fill="none" stroke="currentColor" stroke-width="2"/></svg><span>${K.esc(C.herPet)} · ${K.esc(C.myPet)}</span><em>${l.length} damga</em></div>`;
    K.$('#psSayfa', root).innerHTML = l.length ? l.map(damga).join('') : '<p class="muted center">İlk damga ilk birlikte gittiğimiz yer olacak. Haritada bir yere "Gittik!" deyince buraya basılır.</p>';
  }
  K.on('cloud', async (ok) => {
    if (!ok) return;
    [pins, gittik, damgalar] = await Promise.all([K.cloud.list('pin', 500), K.cloud.list('pingittik', 300), K.cloud.list('damga', 300)]);
    K.cloud.on('pin', (r) => pins.some((x) => x.id === r.id) || pins.push(r));
    K.cloud.on('pingittik', (r) => gittik.some((x) => x.id === r.id) || (gittik.push(r), render()));
    K.cloud.on('damga', (r) => damgalar.some((x) => x.id === r.id) || (damgalar.push(r), render()));
  });
  K.room({
    id: 'pasaport',
    wing: 'hazine',
    title: 'İlk Buluşma Pasaportu',
    sub: 'Birlikte gittiğimiz yerler',
    icon: 'ticket',
    color: '#E7EEF9',
    hidden: () => !K.cloud || !K.cloud.enabled,
    badge: () => (liste().length ? String(liste().length) : ''),
    init(el) {
      root = el;
      el.innerHTML = `<div class="room-intro"><p>Birlikte gittiğimiz her yer pasaporta bir damga basar. <a href="#harita">Haritamızdaki</a> "Gittik!" işaretleri kendiliğinden damga olur.</p></div>
        <div id="psKapak"></div><section class="ps-sayfa" id="psSayfa"></section>
        <details class="card ps-yeni"><summary>🖋 Elle damga bas</summary><input class="input" id="psAd" maxlength="40" placeholder="Yer (Nizami Caddesi'ndeki kafe)"><input class="input" id="psYer" maxlength="30" placeholder="Şehir (Bakü)"><input class="input" id="psNot" maxlength="60" placeholder="Kısa not (istersen)"><input class="input" type="date" id="psGun"><button type="button" class="btn red small" data-ps-bas>Damgala</button></details>`;
      K.$('#psGun', el).value = T.todayKey();
      el.addEventListener('click', async (e) => {
        if (!e.target.closest('[data-ps-bas]')) return;
        const name = K.$('#psAd', root).value.trim();
        if (!name) return K.$('#psAd', root).focus();
        const r = await K.cloud.add('damga', { name, place: K.$('#psYer', root).value.trim(), note: K.$('#psNot', root).value.trim(), day: K.$('#psGun', root).value || T.todayKey() });
        if (!r) return;
        damgalar.some((x) => x.id === r.id) || damgalar.push(r);
        ['#psAd', '#psYer', '#psNot'].forEach((s) => (K.$(s, root).value = ''));
        K.audio.sfx && K.audio.sfx.pop && K.audio.sfx.pop();
        K.stickers.award('damga');
        K.ping(`🛂 Pasaporta yeni bir damga: ${name}`, 'İlk Buluşma Pasaportu', ['passport_control'], { click: K.roomUrl('pasaport') });
        render();
      });
    },
    enter() {
      render();
    },
  });
})();
