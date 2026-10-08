/* Konuşan Fotoğraflar — her fotoğrafın arkasında o anı anlatan on saniyelik bir ses. Fotoğraf büyüyünce ses kendiliğinden
   çalar. Kalenin bütün fotoğraflarında çalışır (Anılar akışı, odadaki liste); ses ekleyen fotoğrafı kim koyduysa olmak
   zorunda değil: ikiniz de bir fotoğrafa kendi sesinizi bırakabilirsiniz.
   K.fotoses = {var(id), bagla(el, foto), cal(id)} · Kayıt: fotoses {foto, audio, dur} */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  const mine = () => (K.isOwner() ? 'me' : 'her');
  const nameOf = (w) => (w === 'me' ? C.myPet : C.herPet);
  let rows = [], root = null, foto = [];

  const sesleri = (id) => rows.filter((r) => r.data.foto === id).sort((a, b) => a.at - b.at);
  const var_ = (id) => sesleri(id).length > 0;
  function cal(id) {
    const s = sesleri(id);
    if (!s.length) return null;
    let i = 0;
    const sira = () => s[i] && K.medya.cal(s[i].data.audio, { onEnd: () => (i++, sira()) });
    return sira();
  }
  // Büyütülmüş bir fotoğrafın altına ses düğmeleri; ses varsa kendiliğinden çalar
  function bagla(el, x) {
    if (!el || !x) return;
    const ciz = () => {
      const s = sesleri(x.id);
      const benim = s.find((r) => r.who === mine());
      el.innerHTML = `<div class="fs-bar">${s.length ? `<button type="button" class="btn soft small" data-fs-cal>🔊 ${s.map((r) => K.esc(nameOf(r.who))).join(' ve ')} anlatıyor</button>` : ''}
        ${benim ? '' : `<button type="button" class="btn ghost small" data-fs-kaydet>🎙️ Bu fotoğrafa sesini bırak (10 sn)</button>`}</div>`;
    };
    ciz();
    el.addEventListener('click', async (e) => {
      if (e.target.closest('[data-fs-cal]')) return cal(x.id);
      const b = e.target.closest('[data-fs-kaydet]');
      if (!b) return;
      const r = await K.medya.kaydet(b, 10);
      if (!r) return;
      const row = await K.cloud.add('fotoses', { foto: x.id, audio: r.audio, dur: r.dur });
      if (row) {
        rows.push(row);
        K.stickers.award('fotoses');
        K.ping(`🔊 ${K.meName()} bir fotoğrafa sesini bıraktı`, 'Fotoğrafı büyütünce kendiliğinden konuşacak.', ['camera'], { click: K.roomUrl('fotoses') });
        K.fx.toast('Fotoğraf artık konuşuyor 🔊');
      }
      ciz();
    });
    if (var_(x.id)) setTimeout(() => cal(x.id), 450);
  }
  async function ciz() {
    if (!root || K.activeRoom !== 'fotoses') return;
    foto = K.arsiv ? await K.arsiv.photos() : [];
    const sesli = foto.filter((p) => var_(p.id)).reverse();
    const sessiz = foto.filter((p) => !var_(p.id)).reverse().slice(0, 30);
    const kart = (p) => `<button type="button" class="fs-kart ${var_(p.id) ? 'sesli' : ''}" data-fs-ac="${p.id}"><img src="${p.thumb}" alt="" loading="lazy">${var_(p.id) ? '<i>🔊</i>' : ''}<small>${K.esc(p.label)} · ${K.esc(T.fmtShort(p.day))}</small></button>`;
    K.$('#fsIcerik', root).innerHTML = `${sesli.length ? `<h3 class="fs-baslik">Konuşan fotoğraflar <small>${sesli.length}</small></h3><div class="fs-izgara">${sesli.map(kart).join('')}</div>` : '<p class="muted center">Henüz konuşan fotoğraf yok. Aşağıdan birini seç, o anı on saniyede anlat.</p>'}
      ${sessiz.length ? `<h3 class="fs-baslik">Sesini bekleyenler</h3><div class="fs-izgara">${sessiz.map(kart).join('')}</div>` : ''}`;
  }
  async function ac(id) {
    const p = foto.find((x) => x.id === id);
    if (!p) return;
    let src = p.thumb;
    if (p.full) src = String(p.full).startsWith('data:') ? p.full : (await K.medya.rowUrl(p.full, 'img')) || src;
    const m = K.ui.modal({ label: p.label, cls: 'k4-aniac fs-ac', html: `<img class="k4-aniac-img" src="${src}" alt=""><p class="card-eyebrow">${K.esc(p.label)} · ${K.esc(T.fmt(p.day, true))}</p><div id="fsBagla"></div>` });
    bagla(K.$('#fsBagla', m.el), p);
  }
  K.room({
    id: 'fotoses',
    wing: 'anilar',
    title: 'Konuşan Fotoğraflar',
    sub: 'Her fotoğrafın arkasında on saniyelik bir ses',
    icon: 'camera',
    color: '#EFE9FF',
    hidden: () => !K.cloud || !K.cloud.enabled,
    init(el) {
      root = el;
      el.innerHTML = `<div class="room-intro"><p>Bir fotoğraf seç, o anı on saniyede anlat. Fotoğraf kalenin neresinde büyütülürse büyütülsün, senin sesinle konuşur.</p></div><div id="fsIcerik"><p class="muted center">Fotoğraflar toplanıyor...</p></div>`;
      el.addEventListener('click', (e) => {
        const b = e.target.closest('[data-fs-ac]');
        b && ac(b.dataset.fsAc);
      });
    },
    async enter() {
      rows = await K.cloud.list('fotoses', 600);
      ciz();
    },
    leave() {
      K.medya.sus();
    },
  });
  K.on('cloud', async (ok) => {
    if (!ok) return;
    rows = await K.cloud.list('fotoses', 600);
    K.cloud.on('fotoses', (r) => rows.some((x) => x.id === r.id) || (rows.push(r), ciz()));
  });
  K.fotoses = { var: var_, bagla, cal };
})();
