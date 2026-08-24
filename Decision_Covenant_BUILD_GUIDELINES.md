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
