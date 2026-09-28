/* Oda: İlk Sarılma — henüz yaşanmamış en güzel anımız: iki Kitty'nin yaklaşması, geri sayım,
   sarılma bankası, o günün programı, bavul listesi ve o gün açılacak mühürlü mektup */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  let root, tickOff = null;
  const H = () => D.firstHug;
  const target = () => C.firstMeetDate || K.store.get('dreamDate', '');
  const PACK = ['Puantiyeli fiyonk', 'Pasaport', 'Şarj aleti (bu sefer görüntülü arama yok)', 'Tek kulaklık (diğeri onda)', 'Gartic için tablet', 'Küçük bir hediye', 'Bol bol sabır (havalimanında lazım)', 'Kocaman bir gülümseme'];
  const TRIES = 3;

  /* ---------------- İki Kitty ---------------- */
  function progress() {
    const t = target();
    if (!t) return 0.08;
    const start = T.at(C.togetherDate).getTime();
    const end = T.at(t).getTime();
    return K.clamp((T.now() - start) / Math.max(1, end - start), 0.08, 1);
  }
  function scene() {
    const p = progress();
    const meet = C.firstMeetDate && T.daysUntil(C.firstMeetDate) <= 0;
    const el = K.$('#hugScene', root);
    el.style.setProperty('--p', meet ? 1 : p * 0.86);
    el.classList.toggle('met', Boolean(meet));
  }

  /* ---------------- Geri sayım ---------------- */
  function countdown() {
    const t = target();
    const box = K.$('#hugCount', root);
    if (!t) {
      box.innerHTML = `<p class="hc-label">Tarih henüz belli değil</p><p class="muted">Ama bu oda sabırsız. Aşağıdan hayalindeki tarihi seç; geri sayım o güne başlasın.</p>`;
      return;
    }
    const ms = T.at(t) - T.now();
    if (ms <= 0) {
      box.innerHTML = `<p class="hc-label">${C.firstMeetDate ? 'O gün geldi' : 'Hayalindeki gün geldi'}</p><p class="hc-big hand">${C.firstMeetDate ? 'Sarıl ona. Uzun uzun.' : 'Yeni bir tarih dile'}</p>`;
      return;
    }
    const s = T.split(ms);
    box.innerHTML = `<p class="hc-label">${C.firstMeetDate ? 'İlk sarılmamıza' : 'Hayalindeki tarihe'} · ${T.fmt(t)}</p>
      <div class="hc-units">${[
        [s.d, 'gün'],
        [s.h, 'saat'],
        [s.m, 'dakika'],
        [s.s, 'saniye'],
      ]
        .map(([v, l]) => `<span><b class="tnum">${l === 'gün' ? K.num(v) : K.pad(v)}</b><small>${l}</small></span>`)
        .join('')}</div>`;
  }

  /* ---------------- Sarılma bankası ---------------- */
  function bank() {
    const days = Math.max(0, T.daysSince(C.togetherDate));
    const extra = K.store.get('hugs', 0);
    K.$('#hbRows', root).innerHTML = `
      <div><dt>Birlikte geçen her gün (günde 1)</dt><dd class="tnum">+${K.num(days)}</dd></div>
      <div><dt>Uzaktan gönderdiğin sarılmalar</dt><dd class="tnum">+${K.num(extra)}</dd></div>
      <div class="total"><dt>Toplam sarılma borcum</dt><dd class="tnum">${K.num(days + extra)}</dd></div>
      <div><dt>Ödeme tarihi</dt><dd>${C.firstMeetDate ? T.fmt(C.firstMeetDate) : 'İlk buluşma'} (faiziyle)</dd></div>`;
  }
  function addHug(btn) {
    K.store.set('hugs', K.store.get('hugs', 0) + 1);
    bank();
    K.audio.sfx.pop();
    const r = btn.getBoundingClientRect();
    K.fx.burst(r.left + r.width / 2, r.top, { count: 10, power: 5, shapes: ['heart'] });
    K.stickers.award('sarilma');
    const today = T.todayKey();
    if (K.store.get('hugNotifyDay') !== today) {
      K.store.set('hugNotifyDay', today);
      K.notify(`${C.herName} sarılma bankasına yatırdı`, `Borcun ${K.num(K.hugDebt())} sarılmaya çıktı. Faiziyle ödeyeceksin.`, ['hugging_face']);
    }
  }

  /* ---------------- Onun planı ---------------- */
  const herPlan = () => K.store.get('hugPlanHers', []);
  function planList() {
    K.$('#hpList', root).innerHTML = herPlan()
      .map((x, i) => `<li><span class="hp-t hand">${K.esc(x.time || '♥')}</span><span>${K.esc(x.text)}</span><button class="wn-x" data-del="${i}" aria-label="Sil">${A.ui('close')}</button></li>`)
      .join('');
  }

  /* ---------------- Mühürlü mektup ---------------- */
  function sealed() {
    const box = K.$('#hugSeal', root);
    const code = K.store.get('sealCode');
    if (code) {
      K.vault.sealed('ilk-sarilma', code).then((l) => (l ? showLetter(l, false) : K.store.del('sealCode')));
    }
    box.addEventListener('submit', async (e) => {
      e.preventDefault();
      const inp = K.$('#sealInput', root);
      const msg = K.$('#sealMsg', root);
      const v = inp.value.trim();
      if (!v) return;
      const day = T.todayKey();
      const tries = K.store.get('sealTries', {});
      if ((tries[day] || 0) >= TRIES) {
        msg.textContent = 'Kitty mührü bugünlük korumaya aldı. Yarın yine dene; ya da en iyisi, şifreyi ondan duy.';
        return;
      }
      msg.textContent = 'Mühür yoklanıyor...';
      const letter = await K.vault.sealed('ilk-sarilma', v);
      if (!letter) {
        tries[day] = (tries[day] || 0) + 1;
        K.store.set('sealTries', tries);
        const left = TRIES - tries[day];
        K.audio.sfx.fail();
        box.classList.remove('shake');
        void box.offsetWidth;
        box.classList.add('shake');
        msg.textContent = left > 0 ? `Mühür kıpırdamadı. ${H().sealedTeaser || ''} (Bugün ${left} hakkın kaldı.)` : 'Mühür bugünlük kapandı. Şifreyi sana o söyleyecek; yüz yüze, kulağına.';
        return;
      }
      K.store.set('sealCode', v);
      showLetter(letter, true);
    });
  }
  function showLetter(l, fresh) {
    const wrap = K.$('#sealWrap', root);
    wrap.classList.add('broken');
    K.$('#sealLetter', root).innerHTML = `
      <p class="la-kicker">${K.esc(l.title || '')}</p>
      <div class="la-text">${K.paras(l.body || [])}</div>
      <p class="la-sign">— ${K.esc(l.sign || C.myName)}</p>`;
    K.$('#sealLetter', root).hidden = false;
    if (fresh) {
      K.audio.sfx.chime();
      K.fx.confetti({ count: 160 });
      setTimeout(() => K.fx.rain({ count: 60 }), 800);
      K.stickers.award('muhur');
      K.notify(`${C.herName} mührü açtı`, 'İlk sarılma mektubu okundu. Şu an yanındaysan bir daha sarıl.', ['heart']);
    }
  }

  K.room({
    id: 'ilk-sarilma',
    wing: 'kalp',
    title: 'İlk Sarılma',
    sub: () => {
      if (C.firstMeetDate) {
        const d = T.daysUntil(C.firstMeetDate);
        return d > 0 ? `${K.num(d)} gün kaldı` : 'O gün geldi';
      }
      return 'Henüz yaşanmamış en güzel anımız';
    },
    icon: 'hugs',
    color: '#FFE0E0',
    badge: () => (C.firstMeetDate && T.daysUntil(C.firstMeetDate) > 0 ? `${T.daysUntil(C.firstMeetDate)} gün` : ''),
    init(el) {
      root = el;
      el.innerHTML = `
        <div class="hug-hero">
          <div class="hug-scene" id="hugScene" aria-hidden="true">
            <div class="hs-sky"></div>
            <div class="hs-tower l">${A.kizKulesi()}</div>
            <div class="hs-tower r">${A.qizQalasi()}</div>
            <div class="hs-path"></div>
            <div class="hs-kit me">${A.kitty({ bow: '#4FA3E3', cls: 'is-happy' })}<span class="hs-tag">${K.esc(C.myPet)}</span></div>
            <div class="hs-kit her">${A.kitty({ cls: 'is-happy', crown: true })}<span class="hs-tag">${K.esc(C.herPet)}</span></div>
            <div class="hs-hearts"><i></i><i></i><i></i></div>
          </div>
          <div class="hug-count card" id="hugCount"></div>
        </div>
        <div class="hug-intro">${K.paras(H().intro)}</div>
        ${
          C.firstMeetDate
            ? ''
            : `<form class="card dream" id="dreamForm">
          <label class="card-eyebrow" for="dreamDate">Hayalindeki tarih</label>
          <div class="row"><input class="input" type="date" id="dreamDate" name="dreamDate" min="${T.todayKey()}"><button class="btn" type="submit">${A.ui('heart')} Bu gün olsun</button></div>
          <p class="muted small">Seçtiğin tarih ${K.esc(C.myName)}'e de iletilir. Belki bir işaret olur.</p>
        </form>`
        }
        <section class="hb">
          <div class="hb-book">
            <p class="card-eyebrow">Sarılma Bankası · Hesap özeti</p>
            <h3 class="sub-h">Alacaklı: Prenses ${K.esc(C.herPet)} · Borçlu: ${K.esc(C.myPet)}</h3>
            <dl class="hb-rows" id="hbRows"></dl>
            <button class="btn red" id="hbAdd">${A.icon('hug')} Bir sarılma daha yazdır</button>
          </div>
        </section>
        <section class="hp">
          <h3 class="sub-h">O günün programı</h3>
          <ol class="itin">${H()
            .plan.map(([t, x], i) => `<li style="--d:${i * 0.06}s"><span class="itin-t">${K.esc(t)}</span><span class="itin-x">${K.esc(K.fill(x))}</span></li>`)
            .join('')}</ol>
          <div class="card hp-hers">
            <p class="card-eyebrow">Senin programın</p>
            <ul class="hp-list" id="hpList"></ul>
            <form class="row" id="hpForm" autocomplete="off">
              <input class="input hp-time" id="hpTime" name="hpTime" placeholder="Saat" maxlength="8">
              <input class="input" id="hpText" name="hpText" placeholder="O gün ne yapmak istersin?" maxlength="120">
              <button class="btn" type="submit">${A.ui('plus')} Ekle</button>
            </form>
          </div>
        </section>
        <section class="pack card">
          <p class="card-eyebrow">Bavul listesi</p>
          <ul class="pack-list" id="packList"></ul>
        </section>
        <section class="seal">
          <div class="seal-wrap" id="sealWrap">
            <div class="seal-env"><span class="seal-flap"></span><span class="seal-wax">${A.bow('#fff')}</span></div>
            <p class="seal-title hand">İlk sarılmamızda aç</p>
          </div>
          <form class="seal-form" id="hugSeal" autocomplete="off">
            <p class="muted">${K.esc(H().sealedTeaser || '')}</p>
            <div class="row"><input class="input" id="sealInput" name="sealInput" placeholder="Şifre" autocapitalize="off" spellcheck="false"><button class="btn red" type="submit">${A.ui('lock')} Mührü aç</button></div>
            <p class="gate-msg" id="sealMsg" aria-live="polite"></p>
          </form>
          <article class="la-paper seal-letter" id="sealLetter" hidden></article>
        </section>`;
      scene();
      countdown();
      bank();
      planList();
      sealed();
      // Bavul
      const packed = () => K.store.get('packed', {});
      const pack = () =>
        (K.$('#packList', el).innerHTML = PACK.map((p, i) => `<li><label><input type="checkbox" data-i="${i}" ${packed()[i] ? 'checked' : ''}><span>${K.esc(p)}</span></label></li>`).join(''));
      pack();
      K.$('#packList', el).addEventListener('change', (e) => {
        const all = packed();
        all[e.target.dataset.i] = e.target.checked;
        K.store.set('packed', all);
        if (e.target.checked) K.audio.sfx.tap();
        if (PACK.every((_, i) => all[i])) K.fx.toast('Bavul hazır! Şimdi sadece tarih lazım.', { icon: A.icon('plane') });
      });
      K.$('#hbAdd', el).addEventListener('click', (e) => addHug(e.currentTarget));
      const df = K.$('#dreamForm', el);
      if (df) {
        const di = K.$('#dreamDate', el);
        di.value = K.store.get('dreamDate', '');
        df.addEventListener('submit', (e) => {
          e.preventDefault();
          if (!di.value) return di.focus();
          K.store.set('dreamDate', di.value);
          countdown();
          scene();
          K.audio.sfx.success();
          K.notify(`${C.herName} ilk buluşma için bir tarih diledi`, T.fmt(di.value), ['calendar']);
          K.fx.toast('Dileğin kaydedildi. Geri sayım başladı.', { icon: A.icon('calendar') });
        });
      }
      K.$('#hpForm', el).addEventListener('submit', (e) => {
        e.preventDefault();
        const text = K.$('#hpText', el).value.trim();
        if (!text) return;
        const time = K.$('#hpTime', el).value.trim();
        const list = herPlan();
        list.push({ time, text });
        K.store.set('hugPlanHers', list.slice(-20));
        K.$('#hpText', el).value = '';
        K.$('#hpTime', el).value = '';
        planList();
        K.audio.sfx.paper();
        K.notify(`${C.herName} o günün programına ekledi`, `${time ? time + ' · ' : ''}${text}`, ['spiral_calendar']);
      });
      K.$('#hpList', el).addEventListener('click', (e) => {
        const d = e.target.closest('[data-del]');
        if (!d) return;
        const list = herPlan();
        list.splice(+d.dataset.del, 1);
        K.store.set('hugPlanHers', list);
        planList();
      });
    },
    enter() {
      scene();
      countdown();
      bank();
      tickOff = setInterval(countdown, 1000);
    },
    leave() {
      clearInterval(tickOff);
    },
  });
})();
