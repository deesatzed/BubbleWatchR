import { deepStrictEqual, strictEqual, match } from "node:assert/strict";
import { test } from "node:test";
import { chromium } from "playwright";
import { startServer } from "../apps/web/server.js";

test("first use explores twelve fictional examples without persisting demo data", async () => {
  const app = await startServer({ dbPath: ":memory:" });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  try {
    await page.goto(app.url);

    await page.getByText("Make the decision process before the moment gets loud.", { exact: true }).waitFor();
    await page.locator("[data-example-detail]:visible").getByText("Fictional walkthrough", { exact: true }).waitFor();
    strictEqual(await page.locator("[data-example-card]").count(), 12);

    for (const [packName, expectedExample] of [
      ["AI and thematic exposure", "Evidence-first participation"],
      ["Employer and single-stock exposure", "Vesting accumulation review"],
      ["Drawdown and volatility", "Drawdown with data-quality checks"],
      ["Scheduled policy review", "Quarterly policy check"],
    ] as const) {
      await page.getByRole("button", { name: packName, exact: true }).click();
      strictEqual(await page.locator("[data-example-card]:visible").count(), 3);
      match(await page.locator("[data-example-card]:visible").allInnerTexts().then((items) => items.join("\n")), new RegExp(expectedExample));
    }

    await page.getByRole("button", { name: "AI and thematic exposure", exact: true }).click();
    await page.getByRole("button", { name: /Evidence-first participation/ }).click();
    const demo = page.locator("[data-example-detail]:visible");
    await demo.getByText("Policy written", { exact: true }).waitFor();
    await demo.getByText("Observation changed", { exact: true }).waitFor();
    await demo.getByText("Condition ready for review", { exact: true }).waitFor();
    await demo.getByText("Review recorded", { exact: true }).waitFor();
    await demo.getByText("Cooldown", { exact: true }).waitFor();
    await demo.getByText("Tradeoffs", { exact: true }).waitFor();
    await demo.getByText("May not fit", { exact: true }).waitFor();
    await demo.getByRole("button", { name: "Use as my starting point" }).waitFor();
    await page.getByRole("button", { name: "Start blank" }).waitFor();

    await page.getByRole("button", { name: "Reset example" }).click();
    const persisted = await page.evaluate(async () => {
      const [covenants, snapshots] = await Promise.all([
        fetch("/api/covenants").then((response) => response.json()),
        fetch("/api/snapshots").then((response) => response.json()),
      ]);
      return { covenantCount: covenants.covenants.length, snapshotCount: snapshots.snapshots.length };
    });
    strictEqual(persisted.covenantCount, 0);
    strictEqual(persisted.snapshotCount, 0);
  } finally {
    await page.close();
    await browser.close();
    await app.close();
  }
});

