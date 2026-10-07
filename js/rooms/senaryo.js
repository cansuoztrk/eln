/* Oda: İlk Gün Senaryosu — ilk buluşma gününü dakika dakika birlikte yazdığımız program ("09:40 kapıdan çıkış",
   "10:15 ilk çay"...). Her madde gerçekleşince o anın fotoğrafıyla işaretlenir; senaryo yavaş yavaş bir fotoğraf
   şeridine döner. Bakü'de İlk Gün odasındaki yer planıyla yan yana durur.
   Kayıtlar: senaryo {saat, text, gone?} (uid'li; aynı uid'nin son kaydı geçerli) · senaryofoto {uid, thumb} */
(function () {
  'use strict';
  const K = window.K;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  const nameOf = (w) => (w === 'me' ? C.myPet : C.herPet);
  let rows = [], fotolar = [], root = null;
  const durum = () => {
    const m = {};
    rows.slice().sort((a, b) => a.at - b.at).forEach((r) => (m[r.data.uid] = Object.assign({ uid: r.data.uid, by: (m[r.data.uid] || {}).by || r.who }, r.data)));
    return Object.values(m).filter((x) => !x.gone).sort((a, b) => a.saat.localeCompare(b.saat));
  };
  const fotoOf = (uid) => fotolar.filter((r) => r.data.uid === uid).sort((a, b) => b.at - a.at)[0];
  function render() {
    if (!root || K.activeRoom !== 'senaryo') return;
    const l = durum(), olan = l.filter((x) => fotoOf(x.uid)).length;
    const gun = K.kavusmaModu && K.kavusmaModu.hedefGun();
    K.$('#snUst', root).innerHTML = `${gun ? `${K.esc(T.fmt(gun, true))} · ` : ''}<b>${l.length}</b> madde · <b>${olan}</b> gerçekleşti`;
    K.$('#snListe', root).innerHTML = l.length
      ? l
          .map((x) => {
            const f = fotoOf(x.uid);
            return `<li class="sn-madde ${f ? 'oldu' : ''}"><time>${K.esc(x.saat)}</time><div><p>${K.esc(x.text)}</p><small>${K.esc(nameOf(x.by))} yazdı</small></div>${f ? `<img src="${f.data.thumb}" alt="">` : `<label class="btn ghost small" title="Gerçekleşti: fotoğrafını koy">📷<input type="file" accept="image/*" hidden data-sn-foto="${x.uid}"></label>`}<button type="button" class="sn-sil" data-sn-sil="${x.uid}" aria-label="Sil">×</button></li>`;
          })
          .join('')
      : '<li class="muted small center">Henüz boş. İlk maddeyi sen yaz: "09:40 kapıdan çıkış".</li>';
  }
  K.on('cloud', async (ok) => {
    if (!ok) return;
    [rows, fotolar] = await Promise.all([K.cloud.list('senaryo', 400), K.cloud.list('senaryofoto', 200)]);
    K.cloud.on('senaryo', (r) => rows.some((x) => x.id === r.id) || (rows.push(r), render()));
    K.cloud.on('senaryofoto', (r) => fotolar.some((x) => x.id === r.id) || (fotolar.push(r), render()));
  });
  K.room({
    id: 'senaryo',
    wing: 'kalp',
    title: 'İlk Gün Senaryosu',
    sub: 'Dakika dakika',
    icon: 'clapper',
    color: '#FFEFE2',
    hidden: () => !K.cloud || !K.cloud.enabled,
    init(el) {
      root = el;
      el.innerHTML = `<div class="room-intro"><p>İlk buluşma gününü dakika dakika birlikte yazıyoruz. Her madde gerçekleşince o anın fotoğrafını koyuyoruz. Yerler için <a href="#ilkgun">Bakü'de İlk Gün</a> odasına bak.</p></div>
        <p class="sn-ust center" id="snUst"></p><ol class="sn-liste" id="snListe"></ol>
        <section class="card"><p class="card-eyebrow">Yeni madde</p><div class="row"><input class="input sn-saat" id="snSaat" type="time" value="10:00"><input class="input" id="snMetin" maxlength="120" placeholder="Ne olacak?"><button type="button" class="btn red small" data-sn-ekle>Ekle</button></div></section>`;
      el.addEventListener('change', async (e) => {
        const f = e.target.closest('[data-sn-foto]');
        if (!f || !f.files[0]) return;
        const thumb = await K.medya.image(f.files[0], 720, 0.8);
        const r = await K.cloud.add('senaryofoto', { uid: f.dataset.snFoto, thumb });
        if (!r) return;
        fotolar.some((x) => x.id === r.id) || fotolar.push(r);
        const m = durum().find((x) => x.uid === f.dataset.snFoto);
        K.fx.confetti({ count: 70, shapes: ['heart', 'star'] });
        K.stickers.award('senaryofoto');
        K.ping(`🎬 Senaryodan bir madde gerçekleşti`, `${m ? `${m.saat} · ${m.text}` : ''}`, ['clapper'], { click: K.roomUrl('senaryo') });
        render();
      });
      el.addEventListener('click', async (e) => {
        const sil = e.target.closest('[data-sn-sil]');
        if (sil) {
          const x = durum().find((m) => m.uid === sil.dataset.snSil);
          const r = x && (await K.cloud.add('senaryo', { uid: x.uid, saat: x.saat, text: x.text, gone: true }));
          r && !rows.some((y) => y.id === r.id) && rows.push(r);
          return render();
        }
        if (!e.target.closest('[data-sn-ekle]')) return;
        const saat = K.$('#snSaat', root).value || '10:00', text = K.$('#snMetin', root).value.trim();
        if (!text) return K.$('#snMetin', root).focus();
        const r = await K.cloud.add('senaryo', { uid: 's' + Date.now().toString(36), saat, text });
        if (!r) return;
        rows.some((x) => x.id === r.id) || rows.push(r);
        K.$('#snMetin', root).value = '';
        K.stickers.award('senaryo');
        render();
      });
    },
    enter() {
      render();
    },
  });
})();
