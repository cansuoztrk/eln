/* Oda: Tahmin Et Beni — birbirimizi ne kadar tanıyoruz? Her gün iki soru: biri senin hakkında, biri onun hakkında.
   Kendi sorunu dürüstçe cevapla; onun sorusunda onun ne diyeceğini tahmin et. İkiniz de yazmadan hiçbir şey görünmez,
   ikisi de gelince cevap ve tahmin yan yana açılır. Cevabın sahibi tahmini puanlar (✓ bildi 2, ≈ yakın 1, ✗ 0).
   "Seni ne kadar tanıyor" çubukları zamanla dolar. Kayıtlar: tahmin {day, about, t: 'cevap'|'tahmin', text} · tahminpuan {day, about, p} */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  const TH = () => D.tahmin || { intro: [], questions: ['En sevdiğin renk?'], scores: [['2', '✓', 'Bildi'], ['1', '≈', 'Yakın'], ['0', '✗', 'Bilemedi']] };
  const mine = () => (K.isOwner() ? 'me' : 'her');
  const other = () => (K.isOwner() ? 'her' : 'me');
  const nameOf = (w) => (w === 'me' ? C.myPet : C.herPet);
  const ping = (title, msg) => K.ping && K.ping(title, msg, ['thinking'], { click: K.roomUrl('tahmin') });

  let rows = [], loaded = false, root = null;
  const day = () => T.todayKey();
  const qOf = (k, about) => {
    const qs = TH().questions || ['?'];
    const n = T.dayNumber(T.at(k)) * 2 + (about === 'her' ? 0 : 1);
    return qs[((n % qs.length) + qs.length) % qs.length];
  };
  const get = (k, about, t) => rows.filter((r) => r.kind === 'tahmin' && r.data.day === k && r.data.about === about && r.data.t === t).sort((a, b) => a.at - b.at).pop();
  const scoreOf = (k, about) => rows.filter((r) => r.kind === 'tahminpuan' && r.data.day === k && r.data.about === about).sort((a, b) => a.at - b.at).pop();
  const scoreDef = (p) => (TH().scores || []).find((s) => +s[0] === +p) || ['0', '✗', 'Bilemedi'];
  const add = async (kind, data) => {
    const r = await K.cloud.add(kind, data);
    if (r && !rows.some((x) => x.id === r.id)) rows.push(r);
    return r;
  };
  // w'nin tahminleri (öbürü hakkında) ne kadar tuttu
  function knows(w) {
    const about = w === 'me' ? 'her' : 'me';
    const days = [...new Set(rows.filter((r) => r.kind === 'tahminpuan' && r.data.about === about).map((r) => r.data.day))];
    const pts = days.map((d) => +scoreOf(d, about).data.p);
    return { n: pts.length, pct: pts.length ? Math.round((pts.reduce((s, p) => s + p, 0) / (pts.length * 2)) * 100) : 0 };
  }

  /* ---------- Kartlar ---------- */
  function cardMine(k) {
    const me = mine(), o = other();
    const ans = get(k, me, 'cevap'), gs = get(k, me, 'tahmin'), sc = scoreOf(k, me);
    const q = qOf(k, me);
    let body;
    if (!ans) body = `<form class="th-form" data-th="cevap" autocomplete="off"><textarea class="textarea" rows="2" maxlength="160" placeholder="Dürüstçe..."></textarea><button class="btn red small" type="submit">${A.ui('send')} Cevabımı mühürle</button></form>${gs ? `<p class="th-note">🤔 ${K.esc(nameOf(o))} çoktan tahminini yaptı. Sen cevaplayınca ikisi açılır.</p>` : ''}`;
    else if (!gs) body = `<div class="th-pair"><div class="th-box mine"><small>Senin cevabın</small><p class="hand">${K.esc(ans.data.text)}</p></div><div class="th-box wait"><small>${K.esc(nameOf(o))} tahmini</small><p>🔒 Tahmin edince açılır</p></div></div>`;
    else
      body = `<div class="th-pair open"><div class="th-box mine"><small>Senin cevabın</small><p class="hand">${K.esc(ans.data.text)}</p></div><div class="th-box guess"><small>${K.esc(nameOf(o))} tahmini</small><p class="hand">${K.esc(gs.data.text)}</p></div></div>
        ${sc ? `<p class="th-score s${sc.data.p}">${scoreDef(sc.data.p)[1]} ${K.esc(scoreDef(sc.data.p)[2])}</p>` : `<p class="th-ask">Bildi mi?</p><div class="th-scores">${(TH().scores || []).map(([p, e, l]) => `<button type="button" class="s${p}" data-th-p="${p}"><span>${e}</span>${K.esc(l)}</button>`).join('')}</div>`}`;
    return `<section class="card th-card me"><p class="card-eyebrow">Senin hakkında · ${K.esc(nameOf(o))} tahmin ediyor</p><h3 class="th-q">${K.esc(q)}</h3>${body}</section>`;
  }
  function cardOther(k) {
    const me = mine(), o = other();
    const ans = get(k, o, 'cevap'), gs = get(k, o, 'tahmin'), sc = scoreOf(k, o);
    const q = qOf(k, o);
    let body;
    if (!gs) body = `<p class="th-sub">Sence ${K.esc(nameOf(o))} ne cevap verdi?</p><form class="th-form" data-th="tahmin" autocomplete="off"><textarea class="textarea" rows="2" maxlength="160" placeholder="Tahminin..."></textarea><button class="btn soft small" type="submit">🤔 Tahminimi mühürle</button></form>${ans ? `<p class="th-note">✍️ ${K.esc(nameOf(o))} cevabını yazdı. Tahmin edince açılır.</p>` : ''}`;
    else if (!ans) body = `<div class="th-pair"><div class="th-box wait"><small>${K.esc(nameOf(o))} cevabı</small><p>🔒 O cevaplayınca açılır</p></div><div class="th-box guess"><small>Senin tahminin</small><p class="hand">${K.esc(gs.data.text)}</p></div></div>`;
    else
      body = `<div class="th-pair open"><div class="th-box mine"><small>${K.esc(nameOf(o))} cevabı</small><p class="hand">${K.esc(ans.data.text)}</p></div><div class="th-box guess"><small>Senin tahminin</small><p class="hand">${K.esc(gs.data.text)}</p></div></div>
        ${sc ? `<p class="th-score s${sc.data.p}">${scoreDef(sc.data.p)[1]} ${K.esc(nameOf(o))}: ${K.esc(scoreDef(sc.data.p)[2])}</p>` : `<p class="th-note">${K.esc(nameOf(o))} puanlayacak.</p>`}`;
    return `<section class="card th-card other"><p class="card-eyebrow">${K.esc(nameOf(o))} hakkında · sen tahmin ediyorsun</p><h3 class="th-q">${K.esc(q)}</h3>${body}</section>`;
  }
  function render() {
    if (!root || K.activeRoom !== 'tahmin') return;
    const k = day();
    const km = knows(mine()), ko = knows(other());
    K.$('#thMeter', root).innerHTML = `<div class="th-m"><span>${K.esc(nameOf(other()))} seni</span><i><b style="width:${ko.pct}%"></b></i><strong>%${ko.pct}</strong><small>${ko.n} soru</small></div>
      <div class="th-m me"><span>Sen onu</span><i><b style="width:${km.pct}%"></b></i><strong>%${km.pct}</strong><small>${km.n} soru</small></div>`;
    K.$('#thToday', root).innerHTML = cardMine(k) + cardOther(k);
    // Geçmiş: ikisi de açılmış günler
    const days = [...new Set(rows.filter((r) => r.kind === 'tahmin' && r.data.day !== k).map((r) => r.data.day))].sort().reverse().slice(0, 14);
    const item = (d, about) => {
      const a = get(d, about, 'cevap'), g = get(d, about, 'tahmin'), s = scoreOf(d, about);
      if (!a || !g) return '';
      return `<li><p class="th-hq">${K.esc(qOf(d, about))} <small>${K.esc(nameOf(about))} hakkında</small></p><p><b>${K.esc(nameOf(about))}:</b> <span class="hand">${K.esc(a.data.text)}</span></p><p><b>${K.esc(nameOf(about === 'me' ? 'her' : 'me'))} tahmini:</b> <span class="hand">${K.esc(g.data.text)}</span> ${s ? `<em class="s${s.data.p}">${scoreDef(s.data.p)[1]}</em>` : ''}</p></li>`;
    };
    const hist = days.map((d) => item(d, 'her') + item(d, 'me')).join('');
    K.$('#thHist', root).innerHTML = hist ? `<p class="card-eyebrow">Önceki günler</p><ul class="th-hist">${hist}</ul>` : '';
    K.$('#thHist', root).hidden = !hist;
  }

  /* ---------- Eylemler ---------- */
  async function submit(t, text) {
    if (!K.cloud || !K.cloud.enabled) return K.fx.toast('Bulut kapalı; bu oyun için bulut gerekiyor.');
    text = text.trim();
    if (!text) return;
    const k = day();
    const about = t === 'cevap' ? mine() : other();
    if (get(k, about, t)) return render();
    const r = await add('tahmin', { day: k, about, t, text });
    if (!r) return K.fx.toast('Gönderilemedi. İnternet bağlantını kontrol et.');
    K.audio.sfx.chime();
    K.stickers.award('tahmin');
    const pair = t === 'cevap' ? get(k, about, 'tahmin') : get(k, about, 'cevap');
    if (pair) {
      K.fx.confetti({ count: 60, shapes: ['spark'] });
      K.fx.toast('🔓 <b>Açıldı!</b> Cevap ve tahmin yan yana.', { duration: 3500 });
    } else K.fx.toast(t === 'cevap' ? `🔒 Mühürlendi. ${K.esc(nameOf(other()))} tahmin edince açılır.` : `🔒 Tahminin mühürlendi. ${K.esc(nameOf(other()))} cevaplayınca açılır.`, { duration: 3500 });
    if (t === 'tahmin') ping(`🤔 ${K.meName()} bugün senin hakkında bir tahminde bulundu`, pair ? 'Cevabınla yan yana açıldı; bildi mi, puanla.' : `"${qOf(k, about)}" Sen de cevapla, açılsın.`);
    else if (pair) ping(`✍️ ${K.meName()} cevabını yazdı`, 'Tahminin açıldı. Bildin mi?');
    render();
  }
  async function rate(p) {
    const k = day();
    if (scoreOf(k, mine())) return;
    const r = await add('tahminpuan', { day: k, about: mine(), p: +p });
    if (!r) return K.fx.toast('Gönderilemedi.');
    if (+p === 2) {
      K.audio.sfx.success();
      K.fx.confetti({ count: 90, shapes: ['heart'] });
    } else K.audio.sfx.tap();
    ping(`${scoreDef(p)[1]} ${K.meName()} tahminini puanladı: ${scoreDef(p)[2]}`, `"${qOf(k, mine())}"`);
    render();
  }

  K.on('cloud', async (ok) => {
    if (!ok) return;
    rows = await K.cloud.many(['tahmin', 'tahminpuan'], { limit: 1200 });
    loaded = true;
    ['tahmin', 'tahminpuan'].forEach((kind) =>
      K.cloud.on(kind, (r) => {
        if (rows.some((x) => x.id === r.id)) return;
        rows.push(r);
        if (r.who !== mine() && r.data.day === day()) {
          if (kind === 'tahmin' && r.data.t === 'tahmin') K.fx.toast(`🤔 <b>${K.esc(nameOf(r.who))} senin hakkında bir tahminde bulundu.</b> <a href="#tahmin">Bak</a>`, { duration: 7000 });
          if (kind === 'tahminpuan') K.fx.toast(`${scoreDef(r.data.p)[1]} <b>${K.esc(nameOf(r.who))} tahminini puanladı: ${K.esc(scoreDef(r.data.p)[2])}</b>`, { duration: 6000 });
        }
        if (K.activeRoom === 'tahmin') render();
        else K.renderSpecials && !K.activeRoom && K.renderSpecials();
      })
    );
  });
  K.specialHooks = (K.specialHooks || []).concat(() => {
    if (!loaded || !D.tahmin) return [];
    const k = day(), me = mine(), o = other();
    const ansO = get(k, o, 'cevap'), gsMine = get(k, o, 'tahmin'), gsO = get(k, me, 'tahmin'), ansMine = get(k, me, 'cevap');
    if (ansMine && gsO && !scoreOf(k, me)) return [{ icon: 'question', title: `🔓 ${nameOf(o)} senin hakkında tahmin etti`, text: 'Cevabınla yan yana açıldı. Bildi mi? Puanla.', room: 'tahmin', cta: 'Puanla' }];
    if ((ansO && !gsMine) || (gsO && !ansMine)) return [{ icon: 'question', title: `🤔 Tahmin Et Beni: ${nameOf(o)} bugünkü soruları başlattı`, text: 'Sen de yaz; ikiniz de yazınca açılır.', room: 'tahmin', cta: 'Oyna' }];
    return [];
  });

  K.tahmin = { knows };

  K.room({
    id: 'tahmin',
    wing: 'oyun',
    title: 'Tahmin Et Beni',
    sub: 'Birbirimizi ne kadar tanıyoruz?',
    icon: 'question',
    color: '#E6F0FF',
    hidden: () => !D.tahmin || !K.cloud || !K.cloud.enabled,
    badge: () => {
      if (!loaded) return '';
      const k = day();
      return !get(k, mine(), 'cevap') || !get(k, other(), 'tahmin') ? 'Bugün' : '';
    },
    init(el) {
      root = el;
      el.innerHTML = `<div class="room-intro">${K.paras(TH().intro || [])}</div>
        <section class="card th-meter" id="thMeter"></section>
        <div class="th-today" id="thToday"></div>
        <section class="card th-histc" id="thHist"></section>`;
      el.addEventListener('submit', (e) => {
        const f = e.target.closest('[data-th]');
        if (!f) return;
        e.preventDefault();
        submit(f.dataset.th, K.$('textarea', f).value);
      });
      el.addEventListener('click', (e) => {
        const b = e.target.closest('[data-th-p]');
        if (b) rate(b.dataset.thP);
      });
    },
    enter() {
      render();
    },
  });
})();
