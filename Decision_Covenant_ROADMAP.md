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
