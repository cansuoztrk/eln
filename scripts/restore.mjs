#!/usr/bin/env node
// ELNARE — restore a backup into an EMPTY project (migrations already applied).
//
//   node scripts/restore.mjs <backup dir> --dry-run          only report
//   node scripts/restore.mjs <backup dir> --yes-overwrite    actually write
//   … --db-only / --media-only                               one half at a time
//
// Accounts: with a pg_dump (sql/auth-data.sql) passwords survive — restore that
// file with psql first (see docs/BACKUP_GUIDE.md). Without it, this script
// re-creates the two accounts from the JSON export with the same ids, and each
// person sets a new password (owner: Supabase dashboard; partner: a new invite).
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { adminClient, BUCKET, flag, loadEnv, TABLES } from "./_env.mjs";

loadEnv();
const dir = process.argv[2];
const dry = flag("--dry-run");
const go = flag("--yes-overwrite");
if (!dir || !existsSync(dir) || (!dry && !go)) {
  console.error("Kullanım: node scripts/restore.mjs <yedek klasörü> --dry-run | --yes-overwrite [--db-only|--media-only]");
  process.exit(1);
}

const supabase = adminClient();
const read = (path) => JSON.parse(readFileSync(path, "utf8"));
const wantDb = !flag("--media-only") && existsSync(join(dir, "data", "manifest.json"));
const wantMedia = !flag("--db-only") && existsSync(join(dir, "media-manifest.json"));
const MIME = { jpg: "image/jpeg", png: "image/png", webp: "image/webp", webm: "audio/webm", ogg: "audio/ogg", m4a: "audio/mp4", mp3: "audio/mpeg", wav: "audio/wav", aac: "audio/aac" };

async function restoreData() {
  const table = (name) => read(join(dir, "data", `${name}.json`));
  const spaces = table("private_spaces");

  const { data: existing } = await supabase.from("private_spaces").select("id");
  if (existing?.length && existing[0].id !== spaces[0]?.id) {
    throw new Error("Hedef veritabanında başka bir alan var. Boş bir projeye geri yükle (supabase db reset / yeni proje).");
  }

  // Accounts first: every row points at them.
  const { data: list } = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 });
  const have = new Set((list?.users ?? []).map((u) => u.id));
  const members = table("space_members");
  const invites = table("space_invites");
  for (const member of members) {
    if (have.has(member.user_id)) continue;
    const email =
      member.role === "partner"
        ? invites.find((i) => i.accepted_by === member.user_id)?.email
        : process.env.RESTORE_OWNER_EMAIL;
    if (!email) {
      throw new Error(
        member.role === "owner"
          ? "Owner hesabı hedefte yok. Önce sql/auth-data.sql dosyasını geri yükle ya da RESTORE_OWNER_EMAIL=<e-posta> ver."
          : "Partner hesabının e-postası bulunamadı; sql/auth-data.sql dosyasını geri yükle.",
      );
    }
    console.log(`${dry ? "[dry] " : ""}hesap oluşturulacak: ${member.role} <${email}> (yeni parola gerekecek)`);
    if (!dry) {
      const { error } = await supabase.auth.admin.createUser({ id: member.user_id, email, email_confirm: true });
      if (error) throw new Error(`hesap ${email}: ${error.message}`);
    }
  }

  for (const name of TABLES) {
    const rows = table(name);
    console.log(`${dry ? "[dry] " : ""}${name}: ${rows.length} satır`);
    if (dry || rows.length === 0) continue;
    for (let i = 0; i < rows.length; i += 500) {
      const { error } = await supabase.from(name).upsert(rows.slice(i, i + 500));
      if (error) throw new Error(`${name}: ${error.message}`);
    }
  }
}

async function restoreMedia() {
  const { files } = read(join(dir, "media-manifest.json"));
  console.log(`${dry ? "[dry] " : ""}medya: ${files.length} dosya yüklenecek`);
  if (dry) return;
  for (const file of files) {
    const body = readFileSync(join(dir, "media", file.path));
    const contentType = MIME[file.path.split(".").pop()] ?? "application/octet-stream";
    const { error } = await supabase.storage.from(BUCKET).upload(file.path, body, { upsert: true, contentType });
    if (error) throw new Error(`upload ${file.path}: ${error.message}`);
  }
}

try {
  if (wantDb) await restoreData();
  if (wantMedia) await restoreMedia();
  console.log(dry ? "\nProva tamam: hiçbir şey yazılmadı." : "\n✓ Geri yükleme tamamlandı.");
} catch (error) {
  console.error(`\nGeri yükleme durdu: ${error.message}`);
  process.exit(1);
}
