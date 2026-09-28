/* Oda: Film Gecesi — aynı filmi aynı saniyede başlatmak için davet, ortak geri sayım ve film sonrası puan kartı */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  let root, timer = null;
  const plan = () => K.store.get('filmPlan', null);
  const hm = (ms, tz) => {
    const p = T.parts(tz, new Date(ms));
    return `${K.pad(p.h)}:${K.pad(p.mi)}`;
  };

  function marquee() {
    const bulbs = Array.from({ length: 22 }, (_, i) => `<i style="--d:${(i % 4) * 0.25}s"></i>`).join('');
    return `<div class="fm-marquee"><div class="fm-bulbs">${bulbs}</div><p>Bu akşam</p><h3>Film Gecesi</h3><p>${K.esc(C.herCity)} · ${K.esc(C.myCity)}</p><div class="fm-bulbs">${bulbs}</div></div>`;
  }

  function renderPick() {
    const films = D.films || [];
    K.$('#fmBody', root).innerHTML = `
      <div class="fm-films">${films.map((f, i) => `<button class="fm-film" data-i="${i}" aria-pressed="false"><b>${K.esc(f.title)}</b><small>${K.esc(f.note || '')}</small></button>`).join('')}</div>
      <form class="card fm-form" id="fmForm" autocomplete="off">
        <label class="card-eyebrow" for="fmTitle">Film</label>
        <input class="input" id="fmTitle" name="fmTitle" maxlength="80" placeholder="Film adı">
        <p class="card-eyebrow">Ne zaman başlıyoruz?</p>
        <div class="kc-presets">
          <button type="button" class="chip" data-m="2" aria-pressed="true">2 dakika sonra</button>
          <button type="button" class="chip" data-m="10" aria-pressed="false">10 dakika sonra</button>
          <button type="button" class="chip" data-m="30" aria-pressed="false">Yarım saat sonra</button>
        </div>
        <div class="row"><span class="muted small">ya da ${K.esc(C.herCity)} saatiyle:</span><input class="input" type="time" id="fmTime" name="fmTime"></div>
        <button class="btn red" type="submit">${A.icon('film')} ${K.esc(C.myPet)}'u davet et</button>
      </form>`;
    let mins = 2;
    K.$('.fm-films', root).addEventListener('click', (e) => {
      const b = e.target.closest('.fm-film');
      if (!b) return;
      K.$$('.fm-film', root).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      K.$('#fmTitle', root).value = films[+b.dataset.i].title;
      K.audio.sfx.tap();
    });
    K.$('.kc-presets', root).addEventListener('click', (e) => {
      const b = e.target.closest('[data-m]');
      if (!b) return;
      mins = +b.dataset.m;
      K.$('#fmTime', root).value = '';
      K.$$('.kc-presets .chip', root).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    });
    K.$('#fmForm', root).addEventListener('submit', async (e) => {
      e.preventDefault();
      const title = K.$('#fmTitle', root).value.trim();
      if (!title) return K.$('#fmTitle', root).focus();
      let start = T.now().getTime() + mins * 60e3;
      const t = K.$('#fmTime', root).value;
      if (t) {
        const [h, m] = t.split(':').map(Number);
        const p = T.baku();
        start = Date.UTC(p.y, p.mo - 1, p.d, h, m) - C.tzBaku * 3600e3;
        if (start < T.now().getTime()) start += 864e5;
      }
      start = Math.ceil(start / 60e3) * 60e3;
      K.store.set('filmPlan', { title, start });
      K.stickers.award('film');
      K.audio.sfx.chime();
      const ok = await K.notify(`Film gecesi daveti: ${title}`, `${C.herName} seni film gecesine çağırıyor!\nBaşlangıç: ${C.herCity} ${hm(start, C.tzBaku)} · ${C.myCity} ${hm(start, C.tzIstanbul)}\nOynat tuşuna aynı saniyede basın.`, ['clapper', 'popcorn'], { priority: 5 });
      K.fx.toast(ok ? `Davet ${K.esc(K.ek(C.myName, 'in'))} telefonunda.` : 'Davet kaydedildi; saati ona yaz.', { icon: A.icon('film') });
      render();
    });
  }

  function renderCount() {
    const p = plan();
    K.$('#fmBody', root).innerHTML = `
      <div class="fm-count">
        <p class="card-eyebrow">Birazdan başlıyor</p>
        <h3 class="fm-title">${K.esc(p.title)}</h3>
        <p class="muted">${K.esc(C.herCity)} ${hm(p.start, C.tzBaku)} · ${K.esc(C.myCity)} ${hm(p.start, C.tzIstanbul)}</p>
        <div class="fm-clock tnum" id="fmClock">--:--</div>
        <div class="fm-pop" aria-hidden="true">${'<i></i>'.repeat(9)}</div>
        <p class="muted small">Sıfırda ikiniz de oynata basın. Ekranın başında olduğunu ona haber vermek için:</p>
        <div class="actions"><button class="btn soft small" id="fmReady">Hazırım</button><button class="btn ghost small" id="fmCancel">İptal</button></div>
      </div>`;
    K.$('#fmReady', root).addEventListener('click', () => {
      K.notify(`${C.herName} hazır`, `"${p.title}" için ekranın başında. Mısırlar hazır.`, ['popcorn']);
      K.fx.toast('Haber verildi.', { icon: A.icon('film') });
    });
    K.$('#fmCancel', root).addEventListener('click', () => {
      K.store.set('filmPlan', null);
      render();
    });
    tick();
  }

  function renderRate() {
    const p = plan();
    K.$('#fmBody', root).innerHTML = `
      <form class="card fm-rate" id="fmRate">
        <p class="card-eyebrow">Film bitti mi?</p>
        <h3>${K.esc(p.title)} nasıldı?</h3>
        <div class="fm-hearts" role="radiogroup" aria-label="Puan">${[1, 2, 3, 4, 5].map((n) => `<button type="button" data-n="${n}" aria-label="${n} kalp">♥</button>`).join('')}</div>
        <textarea class="textarea" id="fmNote" name="fmNote" rows="2" maxlength="300" placeholder="En sevdiğin sahne?"></textarea>
        <div class="actions"><button class="btn" type="submit">${A.ui('send')} Puanımı gönder</button><button class="btn ghost small" type="button" id="fmNew">Yeni film gecesi</button></div>
      </form>
      <ul class="fm-past">${K.store.get('filmPast', []).map((f) => `<li><b>${K.esc(f.title)}</b> <span>${'♥'.repeat(f.n)}</span> <small>${T.fmt(f.date)}</small></li>`).join('')}</ul>`;
    let n = 0;
    K.$('.fm-hearts', root).addEventListener('click', (e) => {
      const b = e.target.closest('[data-n]');
      if (!b) return;
      n = +b.dataset.n;
      K.$$('.fm-hearts button', root).forEach((x) => x.classList.toggle('on', +x.dataset.n <= n));
      K.audio.sfx.pop();
    });
    K.$('#fmNew', root).addEventListener('click', () => {
      K.store.set('filmPlan', null);
      render();
    });
    K.$('#fmRate', root).addEventListener('submit', (e) => {
      e.preventDefault();
      const note = K.$('#fmNote', root).value.trim();
      const past = K.store.get('filmPast', []);
      past.unshift({ title: p.title, n: n || 5, date: T.todayKey() });
      K.store.set('filmPast', past.slice(0, 30));
      K.store.set('filmPlan', null);
      K.notify(`${C.herName} filme ${'♥'.repeat(n || 5)} verdi`, `${p.title}${note ? `\n"${note}"` : ''}`, ['clapper']);
      K.fx.rain({ count: 40 });
      render();
    });
  }

  function tick() {
    clearInterval(timer);
    const run = () => {
      const p = plan();
      const el = K.$('#fmClock', root);
      if (!p || !el) return clearInterval(timer);
      const left = p.start - T.now().getTime();
      if (left <= 0) {
        clearInterval(timer);
        el.textContent = 'Oynat!';
        el.classList.add('go');
        K.audio.sfx.success();
        K.fx.confetti({ count: 120 });
        K.vibrate([300, 100, 300]);
        setTimeout(() => {
          p.started = true;
          K.store.set('filmPlan', p);
          renderRate();
        }, 6000);
        return;
      }
      const s = Math.ceil(left / 1000);
      el.textContent = s <= 10 ? String(s) : `${K.pad(Math.floor(s / 60))}:${K.pad(s % 60)}`;
      el.classList.toggle('final', s <= 10);
      if (s <= 3) K.audio.sfx.tick();
    };
    run();
    timer = setInterval(run, 1000);
  }

  function render() {
    const p = plan();
    if (!p) renderPick();
    else if (p.started || p.start + 6000 < T.now().getTime()) renderRate();
    else renderCount();
  }

  K.room({
    id: 'film',
    wing: 'oyun',
    title: 'Film Gecesi',
    sub: 'Aynı film, aynı saniye, iki ekran',
    icon: 'film',
    color: '#E0DBFF',
    init(el) {
      root = el;
      el.innerHTML = `${marquee()}<p class="room-intro">Bir film seç, saati belirle, ${K.esc(C.myPet)}'a davet gitsin. Geri sayım bitince ikiniz de aynı saniyede oynata basın; aynı sahnede aynı anda gülün.</p><div id="fmBody"></div>`;
    },
    enter() {
      render();
    },
    leave() {
      clearInterval(timer);
    },
  });
})();
