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
