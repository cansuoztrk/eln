/* Oda: Güneş Postası — güneş Bakü'de İstanbul'dan yaklaşık 84 dakika önce doğar. Eln sabah güneşine bir not iliştirir;
   not, güneşle birlikte batıya yol alır ve İstanbul'da güneş doğduğu an Ardoş'a ulaşır. Ardoş'un notları akşam
   İstanbul'da batan güneşle yola çıkar; gece onları doğuya taşır, Bakü'de sabah doğan güneşle Eln'e varır.
   Yoldaki not açılmaz; vardığı an telefona "güneş sana bir not getirdi" düşer. Kayıtlar: gunes {text, dep, arr, yon} */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  const mine = () => (K.isOwner() ? 'me' : 'her');
  const nameOf = (w) => (w === 'me' ? C.myPet : C.herPet);
  let rows = [], loaded = false, root = null, timer = 0;

  const dayKeyAt = (ms, tz) => T.key(T.parts(tz, new Date(ms)));
  // Bir sonraki çıkış ve varış: Eln için Bakü gün doğumu → İstanbul gün doğumu; Ardoş için İstanbul gün batımı → Bakü gün doğumu
  function route(w, now = Date.now()) {
    if (w === 'her') {
      for (let i = 0; i < 3; i++) {
        const k = dayKeyAt(now + i * 864e5, C.tzBaku);
        const b = K.gok.sun(k, 'baku'), s = K.gok.sun(k, 'ist');
        // Güneş Bakü'de doğmuş ama İstanbul'a henüz varmamışsa bugünkü güneşe yetişir
        if (s.rise > now) return { yon: 'gunes', dep: Math.max(b.rise, now), arr: s.rise };
      }
    } else {
      for (let i = 0; i < 3; i++) {
        const k = dayKeyAt(now + i * 864e5, C.tzIstanbul);
        const s = K.gok.sun(k, 'ist');
        if (s.set > now) {
          const k2 = dayKeyAt(s.set + 12 * 36e5, C.tzBaku);
          return { yon: 'gece', dep: s.set, arr: K.gok.sun(k2, 'baku').rise };
        }
      }
    }
    return null;
  }
  const hm = (ms, tz) => {
    const p = T.parts(tz, new Date(ms));
    return `${K.pad(p.h)}:${K.pad(p.mi)}`;
  };
  const when = (ms, tz) => {
    const today = T.key(T.parts(tz)), d = T.key(T.parts(tz, new Date(ms)));
    return `${d === today ? 'bugün' : d === T.key(T.parts(tz, new Date(Date.now() + 864e5))) ? 'yarın' : T.fmtShort(new Date(ms))} ${hm(ms, tz)}`;
  };
  const tzOf = (w) => (w === 'me' ? C.tzIstanbul : C.tzBaku);
  function sky() {
    const now = Date.now();
    const pos = (w) => {
      const r = rows.filter((x) => x.who === w && x.data.arr > now).sort((a, b) => a.data.arr - b.data.arr)[0];
      if (!r) return null;
      const p = K.clamp((now - r.data.dep) / (r.data.arr - r.data.dep), 0, 1);
      return { r, p: now < r.data.dep ? 0 : p };
    };
    const her = pos('her'), me = pos('me');
    const sx = (p) => 88 - p * 76; // Bakü (sağ) → İstanbul (sol)
    const mx = (p) => 12 + p * 76; // İstanbul → Bakü
    const arcY = (x) => 62 - Math.sin((Math.PI * (x - 12)) / 76) * 40;
    return `<svg class="gp-sky" viewBox="0 0 100 74" aria-hidden="true">
      <path d="M12 62 Q50 -18 88 62" fill="none" stroke="rgba(255,255,255,.7)" stroke-width=".6" stroke-dasharray="1.5 2"/>
      <g class="gp-sehir" transform="translate(4 52)"><rect width="16" height="14" rx="3"/><text x="8" y="9.5" text-anchor="middle">İST</text></g>
      <g class="gp-sehir" transform="translate(80 52)"><rect width="16" height="14" rx="3"/><text x="8" y="9.5" text-anchor="middle">BAKÜ</text></g>
      ${her ? `<g class="gp-gunes" transform="translate(${sx(her.p).toFixed(1)} ${arcY(sx(her.p)).toFixed(1)})"><circle r="5.5"/>${[0, 45, 90, 135, 180, 225, 270, 315].map((a) => `<line x1="0" y1="-7.5" x2="0" y2="-9.5" transform="rotate(${a})"/>`).join('')}<path d="M3 3 l4 4 h5 v-4 h-5 z" class="gp-zarf"/></g>` : ''}
      ${me ? `<g class="gp-ay" transform="translate(${mx(me.p).toFixed(1)} ${arcY(mx(me.p)).toFixed(1)})"><path d="M2 -5 a5.5 5.5 0 1 0 0 10 a4 4 0 1 1 0 -10z"/><path d="M-12 3 l4 4 h5 v-4 h-5 z" class="gp-zarf"/></g>` : ''}
    </svg>`;
  }
  function render() {
    if (!root || K.activeRoom !== 'gunesposta') return;
    const w = mine();
    const r = route(w);
    const now = Date.now();
    K.$('#gpGok', root).innerHTML = sky();
    K.$('#gpYol', root).innerHTML = r
      ? w === 'her'
        ? `☀️ Notun Bakü'de güneş doğunca yola çıkar (<b>${when(r.dep, C.tzBaku)}</b>) ve İstanbul'a güneşle birlikte varır (<b>${when(r.arr, C.tzIstanbul)}</b>, İstanbul saati).`
        : `🌙 Notun İstanbul'da güneş batınca yola çıkar (<b>${when(r.dep, C.tzIstanbul)}</b>); gece onu doğuya taşır, Bakü'ye sabah güneşiyle varır (<b>${when(r.arr, C.tzBaku)}</b>, Bakü saati).`
      : '';
    const inc = rows.filter((x) => x.who !== w && x.data.arr <= now).sort((a, b) => b.data.arr - a.data.arr);
    const yolda = rows.filter((x) => x.data.arr > now).sort((a, b) => a.data.arr - b.data.arr);
    const sent = rows.filter((x) => x.who === w && x.data.arr <= now).sort((a, b) => b.data.arr - a.data.arr).slice(0, 6);
    K.$('#gpYolda', root).innerHTML = yolda.length
      ? `<p class="card-eyebrow">Yolda</p>${yolda
          .map((x) => {
            const p = K.clamp((now - x.data.dep) / (x.data.arr - x.data.dep), 0, 1);
            return `<div class="gp-yolda ${x.data.yon}"><span>${x.data.yon === 'gunes' ? '☀️' : '🌙'}</span><div><b>${x.who === w ? 'Senin notun' : `${K.esc(K.ek(nameOf(x.who), 'den'))} bir not`}</b><small>${now < x.data.dep ? `${x.data.yon === 'gunes' ? 'Güneşi' : 'Gün batımını'} bekliyor · ` : ''}varış ${K.esc(when(x.data.arr, tzOf(x.who === 'me' ? 'her' : 'me')))}</small><i style="--p:${(now < x.data.dep ? 0 : p * 100).toFixed(1)}%"></i></div></div>`;
          })
          .join('')}`
      : '';
    K.$('#gpGelen', root).innerHTML = inc.length
      ? inc.map((x) => `<article class="gp-not ${x.data.yon}"><header>${x.data.yon === 'gunes' ? '☀️ Güneşle geldi' : '🌙 Geceyle geldi'} · ${K.esc(T.fmt(new Date(x.data.arr)))}</header>${K.muhur ? K.muhur.mini(x.who) : ''}<p class="hand">${K.esc(x.data.text)}</p><footer>${K.esc(nameOf(x.who))}</footer></article>`).join('')
      : `<p class="muted center">${w === 'me' ? `${K.esc(C.herPet)} güneşe bir not iliştirince burada, İstanbul'da güneş doğduğu an açılır.` : `${K.esc(C.myPet)} akşam güneşine bir not verince burada, sabah güneşiyle açılır.`}</p>`;
    K.$('#gpGiden', root).innerHTML = sent.length ? `<p class="card-eyebrow">Ulaştırdıkların</p><ul class="gp-sent">${sent.map((x) => `<li><span>${x.data.yon === 'gunes' ? '☀️' : '🌙'}</span>${K.esc(x.data.text.slice(0, 60))}${x.data.text.length > 60 ? '…' : ''}<small>${K.esc(K.ago(x.data.arr))}</small></li>`).join('')}</ul>` : '';
  }
  async function send(btn) {
    const ta = K.$('#gpText', root);
    const text = (ta.value || '').trim().slice(0, 280);
    if (!text) return ta.focus();
    const r = route(mine());
    if (!r) return K.fx.toast('Güneşin yolu hesaplanamadı.');
    btn.disabled = true;
    const row = await K.cloud.add('gunes', Object.assign({ text }, r));
    btn.disabled = false;
    if (!row) return K.fx.toast('Gönderilemedi.');
    ta.value = '';
    rows.push(row);
    K.audio.sfx.whoosh();
    K.fx.rain({ count: 18, shapes: mine() === 'her' ? ['star'] : ['heart'], colors: mine() === 'her' ? ['#FFD34E', '#FFB347', '#FFE38A'] : ['#CDB8FF', '#8F73E6', '#FFFFFF'] });
    K.stickers.award('gunesposta');
    const lt = K.later(r.arr);
    const title = r.yon === 'gunes' ? `☀️ Güneş Bakü'den sana bir not getirdi` : `🌙 Gece İstanbul'dan sana bir not getirdi`;
    K.ping(title, r.yon === 'gunes' ? `${K.meName()} yazdı. Güneş şimdi senin pencerende.` : `${K.meName()} yazdı. Sabah oldu, gece notu getirdi.`, [r.yon === 'gunes' ? 'sunrise' : 'crescent_moon'], Object.assign({ click: K.roomUrl('gunesposta') }, lt || {}));
    K.fx.toast(r.yon === 'gunes' ? '☀️ Notun güneşe iliştirildi.' : '🌙 Notun gün batımını bekliyor.', { duration: 2600 });
    render();
  }
  K.on('cloud', async (ok) => {
    if (!ok) return;
    rows = await K.cloud.list('gunes', 600);
    loaded = true;
    K.cloud.on('gunes', (r) => {
      if (rows.some((x) => x.id === r.id)) return;
      rows.push(r);
      render();
    });
    render();
  });
  // Varan ama henüz okunmamış not: ana salonda
  K.specialHooks = (K.specialHooks || []).concat(() => {
    if (!loaded) return [];
    const now = Date.now(), seen = K.store.get('gpSeen', 0);
    const n = rows.filter((x) => x.who !== mine() && x.data.arr <= now && x.data.arr > seen);
    return n.length ? [{ key: 'gunesposta', icon: 'sun', title: n[0].data.yon === 'gunes' ? '☀️ Güneş sana bir not getirdi' : '🌙 Gece sana bir not getirdi', text: `${nameOf(n[0].who)} ${n[0].data.yon === 'gunes' ? 'sabah güneşine' : 'akşam güneşine'} bir not iliştirmişti. Şimdi vardı.`, run: () => (K.store.set('gpSeen', now), K.go('gunesposta')), cta: 'Oku' }] : [];
  });

  K.room({
    id: 'gunesposta',
    wing: 'mevsim',
    title: 'Güneş Postası',
    sub: 'Güneşe iliştirilen notlar',
    icon: 'sun',
    color: '#FFF1D6',
    hidden: () => !K.cloud || !K.cloud.enabled || !K.gok,
    badge: () => (loaded ? String(rows.filter((x) => x.who !== mine() && x.data.arr <= Date.now() && x.data.arr > K.store.get('gpSeen', 0)).length || '') : ''),
    init(el) {
      root = el;
      el.innerHTML = `<div class="room-intro"><p>Güneş Bakü'de İstanbul'dan yaklaşık 84 dakika önce doğuyor. ${K.esc(C.herPet)} sabah güneşine bir not iliştirir; not güneşle birlikte batıya yol alır ve İstanbul'da güneş doğduğu an ${K.esc(K.ek(C.myPet, 'e'))} ulaşır.</p><p>${K.esc(K.ek(C.myPet, 'in'))} notları akşam İstanbul'da batan güneşle yola çıkar; gece onları doğuya taşır, Bakü'de sabah güneşiyle varır. Yoldaki not açılmaz.</p></div>
        <section class="card gp-kart"><div id="gpGok"></div><p class="gp-yol" id="gpYol"></p>
          <textarea class="input gp-text" id="gpText" maxlength="280" rows="3" placeholder="${mine() === 'her' ? 'Sabah güneşine bir not...' : 'Akşam güneşine bir not...'}"></textarea>
          <div class="row"><button type="button" class="btn red" data-gp-send>${mine() === 'her' ? '☀️ Güneşe iliştir' : '🌙 Gün batımına ver'}</button></div>
          <div id="gpYolda"></div></section>
        <section class="gp-gelen" id="gpGelen"></section>
        <section class="card" id="gpGiden"></section>`;
      el.addEventListener('click', (e) => {
        const b = e.target.closest('[data-gp-send]');
        b && send(b);
      });
    },
    enter() {
      K.store.set('gpSeen', Date.now());
      render();
      clearInterval(timer);
      timer = setInterval(render, 30000);
    },
    leave() {
      clearInterval(timer);
    },
  });
  K.gunesposta = { route };
})();
