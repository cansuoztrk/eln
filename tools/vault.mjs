#!/usr/bin/env node
/*
  Eln'in Krallığı — Kasa (şifreli özel içerik)

  Depo herkese açık olduğu için Eln'in fotoğrafları ve özel mesaj alıntıları
  depoya sadece ŞİFRELİ olarak girer. Site, kapıdaki soru doğru cevaplanınca
  bunları tarayıcıda çözer.

  Kaynak klasör (git'e GİRMEZ, .gitignore'da):
    private/secrets.json     { "gate": ["kapı cevabı", ...], "sealed": { "ilk-sarilma": "şifre" } }
    private/content.mjs      sitenin bütün kişisel içeriği (yoksa private/content.json)
    private/photos/*.jpg     fotoğraflar (ad.jpg ve ad.thumb.jpg)
    private/sealed/*.json    ayrı şifreyle mühürlü mektuplar

  Komutlar:
    node tools/vault.mjs pack      private/ → assets/vault/
    node tools/vault.mjs unpack    assets/vault/ → private/   (VAULT_PASS=<kapı cevabı>, isteğe bağlı VAULT_SEALED_<AD>=<şifre>)

  Şifreleme: AES-GCM 256, anahtar türetme PBKDF2-SHA256.
*/
import { webcrypto as crypto } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PRIV = path.join(ROOT, 'private');
const OUT = path.join(ROOT, 'assets', 'vault');
const ITER = 250000;
const subtle = crypto.subtle;
const enc = new TextEncoder();
const dec = new TextDecoder();
const b64 = (u8) => Buffer.from(u8).toString('base64');
const unb64 = (s) => new Uint8Array(Buffer.from(s, 'base64'));

// Tarayıcıdaki K.norm ile aynı: küçük harf, Türkçe/Azerbaycanca karakterler sadeleşir, boşluk ve noktalama gider
export function normPass(s) {
  return String(s)
    .toLocaleLowerCase('tr')
    .replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/ı/g, 'i').replace(/ö/g, 'o')
    .replace(/ş/g, 's').replace(/ü/g, 'u').replace(/ə/g, 'e')
    .replace(/[âà]/g, 'a').replace(/[îì]/g, 'i').replace(/[ûù]/g, 'u')
    .replace(/[^a-z0-9]/g, '');
}

async function deriveKey(pass, salt) {
  const base = await subtle.importKey('raw', enc.encode(normPass(pass)), 'PBKDF2', false, ['deriveKey']);
  return subtle.deriveKey({ name: 'PBKDF2', salt, iterations: ITER, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}
async function encryptBytes(key, bytes) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await subtle.encrypt({ name: 'AES-GCM', iv }, key, bytes));
  const out = new Uint8Array(12 + ct.length);
  out.set(iv);
  out.set(ct, 12);
  return out;
}
async function decryptBytes(key, file) {
  return new Uint8Array(await subtle.decrypt({ name: 'AES-GCM', iv: file.slice(0, 12) }, key, file.slice(12)));
}
const readJSON = (p, d) => (fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : d);

