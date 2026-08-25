# IMPLEMENT.md — Decision Covenant

## Selected stack

- Node.js 24 runtime.
- TypeScript 5.9 compiled with `tsc` and strict checking.
- Node's built-in `node:sqlite` `DatabaseSync` API; no native SQLite package.
- Node's built-in `node:http` server with server-rendered HTML and a small
  browser script. Runtime dependencies are intentionally minimal.
- Playwright is a development dependency for the browser lifecycle test.

## Layout

```text
apps/web/             HTTP server, routes, and accessible HTML
packages/domain/      covenant types, validation, and lifecycle operations
packages/audit/       SQLite schema, audit events, replay, and hashing
packages/snapshots/   immutable snapshot persistence and CSV import
packages/calculations/ deterministic portfolio calculations
packages/triggers/      versioned metrics and deterministic state transitions
packages/export/      JSON and Markdown serializers
tests/                unit and browser workflow tests
```

## Storage

The default application database is `.data/decision-covenant.sqlite`. Tests
use unique temporary database paths. Snapshot rows are immutable JSON records
linked to their source and `asOf` timestamp. Existing covenant and audit tables
remain compatible with the foundation schema.

## Verification commands

```text
npm ci
npm run lint
npm run typecheck
npm test
npm run test:e2e
npm run build
npm run verify:core
npm run verify:calculations
npm run verify:triggers
```

`test:e2e` installs the development Chromium browser into
`PLAYWRIGHT_BROWSERS_PATH` when it is absent. The default path is temporary
(`/private/tmp/bubblereyes-playwright`); CI or a
developer may set another writable path.

The `lint` script checks all TypeScript files for trailing whitespace and
forbidden product language. It is intentionally supplemental to TypeScript's
compiler checks.
