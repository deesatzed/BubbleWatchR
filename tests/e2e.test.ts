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

    const markdown = await page.locator('article[data-covenant-id] a[href$="export.md"]').first().evaluate(async (link) =>
      (await fetch((link as HTMLAnchorElement).href)).text());
    match(markdown, /## Audit events/);
    match(markdown, /Supersedes:/);
  } finally {
    await page.close();
    await browser.close();
    await app.close();
  }
});

test("browser snapshot workflow imports, calculates, compares, and exports", async () => {
  const app = await startServer({ dbPath: ":memory:" });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  try {
    await page.goto(app.url);
    await page.locator("#manual-as-of").fill("2026-01-01");
    await page.locator("#manual-portfolio-name").fill("Browser Portfolio");
    await page.locator("#manual-source").fill("manual browser entry");
    await page.locator("#manual-positions").fill(JSON.stringify([
      { assetId: "alpha", symbolOrName: "Alpha", quantity: 1, price: 1000, aiExposureFraction: 1, accountGroup: "main" },
    ]));
    await page.getByRole("button", { name: "Save manual snapshot" }).click();
    await page.locator("article.snapshot-card").waitFor();
    match(await page.locator("article.snapshot-card").first().innerText(), /Total value: 1000\.00/);

    await page.locator("#csv-source").fill("browser CSV import");
    await page.locator("#csv-data").fill([
      "as_of,portfolio_name,asset_id,symbol_or_name,quantity,price,market_value,ai_exposure_fraction,account_group",
      "2026-02-01,Browser Portfolio,alpha,Alpha,1,450,450,,main",
      "2026-02-01,Browser Portfolio,beta,Beta,1,450,450,0,main",
    ].join("\n"));
    await page.getByRole("button", { name: "Import CSV snapshot" }).click();
    await page.locator("article.snapshot-card").nth(1).waitFor();
    strictEqual(await page.locator("article.snapshot-card").count(), 2);
    match(await page.locator("body").innerText(), /Unknown \/ incomplete/);
    match(await page.locator("body").innerText(), /Compared with/);
    match(await page.locator("body").innerText(), /Observed drawdown: -10\.00%/);

    const markdown = await page.locator('a[href$="export.md"]').last().evaluate(async (link) =>
      (await fetch((link as HTMLAnchorElement).href)).text());
    match(markdown, /Unknown \/ incomplete/);
    match(markdown, /calculation version/i);
    match(markdown, /Cash-flow treatment: not modeled/);
  } finally {
    await page.close();
    await browser.close();
    await app.close();
  }
});

test("browser trigger workflow defines all seven triggers, evaluates, and exports", async () => {
  const app = await startServer({ dbPath: ":memory:" });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const definitions = [
    "ai_exposure",
    "single_position_concentration",
    "trailing_drawdown",
    "trailing_volatility",
    "appreciation_concentration",
    "scheduled_review",
    "overdue_review",
  ].map((type) => ({
    type,
    enabled: true,
    entryThreshold: 0.35,
    exitThreshold: 0.32,
    persistenceObservations: 1,
    clearingPersistenceObservations: 1,
    cooldownMs: 1209600000,
    severity: "normal",
    missingDataPolicy: "hold_prior_state",
    reviewInstructions: "Review this predefined condition.",
    settings: type === "trailing_volatility"
      ? { lookbackObservations: 2, annualizationFactor: 1 }
      : type === "scheduled_review"
        ? { scheduledAt: "2026-01-01T00:00:00.000Z", timezone: "UTC" }
        : type === "overdue_review"
          ? { reviewIntervalMs: 1, timezone: "UTC", reviewClock: "approval" }
          : {},
  }));
  try {
    await page.goto(app.url);
    await page.locator("#name").fill("Trigger Covenant");
    await page.locator("#purpose").fill("Keep review decisions deliberate.");
    await page.locator("#coveredExposure").fill("Saved portfolio observations");
    await page.locator("#objective").fill("Preserve participation with a written policy.");
    await page.locator("#timeHorizon").fill("10 years");
    await page.locator("#maximumIntendedConcentration").fill("0.35");
    await page.locator("#maximumTolerableDrawdown").fill("0.25");
    await page.locator("#reviewRules").fill("Review any confirmed trigger");
    await page.locator("#candidateActions").fill("Review the policy");
    await page.locator("#falsifiers").fill("The observation is invalid");
    await page.locator("#deescalationConditions").fill("The condition clears");
    await page.locator("#reentryConditions").fill("The policy remains valid");
    await page.locator("#cooldownPolicy").fill("Fourteen days");
    await page.getByRole("button", { name: "Save draft" }).click();
    await page.locator("article.card").filter({ hasText: "Trigger Covenant" }).waitFor();
    await page.getByRole("button", { name: "Approve and lock" }).click();
    const triggerForm = page.locator("[data-trigger-form]");
    await triggerForm.waitFor();
    await triggerForm.locator("textarea").fill(JSON.stringify(definitions));
    await triggerForm.getByRole("button", { name: "Save trigger definitions" }).click();
    await page.getByText("7 trigger definitions", { exact: false }).waitFor();

    await page.locator("#manual-as-of").fill("2026-03-01");
    await page.locator("#manual-portfolio-name").fill("Trigger Portfolio");
    await page.locator("#manual-source").fill("trigger browser fixture");
    await page.locator("#manual-positions").fill(JSON.stringify([
      { assetId: "alpha", symbolOrName: "Alpha", quantity: 1, price: 600, aiExposureFraction: 0, accountGroup: "main" },
      { assetId: "beta", symbolOrName: "Beta", quantity: 1, price: 400, aiExposureFraction: 0, accountGroup: "main" },
    ]));
    await page.getByRole("button", { name: "Save manual snapshot" }).click();
    await page.locator("article.snapshot-card").waitFor();
    await page.getByRole("button", { name: "Evaluate all triggers" }).click();
    await page.getByText("Trigger evaluation complete", { exact: false }).waitFor();
    match(await page.locator("body").innerText(), /trailing_volatility[\s\S]*unavailable/i);
    match(await page.locator("body").innerText(), /scheduled_review[\s\S]*review/i);
    await page.reload();
    await Promise.all([
      page.waitForResponse((response) => response.url().includes("/acknowledge") && response.status() === 200),
      page.getByRole("button", { name: "Acknowledge trigger" }).first().click(),
    ]);
    await page.reload();
    await Promise.all([
      page.waitForResponse((response) => response.url().includes("/review-complete") && response.status() === 200),
      page.getByRole("button", { name: "Complete minimal review" }).first().click(),
    ]);
    await page.reload();
    await page.getByText("cooldown", { exact: false }).first().waitFor();
    match(await page.locator("body").innerText(), /cooldown/i);

    const markdown = await page.locator('a[href$="triggers/export.md"]').evaluate(async (link) =>
      (await fetch((link as HTMLAnchorElement).href)).text());
    for (const type of ["ai_exposure", "single_position_concentration", "trailing_drawdown", "trailing_volatility", "appreciation_concentration", "scheduled_review", "overdue_review"]) {
      match(markdown, new RegExp(type));
    }
  } finally {
    await page.close();
    await browser.close();
    await app.close();
  }
});
