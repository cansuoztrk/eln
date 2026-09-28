/* Eln'in Krallığı — bulut: iki kişinin ortak kalesi (Supabase). Her kayıt ve her canlı mesaj kasa anahtarıyla
   şifrelenip gönderilir; sunucu sadece anlamsız metin görür. Bulut ayarı yoksa bu katman sessizce kapalı kalır.
   Test için ?bulut=deneme: aynı tarayıcıdaki sekmeler arasında çalışan sahte bir bulut. */
(function () {
  'use strict';
  const K = window.K;
  const C = window.ELN.config;

  const subs = {};
  const live = {};
  // Her kayıt bir kez yayılır: kendi eklediğimiz hemen, sunucudan geri döndüğünde tekrar sayılmaz
  const seenRows = new Set();
  const emitRow = (row) => {
    if (!row || seenRows.has(row.id)) return;
    seenRows.add(row.id);
    emit(subs, row.kind, row);
  };
  let adapter = null;
  let presenceFn = [];
  let readyResolve;
  const ready = new Promise((r) => (readyResolve = r));

  const emit = (map, key, v) => (map[key] || []).concat(map['*'] || []).forEach((fn) => fn(v));
  const who = () => (K.vault && K.vault.who) || 'her';

  async function decodeRow(r) {
    const data = await K.vault.unseal(r.data);
    if (!data) return null;
    return { id: r.id, kind: r.kind, who: r.author, at: r.created_at ? new Date(r.created_at).getTime() : Date.now(), data };
  }

  /* ---------------- Supabase ---------------- */
  function loadLib() {
    if (window.supabase && window.supabase.createClient) return Promise.resolve();
    return new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = 'js/vendor/supabase.js';
      s.onload = () => res();
      s.onerror = () => rej(new Error('supabase-yok'));
      document.head.appendChild(s);
    });
  }
  async function supabaseAdapter(cfg) {
    await loadLib();
    const client = window.supabase.createClient(cfg.url, cfg.key, { auth: { persistSession: false }, realtime: { params: { eventsPerSecond: 30 } } });
    const space = cfg.space || 'kale';
    client
      .channel('db-' + space)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'kale', filter: `space=eq.${space}` }, async (p) => {
        emitRow(await decodeRow(p.new));
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'kale' }, (p) => emit(subs, 'deleted', { id: p.old && p.old.id }))
      .subscribe();
    const ch = client.channel('live-' + space, { config: { broadcast: { self: false }, presence: { key: who() + '-' + Math.random().toString(36).slice(2, 7) } } });
    ch.on('broadcast', { event: 'm' }, async ({ payload }) => {
      const msg = await K.vault.unseal(payload.d);
      if (msg) emit(live, msg.e, msg);
    });
    ch.on('presence', { event: 'sync' }, () => {
      const st = ch.presenceState();
      const people = Object.values(st).flat().map((p) => p.who);
      presenceFn.forEach((fn) => fn(people));
    });
    ch.subscribe((status) => {
      if (status === 'SUBSCRIBED') ch.track({ who: who(), at: Date.now() });
    });
    return {
      async list(kind, limit = 300) {
        const { data, error } = await client.from('kale').select('*').eq('space', space).eq('kind', kind).order('created_at', { ascending: true }).limit(limit);
        if (error) throw error;
        return (await Promise.all(data.map(decodeRow))).filter(Boolean);
      },
      async add(kind, obj) {
        const { data, error } = await client.from('kale').insert({ space, kind, author: who(), data: await K.vault.seal(obj) }).select().single();
        if (error) throw error;
        return decodeRow(data);
      },
      async remove(id) {
        const { error } = await client.from('kale').delete().eq('id', id);
        if (error) throw error;
      },
      async send(msg) {
        return ch.send({ type: 'broadcast', event: 'm', payload: { d: await K.vault.seal(msg) } });
      },
    };
  }

  /* ---------------- Deneme bulutu (aynı tarayıcıda sekmeler arası) ---------------- */
  function mockAdapter() {
    const bc = new BroadcastChannel('eln-bulut');
    const KEY = 'eln-bulut-deneme';
    const rows = () => {
      try {
        return JSON.parse(localStorage.getItem(KEY) || '[]');
      } catch (e) {
        return [];
      }
    };
    const me = who() + '-' + Math.random().toString(36).slice(2, 7);
    const seen = {};
    const people = () => Object.entries(seen).filter(([, t]) => Date.now() - t < 5000).map(([k]) => k.split('-')[0]);
    const beat = () => {
      seen[me] = Date.now();
      bc.postMessage({ t: 'hi', me });
      presenceFn.forEach((fn) => fn(people()));
    };
    setInterval(beat, 1500);
    setTimeout(beat, 200);
    bc.onmessage = async ({ data }) => {
      if (data.t === 'hi') {
        const fresh = !seen[data.me] || Date.now() - seen[data.me] > 5000;
        seen[data.me] = Date.now();
        if (fresh) presenceFn.forEach((fn) => fn(people()));
      }
      if (data.t === 'row') {
        emitRow(await decodeRow(data.row));
      }
      if (data.t === 'del') emit(subs, 'deleted', { id: data.id });
      if (data.t === 'm') {
        const msg = await K.vault.unseal(data.d);
        if (msg) emit(live, msg.e, msg);
      }
    };
    return {
      async list(kind) {
        return (await Promise.all(rows().filter((r) => r.kind === kind).map(decodeRow))).filter(Boolean);
      },
      async add(kind, obj) {
        const row = { id: 'r' + Date.now() + Math.random().toString(36).slice(2, 6), kind, author: who(), created_at: new Date().toISOString(), data: await K.vault.seal(obj) };
        const all = rows();
        all.push(row);
        localStorage.setItem(KEY, JSON.stringify(all));
        bc.postMessage({ t: 'row', row });
        return decodeRow(row);
      },
      async remove(id) {
        localStorage.setItem(KEY, JSON.stringify(rows().filter((r) => r.id !== id)));
        bc.postMessage({ t: 'del', id });
      },
      async send(msg) {
        bc.postMessage({ t: 'm', d: await K.vault.seal(msg) });
      },
    };
  }

  const cloud = (K.cloud = {
    enabled: false,
    ready,
    people: [],
    // Bir türdeki kayıtlar (eskiden yeniye)
    list: async (kind, limit) => (adapter ? adapter.list(kind, limit).catch(() => []) : []),
    async add(kind, obj) {
      const row = adapter ? await adapter.add(kind, obj).catch(() => null) : null;
      emitRow(row);
      return row;
    },
    async remove(id) {
      if (!adapter) return;
      await adapter.remove(id).catch(() => {});
      emit(subs, 'deleted', { id });
    },
    // Yeni kayıt geldiğinde (başkasından ya da kendinden; her kayıt bir kez)
    on: (kind, fn) => (subs[kind] = subs[kind] || []).push(fn),
    // Canlı, kaydedilmeyen mesajlar: çizim, dokunuş, birlikte sarılma
    send: (e, payload) => adapter && adapter.send(Object.assign({ e, who: who(), t: Date.now() }, payload)).catch(() => {}),
    onLive: (e, fn) => (live[e] = live[e] || []).push(fn),
    onPresence: (fn) => presenceFn.push(fn),
    other: () => (who() === 'me' ? 'her' : 'me'),
    otherHere: () => cloud.people.includes(cloud.other()),
  });
  cloud.onPresence((people) => {
    const before = cloud.otherHere();
    cloud.people = people;
    if (before !== cloud.otherHere()) K.emit('presence', cloud.otherHere());
  });

  async function start() {
    const q = new URLSearchParams(location.search).get('bulut');
    const cfg = C.cloud || {};
    try {
      if (q === 'deneme' && window.BroadcastChannel) adapter = mockAdapter();
      else if (cfg.url && cfg.key) adapter = await supabaseAdapter(cfg);
    } catch (e) {
      adapter = null;
    }
    cloud.enabled = Boolean(adapter);
    readyResolve(cloud.enabled);
    K.emit('cloud', cloud.enabled);
  }
  K.on('unlocked', () => setTimeout(start, 0));
})();
