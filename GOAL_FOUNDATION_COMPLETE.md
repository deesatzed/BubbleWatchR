# GOAL.md — Decision Covenant Foundation

**Status:** Completed first implementation goal
**Working product name:** Decision Covenant
**Repository codename:** BubblerEyes
**Source date:** 2026-08-24
**Completed:** 2026-08-24

This is the first bounded build goal derived from the existing Decision Covenant
blueprint. The AI Infrastructure Commitment Ledger remains a separate research
track and is not an app dependency.

## OUTCOME:

Create the first runnable local Decision Covenant vertical slice.

A single local user must be able to:

1. Create and validate a covenant draft.
2. Approve and lock an immutable covenant version.
3. Create a successor draft without changing the approved version.
4. Inspect the resulting append-only audit history.
5. Export the covenant and audit history as JSON and Markdown.

The slice must run without brokerage access, market-data services, external AI
services, user accounts, or Infrastructure Commitment Ledger data.

This goal proves the policy, versioning, persistence, audit, and export
foundation. Portfolio calculations, triggers, simulations, and external
evidence belong to successor goals.

## PROOF OF DONE:

1. From a clean checkout, `npm ci` exits 0.
2. `npm run lint` exits 0.
3. `npm run typecheck` exits 0.
4. `npm test` exits 0 and includes tests proving:
   - required covenant-field validation;
   - an approved covenant cannot be mutated;
   - supersession preserves the prior version;
   - audit replay reconstructs the same state;
   - exports include versions and timestamps.
5. `npm run test:e2e` exits 0 and proves the browser workflow:
   create draft → approve → reject attempted mutation → supersede → export.
6. `npm run build` exits 0.
7. `npm run verify:core` runs the complete non-interactive core verification
   suite and is not a no-op wrapper.
8. Inspect one generated Markdown export and one JSON export. Both must contain
   the covenant version, approval timestamp, supersession link, and audit
   events.
9. `git diff --check` is clean once the checkout is under version control.
10. `PROGRESS.md` records the changed files, actual command results, assumptions,
    remaining risks, and the recommended successor goal.

## SCOPE:

Modify only the new application/toolchain surface and the active truth files:

- package and toolchain configuration;
- `apps/web/`;
- `packages/domain/`;
- `packages/audit/`;
- `packages/export/`;
- `tests/`;
- `GOAL.md`;
- `STANDARDS.md`;
- `IMPLEMENT.md`;
- `DECISIONS.md`;
- `PROGRESS.md`;
- `TASK_QUEUE.md`.

Read and preserve the existing blueprint documents as reference material:

- `AI_Watcher_COMPLETE.md`;
- `Decision_Covenant_GOAL.md`;
- `Decision_Covenant_BUILD_GUIDELINES.md`;
- `Decision_Covenant_ROADMAP.md`;
- `Infrastructure_Ledger_GOAL.md`;
- `Infrastructure_Ledger_BUILD_GUIDELINES.md`;
- `Infrastructure_Ledger_ROADMAP.md`.

Do not implement portfolio calculations, market-data connections, trigger
state, review workflows, rebalance simulation, notifications, LLM features,
or ledger integration in this goal. Do not modify or conduct the
Infrastructure Commitment Ledger research pilot.

## CONSTRAINTS:

- Use a TypeScript web application with SQLite and runtime schema validation.
- Bind locally by default and require no hosted infrastructure.
- Keep domain, audit, and export logic independent of the UI framework.
- Approved covenant versions must be immutable through every application write
  path.
- Material user actions must create durable domain audit events, not merely
  application log messages.
- Do not collect brokerage credentials or expose order endpoints.
- Do not execute, recommend, rank, or optimize trades.
- Do not call external models, send telemetry, or transmit portfolio data.
- Do not add broad multi-user abstractions or future features to this slice.
- Do not weaken tests or redefine immutability to make verification pass.
- Record every material implementation assumption in `DECISIONS.md` or
  `PROGRESS.md`.
- Preserve implemented behavior, deferred behavior, and research claims as
  separate categories.

## SAFETY / PROVENANCE:

- Present the product as user-authored policy and deterministic arithmetic,
  never as investment advice, crash prediction, or a recommended trade.
- Prefer language such as “Your predefined review condition was reached.”
- Preserve timestamps, versions, authorship, and provenance for every material
  covenant and audit event.
- Do not claim cryptographic tamper-proofing unless it is implemented and
  tested.
- Stop before adding personalized securities advice, execution, or other
  behavior requiring legal review.
- Do not send financial or portfolio information to an LLM or external service.

## ITERATION:

Before editing application code:

1. Record in `PROGRESS.md` that the starting checkout contains specifications
   but no implementation, package manifest, tests, or Git metadata.
2. Select the smallest maintained TypeScript stack satisfying this goal.
3. Record runtime versions, storage approach, schema strategy, and exact
   verification commands in `IMPLEMENT.md`.
4. Record material architecture and product choices in `DECISIONS.md`.
5. Create or update `STANDARDS.md` and `TASK_QUEUE.md` without rewriting the
   original blueprint documents.

Work in these small batches:

1. Repository and verification scaffold.
2. Covenant domain schema and lifecycle.
3. SQLite persistence and audit events.
4. JSON and Markdown export.
5. Minimal accessible local UI.
6. Browser workflow and final verification.

After each batch, run the nearest relevant unit, integration, or browser
verification. Diagnose failures before expanding scope. Keep `PROGRESS.md`
concise and evidence-based.

## STOP:

Pause and produce a blocker report if:

- the selected stack cannot run in the available environment;
- the same failure remains after three materially different repair attempts;
- a dependency requires credentials, a paid account, or external financial data;
- implementation would require brokerage access or personalized advice;
- a product decision would expand this vertical slice materially;
- sensitive financial data could leave the local machine;
- destructive filesystem action or production deployment would be required.

## COMPLETE:

Mark this goal complete only when every `PROOF OF DONE` item has passed with
actual command output and inspected artifacts. A scaffold, mock screenshot,
partial workflow, or passing unit tests without the browser lifecycle is not
completion.

When complete, record the next bounded goal in `TASK_QUEUE.md`. The expected
successor order is:

1. Portfolio snapshots and reproducible calculations.
2. Deterministic trigger state machine.
3. Structured review workflow.
4. Rebalance simulation.
5. Outcome history, security, backup, accessibility, and release proof.
6. Infrastructure Ledger research as a separate goal.
7. Optional evidence-card integration only after the ledger passes its stated
   data, attribution, lead-time, and prospective-value gates.
