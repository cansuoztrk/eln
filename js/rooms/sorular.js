/* Oda: Soru Kutusu — her gün bir soru; cevabı onun telefonuna gider, burada bir defterde birikir */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  let root;
  const all = () => K.store.get('answers', {});
  // Buluttaki cevaplar: ikisinin cevabı yan yana (karşı tarafınki ancak sen cevaplayınca görünür)
  let cloudRows = [];
  K.on('cloud', async (on) => {
    if (!on) return;
    cloudRows = await K.cloud.list('answer');
    K.cloud.on('answer', (r) => {
      cloudRows.push(r);
      K.emit('answered', r.data.i);
    });
    K.emit('answered', -1);
  });
  const mine = () => (K.isOwner() ? 'me' : 'her');

  K.questions = {
    today() {
      const i = (T.dayNumber(T.now()) + 11) % D.questions.length;
      return { i, text: K.fill(D.questions[i]) };
    },
    answer: (i) => {
      if (K.isOwner()) {
        const r = cloudRows.filter((x) => x.who === 'me' && x.data.i === i).pop();
        return r ? { a: r.data.a, date: K.time.key(T.baku(new Date(r.at))) } : undefined;
      }
      return all()[i];
    },
    other: (i) => {
      const r = cloudRows.filter((x) => x.who !== mine() && x.data.i === i).pop();
      return r ? r.data.a : '';
    },
    async save(i, text) {
      const a = all();
      a[i] = { a: text.slice(0, 400), date: T.todayKey() };
      if (!K.isOwner()) K.store.set('answers', a);
      if (K.cloud.enabled) K.cloud.add('answer', { i, a: text.slice(0, 400) });
      if (Object.keys(a).length >= 7) K.stickers.award('soru');
      const ok = await K.notify(`Günün sorusu: ${C.herName} cevapladı`, `${K.fill(D.questions[i])}\n\n"${text}"`, ['speech_balloon']);
      K.fx.toast(ok ? `Cevabın ${K.ek(C.myName, 'in')} telefonuna ulaştı.` : 'Cevabın deftere yazıldı.', { icon: A.icon('question') });
      K.emit('answered', i);
    },
  };

  function render() {
    const q = K.questions.today();
    const a = K.questions.answer(q.i);
    K.$('#sqToday', root).innerHTML = `
      <p class="card-eyebrow">Bugünün sorusu · ${T.fmt(T.todayKey())}</p>
      <h3 class="sq-q">${K.esc(q.text)}</h3>
      ${
        a
          ? `<p class="sq-a hand">"${K.esc(a.a)}"</p>${
              K.questions.other(q.i)
                ? `<div class="sq-other"><p class="card-eyebrow">${K.esc(K.otherName())}'un cevabı</p><p class="hand">"${K.esc(K.questions.other(q.i))}"</p></div>`
                : `<p class="muted small">Cevabın gitti. ${K.cloud.enabled ? `${K.esc(K.otherName())} cevaplayınca onunki de burada, yanında görünecek.` : 'Yarın yeni bir soru gelecek.'}</p>`
            }`
          : `<form class="sq-form" id="sqForm" autocomplete="off"><textarea class="textarea" id="sqAns" name="sqAns" rows="3" maxlength="400" placeholder="İstediğin kadar uzun yaz..."></textarea><button class="btn" type="submit">${A.ui('send')} Cevabı gönder</button></form>`
      }`;
    const f = K.$('#sqForm', root);
    f &&
      f.addEventListener('submit', async (e) => {
        e.preventDefault();
        const v = K.$('#sqAns', root).value.trim();
        if (!v) return;
        await K.questions.save(q.i, v);
        K.audio.sfx.success();
        render();
      });
    const answers = Object.entries(all()).sort((x, y) => (x[1].date < y[1].date ? 1 : -1));
    K.$('#sqCount', root).textContent = `${answers.length} / ${D.questions.length} soru cevaplandı`;
    K.$('#sqBar', root).style.width = (answers.length / D.questions.length) * 100 + '%';
    K.$('#sqList', root).innerHTML = answers.length
      ? answers
          .map(
            ([i, a], n) => `<li class="sq-item" style="--d:${Math.min(n, 10) * 0.05}s">
          <p class="sq-date">${T.fmt(a.date)}</p>
          <p class="sq-iq">${K.esc(K.fill(D.questions[i] || ''))}</p>
          <p class="sq-ia hand">${K.esc(a.a)}</p>
          ${K.questions.other(+i) ? `<p class="sq-io"><b>${K.esc(K.otherName())}:</b> <span class="hand">${K.esc(K.questions.other(+i))}</span></p>` : ''}
        </li>`
          )
          .join('')
      : `<li class="sq-empty muted">Defter şimdilik boş. İlk cevabın buraya yazılacak.</li>`;
  }

  K.room({
    id: 'sorular',
    wing: 'hazine',
    title: 'Soru Kutusu',
    sub: 'Her gün bir soru, cevabın bana',
    icon: 'question',
    color: '#FFF3C4',
    badge: () => (K.questions.answer(K.questions.today().i) ? '' : 'Bugün'),
    init(el) {
      root = el;
      el.innerHTML = `
        <p class="room-intro">Birbirimizi her gün biraz daha tanımak için: her sabah kutuda yeni bir soru. Cevabın hem bu deftere yazılır hem de benim telefonuma gelir. Bir yılın sonunda elimizde birbirimiz hakkında koca bir kitap olacak.</p>
        <div class="card sq-today" id="sqToday"></div>
        <div class="sq-head">
          <h3 class="sub-h">Cevap defterin</h3>
          <p class="muted small" id="sqCount"></p>
          <div class="sq-prog"><i id="sqBar"></i></div>
        </div>
        <ol class="sq-list" id="sqList"></ol>`;
      K.on('answered', () => K.activeRoom === 'sorular' && render());
    },
    enter() {
      render();
    },
  });
})();
