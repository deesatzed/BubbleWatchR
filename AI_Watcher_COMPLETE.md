# AI Bubble Prediction and Watcher Program — Complete Blueprint
Generated 2026-08-23


---

<!-- Source: README.md -->

# AI Bubble Prediction and Watcher Program

**Version:** 1.0  
**Date:** 2026-08-23  
**Status:** Build-ready two-track plan

## Purpose

This repository blueprint converts the prior design and critique cycle into two independent, executable tracks:

1. **Decision Covenant** — a useful product that helps a user define, simulate, lock, and follow calm portfolio review policies without claiming to predict an AI crash.
2. **AI Infrastructure Commitment Ledger** — a falsifiable data-research program testing whether public operational records reveal named-company changes in AI infrastructure commitments before conventional company disclosure.

The tracks are intentionally separated. The Decision Covenant does not depend on the prediction research succeeding. The ledger does not need to produce a crash forecast to be valuable. Integration occurs only after the ledger demonstrates reproducible, point-in-time information lead and later shows prospective incremental value over simple baselines.

## Repository structure

```text
ai-bubble-watcher-blueprint/
├── README.md
├── decision-covenant/
│   ├── GOAL.md
│   ├── ROADMAP.md
│   └── BUILD_GUIDELINES.md
└── infrastructure-commitment-ledger/
    ├── GOAL.md
    ├── ROADMAP.md
    └── BUILD_GUIDELINES.md
```

## Fixed decisions

The following decisions are settled for the initial builds and should not be reopened without evidence from implementation:

### Decision Covenant

- It is a precommitment and review system, not an investment oracle.
- The first version uses only user-entered policy, portfolio concentration, trailing drawdown, volatility change, appreciation-driven concentration drift, and scheduled reviews.
- It provides simulations and policy-trigger notifications, not security-specific trading instructions.
- It has no broker write access and performs no automatic execution.
- A user can always override a policy, but the deviation and reason are recorded.
- A validated external signal may later be attached as evidence; it may not silently become a command.

### Infrastructure Commitment Ledger

- The first jurisdiction is the Georgia Power / Georgia Public Service Commission ecosystem, subject to a brief source-availability confirmation.
- The pilot uses manual review and manual data entry before automation.
- The initial ledger has eleven required fields, not a generalized national ontology.
- Sponsor attribution must be point-in-time: later knowledge cannot be backdated.
- Project state changes are recorded, but the first analysis collapses them into simple advancing and deteriorating MW series.
- No multi-state hazard model, LLM council, dynamic ensemble, Monte Carlo crash probability, LPPLS date, insider model, GPU pricing index, or national-scale scraper is part of the pilot.
- Company capex or infrastructure guidance is the independent economic outcome. Utility forecast revisions are a baseline or control, not proof of independent foresight.
- The pilot reports base rates and alert burden before any claim of usefulness.

## Company-linked product kill gate

The company-specific Watcher path for the pilot jurisdiction stops unless all three conditions are met using contemporaneously available evidence:

1. At least **40% of projects** have defensible named-sponsor attribution.
2. Attributed projects represent at least **40% of requested MW**.
3. At least **40% of deteriorating, downsized, deferred, or withdrawn MW** is attributable.

Coverage is also reported on a confidence-adjusted basis. The exact 40% thresholds are commercial feasibility gates, not scientific constants.

A failed gate is a successful research result. The team records why the source failed and does not preserve the thesis by adding complexity, new models, or retrospective identity guesses.

## Shared program principles

### 1. Base rate before model

No future risk estimate may be shown alone. Every eventual Watcher output must display:

- Unconditional base rate
- Simple conditional baseline
- Watcher estimate
- Incremental change versus baseline
- Uncertainty
- Percentage of time the system has remained at the current alert level

A system that remains bearish for years before one correction has not succeeded.

### 2. Observation is not interpretation

A filing, docket, permit, or project withdrawal can establish that an event occurred. It does not deterministically establish why it occurred or what happens next.

Every operational event must separate:

- Observed fact
- Sponsor-attribution confidence
- Interpretation
- Alternative explanations
- Later resolution

### 3. Point-in-time or not in the backtest

Historical use requires the date when both the event and the sponsor attribution became publicly defensible. The effective signal date is:

```text
max(event_available_at, sponsor_attribution_available_at)
```

A sponsor identified in 2026 using a 2025 article cannot be treated as known in 2023.

### 4. Cap degrees of freedom, not raw observations

Many records may be collected, but they may not become independent predictive votes. The initial analysis uses descriptive series and case histories. New factors, weights, and models require a pre-registered prospective promotion path.

### 5. Manual before automated

The manual pilot is how the team learns:

- Whether projects have stable identity
- Whether amendments can be linked
- Whether stages are meaningful
- Whether MW is disclosed
- Whether sponsor attribution survives audit
- Whether the source has commercial lead time

Automation begins only after the manual representation proves viable.

### 6. Useful without prediction

The Decision Covenant is valuable without any external signal. The ledger may be valuable as a point-in-time infrastructure intelligence panel even if it never predicts a broad correction.

## Integration contract

The two tracks remain independent until the ledger passes four gates:

1. **Data gate:** source continuity, usable MW, auditable records.
2. **Attribution gate:** the 40%/40%/40% sponsor thresholds.
3. **Lead-time gate:** material events are observable before later company or broad public disclosure.
4. **Prospective-value gate:** the operational signal adds useful information beyond the base rate and a simple baseline without unacceptable alert burden.

Only then may ledger events appear in the Decision Covenant as optional evidence cards.

An integrated alert must never say “sell.” It may say:

> A policy review condition you defined has been reached. The new evidence is a point-in-time deterioration in named infrastructure commitments. Here is the observed event, its attribution confidence, the base rate, the contrary evidence, and the action options you previously recorded.

## Recommended implementation order

1. Freeze both `GOAL.md` documents.
2. Begin the Georgia manual source audit and ledger.
3. Build the Decision Covenant’s local single-user policy and audit-log core in parallel.
4. Apply the ledger kill gate without reinterpretation.
5. Ship the Covenant MVP regardless of the ledger result.
6. Automate the ledger only if the manual pilot passes.
7. Add a second jurisdiction only after the first is reproducible.
8. Start a prospective shadow Watcher only after enough reliable events exist.
9. Consider prediction models only after a simple baseline and an honest base-rate analysis are in place.

## Documents

### Decision Covenant

- [Goal](decision-covenant/GOAL.md)
- [Roadmap](decision-covenant/ROADMAP.md)
- [Build Guidelines](decision-covenant/BUILD_GUIDELINES.md)

### AI Infrastructure Commitment Ledger

- [Goal](infrastructure-commitment-ledger/GOAL.md)
- [Roadmap](infrastructure-commitment-ledger/ROADMAP.md)
- [Build Guidelines](infrastructure-commitment-ledger/BUILD_GUIDELINES.md)


---

<!-- Source: decision-covenant/GOAL.md -->

# GOAL.md — Decision Covenant

**Version:** 1.0  
**Date:** 2026-08-23  
**Status:** Approved build target

## Mission

Build a calm, auditable precommitment system that helps a user decide **in advance** how they will review and manage concentrated AI-related exposure under changing market conditions.

The Decision Covenant is not a crash predictor, robo-adviser, brokerage tool, or automatic trading engine. Its first value is behavioral: it turns vague intentions into explicit, timestamped policies and reminds the user when their own review conditions occur.

