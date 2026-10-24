/**
 * Yönetici hesabı oluşturur veya mevcut hesabı yönetici yapar.
 *   npm run admin:create -- admin@ornek.com "GüçlüParola123"
 * Parola argüman olarak verilmezse ADMIN_PASSWORD ortam değişkeni kullanılır.
 */
import "dotenv/config";
import { db } from "../src/server/db";
import { hashPassword, passwordProblems } from "../src/server/auth/password";

async function main() {
  const email = (process.argv[2] ?? "").trim().toLowerCase();
  const password = process.argv[3] ?? process.env.ADMIN_PASSWORD ?? "";
  if (!email.includes("@")) throw new Error("Kullanım: npm run admin:create -- <e-posta> <parola>");
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    await db.user.update({ where: { email }, data: { role: "ADMIN" } });
    console.log(`${email} yönetici yapıldı.`);
    return;
  }
  const problem = passwordProblems(password);
  if (problem) throw new Error(problem);
  await db.user.create({ data: { email, passwordHash: await hashPassword(password), role: "ADMIN", kvkkAcceptedAt: new Date() } });
  console.log(`Yönetici oluşturuldu: ${email}`);
}

main()
  .catch((e) => {
    console.error(e.message);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
