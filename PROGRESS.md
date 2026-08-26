# PROGRESS.md — Decision Covenant Foundation

## Recovery checkpoint — 2026-08-24

The crash-recovery checkout is `/Volumes/WS4TB/aBubblerEyes/BubblerEyes`.
Git is present and identifies `main` at `b57d1f7` (`Build Decision Covenant
foundation`), tracking `origin/main`. The portfolio-snapshot implementation
was recovered as the current uncommitted worktree, not as a missing or lost
tree. There is no stash; the reflog contains the foundation commit and a
same-HEAD reset. Existing untracked files were preserved.

The volume is currently mounted read-write as `/dev/disk8s1` with 1.3 TiB
available. `npm ci`, TypeScript builds, tests, and generated artifact writes
all succeeded after recovery. The earlier `Operation not permitted` result is
therefore recorded as an access/process-route failure, not as evidence of
repository loss or a full drive. A hardware-health conclusion was not made;
the restricted `diskutil` route was unavailable.

## Completed implementation

- `packages/snapshots/` provides immutable snapshot persistence, CSV import,
  conflict/duplicate rejection, and explicit unknown-value handling.
- `packages/calculations/` provides deterministic total value, weights,
  user-defined AI exposure completeness, concentration drift, and observed
  drawdown calculations.
- `packages/export/` and `scripts/verify-calculations.mjs` produce JSON and
  Markdown calculation evidence with provenance and formula notes.
- `apps/web/server.ts` and `tests/e2e.test.ts` cover manual entry, CSV import,
  totals, unknown state, comparison, drawdown, and export.
- Recovery found and fixed a raw NUL in Markdown rendering of internal
  position keys. The internal key remains stable; the visible form is now
  `asset / account`, and a regression assertion prevents binary Markdown.

## Verification evidence

Verified on 2026-08-24:

- `npm_config_cache=/private/tmp/bubblereyes-npm-cache npm ci` — passed; 7
  packages audited, 0 vulnerabilities.
- `npm run lint` — passed; 13 TypeScript files checked.
- `npm run typecheck` — passed.
- `npm test` — passed; 8 tests passed, 0 failed.
- `PLAYWRIGHT_BROWSERS_PATH=/private/tmp/bubblereyes-playwright npm run test:e2e`
  — passed; 2 browser tests passed, 0 failed.
- `npm run verify:exports` — passed.
- `npm run verify:calculations` — passed; generated
  `.data/verification-calculations.json` and `.data/verification-calculations.md`.
  The inspected Markdown is UTF-8 text and visibly reports `Unknown / incomplete`
  and `alpha / main`, not a zero default.
- Authorized `PLAYWRIGHT_BROWSERS_PATH=/private/tmp/bubblereyes-playwright
  npm run verify:core` — passed; all aggregate gates passed, including final
  build.
- `git diff --check` — passed.

An unprivileged aggregate attempt hit Chromium's macOS Mach-port denial
(`MACH_PORT_RENDEZVOUS ... Permission denied (1100)`) and hung in cleanup. The
isolated browser run and the authorized aggregate run passed; this remains an
environment note, not an application failure.

## Remaining risks and handoff

- The active implementation remains uncommitted on `main`; do not discard the
  dirty worktree. Commit/publish only as a separately authorized action.
- `node:sqlite` emits Node's experimental-feature warning; tests still pass.
- No brokerage, market-data, external model, telemetry, simulation, or
  recommendation behavior was added. Trigger behavior is local descriptive
  policy state only.

## Active trigger batch — complete — 2026-08-24

Implemented the seven-trigger successor in `packages/triggers/`, with SQLite
definition/state/evaluation persistence, immutable audit events, replay,
aggregate multi-trigger escalation, local API/UI controls, JSON/Markdown
exports, and `scripts/verify-triggers.mjs` evidence generation.

Verified during this batch:

- `npm test` — passed; 21 tests passed, 0 failed, including all seven metric
  families, missing-data hold behavior, entry/exit hysteresis, volatility gap
  rejection, persistence, replay, deduplication, cooldown, emergency bypass,
  and aggregate escalation.
- `npm run lint` — passed; 17 TypeScript files checked.
- `npm run typecheck` — passed.
- `PLAYWRIGHT_BROWSERS_PATH=/private/tmp/bubblereyes-playwright npm run
  test:e2e` — passed; 3 browser tests passed, 0 failed.
- `npm run verify:triggers` — passed; generated and inspected
  `.data/verification-triggers.json` and `.data/verification-triggers.md`.
  Both are readable text artifacts with all seven types, unavailable output,
  version fields, review completion, and cooldown bypass evidence; neither
  contains a NUL byte.
- Authorized `PLAYWRIGHT_BROWSERS_PATH=/private/tmp/bubblereyes-playwright
  npm run verify:core` — passed; all aggregate gates passed, including the
  final build. An unprivileged retry reproduced Chromium's macOS
  `MachPortRendezvousServer` permission denial before page execution.
