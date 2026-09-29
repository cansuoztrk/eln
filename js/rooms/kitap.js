/* Oda: Kale Kitabı — kaledeki her şeyi basılabilir bir A5 kitaba dönüştürür (Yazdır → PDF olarak kaydet) */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  let root;
  const CHAPTERS = [
    ['masal', 'İki Kule Masalı'],
    ['devam', 'Masalın Devamı'],
    ['sohbet', 'Sohbetimizden'],
    ['mektup', 'Mektuplar'],
    ['sebep', 'Seni Sevmemin Sebepleri'],
    ['portre', 'Portreler'],
    ['iz', 'Bakü\'deki İzlerin'],
    ['gok', 'O Gecenin Gökyüzü'],
    ['zaman', 'Zaman Yolcusu'],
    ['zambak', 'Zambak Notları'],
    ['soru', 'Soru Defteri'],
    ['defter', 'Bizim Defter'],
    ['son', 'Son Sayfa'],
  ];
  const chosen = () => K.store.get('bookChapters', Object.fromEntries(CHAPTERS.map(([k]) => [k, true])));
  const page = (cls, html) => `<section class="kb-page ${cls}">${html}</section>`;
  const openerHtml = (n, title, sub) => page('kb-opener', `<p class="kb-n">${K.pad(n)}</p><h2>${K.esc(title)}</h2>${sub ? `<p class="kb-sub">${K.esc(sub)}</p>` : ''}<div class="kb-orn">${A.bow('#E3174D')}</div>`);

  async function build() {
    const ch = chosen();
    const readL = K.store.get('lettersRead', {});
    const out = [];
    const toc = [];
    // Bölüm açılışı: numarayı ve içindekiler satırını da o anda verir (boş bölüm hiç açılmaz)
    const opener = (title, sub) => {
      toc.push(title);
      return openerHtml(toc.length, title, sub);
    };
    // Kapak
    const cover = page(
      'kb-cover',
      `<p class="kb-top">Boğaz'dan Hazar'a bir masal</p><div class="kb-kitty">${A.kitty({ crown: true, eyes: 'heart' })}</div>
      <h1>${K.esc(C.herName)}'in Krallığı</h1><p class="kb-for">${K.esc(C.myPet)}'tan ${K.esc(C.herPet)}'a</p>
      <p class="kb-date">${T.fmt(C.metDate)} – ${T.fmt(T.todayKey())}</p>`
    );

    if (ch.masal) {
      out.push(opener('İki Kule Masalı', 'Hikâyemiz, bir masal kitabında'));
      D.story.forEach((p) => out.push(page('kb-story', `<div class="kb-scene"><svg viewBox="0 0 320 200">${K.scenes[p.scene] ? K.scenes[p.scene]() : ''}</svg></div><h3>${K.esc(K.fill(p.title))}</h3>${K.paras(p.text)}`)));
    }
    if (ch.devam !== false && K.devam && K.devam.enabled()) {
      const chs = K.devam.chapters();
      if (chs.length) {
        out.push(opener('Masalın Devamı', 'İki kalemle, cümle cümle'));
        chs.forEach((c) => out.push(page('kb-story kb-devam', `<div class="kb-scene"><svg viewBox="0 0 320 200">${K.scenes[c.scene] ? K.scenes[c.scene]() : ''}</svg></div><h3>Bölüm ${c.roman}${c.name ? `: ${K.esc(c.name)}` : ''}</h3>${c.pages.map((p) => `<p class="${p.who}">${K.esc(K.fill(p.data.text))}</p>`).join('')}`)));
      }
    }
    if (ch.sohbet) {
      out.push(opener('Sohbetimizden', 'Mesajlarımız, yazıldıkları gibi'));
      D.chats.forEach((c) =>
        out.push(
          page(
            'kb-chat',
            `<h3>${K.esc(c.title)}</h3><p class="kb-sub">${K.esc(c.sub || '')}</p><div class="kb-bubbles">${c.msgs
              .map(([w, t, time]) => `${time ? `<p class="kb-time">${K.esc(time)}</p>` : ''}<p class="kb-b ${w}">${K.esc(t)}</p>`)
              .join('')}</div>${c.note ? `<p class="kb-note hand">${K.esc(K.fill(c.note))}</p>` : ''}`
          )
        )
      );
    }
    const letters = D.letters.filter((l) => K.isOwner() || readL[l.id]);
    if (ch.mektup && letters.length) {
      out.push(opener('Mektuplar', `${letters.length} mektup`));
      letters.forEach((l) => out.push(page('kb-letter', `<p class="kb-kicker">${K.esc(l.title)}</p><div class="kb-lt">${K.paras(l.body)}</div><p class="kb-sign hand">— ${K.esc(l.sign || C.myPet)}</p>`)));
    }
    if (ch.sebep) {
      out.push(opener('Seni Sevmemin Sebepleri', `${D.reasons.length} sebep ve sayılmayan binlercesi`));
      // Bir A5 sayfaya en çok 14 sebep sığar; sayfalara eşit dağıt
      const per = Math.ceil(D.reasons.length / Math.ceil(D.reasons.length / 14));
      for (let i = 0; i < D.reasons.length; i += per)
        out.push(page('kb-reasons', `<ol start="${i + 1}">${D.reasons.slice(i, i + per).map((r) => `<li>${K.esc(K.fill(r))}</li>`).join('')}</ol>`));
    }
    if (ch.portre) {
      out.push(opener('Portreler', 'Kadife duvarlı küçük müzeden'));
      D.portraits.forEach((p) => out.push(page('kb-photo', `<figure><img data-vault="${K.esc(p.id)}" alt=""></figure><h3>${K.esc(p.title)}</h3><p class="hand kb-cap">${K.esc(K.fill(p.text))}</p>`)));
    }
    if (ch.iz) {
      out.push(opener('Bakü\'deki İzlerin', 'Bir duvara yazdığın notlar'));
      D.traces.forEach((t) => out.push(page('kb-photo', `<figure><img data-vault="${K.esc(t.id)}" alt=""></figure><h3>${K.esc(t.title)}</h3><p class="kb-sub">${K.esc(t.where)}</p><p class="hand kb-cap">${K.esc(K.fill(t.text))}</p>`)));
    }
    if (ch.gok && K.skyPoster) {
      out.push(opener('O Gecenin Gökyüzü', 'Özel gecelerimizin yıldız haritaları'));
      D.skies.slice(0, 3).forEach((sk) => out.push(page('kb-sky', K.skyPoster(sk))));
    }
    if (ch.zaman && D.zaman) {
      const solved = K.store.get('zyDone', []);
      const list = D.zaman.chapters.filter((c) => (K.isOwner() || solved.includes(c.id)) && !(c.spoiler && K.spoilerOk && !K.spoilerOk()));
      if (list.length) {
        out.push(opener('Zaman Yolcusu', 'Geçmişe inilen anlar, İstanbul tarafından'));
        list.forEach((c) => out.push(page('kb-letter', `<p class="kb-kicker">${K.esc(c.date)} · ${K.esc(c.title)}</p><div class="kb-lt">${K.paras(c.reveal || [])}</div>`)));
      }
    }
    if (ch.zambak && D.zambak) {
      const blooms = K.store.get('lily', { blooms: [] }).blooms;
      if (blooms.length) {
        out.push(opener('Zambak Notları', `${blooms.length} zambak, ${blooms.length} not`));
        for (let i = 0; i < blooms.length; i += 4)
          out.push(page('kb-qa', blooms.slice(i, i + 4).map((b, k) => `<div class="kb-q"><p class="kb-qq">${K.num(i + k + 1)}. zambak · ${T.fmt(b.day)}</p><p class="hand her">${K.esc(K.fill(D.zambak.notes[b.note] || ''))}</p></div>`).join('')));
      }
    }
    if (ch.soru) {
      const local = K.store.get('answers', {});
      const cloudRows = K.cloud && K.cloud.enabled ? await K.cloud.list('answer') : [];
      const by = {};
      Object.entries(local).forEach(([i, a]) => ((by[i] = by[i] || {})[K.isOwner() ? 'me' : 'her'] = a.a));
      cloudRows.forEach((r) => ((by[r.data.i] = by[r.data.i] || {})[r.who] = r.data.a));
      const items = Object.entries(by);
      if (items.length) out.push(opener('Soru Defteri', `${items.length} soru, iki kalem`));
      for (let i = 0; i < items.length; i += 5)
        out.push(
          page(
            'kb-qa',
            items
              .slice(i, i + 5)
              .map(([q, a]) => `<div class="kb-q"><p class="kb-qq">${K.esc(K.fill(D.questions[q] || ''))}</p>${a.her ? `<p class="hand her">${K.esc(C.herPet)}: ${K.esc(a.her)}</p>` : ''}${a.me ? `<p class="hand me">${K.esc(C.myPet)}: ${K.esc(a.me)}</p>` : ''}</div>`)
              .join('')
          )
        );
    }
    if (ch.defter && K.cloud && K.cloud.enabled) {
      const pages = await K.cloud.list('page');
      if (pages.length) {
        out.push(opener('Bizim Defter', 'İki şehir, iki kalem'));
        for (let i = 0; i < pages.length; i += 4)
          out.push(
            page(
              'kb-diary',
              pages
                .slice(i, i + 4)
                .map((r) => {
                  const p = T.baku(new Date(r.at));
                  return `<div class="kb-d ${r.who}"><p class="kb-dd">${p.d} ${K.MONTHS[p.mo - 1]} ${p.y} · ${K.esc(r.who === 'me' ? C.myPet : C.herPet)}</p><p class="hand">${K.esc(r.data.text)}</p></div>`;
                })
                .join('')
            )
          );
      }
    }
    if (ch.son) {
      out.push(opener('Son Sayfa', ''));
      out.push(page('kb-letter', `<div class="kb-lt">${K.paras(D.finalLetter)}</div><p class="kb-sign hand">— ${K.esc(D.finalSign)}</p>`));
    }
    out.push(page('kb-back', `<div class="kb-kitty">${A.kitty({ cls: 'is-wink' })}</div><p class="hand">Devamı var...</p><p class="kb-sub">Her gün bir sayfa daha yazıyoruz.</p>`));
    const tocHtml = toc.map((t, i) => `<li><span>${K.pad(i + 1)}</span>${K.esc(t)}</li>`).join('');
    return [cover, page('kb-toc', `<h2>İçindekiler</h2><ol>${tocHtml}</ol><p class="kb-ded hand">Bu kitabın her sayfası bir "seni seviyorum"un başka bir hâli.</p>`)].concat(out).join('');
  }

  async function open() {
    const btn = K.$('#kbMake', root);
    btn.disabled = true;
    btn.textContent = 'Kitap hazırlanıyor...';
    const kb = K.el(`<div class="kb" role="dialog" aria-modal="true" aria-label="Kale Kitabı">
      <div class="kb-bar"><button class="btn red small" id="kbPrint" disabled>${A.ui('download')} Yazdır / PDF</button><span class="kb-hint">Telefonda: Yazdır → PDF olarak kaydet. Kâğıt boyutu A5.</span><button class="btn ghost small" id="kbClose">Kapat</button></div>
      <div class="kb-pages">${await build()}</div>
    </div>`);
    document.body.appendChild(kb);
    document.body.classList.add('has-book');
    K.vault.fill(kb);
    const imgs = K.$$('img', kb);
    await Promise.all(imgs.map((img) => new Promise((res) => (img.complete && img.naturalWidth ? res() : ((img.onload = res), (img.onerror = res), setTimeout(res, 8000))))));
    K.$('#kbPrint', kb).disabled = false;
    btn.disabled = false;
    btn.innerHTML = `${A.icon('book')} Kitabı hazırla`;
    K.$('#kbPrint', kb).addEventListener('click', () => {
      document.body.classList.add('printing-book');
      setTimeout(() => {
        window.print();
        setTimeout(() => document.body.classList.remove('printing-book'), 500);
      }, 100);
    });
    K.$('#kbClose', kb).addEventListener('click', () => {
      kb.remove();
      document.body.classList.remove('has-book', 'printing-book');
    });
    K.audio.sfx.paper();
  }

  K.room({
    id: 'kitap',
    wing: 'anilar',
    title: 'Kale Kitabı',
    sub: 'Kalenin tamamı, basılabilir bir kitapta',
    icon: 'book',
    color: '#FFE0E0',
    init(el) {
      root = el;
      const ch = chosen();
      el.innerHTML = `
        <div class="kb-intro">
          <div class="kb-mock" aria-hidden="true"><div class="kb-mock-cover">${A.kitty({ crown: true, eyes: 'heart' })}<b>${K.esc(C.herName)}'in Krallığı</b><small>Boğaz'dan Hazar'a bir masal</small></div><div class="kb-mock-pages"></div></div>
          <div>
            <p class="room-intro">Bu kaledeki her şey bir gün bir rafta durabilsin diye: masalımız, sohbetlerimiz, mektuplar, yüz sebep, portrelerin, notların, gökyüzümüz ve birlikte yazdıklarımız. Kitabı hazırla, sonra "Yazdır"dan PDF olarak kaydet ya da bir kırtasiyede bastır.</p>
            <div class="kb-ch">${CHAPTERS.map(([k, t]) => `<label><input type="checkbox" data-k="${k}" ${ch[k] !== false ? 'checked' : ''}> ${K.esc(t)}</label>`).join('')}</div>
            <button class="btn red big" id="kbMake">${A.icon('book')} Kitabı hazırla</button>
            <p class="muted small">${K.isOwner() ? 'Kale sahibi olarak bütün mektuplar kitaba girer (kilitliler dahil); onun kitabında sadece açtığı mektuplar olur.' : 'Mektuplardan sadece açtıkların kitaba girer; kilitli olanlar sürpriz kalır.'}</p>
          </div>
        </div>`;
      K.$('.kb-ch', el).addEventListener('change', (e) => {
        const c = chosen();
        c[e.target.dataset.k] = e.target.checked;
        K.store.set('bookChapters', c);
      });
      K.$('#kbMake', el).addEventListener('click', open);
    },
  });
})();
