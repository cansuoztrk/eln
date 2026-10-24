import { expect, test } from "@playwright/test";

test("ana sayfa: arama, fırsatlar ve test verisi etiketi", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("searchbox", { name: "Ara" }).or(page.getByRole("combobox", { name: "Ara" })).first()).toBeVisible();
  // Demo verisi gerçekmiş gibi gösterilmez
  await expect(page.getByText("Test verisi").first()).toBeVisible();
});

test("arama sonuçları URL'ye yansır ve yazım hatasına toleranslıdır", async ({ page }) => {
  await page.goto("/firsatlar?q=vektra");
  await expect(page).toHaveURL(/q=vektra/);
  await expect(page.locator("a[href^='/urun/vektra']").first()).toBeVisible();
  await page.goto("/firsatlar?q=vektr");
  await expect(page.locator("a[href^='/urun/vektra']").first()).toBeVisible();
});

test("kategori: URL parametreleri ile filtre ve sıralama korunur", async ({ page }) => {
  await page.goto("/kategori/oyuncu-fareleri?sirala=fiyat-artan&stok=1");
  await expect(page.getByRole("combobox").filter({ hasText: "En düşük fiyat" })).toHaveValue("fiyat-artan");
  const prices = await page.locator("[data-testid='card-price']").allInnerTexts();
  expect(prices.length).toBeGreaterThan(1);
  const nums = prices.map((p) => Number(p.replace(/[^\d,]/g, "").replace(",", ".")));
  expect([...nums].sort((a, b) => a - b)).toEqual(nums);
  await page.getByRole("combobox").filter({ hasText: "En düşük fiyat" }).selectOption("yeni");
  await expect(page).toHaveURL(/sirala=yeni/);
  await expect(page).toHaveURL(/stok=1/);
});

test("ürün detayı: fiyat geçmişi, karşılaştırma ve veri kaynağı", async ({ page }) => {
  await page.goto("/urun/vektra-v8-oyuncu-faresi-26000-dpi");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Vektra V8");
  await expect(page.getByText("Tablo olarak göster")).toBeVisible();
  await page.getByText("Tablo olarak göster").click();
  await expect(page.locator("details table").first()).toBeVisible();
  await expect(page.getByText(/30 gün/).first()).toBeVisible();
  await expect(page.getByText("Test verisi").first()).toBeVisible();
  // Alarm kurmak hesap gerektirir
  await expect(page.getByRole("link", { name: "Hesap oluştur" }).first()).toBeVisible();
});

test("test kaynağındaki teklif gerçek mağazaya yönlendirilmez", async ({ page, request }) => {
  await page.goto("/urun/vektra-v8-oyuncu-faresi-26000-dpi");
  const href = await page.locator("a[href^='/git/']").first().getAttribute("href");
  expect(href).toBeTruthy();
  const res = await request.get(href!, { maxRedirects: 0 });
  expect(res.status()).toBe(302);
  expect(res.headers().location).toContain("/test-baglanti");
});

test("uçuş arama: sonuçlar, sağlayıcı durumu ve test etiketi", async ({ page }) => {
  const d = new Date(Date.now() + 20 * 86400000).toISOString().slice(0, 10);
  await page.goto(`/ucak-bileti/ara?from=IST&to=AYT&depart=${d}`);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/İstanbul|IST/);
  await expect(page.getByText("Test verisi").first()).toBeVisible();
  await expect(page.locator("[data-testid='flight-result']").first()).toBeVisible();
});

test("uçuş arama: geçmiş tarih reddedilir", async ({ page }) => {
  await page.goto(`/ucak-bileti/ara?from=IST&to=AYT&depart=2020-01-01`);
  await expect(page.getByText("Gidiş tarihi geçmişte olamaz.")).toBeVisible();
});

test("yönetim paneli anonim kullanıcıyı girişe yönlendirir", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/giris\?sonra=/);
});

test("robots, sitemap ve sağlık uç noktası", async ({ request }) => {
  const robots = await request.get("/robots.txt");
  expect(robots.ok()).toBe(true);
  const txt = await robots.text();
  expect(txt).toContain("Disallow: /admin");
  expect(txt).toContain("Sitemap:");
  const sm = await request.get("/sitemap.xml");
  expect(sm.ok()).toBe(true);
  expect(await sm.text()).toContain("<urlset");
  const health = await request.get("/api/health");
  expect(health.ok()).toBe(true);
});

test("güvenlik başlıkları mevcut", async ({ request }) => {
  const res = await request.get("/");
  const h = res.headers();
  expect(h["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(h["x-content-type-options"]).toBe("nosniff");
  expect(h["referrer-policy"]).toBeTruthy();
});

test("yönetici: kontrol merkezi ve kaynak durumu", async ({ page }) => {
  const email = process.env.E2E_ADMIN_EMAIL;
  const password = process.env.E2E_ADMIN_PASSWORD;
  test.skip(!email || !password, "E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD tanımlı değil (npm run admin:create ile oluşturun)");
  await page.goto("/giris?sonra=/admin");
  await page.locator("input[name=email]").fill(email!);
  await page.locator("input[name=password]").fill(password!);
  await page.getByRole("button", { name: "Giriş yap" }).click();
  await expect(page.getByRole("heading", { name: "Kontrol merkezi" })).toBeVisible();
  await expect(page.getByText("Entegrasyonlar ve veri güncelliği")).toBeVisible();
  await page.goto("/admin/kaynaklar");
  await expect(page.getByText("amazon-creators").first()).toBeVisible();
});
