/* Kale 2.0 — Bildirim Kutusu: üst çubukta bir zil. Önemli bildirimler (onun gönderdikleri, davetler, paketler)
   kısa süre görünüp kaybolur ama burada kalır; okunmamışların sayısı zilin üstünde yazar. Bu cihazda saklanır. */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;

  const key = () => 'bildirim-' + (K.isOwner() ? 'me' : 'her');
  const list = () => K.store.get(key(), []);
  const seenAt = () => K.store.get(key() + '-seen', 0);

  function badge(ring) {
    const b = K.$('#bellBtn');
    if (!b) return;
    const n = list().filter((x) => x.at > seenAt()).length;
    b.classList.toggle('has', n > 0);
    K.$('.count', b).textContent = n > 9 ? '9+' : String(n);
    b.setAttribute('aria-label', n ? `Bildirimler: ${n} yeni` : 'Bildirimler');
    if (ring) {
      b.classList.remove('ring');
      void b.offsetWidth;
      b.classList.add('ring');
    }
  }
  function open() {
    const items = list().slice().reverse();
    const seen = seenAt();
    const m = K.ui.modal({
      label: 'Bildirimler',
      cls: 'zil-sheet',
      html: `<p class="card-eyebrow">Kalede olanlar</p><h2>Bildirimler</h2>
        ${K.telefon && (K.isOwner() || window.ELN.config.ntfyTopicHer) ? `<button type="button" class="zil-phone ${K.telefon.done() ? 'ok' : ''}" data-zil-phone><span aria-hidden="true">📱</span><span>${K.isOwner() ? 'Onun telefonuna bildirim' : 'Telefonuna bildirim'}<small>${K.isOwner() ? 'Kurulumu gör, deneme gönder' : K.telefon.done() ? 'Açık ✓' : 'Kilit ekranına düşsün: kur'}</small></span>${A.ui('next')}</button>` : ''}
        ${items.length ? `<ul class="zil-list">${items.map((x) => `<li class="${x.at > seen ? 'new' : ''}"><span class="zi">${x.icon || A.icon('bow')}</span><div>${x.html}<small>${K.esc(K.ago ? K.ago(x.at) : '')}</small></div></li>`).join('')}</ul>
          <div class="zil-foot"><button type="button" class="btn ghost small" data-zil-clear>Temizle</button></div>` : '<p class="zil-empty">Şimdilik sessiz. Bir şey olunca burada birikir.</p>'}`,
    });
    K.store.set(key() + '-seen', Date.now());
    badge();
    m.body.addEventListener('click', (e) => {
      if (e.target.closest('[data-zil-phone]')) {
        m.close();
        return setTimeout(() => K.telefon.sheet(), 330);
      }
      if (e.target.closest('[data-zil-clear]')) {
        K.store.set(key(), []);
        m.close();
        return badge();
      }
      // Bağlantıya dokununca pencere kapanır, bağlantı çalışır
      if (e.target.closest('a[href^="#"]')) m.close();
    });
  }

  K.on('bildirim', (x) => {
    const l = list();
    l.push({ html: x.html, icon: x.icon, at: x.at });
    K.store.set(key(), l.slice(-40));
    badge(true);
  });
  K.on('built', () => {
    const acts = K.$('.top-actions');
    if (!acts || K.$('#bellBtn')) return;
    const st = K.$('a[href="#album"]', acts);
    const b = K.el(`<button type="button" class="icon-btn bell-btn" id="bellBtn" aria-label="Bildirimler"><svg class="ic" viewBox="0 0 64 64" aria-hidden="true"><path d="M32 8 C20 8 14 18 14 28 V38 L8 46 H56 L50 38 V28 C50 18 44 8 32 8 Z" fill="#FFD34E" stroke="#4A2138" stroke-width="3" stroke-linejoin="round"/><path d="M25 50 A7 7 0 0 0 39 50" fill="#fff" stroke="#4A2138" stroke-width="3"/><path d="M32 3 V8" stroke="#4A2138" stroke-width="3" stroke-linecap="round"/>${A.heartPath ? A.heartPath(32, 30, 0.7, '#E3174D') : ''}</svg><span class="count">0</span></button>`);
    acts.insertBefore(b, st || acts.firstChild);
    b.addEventListener('click', open);
    badge();
  });
  K.zil = { open, badge };
})();
