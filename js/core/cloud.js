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
      // En yeni `limit` kayıt, eskiden yeniye sıralı (before: bu andan öncekiler; eski arşiv için)
      async list(kind, limit = 500, opt = {}) {
        let q = client.from('kale').select('*').eq('space', space).eq('kind', kind);
        if (opt.before) q = q.lt('created_at', new Date(opt.before).toISOString());
        const { data, error } = await q.order('created_at', { ascending: false }).limit(limit);
        if (error) throw error;
        return (await Promise.all(data.reverse().map(decodeRow))).filter(Boolean);
      },
      // Birden çok türden en yeni kayıtlar tek istekte (hikâyeler ve Gün Gün Biz için); eskiden yeniye sıralı
      async many(kinds, opt = {}) {
        let q = client.from('kale').select('*').eq('space', space).in('kind', kinds);
        if (opt.since) q = q.gte('created_at', new Date(opt.since).toISOString());
        if (opt.before) q = q.lt('created_at', new Date(opt.before).toISOString());
        const { data, error } = await q.order('created_at', { ascending: false }).limit(opt.limit || 500);
        if (error) throw error;
        return (await Promise.all(data.reverse().map(decodeRow))).filter(Boolean);
      },
      async get(id) {
        const { data, error } = await client.from('kale').select('*').eq('space', space).eq('id', id).maybeSingle();
        if (error) throw error;
        return data ? decodeRow(data) : null;
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
      // Bütün kayıtlar (Kale Yedeği), eskiden yeniye, 500'erlik sayfalarla; skip: atlanacak türler
      async dump(skip, onp) {
        let out = [], from = 0;
        for (;;) {
          let q = client.from('kale').select('*').eq('space', space);
          if (skip && skip.length) q = q.not('kind', 'in', `(${skip.join(',')})`);
          const { data, error } = await q.order('created_at', { ascending: true }).range(from, from + 499);
          if (error) throw error;
          out = out.concat((await Promise.all(data.map(decodeRow))).filter(Boolean));
          onp && onp(out.length);
          if (data.length < 500) break;
          from += 500;
        }
        return out;
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
      async list(kind, limit = 500, opt = {}) {
        const all = rows().filter((r) => r.kind === kind && (!opt.before || new Date(r.created_at).getTime() < opt.before));
        return (await Promise.all(all.slice(-limit).map(decodeRow))).filter(Boolean);
      },
      async many(kinds, opt = {}) {
        const t = (r) => new Date(r.created_at).getTime();
        const all = rows().filter((r) => kinds.includes(r.kind) && (!opt.since || t(r) >= opt.since) && (!opt.before || t(r) < opt.before));
        return (await Promise.all(all.slice(-(opt.limit || 500)).map(decodeRow))).filter(Boolean);
      },
      async get(id) {
        const r = rows().find((x) => x.id === id);
        return r ? decodeRow(r) : null;
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
      async dump(skip, onp) {
        const all = (await Promise.all(rows().filter((r) => !(skip || []).includes(r.kind)).map(decodeRow))).filter(Boolean);
        onp && onp(all.length);
        return all;
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
    list: async (kind, limit, opt) => (adapter ? adapter.list(kind, limit, opt).catch(() => []) : []),
    // Birden çok türün kayıtları tek istekte: many(['hava', 'dakika'], { since, before, limit })
    many: async (kinds, opt) => (adapter && adapter.many ? adapter.many(kinds, opt).catch(() => []) : []),
    // Tek bir kayıt (büyük fotoğraflar gibi, sadece gerektiğinde)
    get: async (id) => (adapter && adapter.get ? adapter.get(id).catch(() => null) : null),
    async add(kind, obj) {
      const row = adapter ? await adapter.add(kind, obj).catch(() => null) : null;
      emitRow(row);
      return row;
    },
    // Yedek için her şey (hata olursa fırlatır; çağıran söyler)
    dump: (skip, onp) => (adapter && adapter.dump ? adapter.dump(skip, onp) : Promise.resolve([])),
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

  /* ---------------- Kurulum: test, bu cihazda aç, bağlantı linki ---------------- */
  // Ayar üç yerden gelebilir: kasadaki C.cloud, bu cihaza kaydedilmiş (mühürlü) ayar ya da #bulut:<mühür> linki
  async function localCfg() {
    const s = K.store.get('cloudCfg');
    return s ? (await K.vault.unseal(s)) || {} : {};
  }
  cloud.saveLocal = async (cfg) => K.store.set('cloudCfg', await K.vault.seal({ url: cfg.url.trim(), key: cfg.key.trim(), space: cfg.space || 'kale' }));
  cloud.link = async (cfg) => `${location.origin}${location.pathname}#bulut:${encodeURIComponent(await K.vault.seal({ url: cfg.url.trim(), key: cfg.key.trim(), space: cfg.space || 'kale' }))}`;
  // Supabase projesini adım adım dener: bağlantı, yazma, okuma, canlı olay, silme
  cloud.test = async (cfg, step) => {
    let cl = null;
    try {
      return await runTest(cfg, step, (c) => (cl = c));
    } finally {
      // Deneme bitince (başarılı ya da değil) canlı bağlantıyı kapat
      try {
        cl && cl.removeAllChannels();
      } catch (e) {}
    }
  };
  async function runTest(cfg, step, keep) {
    const say = (k, ok, msg) => step && step(k, ok, msg);
    const space = 'test-' + Math.random().toString(36).slice(2, 8);
    let client, ch;
    try {
      await loadLib();
      client = window.supabase.createClient(cfg.url.trim(), cfg.key.trim(), { auth: { persistSession: false } });
      keep(client);
    } catch (e) {
      say('baglanti', false, 'Kütüphane yüklenemedi ya da adres geçersiz.');
      return false;
    }
    let heard = false;
    const subscribed = new Promise((res) => {
      ch = client
        .channel('test-' + space)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'kale', filter: `space=eq.${space}` }, () => (heard = true))
        .subscribe((st) => st === 'SUBSCRIBED' && res(true));
      setTimeout(() => res(false), 7000);
    });
    const hint = (err) => {
      const m = `${(err && err.code) || ''} ${(err && err.message) || err || ''}`;
      if (/42P01|does not exist|relation/i.test(m)) return 'Tablo bulunamadı: SQL Editor\'da kurulum kodunu çalıştırdın mı?';
      if (/401|JWT|apikey|API key|Invalid/i.test(m)) return 'Anahtar kabul edilmedi: anon public (ya da Publishable) anahtarı kopyaladığından emin ol.';
      if (/Failed to fetch|NetworkError|ENOTFOUND|load failed/i.test(m)) return 'Adrese ulaşılamadı: Project URL doğru mu (https://....supabase.co)?';
      if (/row-level security|policy/i.test(m)) return 'İzin kuralları eksik: kurulum kodunun tamamını çalıştır.';
      return m.trim().slice(0, 160) || 'Bilinmeyen hata';
    };
    try {
      const { error } = await client.from('kale').select('id').limit(1);
      if (error) throw error;
      say('baglanti', true, 'Projeye bağlanıldı, tablo yerinde.');
    } catch (e) {
      say('baglanti', false, hint(e));
      return false;
    }
    const live = await subscribed;
    // Yeni açılan canlı kanal ilk birkaç saniye olay kaçırabiliyor; kısa bir ısınma
    if (live) await new Promise((r) => setTimeout(r, 3000));
    let row;
    try {
      const { data, error } = await client.from('kale').insert({ space, kind: 'ping', author: 'me', data: await K.vault.seal({ ping: Date.now() }) }).select().single();
      if (error) throw error;
      row = data;
      say('yazma', true, 'Şifreli bir deneme kaydı yazıldı.');
    } catch (e) {
      say('yazma', false, hint(e));
      return false;
    }
    try {
      const { data, error } = await client.from('kale').select('*').eq('id', row.id).single();
      if (error) throw error;
      const back = await K.vault.unseal(data.data);
      if (!back || !back.ping) throw new Error('çözülemedi');
      say('okuma', true, 'Kayıt geri okundu ve kasa anahtarıyla çözüldü.');
    } catch (e) {
      say('okuma', false, hint(e));
      return false;
    }
    for (let i = 0; i < 50 && !heard; i++) await new Promise((r) => setTimeout(r, 200));
    say('canli', live && heard, live && heard ? 'Canlı güncellemeler çalışıyor.' : 'Canlı olay gelmedi: kurulum kodunun son kısmı (supabase_realtime) çalışmamış olabilir. Site yine çalışır ama anlık düşmez.');
    try {
      const { error } = await client.from('kale').delete().eq('id', row.id);
      if (error) throw error;
      say('silme', true, 'Deneme kaydı silindi.');
    } catch (e) {
      say('silme', false, hint(e));
    }
    return true;
  }

  async function start() {
    const q = new URLSearchParams(location.search).get('bulut');
    // Bağlantı linkiyle gelindiyse: ayarı bu cihaza kaydet, adresi temizle
    if (location.hash.startsWith('#bulut:')) {
      const got = await K.vault.unseal(decodeURIComponent(location.hash.slice(7)));
      history.replaceState(null, '', location.pathname + location.search);
      if (got && got.url && got.key) {
        await cloud.saveLocal(got);
        setTimeout(() => K.fx.toast('<b>Ortak kale bağlandı.</b> Artık yazdıkların anında öbür telefona düşecek.', { icon: K.art.icon('hugs'), duration: 6000 }), 1500);
      }
    }
    let cfg = C.cloud || {};
    if (!(cfg.url && cfg.key)) cfg = await localCfg();
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
