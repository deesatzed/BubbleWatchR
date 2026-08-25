import { strictEqual, ok } from "node:assert/strict";
import { mkdirSync } from "node:fs";
import { chromium } from "playwright";
import { startServer } from "../dist/apps/web/server.js";

const viewports = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "tablet", width: 768, height: 900 },
  { name: "mobile", width: 390, height: 844 },
];

const app = await startServer({ dbPath: ":memory:" });
const browser = await chromium.launch({ headless: true });
mkdirSync(".impeccable/review", { recursive: true });
try {
  for (const viewport of viewports) {
    const page = await browser.newPage({ viewport });
    try {
      await page.goto(app.url);
      await page.evaluate(() => document.fonts.ready);
      const layout = await page.evaluate(() => {
        const formGrid = document.querySelector(".form-grid");
        const buttons = [...document.querySelectorAll("button")].filter((button) => button.getBoundingClientRect().width > 0);
        const copyInViewport = [...document.querySelectorAll("[data-use-example]")].some((button) => {
          const rect = button.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0 && rect.top >= 0 && rect.bottom <= window.innerHeight;
        });
        return {
          overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
          nav: getComputedStyle(document.querySelector("nav")).display !== "none",
          main: Boolean(document.querySelector("main#main-content")),
          formColumns: formGrid ? getComputedStyle(formGrid).gridTemplateColumns.split(" ").length : 0,
          minButtonHeight: Math.min(...buttons.map((button) => button.getBoundingClientRect().height)),
          fontLoaded: document.fonts.check('16px "Decision Sans"'),
          copyInViewport,
        };
      });
      strictEqual(layout.overflow, false, `${viewport.name}: horizontal overflow`);
      strictEqual(layout.nav, true, `${viewport.name}: section navigation is hidden`);
      strictEqual(layout.main, true, `${viewport.name}: main landmark missing`);
      strictEqual(layout.fontLoaded, true, `${viewport.name}: self-hosted display font did not load`);
      ok(layout.minButtonHeight >= 44, `${viewport.name}: button target is smaller than 44px`);
      if (viewport.name === "desktop" || viewport.name === "mobile") strictEqual(layout.copyInViewport, true, `${viewport.name}: no example-copy action in the first viewport`);
      if (viewport.width >= 768) ok(layout.formColumns >= 2, `${viewport.name}: snapshot forms did not form columns`);
      else strictEqual(layout.formColumns, 1, `${viewport.name}: snapshot forms should stack`);
      await page.screenshot({ path: `.impeccable/review/${viewport.name}.png`, fullPage: false });
      await page.evaluate(() => document.activeElement instanceof HTMLElement && document.activeElement.blur());
      await page.keyboard.press("Tab");
      strictEqual(await page.evaluate(() => document.activeElement?.className), "skip-link", `${viewport.name}: keyboard focus did not start at the skip link`);
    } finally {
      await page.close();
    }
  }

  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  try {
    await page.goto(app.url);
    await page.locator("#manual-as-of").fill("2026-08-25");
    await page.locator("#manual-portfolio-name").fill("Recovery check");
    await page.locator("#manual-source").fill("responsive verification");
    await page.getByText("Advanced: positions JSON", { exact: true }).click();
    await page.locator("#manual-positions").fill("{not valid json");
    await page.getByRole("button", { name: "Save manual snapshot" }).click();
    await page.waitForFunction(() => document.querySelector("#snapshot-status")?.textContent?.includes("JSON"));
    strictEqual(await page.locator("#manual-positions").getAttribute("aria-invalid"), "true");
    strictEqual(await page.evaluate(() => document.activeElement?.id), "manual-positions");

    await page.locator("#manual-positions").fill(JSON.stringify([{ assetId: "alpha", symbolOrName: "Alpha", quantity: 1, price: 100, aiExposureFraction: null, accountGroup: "main" }]));
    await Promise.all([
      page.waitForNavigation({ waitUntil: "domcontentloaded" }),
      page.getByRole("button", { name: "Save manual snapshot" }).click(),
    ]);
    await page.waitForFunction(() => document.querySelector("#snapshot-status")?.textContent?.includes("Snapshot saved"));
    strictEqual(new URL(page.url()).hash, "#snapshots");
    strictEqual(await page.locator("article.snapshot-card").count(), 1);
    await page.locator('a[href="#history"]').first().click();
    await page.waitForURL(/#history$/);
    await page.goBack();
    strictEqual(new URL(page.url()).hash, "#snapshots");
    await page.reload();
    strictEqual(await page.locator("article.snapshot-card").count(), 1);
  } finally {
    await page.close();
  }

  for (const viewport of [
    { name: "returning-desktop", width: 1440, height: 900 },
    { name: "returning-mobile", width: 390, height: 844 },
  ]) {
    const returningPage = await browser.newPage({ viewport });
    try {
      await returningPage.goto(app.url);
      await returningPage.evaluate(() => document.fonts.ready);
      await returningPage.locator("[data-workstation-summary]").waitFor();
      strictEqual(await returningPage.getByText("Make the decision process before the moment gets loud.", { exact: true }).count(), 0, `${viewport.name}: first-use introduction did not contract`);
      await returningPage.getByRole("heading", { name: "Explore another starting point." }).waitFor();
      await returningPage.screenshot({ path: `.impeccable/review/${viewport.name}.png`, fullPage: false });
    } finally {
      await returningPage.close();
    }
  }
  console.log("responsive browser verification passed: desktop 1440, tablet 768, mobile 390; focus, overflow, targets, invalid recovery, and success context verified");
} finally {
  await browser.close();
  await app.close();
}
