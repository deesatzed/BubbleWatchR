# Prediction Discipline Showpiece and Landing Page Design

**Date:** 2026-08-26  
**Status:** Approved  
**Product:** Decision Covenant  
**Repository:** BubblerEyes  
**Audience:** Prediction analytics practitioners, evaluators, and technically sophisticated prospective users

## Outcome

Create a memorable public-facing landing page around one explicitly fictional showpiece, then preserve the full working product at a dedicated `/workspace` route.

The showpiece demonstrates a specific product thesis:

> The prediction is not the decision. Build the protocol before the forecast gets loud.

The landing page must make Decision Covenant legible to the prediction analytics community without claiming that the product generates forecasts, estimates market probabilities, recommends trades, or improves investment performance. Its distinctive value is the decision protocol around uncertain evidence: precommitment, explicit missing data, deterministic review conditions, falsifier checks, bounded human disposition, immutable history, and cooldown.

## Chosen Approach

Use an **Evidence Theater** rather than a static case study or an analytics command center.

The page centers one interactive fictional case, **The Aurora Compute Cycle**, in which an AI-infrastructure forecast desk writes its review protocol before conditions change, observes multiple portfolio conditions, sees two independent conditions converge while one measure remains unavailable, challenges its own interpretation, and records a dated deferral rather than reflexively acting.

This approach was selected because it:

- uses the strongest working product semantics;
- gives prediction practitioners a sophisticated uncertainty story;
- creates visual drama without fake model output or decorative analytics;
- provides an immediate bridge into the actual workspace;
- preserves the product's local-first and non-prescriptive boundary.

Rejected alternatives:

- **Editorial case study:** lower implementation risk but less interactive and memorable.
- **Analytics command center:** visually familiar but likely to imply unsupported predictions, model performance, or live data.

## Route and Product Architecture

```text
GET /                  -> persuasive landing page and Aurora showpiece
GET /workspace         -> existing Decision Covenant workspace
GET /assets/...        -> existing self-hosted assets
/api/*                 -> existing API behavior, unchanged
SQLite                 -> existing personal records, unchanged
```

The route split is intentional. New visitors first understand the product through a complete case. Returning users can enter `/workspace` directly. All existing API paths and persistence behavior remain unchanged.

The current four use-case packs and twelve fictional workspace examples remain unchanged. Aurora is a separate showpiece manifest, not a fifth pack and not personal seed data.

## Showpiece Narrative

Aurora is an explicitly fictional five-stage sequence.

### 1. Precommit

The fictional desk records:

- a thesis about exposure to an AI-infrastructure cycle;
- review rules written before market conditions change;
- candidate responses that remain options, not recommendations;
- falsifiers and contrary evidence to inspect;
- entry, exit, persistence, and cooldown rules.

The screen emphasizes that the protocol precedes the signal.

### 2. Observe

The next saved observation shows user-classified AI exposure and single-position concentration rising. Volatility is unavailable because the observation history is insufficient. The unavailable state must remain visually prominent and must not be rendered as zero, normal, or safe.

### 3. Converge

Two independent deterministic conditions activate. The combined state becomes an escalated review. The page explains that convergence invokes a review; it does not produce an action.

### 4. Challenge

The review presents evidence and contrary evidence side by side. The fictional desk records a falsifier check, including the unavailable volatility input, and distinguishes what was observed from what was inferred.

### 5. Record

The desk records `defer_review` with a rationale and dated follow-up. The completed packet is immutable, linked conditions enter cooldown, and the policy remains unchanged. The final line explains that restraint is still a recorded decision.

## Typed Data Contract

Add a dedicated showpiece module under `packages/examples/` rather than embedding narrative facts in the HTML.

The manifest must include:

- stable ID and title;
- explicit `fictional: true` provenance;
- audience and framing statement;
- five ordered stages;
- stage label, eyebrow, headline, narrative, and timestamp;
- displayed metrics with value, unit, status, and provenance;
- deterministic condition summaries and states;
- evidence and contrary-evidence lists;
- optional falsifier check;
- optional bounded review disposition and follow-up;
- a plain-language “what the product did” and “what it did not do” distinction.

The structure should be deeply immutable and validated by focused tests. It must not be inserted into SQLite or exposed as a generated/model response.

## Landing Page Information Architecture

### Hero

- Product mark and compact navigation.
- Oversized headline: “The prediction is not the decision.”
- Supporting copy: Decision Covenant creates the review protocol around uncertain evidence before the moment gets loud.
- Primary action: “Explore the evidence.”
- Secondary action: “Open the workspace.”
- Compact truth line: local-first, deterministic conditions, immutable review record, no model required.
- Deep-ink live-protocol panel showing the current fictional Aurora stage.

### Interactive Aurora case

- Five keyboard-accessible stage controls.
- A metric/evidence strip with explicit available/unavailable states.
- Condition convergence rail.
- Falsifier and contrary-evidence area.
- Recorded disposition with follow-up and cooldown.
- Persistent “Fictional scenario” label.