async function pack() {
  const secrets = readJSON(path.join(PRIV, 'secrets.json'), null);
  if (!secrets || !secrets.gate) throw new Error('private/secrets.json içinde "gate" şifresi yok.');
  fs.mkdirSync(path.join(OUT, 'p'), { recursive: true });
  fs.mkdirSync(path.join(OUT, 's'), { recursive: true });

  // Kapı şifreleri (birden fazla olabilir). Hepsi aynı tuzla türetilir, her biri içerik anahtarını ayrı sarar.
  const passes = [].concat(secrets.gate);
  const metaPath = path.join(OUT, 'keys.json');
  const old = readJSON(metaPath, null);
  let raw = null;
  if (old && old.wraps) {
    for (const p of passes) {
      if (raw) break;
      const k = await deriveKey(p, unb64(old.salt));
      for (const w of old.wraps) {
        try {
          raw = await decryptBytes(k, unb64(w));
          break;
        } catch (e) {}
      }
    }
  }
  // İçerik anahtarı korunursa Eln'in tarayıcısında kayıtlı anahtar geçerli kalır
  const kid = raw ? old.kid : b64(crypto.getRandomValues(new Uint8Array(6)));
  if (!raw) {
    raw = crypto.getRandomValues(new Uint8Array(32));
    console.log('Yeni içerik anahtarı oluşturuldu.');
  }
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const wraps = [];
  for (const p of passes) wraps.push(b64(await encryptBytes(await deriveKey(p, salt), raw)));
  const meta = { v: 2, kid, iter: ITER, salt: b64(salt), wraps, sealed: {} };
  const content = await subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt']);

  // Özel veri
  const modPath = path.join(PRIV, 'content.mjs');
  const priv = fs.existsSync(modPath) ? (await import(modPath + '?t=' + Date.now())).default : readJSON(path.join(PRIV, 'content.json'), {});
  fs.writeFileSync(path.join(OUT, 'private.bin'), await encryptBytes(content, enc.encode(JSON.stringify(priv))));

  // Fotoğraflar
  const photoDir = path.join(PRIV, 'photos');
  const photos = fs.existsSync(photoDir) ? fs.readdirSync(photoDir).filter((f) => /\.jpe?g$/i.test(f)) : [];
  const keep = new Set();
  for (const f of photos) {
    const name = f.replace(/\.jpe?g$/i, '') + '.bin';
    keep.add(name);
    fs.writeFileSync(path.join(OUT, 'p', name), await encryptBytes(content, new Uint8Array(fs.readFileSync(path.join(photoDir, f)))));
  }
  for (const f of fs.readdirSync(path.join(OUT, 'p'))) if (!keep.has(f)) fs.unlinkSync(path.join(OUT, 'p', f));

  // Mühürlü mektuplar (her biri kendi şifresiyle)
  meta.sealed = {};
  const sealedDir = path.join(PRIV, 'sealed');
  const sealed = fs.existsSync(sealedDir) ? fs.readdirSync(sealedDir).filter((f) => f.endsWith('.json')) : [];
  for (const f of sealed) {
    const id = f.replace(/\.json$/, '');
    const pass = secrets.sealed && secrets.sealed[id];
    if (!pass) throw new Error(`private/secrets.json içinde "${id}" mektubunun şifresi yok.`);
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const k = await deriveKey(pass, salt);
    meta.sealed[id] = { salt: b64(salt) };
    fs.writeFileSync(path.join(OUT, 's', id + '.bin'), await encryptBytes(k, new Uint8Array(fs.readFileSync(path.join(sealedDir, f)))));
  }
  fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2) + '\n');
  console.log(`Kasa hazır: ${photos.length} fotoğraf, ${sealed.length} mühürlü mektup, özel veri ${Object.keys(priv).length} bölüm.`);
}

async function unpack() {
  const pass = process.env.VAULT_PASS;
  if (!pass) throw new Error('VAULT_PASS ortam değişkenine kapı şifresini yaz (ör. VAULT_PASS="kapıdaki cevap").');
  const meta = readJSON(path.join(OUT, 'keys.json'), null);
  const k = await deriveKey(pass, unb64(meta.salt));
  let raw = null;
  for (const w of meta.wraps) {
    try {
      raw = await decryptBytes(k, unb64(w));
      break;
    } catch (e) {}
  }
  if (!raw) throw new Error('Şifre kasayı açmadı.');
  const content = await subtle.importKey('raw', raw, 'AES-GCM', false, ['decrypt']);
  fs.mkdirSync(path.join(PRIV, 'photos'), { recursive: true });
  fs.mkdirSync(path.join(PRIV, 'sealed'), { recursive: true });
  const priv = await decryptBytes(content, new Uint8Array(fs.readFileSync(path.join(OUT, 'private.bin'))));
  fs.writeFileSync(path.join(PRIV, 'content.json'), JSON.stringify(JSON.parse(dec.decode(priv)), null, 2) + '\n');
  for (const f of fs.readdirSync(path.join(OUT, 'p'))) {
    const bytes = await decryptBytes(content, new Uint8Array(fs.readFileSync(path.join(OUT, 'p', f))));
    fs.writeFileSync(path.join(PRIV, 'photos', f.replace(/\.bin$/, '.jpg')), bytes);
  }
  const secrets = { gate: pass, sealed: {} };
  for (const id of Object.keys(meta.sealed || {})) {
    const sp = process.env['VAULT_SEALED_' + id.replace(/-/g, '_').toUpperCase()];
    if (!sp) {
      console.log(`"${id}" mühürlü mektubu atlandı (şifresi verilmedi).`);
      continue;
    }
    const sk = await deriveKey(sp, unb64(meta.sealed[id].salt));
    const bytes = await decryptBytes(sk, new Uint8Array(fs.readFileSync(path.join(OUT, 's', id + '.bin'))));
    fs.writeFileSync(path.join(PRIV, 'sealed', id + '.json'), bytes);
    secrets.sealed[id] = sp;
  }
  fs.writeFileSync(path.join(PRIV, 'secrets.json'), JSON.stringify(secrets, null, 2) + '\n');
  console.log('Kasa private/ klasörüne açıldı.');
}

const cmd = process.argv[2];
(cmd === 'pack' ? pack() : cmd === 'unpack' ? unpack() : Promise.reject(new Error('Kullanım: node tools/vault.mjs pack|unpack'))).catch((e) => {
  console.error(e.message);
  process.exit(1);
});
