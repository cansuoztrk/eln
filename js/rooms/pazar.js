/* Oda: Pazar Sohbeti — her hafta beş küçük soru: "Bu hafta seni en çok ne mutlu etti?", "Benden neye ihtiyacın var?"
   Cevaplar mühürlü yazılır; ikiniz de bitirince yan yana açılır. Pazar günü ana salonda hatırlatılır; Kitty'nin
   Haftanın Mektubu'na bir cevaptan bir cümle girer. Kayıtlar: pazar {w (haftanın pazartesisi), a: [5 cevap]} */
(function () {
  'use strict';
  const K = window.K;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  const mine = () => (K.isOwner() ? 'me' : 'her');
  const other = () => (K.isOwner() ? 'her' : 'me');
  const nameOf = (w) => (w === 'me' ? C.myPet : C.herPet);
  // Her hafta sabit iki soru + havuzdan üç soru
  const SABIT = ['Bu hafta seni en çok ne mutlu etti?', 'Bu hafta benden neye ihtiyacın vardı (ya da var)?'];
  const HAVUZ = [
    'Bu hafta beni en çok ne zaman özledin?', 'Bu hafta seni yoran bir şey oldu mu? Anlatmak ister misin?', 'Gelecek hafta birlikte ne yapalım?',
    'Bu hafta benimle ilgili hoşuna giden küçük bir şey?', 'Bu hafta kendinle gurur duyduğun bir an?', 'Bu hafta bir şarkı olsaydı hangisi olurdu?',
    'Bu hafta bir şeyi farklı yapmamı ister miydin?', 'Kavuşunca ilk yapmak istediğin şey bu hafta neydi?', 'Bu hafta seni güldüren en komik şey?',
    'Bu hafta aklından hiç çıkmayan bir düşünce?', 'Bu hafta kendine nasıl iyi baktın?', 'Bu hafta bana söylemek isteyip söyleyemediğin bir şey var mı?',
    'Bu hafta bir rüyanda var mıydım?', 'Bu hafta en sevdiğin anımız aklına geldi mi? Hangisi?', 'Gelecek hafta seni ne heyecanlandırıyor?',
    'Bu hafta sana nasıl daha iyi destek olabilirdim?', 'Bu haftanın rengi ne olurdu, neden?', 'Bu hafta öğrendiğin yeni bir şey?',
    'Bu hafta bir gün yan yana olsaydık nereye giderdik?', 'Bu hafta kalede en çok sevdiğin şey neydi?', 'Bu hafta teşekkür etmek istediğin bir şey?',
  ];
  function weekOf(k) {
    const d = new Date(k + 'T12:00:00Z');
    d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
    return d.toISOString().slice(0, 10);
  }
  const wk = () => weekOf(T.todayKey());
  const qs = (w) => {
    const r = K.rng(K.hash('pazar' + w));
    return SABIT.concat(K.shuffle(HAVUZ.slice(), r).slice(0, 3));
  };
  let rows = [], loaded = false, root = null, view = '';
  const of = (w, who) => rows.filter((r) => r.data.w === w && r.who === who).pop() || null;
  function render() {
    if (!root || K.activeRoom !== 'pazar') return;
    const w = view || wk();
    const Q = qs(w);
    const me = of(w, mine()), ot = of(w, other());
    const both = me && ot;
    const isNow = w === wk();
    K.$('#pzBas', root).innerHTML = `<p class="card-eyebrow">${K.esc(T.fmtShort(w))} haftası${isNow ? ' · bu hafta' : ''}</p><h2>${both ? 'İkiniz de cevapladınız' : me ? `${K.esc(nameOf(other()))} bekleniyor` : 'Beş küçük soru'}</h2>`;
    K.$('#pzSorular', root).innerHTML = both
      ? Q.map((q, i) => `<div class="pz-soru"><p class="pz-q">${i + 1}. ${K.esc(q)}</p><div class="pz-cev"><div class="her"><small>${K.esc(nameOf('her'))}</small><p class="hand">${K.esc((of(w, 'her').data.a || [])[i] || '—')}</p></div><div class="me"><small>${K.esc(nameOf('me'))}</small><p class="hand">${K.esc((of(w, 'me').data.a || [])[i] || '—')}</p></div></div></div>`).join('')
      : me
      ? `<p class="pz-muhur">🔒 Cevapların mühürlü. ${K.esc(nameOf(other()))} de yazınca ikiniz birden açılacak.</p>`
      : isNow
      ? `${Q.map((q, i) => `<label class="pz-soru"><span class="pz-q">${i + 1}. ${K.esc(q)}</span><textarea class="input" data-pz="${i}" maxlength="300" rows="2"></textarea></label>`).join('')}<div class="row"><button type="button" class="btn red" data-pz-gonder>🔒 Mühürle</button></div>`
      : '<p class="muted">Bu hafta cevap yazılmamış.</p>';
    const weeks = [...new Set(rows.map((r) => r.data.w))].sort().reverse().slice(0, 12);
    K.$('#pzGecmis', root).innerHTML = weeks.length ? `<p class="card-eyebrow">Geçmiş pazarlar</p><div class="pz-haftalar">${weeks.map((x) => `<button type="button" class="btn ${x === w ? 'red' : 'soft'} small" data-pz-hafta="${x}">${K.esc(T.fmtShort(x))}${of(x, 'me') && of(x, 'her') ? ' 💞' : ''}</button>`).join('')}</div>` : '';
  }
  async function send(btn) {
    const a = K.$$('[data-pz]', root).map((t) => (t.value || '').trim().slice(0, 300));
    if (a.filter(Boolean).length < 3) return K.fx.toast('En az üç soruya cevap yaz.', { duration: 2200 });
    btn.disabled = true;
    const r = await K.cloud.add('pazar', { w: wk(), a });
    if (!r) return (btn.disabled = false), K.fx.toast('Kaydedilemedi.');
    rows.some((x) => x.id === r.id) || rows.push(r);
    K.audio.sfx.chime();
    K.stickers.award('pazar');
    const ot = of(wk(), other());
    K.ping(ot ? '💞 Pazar Sohbeti açıldı' : '☕ Pazar Sohbeti: cevapları mühürlendi', ot ? `İkiniz de yazdınız. ${K.ek(K.meName(), 'in')} cevapları seni bekliyor.` : `${K.meName()} bu haftanın beş sorusunu cevapladı. Sen de yazınca ikisi birden açılacak.`, ['coffee'], { click: K.roomUrl('pazar') });
    render();
  }
  // Haftanın Mektubu için: o haftanın cevaplarından bir cümle
  function quote(w) {
    const a = of(w, 'her'), b = of(w, 'me');
    if (!a || !b) return null;
    const pick = [a, b][K.hash(w) % 2];
    const i = (pick.data.a || []).findIndex((x, n) => n === 0 && x) >= 0 ? 0 : (pick.data.a || []).findIndex(Boolean);
    return i >= 0 ? { who: pick.who, q: qs(w)[i], a: pick.data.a[i] } : null;
  }
  K.on('cloud', async (ok) => {
    if (!ok) return;
    rows = await K.cloud.list('pazar', 600);
    loaded = true;
    K.cloud.on('pazar', (r) => rows.some((x) => x.id === r.id) || (rows.push(r), render(), K.renderSpecials && !K.activeRoom && K.renderSpecials()));
  });
  K.specialHooks = (K.specialHooks || []).concat(() => {
    if (!loaded) return [];
    const w = wk(), me = of(w, mine()), ot = of(w, other());
    if (me && ot && K.store.get('pzGor') !== w) return [{ key: 'pazar', icon: 'chat', title: '💞 Pazar Sohbeti açıldı', text: 'İkiniz de cevapladınız; beş cevap yan yana.', run: () => (K.store.set('pzGor', w), K.go('pazar')), cta: 'Oku' }];
    if (!me && (T.baku().wd === 0 || ot)) return [{ key: 'pazar', icon: 'chat', title: '☕ Pazar Sohbeti', text: ot ? `${nameOf(other())} bu haftanın sorularını cevapladı; seninkini bekliyor.` : 'Bu haftanın beş küçük sorusu hazır.', room: 'pazar', cta: 'Cevapla' }];
    return [];
  });
  K.room({
    id: 'pazar',
    wing: 'kalp',
    title: 'Pazar Sohbeti',
    sub: 'Haftada beş küçük soru',
    icon: 'chat',
    color: '#FFF1E0',
    hidden: () => !K.cloud || !K.cloud.enabled,
    badge: () => (loaded && !of(wk(), mine()) ? '5' : ''),
    init(el) {
      root = el;
      el.innerHTML = `<div class="room-intro"><p>Her hafta beş küçük soru. Cevaplar mühürlü yazılıyor; ikimiz de bitirince yan yana açılıyor. Acele yok, bütün hafta açık; en güzeli pazar akşamı, bir çayla.</p></div>
        <section class="card pz-kart"><div id="pzBas"></div><div id="pzSorular"></div></section><section class="card" id="pzGecmis"></section>`;
      el.addEventListener('click', (e) => {
        const g = e.target.closest('[data-pz-gonder]');
        if (g) return send(g);
        const h = e.target.closest('[data-pz-hafta]');
        h && ((view = h.dataset.pzHafta === wk() ? '' : h.dataset.pzHafta), render());
      });
    },
    enter() {
      view = '';
      render();
    },
  });
  K.pazar = { quote, weekOf };
})();
