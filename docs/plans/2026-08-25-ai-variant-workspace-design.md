# AI Variant Decision Workspace Design

**Status:** Approved
**Date:** 2026-08-25
**Product:** Decision Covenant
**Mode:** Guided entry that becomes an operational workstation

## Product intent

Decision Covenant helps a person write a portfolio-review policy while calm,
observe saved evidence over time, and record what happened when predefined
conditions deserve review. It does not predict markets, recommend trades, or
execute actions.

The current interface exposes the storage model as one long form. The redesign
must first demonstrate the product with complete fictional examples, then help a
person start from a meaningful variant instead of a blank page. Once personal
records exist, the interface should become a compact policy workstation.

The experience must feel calm, intelligent, and consequential. It should look
and behave like a current 2026 application, not a generic administrative form.

## Primary use case

A person has one or more portfolio exposures whose significance changes over
time. They want to decide in advance:

- what deserves review;
- which evidence must be inspected;
- what assumptions could invalidate the concern;
- which policy responses may be considered;
- how to de-escalate, re-enter, or wait;
- how the resulting decision will be recorded.

The user must be able to understand this lifecycle before entering personal
data. A fictional guided demo shows calm setup, new observations, an activated
condition, a structured review, and cooldown.

## Supported use-case packs

The first release includes four data-driven packs. Each contains three complete
examples with distinct philosophies.

### AI and thematic exposure

1. Evidence-first participation
2. Cross-account AI visibility
3. Theme-concentration discipline

### Employer and single-stock exposure

1. Vesting accumulation review
2. Single-issuer drift
3. Scheduled employer-equity review

### Drawdown and volatility

1. Drawdown with data-quality checks
2. Volatility-regime review
3. Multi-condition escalation

### Scheduled policy review

1. Quarterly policy check
2. Annual horizon review
3. Overdue-review recovery

Every example contains:

- a fictional person and situation;
- a complete covenant draft;
- two or more fictional observations;
- configured review conditions;
- at least one condition-state change;
- a completed structured review;
- assumptions, tradeoffs, and reasons it may not fit;
- a readable preview;
- an action to copy only its editable policy into a personal draft.

Fictional evidence is isolated from personal records and resettable. It is
never silently copied into the user's database.

## Entry experience

The first useful screen is **Choose a starting point**, with three paths:

1. **Explore examples** — open a complete interactive fictional story.
2. **Generate variants** — describe the situation and compare two or three
   normalized AI-drafted covenants.
3. **Start blank** — available but visually secondary.

The opening explains the product in one sentence:

> Make the decision process before the moment gets loud.

Supporting copy explains that the product defines when and how to review; it
does not predict or prescribe.

After a variant is selected, the builder opens with four chapters:

1. Intent — purpose, covered exposure, objective, and horizon.
2. Guardrails — observable review conditions and thresholds.
3. Decision boundaries — evidence, falsifiers, candidate policy responses,
   de-escalation, re-entry, and cooldown.
4. Preview — a coherent human-readable covenant before save and approval.

Every generated or preloaded value remains editable. Explanations say why a
value appeared; they do not claim it is suitable for the user.

## Returning-user workstation

When personal records exist, introductory material contracts into a disclosure.
The first viewport prioritizes current state:

- covenant status and version;
- latest observation date;
- active, unavailable, and normal conditions;
- open structured reviews;
- next scheduled review;
- the most relevant next action.

Primary navigation becomes:

- Examples
- My policy
- Observations
- Reviews
- Record

Important active states appear before data-entry tools. Export, raw JSON, and
audit details remain available through progressive disclosure.

## Example and variant comparison

Variant cards must expose meaningful differences rather than different prose.
Comparison dimensions are:

- governing philosophy;
- intended situation;
- conditions enabled;
- evidence requirements;
- persistence and cooldown posture;
- missing-data behavior;
- tradeoffs and reasons not to choose it.

The comparison view supports previewing a full covenant and selecting one as an
editable draft. It never labels one variant as recommended for the person.

## AI provider architecture

Variant generation uses a provider-neutral contract:

```text
Situation brief
      |
VariantGenerationService
      |-- bundled examples
      |-- local OpenAI-compatible adapter
      `-- OpenRouter adapter
      |
Normalized covenant variants
      |
