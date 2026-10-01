/* Oda (sadece kale sahibi): Panel — sitedeki her şeyi kod yazmadan canlı güncelle:
   mektup gönder, soruyu cevapla, günün notunu yaz, fotoğraf as, ilk buluşma tarihini belirle, onun hareketlerini gör */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  let root;
  const COLORS = ['#FFD6E5', '#D6F1FF', '#FFF3C4', '#E6DCFF', '#D8F5E8', '#FFE0E0'];
  const KIND_TEXT = { answer: 'soruyu cevapladı', page: 'deftere yazdı', live: 'telsizden yazdı', hug: 'birlikte sarıldınız', drawing: 'tahtada çizdi', round: 'tahtada oynadı', pigeon: 'güvercin uçurdu', classes: 'ders programını güncelledi' };
  const CLASS_MODES = [['on', 'Dersler devam ediyor'], ['off', 'Tatildeyim'], ['sinav', 'Sınav haftası']];

  function sec(id, title, sub, body) {
    return `<section class="card pn-sec" id="${id}"><p class="card-eyebrow">${title}</p>${sub ? `<p class="muted small">${sub}</p>` : ''}${body}</section>`;
  }

  async function renderLists() {
    const [letters, notes, photos, answers, cfg] = await Promise.all(['letter', 'note', 'photo', 'answer', 'config'].map((k) => K.cloud.list(k)));
    K.$('#pnLetters', root).innerHTML = letters.length
      ? letters
          .slice()
          .reverse()
          .map((r) => `<li><b>${K.esc(r.data.title)}</b><small>${T.fmt(T.key(T.baku(new Date(r.at))))}${r.data.open ? ` · ${T.fmt(r.data.open)}'da açılır` : ''}</small><button class="wn-x" data-del="${r.id}" aria-label="Sil">${A.ui('close')}</button></li>`)
          .join('')
      : '<li class="muted small">Henüz canlı mektup yok.</li>';
    K.$('#pnNotes', root).innerHTML = notes
      .filter((r) => T.daysUntil(r.data.date) >= 0)
      .map((r) => `<li><b>${T.fmt(r.data.date)}</b><span>${K.esc(r.data.text)}</span><button class="wn-x" data-del="${r.id}" aria-label="Sil">${A.ui('close')}</button></li>`)
      .join('');
    K.$('#pnPhotos', root).innerHTML = photos.map((r) => `<figure><img src="${r.data.img}" alt=""><figcaption>${K.esc(r.data.caption || '')}</figcaption><button class="wn-x" data-del="${r.id}" aria-label="Sil">${A.ui('close')}</button></figure>`).join('');
    const q = K.questions.today();
    const mine = answers.filter((r) => r.who === 'me');
    const hers = answers.filter((r) => r.who === 'her');
    const myToday = mine.find((r) => r.data.i === q.i);
    K.$('#pnQ', root).innerHTML = `<h3 class="pn-q">${K.esc(q.text)}</h3>
      ${myToday ? `<p class="hand pn-a">"${K.esc(myToday.data.a)}"</p>` : `<form class="row" id="pnQForm" autocomplete="off"><input class="input" id="pnQAns" name="pnQAns" maxlength="400" placeholder="Senin cevabın"><button class="btn small" type="submit">${A.ui('send')} Cevapla</button></form>`}
      <p class="muted small">Onun cevabı: ${(() => {
        const h = hers.find((r) => r.data.i === q.i);
        return h ? `<b>"${K.esc(h.data.a)}"</b>` : 'henüz yok';
      })()}</p>
      <details><summary>Onun bütün cevapları (${hers.length})</summary><ul class="pn-list">${hers
        .slice()
        .reverse()
        .map((r) => `<li><small>${K.esc(K.fill(D.questions[r.data.i] || ''))}</small><span class="hand">${K.esc(r.data.a)}</span></li>`)
        .join('')}</ul></details>`;
    const f = K.$('#pnQForm', root);
    f &&
      f.addEventListener('submit', async (e) => {
        e.preventDefault();
        const a = K.$('#pnQAns', root).value.trim();
        if (!a) return;
        await K.cloud.add('answer', { i: q.i, a });
        K.fx.toast('Cevabın kaleye yazıldı; o cevaplayınca yan yana görünecek.', { icon: A.icon('question') });
        renderLists();
      });
    const last = cfg.filter((r) => 'firstMeetDate' in r.data).pop();
    K.$('#pnMeetNow', root).textContent = last && last.data.firstMeetDate ? `Şu an: ${T.fmt(last.data.firstMeetDate)}` : 'Şu an: tarih yok (o kendi hayal tarihini seçebiliyor)';
    const mode = (cfg.filter((r) => 'classMode' in r.data).pop() || { data: { classMode: 'on' } }).data.classMode;
    const cm = K.$('#pnClassModes', root);
    cm && K.$$('[data-cm]', cm).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.cm === mode)));
    // Onun son hareketleri
    const feedKinds = ['answer', 'page', 'live', 'hug', 'round', 'pigeon', 'classes'];
    const all = (await Promise.all(feedKinds.map((k) => K.cloud.list(k, 60)))).flat().filter((r) => r.who === 'her');
    all.sort((a, b) => b.at - a.at);
    K.$('#pnFeed', root).innerHTML = all.length
      ? all
          .slice(0, 25)
          .map((r) => {
            const p = T.baku(new Date(r.at));
            const detail = r.kind === 'answer' ? r.data.a : r.kind === 'page' ? r.data.text : r.kind === 'live' ? r.data.text : '';
            return `<li><small>${p.d} ${K.MONTHS[p.mo - 1].slice(0, 3)} ${K.pad(p.h)}:${K.pad(p.mi)}</small><b>${K.esc(C.herPet)} ${KIND_TEXT[r.kind] || r.kind}</b>${detail ? `<span>${K.esc(String(detail).slice(0, 160))}</span>` : ''}</li>`;
          })
          .join('')
      : '<li class="muted small">Henüz bir hareket yok. O kaleye geldikçe burada görünecek.</li>';
  }

  function resize(file) {
    return new Promise((res) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const max = 1400;
        const k = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * k);
        c.height = Math.round(img.height * k);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        res(c.toDataURL('image/jpeg', 0.84));
      };
      img.onerror = () => res(null);
      img.src = url;
    });
  }

  function bind(el) {
    let color = COLORS[0];
    K.$('#pnColors', el).addEventListener('click', (e) => {
      const b = e.target.closest('[data-c]');
      if (!b) return;
      color = b.dataset.c;
      K.$$('#pnColors .nw-sw', el).forEach((x) => x.classList.toggle('on', x === b));
    });
    K.$('#pnPostForm', el).addEventListener('submit', async (e) => {
      e.preventDefault();
      const title = K.$('#pnTitle', el).value.trim();
      const text = K.$('#pnBody', el).value.trim();
      if (!title || !text) return K.fx.toast('Başlık ve mektup gerekli.');
      const open = K.$('#pnOpen', el).value;
      const body = text.split(/\n\s*\n/).map((x) => x.replace(/\n/g, ' ').trim()).filter(Boolean);
      const r = await K.cloud.add('letter', { title, body, sign: K.$('#pnSign', el).value.trim() || C.myPet, color, open: open || '' });
      if (!r) return K.fx.toast('Gönderilemedi. İnternet ya da bulut ayarını kontrol et.');
      K.$('#pnTitle', el).value = '';
      K.$('#pnBody', el).value = '';
      K.$('#pnOpen', el).value = '';
      K.audio.sfx.chime();
      K.fx.confetti({ count: 60 });
      K.fx.toast(open ? `Mektup ${T.fmt(open)}'da açılmak üzere postalandı.` : 'Mektup postalandı. Kaledeyse şu an ekranına düştü.', { icon: A.icon('letter') });
      K.pingHer(`💌 ${K.ek(C.myPet, 'den')} mektup var`, open ? `"${title}" · ${T.fmt(open)} günü açılacak` : `"${title}" · Mektuplar odasında seni bekliyor`, ['love_letter'], { click: K.roomUrl('mektuplar') });
      renderLists();
    });
    K.$('#pnNoteForm', el).addEventListener('submit', async (e) => {
      e.preventDefault();
      const date = K.$('#pnNoteDate', el).value;
      const text = K.$('#pnNoteText', el).value.trim();
      if (!date || !text) return;
      await K.cloud.add('note', { date, text });
      K.$('#pnNoteText', el).value = '';
      K.fx.toast(`${T.fmt(date)} günün notu hazır.`, { icon: A.icon('note') });
      renderLists();
    });
    K.$('#pnPhotoInput', el).addEventListener('change', async (e) => {
      const files = [...e.target.files].slice(0, 6);
      e.target.value = '';
      const cap = K.$('#pnPhotoCap', el).value.trim();
      for (const f of files) {
        const img = await resize(f);
        if (img) await K.cloud.add('photo', { img, caption: cap || f.name.replace(/\.[^.]+$/, '').slice(0, 40), date: T.todayKey() });
      }
      K.$('#pnPhotoCap', el).value = '';
      K.fx.toast('Fotoğraflar Anı Duvarı\'na asıldı.', { icon: A.icon('camera') });
      renderLists();
    });
    K.$('#pnMeetForm', el).addEventListener('submit', async (e) => {
      e.preventDefault();
      const v = K.$('#pnMeet', el).value;
      await K.cloud.add('config', { firstMeetDate: v || '' });
      K.fx.toast(v ? `İlk buluşma: ${T.fmt(v)}. Geri sayım başladı.` : 'Tarih kaldırıldı.', { icon: A.icon('hugs') });
      renderLists();
    });
    K.$('#pnLilyForm', el).addEventListener('submit', async (e) => {
      e.preventDefault();
      const n = +K.$('#pnLilyN', el).value;
      const r = await K.sendBouquet(n, K.$('#pnLilyNote', el).value.trim());
      if (!r) return K.fx.toast('Gönderilemedi. Bulut bağlı mı?');
      K.$('#pnLilyNote', el).value = '';
      K.fx.rain({ count: 30, colors: ['#FF8FB8', '#FFD0E1', '#FFFFFF'] });
      K.fx.toast(`${n} zambak yola çıktı.`, { icon: A.icon('lily') });
    });
    K.$('#pnClassModes', el).addEventListener('click', async (e) => {
      const b = e.target.closest('[data-cm]');
      if (!b) return;
      await K.cloud.add('config', { classMode: b.dataset.cm });
      K.$$('[data-cm]', el).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      K.fx.toast(`Ders durumu: ${b.textContent}`, { icon: A.icon('week') });
    });
    el.addEventListener('click', async (e) => {
      const d = e.target.closest('[data-del]');
      if (!d) return;
      if (d.dataset.armed !== '1') {
        d.dataset.armed = '1';
        d.classList.add('armed');
        d.title = 'Silmek için tekrar bas';
        return;
      }
      await K.cloud.remove(d.dataset.del);
      renderLists();
    });
  }

  K.room({
    id: 'panel',
    wing: 'sahip',
    title: 'Kale Paneli',
    sub: 'Canlı posta, cevaplar, ayarlar',
    icon: 'key',
    color: '#E6DCFF',
    hidden: () => !K.isOwner(),
    init(el) {
      root = el;
      const tomorrow = T.key(T.baku(new Date(T.now().getTime() + 864e5)));
      el.innerHTML = `
        <p class="room-intro">Bu oda sadece senin şifrenle görünüyor. Buradan yaptığın her şey anında onun kalesine düşer; kod yazmana, bana sormana gerek yok. Her şey şifrelenerek gönderilir.</p>
        <div class="pn-off card" id="pnOff" hidden><b>Bulut henüz bağlı değil.</b><p class="muted small">Supabase adresi ve anahtarı kasaya eklenince bu panel çalışmaya başlar.</p></div>
        <div class="pn" id="pnMain">
          ${sec('pnPost', 'Canlı posta', 'Yazdığın mektup onun Mektuplar odasına düşer. Tarih seçersen o güne kadar mühürlü kalır. Paragrafları boş satırla ayır.', `
            <form class="pn-form" id="pnPostForm" autocomplete="off">
              <input class="input" id="pnTitle" name="pnTitle" maxlength="60" placeholder="Zarfın üstüne yazılacak (ör. Sınavdan sonra aç)">
              <textarea class="textarea hand-area" id="pnBody" name="pnBody" placeholder="Sevgili ${K.esc(C.herPet)}..."></textarea>
              <div class="row"><input class="input" id="pnSign" name="pnSign" maxlength="60" placeholder="İmza (ör. Seni özleyen ${K.esc(C.myPet)})"><input class="input" type="date" id="pnOpen" name="pnOpen" min="${T.todayKey()}" aria-label="Açılış tarihi (isteğe bağlı)"></div>
              <div class="nw-colors" id="pnColors">${COLORS.map((c, i) => `<button type="button" class="nw-sw ${i ? '' : 'on'}" data-c="${c}" style="--c:${c}" aria-label="Zarf rengi"></button>`).join('')}</div>
              <button class="btn red" type="submit">${A.icon('letter')} Postala</button>
            </form>
            <ul class="pn-list" id="pnLetters"></ul>`)}
          ${sec('pnQs', 'Günün sorusu', 'Sen de cevapla; o cevapladıktan sonra ikiniz de ötekinin cevabını görürsünüz.', '<div id="pnQ"></div>')}
          ${sec('pnNote', 'Günün notu', 'Seçtiğin gün ana salondaki "Günün notu" senin yazdığın olur.', `
            <form class="pn-form" id="pnNoteForm" autocomplete="off"><div class="row"><input class="input" type="date" id="pnNoteDate" name="pnNoteDate" value="${tomorrow}" min="${T.todayKey()}"></div><textarea class="textarea" id="pnNoteText" name="pnNoteText" rows="2" maxlength="300" placeholder="O günün notu"></textarea><button class="btn small" type="submit">${A.ui('check')} Kaydet</button></form>
            <ul class="pn-list" id="pnNotes"></ul>`)}
          ${sec('pnPhoto', 'Anı Duvarı\'na fotoğraf', 'Fotoğraf şifrelenip gönderilir, onun Anı Duvarı\'nda "Fotoğraflarımız" ipine asılır.', `
            <div class="row"><input class="input" id="pnPhotoCap" name="pnPhotoCap" maxlength="60" placeholder="Altyazı"><label class="btn small" for="pnPhotoInput">${A.ui('image')} Fotoğraf seç</label><input type="file" id="pnPhotoInput" accept="image/*" multiple hidden></div>
            <div class="pn-photos" id="pnPhotos"></div>`)}
          ${sec('pnMeet', 'İlk buluşma tarihi', 'Belli olduğunda buraya yaz: İlk Sarılma odasında gerçek geri sayım başlar, o gün kale kutlamaya döner.', `
            <form class="row" id="pnMeetForm"><input class="input" type="date" id="pnMeet" name="pnMeet" min="${T.todayKey()}"><button class="btn small" type="submit">${A.ui('check')} Kaydet</button></form><p class="muted small" id="pnMeetNow"></p>`)}
          ${sec('pnLily', 'Zambak gönder', 'Onun çiçeği zambak. Gönderdiğin zambaklar Zambak Bahçesi\'ndeki vazoya düşer; kaledeyse ekranına çiçek yağar.', `
            <form class="pn-form" id="pnLilyForm" autocomplete="off"><div class="row"><select class="input" id="pnLilyN" name="pnLilyN" aria-label="Kaç zambak">${[1, 3, 7, 12, 21].map((n) => `<option value="${n}" ${n === 7 ? 'selected' : ''}>${n} zambak</option>`).join('')}</select><input class="input" id="pnLilyNote" name="pnLilyNote" maxlength="200" placeholder="Kartın üstüne (isteğe bağlı)"></div><button class="btn red small" type="submit">${A.icon('lily')} Gönder</button></form>`)}
          ${sec('pnClass', 'Ders durumun', 'İki Takvim ve ana salondaki "Ardoş şu an..." bilgisi buna göre değişir. Resmî tatillerde kendiliğinden "tatilde" görünür.', `
            <div class="kc-presets" id="pnClassModes">${CLASS_MODES.map(([k, t]) => `<button type="button" class="chip" data-cm="${k}" aria-pressed="${k === 'on'}">${t}</button>`).join('')}</div>`)}
          ${sec('pnAct', 'Onun son hareketleri', 'Buluta düşen cevaplar, defter sayfaları, telsiz mesajları.', '<ul class="pn-feed" id="pnFeed"></ul>')}
        </div>`;
      bind(el);
    },
    async enter() {
      const on = await K.cloud.ready;
      K.$('#pnOff', root).hidden = on;
      K.$('#pnMain', root).hidden = !on;
      if (on) renderLists();
    },
  });
})();
