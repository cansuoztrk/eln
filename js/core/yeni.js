/* Kale 2.0 — Kalede yeni ne var? Güncellemeden sonra kaleye ilk gelişte bir kez, hikâye gibi kayan sayfalar:
   her yenilik bir sayfa, "Dene" ile doğrudan oraya. Zilden ("Kalede yeni ne var?") her zaman yeniden açılır.
   İlk kez gelen biri bunu görmez (ona zaten kale turu var). */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;

  const key = () => 'yeni-' + (K.isOwner() ? 'me' : 'her');
  const latest = () => (D.yenilikler || []).slice(-1)[0] || null;
  // Görülmemiş bütün sürümlerin yenilikleri birlikte (elle açınca son ikisi)
  function pack(manual) {
    const all = D.yenilikler || [];
    const seen = K.store.get(key(), 0) || 0;
    const vs = manual ? all.slice(-2) : all.filter((v) => v.v > seen);
    const pick = vs.length ? vs : all.slice(-1);
    const items = [];
    pick.slice().reverse().forEach((v) => (v.items || []).forEach((it) => items.some((x) => x[0] === it[0]) || items.push(it)));
    return { v: all.length ? all[all.length - 1].v : 0, title: (pick[pick.length - 1] || {}).title, items };
  }
  const NOROOM = ['kaydir', 'hatirlat', 'gece', 'gunbatimi', 'aynigok', 'canli', 'kapak', 'mevsim', 'akilli', 'gece2', 'beraber', 'aynisaniye', 'yirmibir', 'cevrimdisi', 'postaci', 'yeniyil', 'ilkkar', 'bildirim', 'mozaikpul', 'kavusmamodu', 'gecmisbugun'];
  const ALIAS = { uykubiz: 'gece', evses: 'ev', aylikyedek: 'yedek' };
  const target = (id) => ALIAS[id] || id.replace(/21$/, '');
  const roomOk = (id) => {
    const r = K.rooms.find((x) => x.id === id);
    return Boolean(r && !(typeof r.hidden === 'function' ? r.hidden() : r.hidden));
  };
  function items(v) {
    return (v.items || []).filter(([id]) => {
      if (id === 'telefon') return !K.isOwner() && Boolean(C.ntfyTopicHer) && Boolean(K.telefon);
      if (id === 'cicek') return Boolean(K.$('#cicek') && !K.$('#cicek').hidden);
      if (id === 'kaydir') return true;
      if (id === 'hatirlat') return Boolean(K.hatirlat && C.ntfyTopicHer);
      if (id === 'kavanoz21') return !K.isOwner() && roomOk('kavanoz');
      if (id === 'salon') return Boolean(K.salon);
      if (id === 'endise') return Boolean(K.endise && K.cloud && K.cloud.enabled);
      if (id === 'gece') return Boolean(K.$('#geceBtn'));
      if (id === 'uykubiz') return roomOk('gece') && Boolean(K.cloud && K.cloud.enabled);
      if (id === 'gunbatimi') return Boolean(K.gunbatimi && K.cloud && K.cloud.enabled);
      if (id === 'kisayol') return Boolean(K.kisayol && (K.isOwner() ? C.ntfyTopicHer : C.ntfyTopic));
      if (id === 'opucuk' || id === 'nabiz') return Boolean(K.dokunus && K.cloud && K.cloud.enabled);
      if (id === 'aynigok') return Boolean(K.gercekhava);
      if (id === 'widget') return Boolean(K.widget);
      if (id === 'atolye') return Boolean(K.atolye);
      if (id === 'kesit') return Boolean(K.kesit);
      if (id === 'dock') return Boolean(K.akilli && K.$('#dock'));
      if (id === 'nfc') return Boolean(K.kisayol && K.kisayol.nfc && (K.isOwner() ? C.ntfyTopicHer : C.ntfyTopic));
      if (['canli', 'kapak', 'mevsim', 'akilli', 'gece2', 'yirmibir', 'cevrimdisi'].includes(id)) return true;
      if (id === 'beraber' || id === 'aynisaniye') return Boolean(K.cloud && K.cloud.enabled);
      if (id === 'panorama') return Boolean(K.panorama && K.$('#yolPano'));
      if (id === 'egbak' || id === 'kanatses') return Boolean(K.atolye);
      if (id === 'faceid') return Boolean(K.faceid && window.PublicKeyCredential && !K.faceid.state());
      if (id === 'takvimabone') return Boolean(K.takvimabone && K.cloud && K.cloud.enabled);
      if (id === 'seslikomut') return Boolean(K.seslikomut && K.seslikomut.ok());
      if (id === 'sor') return Boolean(K.sor && K.ara);
      if (id === 'postaci') return Boolean(K.postaci);
      if (['yeniyil', 'ilkkar', 'bildirim', 'mozaikpul'].includes(id)) return true;
      if (id === 'k3') return Boolean(K.atolye);
      if (id === 'yakinlik') return Boolean(K.yakinlik && K.cloud && K.cloud.enabled);
      if (id === 'kavusmamodu' || id === 'gecmisbugun') return Boolean(K.cloud && K.cloud.enabled);
      return roomOk(id);
    });
  }
  let view = null;
  function open(manual) {
    const v = pack(manual === true);
    if (!v.items.length || view) return;
    const list = items(v);
    if (!list.length) return;
    K.store.set(key(), v.v);
    let i = 0;
    view = K.el(`<div class="yn" role="dialog" aria-modal="true" aria-label="${K.esc(v.title || 'Kalede yeni ne var?')}">
      <div class="yn-top"><div class="yn-segs">${list.map(() => '<i><b></b></i>').join('')}</div><button type="button" class="yn-x" aria-label="Kapat">${A.ui('close')}</button></div>
      <p class="yn-kicker">✨ ${K.esc(v.title || 'Kalede yeni ne var?')}</p>
      <div class="yn-stage"></div>
      <button type="button" class="yn-nav prev" aria-label="Önceki"></button><button type="button" class="yn-nav next" aria-label="Sonraki"></button>
      <div class="yn-foot"></div></div>`);
    document.body.appendChild(view);
    document.body.classList.add('has-story');
    requestAnimationFrame(() => view && view.classList.add('in'));
    const draw = () => {
      const [id, ic, title, text] = list[i];
      K.$$('.yn-segs i', view).forEach((s, k) => s.classList.toggle('done', k <= i));
      K.$('.yn-stage', view).innerHTML = `<div class="yn-card" data-id="${K.esc(id)}"><div class="yn-ic">${A.icon(ic)}</div><h2>${K.esc(title)}</h2><p>${K.esc(K.fill(text))}</p></div>`;
      const last = i === list.length - 1;
      const go = NOROOM.includes(id) ? '' : `<button type="button" class="btn red" data-yn-go="${K.esc(id)}">${id === 'telefon' || id === 'kisayol' || id === 'widget' || id === 'nfc' ? 'Kur' : id === 'atolye' ? 'Boya' : id === 'dock' ? 'Düzenle' : id === 'kesit' ? 'Haritaya git' : id === 'opucuk' ? 'Öp' : id === 'nabiz' ? 'Ölç' : id === 'cicek' ? 'Çiçeğe bak' : id === 'salon' ? 'Panoya bak' : id === 'endise' || id === 'seslikomut' || id === 'yakinlik' ? 'Kalp menüsünü aç' : id === 'k3' ? 'Tema Atölyesi' : id === 'faceid' || id === 'takvimabone' || id === 'egbak' || id === 'kanatses' ? 'Kur' : id === 'sor' ? 'Sor' : id === 'panorama' ? 'Yola bak' : 'Dene'}</button>`;
      K.$('.yn-foot', view).innerHTML = `${go}<button type="button" class="btn ${go ? 'ghost' : 'red'}" data-yn-next>${last ? 'Kaleye dön' : 'Sıradaki'}</button>`;
      K.audio.sfx.tap();
    };
    const close = () => {
      if (!view) return;
      const v2 = view;
      view = null;
      v2.classList.remove('in');
      document.body.classList.remove('has-story');
      setTimeout(() => v2.remove(), 300);
    };
    const move = (d) => {
      if (i + d >= list.length) return close();
      i = Math.max(0, i + d);
      draw();
    };
    window.addEventListener('hashchange', close, { once: true });
    view.addEventListener('click', (e) => {
      if (e.target.closest('.yn-x')) return close();
      if (e.target.closest('.yn-nav.prev')) return move(-1);
      if (e.target.closest('.yn-nav.next') || e.target.closest('[data-yn-next]')) return move(1);
      const g = e.target.closest('[data-yn-go]');
      if (g) {
        const id = g.dataset.ynGo;
        close();
        setTimeout(() => {
          if (id === 'telefon') return K.telefon.sheet();
          if (id === 'salon') {
            K.go('');
            return setTimeout(() => K.salon.tab('biz', { scroll: true }), 300);
          }
          if (id === 'endise') return K.kalp && K.kalp.openMenu();
          if (id === 'kisayol') return K.kisayol.open();
          if (id === 'widget') return K.widget.open();
          if (id === 'atolye') return K.atolye.open();
          if (id === 'dock') return K.akilli.edit();
          if (id === 'nfc') return K.kisayol.nfc();
          if (id === 'kesit') {
            K.go('');
            return setTimeout(() => {
              K.salon && K.salon.tab && K.salon.tab('kale');
              const mp = K.$('#castleMap');
              mp && mp.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 350);
          }
          if (id === 'panorama') {
            K.go('');
            return setTimeout(() => K.$('#yolPano') && K.$('#yolPano').scrollIntoView({ behavior: 'smooth', block: 'center' }), 350);
          }
          if (id === 'egbak' || id === 'kanatses') return K.atolye.open();
          if (id === 'faceid') return K.faceid.sheet();
          if (id === 'takvimabone') return K.takvimabone.sheet();
          if (id === 'seslikomut' || id === 'yakinlik') return K.kalp && K.kalp.openMenu();
          if (id === 'k3') return K.atolye.open();
          if (id === 'sor') return K.ara.open();
          if (id === 'opucuk') return K.dokunus.kiss();
          if (id === 'nabiz') return K.dokunus.pulse();
          if (id === 'cicek') {
            K.go('');
            K.salon && K.salon.tab('bugun');
            return setTimeout(() => K.$('#cicek') && K.$('#cicek').scrollIntoView({ behavior: 'smooth', block: 'center' }), 300);
          }
          K.go(target(id));
        }, 320);
      }
    });
    let sy = null;
    view.addEventListener('touchstart', (e) => (sy = e.touches[0].clientY), { passive: true });
    view.addEventListener('touchend', (e) => {
      if (sy != null && e.changedTouches[0].clientY - sy > 90) close();
      sy = null;
    });
    document.addEventListener('keydown', function esc(e) {
      if (!view) return document.removeEventListener('keydown', esc);
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') move(1);
      if (e.key === 'ArrowLeft') move(-1);
    });
    draw();
  }
  // Kaleye gelince: tur ve açılış bittiyse, bu sürümü görmediyse
  K.on('built', () => {
    const v = latest();
    if (!v) return;
    if (!K.store.get('tour')) {
      K.store.set(key(), v.v);
      return;
    }
    if ((K.store.get(key(), 0) || 0) >= v.v) return;
    let tries = 0;
    const t = setInterval(() => {
      tries++;
      const busy = K.activeRoom || K.$('.modal') || K.$('.tur') || K.$('.ac') || K.$('.hk-view') || K.$('.kmenu') || K.$('.pl');
      if (!busy && K.cloud && (K.cloud.enabled ? K.$('#cicek') : true)) {
        clearInterval(t);
        open();
      } else if (tries > 40) clearInterval(t);
    }, 2500);
  });
  K.yeni = { open };
})();