## Problem

A user may understand that an AI capital cycle could produce both extraordinary long-term winners and severe interim corrections, yet still make poor decisions because:

- Policies were never written down.
- Concentration grew through appreciation without deliberate approval.
- A review threshold was confused with an automatic sell signal.
- Decisions were improvised during fear or euphoria.
- The original investment thesis and falsifiers were forgotten.
- Rebalancing consequences were not simulated.
- Alerts lacked hysteresis and repeatedly changed state.
- Later outcomes were remembered selectively, obscuring whether the process helped.

The product must improve decision consistency without pretending to know when a bubble will pop.

## Primary user

The initial product is designed for a sophisticated individual user who:

- Holds or tracks concentrated exposure to AI-related securities or funds.
- Wants to preserve participation in long-term upside.
- Wants explicit limits on concentration and tolerable loss.
- Values transparent reasoning and an audit trail.
- Is willing to define personal policy rather than delegate discretion to an algorithm.

The architecture should permit later multi-user support, but the MVP is single-user and local-first.

## Core outcome

At any moment, the user can answer:

1. What policy did I choose while calm?
2. What conditions trigger a review?
3. Which condition has now occurred?
4. What evidence supports and contradicts concern?
5. What actions did I previously consider acceptable?
6. What would each action do to concentration and drawdown exposure?
7. Did I follow or override my policy, and why?
8. Did the policy improve my stated objective over time?

## Product principles

### Policy before alert

An alert has no authority unless it maps to a policy the user created or explicitly adopted beforehand.

### Review is not execution

A threshold normally opens a review workflow. It does not automatically create a trade instruction.

### User ownership

The user defines:

- Objective
- Maximum intended concentration
- Maximum acceptable drawdown
- Review conditions
- Potential actions
- Evidence that would reverse concern
- Re-entry conditions
- Cooldown and hysteresis rules

### Explicit uncertainty

External evidence, when later added, must show provenance, confidence, base rate, contradictory evidence, and alert duty cycle.

### Append-only history

Policies may be superseded but not silently rewritten. Every material version is timestamped and retained.

### Minimal regulatory surface

The MVP:

- Does not recommend specific securities.
- Does not rank trades.
- Does not execute trades.
- Does not write to broker accounts.
- Does not claim individualized investment advice.
- Requires legal review before adding personalized recommendations, compensation tied to investment decisions, or execution capability.

## In-scope MVP capabilities

### 1. Covenant creation

The user can create a policy containing:

- Policy name and purpose
- Covered assets or exposure category
- Current and maximum intended concentration
- Time horizon
- Maximum tolerable drawdown
- Review triggers
- Required evidence for escalation
- Candidate actions
- Re-entry or de-escalation conditions
- Cooldown period
- Notes and rationale
- Review date
- Version status

### 2. Portfolio snapshot

The user can manually enter or import a read-only snapshot containing:

- Asset
- Quantity
- Price or value
- User-defined AI exposure percentage
- Account or portfolio grouping
- Cost basis as optional metadata
- Snapshot date

The MVP does not need transaction-level brokerage integration.

### 3. Exposure calculations

The app calculates:

- Total portfolio value
- Asset concentration
- User-defined AI exposure
- Concentration drift since covenant approval
- Contribution of appreciation to concentration drift
- Drawdown from a selected reference high
- Trailing realized volatility using transparent settings

### 4. Policy-trigger engine

Initial trigger types are deliberately ordinary:

- AI exposure exceeds user-defined maximum
- Single-position concentration exceeds maximum
- Trailing drawdown exceeds threshold
- Volatility rises above threshold
- Position concentration rises primarily through appreciation
- Scheduled review date arrives
- Covenant has not been reviewed within a defined interval

Each trigger supports:

- Entry threshold
- Exit threshold
- Persistence requirement
- Cooldown interval
- Severity
- Review instructions

### 5. Review workflow

When a trigger occurs, the app opens a structured review:

- What changed?
- Is the trigger still valid after the persistence window?
- What evidence supports concern?
- What evidence argues against concern?
- Has the original thesis changed?
- Which previously approved actions remain appropriate?
- What new information would reverse the decision?
- Will the user follow, defer, modify, or override the policy?

### 6. Rebalance simulator

The simulator shows the effect of user-selected hypothetical actions on:

- AI exposure
- Single-position concentration
- Cash allocation
- Estimated portfolio loss under user-defined scenarios
- Remaining upside participation
- Turnover

The MVP does not optimize trades or recommend the “best” action.

### 7. Locking and audit history

The user can:

- Save a draft
- Approve and lock a covenant version
- Supersede a prior version
- Record a review
- Record an override
- Record the reason for deviation
- Compare intended versus actual behavior

### 8. Outcome review

At user-selected intervals, the app summarizes:

- Number of triggered reviews
- Time spent in each alert state
- Number of overrides
- Opportunity cost of hypothetical actions
- Drawdown avoided or added under user-selected comparisons
- Whether the policy met the user’s stated objective

The system must avoid claiming causal benefit when the evidence is only descriptive.

## Out of scope for the MVP

- AI-bubble probability
- Forecast of crash timing
- Security selection
- Trade recommendations
- Tax-lot optimization
- Options or hedging recommendations
- Broker write access
- Automatic execution
- Dynamic LLM-generated policy
- News sentiment
- Insider trading signals
- Utility or infrastructure data
- Monte Carlo market forecasts
- Personalized fiduciary advice

These may be evaluated later, but none is needed for the first useful product.

## Core domain objects

### Covenant

A versioned policy approved by the user.

### Trigger definition

A transparent condition that opens a review.

### Portfolio snapshot

A point-in-time user-entered or read-only portfolio representation.

### Alert event

A recorded instance of a trigger entering, persisting, escalating, or clearing.

### Review decision

The user’s response to an alert.

### Simulation

A non-executing hypothetical change and its calculated effects.

### Evidence card

A source-grounded observation attached to a review. External Watcher evidence is a future extension.

### Audit event

An immutable record of creation, approval, supersession, trigger, review, override, or export.

## Alert semantics

The system uses five states:

1. **Normal** — no review condition is active.
2. **Watch** — a condition is approaching but has not met persistence requirements.
3. **Review** — the user’s predefined condition has been reached.
4. **Escalated Review** — multiple independent policy conditions or a severe condition require explicit review.
5. **Cooldown** — a review recently concluded; repeated noise is suppressed unless an emergency threshold is crossed.

These states are workflow states, not market forecasts.

## Hysteresis rule

Every numerical trigger should support separate entry and exit thresholds.

Example:

```text
Enter review: AI exposure > 35% for five consecutive market days
Clear review: AI exposure < 32% for five consecutive market days
Cooldown: 14 days after completed review
```

The app must not oscillate between states because of minor daily changes.

## Success metrics

### Product usefulness

- Percentage of approved covenants with explicit entry, exit, and review rules
- Percentage of alerts that map to a valid covenant
- Percentage of reviews completed with supporting and contrary evidence
- Frequency of unexplained overrides
- User-reported confidence that decisions were less reactionary
- Time required to understand why an alert occurred

### Behavioral integrity

- Policies are created before triggering events.
- Historical versions cannot be silently edited.
- Review and override reasons are retained.
- The app distinguishes a review condition from an action.
- Alert burden remains acceptable.

