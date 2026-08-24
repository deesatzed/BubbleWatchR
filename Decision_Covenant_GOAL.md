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
