import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

/**
 * Parola özeti: scrypt (Node yerleşik, ek bağımlılık yok).
 * Biçim: scrypt$N$r$p$<salt base64url>$<hash base64url>
 */
const N = 2 ** 15;
const R = 8;
const P = 1;
const KEYLEN = 64;

function scryptAsync(password: string, salt: Buffer, n: number, r: number, p: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password.normalize("NFKC"), salt, KEYLEN, { N: n, r, p, maxmem: 128 * n * r * 2 }, (err, key) => (err ? reject(err) : resolve(key)));
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scryptAsync(password, salt, N, R, P);
  return `scrypt$${N}$${R}$${P}$${salt.toString("base64url")}$${hash.toString("base64url")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;
  const [, n, r, p, saltB64, hashB64] = parts;
  const expected = Buffer.from(hashB64, "base64url");
  const actual = await scryptAsync(password, Buffer.from(saltB64, "base64url"), Number(n), Number(r), Number(p));
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

/** Zayıf parola kontrolü — en az 10 karakter, harf ve rakam. */
export function passwordProblems(password: string): string | null {
  if (password.length < 10) return "Parola en az 10 karakter olmalı.";
  if (password.length > 200) return "Parola çok uzun.";
  if (!/[a-zA-ZçğıöşüÇĞİÖŞÜ]/.test(password) || !/\d/.test(password)) return "Parola en az bir harf ve bir rakam içermeli.";
  return null;
}