### Technical quality

- Deterministic calculations reproduce exactly.
- Every alert can be reconstructed from stored inputs and rule version.
- Data export is complete.
- Tests cover threshold boundaries, persistence, cooldown, and versioning.
- No trade can be executed from the application.

## Failure conditions

The MVP fails if it:

- Becomes a disguised market-timing app.
- Generates security-specific instructions.
- Presents a trigger as proof that a crash is imminent.
- Hides the user’s own policy assumptions.
- Rewrites prior covenants.
- Fires noisy alerts without persistence or hysteresis.
- Requires a prediction engine before it is useful.
- Adds external data before the basic review workflow is usable.

## Future integration with the Watcher

A validated infrastructure signal may later appear as an evidence card only after it passes:

1. Point-in-time provenance review
2. Sponsor-attribution threshold
3. Demonstrated lead time
4. Prospective incremental-value test
5. Alert-burden review

The Decision Covenant remains the authority for workflow. The external signal cannot directly create a trade.

## Definition of done for the MVP

The MVP is complete when a user can:

1. Create and lock a covenant.
2. Enter a portfolio snapshot.
3. See concentration and drawdown calculations.
4. Define triggers with persistence, hysteresis, and cooldown.
5. Receive a deterministic review alert.
6. Run at least two hypothetical rebalances.
7. Record a decision or override.
8. View the full audit history.
9. Export the covenant and review record.
10. Use the product without any prediction model or broker connection.


---

<!-- Source: decision-covenant/ROADMAP.md -->

# ROADMAP.md — Decision Covenant

**Version:** 1.0  
**Date:** 2026-08-23  
**Roadmap type:** Milestone and gate based

## Roadmap objective

Deliver a useful, auditable Decision Covenant before integrating any AI-bubble forecast, alternative data, or brokerage execution.

Every milestone must leave the product usable. New sophistication is accepted only when it improves the core workflow: define policy while calm, detect a user-defined review condition, simulate options, and record the decision.

## Milestone 0 — Freeze product boundaries

### Deliverables

- Approved `GOAL.md`
- Written regulatory and product boundaries
- Initial domain-object definitions
- Initial alert-state definitions
- Explicit non-goals
- Definition of done

### Required decisions

- Single-user first
- Local-first or self-hosted storage for the prototype
- No broker write access
- No security recommendations
- No external prediction inputs
- Manual portfolio entry supported
- Read-only CSV import permitted
- Append-only audit history required

### Exit gate

No unresolved requirement may imply automatic trade execution or a prediction claim.

---

## Milestone 1 — Covenant core

### User capabilities

- Create a covenant draft
- Define covered exposure
- Record objective and rationale
- Set maximum concentration
- Set tolerable drawdown
- Define candidate actions
- Define falsifiers and re-entry conditions
- Approve and lock a version
- Supersede a prior version without deleting history

### Engineering deliverables

- Covenant data model
- Versioning
- Validation
- Append-only audit events
- Export to Markdown and JSON
- Unit tests for lifecycle rules

### Exit gate

A covenant can be created, locked, exported, superseded, and reconstructed from its audit log.

---

## Milestone 2 — Portfolio snapshot and transparent calculations

### User capabilities

- Enter assets manually
- Import a simple CSV
- Assign an AI-exposure percentage to each asset
- Group assets by portfolio or account
- Save dated snapshots
- View current concentration and AI exposure
- Select a drawdown reference point
- View transparent volatility calculations

### Engineering deliverables

- Snapshot schema
- CSV validation and error reporting
- Deterministic calculation library
- Calculation explanations
- Snapshot comparison
- Test fixtures for edge cases

### Exit gate

A user can reproduce every displayed number from exported inputs and documented formulas.

---

## Milestone 3 — Trigger and state engine

### Initial triggers

- AI exposure above threshold
- Single-position concentration above threshold
- Trailing drawdown above threshold
- Volatility above threshold
- Appreciation-driven concentration drift
- Scheduled review
- Covenant age or overdue review

### State behavior

- Normal
- Watch
- Review
- Escalated Review
- Cooldown

### Required controls

- Entry threshold
- Exit threshold
- Persistence
- Cooldown
- Severity
- Deduplication
- Manual acknowledgement
- Emergency override threshold where explicitly configured

### Exit gate

A fixed set of test time series produces exactly the expected state transitions, including boundary, missing-data, and oscillation cases.

---

## Milestone 4 — Structured review workflow

### Review sections

- Trigger explanation
- Current portfolio state
- Covenant text in force
- Supporting evidence
- Contrary evidence
- Thesis unchanged or changed
- Candidate actions previously authorized for consideration
- Decision
- Deferral date
- Override reason
- New falsifier or learning

### Required behavior

- An alert cannot be closed without a recorded disposition.
- Deferral requires a new review date.
- Override is allowed but visible.
- Editing the covenant creates a new version.
- The prior version remains linked to the alert that invoked it.

### Exit gate

A complete alert-to-review-to-decision workflow is auditable without relying on application logs outside the stored domain events.

---

## Milestone 5 — Rebalance simulator

### Capabilities

The user enters hypothetical changes and sees:

- New portfolio weights
- New AI exposure
- New single-position concentration
- Change in cash
- User-defined scenario loss
- Turnover
- Comparison with current portfolio

### Guardrails

- The app does not label an option “recommended.”
- No optimization engine is needed.
- No tax estimate is shown unless the user supplies adequate data and the feature is separately validated.
- Simulations do not modify the portfolio snapshot.

### Exit gate

At least two hypothetical actions can be compared side by side, and all outputs are reproducible from exported inputs.

---

## Milestone 6 — Outcome and policy-quality review

### Outputs

- Number of alerts
- Alert duty cycle
- Average time in Watch and Review
- Completed and deferred reviews
- Overrides and reasons
- Concentration drift over time
- Hypothetical outcome comparisons
- Policy changes and rationale

### Interpretation rule

The app describes outcomes; it does not claim that the policy caused better performance without an appropriate comparison.

### Exit gate

The user can review whether the process was followed and whether alert burden was acceptable.

---

## Milestone 7 — Usability, security, and release hardening

### Required work

- Threat model
- Local data encryption where practical
- Authentication if multi-user access exists
- Secure export
- Backup and restore
- Accessibility
- Clear disclaimers
- Error handling
- Full test suite
- Migration tests
- Dependency review
- Data deletion and retention controls

### Release gate

The MVP definition of done in `GOAL.md` is met, and no external predictive signal is required for any core workflow.

---

## Milestone 8 — Optional read-only data connections

This milestone is not required for the MVP.

### Candidate additions

- Read-only brokerage import
- Read-only market-price feed
- Scheduled snapshot refresh
- Secure account reconciliation

### Preconditions

- Legal and privacy review
- Explicit read-only architecture
- No order endpoint
- No credential storage unless necessary and properly protected
- Clear data-source timestamp and outage behavior

### Exit gate

A connection failure cannot create a false alert or alter an approved covenant.

---

## Milestone 9 — Watcher evidence-card integration

This milestone begins only after the Infrastructure Commitment Ledger passes its data, attribution, lead-time, and prospective-value gates.

### Integration scope

- Evidence cards with source reference
- Event date
- Public availability date
- Sponsor-attribution date and confidence
- Observed project change
- Alternative explanations
- Base rate
- Watcher estimate versus simple baseline
- Contrary evidence
- Signal version

