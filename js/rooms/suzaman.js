/* Oda: Şu Zaman Aç — yirmi zarf: "Uyuyamadığında aç", "Bana kızdığında aç", "Sınavdan önce aç"... İkimiz de birbirimiz
   için zarfların içini doldururuz. Her zarf bir kez açılır; açıldığı an yazana haber gider ("Uyuyamadığında aç
   zarfını şimdi açtı"). Açılan zarf yeniden okunabilir ama mührü kırıktır; yazan aynı zarfı yeniden doldurabilir.
   Kayıtlar: suzaman {slot, text, audio?, dur?} · suzamanac {ref} */
(function () {
  'use strict';
  const K = window.K;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  const mine = () => (K.isOwner() ? 'me' : 'her');
  const other = () => (K.isOwner() ? 'her' : 'me');
  const nameOf = (w) => (w === 'me' ? C.myPet : C.herPet);
  const ZARF = [
    'Uyuyamadığında aç', 'Bana kızdığında aç', 'Sınavdan önce aç', 'Beni çok özlediğinde aç', 'Ağlamak istediğinde aç', 'Çok mutlu olduğunda aç',
    'Kendini yalnız hissettiğinde aç', 'Yağmur yağarken aç', 'Kendini çirkin hissettiğinde aç', 'Bir şeyi başardığında aç', 'Küstüğümüzde aç', 'Hasta olduğunda aç',
    'Gülmek istediğinde aç', 'Ailenle tartıştığında aç', 'Kavuşmadan bir gece önce aç', 'Doğum gününde aç', 'Gece yarısı aç', 'Kendinden şüphelendiğinde aç',
    'Bizden şüphelendiğinde aç', 'Sadece canın istediğinde aç',
  ];
  let rows = [], acilan = [], root = null, sekme = 'gelen';
  const son = (slot, w) => rows.filter((r) => r.data.slot === slot && r.who === w).sort((a, b) => b.at - a.at)[0];
  const acikMi = (r) => r && acilan.some((x) => x.data.ref === r.id);
  function render() {
    if (!root || K.activeRoom !== 'suzaman') return;
    K.$$('[data-sz-sekme]', root).forEach((b) => b.classList.toggle('on', b.dataset.szSekme === sekme));
    const gelen = sekme === 'gelen';
    const w = gelen ? other() : mine();
    const dolu = ZARF.filter((_, i) => son(i, w)).length;
    K.$('#szUst', root).innerHTML = gelen ? `<b>${dolu}</b> zarf ${K.esc(K.ek(nameOf(other()), 'den'))} · ${ZARF.filter((_, i) => acikMi(son(i, other()))).length} açıldı` : `<b>${dolu}</b> / ${ZARF.length} zarfı doldurdun`;
    K.$('#szZarflar', root).innerHTML = ZARF.map((t, i) => {
      const r = son(i, w), ac = acikMi(r);
      const cls = !r ? 'bos' : ac ? 'acik' : 'kapali';
      const alt = gelen ? (!r ? 'henüz boş' : ac ? 'açıldı · yeniden oku' : 'mühürlü') : !r ? 'doldur' : ac ? `${K.esc(nameOf(other()))} açtı · yeniden doldur` : 'dolu · düzenle';
      return `<button type="button" class="sz-zarf ${cls}" data-sz="${i}" ${gelen && !r ? 'disabled' : ''}><span class="sz-mh" aria-hidden="true"></span><b>${K.esc(t)}</b><small>${alt}</small></button>`;
    }).join('');
  }
  function oku(i) {
    const r = son(i, other());
    if (!r) return;
    const ilk = !acikMi(r);
    const m = K.ui.modal({
      label: ZARF[i],
      cls: 'sz-modal',
      html: `<div class="sz-mektup ${ilk ? 'yeni' : ''}"><p class="card-eyebrow">${K.esc(ZARF[i])}</p><p class="sz-metin">${K.esc(r.data.text || '').replace(/\n/g, '<br>')}</p>${r.data.audio ? `<button type="button" class="btn soft small" data-sz-ses>▶ Sesini dinle (${Math.round(r.data.dur || 0)} sn)</button>` : ''}<p class="sz-imza">— ${K.esc(nameOf(r.who))}</p></div>`,
    });
    m.el.addEventListener('click', (e) => e.target.closest('[data-sz-ses]') && K.medya.cal(r.data.audio));
    if (ilk) {
      K.audio.sfx && K.audio.sfx.pop && K.audio.sfx.pop();
      K.cloud.add('suzamanac', { ref: r.id }).then((o) => o && !acilan.some((x) => x.id === o.id) && (acilan.push(o), render()));
      K.ping(`✉️ ${K.meName()} "${ZARF[i]}" zarfını şimdi açtı`, 'Belki şu an ona biraz daha yakın olmanın zamanıdır.', ['envelope'], { click: K.roomUrl('suzaman') });
      K.stickers.award('suzamanac');
    }
  }
  function yaz(i) {
    const r = son(i, mine());
    let ses = r && !acikMi(r) && r.data.audio ? { audio: r.data.audio, dur: r.data.dur } : null;
    const m = K.ui.modal({
      label: ZARF[i],
      cls: 'sz-modal',
      html: `<p class="card-eyebrow">${K.esc(nameOf(other()))} için</p><h3>${K.esc(ZARF[i])}</h3><textarea class="textarea" id="szMetin" maxlength="2000" placeholder="O an ona ne söylemek isterdin?">${r && !acikMi(r) ? K.esc(r.data.text) : ''}</textarea>
        <div class="row"><button type="button" class="btn ghost small" data-sz-kaydet>🎙 ${ses ? 'Sesi yenile' : 'Ses de ekle'}</button><span class="muted small" id="szSesBilgi">${ses ? `Ses var (${Math.round(ses.dur)} sn)` : ''}</span></div>
        <div class="row"><button type="button" class="btn red" data-sz-muhurle>🔏 Zarfı mühürle</button></div>`,
    });
    m.el.addEventListener('click', async (e) => {
      const kb = e.target.closest('[data-sz-kaydet]');
      if (kb) {
        const res = await K.medya.kaydet(kb, 60);
        if (res) (ses = res), (K.$('#szSesBilgi', m.el).textContent = `Ses var (${Math.round(res.dur)} sn)`);
        return;
      }
      if (!e.target.closest('[data-sz-muhurle]')) return;
      const text = K.$('#szMetin', m.el).value.trim();
      if (!text && !ses) return;
      const data = { slot: i, text };
      if (ses) Object.assign(data, { audio: ses.audio, dur: ses.dur });
      const n = await K.cloud.add('suzaman', data);
      m.close();
      if (!n) return;
      rows.some((x) => x.id === n.id) || rows.push(n);
      K.stickers.award('suzaman');
      if (ZARF.every((_, j) => son(j, mine()))) K.stickers.award('suzaman20');
      K.ping(`✉️ ${K.meName()} sana bir zarf hazırladı: "${ZARF[i]}"`, 'Zamanı gelince aç.', ['envelope'], { click: K.roomUrl('suzaman') });
      render();
    });
  }
  K.on('cloud', async (ok) => {
    if (!ok) return;
    [rows, acilan] = await Promise.all([K.cloud.list('suzaman', 300), K.cloud.list('suzamanac', 300)]);
    K.cloud.on('suzaman', (r) => rows.some((x) => x.id === r.id) || (rows.push(r), render()));
    K.cloud.on('suzamanac', (r) => acilan.some((x) => x.id === r.id) || (acilan.push(r), render()));
  });
  K.room({
    id: 'suzaman',
    wing: 'anilar',
    title: 'Şu Zaman Aç',
    sub: 'Yirmi zarf',
    icon: 'letter',
    color: '#FDEFE6',
    hidden: () => !K.cloud || !K.cloud.enabled,
    badge: () => {
      const n = ZARF.filter((_, i) => son(i, other()) && !acikMi(son(i, other()))).length;
      return n ? String(n) : '';
    },
    init(el) {
      root = el;
      el.innerHTML = `<div class="room-intro"><p>Yirmi zarf. Her biri bir an için: uyuyamadığında, kızdığında, çok özlediğinde... Her zarf bir kez açılır ve açıldığı an yazana haber gider.</p></div>
        <div class="k3-seg"><button type="button" data-sz-sekme="gelen">Bana gelenler</button><button type="button" data-sz-sekme="yaz">Benim yazdıklarım</button></div>
        <p class="sz-ust center" id="szUst"></p><div class="sz-zarflar" id="szZarflar"></div>`;
      el.addEventListener('click', (e) => {
        const s = e.target.closest('[data-sz-sekme]');
        if (s) return (sekme = s.dataset.szSekme), render();
        const z = e.target.closest('[data-sz]');
        if (z) return sekme === 'gelen' ? oku(+z.dataset.sz) : yaz(+z.dataset.sz);
      });
    },
    enter() {
      render();
    },
  });
  K.suzaman = { ZARF };
})();
