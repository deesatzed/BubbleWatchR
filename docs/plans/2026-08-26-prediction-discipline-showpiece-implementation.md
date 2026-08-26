# Prediction Discipline Showpiece Implementation Plan

> **For Codex:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Ship an explicitly fictional Aurora Compute Cycle showpiece at `/` and preserve the complete existing Decision Covenant product at `/workspace`.

**Architecture:** Add a deeply immutable typed showpiece manifest under `packages/examples/`, render it through a new dependency-free `apps/web/landing.ts` module, and route `/` separately from the existing workspace renderer. Keep all APIs, SQLite schemas, personal records, existing example packs, and deterministic product behavior unchanged.

**Tech Stack:** Node.js 24, strict TypeScript 5.9, server-rendered HTML/CSS, small progressive-enhancement JavaScript, built-in `node:http`, built-in `node:sqlite`, Node test runner, Playwright Chromium, self-hosted Manrope.

---

## Implementation Rules

- Follow `@test-driven-development` for each behavioral slice.
- Follow `@impeccable` in Persuade mode for the landing surface; run one desktop/mobile inspection batch, one repair batch, and at most one confirmation batch.
- Keep the five existing untracked `Docs_*_2026-08-26.md` files untouched and unstaged.
- Use exact-path `git add` commands.
- Do not add a runtime dependency, external asset, telemetry, provider call, API route, database table, or persistence side effect.
- Do not weaken the existing four-pack/twelve-example assertions.
- Do not represent Aurora as real data, a generated forecast, model performance, advice, or a customer result.

### Task 1: Add the typed Aurora showpiece contract

**Files:**

- Modify: `packages/examples/types.ts`
- Create: `packages/examples/showpiece.ts`
- Modify: `packages/examples/index.ts`
- Modify: `tests/examples.test.ts`

**Step 1: Write the failing manifest tests**

Extend `tests/examples.test.ts` to import `AURORA_SHOWPIECE` and assert:

```ts
test("ships one immutable five-stage prediction-discipline showpiece", () => {
  strictEqual(AURORA_SHOWPIECE.fictional, true);
  strictEqual(AURORA_SHOWPIECE.id, "aurora-compute-cycle");
  deepStrictEqual(AURORA_SHOWPIECE.stages.map((stage) => stage.state), [
    "precommit",
    "observe",
    "converge",
    "challenge",
    "record",
  ]);
  strictEqual(Object.isFrozen(AURORA_SHOWPIECE), true);
  strictEqual(AURORA_SHOWPIECE.stages.every(Object.isFrozen), true);
});

test("showpiece preserves unavailable evidence and bounded human disposition", () => {
  const observe = AURORA_SHOWPIECE.stages[1]!;
  ok(observe.metrics.some((metric) => metric.status === "unavailable"));
  const record = AURORA_SHOWPIECE.stages[4]!;
  strictEqual(record.review?.decision, "defer_review");
  ok(record.review?.followUpAt);
  ok(AURORA_SHOWPIECE.productBoundary.didNot.some((item) => /forecast|probability/i.test(item)));
});

test("showpiece language is fictional and non-prescriptive", () => {
  const serialized = JSON.stringify(AURORA_SHOWPIECE);
  match(serialized, /fictional/i);
  doesNotMatch(serialized, /\b(buy|sell|recommended|should trade|will outperform)\b/i);
});
```

**Step 2: Run the focused test to prove it fails**

Run:

```bash
npm run build && node --test dist/tests/examples.test.js
```

Expected: FAIL because `AURORA_SHOWPIECE` and its types do not exist.

**Step 3: Add explicit showpiece types**

Add to `packages/examples/types.ts`:

```ts
export type ShowpieceMetricStatus = "available" | "unavailable" | "watch" | "review" | "cooldown";

export type ShowpieceStage = DeepReadonly<{
  id: string;
  state: "precommit" | "observe" | "converge" | "challenge" | "record";
  step: string;
  eyebrow: string;
  headline: string;
  narrative: string;
  asOf: string;
  metrics: Array<{
    label: string;
    value: string;
    detail: string;
    status: ShowpieceMetricStatus;
  }>;
  conditions: Array<{
    label: string;
    state: TriggerStateName | "unavailable";
    detail: string;
  }>;
  evidence: string[];
  contraryEvidence: string[];
  falsifierCheck: string | null;
  review: null | {
    decision: "continue_policy" | "deescalate" | "defer_review" | "create_successor";
    rationale: string;
    followUpAt: string | null;
    cooldownDays: number;
  };
}>;

export type PredictionDisciplineShowpiece = DeepReadonly<{
  id: string;
  fictional: true;
  title: string;
  subtitle: string;
  audience: string;
  framing: string;
  stages: ShowpieceStage[];
  productBoundary: {
    did: string[];
    didNot: string[];
  };
}>;
```

