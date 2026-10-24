/**
 * Entegrasyon testleri için ayrı bir PostgreSQL veritabanı kullanılır (TEST_DATABASE_URL).
 * Kurulum: şemayı sıfırdan migrate eder ve temel referans verileri yükler. Asla geliştirme veya
 * üretim veritabanına bağlanmaz: adında "test" geçmeyen veritabanı reddedilir.
 */
import { execSync } from "node:child_process";
import "dotenv/config";

export default function setup() {
  const url = process.env.TEST_DATABASE_URL ?? "postgresql://firsat:firsat@localhost:5432/firsatradar_test?schema=public";
  if (!/test/i.test(new URL(url).pathname)) throw new Error(`Güvenlik: test veritabanı adı "test" içermeli (${url})`);
  process.env.DATABASE_URL = url;
  const env = { ...process.env, DATABASE_URL: url };
  execSync(`psql "${url.replace("?schema=public", "")}" -q -c "DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public; CREATE EXTENSION IF NOT EXISTS pg_trgm; CREATE EXTENSION IF NOT EXISTS unaccent;"`, { stdio: "inherit", env });
  execSync("npx prisma migrate deploy", { stdio: "ignore", env });
  execSync("npx tsx prisma/seed.ts", { stdio: "ignore", env });
}
