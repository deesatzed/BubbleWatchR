# AI Variant Decision Workspace Implementation Plan

> **For Codex:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the blank-form first experience with twelve meaningful interactive covenant examples, a guided editable builder, and a modern returning-user workstation while preserving all current domain behavior.

**Architecture:** Add a typed, data-driven examples package that validates against the existing covenant and trigger contracts. Render the example library, guided builder, workstation summary, normal snapshot rows, and human-readable trigger controls in the existing server-rendered Node application, using progressive enhancement and keeping JSON as an advanced path. Define provider-neutral AI contracts now, but do not make external or local model calls until credentials and provider proof gates are separately approved.

**Tech Stack:** Node.js 24, TypeScript 5.9, server-rendered HTML/CSS/JavaScript, `node:sqlite`, Node test runner, Playwright, @impeccable, @test-driven-development, @verification-before-completion.

---

### Task 1: Typed example manifests

**Files:**
- Create: `packages/examples/types.ts`
- Create: `packages/examples/manifests.ts`
- Create: `packages/examples/index.ts`
- Create: `tests/examples.test.ts`
- Modify: `package.json`

**Step 1: Write the failing manifest test**

Create a test that imports `EXAMPLE_PACKS` and proves:

```ts
strictEqual(EXAMPLE_PACKS.length, 4);
strictEqual(EXAMPLE_PACKS.flatMap((pack) => pack.examples).length, 12);
for (const example of EXAMPLE_PACKS.flatMap((pack) => pack.examples)) {
  strictEqual(validateCovenantInput(example.covenant).ok, true);
  for (const trigger of example.triggers) strictEqual(validateTriggerDefinition(trigger).ok, true);
  ok(example.story.snapshots.length >= 2);
  ok(example.tradeoffs.length > 0);
  ok(example.notFor.length > 0);
}
```

Also assert stable unique IDs and that all story names explicitly identify
fictional data.

**Step 2: Run the focused test and confirm failure**

Run:

```bash
npm run build && node --test dist/tests/examples.test.js
```

Expected: FAIL because `packages/examples` does not exist.

**Step 3: Implement the types**

Define:

```ts
export type ExamplePack = {
  id: "ai-theme" | "employer-equity" | "drawdown-volatility" | "scheduled-review";
  title: string;
  description: string;
  examples: CovenantExample[];
};

export type CovenantExample = {
  id: string;
  title: string;
  philosophy: string;
  situation: string;
  emphasis: string[];
  tradeoffs: string[];
  notFor: string[];
  covenant: CovenantInput;
  triggers: TriggerDefinitionInput[];
  story: FictionalExampleStory;
};
```

Keep demo snapshots and review summaries as immutable presentation data. Do not
write them to SQLite.

**Step 4: Implement four packs and twelve examples**

Use small factory helpers for shared validated defaults, but ensure each example
differs in philosophy, conditions, evidence requirements, persistence, and
cooldown. Do not produce twelve renamed copies.

**Step 5: Run focused and aggregate tests**

Run:

```bash
npm run build && node --test dist/tests/examples.test.js
npm test
```

Expected: all example tests pass and existing tests remain green.

**Step 6: Commit only the example slice**

```bash
git add packages/examples tests/examples.test.ts package.json
git commit -m "feat: add covenant example library"
```

### Task 2: First-use example library and guided demo

**Files:**
- Modify: `apps/web/server.ts`
- Modify: `tests/e2e.test.ts`

**Step 1: Write a failing browser test**

Prove that an empty database shows:

- the sentence “Make the decision process before the moment gets loud.”;
- all four example pack names;
- twelve examples discoverable through pack selection;
- a complete fictional lifecycle preview;
- a “Use as my starting point” action;
- a secondary “Start blank” action;
- an explicit fictional/demo marker.

The test clicks an example, inspects the story stages, returns to the library,
and confirms that no covenant or snapshot API records were created.

**Step 2: Run the browser test and confirm failure**

Run:

```bash
npm run build && node scripts/run-e2e.mjs
```

Expected: FAIL because the example library is absent.

**Step 3: Add server-rendered example navigation**

Render semantic pack tabs or buttons, a stable example list, and a detail panel.
Embed only the selected manifest data needed by the browser. Use buttons for
state changes and anchors only for navigation.

**Step 4: Add the fictional lifecycle preview**

Represent the stages as an ordered timeline:

```text
Policy written -> Observation changed -> Condition ready for review -> Review recorded -> Cooldown
```

Show actual fictional values, missing-data treatment, and the example decision
rationale. Include tradeoffs and “may not fit” reasons before the copy action.

**Step 5: Keep demo data isolated**

The demo must never call mutation routes. “Reset demo” changes only browser
presentation state. Verify API lists remain empty.

**Step 6: Run the focused browser workflow**

Expected: example exploration passes with zero persisted records.

**Step 7: Commit the library UI**

```bash
git add apps/web/server.ts tests/e2e.test.ts
git commit -m "feat: add interactive covenant examples"
```

### Task 3: Copy-to-draft and guided covenant builder

**Files:**
- Modify: `apps/web/server.ts`
- Modify: `tests/e2e.test.ts`

