/* Oda: Mutfaklarımız — iki ailenin tariflerinden bir defter: bir annenin dolması, bir büyükannenin baklavası. Her tarifin
   yanında onu anlatan kısa bir ses. Birlikte pişirdiğimiz ilk yemek defterin son sayfası olur; o güne kadar son sayfa boş
   bekler.
   Kayıtlar: tarif {ad, aile, malzeme, yapilis, audio?, dur?, son?} */
(function () {
  'use strict';
  const K = window.K;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  const nameOf = (w) => (w === 'me' ? C.myPet : C.herPet);
  let rows = [], root = null, sayfa = 0, ses = null;
  const sirali = () => {
    const l = rows.filter((r) => !r.data.son).sort((a, b) => a.at - b.at);
    const son = rows.filter((r) => r.data.son).sort((a, b) => a.at - b.at)[0];
    return { l, son };
  };
  function sayfaHTML(r, i, toplam) {
    const satir = (s) => String(s || '').split('\n').map((x) => x.trim()).filter(Boolean);
    return `<article class="tf-sayfa ${r.data.son ? 'son' : ''}"><p class="tf-no">${r.data.son ? 'Son sayfa' : `${i + 1} / ${toplam}`}</p><h3>${K.esc(r.data.ad)}</h3><p class="tf-aile">${K.esc(r.data.aile || '')} · ${K.esc(nameOf(r.who))} yazdı</p>
      ${r.data.audio ? `<button type="button" class="btn soft small" data-tf-ses="${r.id}">▶ Anlatışını dinle (${Math.round(r.data.dur || 0)} sn)</button>` : ''}
      <div class="tf-iki"><div><h4>Malzemeler</h4><ul>${satir(r.data.malzeme).map((x) => `<li>${K.esc(x)}</li>`).join('')}</ul></div><div><h4>Yapılışı</h4><ol>${satir(r.data.yapilis).map((x) => `<li>${K.esc(x)}</li>`).join('')}</ol></div></div></article>`;
  }
  function render() {
    if (!root || K.activeRoom !== 'tarifler') return;
    const { l, son } = sirali();
    const toplam = l.length + 1;
    sayfa = K.clamp(sayfa, 0, toplam - 1);
    K.$('#tfIcindekiler', root).innerHTML = l.map((r, i) => `<button type="button" class="chip ${i === sayfa ? 'on' : ''}" data-tf-git="${i}">${K.esc(r.data.ad)}</button>`).join('') + `<button type="button" class="chip ${sayfa === toplam - 1 ? 'on' : ''}" data-tf-git="${toplam - 1}">🍳 Son sayfa</button>`;
    K.$('#tfDefter', root).innerHTML =
      sayfa < l.length
        ? sayfaHTML(l[sayfa], sayfa, l.length)
        : son
          ? sayfaHTML(son, sayfa, l.length)
          : `<article class="tf-sayfa son bos"><p class="tf-no">Son sayfa</p><h3>Birlikte pişireceğimiz ilk yemek</h3><p class="muted">Bu sayfa boş bekliyor. Aynı mutfakta ilk yemeğimizi pişirdiğimiz gün buraya yazacağız.</p></article>`;
    K.$('#tfOk', root).innerHTML = `<button type="button" class="btn ghost small" data-tf-yon="-1" ${sayfa ? '' : 'disabled'}>‹ Önceki</button><button type="button" class="btn ghost small" data-tf-yon="1" ${sayfa < toplam - 1 ? '' : 'disabled'}>Sonraki ›</button>`;
    const sonVar = Boolean(son);
    K.$('#tfSonSec', root).hidden = sonVar;
  }
  K.on('cloud', async (ok) => {
    if (!ok) return;
    rows = await K.cloud.list('tarif', 200);
    K.cloud.on('tarif', (r) => rows.some((x) => x.id === r.id) || (rows.push(r), render()));
  });
  K.room({
    id: 'tarifler',
    wing: 'hazine',
    title: 'Mutfaklarımız',
    sub: 'İki ailenin tarif defteri',
    icon: 'pot',
    color: '#FFF1E0',
    hidden: () => !K.cloud || !K.cloud.enabled,
    init(el) {
      root = el;
      el.innerHTML = `<div class="room-intro"><p>İki ailenin tariflerinden bir defter. Her tarifin yanında onu anlatan kısa bir ses. Birlikte pişirdiğimiz ilk yemek defterin son sayfası olacak.</p></div>
        <div class="tf-icindekiler" id="tfIcindekiler"></div><div class="tf-defter" id="tfDefter"></div><div class="row center" id="tfOk"></div>
        <details class="card tf-yeni"><summary>✍️ Deftere tarif yaz</summary>
          <input class="input" id="tfAd" maxlength="60" placeholder="Tarifin adı (Annemin dolması)"><input class="input" id="tfAile" maxlength="60" placeholder="Kimden? (Annem, babaannem...)">
          <textarea class="textarea" id="tfMalzeme" maxlength="1500" placeholder="Malzemeler (her satıra bir tane)"></textarea><textarea class="textarea" id="tfYapilis" maxlength="3000" placeholder="Yapılışı (her satıra bir adım)"></textarea>
          <label class="tf-son" id="tfSonSec"><input type="checkbox" id="tfSon"> Bu, birlikte pişirdiğimiz ilk yemek (son sayfa)</label>
          <div class="row"><button type="button" class="btn ghost small" data-tf-kaydet>🎙 Anlatışını kaydet</button><span class="muted small" id="tfSesBilgi"></span></div>
          <div class="row"><button type="button" class="btn red" data-tf-yaz>Deftere yaz</button></div></details>`;
      el.addEventListener('click', async (e) => {
        const g = e.target.closest('[data-tf-git]');
        if (g) return (sayfa = +g.dataset.tfGit), render();
        const y = e.target.closest('[data-tf-yon]');
        if (y) return (sayfa += +y.dataset.tfYon), render();
        const s = e.target.closest('[data-tf-ses]');
        if (s) return K.medya.cal(rows.find((r) => r.id === s.dataset.tfSes).data.audio);
        const kb = e.target.closest('[data-tf-kaydet]');
        if (kb) {
          const res = await K.medya.kaydet(kb, 60);
          if (res) (ses = res), (K.$('#tfSesBilgi', root).textContent = `Ses hazır (${Math.round(res.dur)} sn)`);
          return;
        }
        if (!e.target.closest('[data-tf-yaz]')) return;
        const v = (id) => K.$(id, root).value.trim();
        const data = { ad: v('#tfAd'), aile: v('#tfAile'), malzeme: v('#tfMalzeme'), yapilis: v('#tfYapilis') };
        if (!data.ad || !(data.malzeme || data.yapilis)) return K.fx.toast('Adı ve malzemeleri ya da yapılışı yaz.');
        if (K.$('#tfSon', root).checked) data.son = true;
        if (ses) Object.assign(data, { audio: ses.audio, dur: ses.dur });
        const r = await K.cloud.add('tarif', data);
        if (!r) return;
        rows.some((x) => x.id === r.id) || rows.push(r);
        ['#tfAd', '#tfAile', '#tfMalzeme', '#tfYapilis'].forEach((id) => (K.$(id, root).value = ''));
        K.$('#tfSon', root).checked = false;
        K.$('#tfSesBilgi', root).textContent = '';
        ses = null;
        K.$('.tf-yeni', root).open = false;
        const { l } = sirali();
        sayfa = data.son ? l.length : l.findIndex((x) => x.id === r.id);
        K.stickers.award(data.son ? 'tarifson' : 'tarif');
        if (data.son) K.fx.confetti({ count: 160, shapes: ['heart', 'star'] });
        K.ping(data.son ? `🍳 Defterin son sayfası yazıldı: ${data.ad}` : `🍲 ${K.meName()} deftere bir tarif yazdı: ${data.ad}`, data.aile || 'Mutfaklarımız', ['stew'], { click: K.roomUrl('tarifler') });
        render();
      });
    },
    enter() {
      render();
    },
  });
})();
