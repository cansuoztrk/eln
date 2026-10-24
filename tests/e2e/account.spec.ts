import { expect, test } from "@playwright/test";

const email = `e2e-${Date.now()}@test.local`;
const password = "TestParola2026";

test.describe.configure({ mode: "serial" });

test("kayıt → favori → fiyat alarmı → hesaptan görüntüleme → çıkış/giriş", async ({ page }) => {
  await page.goto("/kayit");
  await page.locator("input[name=email]").fill(email);
  await page.locator("input[name=password]").fill(password);
  await page.getByRole("checkbox", { name: /KVKK aydınlatma metnini/ }).check();
  await page.getByRole("button", { name: "Ücretsiz hesap oluştur" }).click();
  await expect(page).toHaveURL(/\/hesap/);

  await page.goto("/urun/vektra-v8-oyuncu-faresi-26000-dpi");
  await page.getByRole("button", { name: "Favorilere ekle" }).first().click();
  await expect(page.getByRole("button", { name: "Favorilerden çıkar" }).first()).toBeVisible();

  await page.getByLabel("Hedef fiyat (TL)").fill("500");
  await page.getByRole("button", { name: /Alarm kur|Güncelle/ }).click();
  await expect(page.getByRole("link", { name: "Alarmlarım" })).toBeVisible();

  await page.goto("/hesap/alarmlar");
  await expect(page.getByText("VEKTRA V8").first()).toBeVisible();
  await page.goto("/hesap/favoriler");
  await expect(page.getByText("VEKTRA V8").first()).toBeVisible();

  // Normal kullanıcı yönetim panelini göremez (404)
  const admin = await page.goto("/admin");
  expect(admin?.status()).toBe(404);

  // KVKK veri dışa aktarma
  const exp = await page.request.get("/hesap-verilerim");
  expect(exp.ok()).toBe(true);
  const data = await exp.json();
  expect(JSON.stringify(data)).toContain(email);
  expect(JSON.stringify(data)).not.toContain("passwordHash");

  await page.context().clearCookies();
  await page.goto("/giris");
  await page.locator("input[name=email]").fill(email);
  await page.locator("input[name=password]").fill("yanlis-parola-1");
  await page.getByRole("button", { name: "Giriş yap" }).click();
  await expect(page.getByText("E-posta veya parola hatalı.")).toBeVisible();
  await page.locator("input[name=password]").fill(password);
  await page.getByRole("button", { name: "Giriş yap" }).click();
  await expect(page).toHaveURL(/\/hesap/);
});
