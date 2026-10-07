/* Oda: Küçük Eln'e, Küçük Arda'ya — ikimiz de kendi çocukluk fotoğrafımızı koyarız; öbürü o fotoğraftaki çocuğa bir
   mektup yazar: "Bir gün biri seni çok sevecek." Mektup fotoğrafın arkasına yazılır; fotoğrafa dokununca kart döner
   ve arkası okunur.
   Kayıtlar: cocukfoto {thumb, full, yas?} + cocukimg {img} · cocukmektup {ref, text} */
(function () {
  'use strict';
  const K = window.K;
  const D = window.ELN;
  const C = D.config;

  const mine = () => (K.isOwner() ? 'me' : 'her');
  const other = () => (K.isOwner() ? 'her' : 'me');
  const nameOf = (w) => (w === 'me' ? C.myPet : C.herPet);
  const kucuk = (w) => `Küçük ${w === 'me' ? C.myName || C.myPet : C.herName}`;
  let fotos = [], mektup = [], root = null;
  const fotoOf = (w) => fotos.filter((r) => r.who === w).sort((a, b) => b.at - a.at)[0];
  const mektupOf = (f) => f && mektup.filter((r) => r.data.ref === f.id).sort((a, b) => b.at - a.at)[0];
  function kart(w) {
    const f = fotoOf(w), m = mektupOf(f);
    const ben = w === mine();
    if (!f)
      return `<div class="ck-kart bos"><div class="ck-on"><p><b>${K.esc(kucuk(w))}</b></p><p class="muted small">${ben ? 'Çocukluk fotoğrafını koy; arkasına o yazsın.' : `${K.esc(nameOf(w))} henüz fotoğrafını koymadı.`}</p>${ben ? '<label class="btn red small">📷 Fotoğrafımı koy<input type="file" accept="image/*" hidden data-ck-dosya></label>' : ''}</div></div>`;
    return `<div class="ck-kart" data-ck-cevir="${w}" role="button" tabindex="0" aria-label="${K.esc(kucuk(w))}: kartı çevir"><div class="ck-ic">
      <div class="ck-on"><img src="${f.data.thumb}" alt=""><b>${K.esc(kucuk(w))}</b>${f.data.yas ? `<small>${K.esc(f.data.yas)}</small>` : ''}</div>
      <div class="ck-arka">${m ? `<p class="ck-metin">${K.esc(m.data.text).replace(/\n/g, '<br>')}</p><p class="ck-imza">— ${K.esc(nameOf(m.who))}</p>` : ben ? `<p class="muted">${K.esc(nameOf(other()))} henüz arkasına yazmadı.</p>` : `<p class="muted">Bu fotoğraftaki çocuğa bir şey söyle.</p><textarea class="textarea" data-ck-metin maxlength="1200" placeholder="Bir gün biri seni çok sevecek..."></textarea><button type="button" class="btn red small" data-ck-yaz="${f.id}">Arkasına yaz</button>`}</div>
    </div></div>`;
  }
  function render() {
    if (!root || K.activeRoom !== 'cocukluk') return;
    K.$('#ckKartlar', root).innerHTML = kart(other()) + kart(mine());
    const f = fotoOf(mine());
    K.$('#ckBen', root).innerHTML = f ? `<label class="btn ghost small">📷 Fotoğrafımı değiştir<input type="file" accept="image/*" hidden data-ck-dosya></label>` : '';
  }
  K.on('cloud', async (ok) => {
    if (!ok) return;
    [fotos, mektup] = await Promise.all([K.cloud.list('cocukfoto', 20), K.cloud.list('cocukmektup', 40)]);
    K.cloud.on('cocukfoto', (r) => fotos.some((x) => x.id === r.id) || (fotos.push(r), render()));
    K.cloud.on('cocukmektup', (r) => mektup.some((x) => x.id === r.id) || (mektup.push(r), render()));
  });
  K.room({
    id: 'cocukluk',
    wing: 'anilar',
    title: 'Çocukluk Mektupları',
    sub: 'Fotoğrafın arkasındaki mektup',
    icon: 'camera',
    color: '#FFF0E0',
    hidden: () => !K.cloud || !K.cloud.enabled,
    init(el) {
      root = el;
      el.innerHTML = `<div class="room-intro"><p>Birbirimizin çocukluk fotoğrafındaki çocuğa bir mektup. Mektup fotoğrafın arkasına yazılır; karta dokununca döner.</p></div>
        <div class="ck-kartlar" id="ckKartlar"></div><div class="row center" id="ckBen"></div>`;
      el.addEventListener('change', async (e) => {
        const inp = e.target.closest('[data-ck-dosya]');
        if (!inp || !inp.files[0]) return;
        const file = inp.files[0];
        const [full, thumb] = await Promise.all([K.medya.image(file, 1200, 0.82), K.medya.image(file, 520, 0.78)]);
        const big = await K.cloud.add('cocukimg', { img: full });
        const r = await K.cloud.add('cocukfoto', { thumb, full: big ? big.id : '' });
        if (!r) return K.fx.toast('Fotoğraf yüklenemedi.');
        fotos.some((x) => x.id === r.id) || fotos.push(r);
        K.stickers.award('cocukfoto');
        K.ping(`🧸 ${K.meName()} çocukluk fotoğrafını koydu`, 'Arkasına o küçük çocuğa bir şey yaz.', ['teddy_bear'], { click: K.roomUrl('cocukluk') });
        render();
      });
      el.addEventListener('click', async (e) => {
        const y = e.target.closest('[data-ck-yaz]');
        if (y) {
          e.stopPropagation();
          const ta = K.$('[data-ck-metin]', y.parentElement), text = ta.value.trim();
          if (!text) return ta.focus();
          const r = await K.cloud.add('cocukmektup', { ref: y.dataset.ckYaz, text });
          if (!r) return;
          mektup.some((x) => x.id === r.id) || mektup.push(r);
          K.stickers.award('cocukmektup');
          K.ping(`🧸 ${K.meName()} çocukluk fotoğrafının arkasına bir şey yazdı`, 'Kartı çevir.', ['teddy_bear'], { click: K.roomUrl('cocukluk') });
          render();
          const k = K.$(`[data-ck-cevir="${other()}"]`, root);
          k && k.classList.add('cevrik');
          return;
        }
        if (e.target.closest('textarea, label, input')) return;
        const c = e.target.closest('[data-ck-cevir]');
        if (c) c.classList.toggle('cevrik');
      });
    },
    enter() {
      render();
    },
  });
})();
