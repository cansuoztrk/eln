/* Oda: Gülüş Kavanozu — yalnızca gülüşlerin durduğu küçük bir kavanoz. Gülerken kaydedersin ya da telesekreterdeki
   bir sesin içinden gülüşün geçtiği birkaç saniyeyi ayırırsın. Kötü bir günde (Kalbin Hava Durumu yağmurlu, fırtınalı,
   sisli ya da karlıysa) ana salonda "Gülüşünü dinle" çıkar; düğme öbürünün gülüşlerinden birini rastgele çalar.
   Kayıtlar: gulus {audio, dur, from?, to?} */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  const mine = () => (K.isOwner() ? 'me' : 'her');
  const other = () => (K.isOwner() ? 'her' : 'me');
  const nameOf = (w) => (w === 'me' ? C.myPet : C.herPet);
  const BAD = ['sis', 'yagmur', 'firtina', 'kar'];
  let rows = [], root = null, hava = [], tsler = [], kes = null;
  const onun = () => rows.filter((r) => r.who === other());
  async function gul(list) {
    const l = list || onun();
    if (!l.length) return K.fx.toast(`${nameOf(other())} henüz kavanoza gülüş koymadı.`);
    const r = l[Math.floor(Math.random() * l.length)];
    await K.medya.cal(r.data.audio, { from: r.data.from || 0, to: r.data.to || 0 });
    K.fx.burst && K.fx.burst(innerWidth / 2, innerHeight / 2, { count: 18, power: 5 });
    K.stickers.award('gulusdinle');
  }
  function kavanoz(n) {
    const bub = Array.from({ length: Math.min(30, n) }, (_, i) => {
      const r = K.rng(i + 3);
      return `<circle cx="${(30 + r() * 60).toFixed(1)}" cy="${(150 - (i / 30) * 100 - r() * 8).toFixed(1)}" r="${(5 + r() * 5).toFixed(1)}" fill="${['#FFD34E', '#FF8FB8', '#8FD3FF', '#C9B6FF'][i % 4]}" opacity=".85"/>`;
    }).join('');
    return `<svg class="gl-kavanoz" viewBox="0 0 120 170" aria-hidden="true"><rect x="22" y="14" width="76" height="16" rx="5" fill="#FFD34E"/><path d="M28 32h64q8 0 8 10v108q0 12-12 12H32q-12 0-12-12V42q0-10 8-10z" fill="rgba(255,255,255,.5)" stroke="#4A2138" stroke-width="3"/>${bub}<path d="M30 46v90" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".6"/></svg>`;
  }
  function render() {
    if (!root || K.activeRoom !== 'gulus') return;
    const o = onun(), b = rows.filter((r) => r.who === mine());
    K.$('#glKav', root).innerHTML = `${kavanoz(rows.length)}<p class="center"><b>${rows.length} gülüş</b><br><small class="muted">${o.length} tanesi ${K.esc(K.ek(nameOf(other()), 'in'))}</small></p>
      <div class="row center"><button type="button" class="btn red" data-gl-dinle ${o.length ? '' : 'disabled'}>😂 Gülüşünü dinle</button><button type="button" class="btn soft small" data-gl-benim ${b.length ? '' : 'disabled'}>Benimkiler</button></div>`;
    const ts = tsler.filter((r) => r.who === mine()).slice(-8).reverse();
    K.$('#glKoy', root).innerHTML = `<p class="card-eyebrow">Kavanoza gülüş koy</p><p class="muted small">Bir şeye gülerken kaydet. Ya da telesekreterde gülüşünün geçtiği bir sesin ilgili saniyelerini ayır.</p>
      <div class="row center"><button type="button" class="btn red" data-gl-kaydet>🎙 Gülerken kaydet</button></div>
      ${ts.length ? `<p class="card-eyebrow">Telesekreterden ayır</p>${ts.map((r) => `<div class="gl-ts"><span>🎙 ${Math.round(r.data.dur || 0)} sn · ${K.esc(K.ago(r.at))}</span><button type="button" class="btn ghost small" data-gl-kes="${r.id}">✂️ Ayır</button></div>`).join('')}` : ''}
      <div id="glKes"></div>`;
    if (kes) {
      const r = tsler.find((x) => x.id === kes);
      const max = Math.max(1, Math.round(r.data.dur || 10));
      K.$('#glKes', root).innerHTML = `<div class="gl-kes"><label>Başlangıç <input type="range" id="glFrom" min="0" max="${max}" step="0.5" value="0"></label><label>Bitiş <input type="range" id="glTo" min="0" max="${max}" step="0.5" value="${Math.min(max, 4)}"></label><p class="muted small" id="glAralik">0 – ${Math.min(max, 4)} sn</p><div class="row"><button type="button" class="btn soft small" data-gl-dene>▶ Dene</button><button type="button" class="btn red small" data-gl-ayir>Kavanoza koy</button></div></div>`;
    }
  }
  async function koy(data) {
    const r = await K.cloud.add('gulus', data);
    if (!r) return;
    rows.some((x) => x.id === r.id) || rows.push(r);
    kes = null;
    K.stickers.award('gulus');
    K.ping(`😂 ${K.meName()} kavanoza bir gülüş koydu`, 'Kötü bir günde aç.', ['joy'], { click: K.roomUrl('gulus') });
    render();
  }
  K.on('cloud', async (ok) => {
    if (!ok) return;
    [rows, hava] = await Promise.all([K.cloud.list('gulus', 200), K.cloud.list('hava', 30)]);
    K.cloud.on('gulus', (r) => rows.some((x) => x.id === r.id) || (rows.push(r), render()));
    K.cloud.on('hava', (r) => hava.push(r));
  });
  K.specialHooks = (K.specialHooks || []).concat(() => {
    const day = T.todayKey();
    const kotu = hava.some((r) => r.who === mine() && r.data.day === day && BAD.includes(r.data.type));
    if (!kotu || !onun().length || K.store.get('gulusGun') === day) return [];
    return [{ key: 'gulus', icon: 'jar', title: '😂 Bugün biraz gülümse', text: `İçinin havası kapalı. Kavanozda ${K.ek(nameOf(other()), 'in')} ${onun().length} gülüşü var.`, run: () => (K.store.set('gulusGun', day), gul()), cta: 'Gülüşünü dinle' }];
  });
  K.room({
    id: 'gulus',
    wing: 'kalp',
    title: 'Gülüş Kavanozu',
    sub: 'Kötü günler için',
    icon: 'jar',
    color: '#FFF4CC',
    hidden: () => !K.cloud || !K.cloud.enabled,
    init(el) {
      root = el;
      el.innerHTML = `<div class="room-intro"><p>Yalnızca gülüşlerin durduğu bir kavanoz. İçinin havası kapalı bir günde ana salonda "Gülüşünü dinle" çıkar.</p></div>
        <section class="card gl-kart" id="glKav"></section><section class="card" id="glKoy"></section>`;
      el.addEventListener('input', (e) => {
        if (!e.target.closest('#glFrom, #glTo')) return;
        const f = +K.$('#glFrom', root).value, t = +K.$('#glTo', root).value;
        K.$('#glAralik', root).textContent = `${f} – ${t} sn`;
      });
      el.addEventListener('click', async (e) => {
        if (e.target.closest('[data-gl-dinle]')) return gul();
        if (e.target.closest('[data-gl-benim]')) return gul(rows.filter((r) => r.who === mine()));
        const k = e.target.closest('[data-gl-kes]');
        if (k) return (kes = k.dataset.glKes), render();
        const ts = kes && tsler.find((x) => x.id === kes);
        const rng = () => {
          const f = +K.$('#glFrom', root).value, t = +K.$('#glTo', root).value;
          return t > f ? [f, t] : null;
        };
        if (e.target.closest('[data-gl-dene]') && ts) {
          const r = rng();
          return r ? K.medya.cal(ts.data.audio, { from: r[0], to: r[1] }) : K.fx.toast('Bitiş başlangıçtan sonra olmalı.');
        }
        if (e.target.closest('[data-gl-ayir]') && ts) {
          const r = rng();
          if (!r) return K.fx.toast('Bitiş başlangıçtan sonra olmalı.');
          return koy({ audio: ts.data.audio, dur: r[1] - r[0], from: r[0], to: r[1] });
        }
        const b = e.target.closest('[data-gl-kaydet]');
        if (!b) return;
        const res = await K.medya.kaydet(b, 8);
        res && koy({ audio: res.audio, dur: res.dur });
      });
    },
    async enter() {
      if (K.cloud && K.cloud.enabled) tsler = await K.cloud.list('tsmesaj', 60);
      render();
    },
  });
  K.gulus = { gul };
})();