- `git diff --check` — passed.

The structured-review successor is recorded below.

## Structured-review batch — complete — 2026-08-25

The completed trigger contract is preserved in `GOAL_TRIGGERS_COMPLETE.md` and
the active successor contract is now `GOAL.md`. Implemented so far:

- `packages/reviews/` types and SQLite lifecycle for open, update, complete,
  list, read, and replay;
- atomic linked trigger cooldown closure with immutable review audit events;
- review JSON/Markdown serializers and local API routes;
- accessible browser form for opening and completing a bounded review;
- `tests/reviews.test.ts`, browser proof, and `scripts/verify-reviews.mjs`.

Fresh evidence:

- `npm test` — passed; 25 tests passed, 0 failed.
- `PLAYWRIGHT_BROWSERS_PATH=/private/tmp/bubblereyes-playwright npm run
  test:e2e` — passed; 4 browser tests passed, 0 failed.
- `npm run verify:reviews` — passed; generated and inspected
  `.data/verification-reviews.json` and `.data/verification-reviews.md`.

- Authorized `PLAYWRIGHT_BROWSERS_PATH=/private/tmp/bubblereyes-playwright
  npm run verify:core` — passed; all aggregate gates passed, including review
  evidence and final build.
- Review evidence is UTF-8/JSON text, includes the decision, rationale,
  linked trigger, versions, and `review.completed`; both artifacts contain no
  NUL bytes.
- `git diff --check` — passed.

The structured-review contract is preserved in
`GOAL_STRUCTURED_REVIEW_COMPLETE.md`. The next implementation is
hypothetical rebalance simulation and remains unimplemented.

## Successor

The foundation, portfolio, seven-trigger, and structured-review goals are
complete and preserved in their corresponding `GOAL_*_COMPLETE.md` files.
`TASK_QUEUE.md` now identifies hypothetical rebalance simulation as the active
successor. No simulation behavior has been added.

## 2026-08-25 — UX audit and local UI hardening

Completed a bounded audit and implementation pass for the actual server-rendered
web surface. The pre-edit evidence report is preserved in
`ux-audit-bubbler-eyes-2026-08-25.md`.

Implemented:

- skip link, section navigation, stable section IDs, and useful empty-state
  links;
- responsive spacing and two-column snapshot entry at wider widths;
- semantic visual tokens, stronger focus-visible treatment, touch-sized
  controls, field guidance, and reduced-motion-safe status transitions;
- request locking for submissions and action buttons;
- field-focused error recovery for malformed JSON/CSV;
- ephemeral success messages that preserve the relevant section after reload.

Verification:

- `npm run lint` — passed;
- `npm run typecheck` — passed;
- `npm test` — passed; 25 tests passed, 0 failed;
- `npm run test:e2e` — passed; 4 browser workflows passed, 0 failed;
- elevated `npm run verify:core` — passed; all aggregate gates, including
  Chromium and export evidence, passed;
- elevated `npm run verify:responsive` — passed; built page verified at 1440,
  768, and 390 pixels for overflow, wayfinding, target sizing, layout,
  keyboard skip-link focus, malformed-input recovery focus, success context,
  back-button navigation, and refresh persistence;
- `npm run build` — passed;
- Impeccable detector — passed with no findings;
- `git diff --check` — passed;
- local GET smoke check — passed at `http://127.0.0.1:7821/`.

The in-app/extension browser surface was unavailable for direct screenshots and
viewport measurements in this environment. The report keeps that limitation
explicit; the repository Chromium workflows remain the functional browser
evidence.

## 2026-08-25 — Guided decision workspace and variant foundation

Implemented the approved hybrid of guided decision journal and returning-user
workstation:

- `packages/examples/` now ships four use-case packs and twelve deeply
  immutable, schema-valid fictional lifecycles. Each pack offers three distinct
  philosophies with policy text, trigger settings, observations, a bounded
  recorded review, cooldown, tradeoffs, and may-not-fit guidance.
- The first-use page now explains the product before personal input, keeps a
  selected lifecycle inspectable beside its pack and example context, and
  copies only covenant fields into an editable personal draft.
- `packages/workspace/summary.ts` projects first-use versus returning state,
  current policy status, latest observation, condition counts, open reviews,
  schedule, and the next recordable step. A snapshot-only record now correctly
  enters workstation mode and has focused regression coverage.
- Manual observation entry defaults to add/edit/remove position rows with
  stable IDs and field-focused validation. CSV remains first-class; exact JSON
  moved under Advanced disclosure.
- `packages/triggers/presentation.ts` round-trips human units for all seven
  deterministic trigger types. The UI defaults to guided percentage, date,
  persistence, cooldown, missing-data, volatility, and overdue-review controls;
  exact trigger JSON remains available under Advanced disclosure.
