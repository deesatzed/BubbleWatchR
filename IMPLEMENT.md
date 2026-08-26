# IMPLEMENT.md — Decision Covenant

## Selected stack

- Node.js 24 runtime.
- TypeScript 5.9 compiled with `tsc` and strict checking.
- Node's built-in `node:sqlite` `DatabaseSync` API; no native SQLite package.
- Node's built-in `node:http` server with server-rendered HTML and a small
  browser script. Runtime dependencies are intentionally minimal.
- Self-hosted Manrope variable typography under the Open Font License; no font
  CDN or remote asset request.
- Playwright is a development dependency for the browser lifecycle test.

## Layout

```text
apps/web/             HTTP server, Persuade landing, workspace, and accessible HTML
packages/domain/      covenant types, validation, and lifecycle operations
packages/audit/       SQLite schema, audit events, replay, and hashing
packages/snapshots/   immutable snapshot persistence and CSV import
packages/calculations/ deterministic portfolio calculations
packages/triggers/     versioned metrics, deterministic transitions, and human-unit presentation
packages/reviews/      structured review packets and lifecycle
packages/examples/     deeply immutable lifecycle examples and Aurora showpiece
packages/workspace/    deterministic first-use and returning-state projection
packages/variants/     provider-neutral generated-variant contract and safe normalization
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
npm run verify:reviews
npm run verify:responsive
```

`test:e2e` installs the development Chromium browser into
`PLAYWRIGHT_BROWSERS_PATH` when it is absent. The default path is temporary
(`/private/tmp/bubblereyes-playwright`); CI or a
developer may set another writable path.

The `lint` script checks all TypeScript files for trailing whitespace and
forbidden product language. It is intentionally supplemental to TypeScript's
compiler checks.

## Product surfaces

The root route is a Persuade-mode landing page rendered by
`apps/web/landing.ts`. It opens with the product thesis and a deterministic
protocol illustration, then presents the typed five-stage fictional Aurora
showpiece, decision anatomy, current use-case scope, trust boundary, and an
explicit link into the product. The renderer has no new runtime dependency,
remote asset, model call, API route, or persistence behavior.

The complete decision workspace is served at `/workspace`. First use begins
with four bundled packs containing twelve fictional examples. Each example
includes policy text, observations, deterministic condition states, a
completed review, cooldown, tradeoffs, and a visible fictional-data marker.
Copying an example moves only covenant fields into the editable personal
builder.

Returning use adds a server-projected record summary ahead of the example
library. Human-readable observation rows and guided condition controls are the
default input paths; exact JSON remains available under explicit Advanced
disclosures. The Generate variants control reports the actual provider-ready
state and makes no model call.

## Landing enhancement boundary

`packages/examples/showpiece.ts` exports one deeply frozen Aurora manifest;
it is not a fifth pack and is never inserted into SQLite. The landing emits all
five stage panels in the server response. A small inline script adds the
selected-tab presentation, arrow-key navigation, and the trace entrance. CSS
only suppresses non-selected panels after the script marks the document as
enhanced, so the full story remains readable without JavaScript. Existing API
and storage behavior is unchanged.

`scripts/verify-responsive.mjs` verifies both routes at 1440, 768, and 390
pixels. It records separate first-viewport and interacted-stage landing
rasters, preserves workspace checks, and exercises focus order, target size,
font loading, overflow, invalid-input recovery, navigation, persisted success
context, and returning state.
