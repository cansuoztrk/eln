import { expect, test, type Browser, type Page } from "@playwright/test";
import { mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

/**
 * The whole first-run story, once, in order: Arda sets the site up, adds a
 * photo and three letters, invites Eln; Eln chooses her key, goes through the
 * gift, and finds exactly what she is meant to find — and nothing else.
 */

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split("\n")
    .filter((line) => line.includes("=") && !line.startsWith("#"))
    .map((line) => [line.slice(0, line.indexOf("=")), line.slice(line.indexOf("=") + 1)]),
);

const OWNER = { email: "arda@example.com", password: "arda-test-parola-1" };
const PARTNER = { email: "eln@example.com", password: "eln-test-parola-1" };

test.describe.configure({ mode: "serial" });

let owner: Page;
let partner: Page;
let inviteLink = "";
const letters: Record<string, string> = {};

async function signIn(browser: Browser, user: typeof OWNER, mobile = false): Promise<Page> {
  const context = await browser.newContext(mobile ? { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true } : {});
  const page = await context.newPage();
  await page.goto("/login");
  await page.fill("#email", user.email);
  await page.fill("#password", user.password);
  await page.click("button[type=submit]");
  await page.waitForURL((url) => !url.pathname.startsWith("/login"));
  return page;
}

test("a visitor is sent to setup, and setup needs the secret", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/setup$/);

  await page.fill("#secret", "not-the-secret");
  await page.fill("#email", OWNER.email);
  await page.fill("#password", OWNER.password);
  await page.fill("#passwordConfirm", OWNER.password);
  await page.click("button[type=submit]");
  await expect(page.getByRole("alert").first()).toBeVisible();
  await expect(page).toHaveURL(/\/setup$/);

  await page.fill("#secret", env.SETUP_SECRET);
  await page.click("button[type=submit]");
  await expect(page).toHaveURL(/\/studio$/);
});

test("setup can never be run again", async ({ page }) => {
  await page.goto("/setup");
  await expect(page).toHaveURL(/\/login$/);
});

test("the home page counts from the real dates and shows no meeting countdown", async ({ browser }) => {
  owner = await signIn(browser, OWNER);
  await owner.goto("/");
  await expect(owner.getByRole("heading", { level: 1 })).toContainText("Elnare");
  await expect(owner.getByText("6 Aralık 2025 tarihinden bugüne")).toBeVisible();
  await expect(owner.getByText(/21 Mayıs 2026 tarihinden bugüne/)).toBeVisible();

  await owner.goto("/story");
  await expect(owner.locator("#interlude-heading")).toBeVisible();
  await expect(owner.getByText("166", { exact: true })).toBeVisible();

  await owner.goto("/distance");
  await expect(owner.locator("#meeting")).toContainText("Henüz bir tarihi yok");
  await expect(owner.locator("#meeting [role=timer]")).toHaveCount(0);
});

test("the owner uploads a photo and publishes it", async () => {
  // A plain coloured rectangle: a test fixture, never content.
  mkdirSync(test.info().outputDir, { recursive: true });
  const file = join(test.info().outputDir, "fixture.jpg");
  await sharp({ create: { width: 900, height: 1200, channels: 3, background: "#f3c9d1" } }).jpeg().toFile(file);

  await owner.goto("/studio/photos");
  await owner.setInputFiles("input[type=file]", file);
  await expect(owner.getByText("Yüklendi")).toBeVisible({ timeout: 60_000 });
  await owner.reload();
  await owner.getByRole("checkbox").first().click();
  await owner.getByRole("toolbar").getByRole("button", { name: "Yayımla" }).click();
  await expect(owner.getByText("Yayında").first()).toBeVisible();

  await owner.goto("/gallery");
  await expect(owner.locator("figure button")).toHaveCount(1);
});

test("the owner writes an open, a sealed and a draft letter", async () => {
  const write = async (title: string, body: string, options: { unlockOn?: string; draft?: boolean } = {}) => {
    await owner.goto("/studio/letters/new");
    await owner.fill("#title", title);
    await owner.fill("#body", body);
    if (options.unlockOn) await owner.fill("#unlockOn", options.unlockOn);
    await owner.getByRole("button", { name: options.draft ? "Taslak kaydet" : "Yayımla" }).click();
    await owner.waitForURL("**/studio/letters");
  };
  await write("E2E açık mektup", "Açık gövde.");
  await write("E2E mühürlü mektup", "MUHURLU-GOVDE", { unlockOn: "2099-01-01" });
  await write("E2E taslak mektup", "TASLAK-GOVDE", { draft: true });

  for (const link of await owner.locator('a[href^="/studio/letters/"]').all()) {
    const text = await link.innerText();
    const id = (await link.getAttribute("href"))!.split("/").pop()!;
    for (const key of ["açık", "mühürlü", "taslak"]) if (text.includes(`E2E ${key}`)) letters[key] = id;
  }
  expect(Object.keys(letters).sort()).toEqual(["açık", "mühürlü", "taslak"]);

  await owner.goto(`/letters/${letters["açık"]}`);
  await owner.getByRole("button", { name: "Zarfı aç", exact: true }).click();
  await expect(owner.locator("article")).toContainText("Açık gövde.");
});

