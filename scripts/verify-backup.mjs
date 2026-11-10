#!/usr/bin/env node
// ELNARE — checks that a backup folder is complete and consistent.
//   node scripts/verify-backup.mjs backups/<timestamp>
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { TABLES } from "./_env.mjs";

const dir = process.argv[2];
if (!dir || !existsSync(dir)) {
  console.error("Kullanım: node scripts/verify-backup.mjs <yedek klasörü>");
  process.exit(1);
}

const problems = [];
const read = (path) => JSON.parse(readFileSync(path, "utf8"));
const hasData = existsSync(join(dir, "data", "manifest.json"));
const hasMedia = existsSync(join(dir, "media-manifest.json"));
if (!hasData && !hasMedia) problems.push("Ne veri ne medya yedeği bulundu.");

let assets = [];
if (hasData) {
  const manifest = read(join(dir, "data", "manifest.json"));
  for (const table of TABLES) {
    const file = join(dir, "data", `${table}.json`);
    if (!existsSync(file)) {
      problems.push(`Eksik tablo dosyası: ${table}.json`);
      continue;
    }
    const rows = read(file);
    if (rows.length !== manifest.counts[table]) problems.push(`${table}: ${rows.length} satır var, manifest ${manifest.counts[table]} diyor`);
    if (table === "media_assets") assets = rows;
  }
  console.log(`veri: ${manifest.createdAt} · ${Object.values(manifest.counts).reduce((a, b) => a + b, 0)} satır`);
}

if (hasMedia) {
  const manifest = read(join(dir, "media-manifest.json"));
  for (const file of manifest.files) {
    const path = join(dir, "media", file.path);
    if (!existsSync(path)) {
      problems.push(`Eksik dosya: ${file.path}`);
      continue;
    }
    const sha = createHash("sha256").update(readFileSync(path)).digest("hex");
    if (sha !== file.sha256) problems.push(`Bozuk dosya (sha256 farklı): ${file.path}`);
  }
  console.log(`medya: ${manifest.files.length} dosya`);

  // Every asset the database knows about must have its original and its variants on disk.
  const onDisk = new Map(manifest.files.map((f) => [f.path, f.sha256]));
  for (const asset of assets) {
    if (!onDisk.has(asset.original_path)) problems.push(`Orijinal yok: ${asset.original_path}`);
    else if (asset.checksum_sha256 && onDisk.get(asset.original_path) !== asset.checksum_sha256) problems.push(`Orijinal değişmiş: ${asset.original_path}`);
    for (const variant of Object.values(asset.variants ?? {})) {
      if (variant?.path && !onDisk.has(variant.path)) problems.push(`Varyant yok: ${variant.path}`);
    }
  }
}

if (problems.length) {
  console.error(`\n${problems.length} sorun:\n- ${problems.slice(0, 40).join("\n- ")}`);
  process.exit(1);
}
console.log("\n✓ Yedek eksiksiz ve tutarlı.");
