/* Kale 2.0 — Hata Gözcüsü ve çevrimdışı işareti.
   Bir telefonda bir şey bozulursa (yakalanmamış hata, açılamayan bir modül) sessizce not düşülür: bu cihazda son
   yirmi not, bulutta günde en fazla beş kayıt (aynı hata günde bir kez). Ardoş'un ana salonunda "Eln'in telefonunda
   bir şey takıldı" kartı çıkar; Ardoş bir sonraki güncellemede düzeltir. İnternet yokken üstte küçük bir işaret: kale açık,
   yazılanlar bağlantı gelince gider. Kayıtlar: hata {msg, src, room, ua} */
(function () {
  'use strict';
  const K = window.K;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  const NOISE = /ResizeObserver|Script error|Failed to fetch|Load failed|NetworkError|AbortError|The operation was aborted|play\(\) request|NotAllowedError|cancelled/i;
  const mine = () => (K.isOwner && K.isOwner() ? 'me' : 'her');
  let pending = [];

  function note(msg, src) {
    msg = String(msg || '').slice(0, 300);
    if (!msg || NOISE.test(msg)) return;
    const list = K.store.get('hatalar', []);
    list.push({ msg, src: String(src || '').slice(0, 160), at: Date.now(), room: K.activeRoom || '' });
    K.store.set('hatalar', list.slice(-20));
    const day = T.todayKey();
    const sent = K.store.get('hataGun', { day: '', keys: [] });
    if (sent.day !== day) (sent.day = day), (sent.keys = []);
    const key = String(K.hash(msg));
    if (sent.keys.includes(key) || sent.keys.length >= 5) return;
    sent.keys.push(key);
    K.store.set('hataGun', sent);
    const row = { msg, src: String(src || '').slice(0, 160), room: K.activeRoom || '', ua: navigator.userAgent.replace(/\s*\([^)]*\)/g, ' ').slice(0, 80) };
    if (K.cloud && K.cloud.enabled) K.cloud.add('hata', row);
    else pending.push(row);
  }
  window.__kaleHata = (file, e) => note((e && (e.message || e)) || 'yüklenemedi', file);
  window.addEventListener('error', (e) => note(e.message, `${(e.filename || '').split('/').pop()}:${e.lineno || ''}`));
  window.addEventListener('unhandledrejection', (e) => {
    const r = e.reason;
    note(r && (r.message || r.code || r), 'promise');
  });

  /* ---------- Çevrimdışı işareti ---------- */
  function offline() {
    let p = K.$('#cevrimdisi');
    const off = navigator.onLine === false;
    const n = K.cloud && K.cloud.pending ? K.cloud.pending() : 0;
    if (!off && !n) return p && p.remove();
    if (!p) {
      p = K.el('<div class="cevrimdisi" id="cevrimdisi" role="status"></div>');
      document.body.appendChild(p);
    }
    p.innerHTML = off ? `📴 Çevrimdışısın · kale açık${n ? `, ${n} şey bağlantı gelince gidecek` : ', yazdıkların bağlantı gelince gider'}` : `⏳ ${n} şey gönderiliyor...`;
  }
  window.addEventListener('online', offline);
  window.addEventListener('offline', offline);
  K.on('kuyruk', offline);

  let rows = [];
  K.on('cloud', async (ok) => {
    offline();
    if (!ok) return;
    pending.splice(0).forEach((r) => K.cloud.add('hata', r));
    if (!K.isOwner()) return;
    rows = await K.cloud.list('hata', 100);
    K.cloud.on('hata', (r) => rows.some((x) => x.id === r.id) || rows.push(r));
  });
  function show() {
    const list = rows.slice().sort((a, b) => b.at - a.at).slice(0, 30);
    K.store.set('hataSeen', Date.now());
    K.ui.modal({
      label: 'Hata Gözcüsü',
      cls: 'hg-sheet',
      html: `<h2>🛠️ Hata Gözcüsü</h2><p class="muted">Telefonlarda yakalanan hatalar. Ardoş bir sonraki güncellemede bunları düzeltecek.</p>
        <ul class="hg-list">${list.map((r) => `<li><small>${r.who === 'her' ? C.herPet : C.myPet} · ${K.esc(K.ago(r.at))}${r.data.room ? ` · ${K.esc(r.data.room)}` : ''}</small><code>${K.esc(r.data.msg)}</code><small>${K.esc(r.data.src || '')} · ${K.esc(r.data.ua || '')}</small></li>`).join('') || '<li class="muted">Kayıt yok. Her şey yolunda.</li>'}</ul>`,
    });
  }
  K.specialHooks = (K.specialHooks || []).concat(() => {
    if (!K.isOwner() || !rows.length) return [];
    const seen = K.store.get('hataSeen', 0);
    const fresh = rows.filter((r) => r.at > seen && Date.now() - r.at < 4 * 864e5);
    if (!fresh.length) return [];
    const her = fresh.filter((r) => r.who === 'her').length;
    return [{ key: 'hata', icon: 'key', title: `🛠️ ${her ? `${K.ek(C.herPet, 'in')} telefonunda` : 'Kalede'} ${fresh.length} hata yakalandı`, text: 'Hata Gözcüsü kaydetti. Listeye bak; Ardoş bir sonraki güncellemede düzeltsin.', run: show, cta: 'Listeyi aç' }];
  });
  K.gozcu = { note, show, list: () => K.store.get('hatalar', []) };
})();
