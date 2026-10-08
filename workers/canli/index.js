// Kalenin canlı katmanı — Cloudflare Worker + Durable Object. El ele, birlikte nefes, oyunlar ve ada gibi anlık olaylar
// Supabase'in yayın kanalı yerine buradan geçer: daha az gecikme, Supabase sınırlarından bağımsız. Her "alan" (space)
// için tek bir Durable Object odası vardır; oda gelen mesajı öbür bağlantılara aynen iletir. Mesajlar istemcide kasanın
// anahtarıyla mühürlenir; bu katman içeriği göremez, yalnız taşır. Varlık (kim bağlı) da buradan yayılır.
// Bağlantı: wss://<worker>/oda/<space>?k=<CANLI_KEY>&who=me|her · Gizli: CANLI_KEY (wrangler secret put CANLI_KEY)
const esit = (a, b) => {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const m = url.pathname.match(/^\/oda\/([a-z0-9-]{1,40})$/);
    if (!m) return new Response('kale canli katmani', { status: 200 });
    if (!env.CANLI_KEY || !esit(url.searchParams.get('k') || '', env.CANLI_KEY)) return new Response('yetkisiz', { status: 401 });
    if (request.headers.get('Upgrade') !== 'websocket') return new Response('websocket bekleniyor', { status: 426 });
    const id = env.ODA.idFromName(m[1]);
    return env.ODA.get(id).fetch(request);
  },
};

export class Oda {
  constructor(state) {
    this.state = state;
  }
  async fetch(request) {
    const who = new URL(request.url).searchParams.get('who') === 'me' ? 'me' : 'her';
    const [istemci, sunucu] = Object.values(new WebSocketPair());
    // Hazırda bekletme (hibernation): bağlantı açıkken oda uyuyabilir, ücretlendirme yalnız mesajda
    this.state.acceptWebSocket(sunucu, [who]);
    this.varlik();
    return new Response(null, { status: 101, webSocket: istemci });
  }
  kimler() {
    return [...new Set(this.state.getWebSockets().flatMap((ws) => this.state.getTags(ws)))];
  }
  varlik() {
    const v = JSON.stringify({ t: 'varlik', kimler: this.kimler() });
    this.state.getWebSockets().forEach((ws) => {
      try {
        ws.send(v);
      } catch (e) {}
    });
  }
  async webSocketMessage(ws, mesaj) {
    if (typeof mesaj !== 'string' || mesaj.length > 256 * 1024) return;
    if (mesaj === 'ping') return ws.send('pong');
    this.state.getWebSockets().forEach((o) => {
      if (o === ws) return;
      try {
        o.send(mesaj);
      } catch (e) {}
    });
  }
  async webSocketClose(ws) {
    try {
      ws.close();
    } catch (e) {}
    this.varlik();
  }
  async webSocketError() {
    this.varlik();
  }
}
