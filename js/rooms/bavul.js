/* Oda: Ortak Bavul — ikimizin de eklediği bavul ve hediye listesi. Her madde kimin bavuluna girecekse onun adıyla
   durur; bavula konunca işaretlenir. Biniş kartında uçuş varsa yola çıkmadan bir gün önce bavul sahibine "unutma"
   bildirimi gider (kale açıkken üç günlük pencere içinde planlanır).
   Kayıtlar: bavul {uid, text, tur: esya|hediye, kim: me|her, ok, gone} (aynı uid'nin son kaydı geçerli) */
(function () {
  'use strict';
  const K = window.K;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  const mine = () => (K.isOwner() ? 'me' : 'her');
  const nameOf = (w) => (w === 'me' ? C.myPet : C.herPet);
  let rows = [], root = null, tur = 'esya';
  const durum = () => {
    const m = {};
    rows.slice().sort((a, b) => a.at - b.at).forEach((r) => (m[r.data.uid] = Object.assign({ by: (m[r.data.uid] || {}).by || r.who }, m[r.data.uid] || {}, r.data)));
    return Object.values(m).filter((x) => !x.gone);
  };
  async function yaz(data) {
    const r = await K.cloud.add('bavul', data);
    r && !rows.some((x) => x.id === r.id) && rows.push(r);
    render();
    return r;
  }
  function unutma() {
    const f = K.bilet && K.bilet.get && K.bilet.get();
    if (!f || !C.ntfyTopic) return;
    const kim = 'me';
    if (mine() !== kim || K.store.get('bavulUnutma') === f.id) return;
    const ph = K.bilet.phase();
    if (!ph || ph.k !== 'before') return;
    const at = ph.dep - 864e5;
    const later = K.later(at);
    if (!later) return;
    const eksik = durum().filter((x) => x.kim === kim && !x.ok).length;
    K.store.set('bavulUnutma', f.id);
    K.ntfyTo(kim, '🧳 Yarın yola çıkıyorsun', eksik ? `Bavulda ${eksik} şey daha bekliyor. Kontrol et.` : 'Bavul tamam görünüyor. Pasaport, bilet, şarj aleti!', ['luggage'], Object.assign({ click: K.roomUrl('bavul') }, later));
  }
  function render() {
    if (!root || K.activeRoom !== 'bavul') return;
    const l = durum();
    K.$$('[data-bv-tur]', root).forEach((b) => b.classList.toggle('on', b.dataset.bvTur === tur));
    const liste = l.filter((x) => (x.tur || 'esya') === tur);
    const grup = (w) => {
      const g = liste.filter((x) => x.kim === w);
      return `<section class="bv-grup"><h3>${K.esc(K.ek(nameOf(w), 'in'))} bavulu <small>${g.filter((x) => x.ok).length}/${g.length}</small></h3><ul>${g.map((x) => `<li class="${x.ok ? 'ok' : ''}"><button type="button" class="bv-kutu" data-bv-ok="${x.uid}" aria-pressed="${x.ok ? 'true' : 'false'}">${x.ok ? '✓' : ''}</button><span>${K.esc(x.text)}</span><small>${x.by !== w ? K.esc(nameOf(x.by)) + ' ekledi' : ''}</small><button type="button" class="sn-sil" data-bv-sil="${x.uid}" aria-label="Sil">×</button></li>`).join('') || '<li class="muted small">Boş</li>'}</ul></section>`;
    };
    const f = K.bilet && K.bilet.get && K.bilet.get();
    K.$('#bvUst', root).innerHTML = f ? `✈️ ${K.esc(T.fmt(f.date, true))} · ${l.filter((x) => x.ok).length}/${l.length} hazır` : `${l.filter((x) => x.ok).length}/${l.length} hazır`;
    K.$('#bvListe', root).innerHTML = grup('me') + grup('her');
  }
  K.on('cloud', async (ok) => {
    if (!ok) return;
    rows = await K.cloud.list('bavul', 500);
    K.cloud.on('bavul', (r) => rows.some((x) => x.id === r.id) || (rows.push(r), render()));
    setTimeout(unutma, 4000);
  });
  K.room({
    id: 'bavul',
    wing: 'kalp',
    title: 'Ortak Bavul',
    sub: 'Eşyalar ve hediyeler',
    icon: 'gift',
    color: '#EFE6FF',
    hidden: () => !K.cloud || !K.cloud.enabled,
    init(el) {
      root = el;
      el.innerHTML = `<div class="room-intro"><p>İkimizin de eklediği bavul ve hediye listesi. Bavula koyunca işaretle; yola çıkmadan bir gün önce kale hatırlatır.</p></div>
        <div class="k3-seg"><button type="button" data-bv-tur="esya">🧳 Bavul</button><button type="button" data-bv-tur="hediye">🎁 Hediyeler</button></div>
        <p class="bv-ust center" id="bvUst"></p><div id="bvListe" class="bv-liste"></div>
        <section class="card"><div class="row"><input class="input" id="bvMetin" maxlength="80" placeholder="Ne eklensin?"><select class="input bv-kim" id="bvKim"><option value="me">${K.esc(K.ek(C.myPet, 'in'))}</option><option value="her">${K.esc(K.ek(C.herPet, 'in'))}</option></select><button type="button" class="btn red small" data-bv-ekle>Ekle</button></div></section>`;
      K.$('#bvKim', el).value = mine();
      el.addEventListener('click', async (e) => {
        const t = e.target.closest('[data-bv-tur]');
        if (t) return (tur = t.dataset.bvTur), render();
        const o = e.target.closest('[data-bv-ok]');
        if (o) {
          const x = durum().find((m) => m.uid === o.dataset.bvOk);
          if (!x) return;
          await yaz({ uid: x.uid, text: x.text, tur: x.tur, kim: x.kim, ok: !x.ok });
          if (!x.ok) K.audio.sfx && K.audio.sfx.pop && K.audio.sfx.pop();
          if (durum().length >= 5 && durum().every((m) => m.ok)) K.fx.confetti({ count: 120 }), K.stickers.award('bavultamam');
          return;
        }
        const s = e.target.closest('[data-bv-sil]');
        if (s) {
          const x = durum().find((m) => m.uid === s.dataset.bvSil);
          return x && yaz({ uid: x.uid, text: x.text, tur: x.tur, kim: x.kim, gone: true });
        }
        if (!e.target.closest('[data-bv-ekle]')) return;
        const text = K.$('#bvMetin', root).value.trim();
        if (!text) return K.$('#bvMetin', root).focus();
        await yaz({ uid: 'b' + Date.now().toString(36), text, tur, kim: K.$('#bvKim', root).value, ok: false });
        K.$('#bvMetin', root).value = '';
        K.stickers.award('bavul');
      });
    },
    enter() {
      render();
    },
  });
})();
