# GOAL.md — Deterministic Seven-Trigger Policy State Engine

**Status:** Complete
**Working product name:** Decision Covenant
**Repository codename:** BubblerEyes
**Source date:** 2026-08-24
**Predecessor:** `GOAL_PORTFOLIO_SNAPSHOTS_COMPLETE.md`
**Governing references:** `Decision_Covenant_GOAL.md`,
`Decision_Covenant_BUILD_GUIDELINES.md`, and `Decision_Covenant_ROADMAP.md`

This goal adds the complete seven-trigger policy engine to the verified local
covenant and portfolio-snapshot foundation. It does not reopen covenant
lifecycle, audit, export, snapshot immutability, or the local-only boundary.

## OUTCOME

A single local user must be able to define, approve, evaluate, explain, and
persist all seven ordinary review triggers below. The engine evaluates only
user-authored covenant definitions and saved local observations. It never
predicts a crash, recommends a trade, executes an action, or silently treats
missing data as normal.

Every trigger is versioned with the approved covenant and calculation version.
Every evaluation is reproducible from its stored inputs, timestamps, rule
settings, and data-availability decision. Every material state change produces
an immutable audit event and a user-readable explanation.

## THE SEVEN TRIGGERS

The implementation must support every item in this list; none may be silently
deferred to a later goal.

1. **AI exposure above threshold** — evaluate the weighted user-defined AI
   exposure from a saved portfolio snapshot. Unknown classifications make the
   metric unavailable; they are never converted to zero.
2. **Single-position concentration above threshold** — evaluate the largest
   position weight, with the triggering position identified by asset and
   account.
3. **Trailing drawdown above threshold** — evaluate observed portfolio
   drawdown from the selected saved reference high, using the existing
   descriptive drawdown contract.
4. **Trailing realized volatility above threshold** — evaluate realized
   volatility from a saved portfolio-snapshot series using explicit lookback,
   return interval, annualization, missing-observation, and price-adjustment
   settings. This is descriptive arithmetic, not a forecast.
5. **Appreciation-driven concentration** — determine whether a position's
   concentration increase is attributable to price appreciation rather than
   quantity change, using a documented counterfactual based on current
   quantities at prior saved prices.
6. **Scheduled review date** — enter the configured review state at or after a
   user-defined date/time and timezone.
7. **Covenant review overdue** — enter the configured review state when the
   interval since approval or the last completed review has elapsed.

The first five use saved portfolio observations. The last two use immutable
covenant and review timestamps. No brokerage, market-data, external
classification, external AI, or Infrastructure Commitment Ledger integration
is permitted.

## TRIGGER DEFINITION CONTRACT

Each approved covenant may contain zero or more immutable trigger definitions.
A definition contains:

- stable trigger ID and trigger type;
- covenant ID and covenant version;
- trigger definition version;
- enabled state;
- metric settings and their units;
- entry threshold and exit threshold where numeric;
- persistence requirement in observations or elapsed time;
- cooldown interval;
- severity and optional emergency threshold;
- explicit missing-data policy;
- review instructions written as user-authored descriptive text;
- creation, approval, and supersession timestamps.

Once the containing covenant is approved, neither the trigger definition nor
its settings may be edited. A correction creates a new covenant successor and
new trigger-definition versions. Historical evaluations always retain the
definition and covenant versions that produced them.

### Numeric settings

- AI exposure and concentration thresholds are fractions in `[0, 1]`.
- Drawdown and volatility thresholds declare whether they are stored as
  fractions or percentages and are serialized consistently.
- Volatility declares `lookbackObservations`, `returnInterval`,
  `annualizationFactor`, `missingObservationPolicy`, and
  `priceAdjustmentConvention`.
- Appreciation-driven concentration declares the minimum concentration change
  and minimum appreciation contribution required to enter.
- Persistence declares a positive observation count or elapsed duration.
- Cooldown declares a non-negative duration and timezone where date arithmetic
  requires one.
- Scheduled review declares an ISO timestamp and an explicit IANA timezone.
- Overdue review declares an interval and whether the clock starts at covenant
  approval or the most recent completed review.

Invalid, ambiguous, non-finite, negative, or unit-inconsistent settings are
rejected before persistence with field-level errors.

## METRIC CONTRACTS

### AI exposure

Use the existing weighted exposure calculation and its calculation version.
When any required classification is unknown, return `unavailable` with the
unresolved position keys and apply the definition's missing-data policy. Never
evaluate unknown as zero.

### Single-position concentration

`position_weight = position_market_value / total_portfolio_value`.
Evaluate the maximum position weight and retain the position key, total value,
and all calculation inputs. Zero or invalid totals are unavailable, not safe
defaults.

### Trailing drawdown

Use the existing observed rule:

`(current_total_value - selected_reference_high) / selected_reference_high`

The evaluation records the reference-high rule, reference snapshot, lookback
snapshot IDs, cash-flow treatment, source, `asOf`, and calculation version.
It is never described as a forecast or investment loss prediction.

