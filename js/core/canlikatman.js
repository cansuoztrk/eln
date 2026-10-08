/* Canlı Katman (Faz 30): kasada config.canliUrl ve config.canliKey varsa, anlık olaylar (K.cloud.send / onLive) Cloudflare'deki
   Durable Object odasından geçer: daha az gecikme, Supabase'in yayın sınırlarından bağımsız. Mesajlar yine kasanın
   anahtarıyla mühürlenir. Bağlantı koparsa kendiliğinden yeniden dener; o sırada gönderilenler eskisi gibi Supabase'den
   gider. Kurulmadıysa bu modül hiçbir şeyi değiştirmez. Worker: workers/canli/ */
(function () {
  'use strict';
  const K = window.K;
  const D = window.ELN;
  const C = D.config;

  let ws = null, acik = false, deneme = 0, nabiz = null, kimler = [];
  const mine = () => (K.isOwner() ? 'me' : 'her');

  function baglan() {
    if (!C.canliUrl || !C.canliKey || !K.cloud || !K.cloud.enabled || ws) return;
    const space = (C.cloud && C.cloud.space) || 'kale';
    const url = `${C.canliUrl.replace(/\/$/, '')}/oda/${encodeURIComponent(space)}?k=${encodeURIComponent(C.canliKey)}&who=${mine()}`;
    try {
      ws = new WebSocket(url);
    } catch (e) {
      ws = null;
      return;
    }
    ws.onopen = () => {
      acik = true;
      deneme = 0;
      clearInterval(nabiz);
      nabiz = setInterval(() => acik && ws.send('ping'), 25000);
      K.emit && K.emit('canliKatman', true);
    };
    ws.onmessage = async (ev) => {
      if (ev.data === 'pong') return;
      let m;
      try {
        m = JSON.parse(ev.data);
      } catch (e) {
        return;
      }
      if (m.t === 'varlik') return (kimler = m.kimler || []);
      if (m.d) {
        const msg = await K.vault.unseal(m.d);
        msg && K.cloud._canliAl && K.cloud._canliAl(msg);
      }
    };
    ws.onclose = () => {
      acik = false;
      ws = null;
      clearInterval(nabiz);
      K.emit && K.emit('canliKatman', false);
      setTimeout(baglan, Math.min(30000, 1500 * 2 ** deneme++));
    };
    ws.onerror = () => {};
  }
  function sar() {
    if (!K.cloud || K.cloud._canliSarildi) return;
    K.cloud._canliSarildi = true;
    const send0 = K.cloud.send;
    K.cloud.send = async (e, payload) => {
      // Yalnız öbürü de bu katmana bağlıysa buradan; değilse eskisi gibi Supabase (mesaj kaçmasın)
      if (acik && ws && ws.readyState === 1 && kimler.includes(mine() === 'me' ? 'her' : 'me')) {
        try {
          const msg = Object.assign({ e, who: mine(), t: Date.now() }, payload);
          ws.send(JSON.stringify({ d: await K.vault.seal(msg) }));
          return;
        } catch (err) {}
      }
      return send0(e, payload);
    };
  }
  K.on('cloud', (ok) => {
    if (!ok || !C.canliUrl) return;
    sar();
    baglan();
  });
  document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && !ws && baglan());
  K.canliKatman = { acik: () => acik, kimler: () => kimler };
})();
