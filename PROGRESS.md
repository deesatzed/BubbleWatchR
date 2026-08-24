# PROGRESS.md — Decision Covenant Foundation

## Starting state — 2026-08-24

Verified before implementation:

- The checkout contained seven Markdown blueprint documents and no source
  tree, package manifest, tests, database, or Git metadata.
- The existing blueprint documents were preserved unchanged.
- The active product target is the local-first Decision Covenant; the
  Infrastructure Commitment Ledger remains separate.
- Node `v24.13.0` and npm `11.8.0` are available.
- Node's built-in `node:sqlite` API is available.

## Current batch — complete

Implemented the repository scaffold and foundation vertical slice:

- `apps/web/server.ts` provides local HTTP routes, accessible form UI, approve,
  successor, and export workflows.
- `packages/domain/` validates and manages draft/approved/successor lifecycles.
- `packages/audit/` stores SQLite records and chained audit hashes.
- `packages/export/` produces JSON and Markdown records.
- `tests/unit.test.ts` covers validation, immutability, supersession, replay,
  and export provenance.
- `tests/e2e.test.ts` covers the real Chromium browser workflow.
- `scripts/verify-exports.mjs` writes and inspects generated export artifacts.

Verified command results on 2026-08-24:

- `npm_config_cache=/private/tmp/bubblereyes-npm-cache npm ci` — passed; 7
  packages audited, 0 vulnerabilities.
- `npm run lint` — passed; 7 TypeScript files checked.
- `npm run typecheck` — passed.
- `npm test` — passed; 4 tests passed, 0 failed.
- `PLAYWRIGHT_BROWSERS_PATH=/private/tmp/bubblereyes-playwright npm run test:e2e`
  — passed; 1 real Chromium browser test passed, 0 failed. The run required
  elevated execution because the sandbox blocks Chromium's macOS Mach-port
  bootstrap.
- `npm run verify:exports` — passed; generated and inspected
  `.data/verification-export.json` and `.data/verification-export.md`.
- `PLAYWRIGHT_BROWSERS_PATH=/private/tmp/bubblereyes-playwright npm run verify:core`
  — passed; all checks, unit tests, browser test, export verification, and
  final build passed.

Known environment note: this checkout is still not a Git repository, so
`git diff --check` remains conditional and was not available. No source
blueprint document was modified.

## Successor goal

After the foundation passes, create the next bounded goal for portfolio
snapshots and reproducible calculations.
