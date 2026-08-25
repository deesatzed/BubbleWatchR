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

The next structured-review goal remains explicitly out of scope.

## Successor

The portfolio snapshot/calculation goal is complete and preserved as
`GOAL_PORTFOLIO_SNAPSHOTS_COMPLETE.md`. The active goal is now the complete
seven-trigger policy state engine in `GOAL.md`:

1. AI exposure above threshold.
2. Single-position concentration above threshold.
3. Trailing drawdown above threshold.
4. Trailing realized volatility above threshold.
5. Appreciation-driven concentration.
6. Scheduled review date.
7. Covenant review overdue.

The trigger schema, formula, timezone, persistence, hysteresis, cooldown, and
missing-data decisions are recorded in `DECISIONS.md`; focused verification is
wired through `npm run verify:triggers` and `npm run verify:core`.
