#!/usr/bin/env node
/*
  Mühür — sitenin kişisel içeriğini şifreler.

  Depo herkese açık. Bu yüzden yazılar ve fotoğraflar depoya sadece şifreli girer;
  anahtar ise Eln'e gönderilen bağlantının # işaretinden sonraki kısmında durur
  (o kısım hiçbir sunucuya gitmez, tarayıcıda kalır).

  Kaynak (git'e GİRMEZ):
    ozel/icerik.mjs        bütün yazılar
    ozel/foto/<id>.jpg     fotoğraflar (isteğe bağlı; icerik.fotolar listesinde id ile anılır)
    ozel/.anahtar          anahtar (yoksa ilk mühürlemede üretilir)

  Komutlar:
    node tools/muhur.mjs muhurle    ozel/ → kasa/
    node tools/muhur.mjs ac         kasa/ → ozel/   (KASA_ANAHTAR=<bağlantıdaki k=... değeri>)
    node tools/muhur.mjs baglanti   Eln'e gönderilecek bağlantının sonunu yazar

  Şifreleme: AES-GCM 256. Dosya biçimi: 12 bayt IV + şifreli veri.
*/
import { webcrypto as crypto } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OZEL = path.join(ROOT, 'ozel');
const KASA = path.join(ROOT, 'kasa');
const ANAHTAR_DOSYASI = path.join(OZEL, '.anahtar');
const subtle = crypto.subtle;

const b64u = {
  enc: (u8) => Buffer.from(u8).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''),
  dec: (s) => new Uint8Array(Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64')),
};

function anahtarOku(uret) {
  const env = process.env.KASA_ANAHTAR;
  if (env) return env.trim();
  if (fs.existsSync(ANAHTAR_DOSYASI)) return fs.readFileSync(ANAHTAR_DOSYASI, 'utf8').trim();
  if (!uret) throw new Error('Anahtar yok. KASA_ANAHTAR ortam değişkenine bağlantıdaki k= değerini yaz.');
  const yeni = b64u.enc(crypto.getRandomValues(new Uint8Array(32)));
  fs.mkdirSync(OZEL, { recursive: true });
  fs.writeFileSync(ANAHTAR_DOSYASI, yeni + '\n');
  console.log('Yeni anahtar üretildi (ozel/.anahtar).');
  return yeni;
}

async function anahtar(s) {
  const raw = b64u.dec(s);
  if (raw.length !== 32) throw new Error('Anahtar 32 bayt olmalı.');
  return subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt']);
}
async function sifrele(key, bytes) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await subtle.encrypt({ name: 'AES-GCM', iv }, key, bytes));
  const out = new Uint8Array(12 + ct.length);
  out.set(iv);
  out.set(ct, 12);
  return out;
}
async function coz(key, file) {
  return new Uint8Array(await subtle.decrypt({ name: 'AES-GCM', iv: file.slice(0, 12) }, key, file.slice(12)));
}

async function muhurle() {
  const s = anahtarOku(true);
  const key = await anahtar(s);
  const kaynak = path.join(OZEL, 'icerik.mjs');
  if (!fs.existsSync(kaynak)) throw new Error('ozel/icerik.mjs bulunamadı.');
  const icerik = (await import(pathToFileURL(kaynak).href + '?t=' + Date.now())).default;

  // Fotoğraflar
  const fotoDir = path.join(OZEL, 'foto');
  const outFoto = path.join(KASA, 'foto');
  fs.mkdirSync(outFoto, { recursive: true });
  const var_ = new Set();
  if (fs.existsSync(fotoDir)) {
    for (const f of fs.readdirSync(fotoDir).filter((f) => /\.(jpe?g|png|webp)$/i.test(f))) {
      const id = f.replace(/\.[^.]+$/, '');
      var_.add(id);
      fs.writeFileSync(path.join(outFoto, id + '.bin'), await sifrele(key, new Uint8Array(fs.readFileSync(path.join(fotoDir, f)))));
    }
  }
  for (const f of fs.readdirSync(outFoto)) if (!var_.has(f.replace(/\.bin$/, ''))) fs.unlinkSync(path.join(outFoto, f));
  icerik.fotolar = (icerik.fotolar || []).filter((p) => var_.has(p.id));

  const json = new TextEncoder().encode(JSON.stringify(icerik));
  fs.writeFileSync(path.join(KASA, 'icerik.bin'), await sifrele(key, json));
  // Anahtarın doğru olup olmadığını tarayıcıda hızlıca anlamak için anahtarın parmak izi
  const iz = Buffer.from(await subtle.digest('SHA-256', b64u.dec(s))).toString('hex').slice(0, 12);
  fs.writeFileSync(path.join(KASA, 'iz.json'), JSON.stringify({ v: 1, iz, t: new Date().toISOString().slice(0, 10) }) + '\n');
  const say = (k) => (Array.isArray(icerik[k]) ? icerik[k].length : 0);
  console.log(`Mühürlendi: ${say('notlar')} not, ${say('sorular')} soru, ${say('sebepler')} sebep, ${say('sarkilar')} şarkı, ${say('mektuplar')} mektup, ${var_.size} fotoğraf.`);
}

async function ac() {
  const key = await anahtar(anahtarOku(false));
  const bytes = await coz(key, new Uint8Array(fs.readFileSync(path.join(KASA, 'icerik.bin'))));
  fs.mkdirSync(path.join(OZEL, 'foto'), { recursive: true });
  const icerik = JSON.parse(new TextDecoder().decode(bytes));
  fs.writeFileSync(path.join(OZEL, 'icerik.json'), JSON.stringify(icerik, null, 2) + '\n');
  const fotoDir = path.join(KASA, 'foto');
  if (fs.existsSync(fotoDir)) {
    for (const f of fs.readdirSync(fotoDir)) {
      const b = await coz(key, new Uint8Array(fs.readFileSync(path.join(fotoDir, f))));
      fs.writeFileSync(path.join(OZEL, 'foto', f.replace(/\.bin$/, '.jpg')), b);
    }
  }
  if (!fs.existsSync(ANAHTAR_DOSYASI) && process.env.KASA_ANAHTAR) fs.writeFileSync(ANAHTAR_DOSYASI, process.env.KASA_ANAHTAR.trim() + '\n');
  console.log('Kasa ozel/ klasörüne açıldı (ozel/icerik.json). Düzenlemek için içeriği ozel/icerik.mjs olarak kaydedebilirsin.');
}

function baglanti() {
  console.log('#k=' + anahtarOku(false));
}

const cmd = process.argv[2];
const is = { muhurle, ac, baglanti }[cmd];
if (!is) {
  console.error('Kullanım: node tools/muhur.mjs muhurle | ac | baglanti');
  process.exit(1);
}
Promise.resolve(is()).catch((e) => {
  console.error(e.message);
  process.exit(1);
});