### Trailing realized volatility

Use only the saved portfolio-snapshot series. The definition must make the
following formula inputs visible: consecutive observation selection, return
interval, return formula, lookback length, annualization factor, missing-data
behavior, and price-adjustment convention. Insufficient or non-consecutive
observations produce the configured unavailable result and an explanation.
No implied volatility, forward estimate, market feed, or hidden risk score is
allowed.

### Appreciation-driven concentration

For a position present in both selected snapshots, calculate the current
position weight from current quantity and current price, then calculate the
counterfactual weight using current quantity at the prior saved price for all
matched positions. The documented appreciation contribution is the difference
between those current and counterfactual weights. The evaluation retains both
weights, prices, quantities, matched position IDs, and the exact snapshots.
Missing matches, prices, or valid totals produce an explicit unavailable result.

### Scheduled review and overdue review

Date triggers use normalized ISO timestamps and the configured IANA timezone.
Boundary behavior is inclusive and tested. Overdue review uses the immutable
approved covenant timestamp or the latest completed-review timestamp selected
by the definition. Missing approval or review history is unavailable and
requires visible manual resolution; it is never treated as reviewed.

## STATE MACHINE

Every trigger has one persisted state:

1. **Normal** — the condition is not active.
2. **Watch** — the condition is observed but has not satisfied persistence.
3. **Review** — the condition has satisfied persistence and opens a review
   condition.
4. **Escalated Review** — multiple independent active conditions, a severe
   condition, or an explicitly crossed emergency threshold requires explicit
   review.
5. **Cooldown** — a review was completed and duplicate conditions are
   suppressed until the configured cooldown ends.

State transitions are deterministic functions of the prior persisted state,
the versioned definition, the current evaluation, prior qualifying
observations, and review/cooldown timestamps. Separate entry and exit
thresholds prevent oscillation. A condition must remain true for its
persistence requirement before entering Review; it must remain below its exit
threshold for the configured clearing persistence before clearing.

Missing data follows the trigger definition's explicit policy. The default
permitted behavior is `hold_prior_state` plus a visible `unavailable` data
status; no implementation may silently transition to Normal. Each evaluation
and transition explains the metric, observed value or unavailable reason,
entry/exit threshold, persistence achieved, covenant version, trigger version,
data timestamp, and calculation version.

Cooldown suppresses duplicate Review events after a completed review. An
explicitly configured emergency threshold may bypass cooldown and must be
recorded as such. Acknowledge/open/complete-review records are minimal trigger
engine events only; the full structured review form is the successor goal.

## PROOF OF DONE

1. From a clean dependency state, `npm ci` exits 0.
2. `npm run lint` exits 0.
3. `npm run typecheck` exits 0.
4. `npm test` exits 0, preserves every predecessor test, and includes focused
   tests for all seven trigger metrics.
5. Trigger tests prove, for every trigger:
   - valid definition creation and invalid setting rejection;
   - exact boundary behavior;
   - entry and exit hysteresis;
   - persistence before Review;
   - explicit missing-data behavior;
   - immutable versioned inputs and deterministic replay.
6. State-machine tests prove Normal → Watch → Review, clearing, Escalated
   Review, Cooldown suppression, emergency bypass when configured,
   deduplication, restart/replay persistence, and timezone boundaries.
7. The seven metric suites specifically prove:
   - unknown AI exposure is unavailable, never zero;
   - largest-position concentration identifies the position;
   - drawdown uses the documented saved reference high;
   - volatility records all formula settings and rejects insufficient series;
   - appreciation-driven concentration records current/counterfactual inputs;
   - scheduled review fires at the inclusive configured timestamp;
   - overdue review uses approval/last-review interval semantics.
8. Trigger definitions, evaluations, state transitions, acknowledgements,
   review completion, cooldown, and emergency bypass events persist in local
   SQLite, survive reopen, replay deterministically, and remain immutable.
9. `npm run test:e2e` proves the local browser workflow:
   approve covenant with all seven definitions → enter/import observations →
   evaluate triggers → inspect state and explanation → acknowledge/complete a
   minimal review → observe cooldown → export the trigger record.
10. `npm run build` exits 0.
11. `npm run verify:triggers` exits 0 and writes inspectable JSON and Markdown
    evidence containing definitions, all seven trigger types, source inputs,
    metric outputs, state transitions, unavailable reasons, timestamps,
    covenant/trigger/calculation versions, and audit events.
12. `npm run verify:core` exits 0 and includes predecessor, snapshot,
    calculation, trigger, browser, and export verification.
13. Inspect generated evidence and confirm that no unknown, unavailable,
    forecast, recommendation, or emergency claim is disguised as a normal
    numeric result.
14. `PROGRESS.md` records actual commands, changed files, assumptions,
    remaining risks, and the next structured-review successor.