**Step 1: Write the failing copy-to-draft test**

Select an example and click “Use as my starting point.” Assert that:

- all covenant fields are populated;
- percentage controls display human percentages;
- the builder opens at Intent;
- every value can be edited or removed;
- no record exists until Save draft is submitted;
- the saved record is a normal draft with no copied fictional snapshots or
  review history.

**Step 2: Run and confirm failure**

Expected: FAIL because examples cannot populate the builder.

**Step 3: Rebuild the form as four fieldsets**

Use semantic `<fieldset>` and `<legend>` elements for Intent, Guardrails,
Decision boundaries, and Preview. Keep all existing IDs so current lifecycle
tests remain stable.

**Step 4: Add percentage presentation**

Display concentration and drawdown as `0–100` percentage inputs. Convert to and
from backend fractions only at the browser boundary. Add explicit tests for 0,
25, 100, empty, and out-of-range values.

**Step 5: Add readable live preview**

Create a deterministic browser-side renderer from current field values. The
preview is not persisted separately and contains no generated claims.

**Step 6: Add example population**

Embed escaped manifest JSON in a non-executable script block or data attribute,
parse it locally, populate fields, and announce the selected example in the
builder status region.

**Step 7: Run lifecycle and browser tests**

Run unit, existing covenant browser workflow, and the new copy test.

**Step 8: Commit the builder slice**

```bash
git add apps/web/server.ts tests/e2e.test.ts
git commit -m "feat: add guided covenant builder"
```

### Task 4: Modern application shell and visual system

**Files:**
- Modify: `apps/web/server.ts`
- Modify: `scripts/verify-responsive.mjs`
- Create: `tests/ui-content.test.ts`

**Step 1: Write structural UI assertions**

Assert the generated HTML contains:

- primary navigation: Examples, My policy, Observations, Reviews, Record;
- first-use and returning-user state hooks;
- semantic state labels;
- reduced-motion CSS;
- no default opening on the raw fourteen-field form;
- no remote font, image, script, or telemetry URL.

**Step 2: Load Impeccable context and references**

Run context once for `apps/web/server.ts`, then load `bolder`, `operate`, and
`craft-floor` references. Treat the screenshot in the design conversation as
the anti-reference.

**Step 3: Implement the visual system**

Use a warm neutral canvas, deep ink surfaces, precise cobalt interaction color,
and semantic green/amber/red. Build a stable app shell with a context rail,
working canvas, and live summary at desktop sizes. Avoid interchangeable card
scaffolding; use spatial grouping and thin rules.

**Step 4: Implement responsive composition**

- 1440px: rail plus working canvas and contextual summary where useful.
- 768px: compact rail/navigation and single primary canvas.
- 390px: linear flow with sticky chapter progress and no compressed dashboard.

**Step 5: Implement complete control states**

Cover hover, focus-visible, active, selected, disabled, loading, success,
warning, and error. Keep all targets at least 44px.

**Step 6: Run the Impeccable detector once**

```bash
node /Users/o2satz/.codex/skills/impeccable/scripts/detect.mjs --json apps/web/server.ts
```

Expected: no unexplained findings.

**Step 7: Run responsive browser proof**

```bash
npm run verify:responsive
```

Expected: 1440/768/390 pass with no overflow and complete keyboard focus.

**Step 8: Commit the visual system**

```bash
git add apps/web/server.ts scripts/verify-responsive.mjs tests/ui-content.test.ts
git commit -m "feat: establish decision workspace interface"
```

### Task 5: Returning-user workstation summary

**Files:**
- Create: `packages/workspace/summary.ts`
- Create: `tests/workspace.test.ts`
- Modify: `apps/web/server.ts`

**Step 1: Write failing summary tests**

Cover empty, draft-only, approved-without-snapshot, unavailable conditions,
active conditions, open reviews, and next scheduled review. The summary must
never turn unavailable into normal or derive advice.

**Step 2: Implement a deterministic summary projection**

Return plain display data only:

```ts
type WorkspaceSummary = {
  mode: "first_use" | "workstation";
  policyStatus: string;
  latestObservationAt: string | null;
  conditionCounts: Record<string, number>;
  openReviewCount: number;
  nextScheduledReviewAt: string | null;
  nextAction: "create_policy" | "approve_policy" | "add_observation" | "review_condition" | "none";
};
```

**Step 3: Render summary before operational forms**

Use plain language and semantic labels. The next action must link or focus the
existing control; it must not perform the action automatically.

**Step 4: Run focused and browser tests**

Expected: first-use remains example-led; returning state is summary-led.

**Step 5: Commit the workstation slice**

```bash
git add packages/workspace tests/workspace.test.ts apps/web/server.ts
git commit -m "feat: add returning-user workstation summary"
```

### Task 6: Human-readable observation entry

**Files:**
- Modify: `apps/web/server.ts`
- Modify: `tests/e2e.test.ts`

**Step 1: Write a failing row-entry browser test**

Add, edit, and remove position rows. Verify required fields, optional AI
classification, account group, keyboard order, and saved calculation output.

**Step 2: Render a normal position-row editor**

