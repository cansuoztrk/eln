/* Oda: Sesimle Uyan — sabahları telefonun değil, onun sesi uyandırsın. Herkes kendi uyanma saatini (kendi şehrinin
   saatiyle) ve günlerini seçer; o saatte telefonuna acil bir ntfy bildirimi düşer, dokununca kale açılır ve onun
   günaydın sesi çalar. Sesler: ona özel kaydedilmiş sabah sesleri, telesekreterdeki günaydın mesajları ve (Eln için)
   kasadaki "Günaydın" sesi. Bildirimler en fazla iki gün önceden kurulur (K.planla), kaleye kim girerse kursun.
   Kayıtlar: alarm {time, days, on} · sabahses {audio, dur} (ses tsses'te) · sabahdinle {ref} */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  const AL = () => D.alarm || { intro: [], ideas: [], title: '☀️ Günaydın! {from} seni uyandırıyor', msg: '' };
  const mine = () => (K.isOwner() ? 'me' : 'her');
  const other = () => (K.isOwner() ? 'her' : 'me');
  const nameOf = (w) => (w === 'me' ? C.myPet : C.herPet);
  const tzOf = (w) => (w === 'me' ? C.tzIstanbul : C.tzBaku);
  const cityOf = (w) => (w === 'me' ? C.myCity : C.herCity);
  const DAYS = [[1, 'Pzt'], [2, 'Sal'], [3, 'Çar'], [4, 'Per'], [5, 'Cum'], [6, 'Cmt'], [0, 'Paz']];
  const MAX = 30;

  let rows = [], loaded = false, root = null, rec = null, draft = null, player = null, draftDays = null;
  const push = (r) => r && !rows.some((x) => x.id === r.id) && rows.push(r);
  const setting = (w) => rows.filter((r) => r.kind === 'alarm' && r.who === w).sort((a, b) => b.at - a.at)[0] || null;
  const cfg = (w) => {
    const s = setting(w);
    // Eln genelde Bakü saatiyle 10'da kalkıyor; ilk kurulumda o önerilir
    return s ? s.data : w === 'her' ? { time: '10:00', days: [1, 2, 3, 4, 5, 6, 0], on: false } : { time: '08:00', days: [1, 2, 3, 4, 5], on: false };
  };
  const heard = (id) => rows.some((r) => r.kind === 'sabahdinle' && r.data.ref === id);
  const myVoices = () => rows.filter((r) => r.kind === 'sabahses' && r.who === mine()).sort((a, b) => b.at - a.at);
  const tsGunaydin = () => (K.telesekreter && K.telesekreter.list ? K.telesekreter.list(other()).filter((r) => r.data.tag === 'gunaydin') : []);
  // Benim için çalabilecek sesler: önce dinlenmemiş sabah sesleri, sonra her gün sırayla biri
  function pool() {
    const ss = rows.filter((r) => r.kind === 'sabahses' && r.who === other()).sort((a, b) => a.at - b.at).map((r) => ({ kind: 'sabah', id: r.id, audio: r.data.audio, dur: r.data.dur, at: r.at, fresh: !heard(r.id) }));
    const ts = tsGunaydin().map((r) => ({ kind: 'ts', id: r.id, audio: r.data.audio, dur: r.data.dur, at: r.at }));
    const v = mine() === 'her' && K.voice && K.voice.has('gunaydin') ? [{ kind: 'kasa', id: 'gunaydin' }] : [];
    return ss.concat(ts, v);
  }
  function today() {
    const p = pool();
    if (!p.length) return null;
    const fresh = p.filter((x) => x.fresh);
    if (fresh.length) return fresh[0];
    return p[K.hash(T.todayKey() + mine()) % p.length];
  }

  // Bir kişinin önümüzdeki uyanma anları (kendi saat diliminde)
  function nextTimes(w, hours) {
    const c = cfg(w);
    if (!c.on || !/^\d\d:\d\d$/.test(c.time || '')) return [];
    const [h, mi] = c.time.split(':').map(Number);
    const out = [];
    const tz = tzOf(w);
    for (let i = 0; i < 4; i++) {
      const p = T.parts(tz, new Date(Date.now() + i * 864e5));
      const at = Date.UTC(p.y, p.mo - 1, p.d, h, mi) - tz * 36e5;
      const wd = new Date(Date.UTC(p.y, p.mo - 1, p.d)).getUTCDay();
      if (at > Date.now() + 9e4 && at - Date.now() < hours * 36e5 && (c.days || []).includes(wd)) out.push({ at, day: `${p.y}-${K.pad(p.mo)}-${K.pad(p.d)}` });
    }
    return out;
  }
  function schedule() {
    if (!loaded || !K.planla) return;
    const items = [];
    ['me', 'her'].forEach((w) => {
      const c = cfg(w);
      nextTimes(w, 40).forEach((n) =>
        items.push({
          key: `alarm-${n.day}-${c.time.replace(':', '')}`,
          to: w,
          at: n.at,
          title: K.fill((AL().title || '').replace('{from}', nameOf(w === 'me' ? 'her' : 'me'))),
          msg: AL().msg || '',
          tags: ['sunrise', 'alarm_clock'],
          priority: 5,
          click: K.roomUrl('alarm'),
        })
      );
    });
    if (items.length) K.planla(items);
  }

  /* ---------- Çalma ---------- */
  function stopPlay() {
    if (player && player.a) {
      try {
        player.a.pause();
      } catch (e) {}
    }
    player = null;
    render();
  }
  async function playItem(x) {
    if (!x) return;
    if (player) return stopPlay();
    if (x.kind === 'kasa') return K.voice.play(x.id);
    player = { id: x.id, loading: true };
    render();
    const url = await K.mikrofon.url(x.audio);
    if (!url || !player || player.id !== x.id) {
      player = null;
      render();
      return url ? null : K.fx.toast('Ses bulunamadı.');
    }
    const a = new Audio(url);
    player = { id: x.id, a };
    a.onended = () => {
      player = null;
      render();
      K.fx.confetti && K.fx.confetti({ count: 40 });
    };
    a.play().catch(() => (player = null, render()));
    render();
    K.vibrate([30, 60, 30]);
    if (x.kind === 'sabah' && !heard(x.id)) push(await K.cloud.add('sabahdinle', { ref: x.id }));
    K.stickers.award('alarm');
    K.renderSpecials && !K.activeRoom && K.renderSpecials();
  }

  /* ---------- Kayıt ---------- */
  function dropDraft() {
    const u = draft && draft.url;
    draft = null;
    if (u) setTimeout(() => URL.revokeObjectURL(u), 1500);
  }
  async function toggleRec() {
    if (rec) return rec.stop();
    if (draft) dropDraft();
    const r = await K.mikrofon.start(MAX, (s) => {
      const el = root && K.$('#alRecT', root);
      if (el) el.textContent = `● ${Math.floor(s)} / ${MAX} sn`;
    });
    if (!r) return;
    rec = r;
    render();
    draft = await r.done;
    rec = null;
    K.audio.sfx.tap();
    render();
  }
  async function sendDraft(btn) {
    if (!draft) return;
    btn.disabled = true;
    btn.classList.add('loading');
    const au = await K.mikrofon.upload(draft.blob);
    const r = au && (await K.cloud.add('sabahses', { audio: au.id, dur: draft.dur }));
    if (!r) {
      btn.disabled = false;
      btn.classList.remove('loading');
      return K.fx.toast('Gönderilemedi. Daha kısa bir kayıt dene.');
    }
    push(r);
    dropDraft();
    K.audio.sfx.success();
    K.stickers.award('alarm');
    K.fx.toast(`☀️ Günaydın sesin hazır. ${K.esc(nameOf(other()))} bir sabah bununla uyanacak.`, { duration: 3800 });
    render();
  }

  /* ---------- Görünüm ---------- */
  function clock(c, w) {
    const [h, mi] = (c.time || '08:00').split(':').map(Number);
    const ang = ((h % 12) + mi / 60) * 30, angM = mi * 6;
    return `<svg class="al-clock ${c.on ? 'on' : ''}" viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="64" r="44" class="al-face"/>
      <circle cx="30" cy="22" r="13" class="al-bell"/><circle cx="90" cy="22" r="13" class="al-bell"/>
      ${Array.from({ length: 12 }, (_, i) => `<line x1="60" y1="${i % 3 ? 26 : 24}" x2="60" y2="30" transform="rotate(${i * 30} 60 64)" class="al-tick"/>`).join('')}
      <line x1="60" y1="64" x2="60" y2="40" transform="rotate(${ang} 60 64)" class="al-h"/><line x1="60" y1="64" x2="60" y2="30" transform="rotate(${angM} 60 64)" class="al-m"/>
      <circle cx="60" cy="64" r="4" class="al-pin"/><text x="60" y="94" class="al-who">${K.esc(w === 'me' ? '🌉' : '🌊')}</text></svg>`;
  }
  function render() {
    if (!root || K.activeRoom !== 'alarm') return;
    const me = cfg(mine()), ot = cfg(other());
    const days = draftDays || me.days || [];
    const t = today();
    const p = pool();
    const nx = nextTimes(mine(), 30)[0];
    const asleep = K.uykubiz && K.uykubiz.asleep(mine());
    K.$('#alWake', root).innerHTML = t
      ? `<button type="button" class="al-play ${player ? 'playing' : ''}" data-al="play"><span class="al-sun" aria-hidden="true">☀️</span><span><small>${player ? (player.loading ? 'Açılıyor...' : 'Çalıyor · dokun, dursun') : `Bugünün günaydını${t.fresh ? ' · yeni' : ''}`}</small><b>${K.esc(K.ek(nameOf(other()), 'in'))} sesiyle uyan</b></span></button>
         <p class="muted small center">${p.length} günaydın sesi var${t.kind === 'kasa' ? ' · bugün kasadaki ses' : ''}.</p>${asleep ? `<button type="button" class="btn soft small" data-gl-wake>🌙 Uyuyor görünüyorsun · Uyandım de</button>` : ''}`
      : `<div class="al-empty"><span aria-hidden="true">🔇</span><p><b>Henüz sana kaydedilmiş bir günaydın yok.</b><br>${K.esc(nameOf(other()))} buradan sana sabah sesleri bırakabilir.</p><button type="button" class="btn soft small" data-al="iste">💌 Ondan iste</button></div>`;
    K.$('#alMine', root).innerHTML = `<div class="al-set">${clock(me, mine())}
        <div class="al-form"><p class="card-eyebrow">Benim uyanma saatim · ${K.esc(cityOf(mine()))}</p>
          <input type="time" class="input al-time" id="alTime" value="${K.esc(me.time || '08:00')}">
          <div class="al-days">${DAYS.map(([d, l]) => `<button type="button" class="${days.includes(d) ? 'on' : ''}" data-al-day="${d}">${l}</button>`).join('')}</div>
          <label class="al-sw"><input type="checkbox" id="alOn" ${me.on ? 'checked' : ''}><span></span>${me.on ? 'Açık' : 'Kapalı'}</label></div></div>
      <div class="row"><button type="button" class="btn red" data-al="save">${A.ui('check')} Kaydet</button><button type="button" class="btn ghost small" data-al="test">⏱️ 2 dk sonra dene</button></div>
      <p class="muted small">${me.on && nx ? `Sıradaki uyanış: <b>${K.esc(T.dayName(T.parts(tzOf(mine()), new Date(nx.at))))} ${K.esc(me.time)}</b>.` : me.on ? 'Önümüzdeki gün seçili değil.' : 'Kapalı.'} Bildirimler en fazla iki gün önceden kurulur; saati değiştirirsen önceden kurulmuş olan bir tanesi yine eski saatte çalabilir.</p>`;
    K.$('#alOther', root).innerHTML = `<p class="al-ot">${K.avatar(other(), 'yan-av')} <span><b>${K.esc(nameOf(other()))}</b> ${ot.on ? `her ${K.esc(ot.days.length === 7 ? 'gün' : DAYS.filter(([d]) => ot.days.includes(d)).map(([, l]) => l).join(', '))} <b>${K.esc(ot.time)}</b>'da uyanıyor (${K.esc(cityOf(other()))})` : 'henüz uyanma saati kurmadı'}.</span></p>
      <p class="card-eyebrow">Ona günaydın sesi kaydet · ${myVoices().length} ses bıraktın</p>
      <div class="al-ideas">${(AL().ideas || []).map((x) => `<button type="button" class="chip" data-al-idea>${K.esc(x)}</button>`).join('')}</div>
      <p class="al-script hand" id="alScript">${K.esc((AL().ideas || [''])[0])}</p>
      <div class="row center"><button type="button" class="ts-rec al-rec ${rec ? 'on' : ''}" data-al="rec" aria-label="${rec ? 'Kaydı bitir' : 'Kaydet'}">${rec ? '■' : '●'}</button><span class="muted small" id="alRecT">${rec ? '● kayıt' : `en fazla ${MAX} sn`}</span></div>
      ${draft ? `<div class="al-draft"><audio controls src="${draft.url}"></audio><div class="row"><button type="button" class="btn red" data-al="send">${A.ui('send')} Gönder</button><button type="button" class="btn ghost small" data-al="sil">Sil</button></div></div>` : ''}`;
  }
  async function save(btn) {
    const time = K.$('#alTime', root).value || '08:00';
    const days = (draftDays || cfg(mine()).days || []).slice().sort();
    const on = K.$('#alOn', root).checked;
    btn.disabled = true;
    const r = await K.cloud.add('alarm', { time, days, on });
    btn.disabled = false;
    if (!r) return K.fx.toast('Kaydedilemedi.');
    push(r);
    draftDays = null;
    K.audio.sfx.success();
    K.fx.toast(on ? `⏰ Saat ${time}'da ${K.esc(K.ek(nameOf(other()), 'in'))} sesiyle uyanacaksın.` : 'Kapatıldı.', { duration: 3000 });
    schedule();
    render();
  }

  K.on('cloud', async (ok) => {
    if (!ok) return;
    rows = await K.cloud.many(['alarm', 'sabahses', 'sabahdinle'], { limit: 800 });
    loaded = true;
    ['alarm', 'sabahses', 'sabahdinle'].forEach((k) =>
      K.cloud.on(k, (r) => {
        if (!push(r)) return;
        render();
      })
    );
    K.cloud.on('deleted', ({ id }) => {
      rows = rows.filter((r) => r.id !== id);
      render();
    });
    setTimeout(schedule, 4000);
    render();
  });
  // Sabah, kalkış saatinden sonraki 3 saat içinde ana salonda kart
  K.specialHooks = (K.specialHooks || []).concat(() => {
    if (!loaded || !D.alarm) return [];
    const c = cfg(mine());
    const t = today();
    if (!t) return [];
    const p = T.parts(tzOf(mine()));
    const [h, mi] = (c.time || '08:00').split(':').map(Number);
    const diff = p.h * 60 + p.mi - (h * 60 + mi);
    const wd = p.wd;
    const morning = c.on ? diff >= -5 && diff < 180 && (c.days || []).includes(wd) : p.h >= 6 && p.h < 10;
    if (!morning || K.store.get('alarmCard') === T.todayKey()) return [];
    return [{ icon: 'sun', title: `☀️ Günaydın! ${K.ek(nameOf(other()), 'in')} sesi seni bekliyor`, text: t.fresh ? 'Sana yeni bir günaydın kaydetmiş.' : 'Bugünün günaydın sesi hazır.', run: () => (K.store.set('alarmCard', T.todayKey()), K.go('alarm'), setTimeout(() => playItem(today()), 600)), cta: 'Dinle' }];
  });
  K.alarm = { cfg, pool, nextTimes, schedule };

  K.room({
    id: 'alarm',
    wing: 'kalp',
    title: 'Sesimle Uyan',
    sub: 'Sabahları onun sesiyle uyan',
    icon: 'sun',
    color: '#FFF1D2',
    hidden: () => !D.alarm || !K.cloud || !K.cloud.enabled,
    badge: () => {
      const t = loaded && today();
      return t && t.fresh ? 'Yeni ses' : '';
    },
    init(el) {
      root = el;
      el.innerHTML = `<div class="room-intro">${K.paras(AL().intro || [])}</div>
        <section class="card al-wake" id="alWake"></section>
        <section class="card al-mine" id="alMine"></section>
        <section class="card al-other" id="alOther"></section>`;
      el.addEventListener('click', async (e) => {
        const d = e.target.closest('[data-al-day]');
        if (d) {
          const n = +d.dataset.alDay;
          const cur = (draftDays || cfg(mine()).days || []).slice();
          draftDays = cur.includes(n) ? cur.filter((x) => x !== n) : cur.concat(n);
          d.classList.toggle('on');
          return;
        }
        const idea = e.target.closest('[data-al-idea]');
        if (idea) return (K.$('#alScript', root).textContent = idea.textContent);
        const b = e.target.closest('[data-al]');
        if (!b) return;
        const a = b.dataset.al;
        if (a === 'play') return playItem(today());
        if (a === 'save') return save(b);
        if (a === 'rec') return toggleRec();
        if (a === 'send') return sendDraft(b);
        if (a === 'sil') return draft && (dropDraft(), render());
        if (a === 'iste') {
          b.disabled = true;
          K.ping(`☀️ ${K.meName()} senin sesinle uyanmak istiyor`, 'Sesimle Uyan odasından ona bir günaydın kaydet.', ['sunrise'], { click: K.roomUrl('alarm') });
          return K.fx.toast('İstedin. Kaydedince burada çalacak.');
        }
        if (a === 'test') {
          b.disabled = true;
          const at = Date.now() + 125e3;
          const ok = await K.ntfyTo(mine(), K.fill((AL().title || '').replace('{from}', nameOf(other()))), `${AL().msg || ''} (deneme)`, ['sunrise', 'alarm_clock'], Object.assign({ click: K.roomUrl('alarm'), priority: 5 }, K.later(at) || {}));
          return K.fx.toast(ok ? '⏱️ İki dakika sonra telefonuna deneme uyandırması gelecek.' : 'Bildirim kanalı kurulu değil (Kale Paneli → Bildirimler).', { duration: 3800 });
        }
      });
      el.addEventListener('change', (e) => {
        if (e.target.id === 'alOn') e.target.parentElement.lastChild.textContent = e.target.checked ? 'Açık' : 'Kapalı';
      });
    },
    enter() {
      draftDays = null;
      render();
      schedule();
    },
    leave() {
      if (rec) rec.stop();
      stopPlay();
    },
  });
})();