- `packages/variants/` defines a provider-neutral local/OpenRouter contract and
  safe normalizer for two or three non-persistent variants. It rejects malformed
  provenance, duplicate IDs, invalid policy/trigger data, and prescriptive
  action language. No runtime adapter, credential capture, network request, or
  fabricated model response was added.
- The visual system is recorded in `DESIGN.md`, the approved north-star and
  prompt provenance are in `.impeccable/mocks/`, and direct first-use/returning
  screenshots are in `.impeccable/review/`.
- The final craft review found and the repair batch fixed historical/disabled
  condition leakage in the returning summary, browser-timezone conversion of
  scheduled wall times, repeated returning-user onboarding, the missing mobile
  first-viewport example action, and system-only typography. Manrope now ships
  locally with its OFL license and no remote request.

Fresh verification on 2026-08-25:

- `npm_config_cache=/private/tmp/bubblereyes-npm-cache npm ci` — passed; 7
  packages audited, 0 vulnerabilities.
- Elevated `PLAYWRIGHT_BROWSERS_PATH=/private/tmp/bubblereyes-playwright npm
  run verify:core` — passed: lint checked 32 TypeScript files, typecheck passed,
  38 unit/integration tests passed, 8 Chromium workflows passed, all covenant,
  calculation, trigger, and review evidence exports passed, and the final build
  passed.
- Elevated `npm run verify:responsive` — passed at 1440, 768, and 390 pixels,
  including document overflow, 44px targets, first keyboard focus, invalid-field
  recovery, persisted success context, and first-use/returning screenshot
  capture.
- The one-time Impeccable anti-pattern detector returned `[]`.
- The independent finish reviewer first returned `Fix before ship`; after the
  bounded repair and recapture round, the same reviewer returned `SHIP` with no
  remaining material blockers.
- `git diff --check` — passed.

Remaining product boundary: Generate variants exposes the honest bundled-only,
provider-ready state. Runtime local/OpenRouter generation remains a separate
goal requiring secure credential storage, provenance, redaction, timeout,
budget, and failure-state proof. Hypothetical rebalance simulation remains the
active roadmap successor.

## 2026-08-26 — Prediction discipline landing — complete

Implemented and committed the first three batches on
`feat/ai-variant-workspace`:

- `38c0038` adds the deeply immutable typed Aurora showpiece with five stages,
  explicit fictional provenance, unavailable evidence, and a bounded recorded
  deferral;
- `83ff5a0` makes `/` the landing route and preserves the complete product at
  `/workspace`, with APIs and storage unchanged;
- `5df4fb2` builds the Evidence Theater landing and its Chromium workflow.
- `1affd7c` records the responsive/no-script hardening, bounded reviewer repair,
  and landing/workspace raster matrix;
- `36c6862` records the two-route design system and generated design sidecar;
- `a1ed25c` adds targeted unavailable-evidence capture to the visual proof.

Fresh final verification:

- `npm_config_cache=/private/tmp/bubblereyes-npm-cache npm ci` — passed; 6
  packages installed, 7 audited, 0 vulnerabilities;
- elevated `npm run verify:core` — passed: lint checked 34 TypeScript files,
  typecheck passed, 42 deterministic tests passed, 9 Chromium workflows
  passed, covenant/calculation/trigger/review evidence gates passed, and the
  final build passed;
- elevated `npm run verify:responsive` — passed for both routes at 1440, 768,
  and 390 pixels, including overflow, self-hosted font, 44px targets, stage
  switching, initial skip-link focus, invalid-input recovery, success context,
  back navigation, refresh persistence, and returning state;
- raw server content proof confirms exactly five stage panels and no stage
  `hidden` attribute;
- the one-time Impeccable detector returned `[]`;
- landing first-viewport, interacted-stage, and targeted unavailable-evidence
  rasters plus preserved workspace rasters were captured under
  `.impeccable/review/` and inspected;
- every generated verification JSON file parses, every Markdown artifact is
  UTF-8 text, and none of the inspected JSON/Markdown artifacts contains a raw
  NUL byte;
- `git diff --check` passed before final truth reconciliation.

The independent finish reviewer returned `fix`. Codex accepted all eight
findings: durable design documentation; a visible tablet/mobile first-viewport
protocol; a compact mobile stage navigator; removal of heading kickers;
display tracking no tighter than `-.04em`; text-only same-tab navigation;
explicit two-square brand geometry; and 1px/full-boundary callouts. The visual
repair, same-viewport recapture, and responsive proof passed. The required
documenter updated `DESIGN.md` and `.impeccable/design.json`; the same reviewer
scored seven fixes resolved, one stale documentation sentence partial, then
returned exact disposition `ship` after that sentence was corrected.

No runtime model, provider credential, remote asset, API endpoint, database
table, market-data feed, recommendation, prediction, or simulated performance
result was added. The five pre-existing `Docs_*_2026-08-26.md` files remain
unrelated and unstaged.