**Step 4: Create and deeply freeze Aurora**

Create `packages/examples/showpiece.ts`. Use one local `deepFreeze` helper and export one `AURORA_SHOWPIECE` object with exactly five stages. Required story facts:

- Precommit: 31% AI exposure baseline, 24% largest position, written 38%/28% review entries, explicit falsifiers.
- Observe: 39% AI exposure, 29% largest position, volatility `Unavailable — two comparable observations required`.
- Converge: AI exposure and concentration both in review; aggregate state escalated review; unavailable volatility remains separate.
- Challenge: contrary evidence includes incomplete classification, same-date/account-scope check, and no causal inference from co-movement.
- Record: `defer_review`, dated follow-up `2026-10-15T14:00:00.000Z`, 14-day cooldown, immutable rationale.
- Boundary: the product stored policy/evidence/decision and evaluated deterministic conditions; it did not generate a forecast/probability, recommend a trade, execute an order, or resolve uncertainty.

**Step 5: Export the manifest and types**

Update `packages/examples/index.ts`:

```ts
export { EXAMPLE_PACKS } from "./manifests.js";
export { AURORA_SHOWPIECE } from "./showpiece.js";
export type {
  CovenantExample,
  ExamplePack,
  ExamplePackId,
  FictionalExampleStory,
  FictionalObservation,
  FictionalStoryStage,
  PredictionDisciplineShowpiece,
  ShowpieceMetricStatus,
  ShowpieceStage,
} from "./types.js";
```

**Step 6: Run focused tests**

Run:

```bash
npm run build && node --test dist/tests/examples.test.js
```

Expected: all example tests pass; existing assertions still report four packs with three examples each.

**Step 7: Commit the domain slice**

```bash
git add packages/examples/types.ts packages/examples/showpiece.ts packages/examples/index.ts tests/examples.test.ts
git commit -m "feat: add Aurora prediction discipline showpiece"
```

### Task 2: Establish the landing/workspace route boundary

**Files:**

- Create: `apps/web/landing.ts`
- Modify: `apps/web/server.ts`
- Modify: `tests/ui-content.test.ts`

**Step 1: Write failing route/content tests**

Add a test that starts an in-memory server and fetches both routes:

```ts
test("root presents the prediction-discipline landing page and workspace stays separate", async () => {
  const app = await startServer({ dbPath: ":memory:" });
  try {
    const landing = await fetch(`${app.url}/`).then((response) => response.text());
    match(landing, /The prediction is not the decision\./);
    match(landing, /The Aurora Compute Cycle/);
    match(landing, /Fictional scenario/);
    match(landing, /href="\/workspace"/);
    doesNotMatch(landing, /id="covenant-form"/);

    const workspace = await fetch(`${app.url}/workspace`).then((response) => response.text());
    match(workspace, /id="covenant-form"/);
    match(workspace, /Four situations\. Three distinct policy philosophies/);
    doesNotMatch(workspace, /The Aurora Compute Cycle/);
  } finally {
    await app.close();
  }
});
```

Update existing UI-content tests to request `/workspace` when they inspect the product surface.

**Step 2: Run focused content tests to prove failure**

Run:

```bash
npm run build && node --test dist/tests/ui-content.test.js
```

Expected: FAIL because `/` still renders the workspace and `/workspace` is 404.

**Step 3: Create a minimal semantic landing renderer**

Create `apps/web/landing.ts` with:

```ts
import { AURORA_SHOWPIECE } from "../../packages/examples/index.js";

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function landingPage(): string {
  // Render semantic header/main/footer, hero, all five Aurora stages,
  // anatomy, four use-case families, trust architecture, and final CTA.
  // Keep all stages in the server HTML; JavaScript enhancement is Task 3.
}
```

At this step, prioritize correct content/landmarks/routes over final craft. Include no loose unescaped manifest value.

**Step 4: Split the routes without changing APIs**

In `apps/web/server.ts`:

- import `landingPage`;
- rename local `page(db)` to `workspacePage(db)`;
- route `GET /` to `landingPage()`;
- route `GET /workspace` to `workspacePage(db)`;
- leave font and `/api/*` route order/behavior unchanged.

**Step 5: Run focused content and existing domain tests**

Run:

```bash
npm run build && node --test dist/tests/ui-content.test.js dist/tests/unit.test.js
```

Expected: PASS.

**Step 6: Commit the route slice**

```bash
git add apps/web/landing.ts apps/web/server.ts tests/ui-content.test.ts
git commit -m "feat: separate landing page from decision workspace"
```

### Task 3: Build the Evidence Theater interaction and visual system

**Files:**

- Modify: `apps/web/landing.ts`
- Modify: `tests/e2e.test.ts`

**Step 1: Write the failing landing browser test**

Add the first E2E test before the existing workspace workflows:

