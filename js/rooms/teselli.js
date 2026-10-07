/* Oda: Kitty Seni Gördü — birbirimiz için önceden teselli sesleri kaydederiz. Biri Kalbin Hava Durumu'nda içinin
   havasını yağmurlu, fırtınalı, sisli ya da karlı seçerse veya Endişe kutusuna bir şey bırakırsa, Kitty o gün bir kez
   ona öbürünün bıraktığı seslerden birini çalar ve öbürüne nazikçe haber verir: "Bugün ona biraz daha yakın ol."
   Kayıtlar: teselli {audio, dur} */
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
  const FIKIR = ['Buradayım, geçecek.', 'Bugün zor geçtiyse yarın yanında daha güçlü olacağım.', 'Sen sandığından çok daha güçlüsün.', 'Bir nefes al. Ben seninle nefes alıyorum.', 'Ne olursa olsun seni seviyorum.'];
  let rows = [], root = null;
  const icin = () => rows.filter((r) => r.who === other());
  async function gordu(neden) {
    const day = T.todayKey();
    if (K.store.get('teselliGun') === day) return;
    const list = icin();
    if (!list.length) return;
    K.store.set('teselliGun', day);
    const r = list[K.hash(day) % list.length];
    const m = K.ui.modal({
      label: 'Kitty seni gördü',
      cls: 'ts-gordu',
      html: `<div class="ts-kitty">${A.kitty({ eyes: 'heart', cls: 'ts-k' })}</div><p class="card-eyebrow">Kitty seni gördü</p><h3>${K.esc(nameOf(r.who))} bunu senin için önceden kaydetti</h3><div class="ts-dalga">${'<i></i>'.repeat(18)}</div><p class="muted small">${K.esc(neden)}</p>`,
      onClose: () => K.medya.sus(),
    });
    setTimeout(() => K.medya.cal(r.data.audio, { volume: 0.9 }), 600);
    K.stickers.award('teselli');
    K.ping(`💗 Kitty: bugün ${nameOf(mine())} için biraz daha yakın ol`, neden, ['heart'], { click: K.roomUrl('') });
    return m;
  }
  function render() {
    if (!root || K.activeRoom !== 'teselli') return;
    const b = rows.filter((r) => r.who === mine());
    K.$('#tsBenim', root).innerHTML = `<p class="card-eyebrow">${K.esc(K.ek(nameOf(other()), 'e'))} teselli sesleri · ${b.length}</p>
      ${b.map((r, i) => `<div class="ts-satir"><span>🎙 ${i + 1}. ses · ${Math.round(r.data.dur)} sn</span><button type="button" class="btn ghost small" data-ts-dinle="${r.data.audio}">▶</button></div>`).join('') || '<p class="muted">Henüz yok.</p>'}
      <p class="muted small">Fikir: "${K.esc(FIKIR[b.length % FIKIR.length])}"</p>
      <div class="row center"><button type="button" class="btn red" data-ts-kaydet>🎙 Teselli sesi kaydet</button></div>`;
    K.$('#tsOnun', root).innerHTML = `<p class="card-eyebrow">Senin için bekleyenler</p><p>${icin().length ? `${K.esc(nameOf(other()))} senin için <b>${icin().length}</b> ses bıraktı. Kötü bir gününde Kitty birini çalacak.` : `${K.esc(nameOf(other()))} henüz bırakmadı.`}</p>`;
  }
  K.on('cloud', async (ok) => {
    if (!ok) return;
    rows = await K.cloud.list('teselli', 100);
    K.cloud.on('teselli', (r) => rows.some((x) => x.id === r.id) || (rows.push(r), render()));
    K.cloud.on('hava', (r) => r.who === mine() && r.data.day === T.todayKey() && BAD.includes(r.data.type) && setTimeout(() => gordu('İçinin havası bugün kapalıydı.'), 1800));
    K.cloud.on('endise', (r) => r.who === mine() && setTimeout(() => gordu('Endişe kutuna bir şey bıraktın.'), 2200));
  });
  K.room({
    id: 'teselli',
    wing: 'kalp',
    title: 'Kitty Seni Gördü',
    sub: 'Kötü günlere önceden ses',
    icon: 'hugs',
    color: '#FFE3EE',
    hidden: () => !K.cloud || !K.cloud.enabled,
    init(el) {
      root = el;
      el.innerHTML = `<div class="room-intro"><p>Birbirimiz için önceden teselli sesleri bırakırız. Biri içinin havasını kapalı seçerse ya da Endişe kutusuna bir şey bırakırsa, Kitty o gün bir kez öbürünün sesini çalar ve öbürüne de haber verir.</p></div>
        <section class="card" id="tsOnun"></section><section class="card" id="tsBenim"></section>`;
      el.addEventListener('click', async (e) => {
        const d = e.target.closest('[data-ts-dinle]');
        if (d) return K.medya.cal(d.dataset.tsDinle);
        const b = e.target.closest('[data-ts-kaydet]');
        if (!b) return;
        const res = await K.medya.kaydet(b, 30);
        if (!res) return;
        const r = await K.cloud.add('teselli', { audio: res.audio, dur: res.dur });
        r && !rows.some((x) => x.id === r.id) && rows.push(r);
        K.stickers.award('tesellibirak');
        render();
      });
    },
    enter() {
      render();
    },
  });
  K.teselli = { gordu };
})();
