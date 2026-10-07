/* Oda: Veda Değil — ayrılık günü için. Ayrılmadan önce birbirimize sesler, notlar ve fotoğraflar bırakırız. Ayrıldığımız
   günden (biniş kartındaki dönüş günü ya da burada seçilen gün) sonraki buluşmaya kadar her sabah öbürünün bıraktıklarından
   biri açılır; hiçbir gün boş geçmez. Bıraktıkların açılana kadar öbürü göremez.
   Kayıtlar: veda {tur: not|ses|foto, text, audio?, dur?, thumb?, full?} + vedaimg {img} · vedaac {ref, day} · vedagun {day} */
(function () {
  'use strict';
  const K = window.K;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  const mine = () => (K.isOwner() ? 'me' : 'her');
  const other = () => (K.isOwner() ? 'her' : 'me');
  const nameOf = (w) => (w === 'me' ? C.myPet : C.herPet);
  let rows = [], acilan = [], gunler = [], root = null;
  const ayrilik = () => {
    const g = gunler.slice().sort((a, b) => b.at - a.at)[0];
    return (g && g.data.day) || (K.kavusmaModu && K.kavusmaModu.donusGun()) || null;
  };
  const basladi = () => Boolean(ayrilik() && T.todayKey() > ayrilik());
  const bana = () => rows.filter((r) => r.who === other()).sort((a, b) => a.at - b.at);
  const acikMi = (r) => acilan.some((x) => x.data.ref === r.id && x.who === mine());
  const bugunku = () => acilan.find((x) => x.who === mine() && x.data.day === T.todayKey());
  function kart(r, ac) {
    const t = r.data.tur;
    return `<article class="vd-kart ${t}"><p class="card-eyebrow">${ac ? K.esc(T.fmt(ac.data.day)) : ''} · ${K.esc(nameOf(r.who))}</p>${t === 'foto' && r.data.thumb ? `<img src="${r.data.thumb}" alt="" ${r.data.full ? `data-vd-full="${r.data.full}"` : ''}>` : ''}${r.data.text ? `<p class="vd-metin">${K.esc(r.data.text)}</p>` : ''}${t === 'ses' ? `<button type="button" class="btn soft small" data-vd-ses="${r.id}">▶ Dinle (${Math.round(r.data.dur || 0)} sn)</button>` : ''}</article>`;
  }
  async function bugunAc() {
    if (!basladi() || bugunku()) return null;
    const r = bana().find((x) => !acikMi(x));
    if (!r) return null;
    const o = await K.cloud.add('vedaac', { ref: r.id, day: T.todayKey() });
    o && !acilan.some((x) => x.id === o.id) && acilan.push(o);
    K.stickers.award('vedaac');
    return o;
  }
  function render() {
    if (!root || K.activeRoom !== 'vedadegil') return;
    const a = ayrilik(), benim = rows.filter((r) => r.who === mine());
    K.$('#vdUst', root).innerHTML = a
      ? basladi()
        ? `<b>${bana().filter(acikMi).length}</b> / ${bana().length} açıldı · ${bana().length - bana().filter(acikMi).length} sabah daha`
        : `Ayrılık günü ${K.esc(T.fmt(a, true))}. ${K.esc(nameOf(other()))} ${bana().length} şey bıraktı, sen ${benim.length}.`
      : 'Ayrılık günü henüz yok. Biniş kartında dönüş günü girilince ya da aşağıdan seçince başlar.';
    const b = bugunku();
    K.$('#vdBugun', root).innerHTML = basladi() ? (b ? kart(rows.find((r) => r.id === b.data.ref), b) : bana().some((x) => !acikMi(x)) ? '<button type="button" class="btn red" data-vd-ac>💌 Bugününkini aç</button>' : '<p class="muted center">Bıraktıklarının hepsi açıldı. Bir sonraki buluşmaya az kaldı.</p>') : '';
    const gecmis = acilan.filter((x) => x.who === mine() && x.data.day !== T.todayKey()).sort((x, y) => y.at - x.at);
    K.$('#vdGecmis', root).innerHTML = gecmis.length ? `<p class="card-eyebrow">Önceki sabahlar</p>${gecmis.map((x) => kart(rows.find((r) => r.id === x.data.ref) || { data: {}, who: other() }, x)).join('')}` : '';
    K.$('#vdBirak', root).innerHTML = `<p class="card-eyebrow">${K.esc(nameOf(other()))} için bırak</p><p class="muted small">Bıraktığın ${benim.length} şey var. Her biri bir sabah açılacak; ayrılık uzunsa daha çok bırak.</p>
      <textarea class="textarea" id="vdMetin" maxlength="600" placeholder="Bir sabah okuyacağı bir not..."></textarea>
      <div class="row"><button type="button" class="btn red small" data-vd-not>Not bırak</button><button type="button" class="btn soft small" data-vd-kaydet>🎙 Ses bırak</button><label class="btn soft small">📷 Fotoğraf<input type="file" accept="image/*" hidden data-vd-foto></label></div>
      <div class="row"><label class="muted small">Ayrılık günü <input type="date" class="input" id="vdGun" value="${K.esc(a || '')}"></label></div>`;
  }
  async function birak(data) {
    const r = await K.cloud.add('veda', data);
    if (!r) return;
    rows.some((x) => x.id === r.id) || rows.push(r);
    K.stickers.award('veda');
    K.fx.toast('💌 Bırakıldı. Bir sabah açılacak.', { duration: 2200 });
    render();
  }
  K.on('cloud', async (ok) => {
    if (!ok) return;
    [rows, acilan, gunler] = await Promise.all([K.cloud.list('veda', 400), K.cloud.list('vedaac', 400), K.cloud.list('vedagun', 10)]);
    const yeni = () => (render(), K.renderSpecials && K.renderSpecials());
    K.cloud.on('veda', (r) => rows.some((x) => x.id === r.id) || (rows.push(r), yeni()));
    K.cloud.on('vedaac', (r) => acilan.some((x) => x.id === r.id) || (acilan.push(r), yeni()));
    K.cloud.on('vedagun', (r) => gunler.some((x) => x.id === r.id) || (gunler.push(r), yeni()));
    K.renderSpecials && K.renderSpecials();
  });
  K.specialHooks = (K.specialHooks || []).concat(() => {
    if (!basladi() || bugunku() || !bana().some((x) => !acikMi(x))) return [];
    return [{ key: 'vedadegil', icon: 'letter', title: '💌 Veda değil', text: `${nameOf(other())} bu sabah için bir şey bırakmıştı.`, room: 'vedadegil', cta: 'Aç' }];
  });
  K.room({
    id: 'vedadegil',
    wing: 'kalp',
    title: 'Veda Değil',
    sub: 'Her sabah biri açılır',
    icon: 'letter',
    color: '#EAF3FF',
    hidden: () => !K.cloud || !K.cloud.enabled,
    init(el) {
      root = el;
      el.innerHTML = `<div class="room-intro"><p>Ayrılık günü için. Ayrılmadan önce birbirimize sesler, notlar, fotoğraflar bırakıyoruz. Ayrıldığımız günden sonraki buluşmaya kadar her sabah biri açılıyor; hiçbir gün boş geçmiyor.</p></div>
        <p class="vd-ust center" id="vdUst"></p><div id="vdBugun" class="vd-bugun"></div><div id="vdGecmis" class="vd-gecmis"></div><section class="card" id="vdBirak"></section>`;
      el.addEventListener('change', async (e) => {
        if (e.target.id === 'vdGun' && e.target.value) {
          const r = await K.cloud.add('vedagun', { day: e.target.value });
          r && !gunler.some((x) => x.id === r.id) && gunler.push(r);
          return render();
        }
        const f = e.target.closest('[data-vd-foto]');
        if (f && f.files[0]) {
          const [full, thumb] = await Promise.all([K.medya.image(f.files[0], 1400, 0.82), K.medya.image(f.files[0], 480, 0.78)]);
          const big = await K.cloud.add('vedaimg', { img: full });
          birak({ tur: 'foto', thumb, full: big ? big.id : '', text: K.$('#vdMetin', root).value.trim() });
        }
      });
      el.addEventListener('click', async (e) => {
        if (e.target.closest('[data-vd-ac]')) {
          await bugunAc();
          K.fx.confetti({ count: 60, shapes: ['heart'] });
          return render();
        }
        const im = e.target.closest('[data-vd-full]');
        if (im) return K.medya.rowUrl(im.dataset.vdFull, 'img').then((u) => u && (im.src = u, im.removeAttribute('data-vd-full')));
        const s = e.target.closest('[data-vd-ses]');
        if (s) return K.medya.cal(rows.find((r) => r.id === s.dataset.vdSes).data.audio);
        if (e.target.closest('[data-vd-not]')) {
          const text = K.$('#vdMetin', root).value.trim();
          if (text) birak({ tur: 'not', text });
          return;
        }
        const kb = e.target.closest('[data-vd-kaydet]');
        if (kb) {
          const res = await K.medya.kaydet(kb, 60);
          res && birak({ tur: 'ses', audio: res.audio, dur: res.dur, text: K.$('#vdMetin', root).value.trim() });
        }
      });
    },
    enter() {
      render();
    },
  });
  K.vedadegil = { bugunAc, basladi };
})();