### Forbidden behavior

- Automatic trade instruction
- Hidden weighting
- Bare crash probability
- Alert without duty-cycle context
- Backdated sponsor identity

### Exit gate

The evidence card improves review quality in prospective testing without increasing false certainty or excessive alert burden.

---

## Backlog deliberately deferred

- Broker execution
- Security-specific recommendations
- Options strategy generation
- Personalized tax optimization
- Fully automated policy writing
- LLM-generated investment thesis
- AI crash timing
- Dynamic model ensembles
- News-sentiment scoring
- Social-media prediction
- Insider-trading models
- Cross-user portfolio learning

## Product metrics by stage

| Stage | Primary metric |
|---|---|
| Covenant core | Percentage of required policy fields completed before lock |
| Snapshot | Calculation reproducibility |
| Trigger engine | Correct state transitions and acceptable alert burden |
| Review workflow | Completed reviews with explicit disposition |
| Simulator | User understanding of trade-offs |
| Outcome review | Policy adherence and transparent overrides |
| Watcher integration | Incremental review value over the simple baseline |

## Stop rules

Pause expansion and fix the core if any of the following occurs:

- Users treat Review as an automatic sell command.
- Alert duty cycle becomes persistently high.
- Users cannot explain why an alert fired.
- Historical policy versions are mutable.
- Simulations cannot be reproduced.
- External data begins driving actions before validation.
- Product language implies guaranteed protection or crash prediction.


---

<!-- Source: decision-covenant/BUILD_GUIDELINES.md -->

# BUILD_GUIDELINES.md — Decision Covenant

**Version:** 1.0  
**Date:** 2026-08-23  
**Purpose:** Technical and product rules for implementation

## 1. Build philosophy

Build the smallest system that reliably supports precommitment, deterministic alerting, simulation, and audit.

Do not solve hypothetical future requirements before the current workflow is used. Prefer explicit fields and transparent calculations over inferred intent, opaque scores, or LLM-generated policy.

## 2. Reference architecture

A practical reference implementation may use:

- **Frontend:** TypeScript with a server-rendered web framework
- **Application layer:** TypeScript in the same repository
- **Prototype database:** SQLite
- **Production database if multi-user:** PostgreSQL
- **Schema validation:** Runtime validation plus compile-time types
- **Testing:** Unit, integration, and browser-level tests
- **Export:** Markdown, JSON, and CSV
- **Deployment:** Local-first, self-hosted, or a small private web deployment

The domain contracts should not depend on a specific vendor.

### Recommended repository layout

```text
apps/
  web/
packages/
  domain/
  calculations/
  trigger-engine/
  simulation/
  audit/
  export/
  ui/
tests/
  fixtures/
  integration/
  e2e/
docs/
```

Keep the calculation and trigger packages independent of the user interface.

## 3. Domain model

### Covenant

Minimum fields:

```text
id
name
purpose
covered_exposure
objective
time_horizon
maximum_ai_concentration
maximum_single_position_concentration
maximum_tolerable_drawdown
review_rules
candidate_actions
falsifiers
deescalation_conditions
reentry_conditions
cooldown_policy
notes
status
version
created_at
approved_at
supersedes_id
```

### Portfolio snapshot

```text
id
as_of
portfolio_name
positions[]
source
created_at
```

Each position:

```text
asset_id
symbol_or_name
quantity
price
market_value
ai_exposure_fraction
account_group
optional_cost_basis
```

### Trigger rule

```text
id
covenant_version_id
metric
comparison
entry_threshold
exit_threshold
persistence_observations
cooldown_duration
severity
missing_data_behavior
enabled
```

### Alert event

```text
id
rule_id
state
started_at
confirmed_at
cleared_at
input_snapshot_ids
calculation_version
explanation
```

### Review decision

```text
id
alert_id
covenant_version_id
disposition
selected_hypothetical_action
supporting_evidence
contrary_evidence
thesis_status
override_reason
next_review_at
created_at
```

### Audit event

Append-only:

```text
id
event_type
entity_type
entity_id
entity_version
actor
occurred_at
payload_hash
payload
```

## 4. Versioning rules

- An approved covenant is immutable.
- A change creates a new draft version.
- The new version may reference the version it supersedes.
- An alert always retains the exact covenant version and calculation version used.
- Trigger definitions are versioned with the covenant.
- Calculation formula changes require a new calculation version.
- Historical results are not silently recomputed under a new formula.

## 5. Calculation rules

### Portfolio weight

```text
position_weight = position_market_value / total_portfolio_value
```

### User-defined AI exposure

```text
portfolio_ai_exposure =
sum(position_market_value * ai_exposure_fraction)
/
total_portfolio_value
```

The app must display that AI exposure is user-defined or source-derived, not an objective universal classification.

### Concentration drift

Store both:

- Absolute percentage-point change
- Relative percentage change

Do not conflate price appreciation with new purchases. Where transaction history is unavailable, label the cause as unknown rather than inferred.

### Drawdown

A drawdown calculation must record:

- Price or portfolio series
- Reference high rule
- Lookback window
- Benchmark, if any
- Treatment of cash flows
- Data source
- Calculation version

### Volatility

A volatility calculation must record:

- Return interval
- Lookback
- Annualization rule
- Missing observation treatment
- Price adjustment convention

Do not hide formulas behind a generic “risk score.”

## 6. Trigger-engine rules

### Determinism

Given the same:

- Covenant version
- Trigger version
- Portfolio data
- Market data
- Calculation version

the engine must produce the same state transition.

### Persistence

A rule should normally require a condition to remain true for a defined number of observations or elapsed time.

### Hysteresis

Entry and exit thresholds must be separately configurable.

### Cooldown

After a completed review, suppress duplicate alerts for the configured interval unless an explicit emergency threshold is reached.

### Missing data

Every rule specifies one behavior:

- Hold prior state
- Mark unavailable
- Require manual review
- Clear only after valid data returns

Never silently treat missing data as normal.

### Explanation

Every alert explanation includes:

- Metric
- Observed value
- Entry or exit threshold
- Persistence achieved
- Covenant version
- Data timestamp
- Calculation version

## 7. Simulation rules

- Simulations are immutable records.
- A simulation never alters the active portfolio snapshot.
- All user-entered assumptions are displayed.
- Results distinguish current values from hypothetical values.
- Scenario losses are user-defined arithmetic unless a separately validated model is later added.
- No option is ranked as recommended.
- No expected-return estimate is required.
- Round-off rules are documented.

## 8. Audit and observability

Use domain events, not only application logs, for material actions.

Audit:

- Covenant created
- Covenant approved
- Covenant superseded
- Snapshot imported
- Trigger entered
- Trigger confirmed
- Trigger cleared
- Review opened
- Decision recorded
- Override recorded
- Simulation created
- Export generated

Operational logs may contain technical details but may not be the only record of user-facing decisions.

## 9. Security and privacy

### Initial posture

- Minimize collected data.
- Avoid brokerage credentials in the MVP.
- Avoid personally identifying fields not needed for the workflow.
- Encrypt sensitive local data where practical.
- Protect backups.
- Make exports explicit.
- Do not send portfolio data to an LLM by default.

### Multi-user posture

Before multi-user release:

- Authentication
- Authorization
- Tenant isolation
- Encrypted transport
- Secret management
- Audit access controls
- Retention and deletion policy
- Incident response plan

