import { strictEqual, match } from "node:assert/strict";
import { test } from "node:test";
import { chromium } from "playwright";
import { startServer } from "../apps/web/server.js";

test("browser workflow creates, locks, supersedes, and exports a covenant", async () => {
  const app = await startServer({ dbPath: ":memory:" });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  try {
    await page.goto(app.url);
    await page.locator("#name").fill("Browser Covenant");
    await page.locator("#purpose").fill("Keep review decisions deliberate.");
    await page.locator("#coveredExposure").fill("AI-related exposure");
    await page.locator("#objective").fill("Preserve participation with a written policy.");
    await page.locator("#timeHorizon").fill("10 years");
    await page.locator("#maximumIntendedConcentration").fill("0.35");
    await page.locator("#maximumTolerableDrawdown").fill("0.25");
    await page.locator("#reviewRules").fill("Exposure exceeds the maximum");
    await page.locator("#candidateActions").fill("Review the policy\nDefer with a reason");
    await page.locator("#falsifiers").fill("The data is stale");
    await page.locator("#deescalationConditions").fill("Exposure returns below exit");
    await page.locator("#reentryConditions").fill("The objective remains valid");
    await page.locator("#cooldownPolicy").fill("Fourteen days");
    await page.locator("#notes").fill("Browser-authored test policy");
    await page.getByRole("button", { name: "Save draft" }).click();
    const firstCard = page.locator("article.card");
    await firstCard.waitFor();
    match(await firstCard.innerText(), /draft/);

    await page.getByRole("button", { name: "Approve and lock" }).click();
    await page.locator("article.card > p").filter({ hasText: /approved/ }).first().waitFor();
    strictEqual(await page.getByRole("button", { name: "Approve and lock" }).count(), 0);

    const mutationAttempt = await page.evaluate(async () => {
      const response = await fetch(document.querySelector("[data-covenant-id]")?.getAttribute("data-covenant-id")
        ? `/api/covenants/${document.querySelector("[data-covenant-id]")?.getAttribute("data-covenant-id")}/approve`
        : "/api/covenants/missing/approve", { method: "POST" });
      return response.status;
    });
    strictEqual(mutationAttempt, 400);

    await page.getByRole("button", { name: "Create successor draft" }).click();
    await page.getByText("Version 2", { exact: false }).waitFor();
    strictEqual(await page.locator("article.card").count(), 2);
    match(await page.locator("body").innerText(), /Version 1[\s\S]*approved/);
    match(await page.locator("body").innerText(), /Version 2[\s\S]*draft/);

    const markdown = await page.locator('a[href$="export.md"]').first().evaluate(async (link) =>
      (await fetch((link as HTMLAnchorElement).href)).text());
    match(markdown, /## Audit events/);
    match(markdown, /Supersedes:/);
  } finally {
    await page.close();
    await browser.close();
    await app.close();
  }
});