```ts
test("landing showpiece moves through five fictional evidence stages and enters the workspace", async () => {
  const app = await startServer({ dbPath: ":memory:" });
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(app.url);
    await page.getByRole("heading", { name: "The prediction is not the decision." }).waitFor();
    strictEqual(await page.locator('[data-showpiece-stage]').count(), 5);
    await page.getByRole("tab", { name: /03 Converge/ }).click();
    await page.getByRole("heading", { name: /Two conditions converge/ }).waitFor();
    await page.getByText(/Unavailable/, { exact: false }).first().waitFor();
    await page.getByRole("tab", { name: /05 Record/ }).click();
    await page.getByText(/Defer review/, { exact: false }).first().waitFor();
    await Promise.all([
      page.waitForURL(/\/workspace$/),
      page.getByRole("link", { name: "Open the workspace" }).first().click(),
    ]);
    await page.getByRole("heading", { name: /Make the decision process/ }).waitFor();
  } finally {
    await browser.close();
    await app.close();
  }
});
```

Update all existing E2E `page.goto(app.url)` calls to `page.goto(`${app.url}/workspace`)` so they continue to test the application rather than the landing page.

**Step 2: Run the E2E suite to prove failure**

Run:

```bash
PLAYWRIGHT_BROWSERS_PATH=/private/tmp/bubblereyes-playwright npm run test:e2e
```

Expected: the new landing interaction test fails until the stage behavior and final design are implemented; existing workspace tests should reach `/workspace`.

**Step 3: Run Impeccable context and required references immediately before UI editing**

Run once from repository root:

```bash
node /Users/o2satz/.codex/skills/impeccable/scripts/context.mjs --target apps/web/landing.ts
```

Read:

- `/Users/o2satz/.codex/skills/impeccable/reference/new-work.md`
- `/Users/o2satz/.codex/skills/impeccable/reference/craft-floor.md`

Use Persuade mode and preserve `PRODUCT.md`/`DESIGN.md` factual boundaries.

**Step 4: Implement the complete landing visual hierarchy**

In `landingPage()` render:

- skip link and sticky compact header;
- split hero with headline, explanation, truth tape, and deep-ink live-protocol panel;
- five-stage tab rail and five complete stage panels;
- metrics with text state labels;
- convergence rail, evidence, contrary evidence, falsifier, and review disposition;
- decision anatomy section;
- four current use-case family links to `/workspace#examples`;
- local/deterministic/immutable trust architecture;
- final `/workspace` CTA and factual footer.

Use one `<style>` block scoped with landing-specific class names. Preserve the existing approved palette and introduce acid-lime only as a restrained available-evidence accent. No gradient, glass, generic rounded-card grid, stock image, fake chart, or fake probability.

**Step 5: Add progressive stage enhancement**

The inline script must:

```js
document.documentElement.classList.add("landing-has-js");
const tabs = [...document.querySelectorAll("[data-showpiece-tab]")];
const panels = [...document.querySelectorAll("[data-showpiece-stage]")];
function selectStage(stageId, focus = false) {
  tabs.forEach((tab) => {
    const selected = tab.dataset.showpieceTab === stageId;
    tab.setAttribute("aria-selected", String(selected));
    tab.tabIndex = selected ? 0 : -1;
  });
  panels.forEach((panel) => panel.classList.toggle("is-active", panel.dataset.showpieceStage === stageId));
  if (focus) panels.find((panel) => panel.dataset.showpieceStage === stageId)?.focus({ preventScroll: true });
}
```

Add click handling and Left/Right/Home/End keyboard navigation. Without JavaScript, CSS must show all five panels in document order. With JavaScript, only `.is-active` is displayed. Respect reduced motion.

**Step 6: Run focused E2E and content proof**

Run:

```bash
npm run build
PLAYWRIGHT_BROWSERS_PATH=/private/tmp/bubblereyes-playwright npm run test:e2e
node --test dist/tests/ui-content.test.js dist/tests/examples.test.js
```

Expected: 9 browser workflows pass and focused content/example tests pass.

**Step 7: Commit the experience slice**

```bash
git add apps/web/landing.ts tests/e2e.test.ts
git commit -m "feat: build Aurora evidence theater landing page"
```

### Task 4: Expand responsive and no-script verification

**Files:**

- Modify: `scripts/verify-responsive.mjs`
- Modify: `tests/ui-content.test.ts`

**Step 1: Write the no-script content assertion**

In the landing content test, assert that all five stage headings are present in the raw server HTML and that no panel uses the `hidden` attribute:

```ts
strictEqual((landing.match(/data-showpiece-stage=/g) ?? []).length, 5);
doesNotMatch(landing, /data-showpiece-stage=[^>]*\shidden(?:\s|>)/);
```

**Step 2: Extend the responsive verifier**

For each 1440, 768, and 390 viewport:

