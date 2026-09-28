/* Oda: Öğretmen Eln'in Sınıfı — üç dilli aşk sözlüğü, düzeltilecek ödev, aşk sınavı ve karne */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;

  let root;

  /* ---------------- Sesli okuma ---------------- */
  function speak(text, lang) {
    const s = window.speechSynthesis;
    if (!s || !window.SpeechSynthesisUtterance) {
      K.fx.toast('Bu cihaz sesli okumayı desteklemiyor.');
      return;
    }
    s.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const voices = s.getVoices();
    const want = lang === 'az' ? ['az', 'tr'] : lang === 'en' ? ['en-GB', 'en'] : ['tr'];
    let v = null;
    for (const w of want) {
      v = voices.find((x) => x.lang.toLowerCase().startsWith(w.toLowerCase()));
      if (v) break;
    }
    if (v) {
      u.voice = v;
      u.lang = v.lang;
    } else u.lang = lang === 'en' ? 'en-GB' : lang === 'az' ? 'az-AZ' : 'tr-TR';
    u.rate = 0.92;
    s.speak(u);
  }

  /* ---------------- Sözlük ---------------- */
  function dictHTML() {
    const today = K.daily(D.dictionary, 3);
    const card = (w, i) => `<div class="flip" data-i="${i}">
        <button class="flip-in" aria-label="${K.esc(w[0])}: çevirmek için dokun">
          <span class="flip-front"><small>Türkçe</small><b>${K.esc(w[0])}</b><i>Çevirmek için dokun</i></span>
          <span class="flip-back"><small>Azərbaycanca</small><b>${K.esc(w[1])}</b><small>English</small><b class="en">${K.esc(w[2])}</b></span>
        </button>
        <div class="flip-say">
          <button class="say" data-lang="tr" data-t="${K.esc(w[0])}" aria-label="Türkçe dinle">TR</button>
          <button class="say" data-lang="az" data-t="${K.esc(w[1])}" aria-label="Azerbaycanca dinle">AZ</button>
          <button class="say" data-lang="en" data-t="${K.esc(w[2])}" aria-label="İngilizce dinle">EN</button>
        </div>
      </div>`;
    return `<div class="card wotd">
        <p class="card-eyebrow">Günün kelimesi</p>
        <div class="wotd-row"><div><p class="wotd-w">${K.esc(today[0])}</p><p class="wotd-t"><span>AZ</span> ${K.esc(today[1])} <span>EN</span> ${K.esc(today[2])}</p></div>
        <button class="icon-btn say" data-lang="en" data-t="${K.esc(today[2])}" aria-label="İngilizce dinle">${A.ui('speaker')}</button></div>
      </div>
      <div class="flips">${D.dictionary.map(card).join('')}</div>
      <p class="muted small" style="margin-top:12px">Azerbaycanca ses her cihazda olmayabilir; olmadığında Türkçe sesle okunur. Telaffuzu düzeltmek sana düşüyor, öğretmenim.</p>`;
  }

  /* ---------------- Azerbaycanca defterim ---------------- */
  const taught = () => K.store.get('taughtWords', []);
  function azHTML() {
    const entry = (e, i) => `<li class="az-e ${e.reply ? '' : 'next'}" style="--d:${i * 0.05}s">
        <div class="az-w"><b>${K.esc(e.az)}</b><button class="say" data-lang="az" data-t="${K.esc(e.az)}" aria-label="Dinle">AZ</button></div>
        <p class="az-tr">${K.esc(e.tr)}</p>
        ${e.reply ? `<p class="az-said"><span>Ben:</span> ${K.esc(e.said)}</p><p class="az-reply"><span>Sen:</span> ${K.esc(e.reply)}</p>` : `<p class="az-said muted">${K.esc(e.said)}</p>`}
      </li>`;
    const mine = taught()
      .map((w) => `<li class="az-e hw"><div class="az-w"><b>${K.esc(w.az)}</b><button class="say" data-lang="az" data-t="${K.esc(w.az)}" aria-label="Dinle">AZ</button></div><p class="az-tr">${K.esc(w.tr)}</p><p class="az-said muted">Öğretmenimin verdiği ödev · ${K.time.fmtShort(w.date)}</p></li>`)
      .join('');
    return `<div class="az-book">
        <div class="az-cover"><span>Azərbaycan dili</span><b>${K.esc(C.myName)}'in defteri</b><small>Öğretmen: ${K.esc(C.herPet)}</small>${K.voice ? K.voice.btn('sevirem', 'Telaffuzumu dinle (gülme)') : ''}</div>
        <ol class="az-list">${D.azNotebook.map(entry).join('')}${mine}</ol>
      </div>
      <form class="card az-teach" id="azTeach" autocomplete="off">
        <p class="card-eyebrow">Bana yeni bir kelime öğret</p>
        <div class="row"><input class="input" id="azWord" name="azWord" placeholder="Azerbaycanca" maxlength="60"><input class="input" id="azMean" name="azMean" placeholder="Anlamı" maxlength="80"><button class="btn" type="submit">${A.ui('send')} Öğret</button></div>
        <p class="muted small">Öğrettiğin kelime deftere yazılır ve ${K.esc(C.myName)}'in telefonuna ödev olarak düşer.</p>
      </form>`;
  }
  function initAz() {
    const sec = K.$('[data-tab="az"]', root);
    sec.addEventListener('submit', async (e) => {
      if (!e.target.closest('#azTeach')) return;
      e.preventDefault();
      const az = K.$('#azWord', sec).value.trim();
      const tr = K.$('#azMean', sec).value.trim();
      if (!az || !tr) return;
      const list = taught();
      list.push({ az, tr, date: K.time.todayKey() });
      K.store.set('taughtWords', list.slice(-40));
      sec.innerHTML = azHTML();
      K.audio.sfx.success();
      const ok = await K.notify(`Öğretmen ${C.herName}'den yeni kelime`, `${az} = ${tr}\nBir dahaki mesajında kullanman bekleniyor.`, ['pencil2']);
      K.fx.toast(ok ? `Kelime deftere yazıldı ve ${C.myName}'e ödev olarak gitti.` : 'Kelime deftere yazıldı.', { icon: A.icon('pencil') });
    });
  }

  /* ---------------- Ödev ---------------- */
  function essayHTML() {
    const src = K.fill(D.essay.text);
    const parts = [];
    let last = 0,
      m,
      k = 0;
    const re = /\[([^|\]]+)\|([^\]]+)\]/g;
    const plain = (t) =>
      t
        .split(/(\s+)/)
        .map((w) => (/^\s+$/.test(w) || !w ? w : `<span class="w">${K.esc(w)}</span>`))
        .join('');
    while ((m = re.exec(src))) {
      parts.push(plain(src.slice(last, m.index)));
      parts.push(`<span class="w err" data-k="${k++}" data-fix="${K.esc(m[2])}">${K.esc(m[1])}</span>`);
      last = re.lastIndex;
    }
    parts.push(plain(src.slice(last)));
    return { html: parts.join(''), total: k };
  }
  function initEssay() {
    const box = K.$('#essay', root);
    const { html, total } = essayHTML();
    const done = K.store.get('essay', null);
    box.innerHTML = `<div class="paper-sheet">
        <div class="ps-head"><p class="ps-name">${K.esc(K.fill(D.essay.student))}</p><p class="ps-date">${K.time.fmt(K.time.now())}</p></div>
        <h3 class="ps-title">${K.esc(D.essay.title)}</h3>
        <p class="ps-text" id="psText">${html}</p>
        <div class="ps-stamp" id="psStamp" hidden></div>
      </div>
      <div class="essay-bar">
        <p id="essayCount" class="essay-count"></p>
        <button class="btn ghost small" id="essayReset">${A.ui('refresh')} Baştan kontrol et</button>
      </div>
      <div class="card grade" id="gradeBox" hidden>
        <p class="card-eyebrow">Notunu ver, öğretmenim</p>
        <div class="grade-row">${['A+', 'A', 'B', 'C'].map((g) => `<button class="grade-btn" data-g="${g}">${g}</button>`).join('')}</div>
        <p class="grade-reply hand" id="gradeReply"></p>
      </div>`;
    let found = new Set();
    const count = () => {
      K.$('#essayCount', root).innerHTML = `Bulunan hata: <b>${found.size}</b> / ${total}`;
      if (found.size === total) {
        K.$('#gradeBox', root).hidden = false;
        K.stickers.award('ogretmen');
      }
    };
    const fix = (s) => {
      s.classList.add('fixed');
      s.setAttribute('data-fix-shown', s.dataset.fix);
    };
    if (done && done.all) {
      K.$$('.err', box).forEach((s) => {
        fix(s);
        found.add(s.dataset.k);
      });
      if (done.grade) stamp(done.grade, false);
    }
    count();
    let lastWrong = 0;
    K.$('#psText', box).addEventListener('click', (e) => {
      const s = e.target.closest('.w');
      if (!s) return;
      if (s.classList.contains('err')) {
        if (found.has(s.dataset.k)) return;
        found.add(s.dataset.k);
        fix(s);
        K.audio.sfx.success();
        const r = s.getBoundingClientRect();
        K.fx.burst(r.left + r.width / 2, r.top, { count: 8, colors: ['#E3174D', '#FF6FA3'], shapes: ['star', 'spark'] });
        K.store.set('essay', { all: found.size === total, grade: (K.store.get('essay', {}) || {}).grade });
        count();
      } else {
        s.classList.remove('ok-wiggle');
        void s.offsetWidth;
        s.classList.add('ok-wiggle');
        if (Date.now() - lastWrong > 2500) {
          lastWrong = Date.now();
          K.fx.toast(K.pick(['Bu kelime doğru öğretmenim!', 'Orada hata yok, söz.', 'Hmm, oraya bir daha bak derim.', 'Doğru o! Başka yerde ara.']));
        }
      }
    });
    K.$('#gradeBox', root).addEventListener('click', (e) => {
      const b = e.target.closest('.grade-btn');
      if (!b) return;
      stamp(b.dataset.g, true);
      K.store.set('essay', { all: true, grade: b.dataset.g });
    });
    K.$('#essayReset', root).addEventListener('click', () => {
      K.store.set('essay', null);
      initEssay();
    });
  }
  function stamp(g, anim) {
    const replies = {
      'A+': 'Yaşasın! Thank you, teacher! I love you (bunu doğru yazdım, değil mi?)',
      A: 'A mı? Çok iyi! Bir dahaki ödevde A+ için ekstra kalp çizeceğim.',
      B: 'B mi... Öğretmenim bir daha düşünün, ben sizi A+ seviyorum.',
      C: 'C mi?! Tamam, bu akşam gartic yerine İngilizce çalışıyorum. (Belki.)',
    };
    const st = K.$('#psStamp', root);
    st.hidden = false;
    st.innerHTML = `<span class="stamp-grade">${g}</span><span class="stamp-t">${g === 'A+' ? 'Aferin!' : g === 'A' ? 'Very good' : 'Tekrar et'}</span>`;
    st.classList.remove('stamped');
    void st.offsetWidth;
    st.classList.add('stamped');
    K.$('#gradeReply', root).textContent = `${C.myName}: ${replies[g]}`;
    K.$('#gradeBox', root).hidden = false;
    K.$$('.grade-btn', root).forEach((b) => b.setAttribute('aria-pressed', b.dataset.g === g ? 'true' : 'false'));
    if (anim) {
      K.audio.sfx.pop();
      if (g === 'A+') K.fx.confetti({ count: 90 });
    }
  }

  /* ---------------- Aşk sınavı ---------------- */
  const quiz = { i: 0, score: 0 };
  function renderQ() {
    const box = K.$('#quiz', root);
    const Q = D.quiz;
    if (quiz.i >= Q.length) return karne();
    const q = Q[quiz.i];
    box.innerHTML = `<div class="card q-card">
        <div class="q-top"><span class="q-num">Soru ${quiz.i + 1} / ${Q.length}</span><span class="q-score">${quiz.score} doğru</span></div>
        <div class="q-bar"><i style="width:${(quiz.i / Q.length) * 100}%"></i></div>
        <h3 class="q-q">${K.esc(K.fill(q.q))}</h3>
        <div class="q-opts">${q.options.map((o, i) => `<button class="q-opt" data-i="${i}"><span>${'ABCD'[i]}</span>${K.esc(K.fill(o))}</button>`).join('')}</div>
        <p class="q-note" id="qNote" hidden></p>
        <button class="btn" id="qNext" hidden>${quiz.i === Q.length - 1 ? 'Karnemi göster' : 'Sonraki soru'} ${A.ui('next')}</button>
      </div>`;
    K.$('.q-opts', box).addEventListener('click', (e) => {
      const b = e.target.closest('.q-opt');
      if (!b || box.querySelector('.q-opt.chosen')) return;
      const i = +b.dataset.i;
      const right = q.answer === -1 || i === q.answer;
      b.classList.add('chosen', right ? 'right' : 'wrong');
      if (!right) K.$(`.q-opt[data-i="${q.answer}"]`, box).classList.add('right');
      if (q.answer === -1) K.$$('.q-opt', box).forEach((x) => x.classList.add('right'));
      if (right) {
        quiz.score++;
        K.audio.sfx.success();
      } else K.audio.sfx.fail();
      const note = K.$('#qNote', box);
      note.hidden = false;
      note.textContent = (right ? 'Doğru! ' : 'Olmadı... ') + K.fill(q.note);
      K.$('#qNext', box).hidden = false;
      K.$('#qNext', box).focus({ preventScroll: true });
    });
    K.$('#qNext', box).addEventListener('click', () => {
      quiz.i++;
      renderQ();
    });
  }
  function karne() {
    const box = K.$('#quiz', root);
    const n = D.quiz.length;
    const s = quiz.score;
    const note = Math.max(1, Math.round((s / n) * 5));
    const words = ['', 'Geçmez', 'Geçer', 'Orta', 'İyi', 'Pekiyi'];
    const takdir = s >= n - 2;
    const best = Math.max(K.store.get('quizBest', 0), s);
    K.store.set('quizBest', best);
    if (takdir) K.stickers.award('karne');
    const rows = [
      ['Beni Tanıma Bilgisi', `${note} (${words[note]})`],
      ['Tatlılık', '5 (Pekiyi)'],
      ['Gartic Tahmin', '5 (Pekiyi)'],
      ['Hello Kitty Bilgisi', '5 (Pekiyi)'],
      ['Bana Sabretme', '5 (Pekiyi)'],
      ['Güzellik', '∞'],
    ];
    box.innerHTML = `<div class="karne">
        <div class="karne-head"><p>T.C. Kalbimin Milli Eğitim Bakanlığı</p><h3>KARNE</h3><p>${K.esc(C.herName)} · Aşk Bölümü · Sınıf 1-A</p></div>
        <table class="karne-t"><thead><tr><th>Ders</th><th>Not</th></tr></thead><tbody>${rows.map(([a, b]) => `<tr><td>${a}</td><td>${b}</td></tr>`).join('')}</tbody></table>
        <p class="karne-score">Sınav: <b>${s} / ${n}</b> · En iyi: ${best} / ${n}</p>
        <p class="karne-note">Öğretmen görüşü: ${takdir ? `Öğrencimiz ${K.esc(C.herName)} sevgilisini çok iyi tanıyor. Kalpten <b>Takdir Belgesi</b> almaya hak kazanmıştır.` : `Öğrencimiz ${K.esc(C.herName)} çok tatlı ama bazı tarihleri tekrar etmeli. Masal odası ders kitabı olarak önerilir.`}</p>
        ${takdir ? `<div class="takdir">${A.icon('cap')}<span>TAKDİR BELGESİ</span></div>` : ''}
        <p class="karne-sign">Sınıf öğretmeni: <span class="hand">${K.esc(C.myName)}</span></p>
      </div>
      <div style="text-align:center;margin-top:16px"><button class="btn soft" id="qAgain">${A.ui('refresh')} Sınava yeniden gir</button></div>`;
    if (takdir) K.fx.confetti({ count: 120 });
    K.$('#qAgain', box).addEventListener('click', () => {
      quiz.i = 0;
      quiz.score = 0;
      renderQ();
    });
  }

  function tab(t) {
    K.$$('[data-tab]', root).forEach((s) => (s.hidden = s.dataset.tab !== t));
    K.$$('.tabs .chip', root).forEach((c) => c.setAttribute('aria-selected', c.dataset.t === t ? 'true' : 'false'));
  }

  K.room({
    id: 'sinif',
    wing: 'hazine',
    title: 'Öğretmen Eln\'in Sınıfı',
    sub: 'Sözlük, defter, ödev ve bir aşk sınavı',
    icon: 'board',
    color: '#D8F5E8',
    init(el) {
      root = el;
      el.innerHTML = `
        <p class="room-intro">Bu sınıfın öğretmeni sensin. Hello Kitty de Londralı, yani o da İngilizce konuşuyor; bence o da senin öğrencin olmak isterdi.</p>
        <div class="tabs" role="tablist">
          <button class="chip" role="tab" data-t="dict" aria-selected="true">Aşk sözlüğü</button>
          <button class="chip" role="tab" data-t="az" aria-selected="false">Azerbaycanca defterim</button>
          <button class="chip" role="tab" data-t="essay" aria-selected="false">Ödevimi kontrol et</button>
          <button class="chip" role="tab" data-t="quiz" aria-selected="false">Aşk sınavı</button>
        </div>
        <section data-tab="dict">${dictHTML()}</section>
        <section data-tab="az" hidden>${azHTML()}</section>
        <section data-tab="essay" hidden>
          <p class="room-intro">Öğrencin ${K.esc(C.myName)} İngilizce ödevini teslim etti. İçinde <b>${essayHTML().total}</b> hata var. Hatalı kelimelere dokun, kırmızı kalemle düzelt, sonra notunu ver.</p>
          <div id="essay"></div>
        </section>
        <section data-tab="quiz" hidden>
          <p class="room-intro">Bu sefer sınava giren sensin, öğretmenim. ${D.quiz.length} soru, bir karne. Kopya çekmek serbest.</p>
          <div id="quiz"></div>
        </section>`;
      K.$$('.tabs .chip', el).forEach((c) => c.addEventListener('click', () => tab(c.dataset.t)));
      el.addEventListener('click', (e) => {
        const say = e.target.closest('.say');
        if (say) {
          e.stopPropagation();
          speak(say.dataset.t, say.dataset.lang);
          return;
        }
        const f = e.target.closest('.flip-in');
        if (f) {
          f.parentElement.classList.toggle('on');
          K.audio.sfx.tap();
        }
      });
      initEssay();
      initAz();
      renderQ();
      if (window.speechSynthesis) window.speechSynthesis.getVoices();
    },
    leave() {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    },
  });
})();
