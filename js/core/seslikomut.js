/* Kale 2.0 — Sesli Komut: kalp menüsündeki "🎙️ Kitty, ..." düğmesine dokun ve söyle. Telefonun kendi konuşma tanıması
   (Safari/Chrome) Türkçe dinler; ses hiçbir yere kaydedilmez. Anlaşılanlar: "ona sarıl", "özledim", "seni düşünüyorum",
   "günaydın", "iyi geceler", "uyuyorum", "öp", "dürt", "seni seviyorum" (kavanoza kalp), "radyoyu aç", "müziği aç/kapat",
   "saat kaç", "<oda adı> aç" ve bir soru ("geçen ay ne yaptık?") — anlaşılmayan her şey Kitty'ye Sor'a gider. */
(function () {
  'use strict';
  const K = window.K;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  const SR = () => window.SpeechRecognition || window.webkitSpeechRecognition;
  const ok = () => Boolean(SR());
  const norm = (s) => String(s || '').toLocaleLowerCase('tr').replace(/[.,!?]/g, ' ').replace(/\s+/g, ' ').trim();
  let rec = null, ov = null;
  const dummy = () => {
    const b = document.createElement('button');
    b.style.cssText = 'position:fixed;left:50%;top:50%;width:1px;height:1px;opacity:0;pointer-events:none';
    document.body.appendChild(b);
    setTimeout(() => b.remove(), 1500);
    return b;
  };
  const say = (html) => K.fx.toast(`🎙️ ${html}`, { duration: 3200 });
  function findRoom(t) {
    const n = K.norm(t);
    const vis = K.rooms.filter((r) => !(typeof r.hidden === 'function' ? r.hidden() : r.hidden) && !r.secret);
    let best = null, score = 0;
    vis.forEach((r) => {
      const title = K.norm(K.val(r.title));
      const words = title.split(' ').filter((w) => w.length > 2);
      const hit = n.includes(title) ? 10 : words.filter((w) => n.includes(w)).length;
      if (hit > score) (best = r), (score = hit);
    });
    return score > 0 ? best : null;
  }
  function handle(raw) {
    const t = norm(raw).replace(/^(hey )?kitty,? ?/, '');
    if (!t) return say('Bir şey duyamadım.');
    const kalp = (id) => K.kalp && K.kalp.act(id, dummy());
    if (/sarıl/.test(t)) return kalp('saril'), say('🤗 Sarıldın.');
    if (/özledim|özlüyorum/.test(t)) return kalp('ozlem');
    if (/düşün/.test(t)) return kalp('dusun');
    if (/günaydın/.test(t)) return kalp('sabah');
    if (/uyuyorum|uyuyacağım|uyumaya/.test(t)) {
      kalp('gece');
      return setTimeout(() => K.go('gece'), 600);
    }
    if (/iyi geceler/.test(t)) return kalp('gece');
    if (/\böp/.test(t) && K.dokunus) return K.dokunus.kiss();
    if (/dürt/.test(t) && K.yan) return K.yan.nudge();
    if (/seni seviyorum|seviyorum/.test(t)) {
      K.go('kavanoz');
      return setTimeout(() => {
        const b = K.$('[data-kv="at"]');
        b ? b.click() : say('Kavanoz açıldı; bir kalp at.');
      }, 900);
    }
    if (/müzi(k|ği)/.test(t)) return K.audio.music.toggle(), say(K.audio.music.on ? 'Müzik açıldı.' : 'Müzik kapandı.');
    if (/saat kaç/.test(t)) return say(`Bakü <b>${T.hm(C.tzBaku)}</b> · İstanbul <b>${T.hm(C.tzIstanbul)}</b>`);
    if (/ana salon|eve dön|salon/.test(t)) return K.go('');
    if (/\?|ne zaman|ne yaptık|kaç|kim/.test(raw) || /ne zaman|ne yaptık|kaç |kim /.test(t)) {
      K.ara && K.ara.open();
      return setTimeout(() => {
        const inp = K.$('.ara-in');
        if (inp) {
          inp.value = raw;
          inp.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }, 120);
    }
    const r = findRoom(t);
    if (r) return say(`<b>${K.esc(K.val(r.title))}</b> açılıyor.`), K.go(r.id);
    K.ara && K.ara.open();
    setTimeout(() => {
      const inp = K.$('.ara-in');
      if (inp) {
        inp.value = raw;
        inp.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }, 120);
  }
  function listen() {
    if (!ok()) return K.fx.toast('Bu tarayıcı sesli komutu desteklemiyor. iPhone\'da Safari\'yi güncel tut.', { duration: 3600 });
    if (rec) return rec.stop();
    rec = new (SR())();
    rec.lang = 'tr-TR';
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    ov = K.el(`<div class="sk-dinle" role="status"><span class="sk-dalga"><i></i><i></i><i></i><i></i><i></i></span><b>Kitty dinliyor...</b><small id="skAra">"Kitty, ona sarıl" de</small><button type="button" class="btn ghost small">Vazgeç</button></div>`);
    document.body.appendChild(ov);
    K.$('button', ov).addEventListener('click', () => rec && rec.abort());
    let final = '';
    rec.onresult = (e) => {
      let tx = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        tx += e.results[i][0].transcript;
        if (e.results[i].isFinal) final = e.results[i][0].transcript;
      }
      const a = K.$('#skAra', ov);
      a && (a.textContent = `"${tx}"`);
    };
    rec.onerror = (e) => {
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') K.fx.toast('Mikrofon ya da konuşma izni verilmedi. iPhone: Ayarlar → Safari → Mikrofon, ve Ayarlar → Gizlilik → Konuşma Tanıma.', { duration: 5000 });
    };
    rec.onend = () => {
      ov && ov.remove();
      ov = null;
      rec = null;
      if (final) {
        K.stickers.award('seslikomut');
        handle(final);
      }
    };
    try {
      rec.start();
    } catch (e) {
      rec = null;
      ov && ov.remove();
    }
  }
  K.seslikomut = { ok, listen, handle };
})();
