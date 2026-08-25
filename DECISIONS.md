# DECISIONS.md — Decision Covenant

## 2026-08-24 — Foundation stack

Selected Node 24, strict TypeScript, built-in `node:sqlite`, and built-in
`node:http`. This avoids native database compilation and keeps the local-first
runtime small. The blueprint allows a server-rendered TypeScript application
and SQLite, so this choice stays within the approved boundary.

## 2026-08-24 — First slice boundary

The first implementation stops at covenant lifecycle, persistence, audit, and
export. Portfolio calculations, triggers, simulations, market feeds,
notifications, and research evidence are successor work.

## 2026-08-24 — Immutability model

An approved covenant row is never updated. A successor is a new draft with a
`supersedesId` reference; the prior approved row remains byte-for-byte stable.
The relationship is recorded as an audit event.

## 2026-08-24 — Product naming

“Decision Covenant” is the working product name. “BubblerEyes” is retained as
the repository codename until a separate naming decision is made.

## 2026-08-24 — Portfolio snapshot contract

Snapshots are immutable point-in-time records. A correction creates a new
snapshot and retains the original source and validation outcome. The initial
CSV contract is the nine-column contract in `GOAL.md`.

## 2026-08-24 — CSV conflict and duplicate policy

If supplied `market_value` conflicts with `quantity * price` beyond a 0.01
rounding tolerance, the row is rejected with a visible error. Duplicate
`(portfolio_name, asset_id, account_group)` rows are rejected until the user
explicitly resolves them; the importer never auto-merges positions.

## 2026-08-24 — Calculation semantics

`calculationVersion` starts at `1`. Missing AI classification remains unknown;
the UI reports incomplete AI exposure rather than treating it as zero. Drawdown
uses the saved portfolio snapshot series and the selected observed reference
high only. It is descriptive arithmetic and does not estimate returns or give
investment advice. Derived ratios are rounded to 12 decimal places for stable
serialized output; display formatting is separate.

## 2026-08-24 — Recovery export boundary

The deterministic position key retains its NUL separator internally for map
stability, but Markdown exports must render it as `asset / account` text. A
raw NUL made the recovered calculation Markdown artifact binary and was fixed
with a serializer regression assertion; JSON continues to preserve the exact
internal input key through normal escaping.

## 2026-08-24 — Seven-trigger engine contract

The successor trigger goal implements all seven ordinary trigger types against
local saved observations and immutable covenant/review timestamps. Trigger
definitions are stored with a covenant ID/version and trigger-definition
version; approval freezes their settings. Numeric triggers use explicit entry,
exit, persistence, clearing-persistence, severity, cooldown, and missing-data
settings. Missing data defaults to `hold_prior_state` with visible
`unavailable` status and never becomes zero, Normal, cleared, or reviewed.

The state machine is `normal`, `watch`, `review`, `escalated_review`, or
`cooldown`. Volatility uses sample standard deviation of saved total-value
returns over the configured observation lookback, multiplied by the explicit
annualization factor. Appreciation contribution compares current weights with
a counterfactual using current quantities at prior saved prices. Scheduled and
overdue review triggers use ISO timestamps and explicit IANA timezones. A
minimal review-completion event is sufficient to enter cooldown; the full
structured review form remains a later goal.

## 2026-08-24 — Trigger hardening

Numeric clearing is hysteretic: a condition that has entered Watch or Review
is retained while its observed value remains at or above the exit threshold
(or, for drawdown, remains at or below the negative exit threshold). Scheduled
and overdue conditions clear from their boolean observation only after the
configured clearing persistence. A volatility definition may provide
`returnIntervalMs`; any saved observation gap that does not exactly match it
is unavailable rather than silently treated as a regular return.

The aggregate evaluator computes all available active conditions before
persisting the batch. Two or more independent active definitions escalate to
`escalated_review`; a cooldown still only bypasses for its explicit emergency
threshold. The aggregate batch is idempotent per trigger and observation
timestamp and commits its state projections and audit events atomically.

## 2026-08-24 — Structured review packet

The structured review is a local, user-authored packet linked to one or more
currently active trigger definitions. Opening captures covenant context,
trigger versions, states, and latest evaluation IDs. Completion requires
factual observations, a falsifier check, a bounded descriptive decision
(`continue_policy`, `deescalate`, `defer_review`, or `create_successor`), and a
rationale. A follow-up timestamp is optional but cannot precede completion.

Completed packets are immutable. Their completion and linked trigger cooldown
transitions run in one SQLite transaction; if any linked trigger is no longer
active, the entire completion rolls back. The packet records policy context as
read-only evidence and never turns candidate actions into generated advice or
executed actions.

## 2026-08-25 — UX hardening boundary

The UX pass preserves the server-rendered, local-only stack and all domain
semantics. Improvements stay at the presentation and browser-interaction
boundary: section wayfinding, responsive layout, focus/error states, request
locking, and ephemeral success context. Successful mutations may reload the
server-rendered page, but a short session-scoped flash message and section hash
restore the user's context; no user-authored policy or portfolio data is placed
in the message.

## 2026-08-25 — Guided decision workspace

The default first-use surface is an example-led decision review bench, not a
long blank covenant form. Four situation packs each contain three distinct,
complete, explicitly fictional policy lifecycles. Selecting and resetting an
example is presentation-only. “Use as my starting point” copies only covenant
fields into an editable draft; fictional observations, trigger evaluations,
reviews, and cooldown records never enter personal persistence.

Returning users receive a deterministic summary of saved policy, observation,
condition, review, and schedule state before the example library. Observation
rows, percentage-based guardrails, and guided controls for all seven condition
types are the normal interaction path. Raw JSON remains an Advanced exact-input
path rather than the product's default vocabulary.

## 2026-08-25 — Variant generation provider boundary

Bundled examples are the only active variant source in this goal. The runtime
contract is provider-neutral and normalizes two or three covenant variants with
explicit provenance, but no local or OpenRouter adapter, credential handling,
network call, or simulated model response is implemented.

A successor may add interchangeable local OpenAI-compatible and OpenRouter
adapters only with secure credential storage, redaction tests, explicit model
and provider provenance, timeout and budget enforcement, and failure-state
proof. Deliberately configuring OpenRouter is the consent event; normal use
should not repeat a warning afterward. Raw credentials may never enter SQLite,
rendered HTML, logs, exports, test fixtures, or delegated work.

## 2026-08-25 — Visual direction

The product uses a decision review bench visual system: warm pale-stone canvas,
deep-ink navigation and summary fields, saturated cobalt selection and primary
actions, thin registration rules, clipped controls, and restrained semantic
state colors. The design intentionally avoids rounded-card grids, decorative
finance imagery, gradients, glass effects, and gamified trading conventions.
Manrope is bundled under its Open Font License and served by the local server
as the `Decision Sans` variable family; no font CDN or remote asset request is
allowed. System sans-serif fallbacks remain available if local font loading
fails.