Use stable row IDs and columns for name/symbol, quantity, price, optional market
value, optional AI-exposure percentage, and account group. Add/remove buttons
must announce changes.

**Step 3: Move JSON under Advanced tools**

Keep the existing JSON textarea and route compatibility, but label it as an
advanced alternative. Keep CSV import first-class.

**Step 4: Serialize rows to the existing snapshot contract**

Do not change persistence or calculation semantics. Reject incomplete rows
before request and focus the exact field.

**Step 5: Run snapshot unit and browser tests**

Expected: row editor, CSV, and advanced JSON all pass.

**Step 6: Commit the observation slice**

```bash
git add apps/web/server.ts tests/e2e.test.ts
git commit -m "feat: add human-readable observation entry"
```

### Task 7: Human-readable trigger builder

**Files:**
- Create: `packages/triggers/presentation.ts`
- Create: `tests/trigger-presentation.test.ts`
- Modify: `apps/web/server.ts`
- Modify: `tests/e2e.test.ts`

**Step 1: Write failing presentation conversion tests**

Test percent/fraction conversion, date/time settings, volatility lookback,
missing-data policy labels, cooldown units, and round-trip serialization for all
seven trigger types.

**Step 2: Implement deterministic presentation conversion**

Keep domain definitions unchanged. The presentation layer converts human
controls into `TriggerDefinitionInput` and back.

**Step 3: Render seven condition controls**

Each condition has an enable switch, explanation, relevant settings, evidence
requirements, and unavailable-data behavior. Only relevant fields are shown.

**Step 4: Move trigger JSON under Advanced tools**

Retain the tested route and an advanced textarea for exact inspection/import.

**Step 5: Run all trigger tests and browser workflow**

Expected: all seven definitions still validate, save, evaluate, export, and
open reviews.

**Step 6: Commit the trigger UI slice**

```bash
git add packages/triggers/presentation.ts tests/trigger-presentation.test.ts apps/web/server.ts tests/e2e.test.ts
git commit -m "feat: add guided condition builder"
```

### Task 8: Provider-neutral generation contract

**Files:**
- Create: `packages/variants/types.ts`
- Create: `packages/variants/normalize.ts`
- Create: `tests/variants.test.ts`
- Modify: `apps/web/server.ts`
- Modify: `DECISIONS.md`

**Step 1: Write failing normalization tests**

Reject malformed provider output, missing covenant fields, invalid triggers,
unsupported actions, duplicate IDs, and unsafe provenance. Prove a valid
normalized response can be compared but is not persisted.

**Step 2: Define provider-neutral interfaces**

```ts
export interface VariantProvider {
  id: string;
  kind: "local" | "openrouter";
  generate(request: VariantRequest): Promise<VariantResponse>;
}
```

Define request, response, provenance, normalized variant, and structured error
types. Do not implement network adapters in this task.

**Step 3: Implement normalization and validation**

Reuse domain and trigger validation. Strip unknown fields and reject invalid
responses before any UI use or persistence.

**Step 4: Render honest provider setup state**

Show bundled examples as available. Explain that local/OpenRouter runtime
generation requires provider setup. Do not render a working Generate button or
fake streamed response until an adapter exists.

**Step 5: Record the successor boundary**

Document that OpenRouter credentials require secure storage, consent at setup,
redaction tests, account-level budget enforcement, and explicit approval before
network implementation.

**Step 6: Run tests and commit**

```bash
git add packages/variants tests/variants.test.ts apps/web/server.ts DECISIONS.md
git commit -m "feat: define variant provider contract"
```

### Task 9: Final verification and truth reconciliation

**Files:**
- Modify: `PROGRESS.md`
- Modify: `IMPLEMENT.md`
- Modify: `TASK_QUEUE.md` only if the active successor ordering changes
- Modify: `ux-audit-bubbler-eyes-2026-08-25.md`

**Step 1: Run the complete verification gate**

```bash
npm_config_cache=/private/tmp/bubblereyes-npm-cache npm ci
npm run lint
npm run typecheck
npm test
npm run test:e2e
npm run verify:responsive
npm run verify:core
git diff --check
```

Expected: every command exits 0. Run Chromium gates with the established macOS
browser permission if the Mach-port sandbox error recurs.

**Step 2: Perform bounded visual inspection**

Capture first-use and returning states at 1440px and 390px. Inspect example
comparison, selected variant, guided builder, observation entry, condition
builder, open review, error, loading, disabled, and reduced-motion states.

**Step 3: Run the Impeccable detector exactly once on final UI targets**

Resolve material findings in one batch, then perform at most one confirmation
round.

**Step 4: Update project truth**

Record actual files, commands, results, provider deferral, and remaining risks.
Do not claim runtime AI generation until a real adapter and proof gate exist.

**Step 5: Restart the openable local build**

Serve the verified `dist` application with an isolated local database and
confirm HTTP 200.

**Step 6: Commit final documentation separately**

```bash
git add PROGRESS.md IMPLEMENT.md TASK_QUEUE.md ux-audit-bubbler-eyes-2026-08-25.md
git commit -m "docs: record decision workspace verification"
```
