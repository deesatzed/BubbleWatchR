# REPO_MAP.md

## Project Type

Local-first TypeScript application for Decision Covenant policy records and
portfolio snapshot calculations.

## Tech Stack

- Node.js 24, TypeScript 5.9, strict compiler settings.
- Built-in `node:sqlite` and `node:http`.
- Server-rendered HTML with a small browser script.
- Playwright Chromium for the browser workflow.

## Package Manager

`npm` with `package-lock.json`.

## Commands

| Purpose | Command | Verified |
|---|---|---|
| Install | `npm_config_cache=/private/tmp/bubblereyes-npm-cache npm ci` | Yes |
| Lint | `npm run lint` | Yes |
| Typecheck | `npm run typecheck` | Yes |
| Unit and domain tests | `npm test` | Yes, 8 passed |
| Browser workflow | `PLAYWRIGHT_BROWSERS_PATH=/private/tmp/bubblereyes-playwright npm run test:e2e` | Yes, 2 passed |
| Calculation evidence | `npm run verify:calculations` | Yes |
| Aggregate proof | `npm run verify:core` | Yes with authorized browser route |

## Entry Points

- `apps/web/server.ts` — local HTTP server and routes.
- `packages/domain/` — covenant lifecycle.
- `packages/snapshots/` — snapshot schema, validation, persistence, CSV import.
- `packages/calculations/` — deterministic formulas.
- `packages/export/` — JSON and Markdown serializers.

## Major Folders

- `apps/web/` — UI and HTTP routes.
- `packages/` — separable domain, audit, snapshots, calculations, and export.
- `tests/` — unit, calculation, and browser tests.
- `scripts/` — lint, browser runner, and evidence generators.
- `.data/` — local SQLite and generated verification artifacts.
- `dist/` — TypeScript build output.

## Existing Patterns To Preserve

- Local SQLite only; no external data or model calls.
- Immutable accepted records and explicit audit/provenance.
- Unknown and invalid values stay visible.
- Calculation logic remains independent of the UI.

## Tests and Verification

The completed calculation goal is recorded in `GOAL.md` and `PROGRESS.md`.
Generated evidence is inspectable in `.data/verification-calculations.json` and
`.data/verification-calculations.md`.

## Likely Files For Current Task

The next bounded task is expected to extend `packages/calculations/`, local
SQLite persistence, UI routes, and focused tests for deterministic trigger
state, hysteresis, and cooldown. It must preserve the current snapshot and
foundation contracts.

## Unknowns

- The physical health of `/dev/disk8s1` was not assessed because the available
  `diskutil` route was restricted. Current free space and successful writes are
  verified.
- Git publication/commit status is intentionally left for explicit approval.
