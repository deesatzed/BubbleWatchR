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
