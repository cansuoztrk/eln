/* Kale 2.0 — ortak ses kaydı: MediaRecorder ile kısa kayıt, buluta yükleme (tsses {b64, mime}) ve çalmak için adres.
   Telesekreter kendi makinesini kullanır; Sesimle Uyan ve Biz FM bunu kullanır. */
(function () {
  'use strict';
  const K = window.K;
  const urls = {};

  async function start(max, onTick) {
    const mime = window.MediaRecorder ? ['audio/mp4;codecs=mp4a.40.2', 'audio/mp4', 'audio/webm;codecs=opus', 'audio/webm'].find((x) => MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(x)) || '' : null;
    if (mime === null || !navigator.mediaDevices) return K.fx.toast('Bu cihaz ses kaydını desteklemiyor.'), null;
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    } catch (e) {
      return K.fx.toast('Mikrofon izni verilmedi. Tarayıcı ayarlarından izin verip tekrar dene.'), null;
    }
    K.audio.music && K.audio.music.on && K.audio.music.stop(false);
    const chunks = [];
    const r = new MediaRecorder(stream, mime ? { mimeType: mime, audioBitsPerSecond: 48000 } : { audioBitsPerSecond: 48000 });
    const t0 = Date.now();
    let tm = 0;
    const done = new Promise((res) => {
      r.ondataavailable = (ev) => ev.data.size && chunks.push(ev.data);
      r.onstop = () => {
        clearInterval(tm);
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunks, { type: r.mimeType || mime || 'audio/webm' });
        res({ blob, dur: Math.max(1, Math.round((Date.now() - t0) / 100) / 10), url: URL.createObjectURL(blob) });
      };
    });
    r.start();
    tm = setInterval(() => {
      const s = (Date.now() - t0) / 1000;
      onTick && onTick(s);
      if (s >= max && r.state === 'recording') r.stop();
    }, 250);
    return { stop: () => r.state === 'recording' && r.stop(), done };
  }
  async function upload(blob) {
    const b64 = await new Promise((res) => {
      const fr = new FileReader();
      fr.onload = () => res(String(fr.result).split(';base64,')[1] || '');
      fr.onerror = () => res('');
      fr.readAsDataURL(blob);
    });
    if (!b64 || b64.length > 3.2e6) return null;
    return K.cloud.add('tsses', { b64, mime: blob.type || 'audio/webm' });
  }
  async function url(id) {
    if (urls[id]) return urls[id];
    const h = await K.cloud.get(id);
    if (!h || !h.data || !h.data.b64) return null;
    const bin = atob(h.data.b64);
    const u8 = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
    return (urls[id] = URL.createObjectURL(new Blob([u8], { type: h.data.mime || 'audio/mp4' })));
  }
  K.mikrofon = { start, upload, url };
})();