test("an example becomes an editable personal draft without copying fictional records", async () => {
  const app = await startServer({ dbPath: ":memory:" });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  try {
    await page.goto(app.url);
    await page.getByRole("button", { name: /Evidence-first participation/ }).click();
    await page.locator("[data-example-detail]:visible").getByRole("button", { name: "Use as my starting point" }).click();

    await page.locator("#covenant-form").waitFor();
    strictEqual(await page.locator("#name").inputValue(), "AI evidence-first participation");
    strictEqual(await page.locator("#maximumIntendedConcentration").inputValue(), "40");
    strictEqual(await page.locator("#maximumTolerableDrawdown").inputValue(), "25");
    match(await page.locator("#falsifiers").inputValue(), /classification changed/i);

    await page.locator("#name").fill("Jordan's customized AI policy");
    for (const value of ["0", "25", "100"]) {
      await page.locator("#maximumIntendedConcentration").fill(value);
      strictEqual(await page.locator("#maximumIntendedConcentration").evaluate((input) => (input as HTMLInputElement).checkValidity()), true);
    }
    await page.locator("#maximumIntendedConcentration").fill("101");
    strictEqual(await page.locator("#maximumIntendedConcentration").evaluate((input) => (input as HTMLInputElement).checkValidity()), false);
    await page.locator("#maximumIntendedConcentration").fill("");
    strictEqual(await page.locator("#maximumIntendedConcentration").evaluate((input) => (input as HTMLInputElement).checkValidity()), false);
    await page.locator("#maximumIntendedConcentration").fill("37");
    await page.locator("#notes").fill("");
    const beforeSave = await page.evaluate(async () => (await fetch("/api/covenants")).json());
    strictEqual(beforeSave.covenants.length, 0);

    await page.getByRole("button", { name: "Save draft" }).click();
    await page.locator("article[data-covenant-id]").waitFor();
    const persisted = await page.evaluate(async () => {
      const [covenants, snapshots] = await Promise.all([
        fetch("/api/covenants").then((response) => response.json()),
        fetch("/api/snapshots").then((response) => response.json()),
      ]);
      return { covenants: covenants.covenants, snapshots: snapshots.snapshots };
    });
    strictEqual(persisted.covenants.length, 1);
    strictEqual(persisted.covenants[0].maximumIntendedConcentration, 0.37);
    strictEqual(persisted.covenants[0].notes, "");
    strictEqual(persisted.snapshots.length, 0);
    strictEqual(await page.locator("[data-trigger-id]").count(), 0);
    strictEqual(await page.locator("[data-review-form]").count(), 0);
  } finally {
    await page.close();
    await browser.close();
    await app.close();
  }
});