test("the owner creates a single-use invitation", async () => {
  await owner.goto("/studio/invite");
  await owner.fill("#invite-email", PARTNER.email);
  await owner.getByRole("button", { name: "Davet bağlantısı oluştur" }).click();
  const field = owner.getByLabel("Davet bağlantısı");
  await expect(field).toBeVisible();
  inviteLink = new URL(await field.inputValue()).pathname;
  expect(inviteLink).toMatch(/^\/invite\/[\w-]{20,}$/);
});

test("the partner chooses her key and is taken through the gift", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  partner = await context.newPage();
  await partner.goto(inviteLink);
  await expect(partner.getByRole("heading", { level: 1 })).toContainText("Eln");
  await partner.fill("#password", PARTNER.password);
  await partner.fill("#passwordConfirm", PARTNER.password);
  await partner.getByRole("button", { name: "Kapıyı aç" }).click();
  await expect(partner).toHaveURL(/\/gift$/);

  const advance = partner.getByRole("button", { name: "Devam et" });
  for (let i = 0; i < 3; i++) await advance.click();
  await partner.getByRole("button", { name: "Kurdeleyi çöz", exact: true }).click();
  await expect(partner.locator("article")).toContainText("Burada sana ait bir köşe var.", { timeout: 10_000 });
  await partner.getByRole("button", { name: "Devam", exact: true }).click();
  await partner.getByRole("button", { name: "İçeri gir" }).click();
  await expect(partner).toHaveURL(/127\.0\.0\.1:\d+\/$/);
  await expect(partner.getByText("Hoş geldin, Eln")).toBeVisible();
});

test("the invitation cannot be used twice", async ({ page }) => {
  await page.goto(inviteLink);
  await expect(page.getByText("Bu bağlantı artık açılmıyor")).toBeVisible();
});

test("the partner sees what is published and nothing that is sealed or draft", async () => {
  await partner.goto("/letters");
  const main = partner.locator("main");
  await expect(main).toContainText("E2E açık mektup");
  await expect(main).toContainText("E2E mühürlü mektup");
  await expect(main).not.toContainText("E2E taslak mektup");
  await expect(main).not.toContainText("MUHURLU-GOVDE");

  for (const key of ["mühürlü", "taslak"]) {
    await partner.goto(`/letters/${letters[key]}`);
    await expect(partner.getByText("Burada bir şey yok")).toBeVisible();
    await expect(partner.locator("body")).not.toContainText(/MUHURLU-GOVDE|TASLAK-GOVDE/);
  }

  await partner.goto("/gallery");
  await expect(partner.locator("figure button")).toHaveCount(1);

  await partner.goto("/studio");
  await expect(partner).toHaveURL(/127\.0\.0\.1:\d+\/$/);
});

test("no backend key or readable session token ever reaches the browser", async () => {
  await partner.goto("/gallery");
  const html = await partner.content();
  expect(html).not.toContain(env.SUPABASE_ANON_KEY);
  expect(html).not.toContain(env.SUPABASE_SERVICE_ROLE_KEY);
  expect(await partner.evaluate(() => document.cookie)).toBe("");
});

test("every room opens for both of them without errors", async () => {
  const rooms = ["/", "/story", "/gallery", "/letters", "/distance", "/days", "/days/eln-dogum-gunu", "/universe", "/reasons", "/song", "/future", "/journal", "/questions", "/voice", "/capsules", "/corner", "/account"];
  for (const [name, page] of [["owner", owner], ["partner", partner]] as const) {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(`${name}: ${error.message}`));
    for (const room of rooms) {
      const response = await page.goto(room);
      expect(response?.status(), `${name} ${room}`).toBe(200);
      await expect(page.locator("h1").first(), `${name} ${room}`).toBeVisible();
    }
    expect(errors).toEqual([]);
  }
  for (const screen of ["/studio", "/studio/opening", "/studio/photos", "/studio/story", "/studio/letters", "/studio/days", "/studio/reasons", "/studio/capsules", "/studio/texts", "/studio/invite", "/studio/trash"]) {
    const response = await owner.goto(screen);
    expect(response?.status(), screen).toBe(200);
  }
});

test("signing out closes the door", async () => {
  await partner.context().clearCookies();
  await partner.goto("/letters");
  await expect(partner).toHaveURL(/\/login/);
});