Compare -> customize -> preview -> save draft
```

The normalized response contains two or three variants with stable IDs,
provider/model provenance, complete covenant input, trigger definitions,
explanations, assumptions, and tradeoffs.

### Provider behavior

- Bundled examples always work offline and require no model.
- Local generation is supported through an OpenAI-compatible endpoint so MLX,
  Ollama, LM Studio, or another local service can be adapted without changing
  the UI.
- OpenRouter uses the same generation request and normalized result.
- Adding OpenRouter is the consent event. Normal generation does not repeat a
  warning after the user deliberately configures it.
- The active provider and model remain visible for provenance.
- Switching providers never changes saved covenants or personal evidence.
- Raw API credentials must not be stored in SQLite, rendered into HTML, written
  to logs, included in exports, or passed to a delegated worker.
- Provider failure leaves bundled examples and blank drafting available.

The provider layer changes the current no-external-model product boundary and
therefore requires an explicit successor goal, credential-storage decision, and
new tests before OpenRouter calls are implemented.

## Input design

The normal interface must not expose JSON as its primary interaction.

- Portfolio positions use editable rows with clear field labels.
- CSV import remains a first-class alternative.
- Raw position JSON moves under Advanced tools.
- Trigger definitions use human-readable controls, percentage/date inputs, and
  explanations of unavailable data.
- Raw trigger JSON moves under Advanced tools.
- Fractional backend values may remain unchanged, while the interface presents
  percentages and performs explicit conversion.

## Visual system

The product uses a serious editorial-workspace visual world:

- a warm neutral canvas and deep ink working surfaces;
- precise cobalt for interaction;
- restrained green, amber, and red only for semantic states;
- self-hosted typography with a distinctive display voice and highly readable
  operational text;
- tabular numerals for values and dates;
- thin rules and spatial grouping instead of a page made of interchangeable
  rounded cards;
- an asymmetric but stable desktop grid with context rail, working canvas, and
  live summary where useful;
- a focused linear mobile experience rather than a compressed desktop layout.

The first viewport should reveal the product purpose, an example, and a clear
action. It must not open on a fourteen-field form.

## Motion

Motion explains state and location:

- generation progress and variant arrival;
- comparison selection;
- chapter progression;
- save and approval confirmation;
- condition and review-state changes.

Motion is short, interruptible, and limited to transform, opacity, blur, and
controlled size changes that do not shift surrounding content unexpectedly.
Every authored transition has a `prefers-reduced-motion` equivalent.

## Accessibility and responsive behavior

- Semantic landmarks, labels, fieldsets, headings, and status regions remain
  intact.
- All flows are keyboard complete with visible focus.
- Provider and condition status never rely on color alone.
- Desktop is verified near 1440px, tablet near 768px, and mobile near 390px.
- Touch targets are at least 44px.
- Comparison content becomes stacked on mobile without hiding tradeoffs.
- Demo and personal modes are visibly and programmatically distinguishable.

## Error and empty states

- No covenant: explain examples and generation, with blank drafting secondary.
- No provider: bundled examples remain usable; local/OpenRouter setup is
  offered without blocking.
- Provider unavailable: preserve the brief and offer retry, provider switch,
  or bundled examples.
- Invalid provider output: reject it before persistence and explain that no
  draft was saved.
- Missing observations: keep conditions unavailable rather than clearing them.
- Invalid CSV/row input: focus the exact field and preserve entered data.
- No active review: explain what would create one.

## Data and implementation boundaries

The first implementation slice should establish the new experience without
pretending runtime AI exists:

1. data-driven example manifests and complete previews;
2. first-use example library and guided demo shell;
3. copy-to-draft customization;
4. grouped covenant builder and modern visual system;
5. returning-user workstation summary;
6. provider-neutral interfaces and disabled/setup-ready provider UI;
7. human-readable snapshot and trigger controls where supported by the current
   routes.

Actual local-model and OpenRouter calls follow only after the provider contract,
credential handling, consent boundary, and proof gates are approved in a new
goal. The UI must not display a fake generation action that cannot work.

## Verification

Tests must prove:

- all twelve examples validate against current covenant/trigger schemas;
- fictional evidence is isolated and resettable;
- copying an example creates only an editable personal draft;
- generated-variant normalization rejects missing or unsafe fields;
- provider failure cannot block bundled examples or blank drafting;
- existing covenant, snapshot, trigger, review, and export workflows remain
  green;
- empty, invalid, loading, disabled, success, and error states are visible and
  keyboard accessible;
- 1440px, 768px, and 390px layouts have no horizontal overflow;
- reduced-motion mode removes nonessential animation;
- final screenshots and browser walkthroughs show both first-use and returning
  states.

## Deferred related capabilities

The following are adjacent but not represented honestly by the current engine:

- personalized trade or allocation recommendations;
- rebalance and tax simulation;
- live market or brokerage integrations;
- order execution;
- alerts and notifications;
- advisor/client collaboration;
- household permissions;
- non-financial covenant domains.

They require separate goals, data contracts, and safety review rather than new
template copy alone.