15. `git diff --check` is clean, and all governing reference documents remain
    unchanged.

## SCOPE

Modify only the trigger slice and active truth surface:

- `packages/triggers/` for definitions, evaluation, state transitions, and
  replay;
- `packages/calculations/` only for the transparent volatility and
  appreciation-contribution calculations required by this goal;
- `packages/domain/` for approved versioned trigger definitions;
- `packages/audit/` for immutable trigger/review/cooldown events;
- `packages/snapshots/` only where additional saved observation inputs are
  required without weakening snapshot immutability;
- `packages/export/` for trigger JSON/Markdown provenance;
- `apps/web/` for accessible trigger definition, evaluation, explanation, and
  minimal acknowledgement/completion controls;
- `tests/` and `scripts/` for focused, browser, and evidence verification;
- `GOAL.md`, `TASK_QUEUE.md`, `PROGRESS.md`, `DECISIONS.md`, `IMPLEMENT.md`,
  or `STANDARDS.md` only for decisions and proof required by this goal.

Preserve unchanged:

- `GOAL_PORTFOLIO_SNAPSHOTS_COMPLETE.md`;
- `GOAL_FOUNDATION_COMPLETE.md`;
- `Decision_Covenant_GOAL.md`;
- `Decision_Covenant_BUILD_GUIDELINES.md`;
- `Decision_Covenant_ROADMAP.md`;
- all Infrastructure Commitment Ledger reference documents.

## CONSTRAINTS

- Keep all predecessor covenant, audit, export, snapshot, calculation, and
  local SQLite behavior passing unchanged.
- Keep trigger and calculation logic independent of the UI framework.
- Keep approved covenants, trigger definitions, evaluations, and state events
  immutable after acceptance.
- Use only user-entered or locally saved observations; no external network,
  brokerage, credentials, model, telemetry, or provider calls.
- Never infer AI exposure or volatility inputs from names or outside knowledge.
- Never present a trigger as a crash forecast, investment advice, required
  action, or trade recommendation.
- Never silently convert missing, invalid, insufficient, or unavailable data to
  zero, Normal, cleared, or reviewed.
- Do not implement the full structured review workflow, rebalance simulation,
  outcome history, or Infrastructure Ledger integration in this goal.
- Do not weaken or delete predecessor tests to obtain a passing build.
- Record material assumptions in `DECISIONS.md` and verified progress in
  `PROGRESS.md`.

## SAFETY / PROVENANCE

- Display trigger definitions as user-authored policy, not universal truth.
- Display data source, freshness, `asOf`, timezone, formula settings, and all
  applicable versions beside every state and metric.
- Label `unknown`, `unavailable`, `invalid`, `watch`, `review`, `escalated`,
  and `cooldown` distinctly.
- Use language such as “Your predefined review condition was reached.”
- Preserve source observations, rejected definitions, unavailable reasons,
  transition inputs, and audit events for export and replay.
- Do not send portfolio, covenant, or trigger data to an LLM or external
  service.

## ITERATION

Before editing code:

1. Read the predecessor goal, implementation contract, decisions, and current
   snapshot/calculation/audit code.
2. Record the seven trigger schemas, units, timezone rules, persistence and
   cooldown semantics, missing-data policy, volatility formula, and
   appreciation counterfactual in `DECISIONS.md`.
3. Add `verify:triggers` and the aggregate command to `IMPLEMENT.md`.
4. Create fixtures covering complete, unknown, unavailable, invalid,
   insufficient-series, boundary, oscillating, emergency, scheduled, overdue,
   and versioned inputs.

Work in these batches:

1. Versioned trigger definitions and validation for all seven types.
2. Transparent volatility and appreciation-contribution calculations.
3. Evaluation records, missing-data policies, persistence, hysteresis, and
   deterministic state transitions.
4. SQLite durability, audit events, replay, cooldown, deduplication, and
   emergency bypass.
5. Trigger evidence exports and accessible local UI.
6. Browser workflow and full predecessor-plus-trigger verification.

After each batch, run the nearest focused proof and diagnose failures before
expanding scope.

## STOP

Pause with a blocker report if:

- any of the seven trigger definitions requires live market data or an
  external classification source;
- volatility or appreciation attribution cannot be defined from saved local
  observations without hidden assumptions;
- a missing-data rule would silently clear, normalize, or review a condition;
- a state transition would alter predecessor lifecycle, audit, or snapshot
  immutability semantics;
- the work would introduce recommendations, trading, forecasts, or a full
  structured review workflow;
- sensitive financial data could leave the local machine;
- the same failure remains after three materially different repair attempts;
- destructive action, production deployment, or an unapproved product-scope
  decision is required.

## COMPLETE

Mark this goal complete only when every proof item passes with fresh command
output and inspected artifacts, all seven trigger types have deterministic
boundary/persistence/missing-data evidence, predecessor suites remain green,
and `TASK_QUEUE.md` names structured review workflow as the next bounded goal.
