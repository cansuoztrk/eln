/* Kale Paneli eklentileri (sadece kale sahibi):
   - Bulut sihirbazı: Supabase adresini ve anahtarını dener, bu telefonda açar, onun telefonu için şifreli bağlantı linki üretir
   - Ses stüdyosu: sesli notları metnini okuyarak burada kaydet ya da dosya seç; şifrelenip onun kalesine düşer
   - Gerçek zambaklar: bahçesinde her 12 zambakta bir çiçekçiden gerçek buket; sipariş ve teslim işaretleri */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  let root = null, built = false;
  const CHECKS = [
    ['baglanti', 'Projeye bağlantı ve tablo'],
    ['yazma', 'Şifreli yazma'],
    ['okuma', 'Okuma ve şifre çözme'],
    ['canli', 'Canlı güncellemeler'],
    ['silme', 'Silme'],
  ];
  const MAX_B64 = 2700000; // mühürlendikten sonra satır sınırının (4 MB) altında kalsın

  /* ---------------- Bulut sihirbazı ---------------- */
  function wizard(prefix) {
    return `<form class="pn-form" id="${prefix}Form" autocomplete="off">
        <input class="input" id="${prefix}Url" name="${prefix}Url" inputmode="url" spellcheck="false" placeholder="Project URL (https://xxxx.supabase.co)">
        <input class="input" id="${prefix}Key" name="${prefix}Key" spellcheck="false" placeholder="anon public ya da Publishable key">
        <button class="btn red small" type="submit">${A.ui('check')} Dene ve bağla</button>
      </form>
      <ul class="pn-checks" id="${prefix}Checks"></ul>
      <div class="pn-cfg-done" id="${prefix}Done" hidden>
        <div class="actions"><button class="btn small" type="button" data-cfg="here">${A.icon('key')} Bu telefonda aç</button><button class="btn soft small" type="button" data-cfg="link">${A.ui('send')} Onun telefonu için bağlantı</button></div>
        <div class="pn-link" data-out hidden></div>
      </div>`;
  }
  function bindWizard(box, prefix) {
    let cfg = null;
    K.$(`#${prefix}Form`, box).addEventListener('submit', async (e) => {
      e.preventDefault();
      const url = K.$(`#${prefix}Url`, box).value.trim().replace(/\/+$/, '');
      const key = K.$(`#${prefix}Key`, box).value.trim();
      if (!/^https:\/\/.+/.test(url) || key.length < 20) return K.fx.toast('Adres https:// ile başlamalı, anahtar da uzun bir metin olmalı.');
      const list = K.$(`#${prefix}Checks`, box);
      list.innerHTML = CHECKS.map(([k, t]) => `<li data-k="${k}" class="wait"><i></i><b>${t}</b><span>Bekleniyor...</span></li>`).join('');
      K.$(`#${prefix}Done`, box).hidden = true;
      const ok = await K.cloud.test({ url, key }, (k, pass, msg) => {
        const li = K.$(`[data-k="${k}"]`, list);
        if (!li) return;
        li.className = pass ? 'ok' : 'bad';
        K.$('span', li).textContent = msg;
      });
      K.$$('li.wait', list).forEach((li) => {
        li.className = 'skip';
        K.$('span', li).textContent = 'Denenmedi';
      });
      if (ok) {
        cfg = { url, key };
        K.$(`#${prefix}Done`, box).hidden = false;
        K.audio.sfx.success();
      } else K.audio.sfx.fail();
    });
    box.addEventListener('click', async (e) => {
      const b = e.target.closest('[data-cfg]');
      if (!b || !cfg) return;
      if (b.dataset.cfg === 'here') {
        await K.cloud.saveLocal(cfg);
        K.fx.toast('Bu telefon bağlandı. Kale yeniden açılıyor...', { icon: A.icon('key') });
        setTimeout(() => location.reload(), 1200);
      }
      if (b.dataset.cfg === 'link') {
        const link = await K.cloud.link(cfg);
        const out = K.$('[data-out]', box);
        out.hidden = false;
        out.innerHTML = `<p class="small">Bu bağlantıyı ona gönder. Şifreli: kalenin şifresini bilmeyen hiçbir şey okuyamaz. Kaleyi hangi uygulamada açıyorsa (ana ekrandaki simge ya da tarayıcı) bağlantıyı orada açmalı.</p>
          <textarea class="textarea" readonly rows="3">${K.esc(link)}</textarea>
          <div class="actions"><button class="btn small" type="button" data-copy>${A.ui('copy')} Kopyala</button></div>
          <p class="muted small">En sağlamı: Project URL ve anahtarı bana gönder, kasaya ekleyeyim; iki telefon da kendiliğinden bağlanır, link gerekmez.</p>`;
        K.$('[data-copy]', out).addEventListener('click', async () => {
          try {
            await navigator.clipboard.writeText(link);
            K.fx.toast('Kopyalandı.');
          } catch (err) {
            K.$('textarea', out).select();
          }
        });
      }
    });
  }

  /* ---------------- Ses stüdyosu ---------------- */
  function voiceState(id) {
    if ((C.voiceFiles || {})[id]) return ['kasa', 'Kasada'];
    if (K.voice && K.voice.cloud[id]) return ['bulut', 'Bulutta'];
    return ['yok', 'Henüz yok'];
  }
  function renderVoices() {
    const ul = root && K.$('#pnVoices', root);
    if (!ul) return;
    ul.innerHTML = (D.voices || [])
      .map((v) => {
        const [st, label] = voiceState(v.id);
        return `<li class="pn-v ${st}"><div><b>${K.esc(v.title)}</b><small>${K.esc(v.where || '')}${v.sure ? ` · ${K.esc(v.sure)}` : ''}</small></div><span class="pn-vst">${label}</span><button class="btn small ${st === 'yok' ? 'red' : 'soft'}" type="button" data-rec="${K.esc(v.id)}">${A.ui('mic')} ${st === 'yok' ? 'Kaydet' : 'Yeniden'}</button></li>`;
      })
      .join('');
    const n = (D.voices || []).filter((v) => voiceState(v.id)[0] !== 'yok').length;
    const c = K.$('#pnVoiceCount', root);
    if (c) c.textContent = `${n} / ${(D.voices || []).length} ses hazır`;
  }
  function pickMime() {
    const opts = ['audio/mp4;codecs=mp4a.40.2', 'audio/mp4', 'audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus'];
    return window.MediaRecorder ? opts.find((m) => MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(m)) || '' : null;
  }
  const toB64 = (blob) =>
    new Promise((res) => {
      const r = new FileReader();
      r.onload = () => res(String(r.result).split(',')[1] || '');
      r.onerror = () => res('');
      r.readAsDataURL(blob);
    });
  function studio(id) {
    const v = (D.voices || []).find((x) => x.id === id);
    if (!v) return;
    let rec = null, chunks = [], blob = null, t0 = 0, tick = null, stream = null;
    const m = K.ui.modal({
      label: 'Ses stüdyosu',
      cls: 'st-modal',
      onClose: () => {
        if (rec && rec.state === 'recording') rec.stop();
        stopAll();
      },
      html: `<div class="st">
        <p class="card-eyebrow">${K.esc(v.title)}${v.ton ? ` · ${K.esc(v.ton)}` : ''}${v.sure ? ` · ${K.esc(v.sure)}` : ''}</p>
        <div class="st-tp">${(v.text || []).map((l) => `<p>${K.esc(K.fill(l))}</p>`).join('')}</div>
        <div class="st-ctrl"><button class="btn red" type="button" data-st="rec">${A.ui('mic')} Kaydı başlat</button><button class="btn" type="button" data-st="stop" hidden>${A.ui('check')} Bitir</button><span class="st-time tnum" data-time>0:00</span></div>
        <audio data-play controls hidden></audio>
        <div class="actions"><label class="btn soft small">${A.ui('plus')} Ya da dosya seç<input type="file" accept="audio/*" data-file hidden></label><button class="btn red small" type="button" data-st="up" disabled>${A.ui('send')} Kaleye yükle</button></div>
        <p class="muted small" data-msg>Sessiz bir yer bul, telefonu ağzına bir karış uzakta tut. Metni aynen okumak zorunda değilsin; içinden geldiği gibi.</p>
      </div>`,
    });
    const box = m.el;
    const msg = (t) => (K.$('[data-msg]', box).textContent = t);
    const setBlob = (b) => {
      blob = b;
      const a = K.$('[data-play]', box);
      a.src = URL.createObjectURL(b);
      a.hidden = false;
      K.$('[data-st="up"]', box).disabled = false;
      msg(`${Math.round(b.size / 1024)} KB. Dinle; beğendiysen yükle.`);
    };
    const stopAll = () => {
      clearInterval(tick);
      if (stream) stream.getTracks().forEach((t) => t.stop());
      stream = null;
    };
    box.addEventListener('click', async (e) => {
      const b = e.target.closest('[data-st]');
      if (!b) return;
      if (b.dataset.st === 'rec') {
        const mime = pickMime();
        if (mime === null) return msg('Bu tarayıcı kayıt yapamıyor. Telefonun ses kaydedicisiyle kaydedip "dosya seç"le yükle.');
        try {
          stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
        } catch (err) {
          return msg('Mikrofon izni verilmedi. Tarayıcı ayarlarından izin verip tekrar dene.');
        }
        chunks = [];
        rec = new MediaRecorder(stream, mime ? { mimeType: mime, audioBitsPerSecond: 64000 } : { audioBitsPerSecond: 64000 });
        rec.ondataavailable = (ev) => ev.data && ev.data.size && chunks.push(ev.data);
        rec.onstop = () => {
          stopAll();
          setBlob(new Blob(chunks, { type: rec.mimeType || mime || 'audio/webm' }));
        };
        rec.start(500);
        t0 = Date.now();
        tick = setInterval(() => {
          const s = Math.floor((Date.now() - t0) / 1000);
          K.$('[data-time]', box).textContent = `${Math.floor(s / 60)}:${K.pad(s % 60)}`;
          if (s >= 240) rec.state === 'recording' && rec.stop();
        }, 250);
        b.hidden = true;
        K.$('[data-st="stop"]', box).hidden = false;
        box.classList.add('recording');
        msg('Kaydediliyor... Metin yukarıda. En fazla 4 dakika.');
      }
      if (b.dataset.st === 'stop' && rec && rec.state === 'recording') {
        rec.stop();
        b.hidden = true;
        K.$('[data-st="rec"]', box).hidden = false;
        K.$('[data-st="rec"]', box).innerHTML = `${A.ui('mic')} Yeniden kaydet`;
        box.classList.remove('recording');
      }
      if (b.dataset.st === 'up' && blob) {
        b.disabled = true;
        msg('Şifrelenip yükleniyor...');
        const b64 = await toB64(blob);
        if (!b64) return msg('Dosya okunamadı.');
        if (b64.length > MAX_B64) {
          b.disabled = false;
          return msg('Kayıt çok büyük. Biraz daha kısa kaydet ya da daha küçük bir dosya seç (yaklaşık 2 MB).');
        }
        const r = await K.cloud.add('voice', { id: v.id, mime: blob.type || 'audio/mp4', b64 });
        if (!r) {
          b.disabled = false;
          return msg('Yüklenemedi. İnterneti kontrol edip tekrar dene.');
        }
        K.audio.sfx.chime();
        K.fx.toast(`"${K.esc(v.title)}" onun kalesinde. İlk dinlediğinde sana haber gelecek.`, { icon: A.icon('mic'), duration: 5000 });
        renderVoices();
        m.close();
      }
    });
    K.$('[data-file]', box).addEventListener('change', (e) => {
      const f = e.target.files && e.target.files[0];
      if (f) setBlob(f);
    });
  }

  /* ---------------- Gerçek zambaklar ---------------- */
  async function renderReal() {
    const box = root && K.$('#pnRealBody', root);
    if (!box || !K.cloud.enabled) return;
    const f = C.florist || {};
    const [blooms, real] = await Promise.all([K.cloud.list('bloom'), K.cloud.list('realbouquet')]);
    const n = blooms.filter((r) => r.who === 'her').reduce((a, r) => Math.max(a, r.data.n || 0), 0);
    const every = f.every || 12;
    const done = real.filter((r) => r.data.status === 'teslim').length;
    const due = Math.floor(n / every) - done;
    const last = real[real.length - 1];
    box.innerHTML = `<p>Bahçesinde şu an <b>${K.num(n)}</b> zambak açtı. Her ${every} zambakta bir gerçek buket: ${due > 0 ? `<b class="pn-due">şu an ${due} buket borcun var!</b>` : `sıradaki ${K.num((Math.floor(n / every) + 1) * every)}. zambakta.`}</p>
      ${f.name ? `<p class="muted small">${K.esc(f.name)} · ${K.esc(f.hours || '')} · <a href="tel:${K.esc((f.phone || '').replace(/\s/g, ''))}">${K.esc(f.phone || '')}</a> · <a href="${K.esc(f.url)}" target="_blank" rel="noopener">Instagram</a></p>` : ''}
      ${f.bouquet ? `<p class="small"><b>Önerim:</b> ${K.esc(f.bouquet)}</p>` : ''}
      ${f.order ? `<details><summary>Sipariş mesajı (Azerbaycanca, Instagram'dan yazmak için)</summary><textarea class="textarea pn-order" readonly rows="7">${K.esc(f.order.map((l) => l.replace('{card}', f.card || '')).join('\n'))}</textarea><div class="actions"><button class="btn small" type="button" data-copy-order>${A.ui('copy')} Kopyala</button></div><p class="muted small">Adresi ve saati sen ekle. Kart yazısı Türkçe kalsın; o okusun diye.</p></details>` : ''}
      <div class="actions"><button class="btn soft small" type="button" data-real="yolda">Sipariş verdim</button><button class="btn red small" type="button" data-real="teslim">Teslim edildi</button></div>
      ${last ? `<p class="muted small">Son durum: ${last.data.status === 'teslim' ? 'teslim edildi' : 'yolda (o görmüyor, sürpriz)'} · ${T.fmt(new Date(last.at))}</p>` : ''}`;
  }

  /* ---------------- Altın Bilet ---------------- */
  async function renderPromise() {
    const box = root && K.$('#pnPromiseBody', root);
    if (!box || !K.hunt) return;
    const [opens, rows] = await Promise.all([K.cloud.list('huntopen'), K.cloud.list('promise')]);
    const opened = opens.some((r) => r.who === 'her');
    const state = (id) => (rows.filter((r) => r.who === 'me' && r.data.id === id).pop() || { data: { state: 'hazirlaniyor' } }).data.state;
    box.innerHTML = `<p class="muted small">${opened ? 'Sandığı açtı. Bu üç söz artık onun biletinde; durumlarını buradan güncelle.' : 'Hazine Avı\'nın sandığı henüz açılmadı. Açıldığında sana haber gelecek; bu üç sözü şimdiden hazırlamaya başlayabilirsin.'}</p>
      <ul class="pn-list pn-promises">${K.hunt
        .promises()
        .map((p) => `<li><b>${K.esc(p.title)}</b><small>${K.esc(K.fill(p.text))}</small><div class="kc-presets">${K.hunt
          .steps()
          .map(([k, t]) => `<button type="button" class="chip" data-promise="${K.esc(p.id)}" data-state="${k}" aria-pressed="${state(p.id) === k}">${K.esc(t)}</button>`)
          .join('')}</div></li>`)
        .join('')}</ul>`;
  }

  /* ---------------- Büyük açılış: tarih, geri sayım, hazırlık listesi ---------------- */
  function renderOpening() {
    const box = root && K.$('#pnOpenBody', root);
    if (!box) return;
    const date = C.openingDate || '';
    const left = date ? T.daysUntil(date) : null;
    const done = K.store.get('hazirlik', {});
    const list = D.hazirlik || [];
    const n = list.filter(([id]) => done[id]).length;
    box.innerHTML = `
      <div class="pn-od"><b class="tnum">${left == null ? '—' : left > 0 ? K.num(left) : left === 0 ? 'Bugün' : 'Açıldı'}</b><span>${left > 0 ? 'gün kaldı' : ''}</span></div>
      <p>${date ? `Kale ona <b>${T.fmt(date, true)}</b> verilecek.` : 'Açılış tarihi yok.'} ${date === '2026-12-06' ? 'Tanışmanızın birinci yılı; aynı sabah Kış Takvimi\'nin ilk kapısı ve "Tanışmamızın ilk yılı" sesli notu da açılıyor.' : ''}</p>
      <form class="row" id="pnOdForm"><input class="input" type="date" id="pnOdDate" name="pnOdDate" value="${K.esc(date)}" aria-label="Açılış tarihi"><button class="btn small" type="submit">${A.ui('check')} Tarihi kaydet</button><button class="btn soft small" type="button" id="pnOdPreview">${A.icon('bow')} Töreni önizle</button></form>
      <p class="card-eyebrow" style="margin-top:6px">Hazırlık listesi · ${n}/${list.length}</p>
      <ul class="pn-prep">${list.map(([id, t, d]) => `<li class="${done[id] ? 'ok' : ''}"><label><input type="checkbox" data-prep="${K.esc(id)}" ${done[id] ? 'checked' : ''}><span><b>${K.esc(t)}</b><small>${K.esc(K.fill(d))}</small></span></label></li>`).join('')}</ul>`;
    K.$('#pnOdForm', box).addEventListener('submit', async (e) => {
      e.preventDefault();
      const v = K.$('#pnOdDate', box).value;
      C.openingDate = v;
      K.store.set('openingDate', v);
      if (K.cloud.enabled) await K.cloud.add('config', { openingDate: v });
      K.fx.toast(v ? `Açılış: ${T.fmt(v)}` : 'Açılış tarihi kaldırıldı.', { icon: A.icon('bow') });
      renderOpening();
    });
    K.$('#pnOdPreview', box).addEventListener('click', () => K.acilis && K.acilis.play(null, true));
    box.addEventListener('change', (e) => {
      const c = e.target.closest('[data-prep]');
      if (!c) return;
      const d = K.store.get('hazirlik', {});
      d[c.dataset.prep] = c.checked;
      K.store.set('hazirlik', d);
      renderOpening();
    });
  }
  // Açılış tarihi buluttan ya da bu cihazdan
  K.on('built', () => {
    const local = K.store.get('openingDate');
    if (local !== null && local !== undefined) C.openingDate = local;
  });
  K.on('cloud', async (on) => {
    if (!on) return;
    const rows = (await K.cloud.list('config')).filter((r) => 'openingDate' in r.data);
    if (rows.length) C.openingDate = rows[rows.length - 1].data.openingDate;
    K.cloud.on('config', (r) => 'openingDate' in r.data && (C.openingDate = r.data.openingDate));
    K.cloud.on('opened', (r) => K.isOwner() && r.who === 'her' && K.fx.toast(`<b>${K.esc(C.herPet)} kurdeleyi kesti!</b> Kale onun artık.`, { icon: A.icon('bow'), duration: 10000 }));
  });

  /* ---------------- Biniş Kartı: bilet alınınca uçuşu gir ---------------- */
  function renderFlight() {
    const box = root && K.$('#pnFlightBody', root);
    if (!box || !K.bilet) return;
    const f = K.bilet.get() || {};
    const v = (k) => K.esc(f[k] || '');
    box.innerHTML = `<p class="muted small">${f.date ? `Şu an: <b>${T.fmt(f.date, true)}</b>, ${v('dep')} kalkış. Kart onun kalesinde; ilk açışta zarftan çıkar. Değiştirmek için aşağıyı düzenleyip yeniden gönder.` : 'Kumbara dolup bileti aldığında uçuşu buraya gir. Onun kalesine zarf içinde bir biniş kartı düşer; uçuş günü uçak haritada gerçek saate göre ilerler. İlk Sarılma geri sayımı da bu tarihe ayarlanır.'}</p>
      <form class="pn-fl" id="pnFlForm" autocomplete="off">
        <label><span>Uçuş günü</span><input class="input" type="date" name="date" value="${v('date')}" required></label>
        <label><span>Kalkış (İstanbul)</span><input class="input" type="time" name="dep" value="${v('dep')}" required></label>
        <label><span>Varış (Bakü)</span><input class="input" type="time" name="arr" value="${v('arr')}" required></label>
        <label><span>Havalimanı</span><select class="input" name="from"><option value="IST" ${f.from !== 'SAW' ? 'selected' : ''}>İstanbul (IST)</option><option value="SAW" ${f.from === 'SAW' ? 'selected' : ''}>Sabiha Gökçen (SAW)</option></select></label>
        <label><span>Uçuş no</span><input class="input" name="no" maxlength="12" placeholder="TK 332" value="${v('no')}"></label>
        <label><span>Koltuk</span><input class="input" name="seat" maxlength="6" placeholder="7A" value="${v('seat')}"></label>
        <label><span>Dönüş günü</span><input class="input" type="date" name="back" value="${v('back')}"></label>
        <label class="wide"><span>Karta bir not</span><input class="input" name="note" maxlength="140" placeholder="Cam kenarı aldım; Hazar'ı ilk ben göreceğim." value="${v('note')}"></label>
        <div class="actions wide"><button class="btn red small" type="submit">${A.icon('plane')} Kartı gönder</button><button class="btn soft small" type="button" data-fl="preview">Zarfı önizle</button>${f.date ? '<button class="btn soft small" type="button" data-fl="cancel">Kartı geri al</button>' : ''}</div>
      </form>`;
    const form = K.$('#pnFlForm', box);
    const data = () => Object.fromEntries(Array.from(new FormData(form).entries()).map(([k, x]) => [k, String(x).trim()]));
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const d = data();
      if (!d.date || !d.dep || !d.arr) return K.fx.toast('Gün, kalkış ve varış saati gerekli.');
      if (d.back && d.back < d.date) return K.fx.toast('Dönüş günü uçuştan önce olamaz.');
      const r = await K.cloud.add('flight', d);
      if (!r) return K.fx.toast('Gönderilemedi. İnterneti kontrol et.');
      await K.cloud.add('config', { firstMeetDate: d.date });
      C.firstMeetDate = d.date;
      K.fx.confetti({ count: 120, shapes: ['heart', 'star'] });
      K.fx.toast(`<b>Biniş kartı gönderildi.</b> ${T.fmt(d.date)}. İlk Sarılma geri sayımı da bu güne kuruldu.`, { icon: A.icon('plane'), duration: 8000 });
      setTimeout(renderFlight, 300);
    });
    box.addEventListener('click', async (e) => {
      const b = e.target.closest('[data-fl]');
      if (!b) return;
      if (b.dataset.fl === 'preview') {
        const d = data();
        return K.bilet.reveal(Object.assign({ id: 'onizleme', date: d.date || T.todayKey(), dep: d.dep || '09:40', arr: d.arr || '13:25' }, d.date ? d : {}), true);
      }
      if (b.dataset.armed !== '1') {
        b.dataset.armed = '1';
        b.textContent = 'Emin misin? Bir daha dokun';
        return;
      }
      await K.cloud.add('flight', { date: '' });
      await K.cloud.add('config', { firstMeetDate: '' });
      C.firstMeetDate = '';
      K.fx.toast('Kart geri alındı. Onun kalesinden kalktı.');
      setTimeout(renderFlight, 300);
    });
  }

  /* ---------------- Panele yerleştir ---------------- */
  K.on('room', async ({ id, el }) => {
    if (id !== 'panel' || !K.isOwner()) return;
    root = el;
    if (!built) {
      built = true;
      const off = K.$('#pnOff', el);
      off.innerHTML = `<p class="card-eyebrow">Ortak kaleyi bağla</p>
        <p>Bulut henüz bağlı değil. Supabase projeni açıp kurulum kodunu çalıştırdıysan, adresini ve anahtarını buraya yapıştır. Kale her şeyi tek tek dener, sonra bağlar.</p>
        ${wizard('pnCfg')}`;
      bindWizard(off, 'pnCfg');
      const main = K.$('#pnMain', el);
      main.insertAdjacentHTML('afterbegin', `<section class="card pn-sec pn-open" id="pnOpenDay"><p class="card-eyebrow">Büyük açılış</p><div id="pnOpenBody"></div></section>`);
      renderOpening();
      main.insertAdjacentHTML(
        'beforeend',
        `<section class="card pn-sec" id="pnVoice"><p class="card-eyebrow">Ses stüdyosu</p>
          <p class="muted small">Sesli notların metinleri burada. Birine dokun, metni okuyarak kaydet (ya da telefonundaki bir ses dosyasını seç). Şifrelenip onun kalesine düşer; o dinleyince sana haber gelir. <b id="pnVoiceCount"></b></p>
          <ul class="pn-voices" id="pnVoices"></ul></section>
        <section class="card pn-sec" id="pnReal"><p class="card-eyebrow">Gerçek zambaklar</p><div id="pnRealBody"></div></section>
        <section class="card pn-sec" id="pnPromise"><p class="card-eyebrow">Altın Bilet</p><div id="pnPromiseBody"></div></section>
        <section class="card pn-sec" id="pnKumbara"><p class="card-eyebrow">Bilet Kumbarası</p>
          <p class="muted small">Hedef (bir gidiş-dönüş bilet ve biraz fazlası) ve AZN kuru. Kumbara TL üzerinden sayar.</p>
          <form class="row" id="pnKbForm" autocomplete="off"><input class="input" id="pnKbTarget" name="pnKbTarget" type="number" min="100" step="50" placeholder="Hedef TL" aria-label="Hedef"><input class="input" id="pnKbRate" name="pnKbRate" type="number" min="1" step="0.1" placeholder="1 AZN = ? TL" aria-label="AZN kuru"><button class="btn small" type="submit">${A.ui('check')} Kaydet</button></form></section>
        <section class="card pn-sec pn-flight" id="pnFlight"><p class="card-eyebrow">Biniş Kartı</p><div id="pnFlightBody"></div></section>
        <section class="card pn-sec" id="pnCloud"><p class="card-eyebrow">Bulut bağlantısı</p>
          <p class="muted small">${C.cloud && C.cloud.url ? 'Ayarlar kasada kayıtlı; iki telefon da kendiliğinden bağlanıyor.' : 'Bu telefon bağlı. Onun telefonu henüz bağlı değilse aynı bilgilerle bir bağlantı linki üret.'}</p>
          <details><summary>Yeniden dene / bağlantı linki üret</summary>${wizard('pnCfg2')}</details></section>`
      );
      bindWizard(K.$('#pnCloud', main), 'pnCfg2');
      const kbf = K.$('#pnKbForm', main);
      if (K.kumbara) {
        const c = K.kumbara.cfg();
        K.$('#pnKbTarget', main).value = c.target;
        K.$('#pnKbRate', main).value = c.azn;
      }
      kbf.addEventListener('submit', async (e) => {
        e.preventDefault();
        const target = Math.round(+K.$('#pnKbTarget', main).value);
        const azn = +K.$('#pnKbRate', main).value;
        if (!(target > 0) || !(azn > 0)) return K.fx.toast('Hedef ve kur sıfırdan büyük olmalı.');
        await K.cloud.add('kumbaracfg', { target, azn });
        K.fx.toast(`Kumbara hedefi ${K.num(target)} TL.`, { icon: A.icon('jar') });
      });
      main.addEventListener('click', async (e) => {
        const r = e.target.closest('[data-rec]');
        if (r) studio(r.dataset.rec);
        if (e.target.closest('[data-copy-order]')) {
          const ta = K.$('.pn-order', main);
          try {
            await navigator.clipboard.writeText(ta.value);
            K.fx.toast('Kopyalandı.');
          } catch (err) {
            ta.select();
          }
        }
        const pr = e.target.closest('[data-promise]');
        if (pr) {
          await K.cloud.add('promise', { id: pr.dataset.promise, state: pr.dataset.state });
          K.fx.toast('Güncellendi. Onun biletinde de değişti.', { icon: A.icon('key') });
          renderPromise();
        }
        const rb = e.target.closest('[data-real]');
        if (rb) {
          const status = rb.dataset.real;
          let note = '';
          if (status === 'teslim') note = (window.prompt('Buketin kartına ne yazdın? (Bahçesinde altın bir zambak olarak duracak)', 'Bu zambaklar gerçek.') || '').trim();
          await K.cloud.add('realbouquet', { status, note });
          K.fx.toast(status === 'teslim' ? 'Bahçesine altın bir zambak dikildi.' : 'Not edildi. O görmüyor; sürpriz bozulmadı.', { icon: A.icon('lily') });
          renderReal();
        }
      });
    }
    if (await K.cloud.ready) {
      renderVoices();
      renderReal();
      renderPromise();
      renderFlight();
    }
  });
  K.on('cloud-voice', renderVoices);
  K.on('cloud', (on) => {
    if (!on || !K.isOwner()) return;
    const again = () => K.activeRoom === 'panel' && renderReal();
    K.cloud.on('bloom', (r) => {
      again();
      const f = C.florist;
      if (r.who === 'her' && f && r.data.n % (f.every || 12) === 0) K.fx.toast(`<b>Bahçesinde ${r.data.n}. zambak açtı!</b> Gerçek buketin zamanı: ${K.esc(f.name)}`, { icon: A.icon('lily'), duration: 8000 });
    });
    K.cloud.on('realbouquet', again);
  });
})();