JavaScript enhances stage switching. The server-rendered baseline includes the complete five-stage story so failure or disabled JavaScript cannot hide evidence.

### Anatomy of a defensible decision

Explain four linked elements:

1. policy written before activation;
2. observations and missing data preserved honestly;
3. deterministic conditions invoke review;
4. the human disposition is recorded with rationale and provenance.

### Scope of use

Present the existing four supported use-case families:

- AI or thematic exposure;
- employer or single-stock concentration;
- drawdown or volatility;
- scheduled policy review.

Each card uses a meaningful one-sentence example and links to `/workspace#examples`.

### Trust architecture

Show the real current boundary:

- local SQLite by default;
- no broker or order endpoint;
- no runtime model call;
- deterministic versioned calculations;
- immutable accepted history and chained audit events;
- JSON and Markdown evidence exports.

Do not call the audit chain tamper-proof, the app production-ready, or the workflow compliant/certified.

### Final action

Invite the visitor to inspect and adapt a fictional lifecycle in the workspace. The CTA is “Open the workspace,” never “Get a prediction.”

## Visual Direction

Extend the approved decision-review-bench system into an editorial, cinematic Persuade surface.

- **Typography:** self-hosted Manrope; oversized display lines, compact operational labels, controlled measure.
- **Palette:** warm pale stone, deep ink, cobalt action, signal amber for review, restrained acid-lime only for verified/available evidence.
- **Geometry:** sharp registration rules, clipped corners, timeline rails, tight data labels, and broad editorial whitespace.
- **Avoid:** rounded-card grids, gradients, glass effects, generic SaaS blobs, stock finance imagery, candlestick theater, glowing AI motifs, fake probabilities, and gamified trading language.
- **Motion:** one trace-drawing entrance and precise stage transitions; all motion disabled or immediate under `prefers-reduced-motion`.
- **Responsive:** desktop uses a split hero and wide evidence bench; tablet compresses the grid while preserving hierarchy; mobile becomes a vertical sequence with the example action and product thesis in the first viewport.

## Accessibility and Interaction

- Semantic header, main, sections, navigation, buttons, headings, and status text.
- Stage controls use real buttons with selected state and keyboard support.
- Color never carries state alone.
- Available/unavailable/review/cooldown states have text labels.
- Minimum 44-pixel interactive targets.
- Visible focus using the existing focus treatment.
- Reduced-motion behavior.
- No horizontal document overflow at 1440, 768, or 390 pixels.
- The full narrative remains understandable without client-side script.

## Error and Trust Behavior

- Every Aurora surface carries fictional provenance.
- No unsupported probability, return, benchmark, or performance claim appears.
- No external model/provider/data service is called.
- Missing evidence remains unavailable.
- The showpiece never persists data.
- Personal SQLite records and all current API routes remain untouched.
- If stage enhancement fails, the server-rendered sequence remains readable.
- Direct `/workspace` navigation remains fully functional.

## Implementation Boundary

Expected files:

- `packages/examples/showpiece.ts` — typed manifest and immutable scenario;
- `packages/examples/index.ts` and/or `types.ts` — bounded exports/types;
- `apps/web/server.ts` — route split, landing renderer, styles, enhancement script;
- `tests/examples.test.ts` — showpiece structure/provenance/content safety;
- `tests/ui-content.test.ts` — landing/workspace content boundary;
- `tests/e2e.test.ts` — landing stage exploration and workspace entry;
- `scripts/verify-responsive.mjs` — both routes and viewports;
- project truth files — actual goal, implementation, decisions, progress, and queue.

No new runtime dependency, frontend framework, remote asset, telemetry, model adapter, database table, or API endpoint is expected.

## Proof of Done

1. The showpiece has exactly five ordered, schema-valid, deeply immutable fictional stages.
2. The page makes the product/non-product distinction explicit.
3. `/` renders the landing page and `/workspace` renders the full existing product.
4. Existing four packs and twelve examples remain unchanged.
5. Landing stage controls are keyboard accessible and update the correct evidence without persistence.
6. The complete story is readable when JavaScript is unavailable.
7. Landing-to-workspace navigation works in Chromium.
8. Existing covenant, snapshot, trigger, review, export, and workspace tests remain green.
9. `npm run verify:core` passes with updated counts.
10. `npm run verify:responsive` passes for both routes at 1440, 768, and 390 pixels.
11. Desktop and mobile screenshots receive one bounded visual inspection/repair pass and one confirmation pass at most.
12. The Impeccable detector returns no material findings.
13. `git diff --check` passes.
14. `GOAL.md`, `IMPLEMENT.md`, `DECISIONS.md`, `PROGRESS.md`, and `TASK_QUEUE.md` report the actual implementation and verification state.

## Non-Goals

- Generating forecasts or probabilities.
- Displaying fabricated model accuracy or calibration.
- Runtime local/OpenRouter integration.
- Rebalance simulation.
- Brokerage or market-data integration.
- Changing personal data schemas.
- Production deployment or analytics instrumentation.