## 10. Regulatory and language boundaries

The interface must avoid:

- “You should sell”
- “Recommended trade”
- “Guaranteed protection”
- “Crash imminent”
- “Optimal portfolio”
- “Fiduciary action” unless the business is structured and reviewed accordingly

Prefer:

- “Your predefined review condition has been reached.”
- “This simulation shows the arithmetic effect of the change you entered.”
- “The application does not execute trades.”
- “Consider the policy and evidence you previously recorded.”

Obtain appropriate legal review before adding personalized securities advice, compensation related to advice, discretionary control, or execution.

## 11. LLM use

LLMs are not required for the MVP.

Permitted later uses:

- Rewrite user notes for clarity with user approval
- Summarize the user’s own covenant
- Organize evidence cards
- Detect missing policy fields
- Explain deterministic calculations

Prohibited without separate validation and explicit consent:

- Generating a trade
- Choosing an action
- Assigning a crash probability
- Altering a locked covenant
- Sending portfolio data to an external model silently
- Fabricating evidence or citations

Every LLM-generated text must be distinguishable from user-authored and system-calculated content.

## 12. Testing requirements

### Unit tests

- Exposure calculation
- Concentration calculation
- Drawdown
- Volatility
- Entry threshold
- Exit threshold
- Persistence
- Cooldown
- Missing data
- Versioning
- Audit hashes

### Property tests

- Portfolio weights sum appropriately
- Simulations do not mutate source snapshots
- Approved covenants cannot be changed
- Replaying events reconstructs the same state
- Alerts cannot reference future snapshots

### Integration tests

- CSV import to snapshot
- Snapshot to trigger
- Trigger to review
- Review to audit export
- Covenant supersession
- Backup and restore

### Browser tests

- Create and lock covenant
- Import portfolio
- Trigger review
- Compare simulations
- Record override
- Export complete history

## 13. Accessibility and UX

- Use plain language.
- Distinguish policy state from market state.
- Put the trigger explanation above secondary charts.
- Show timestamps and data freshness.
- Avoid alarming visual design for ordinary Review states.
- Require explicit confirmation before locking or superseding a covenant.
- Make contrary evidence a required visible section.
- Support keyboard navigation and readable contrast.

## 14. Data import contract

The initial CSV should require only:

```csv
as_of,portfolio_name,asset_id,symbol_or_name,quantity,price,market_value,ai_exposure_fraction,account_group
```

Rules:

- `market_value` may be calculated from quantity and price or supplied, but conflicts must be surfaced.
- `ai_exposure_fraction` must be between 0 and 1.
- Unknown AI exposure remains null; it is not silently treated as zero.
- Duplicate positions require explicit merge or separate-account handling.
- The import creates a new immutable snapshot.

## 15. Release checklist

- [ ] The MVP works without external predictive data.
- [ ] No route can execute a trade.
- [ ] Approved covenants are immutable.
- [ ] Every alert is reproducible.
- [ ] Persistence, hysteresis, and cooldown are tested.
- [ ] Missing data cannot create a false “Normal” state.
- [ ] Supporting and contrary evidence are visible.
- [ ] Simulations are clearly hypothetical.
- [ ] Exports include versions and timestamps.
- [ ] Security and backup behavior are documented.
- [ ] Product language has been reviewed for advice and prediction claims.


---

<!-- Source: infrastructure-commitment-ledger/GOAL.md -->

# GOAL.md — AI Infrastructure Commitment Ledger

**Version:** 1.0  
**Date:** 2026-08-23  
**Pilot:** Georgia Power / Georgia Public Service Commission  
**Status:** Approved falsifiable research target

## Mission

Determine whether public operational records can be converted into a point-in-time, company-attributable ledger of AI-related infrastructure commitments that reveals meaningful project deterioration before conventional company disclosure.

The initial goal is not to predict an AI-market crash. It is to answer whether a commercially useful information lead exists and whether that lead can be captured without retrospective leakage.

## Core hypothesis

Large AI infrastructure decisions may leave public operational traces before appearing in quarterly financial reporting. Potential traces include:

- Requested power
- Project-stage advancement
- Project-stage deterioration
- Downsizing
- Deferral
- Withdrawal
- Construction commitment
- Site or service changes

A useful product requires more than regional aggregate data. It must link a material share of projects and adverse MW to named sponsors using evidence that was publicly available at the time.

## Pilot jurisdiction

The initial audit targets the Georgia Power / Georgia Public Service Commission large-load reporting ecosystem, beginning with the period for which comparable point-in-time records can be reliably reconstructed, provisionally 2023–2026.

The first work is manual. Automation is prohibited until the documents, identities, stages, and amendments have been understood by hand.

## Two research questions

### Question A — information lead

Did a public docket, report, permit, or related operational record reveal a sponsor-attributable project change before the company or broadly available reporting disclosed the same change?

This tests whether the source provides earlier public knowledge.

### Question B — economic significance

After considering relocation, duplication, substitution, and project-specific explanations, did material deterioration precede a later reduction in the sponsor’s publicly stated:

- Data-center capacity plan
- AI infrastructure plan
- Capital-expenditure guidance
- Related infrastructure expectations

This tests whether the event was broad enough to matter financially.

Question A can succeed even if Question B is initially underpowered. Neither result alone establishes crash predictability.

## Company-linked product kill gate

The company-specific Watcher path for Georgia stops unless all three conditions are met:

1. At least **40% of projects** have defensible named-sponsor attribution.
2. Attributed projects represent at least **40% of total requested MW**.
3. At least **40% of deteriorating, downsized, deferred, or withdrawn MW** is attributable.

All measures must be calculated using evidence available contemporaneously. Also report confidence-adjusted coverage.

If the gate fails, preserve the research record and stop the company-linked thesis for this jurisdiction. Do not rescue it by adding speculative identities, complex models, or later information.

## Required point-in-time rule

A project event and its sponsor identity have separate availability dates.

```text
signal_available_at =
max(event_available_at, sponsor_attribution_available_at)
```

A sponsor discovered later cannot be backdated.

## Initial ledger

The manual ledger contains eleven fields:

```text
project_id
site
suspected_sponsor
sponsor_confidence
requested_mw
stage
prior_stage
effective_date
event_available_at
sponsor_attribution_available_at
source_reference
```

Do not add fields during the pilot unless a repeated document pattern proves that the existing representation cannot preserve a material fact. Any added field must solve a demonstrated problem, not anticipate a hypothetical future model.

## Sponsor-confidence rubric

Use a small transparent scale.

### 1.00 — Direct

The sponsor is named in the official source.

### 0.80 — Strong triangulation

The link is supported by multiple contemporaneous public sources that independently connect the same site, MW range, and project timing to the sponsor.

### 0.60 — Probable

The evidence is persuasive but lacks one confirming dimension or relies on a single high-quality external source.

### 0.40 — Weak

The connection is plausible but competing sponsors or sites remain possible.

### 0.00 — Unattributed for product purposes

The identity is unknown, retrospective only, or too speculative.

The thresholds may be refined after manual review, but historical scores may not be silently changed.

## Project-change representation

Preserve the source’s own stage language during the pilot.

For simple analysis, collapse changes into:

### Advancing MW

Project evidence moved toward stronger commitment or construction.

### Deteriorating MW

