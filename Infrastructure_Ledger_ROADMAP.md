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