1. Visit `/` and assert:
   - no horizontal overflow;
   - header/main landmarks exist;
   - Manrope loads;
   - minimum visible button height is 44px;
   - headline and an “Open the workspace” link are visible;
   - all five tabs exist;
   - selected stage changes to Converge;
   - screenshot saved as `.impeccable/review/landing-<viewport>.png`.
2. Visit `/workspace` and preserve current assertions/screenshots under `workspace-<viewport>.png`.
3. Keep malformed-input recovery and returning-state checks on `/workspace`.

Update the final log line to report both landing and workspace verification.

**Step 3: Run responsive verification**

Run:

```bash
PLAYWRIGHT_BROWSERS_PATH=/private/tmp/bubblereyes-playwright npm run verify:responsive
```

Expected: PASS for both routes at 1440, 768, and 390.

**Step 4: Inspect screenshots in one bounded batch**

Open together:

- `.impeccable/review/landing-desktop.png`
- `.impeccable/review/landing-mobile.png`
- `.impeccable/review/workspace-desktop.png`
- `.impeccable/review/workspace-mobile.png`

Record all material findings at once. Fix hierarchy, clipping, first-viewport action, focus, illegible labels, or broken responsive composition in one patch. Do not expand scope into unrelated workspace redesign.

**Step 5: Confirm once**

Rerun `verify:responsive`, inspect the two landing confirmation screenshots, and stop visual iteration if no material defect remains.

**Step 6: Run the Impeccable detector**

Run the detector command supplied by the Impeccable context output against `apps/web/landing.ts`. Expected: no material findings.

**Step 7: Commit verification hardening**

```bash
git add scripts/verify-responsive.mjs tests/ui-content.test.ts apps/web/landing.ts
git commit -m "test: verify landing and workspace presentation"
```

### Task 5: Reconcile project truth and run release proof

**Files:**

- Modify: `GOAL.md`
- Modify: `IMPLEMENT.md`
- Modify: `DECISIONS.md`
- Modify: `PROGRESS.md`
- Modify: `TASK_QUEUE.md`

**Step 1: Update the active goal contract**

Make `GOAL.md` the bounded showpiece/landing goal. Preserve the completed structured-review contract in `GOAL_STRUCTURED_REVIEW_COMPLETE.md`. Include:

- `/` landing and `/workspace` route outcome;
- Aurora five-stage provenance/data boundary;
- no forecast/model/advice/persistence claims;
- functional, responsive, no-script, detector, screenshot, and truth-file proof gates;
- scope and stop rules.

**Step 2: Update durable implementation and decisions**

Record:

- `apps/web/landing.ts` as the Persuade surface;
- `/workspace` as the product route;
- Aurora as a separate non-persistent typed manifest;
- progressive enhancement/no-script behavior;
- no API/storage/provider changes;
- the decision to use Evidence Theater instead of fake analytics.

**Step 3: Update progress and task queue with actual evidence only**

Do not pre-mark completion. After commands pass, record exact counts, artifacts, detector output, known browser-sandbox requirement, remaining simulator/provider/release gaps, and the next roadmap item.

**Step 4: Run the full fresh proof**

```bash
npm_config_cache=/private/tmp/bubblereyes-npm-cache npm ci
PLAYWRIGHT_BROWSERS_PATH=/private/tmp/bubblereyes-playwright npm run verify:core
PLAYWRIGHT_BROWSERS_PATH=/private/tmp/bubblereyes-playwright npm run verify:responsive
git diff --check
git status --short --branch
```

Expected:

- dependency audit exits 0;
- lint/typecheck/build pass;
- deterministic tests include the new showpiece tests;
- 9 browser workflows pass;
- covenant/calculation/trigger/review evidence gates pass;
- both routes pass responsive proof at all three widths;
- only the five pre-existing `Docs_*_2026-08-26.md` files remain unrelated/untracked before the final product commit.

**Step 5: Inspect generated evidence**

Confirm:

- landing screenshots visibly say “Fictional scenario”;
- unavailable volatility is visible;
- no prediction/result claim appears;
- `/workspace` still shows four situations and twelve examples;
- export artifacts remain readable UTF-8/JSON and contain no NUL bytes.

**Step 6: Commit the truth and final implementation state**

```bash
git add GOAL.md IMPLEMENT.md DECISIONS.md PROGRESS.md TASK_QUEUE.md
git commit -m "docs: record prediction discipline landing proof"
```

If any implementation change remains after truth reconciliation, stage only the named product files and commit them before the docs commit. Never include the five unrelated `Docs_*` files.

**Step 7: Final repository audit**

```bash
git log --oneline --decorate -8
git status --short --branch
git diff --check HEAD~5..HEAD
```

Expected: feature commits are present; branch is ahead of origin; the only untracked files are the five prior documentation variants; no whitespace errors.