Project evidence moved toward delay, downsizing, withdrawal, cancellation, failure to progress, or weaker commitment.

### Entering MW

New requested capacity entered the observable pipeline.

### Exiting MW

Capacity left the observable pipeline.

Do not fit a multi-state hazard model in the pilot.

## Primary outcomes

Use outcomes in this order:

1. Later public disclosure concerning the same project
2. Later company guidance concerning data-center or AI infrastructure capacity
3. Later company capex-guidance revision
4. Utility load-forecast revision as a baseline or control

Utility forecasts may incorporate overlapping source information and are not treated as independent validation of economic foresight.

## Base-rate requirement

The pilot must report:

```text
P(later adverse disclosure)
```

and:

```text
P(later adverse disclosure | earlier project deterioration)
```

Also report:

- Percentage of time or quarters under a negative signal
- Negative signals followed by no broader adverse disclosure
- Apparent deterioration later explained by relocation or duplication
- Median time from signal to resolution
- Lead-time distribution

A permanently negative series is not a successful predictor.

## In-scope pilot work

- Manual reading of the jurisdiction’s large-load reports and related dockets
- Confirmation that original and amended records are retained
- Assessment of stable project continuity
- Manual entry of the eleven-field ledger
- Sponsor attribution using contemporaneous public evidence
- Coverage calculations
- Lead-time calculations
- Base-rate analysis
- Descriptive advancing and deteriorating MW series
- Auditable project case histories
- Go/no-go decision

## Out of scope for the pilot

- National collection
- Full automation
- Company trading signals
- Crash probabilities
- Monte Carlo
- LLM council
- LPPLS or GSADF
- Dynamic model weighting
- Multi-state hazard model
- GPU rental-price index
- Colocation sublease panel
- Insider-trading model
- Job-posting model
- Purchased alternative data
- Broker integration

## Data provenance principles

Every row must:

- Point to a retrievable source
- Distinguish effective date from public availability date
- Preserve the source language
- Record uncertainty
- Avoid later knowledge
- Permit an independent reviewer to reconstruct the entry

No row is accepted solely because an LLM inferred it.

## Success states

### Full pass

The 40%/40%/40% attribution gate passes, material events show reproducible lead time, and the manual process can be repeated.

### Data-asset pass

Attribution and continuity are strong enough to create a valuable company-linked ledger, but the initial sample is too small to test capex guidance meaningfully.

### Aggregate-only result

The source supports regional MW analysis but fails named-sponsor coverage. This may be useful to utility or infrastructure researchers but does not satisfy the company-linked Watcher goal.

### Stop

Records cannot be linked reliably, MW is mostly unavailable, identities are retrospective, or amendments cannot be reconstructed.

All four are valid outcomes.

## Commercial value test

The ledger is a potential product only if it provides one or more of:

- Named-company attribution
- Genuine publication lead
- Material project changes
- Repeatable updates
- Project continuity
- Auditable provenance
- Coverage sufficient for a defined customer

A manually completed table is a research deliverable. It is not automatically a commercial asset.

## Definition of done for the pilot

The pilot is complete when:

1. The source universe is documented.
2. The point-in-time document history is confirmed or its gaps recorded.
3. The manual ledger is complete for the defined sample.
4. Sponsor attribution is scored and auditable.
5. Project, MW, and adverse-MW coverage are calculated.
6. The 40%/40%/40% gate is applied exactly as written.
7. Lead time is calculated without backdated identity.
8. Base rates and alert burden are reported.
9. At least several project case histories are independently reviewed.
10. A written decision selects pass, data-asset pass, aggregate-only, or stop.


---

<!-- Source: infrastructure-commitment-ledger/ROADMAP.md -->

# ROADMAP.md — AI Infrastructure Commitment Ledger

**Version:** 1.0  
**Date:** 2026-08-23  
**Roadmap type:** Pilot first, automation only after gate

## Roadmap objective

Produce one small, auditable, point-in-time infrastructure commitment ledger before building a national collector or prediction engine.

The pilot is designed to disprove the thesis quickly if sponsor attribution, project continuity, MW disclosure, or lead time are inadequate.

## Stage 0 — Freeze protocol before reading outcomes

### Deliverables

- Approved `GOAL.md`
- Jurisdiction fixed
- Date range fixed to the longest comparable period actually available
- Eleven ledger fields fixed
- Sponsor-confidence rubric fixed
- 40%/40%/40% kill gate fixed
- Outcome order fixed
- Base-rate calculations fixed
- Source-use and point-in-time rules fixed

### Prohibited changes after data review begins

- Lowering the sponsor-coverage threshold
- Backdating a sponsor identity
- Adding a stage because it improves results
- Redefining deterioration after observing outcomes
- Dropping unattributed adverse projects
- Replacing capex guidance with a dependent outcome
- Expanding jurisdictions to rescue a failed pilot

### Exit gate

The protocol is timestamped before the first analytic summary is calculated.

---

## Pilot Week 1 — Read, map, and enter source facts

### Objective

Learn whether the records support a usable ledger.

### Tasks

1. Identify the official docket and reporting sources.
2. Retrieve reports and amendments in chronological order.
3. Confirm whether original versions remain available.
4. Determine whether project identifiers persist.
5. Record whether MW values are stated, ranged, or redacted.
6. Record stage language exactly as used.
7. Note project additions, advancements, deterioration, and exits.
8. Enter source references and availability dates.
9. Do not infer sponsors until the official-source pass is complete.
10. Keep a source-coverage log listing missing quarters, broken links, and redactions.

### Four mandatory questions

- Are original and amended filings retained?
- Is there a stable project identifier across amendments?
- Are MW values available?
- Can sponsors be identified directly or only through external triangulation?

### Deliverables

- Source map
- Document inventory
- Initial manual ledger
- Gap log
- Examples of straightforward and ambiguous project continuity

### Early stop

Stop the pilot if official records cannot support project continuity or meaningful MW reconstruction.

---

## Pilot Week 2 — Sponsor attribution and lead-time audit

### Objective

Determine whether the operational records can become company-linked intelligence.

### Attribution sources

Use only contemporaneously available public sources such as:

- Official dockets
- Permits
- Parcel or land-development records
- Planning-board material
- Company announcements
- Public construction records
- Contemporaneous local reporting

### Tasks

1. Attribute sponsors using the frozen confidence rubric.
2. Record `sponsor_attribution_available_at`.
3. Separate direct identification from triangulation.
4. Detect retrospective-only identities and assign them zero historical product credit.
5. Review adverse transitions first.
6. Calculate project, MW, and adverse-MW coverage.
7. Calculate confidence-adjusted MW coverage.
8. Build project-specific lead-time timelines.
9. Identify relocation, duplication, and substitution explanations.
10. Independently review the most material attributed adverse events.

### Deliverables

- Completed eleven-field ledger
- Attribution evidence packet
- Coverage report
- Lead-time report
- Initial project case histories
- Kill-gate result

---

## Gate 1 — Data feasibility

Pass only if:

- Comparable records exist for a useful period.
- Project continuity can be reconstructed.
- MW is available for a meaningful share.
- Sources are retrievable and auditable.

Failure ends the pilot for this source.

---

## Gate 2 — Sponsor attribution

Pass the company-linked path only if:

- At least 40% of projects are attributable.
- At least 40% of requested MW is attributable.
- At least 40% of adverse MW is attributable.

Report raw and confidence-adjusted measures.

