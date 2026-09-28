/* Oda: Aşk Kuponları — kazı, aç, kullan */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  let root;
  const state = () => K.store.get('coupons', {});
  const save = (s) => K.store.set('coupons', s);
  const ICONS = ['hug', 'heart', 'palette', 'crown', 'moon', 'bow', 'star', 'music', 'map', 'key'];

  function ticketHTML(c, i) {
    const s = state()[c.id] || {};
    return `<div class="ticket ${s.used ? 'used' : ''}" data-id="${c.id}" style="--tc:${c.color}">
      <div class="t-stub">${A.icon(ICONS[i % ICONS.length])}<span class="t-no tnum">No. ${K.pad(i + 1)}</span></div>
      <div class="t-main">
        <p class="t-kicker">Aşk kuponu</p>
        <h3 class="t-title">${K.esc(K.fill(c.title))}</h3>
        <p class="t-text">${K.esc(K.fill(c.text))}</p>
        ${c.joker ? `<input class="input t-joker" id="joker-${c.id}" name="joker" placeholder="Dileğini yaz" maxlength="80" value="${K.esc(s.joker || '')}" ${s.used ? 'disabled' : ''}>` : ''}
        <div class="t-actions">
          ${s.used ? `<span class="t-stamp">Kullanıldı · ${T.fmtShort(s.used)}</span><button class="btn ghost small" data-share>${A.ui('share')} Tekrar hatırlat</button>` : `<button class="btn small" data-use>${A.ui('check')} Kullan</button>`}
        </div>
        ${s.revealed ? '' : '<canvas class="scratch" aria-label="Kazımak için parmağını sürt"></canvas>'}
      </div>
    </div>`;
  }

  function render() {
    K.$('#tickets', root).innerHTML = D.coupons.map(ticketHTML).join('');
    requestAnimationFrame(() => K.$$('.scratch', root).forEach(setupScratch));
    const s = state();
    const used = Object.values(s).filter((x) => x.used).length;
    K.$('#tCount', root).textContent = `${used} / ${D.coupons.length} kupon kullanıldı`;
  }

  function setupScratch(cv) {
    const t = cv.closest('.ticket');
    const r = cv.parentElement.getBoundingClientRect();
    if (!r.width) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = r.width * dpr;
    cv.height = r.height * dpr;
    const x = cv.getContext('2d', { willReadFrequently: true });
    x.scale(dpr, dpr);
    const g = x.createLinearGradient(0, 0, r.width, r.height);
    g.addColorStop(0, '#F3C6D8');
    g.addColorStop(0.5, '#E9D8FF');
    g.addColorStop(1, '#FFD6E5');
    x.fillStyle = g;
    x.fillRect(0, 0, r.width, r.height);
    x.fillStyle = 'rgba(255,255,255,.55)';
    for (let i = 0; i < 40; i++) {
      x.beginPath();
      x.arc(Math.random() * r.width, Math.random() * r.height, 1.5 + Math.random() * 2.5, 0, Math.PI * 2);
      x.fill();
    }
    x.fillStyle = '#B04A78';
    x.font = '600 20px Fredoka, sans-serif';
    x.textAlign = 'center';
    x.fillText('Kazı ve gör', r.width / 2, r.height / 2 + 2);
    x.font = '600 13px Nunito, sans-serif';
    x.fillText('parmağınla sürt', r.width / 2, r.height / 2 + 22);
    x.globalCompositeOperation = 'destination-out';
    let down = false,
      moves = 0,
      lastP = null;
    const p = (e) => {
      const b = cv.getBoundingClientRect();
      return [e.clientX - b.left, e.clientY - b.top];
    };
    const scratch = (e) => {
      const q = p(e);
      x.lineWidth = 44;
      x.lineCap = 'round';
      x.beginPath();
      x.moveTo(...(lastP || q));
      x.lineTo(...q);
      x.stroke();
      lastP = q;
      if (++moves % 10 === 0) check();
    };
    const check = () => {
      const d = x.getImageData(0, 0, cv.width, cv.height).data;
      let clear = 0,
        n = 0;
      for (let i = 3; i < d.length; i += 64) {
        n++;
        if (d[i] < 40) clear++;
      }
      if (clear / n > 0.5) reveal();
    };
    const reveal = () => {
      if (cv.classList.contains('gone')) return;
      cv.classList.add('gone');
      K.audio.sfx.sparkle();
      const b = t.getBoundingClientRect();
      K.fx.burst(b.left + b.width / 2, b.top + b.height / 2, { count: 16, power: 6 });
      const s = state();
      s[t.dataset.id] = Object.assign(s[t.dataset.id] || {}, { revealed: true });
      save(s);
      setTimeout(() => cv.remove(), 500);
    };
    cv.addEventListener('pointerdown', (e) => {
      down = true;
      lastP = null;
      cv.setPointerCapture(e.pointerId);
      scratch(e);
    });
    cv.addEventListener('pointermove', (e) => down && scratch(e));
    ['pointerup', 'pointercancel'].forEach((ev) => cv.addEventListener(ev, () => (down = false)));
    cv.addEventListener('dblclick', reveal);
    cv.addEventListener('keydown', (e) => (e.key === 'Enter' || e.key === ' ') && reveal());
    cv.tabIndex = 0;
  }

  async function use(t, btn) {
    const id = t.dataset.id;
    const c = D.coupons.find((x) => x.id === id);
    let wish = '';
    if (c.joker) {
      wish = K.$('.t-joker', t).value.trim();
      if (!wish) {
        K.fx.toast('Joker kuponu için önce dileğini yaz.');
        K.$('.t-joker', t).focus();
        return;
      }
    }
    if (!btn.dataset.armed) {
      btn.dataset.armed = '1';
      btn.innerHTML = 'Emin misin? Evet, kullan';
      btn.classList.add('red');
      setTimeout(() => {
        if (btn.isConnected && btn.dataset.armed) {
          delete btn.dataset.armed;
          btn.innerHTML = `${A.ui('check')} Kullan`;
          btn.classList.remove('red');
        }
      }, 4000);
      return;
    }
    const s = state();
    s[id] = Object.assign(s[id] || {}, { revealed: true, used: T.todayKey(), joker: wish });
    save(s);
    K.stickers.award('kupon');
    K.audio.sfx.chime();
    K.fx.confetti({ count: 80 });
    render();
    await notifyUse(c, wish);
  }
  async function notifyUse(c, wish) {
    const text = `${C.herName} bir aşk kuponu kullandı: "${K.fill(c.title)}"${wish ? ` — Dileği: ${wish}` : ''}. ${K.fill(c.text)}`;
    if (K.canNotify()) {
      const ok = await K.notify('Aşk kuponu kullanıldı', text, ['ticket']);
      if (ok) return K.fx.toast(`Kupon ${C.myName}'e bildirildi. Yerine getirilecek!`, { icon: A.icon('ticket') });
    }
    const r = await K.share({ title: 'Aşk kuponu', text });
    if (r === 'copied') K.fx.toast(`Kupon metni kopyalandı. ${C.myName}'e mesaj olarak gönder, yerine getirilsin.`, { icon: A.icon('ticket') });
    else if (r !== 'shared') K.fx.toast(`Ekran görüntüsünü alıp ${C.myName}'e gönder, yerine getirilsin.`, { icon: A.icon('ticket') });
  }

  K.room({
    id: 'kuponlar',
    wing: 'hazine',
    title: 'Aşk Kuponları',
    sub: 'Kazı, aç, kullan',
    icon: 'ticket',
    color: '#FFF3C4',
    badge: () => {
      const s = state();
      const left = D.coupons.filter((c) => !(s[c.id] && s[c.id].used)).length;
      return `${left} kupon`;
    },
    init(el) {
      root = el;
      el.innerHTML = `
        <p class="room-intro">Her kuponun üstünü parmağınla kazı. İstediğin zaman kullanabilirsin; kullandığında bana haber gider ya da ekran görüntüsünü atarsın, ben de yerine getiririm. Son kullanma tarihleri yok.</p>
        <p class="muted small" id="tCount"></p>
        <div class="tickets" id="tickets"></div>`;
      el.addEventListener('click', (e) => {
        const t = e.target.closest('.ticket');
        if (!t) return;
        const u = e.target.closest('[data-use]');
        if (u) use(t, u);
        if (e.target.closest('[data-share]')) {
          const c = D.coupons.find((x) => x.id === t.dataset.id);
          notifyUse(c, (state()[c.id] || {}).joker);
        }
      });
      el.addEventListener('input', (e) => {
        const j = e.target.closest('.t-joker');
        if (!j) return;
        const id = j.closest('.ticket').dataset.id;
        const s = state();
        s[id] = Object.assign(s[id] || {}, { joker: j.value });
        save(s);
      });
    },
    enter() {
      render();
    },
  });
})();