test("browser workflow creates, locks, supersedes, and exports a covenant", async () => {
  const app = await startServer({ dbPath: ":memory:" });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  try {
    await page.goto(app.url);
    await page.getByRole("button", { name: "Start blank" }).click();
    await page.locator("#name").fill("Browser Covenant");
    await page.locator("#purpose").fill("Keep review decisions deliberate.");
    await page.locator("#coveredExposure").fill("AI-related exposure");
    await page.locator("#objective").fill("Preserve participation with a written policy.");
    await page.locator("#timeHorizon").fill("10 years");
    await page.locator("#maximumIntendedConcentration").fill("35");
    await page.locator("#maximumTolerableDrawdown").fill("25");
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
    await page.getByText("Version 2", { exact: true }).waitFor();
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
    await page.getByText("Advanced: positions JSON", { exact: true }).click();
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

test("browser position rows add, edit, remove, and save deterministic observations", async () => {
  const app = await startServer({ dbPath: ":memory:" });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  try {
    await page.goto(app.url);
    await page.locator("#manual-as-of").fill("2026-04-01");
    await page.locator("#manual-portfolio-name").fill("Row Entry Portfolio");
    await page.locator("#manual-source").fill("human-readable rows");

    const first = page.locator("[data-position-row]").first();
    await first.locator('[data-position-field="assetId"]').fill("alpha");
    await first.locator('[data-position-field="symbolOrName"]').fill("Alpha");
    await first.locator('[data-position-field="quantity"]').fill("2");
    await first.locator('[data-position-field="price"]').fill("100");
    await first.locator('[data-position-field="aiExposurePercent"]').fill("50");
    await first.locator('[data-position-field="accountGroup"]').fill("main");

    await page.getByRole("button", { name: "Add position" }).click();
    const second = page.locator("[data-position-row]").nth(1);
    await second.locator('[data-position-field="assetId"]').fill("beta");
    await second.locator('[data-position-field="symbolOrName"]').fill("Beta");
    await second.locator('[data-position-field="quantity"]').fill("1");
    await second.locator('[data-position-field="price"]').fill("200");
    await second.locator('[data-position-field="aiExposurePercent"]').fill("0");
    await second.locator('[data-position-field="accountGroup"]').fill("retirement");

    await page.getByRole("button", { name: "Add position" }).click();
    strictEqual(await page.locator("[data-position-row]").count(), 3);
    await page.locator("[data-position-row]").last().getByRole("button", { name: "Remove position" }).click();
    strictEqual(await page.locator("[data-position-row]").count(), 2);
    deepStrictEqual(await first.locator("input").evaluateAll((inputs) => inputs.map((input) => input.getAttribute("data-position-field"))), ["assetId", "symbolOrName", "quantity", "price", "marketValue", "aiExposurePercent", "accountGroup"]);

    await page.getByRole("button", { name: "Save manual snapshot" }).click();
    const card = page.locator("article.snapshot-card");
    await card.waitFor();
    match(await card.innerText(), /Total value: 400\.00/);
    match(await card.innerText(), /AI exposure: 25\.00%/);
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
    await page.getByRole("button", { name: "Start blank" }).click();
    await page.locator("#name").fill("Trigger Covenant");
    await page.locator("#purpose").fill("Keep review decisions deliberate.");
    await page.locator("#coveredExposure").fill("Saved portfolio observations");
    await page.locator("#objective").fill("Preserve participation with a written policy.");
    await page.locator("#timeHorizon").fill("10 years");
    await page.locator("#maximumIntendedConcentration").fill("35");
    await page.locator("#maximumTolerableDrawdown").fill("25");
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
    await triggerForm.getByText("Advanced: trigger definitions JSON", { exact: true }).click();
    await triggerForm.getByLabel("Trigger definitions as JSON").fill(JSON.stringify(definitions));
    await triggerForm.getByRole("button", { name: "Save trigger definitions" }).click();
    await page.getByText("7 trigger definitions", { exact: false }).waitFor();

    await page.locator("#manual-as-of").fill("2026-03-01");
    await page.locator("#manual-portfolio-name").fill("Trigger Portfolio");
    await page.locator("#manual-source").fill("trigger browser fixture");
    await page.getByText("Advanced: positions JSON", { exact: true }).click();
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

test("guided condition controls serialize all seven deterministic trigger types", async () => {
  const app = await startServer({ dbPath: ":memory:" });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ timezoneId: "UTC" });
  try {
    await page.goto(app.url);
    const covenantId = await page.evaluate(async () => {
      const input = {
        name: "Guided conditions", purpose: "Test human-readable trigger controls.", coveredExposure: "Saved portfolio", objective: "Keep reviews deterministic.", timeHorizon: "5 years",
        maximumIntendedConcentration: 0.35, maximumTolerableDrawdown: 0.25, reviewRules: ["Review active conditions"], candidateActions: ["Continue policy"], falsifiers: ["Data is incomplete"], deescalationConditions: ["Condition clears"], reentryConditions: ["Objective remains valid"], cooldownPolicy: "14 days", notes: "Browser fixture",
      };
      const created = await fetch("/api/covenants", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(input) }).then((response) => response.json());
      const approved = await fetch("/api/covenants/" + created.covenant.id + "/approve", { method: "POST" }).then((response) => response.json());
      return approved.covenant.id;
    });
    await page.reload();
    const form = page.locator("[data-trigger-form]");
    await form.waitFor();
    strictEqual(await form.locator("[data-condition-config]").count(), 7);
    await form.locator('[data-condition-config="ai_exposure"] [data-config-field="entryPercent"]').fill("41");
    await form.getByRole("button", { name: "Save trigger definitions" }).click();
    await page.getByText("7 trigger definitions saved", { exact: false }).waitFor();
    const saved = await page.evaluate(async (id) => fetch("/api/covenants/" + id + "/triggers").then((response) => response.json()), covenantId);
    strictEqual(saved.definitions.length, 7);
    strictEqual(saved.definitions.find((definition: { type: string }) => definition.type === "ai_exposure").entryThreshold, 0.41);
    strictEqual(saved.definitions.find((definition: { type: string }) => definition.type === "scheduled_review").settings.timezone, "America/New_York");
    strictEqual(saved.definitions.find((definition: { type: string }) => definition.type === "scheduled_review").settings.scheduledAt, "2026-10-01T14:00:00.000Z");
  } finally {
    await page.close();
    await browser.close();
    await app.close();
  }
});

test("browser structured review workflow records a bounded decision and closes linked cooldown", async () => {
  const app = await startServer({ dbPath: ":memory:" });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const covenantInput = {
    name: "Structured Review Covenant",
    purpose: "Record deliberate review decisions.",
    coveredExposure: "Saved portfolio observations",
    objective: "Preserve a written policy.",
    timeHorizon: "10 years",
    maximumIntendedConcentration: 0.35,
    maximumTolerableDrawdown: 0.25,
    reviewRules: ["Review active conditions"],
    candidateActions: ["Review the policy"],
    falsifiers: ["The observation is stale"],
    deescalationConditions: ["The condition clears"],
    reentryConditions: ["The policy remains valid"],
    cooldownPolicy: "14 days",
    notes: "Browser review fixture",
  };
  const trigger = {
    type: "single_position_concentration",
    enabled: true,
    entryThreshold: 0.35,
    exitThreshold: 0.32,
    persistenceObservations: 1,
    clearingPersistenceObservations: 1,
    cooldownMs: 1209600000,
    severity: "normal",
    missingDataPolicy: "hold_prior_state",
    reviewInstructions: "Review the predefined condition.",
    settings: {},
  };
  try {
    await page.goto(app.url);
    const ids = await page.evaluate(async ({ covenantInput, trigger }) => {
      const create = await fetch("/api/covenants", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(covenantInput) });
      const draft = await create.json();
      const approve = await fetch(`/api/covenants/${draft.covenant.id}/approve`, { method: "POST" });
      const approved = await approve.json();
      const saved = await fetch(`/api/covenants/${approved.covenant.id}/triggers`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ definitions: [trigger] }) });
      const definitions = await saved.json();
      const snapshot = await fetch("/api/snapshots/manual", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ asOf: "2026-08-01", portfolioName: "Review Portfolio", source: "manual", sourceReference: "browser-review", positions: [{ assetId: "alpha", symbolOrName: "Alpha", quantity: 80, price: 1, aiExposureFraction: 0, accountGroup: "main" }, { assetId: "beta", symbolOrName: "Beta", quantity: 20, price: 1, aiExposureFraction: 0, accountGroup: "main" }] }) });
      const savedSnapshot = await snapshot.json();
      return { covenantId: approved.covenant.id, triggerId: definitions.definitions[0].id, snapshotId: savedSnapshot.snapshot.id };
    }, { covenantInput, trigger });
    await page.reload();
    await page.getByRole("button", { name: "Evaluate all triggers" }).click();
    await page.getByText("Trigger evaluation complete", { exact: false }).waitFor();
    await page.reload();
    await page.getByRole("button", { name: /Open structured review/ }).click();
    const reviewForm = page.locator("[data-review-form]");
    await reviewForm.waitFor();
    await reviewForm.locator('[data-field="factualObservations"]').fill("The saved concentration observation is above the entry threshold.");
    await reviewForm.locator('[data-field="falsifierCheck"]').fill("I checked the saved source and timestamp for staleness.");
    await reviewForm.locator('[data-field="decision"]').selectOption("continue_policy");
    await reviewForm.locator('[data-field="rationale"]').fill("The policy remains deliberate and the condition is documented.");
    await reviewForm.getByRole("button", { name: "Complete structured review" }).click();
    await page.getByText("continue_policy", { exact: false }).waitFor();
    match(await page.locator("body").innerText(), /Completed review history/);
    match(await page.locator("body").innerText(), /cooldown/);
    const markdown = await page.locator('a[href$="/export.md"]').filter({ hasText: "Export review Markdown" }).evaluate(async (link) => (await fetch((link as HTMLAnchorElement).href)).text());
    match(markdown, /Factual observations/);
    match(markdown, /Falsifier check/);
    match(markdown, /continue_policy/);
    match(markdown, /Covenant version/);
    strictEqual(ids.triggerId.length > 0, true);
  } finally {
    await page.close();
    await browser.close();
    await app.close();
  }
});