Failure may produce an aggregate-only result, but it does not justify a company-linked Watcher.

---

## Gate 3 — Information lead

### Primary question

For sponsor-attributed events, did the signal become available before later project-specific company disclosure or broadly available reporting?

### Measures

- Median lead days
- Lead-day distribution
- Percentage with positive lead
- Percentage only attributable retrospectively
- False or revised attribution rate
- Materiality by MW
- Adverse events later explained by non-demand causes

### Pass condition

There is a reproducible subset of material events with positive point-in-time lead and acceptable attribution reliability.

No fixed statistical-significance threshold is required for the small pilot.

---

## Gate 4 — Economic significance

### Outcome hierarchy

1. Same-project company disclosure
2. Company infrastructure or capacity guidance
3. Company capex guidance
4. Utility forecast revision as baseline

### Initial analysis

- Descriptive event timelines
- Net MW advancing
- Net MW deteriorating
- Net MW entering
- Net MW exiting
- Later disclosure base rates
- Conditional later-disclosure rates
- Alert duty cycle

### No-go behavior

Do not fit a high-dimensional model or claim general predictive power from a few projects.

### Pass condition

The panel contains enough material, attributable, leading events to justify prospective collection and later testing.

---

## Decision point — classify the result

Select exactly one:

### Full pass

The source supports a repeatable company-linked panel with meaningful lead.

### Data-asset pass

The panel is commercially or analytically useful, but predictive testing is underpowered.

### Aggregate-only

The source supports regional infrastructure analysis but not company linkage.

### Stop

The source does not support a reliable product.

Record the reasons and preserve the audit.

---

## Stage 1 after a pass — Prospective manual ledger

### Objective

Create clean forward history before automating interpretation.

### Work

- Update on a fixed cadence
- Preserve every source version
- Record additions and corrections
- Conduct periodic independent QA
- Publish coverage and uncertainty
- Maintain sealed prospective outcome tracking

### Promotion gate

The manual process remains stable and reproducible across multiple update cycles.

---

## Stage 2 after a pass — Minimal automation

### Automate only repetitive mechanics

- Source discovery
- Document download
- Hashing
- Version comparison
- Exact-text extraction
- Candidate row generation
- Link validation
- Duplicate alerts

### Keep human review for

- Project continuity
- Sponsor attribution
- Ambiguous MW
- Interpretation of adverse transitions
- Alternative explanations
- Materiality

### Automation acceptance

Automation must reproduce the manually reviewed sample at a predefined accuracy and may not lower provenance quality.

---

## Stage 3 — Second jurisdiction

Choose a second jurisdiction only after the first is reproducible.

Selection criteria:

- Better sponsor disclosure
- Different regulatory structure
- Sufficient large-load activity
- Public amendment history
- Useful MW detail
- Point-in-time source retention

Do not choose solely because its results appear more bearish.

---

## Stage 4 — Prospective Watcher research

### Inputs

Use a small fixed set:

- Advancing MW
- Deteriorating MW
- Attributed adverse MW
- Lead-time-confirmed project changes
- Company disclosure outcomes
- Utility baseline revisions

### Outputs

- Event cards
- Coverage
- Base rate
- Simple baseline
- Alert duty cycle
- Prospective outcomes

No user-facing crash probability is permitted at this stage.

---

## Stage 5 — Optional Decision Covenant integration

Integration occurs only after:

- Proven point-in-time lead
- Stable attribution
- Prospective value beyond a simple baseline
- Acceptable false-alert burden
- Legal and product review

The ledger supplies evidence. The Covenant controls the user’s review workflow.

---

## Deferred research

Only after a meaningful prospective history exists may the team consider:

- Hierarchical models
- Survival analysis
- Multi-state models
- Cross-jurisdiction pooling
- Scenario analysis
- Predictive ensembles

Equal-weight or simple baselines remain permanent challengers.

## Roadmap stop rules

Stop expansion if:

- Sponsor identities require later information.
- Adverse MW remains predominantly anonymous.
- Project continuity is unreliable.
- Official sources cannot be preserved.
- Results depend on redefining stages after outcomes.
- Alert duty cycle is persistently high.
- The signal fails to add information beyond utility or public-company baselines.
- Complexity is proposed before the current gate is passed.


---

<!-- Source: infrastructure-commitment-ledger/BUILD_GUIDELINES.md -->

# BUILD_GUIDELINES.md — AI Infrastructure Commitment Ledger

**Version:** 1.0  
**Date:** 2026-08-23  
**Purpose:** Manual-pilot and post-pilot implementation rules

## 1. Build order

The order is mandatory:

1. Freeze protocol.
2. Read official records by hand.
3. Enter the eleven-field ledger manually.
4. Audit sponsor attribution.
5. Apply kill criteria.
6. Calculate base rates and lead time.
7. Decide pass, data-asset pass, aggregate-only, or stop.
8. Automate only after a pass.

Do not build a scraper, ontology, model, or dashboard before the manual source audit establishes that the data exists.

## 2. Pilot data model

Use exactly these required fields:

```text
project_id
site
suspected_sponsor
sponsor_confidence
requested_mw
stage
prior_stage
effective_date
event_available_at
sponsor_attribution_available_at
source_reference
```

### Field rules

#### `project_id`

A stable internal identifier. It must not imply certainty that the source itself provides a stable identifier.

If continuity is inferred, document that in the review notes outside the core table.

#### `site`

Use the most precise contemporaneously public description. Do not add a later address to an earlier row without preserving when that address became public.

#### `suspected_sponsor`

Use the legal or commonly recognized company name only when attribution evidence exists. Otherwise use null.

#### `sponsor_confidence`

Allowed values for the pilot:

```text
1.00
0.80
0.60
0.40
0.00
```

Do not use false numerical precision.

#### `requested_mw`

Store the reported value. If only a range is available, do not silently replace it with a midpoint in the source table. Use a documented representation or a companion note in the manual workbook.

#### `stage`

Preserve the source’s wording.

#### `prior_stage`

Preserve the prior source wording. Null for first observation.

#### `effective_date`

Date the project change was stated to take effect, if available.

#### `event_available_at`

First date the project event was publicly accessible.

#### `sponsor_attribution_available_at`

First date the named-sponsor link became defensible from public evidence.

#### `source_reference`

Stable URL, docket identifier, document identifier, page, table, or section sufficient for independent retrieval.

## 3. Effective signal time

Never use the event date alone.

```text
signal_available_at =
max(event_available_at, sponsor_attribution_available_at)
```

If sponsor attribution was not available contemporaneously, the row may remain useful for aggregate analysis but contributes zero company-linked historical lead.

## 4. Source hierarchy

Use the strongest contemporaneous evidence available.

### Tier 1 — Official direct

- Utility filing naming the sponsor
- Regulator document naming the sponsor
- Permit naming the sponsor
- Company announcement naming the exact project

### Tier 2 — Official triangulation

Multiple official records connect the site, timing, MW, parcel, and sponsor.

### Tier 3 — High-quality contemporaneous public reporting

Credible local or trade reporting that identifies the project and cites direct sources.

### Tier 4 — Weak public inference

Single-source speculation, unsourced claims, retrospective identification, or approximate geographic similarity.

Tier 4 does not satisfy company-linked historical attribution.

## 5. Manual review workflow

### Pass A — official project facts

Review records chronologically and enter:

