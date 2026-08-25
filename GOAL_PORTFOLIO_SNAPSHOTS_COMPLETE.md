# GOAL.md — Portfolio Snapshots and Reproducible Calculations

**Status:** Complete — verified 2026-08-24
**Working product name:** Decision Covenant
**Repository codename:** BubblerEyes
**Source date:** 2026-08-24
**Predecessor:** `GOAL_FOUNDATION_COMPLETE.md`

This goal extends the verified covenant foundation. It does not reopen the
foundation lifecycle, audit, export, or local-runtime decisions.

## OUTCOME:

Add an immutable portfolio-snapshot and calculation slice to the local
Decision Covenant application.

A single local user must be able to:

1. Enter a dated portfolio snapshot manually.
2. Import a snapshot from the defined CSV contract.
3. Receive explicit validation errors for missing, conflicting, duplicated, or
   ambiguous input rather than silent data correction.
4. View total portfolio value and per-position concentration.
5. View user-defined AI exposure when every required classification is known,
   or a visible incomplete/unknown state when it is not.
6. Compare snapshots and see concentration drift with its calculation inputs.
7. View portfolio-level drawdown from a documented observed reference high.
8. Export the original inputs, outputs, formula descriptions, timestamps, data
   source, and calculation version.

The calculation slice must work without brokerage access, market-data feeds,
external AI services, triggers, simulations, notifications, or Infrastructure
Commitment Ledger data.

## PROOF OF DONE:

1. From a clean checkout, `npm ci` exits 0.
2. `npm run lint` exits 0.
3. `npm run typecheck` exits 0.
4. `npm test` exits 0 and preserves all predecessor tests, plus tests proving:
   - the required CSV columns are validated;
   - a supplied market-value conflict is surfaced and not silently resolved;
   - duplicate positions require explicit resolution;
   - an unknown `ai_exposure_fraction` is not treated as zero;
   - identical snapshot inputs and calculation version produce identical
     outputs;
   - stored snapshots are immutable;
   - concentration drift is reproducible from exported inputs;
   - drawdown records its reference-high rule and calculation version.
5. `npm run test:e2e` exits 0 and proves the browser workflow:
   create snapshot → import CSV → inspect totals and unknown-data state →
   compare snapshots → export.
6. `npm run build` exits 0.
7. `npm run verify:core` exits 0 and includes the predecessor foundation
   checks, calculation tests, browser workflow, and export verification.
8. `npm run verify:calculations` exits 0 and writes inspectable JSON and
   Markdown artifacts containing:
   - source snapshot inputs;
   - total value and position weights;
   - AI-exposure completeness state;
   - drift and drawdown inputs and outputs;
   - formula descriptions;
   - `calculationVersion`;
   - `asOf` and source timestamps.
9. Inspect one generated calculation export and confirm that unknown
   classifications are visibly unknown rather than zero-valued.
10. `PROGRESS.md` records actual command output, changed files, assumptions,
    remaining risks, and the recommended successor goal.
11. `git diff --check` is clean.

## SCOPE:

Modify only the calculation slice and active truth surface:

- `apps/web/` snapshot routes and UI;
- `packages/domain/` snapshot types and validation;
- new `packages/snapshots/` persistence and CSV import logic;
- new `packages/calculations/` deterministic formulas;
- `packages/export/` calculation export extensions;
- `tests/` unit, integration, and browser tests;
- `scripts/` calculation verification helpers;
- `GOAL.md`;
- `PROGRESS.md`;
- `TASK_QUEUE.md`;
- `DECISIONS.md`, `IMPLEMENT.md`, or `STANDARDS.md` only when documenting
  decisions required by this goal.

Read and preserve these reference documents unchanged:

- `GOAL_FOUNDATION_COMPLETE.md`;
- `Decision_Covenant_GOAL.md`;
- `Decision_Covenant_BUILD_GUIDELINES.md`;
- `Decision_Covenant_ROADMAP.md`;
- `Infrastructure_Ledger_GOAL.md`;
- `Infrastructure_Ledger_BUILD_GUIDELINES.md`;
- `Infrastructure_Ledger_ROADMAP.md`.

Do not implement triggers, persistence/hysteresis/cooldown state, review
workflow, rebalance simulation, market-price retrieval, brokerage import,
notifications, LLM features, predictive signals, or ledger integration.

## INPUT CONTRACT:

The initial CSV contract is:

