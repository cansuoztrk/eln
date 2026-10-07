/* Oda: Bizpedia — iç şakalarımızın, lakaplarımızın ve bize ait kelimelerin ansiklopedisi. Her maddenin bir hikâyesi,
   ilk geçtiği gün ve o güne (Gün Gün Biz) ya da bir odaya giden bağlantısı olur. İkimiz de madde ekler, düzenler;
   her düzenleme kayda geçer, son hâli görünür. Kitty birkaç maddenin taslağını hazırladı (kasada).
   Kayıtlar: madde {mid, title, body, first, room} (aynı mid'in son kaydı geçerli; body boşsa madde silinmiş) */
(function () {
  'use strict';
  const K = window.K;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  const mine = () => (K.isOwner() ? 'me' : 'her');
  const nameOf = (w) => (w === 'me' ? C.myPet : C.herPet);
  const BP = () => D.bizpedia || { seed: [] };
  let rows = [], loaded = false, root = null, q = '', openId = '';
  // Maddeler: kasadaki taslaklar + bulut kayıtları (son sürüm)
  function entries() {
    const m = {};
    (BP().seed || []).forEach(([mid, title, body, first, room]) => (m[mid] = { mid, title: K.fill(title), body: K.fill(body), first: first || '', room: room || '', who: 'kitty', at: 0, n: 0 }));
    rows.slice().sort((a, b) => a.at - b.at).forEach((r) => {
      const prev = m[r.data.mid];
      m[r.data.mid] = { mid: r.data.mid, title: r.data.title, body: r.data.body, first: r.data.first || '', room: r.data.room || '', who: r.who, at: r.at, n: (prev ? prev.n : 0) + 1, firstWho: prev ? prev.firstWho || prev.who : r.who };
    });
    return Object.values(m).filter((e) => e.body).sort((a, b) => a.title.localeCompare(b.title, 'tr'));
  }
  const norm = (s) => K.norm ? K.norm(s) : String(s).toLocaleLowerCase('tr');
  function render() {
    if (!root || K.activeRoom !== 'bizpedia') return;
    const all = entries();
    const list = q ? all.filter((e) => norm(e.title + ' ' + e.body).includes(norm(q))) : all;
    const groups = {};
    list.forEach((e) => (groups[e.title[0].toLocaleUpperCase('tr')] = groups[e.title[0].toLocaleUpperCase('tr')] || []).push(e));
    K.$('#bpSay', root).textContent = `${all.length} madde`;
    K.$('#bpListe', root).innerHTML = Object.keys(groups).length
      ? Object.entries(groups).map(([h, es]) => `<section class="bp-harf"><h3>${K.esc(h)}</h3>${es.map((e) => `<article class="bp-madde ${e.mid === openId ? 'acik' : ''}" id="bp-${K.esc(e.mid)}"><button type="button" class="bp-baslik" data-bp-ac="${K.esc(e.mid)}"><b>${K.esc(e.title)}</b><small>${e.who === 'kitty' ? 'Kitty\'nin taslağı' : `${K.esc(nameOf(e.who))} · ${e.n} sürüm`}</small></button>
          ${e.mid === openId ? `<div class="bp-govde"><p>${K.esc(e.body).replace(/\n/g, '<br>')}</p>${e.first ? `<p class="bp-ilk">📅 İlk geçtiği gün: <a href="#" data-bp-gun="${K.esc(e.first)}">${K.esc(T.fmt(e.first))}</a></p>` : ''}${e.room ? `<p class="bp-ilk">🚪 <a href="#${K.esc(e.room)}">${K.esc(K.val((K.rooms.find((r) => r.id === e.room) || {}).title || e.room))}</a></p>` : ''}<div class="row"><button type="button" class="btn soft small" data-bp-duzenle="${K.esc(e.mid)}">✏️ Düzenle</button></div></div>` : ''}</article>`).join('')}</section>`).join('')
      : `<p class="muted center">${q ? 'Bu kelimeyle bir madde yok. Sen yaz!' : 'Henüz madde yok.'}</p>`;
  }
  function edit(mid) {
    const e = mid ? entries().find((x) => x.mid === mid) : null;
    const m = K.ui.modal({
      label: 'Bizpedia maddesi',
      cls: 'bp-sheet',
      html: `<p class="card-eyebrow">Bizpedia</p><h2>${e ? 'Maddeyi düzenle' : 'Yeni madde'}</h2>
        <input class="input" id="bpT" maxlength="40" placeholder="Başlık (ör. User155)" value="${K.esc(e ? e.title : q)}">
        <textarea class="input" id="bpB" maxlength="1200" rows="6" placeholder="Nedir, nereden çıktı, ne zaman söylenir?">${K.esc(e ? e.body : '')}</textarea>
        <label class="bp-lbl">İlk geçtiği gün (istersen)<input class="input" type="date" id="bpF" value="${K.esc(e ? e.first : '')}"></label>
        <div class="row"><button type="button" class="btn red" data-bp-kaydet>Kaydet</button>${e ? '<button type="button" class="btn ghost small" data-bp-sil>Maddeyi kaldır</button>' : ''}</div>`,
    });
    m.body.addEventListener('click', async (ev) => {
      const del = ev.target.closest('[data-bp-sil]');
      const save = ev.target.closest('[data-bp-kaydet]');
      if (!del && !save) return;
      const title = (K.$('#bpT', m.body).value || '').trim().slice(0, 40);
      const body = del ? '' : (K.$('#bpB', m.body).value || '').trim().slice(0, 1200);
      if (!del && (!title || !body)) return K.fx.toast('Başlık ve açıklama yaz.', { duration: 1800 });
      const r = await K.cloud.add('madde', { mid: e ? e.mid : 'm' + Date.now().toString(36), title: title || e.title, body, first: K.$('#bpF', m.body).value || '', room: e ? e.room : '' });
      if (!r) return K.fx.toast('Kaydedilemedi.');
      rows.some((x) => x.id === r.id) || rows.push(r);
      m.close();
      openId = r.data.mid;
      K.audio.sfx.paper ? K.audio.sfx.paper() : K.audio.sfx.pop();
      K.stickers.award('bizpedia');
      if (!e && body) K.ping(`📚 Bizpedia'ya yeni madde: ${title}`, body.slice(0, 100), ['books'], { click: K.roomUrl('bizpedia') });
      render();
    });
  }
  K.on('cloud', async (ok) => {
    if (!ok) return;
    rows = await K.cloud.list('madde', 2000);
    loaded = true;
    K.cloud.on('madde', (r) => rows.some((x) => x.id === r.id) || (rows.push(r), render()));
  });
  K.room({
    id: 'bizpedia',
    wing: 'anilar',
    title: 'Bizpedia',
    sub: 'İç şakalarımızın ansiklopedisi',
    icon: 'book',
    color: '#EEF3FF',
    hidden: () => !K.cloud || !K.cloud.enabled,
    badge: () => (loaded ? String(entries().length) : ''),
    init(el) {
      root = el;
      el.innerHTML = `<div class="room-intro"><p>Bize ait kelimeler, lakaplar ve iç şakalar. Her maddenin bir hikâyesi ve ilk geçtiği gün var. İkimiz de yazıyor, düzeltiyoruz; Kitty birkaç maddenin taslağını hazırladı.</p></div>
        <div class="bp-ust"><input class="input" id="bpAra" type="search" placeholder="Bizpedia'da ara..."><button type="button" class="btn red small" data-bp-yeni>＋ Madde</button><button type="button" class="btn soft small" data-bp-rastgele>🎲</button></div>
        <p class="muted small" id="bpSay"></p><div id="bpListe"></div>`;
      K.$('#bpAra', el).addEventListener('input', (e) => ((q = e.target.value.trim()), render()));
      el.addEventListener('click', (e) => {
        const a = e.target.closest('[data-bp-ac]');
        if (a) return (openId = openId === a.dataset.bpAc ? '' : a.dataset.bpAc), render();
        const d = e.target.closest('[data-bp-duzenle]');
        if (d) return edit(d.dataset.bpDuzenle);
        if (e.target.closest('[data-bp-yeni]')) return edit('');
        if (e.target.closest('[data-bp-rastgele]')) {
          const all = entries();
          if (!all.length) return;
          openId = K.pick(all).mid;
          q = '';
          K.$('#bpAra', el).value = '';
          render();
          const t = K.$('#bp-' + openId, el);
          t && t.scrollIntoView({ behavior: K.reduced ? 'auto' : 'smooth', block: 'center' });
          return;
        }
        const g = e.target.closest('[data-bp-gun]');
        if (g) {
          e.preventDefault();
          K.gungun ? K.gungun.open(g.dataset.bpGun) : K.go('gungun');
        }
      });
    },
    enter() {
      render();
    },
  });
})();