- Project identifier
- Site
- MW
- Current stage
- Prior stage
- Effective date
- Event availability
- Source reference

Do not look for market outcomes during this pass.

### Pass B — sponsor attribution

Using only sources available by each historical date:

- Search official permits and land records
- Search company announcements
- Search planning records
- Search contemporaneous reporting
- Assign sponsor and confidence
- Record attribution availability date

### Pass C — adverse-event review

For every deteriorating or exiting event:

- Confirm project continuity
- Check for duplicate requests
- Check for relocation
- Check for sponsor change
- Check for MW redesign
- Check for ordinary expiration
- Record unresolved ambiguity in the case note

### Pass D — independent QA

A second reviewer or separate review session should recheck:

- Highest-MW projects
- All directly attributed adverse events
- All 0.80 confidence attributions
- All rows used in lead-time claims
- All corrected or superseded rows

## 6. Stage handling

Do not create a universal twelve-state taxonomy during the pilot.

Preserve source language and add only one derived classification for analysis:

```text
advancing
deteriorating
entering
exiting
unchanged_or_unclear
```

### Advancing

Evidence of stronger commitment, construction, contracting, or energization.

### Deteriorating

Delay, downsizing, weaker commitment, failure to progress, withdrawal, or cancellation.

### Entering

New capacity appears in the observable pipeline.

### Exiting

Capacity leaves the observable pipeline.

A transition may be marked unclear when its economic direction cannot be determined.

## 7. No double counting

The same project can appear in multiple reports. Do not count every repeated mention as a new event.

A new event requires a changed:

- Stage
- MW
- Timing
- Sponsor
- Status
- Material commitment fact

Project amendments should link to the same `project_id` unless evidence supports a distinct project.

## 8. Sponsor-coverage calculations

### Raw project coverage

```text
attributed_project_count / total_project_count
```

Define which confidence levels count before calculation. The recommended company-linked threshold is at least 0.60.

### Raw MW coverage

```text
sum(attributed_requested_mw) / sum(total_requested_mw)
```

### Adverse-MW coverage

```text
sum(attributed_adverse_mw) / sum(total_adverse_mw)
```

### Confidence-adjusted MW coverage

```text
sum(requested_mw * sponsor_confidence) / sum(total_requested_mw)
```

Report all four. Do not present only the most favorable one.

## 9. Lead-time calculations

For each qualifying project event:

```text
lead_days =
later_independent_disclosure_date
-
signal_available_at
```

Report:

- Positive, zero, and negative lead
- Median
- Interquartile range
- Full distribution
- Materiality by MW
- Outcome type
- Whether the event was later revised
- Whether the sponsor attribution changed

Do not average together:

- Same-project disclosure
- Company infrastructure guidance
- Capex guidance
- Utility forecast revision

They answer different questions.

## 10. Base-rate analysis

Before evaluating a deterioration signal, report:

- Number of attributable projects
- Number with later adverse disclosure
- Unconditional adverse-disclosure rate
- Number with earlier deterioration
- Conditional adverse-disclosure rate
- Percentage of observation periods marked negative
- False-alert count
- Median alert duration
- Events later explained by relocation or duplication

No bare conditional rate is permitted.

## 11. Statistical restraint

The pilot is descriptive.

Permitted:

- Counts
- Proportions
- Confidence intervals with clear assumptions
- Lead-time distributions
- Net MW time series
- Case histories
- Simple cross-tabulation
- Sensitivity to attribution threshold

Not permitted in the pilot:

- High-dimensional regression
- Dynamic weights
- Multi-state hazard model
- Machine-learning classifier
- P-hacking across many thresholds
- Retrospective LLM sentiment
- Claim of crash prediction

If a later model is proposed, it requires pre-registration and a prospective or appropriately blocked evaluation.

## 12. LLM use

LLMs may assist with:

- Locating candidate documents
- Extracting exact text spans for human review
- Suggesting possible project matches
- Comparing document versions
- Formatting case notes

LLMs may not autonomously:

- Assign sponsor identity
- Backdate knowledge
- Determine economic direction
- Decide that a withdrawal is bearish
- Create historical narrative scores
- Supply a source that a reviewer cannot retrieve

Every accepted row requires human verification against the source.

## 13. File and repository layout

A minimal implementation:

```text
data/
  raw/
    official/
    permits/
    announcements/
    reporting/
  interim/
  curated/
    ledger.csv
    project-case-notes/
protocol/
  preregistration.md
  source-map.csv
  kill-criteria.md
scripts/
  validate_ledger.py
  calculate_coverage.py
  calculate_lead_time.py
  summarize_base_rates.py
reports/
  pilot-result.md
  coverage-report.csv
  lead-time-report.csv
  decision.md
tests/
```

### Raw data rule

Raw files are immutable. Store:

- Retrieval timestamp
- Original filename
- Source URL
- Content hash
- Document date
- Public availability date where known

Corrections create new files; they do not overwrite old versions.

## 14. Validation rules

The ledger validator should reject or flag:

- Missing source reference
- Sponsor confidence outside allowed values
- Sponsor present with confidence 0.00
- Sponsor confidence above 0.00 without attribution date
- Event availability after a claimed signal date
- Prior stage equal to stage on a claimed change event
- Negative MW
- Duplicate row key
- Later document used to support earlier attribution
- Missing project ID
- Missing stage
- Unparseable dates

## 15. Audit notes

Keep a separate case note for material or ambiguous projects. It should include:

- Source excerpts
- Attribution rationale
- Alternative sponsors considered
- Duplicate or relocation checks
- Reason for stage classification
- Later resolution
- Reviewer
- Review date

Do not expand the core ledger just to hold narrative explanation.

## 16. Automation gate

Automation begins only after:

- The manual ledger passes data feasibility.
- The company-linked path passes the attribution gate.
- Reviewers agree on project continuity and stage classification at an acceptable rate.
- Source retrieval can be repeated.
- The expected benefit exceeds the maintenance cost.

Automate retrieval and exact comparison before automating interpretation.

## 17. Legal and data governance

For the pilot:

- Prefer official public records.
- Record source terms and access constraints.
- Do not bypass authentication or technical controls.
- Do not ingest purchased alternative data.
- Do not collect unnecessary personal information.
- Preserve provenance.
- Review licensing before commercial redistribution.
- Obtain legal review before selling transformed data where source terms are uncertain.

If purchased data is later considered, require documented provenance, consent chain, collection method, permitted uses, MNPI review, and recurring diligence before ingestion.

## 18. Pilot release checklist

- [ ] Protocol was frozen before outcome analysis.
- [ ] Source inventory is complete for the defined period or gaps are explicit.
- [ ] Raw files are preserved with hashes and retrieval times.
- [ ] Ledger uses the eleven required fields.
- [ ] Sponsor attribution dates are separate from event dates.
- [ ] No retrospective identity is backdated.
- [ ] Project continuity has been reviewed.
- [ ] Adverse events were checked for relocation and duplication.
- [ ] Project, MW, and adverse-MW coverage are reported.
- [ ] Confidence-adjusted coverage is reported.
- [ ] The 40%/40%/40% gate is applied without revision.
- [ ] Base rates precede conditional results.
- [ ] Lead-time outcomes are separated by type.
- [ ] No prediction claim exceeds the evidence.
- [ ] Final disposition is Full pass, Data-asset pass, Aggregate-only, or Stop.