```csv
as_of,portfolio_name,asset_id,symbol_or_name,quantity,price,market_value,ai_exposure_fraction,account_group
```

Rules:

- `as_of`, portfolio name, asset identity, quantity, and account group are
  required for a valid position row.
- `market_value` may be calculated from `quantity * price` or supplied. If
  both are supplied and conflict beyond the documented rounding tolerance,
  reject the row and report the conflict.
- `ai_exposure_fraction` is between 0 and 1 when present. A missing value is
  unknown and must remain unknown; it is never silently converted to zero.
- Duplicate `(portfolio_name, asset_id, account_group)` rows require an
  explicit user resolution. Do not auto-merge positions.
- The imported snapshot is immutable once accepted. Corrections create a new
  snapshot and preserve the rejected/imported source record as appropriate.

## CALCULATION CONTRACT:

- Every result carries `calculationVersion` and the exact input snapshot IDs.
- `position_weight = position_market_value / total_portfolio_value`.
- If all positions have known AI exposure fractions, show total AI exposure as
  the weighted sum. Otherwise show an incomplete/unknown state and identify
  the unresolved positions; do not present a complete percentage.
- Concentration drift reports both absolute percentage-point change and
  relative percentage change against a selected prior snapshot.
- Portfolio drawdown uses only the saved portfolio snapshot series in this
  goal: current total value relative to the selected observed reference high.
  It is descriptive arithmetic, not a performance or investment claim.
- The drawdown result records reference-high rule, lookback/input snapshots,
  cash-flow treatment, source, and calculation version.
- Rounding, missing-data, invalid-value, and zero-total behavior are explicit
  and tested.

## CONSTRAINTS:

- Keep all predecessor covenant, audit, export, and local SQLite behavior
  passing unchanged.
- Keep calculation logic independent of the UI framework.
- Snapshots and calculation inputs are immutable after acceptance.
- Never treat missing classifications, prices, or values as safe defaults.
- Never infer AI exposure from asset names, symbols, or external knowledge.
- Never imply that concentration, drawdown, or exposure is a recommendation.
- Do not add external network calls, brokerage credentials, telemetry, or model
  calls.
- Do not add triggers or action selection to this goal.
- Do not modify the Infrastructure Ledger research track.
- Do not weaken or delete tests to obtain a passing build.
- Record material assumptions in `DECISIONS.md` and verified progress in
  `PROGRESS.md`.

## SAFETY / PROVENANCE:

- Display user-entered classifications as user-defined, not universal truth.
- Display data freshness, `asOf`, source, and calculation version beside
  derived values.
- Label unknown, unavailable, and invalid states distinctly.
- Use descriptive language such as “Observed portfolio drawdown from the
  selected reference high.”
- Do not present a calculated value as a forecast, advice, target, or required
  action.
- Preserve original imported values and validation errors for auditability.
- Do not send portfolio data to an LLM or external service.

## ITERATION:

Before editing:

1. Read `GOAL_FOUNDATION_COMPLETE.md`, `IMPLEMENT.md`, `DECISIONS.md`, and the
   existing domain/audit/export code.
2. Record the selected snapshot schema, CSV conflict policy, calculation
   version, rounding tolerance, and drawdown assumptions.
3. Add the exact new verification commands to `IMPLEMENT.md`.
4. Add fixtures for complete, unknown, conflicting, duplicate, empty, and
   zero-total inputs.

Work in these batches:

1. Snapshot domain types, schema, and immutable persistence.
2. CSV parser, validation errors, and import fixtures.
3. Deterministic concentration, AI-exposure, drift, and drawdown calculations.
4. Calculation explanations and JSON/Markdown export artifacts.
5. Accessible local UI and browser workflow.
6. Full predecessor-plus-calculation verification and progress update.

After each batch, run the nearest relevant verification. Diagnose failures
before expanding scope.

## STOP:

Pause with a blocker report if:

- a required input rule is ambiguous enough to change displayed results;
- a calculation requires live market data or an external classification source;
- the same failure remains after three materially different repair attempts;
- the change would alter predecessor lifecycle or audit semantics;
- a product decision would introduce triggers, recommendations, or simulations;
- sensitive financial data could leave the local machine;
- a destructive action or production deployment would be required.

## COMPLETE:

Mark this goal complete only when every `PROOF OF DONE` item passes with actual
command output and inspected artifacts, the predecessor suite remains green,
and `TASK_QUEUE.md` names the deterministic trigger-state goal as the next
bounded objective.
