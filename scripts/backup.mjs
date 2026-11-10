#!/usr/bin/env node
// ELNARE — backup.
//
//   node scripts/backup.mjs                 database + media
//   node scripts/backup.mjs --db-only       database only
//   node scripts/backup.mjs --media-only    media only
//   node scripts/backup.mjs --out <dir>     where to write (default: backups/<timestamp>)
//
// The database and the media are written to separate folders and can be taken,
// kept and restored independently of each other.
//
//   <out>/data/<table>.json   every row of every table, as plain JSON (portable anywhere)
//   <out>/data/manifest.json  when, how many rows, which migrations
//   <out>/sql/*.sql           full-fidelity pg_dump (only when DATABASE_URL + pg_dump exist)
//   <out>/media/<path>        every stored file: untouched originals and served variants
//   <out>/media-manifest.json path, size and sha256 of each file
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { adminClient, arg, BUCKET, flag, loadEnv, TABLES } from "./_env.mjs";

loadEnv();
const supabase = adminClient();
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const out = arg("--out") || join("backups", stamp);
const wantDb = !flag("--media-only");
const wantMedia = !flag("--db-only");

async function backupData() {
  const dir = join(out, "data");
  mkdirSync(dir, { recursive: true });
  const counts = {};

  for (const table of TABLES) {
    const rows = [];
    for (let from = 0; ; from += 1000) {
      const { data, error } = await supabase.from(table).select("*").range(from, from + 999);
      if (error) throw new Error(`${table}: ${error.message}`);
      rows.push(...data);
      if (data.length < 1000) break;
    }
    writeFileSync(join(dir, `${table}.json`), JSON.stringify(rows, null, 2));
    counts[table] = rows.length;
  }

  const migrations = existsSync("supabase/migrations") ? readdirSync("supabase/migrations").sort() : [];
  const version = JSON.parse(readFileSync("package.json", "utf8")).version;
  writeFileSync(
    join(dir, "manifest.json"),
    JSON.stringify({ createdAt: new Date().toISOString(), appVersion: version, migrations, counts }, null, 2),
  );
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  console.log(`✓ veri: ${TABLES.length} tablo, ${total} satır → ${dir}`);
}

function backupSql() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.log("· SQL dökümü atlandı: DATABASE_URL tanımlı değil (JSON dışa aktarımı yine de tam).");
    return;
  }
  if (spawnSync("pg_dump", ["--version"]).status !== 0) {
    console.log("· SQL dökümü atlandı: pg_dump bulunamadı.");
    return;
  }
  const dir = join(out, "sql");
  mkdirSync(dir, { recursive: true });
  const dumps = [
    // The app's own schema with all its data, policies, triggers and functions.
    ["app.sql", ["--schema=public", "--schema=app", "--no-owner", "--no-privileges"]],
    // Accounts and password hashes, so both of them can still sign in after a restore.
    ["auth-data.sql", ["--data-only", "--table=auth.users", "--table=auth.identities", "--no-owner"]],
    // Storage's own record of the files (the files themselves are in media/).
    ["storage-data.sql", ["--data-only", "--table=storage.buckets", "--table=storage.objects", "--no-owner"]],
  ];
  for (const [file, options] of dumps) {
    const result = spawnSync("pg_dump", [url, ...options, "-f", join(dir, file)], { stdio: ["ignore", "ignore", "pipe"] });
    if (result.status !== 0) throw new Error(`pg_dump ${file}: ${result.stderr.toString().slice(0, 300)}`);
  }
  console.log(`✓ SQL dökümü → ${dir}`);
}

async function listAll(prefix = "") {
  const files = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await supabase.storage.from(BUCKET).list(prefix, { limit: 1000, offset });
    if (error) throw new Error(`storage list ${prefix}: ${error.message}`);
    for (const entry of data) {
      const path = prefix ? `${prefix}/${entry.name}` : entry.name;
      // Folders come back without an id.
      if (entry.id === null) files.push(...(await listAll(path)));
      else files.push({ path, size: entry.metadata?.size ?? null });
    }
    if (data.length < 1000) break;
  }
  return files;
}

async function backupMedia() {
  const dir = join(out, "media");
  const files = await listAll();
  const manifest = [];
  let downloaded = 0;

  for (const file of files) {
    const target = join(dir, file.path);
    let bytes;
    if (existsSync(target) && file.size !== null && statSync(target).size === file.size) {
      bytes = readFileSync(target); // already here from an earlier, interrupted run
    } else {
      const { data, error } = await supabase.storage.from(BUCKET).download(file.path);
      if (error) throw new Error(`download ${file.path}: ${error.message}`);
      bytes = Buffer.from(await data.arrayBuffer());
      mkdirSync(dirname(target), { recursive: true });
      writeFileSync(target, bytes);
      downloaded += 1;
    }
    manifest.push({ path: file.path, bytes: bytes.length, sha256: createHash("sha256").update(bytes).digest("hex") });
  }

  // Originals must match the checksum recorded when they were uploaded.
  const { data: assets } = await supabase.from("media_assets").select("original_path, checksum_sha256");
  const byPath = new Map(manifest.map((m) => [m.path, m.sha256]));
  const mismatched = (assets ?? []).filter((a) => a.checksum_sha256 && byPath.has(a.original_path) && byPath.get(a.original_path) !== a.checksum_sha256);
  const missing = (assets ?? []).filter((a) => !byPath.has(a.original_path));

  mkdirSync(out, { recursive: true });
  writeFileSync(join(out, "media-manifest.json"), JSON.stringify({ createdAt: new Date().toISOString(), bucket: BUCKET, files: manifest }, null, 2));
  console.log(`✓ medya: ${manifest.length} dosya (${downloaded} indirildi) → ${dir}`);
  if (mismatched.length) console.log(`! ${mismatched.length} orijinalin sağlama toplamı kayıtla uyuşmuyor: ${mismatched.map((m) => m.original_path).join(", ")}`);
  if (missing.length) console.log(`! ${missing.length} kayıtlı orijinal depoda bulunamadı.`);
  if (mismatched.length || missing.length) process.exitCode = 2;
}

try {
  if (wantDb) {
    await backupData();
    backupSql();
  }
  if (wantMedia) await backupMedia();
  console.log(`\nYedek hazır: ${out}`);
  console.log("Bu klasörü siteden bağımsız, en az iki farklı yerde sakla.");
} catch (error) {
  console.error(`\nYedek alınamadı: ${error.message}`);
  process.exit(1);
}
