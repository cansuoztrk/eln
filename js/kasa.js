/*
  Kasa: içerik şifreli gelir, anahtar bağlantının # kısmında (#k=...) durur.
  Anahtar bir kez görülünce bu tarayıcıda hatırlanır.
*/
const ANAHTAR = 'eln.anahtar';

export const depo = {
  al(k, d = null) {
    try {
      const v = localStorage.getItem(k);
      return v == null ? d : JSON.parse(v);
    } catch (e) {
      return d;
    }
  },
  koy(k, v) {
    try {
      localStorage.setItem(k, JSON.stringify(v));
    } catch (e) {}
  },
};

const b64u = (s) => {
  const t = s.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(t + '==='.slice((t.length + 3) % 4));
  const u8 = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
  return u8;
};

function hashAnahtari(h) {
  const m = /[#&]k=([A-Za-z0-9_-]{40,})/.exec(h || '');
  return m ? m[1] : null;
}

export function anahtarBul() {
  const h = hashAnahtari(location.hash);
  if (h) {
    depo.koy(ANAHTAR, h);
    return h;
  }
  return depo.al(ANAHTAR);
}

export function anahtarYaz(metin) {
  const h = hashAnahtari(metin.includes('#') ? metin.slice(metin.indexOf('#')) : '#k=' + metin.trim());
  if (h) depo.koy(ANAHTAR, h);
  return h;
}

export function anahtarUnut() {
  try {
    localStorage.removeItem(ANAHTAR);
  } catch (e) {}
}

let anahtarObj = null;
async function cryptoKey(s) {
  if (!anahtarObj) anahtarObj = await crypto.subtle.importKey('raw', b64u(s), 'AES-GCM', false, ['decrypt']);
  return anahtarObj;
}

async function coz(key, buf) {
  const u8 = new Uint8Array(buf);
  return crypto.subtle.decrypt({ name: 'AES-GCM', iv: u8.slice(0, 12) }, key, u8.slice(12));
}

export async function icerikAc(s) {
  const key = await cryptoKey(s);
  const r = await fetch('kasa/icerik.bin', { cache: 'no-cache' });
  if (!r.ok) throw new Error('kasa');
  const json = new TextDecoder().decode(await coz(key, await r.arrayBuffer()));
  return JSON.parse(json);
}

const fotoOnbellek = new Map();
export async function fotoAc(s, id) {
  if (fotoOnbellek.has(id)) return fotoOnbellek.get(id);
  const p = (async () => {
    const key = await cryptoKey(s);
    const r = await fetch('kasa/foto/' + encodeURIComponent(id) + '.bin');
    if (!r.ok) throw new Error('foto');
    const b = await coz(key, await r.arrayBuffer());
    return URL.createObjectURL(new Blob([b], { type: 'image/jpeg' }));
  })();
  fotoOnbellek.set(id, p);
  return p;
}
