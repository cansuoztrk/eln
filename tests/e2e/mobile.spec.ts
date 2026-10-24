import { expect, test } from "@playwright/test";

test("mobil: filtre çekmecesi açılır, filtre uygulanır ve URL'ye yazılır", async ({ page }) => {
  await page.goto("/kategori/oyuncu-fareleri");
  await page.getByRole("button", { name: /^Filtreler/ }).click();
  const dialog = page.locator("dialog[open]");
  await expect(dialog).toBeVisible();
  await dialog.getByLabel("Yalnızca stokta olanlar").check();
  await expect(page).toHaveURL(/stok=1/);
});

test("mobil: alt sekme çubuğu ve yatay taşma yok", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("navigation").last()).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});
