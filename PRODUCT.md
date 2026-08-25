# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Decision Covenant is for an individual who wants to decide, while calm, how
they will review a meaningful portfolio exposure later. The primary user may
be watching a thematic allocation, employer equity, single-stock
concentration, observed drawdown or volatility, or a scheduled policy review.
They need to understand the review lifecycle before entering personal data and
then return to a compact record of current policy state.

## Product Purpose

The product helps a person write a user-authored review policy, save immutable
portfolio observations, evaluate deterministic conditions, and record a
structured review when those conditions activate. Success means the person can
understand and rehearse the full process with fictional examples, adapt a
policy to their situation, and later see why a review is or is not due without
the product predicting markets or prescribing an action.

## Positioning

Decision Covenant makes the decision process before the moment gets loud. Its
distinct mechanism joins an advance-written covenant, immutable observations,
deterministic condition state, and an auditable user-authored review record.
It is a policy and evidence workspace, not a trading assistant.

## Operating Context

First use begins with complete fictional examples, not an empty form. The
initial example packs cover AI or thematic exposure, employer or single-stock
exposure, drawdown or volatility, and scheduled policy review. A person may
inspect a fictional sequence from policy through observation, activated
condition, review, and cooldown, then copy only the editable covenant into a
personal draft.

Returning use centers on the active covenant version, latest saved
observations, condition states, open reviews, scheduled reviews, and the
recorded audit trail. CSV remains a first-class portfolio input. Raw JSON and
low-level audit detail remain available through progressive disclosure.

## Capabilities and Constraints

- All current user data is stored locally in SQLite and is never transmitted
  by default.
- Approved covenant versions, accepted observations, completed reviews, and
  material audit events preserve their existing immutability guarantees.
- Calculations and condition transitions are deterministic, versioned, and
  explicit about missing or unavailable data.
- The product does not recommend trades, forecast market events, execute
  orders, connect to a broker, or silently classify unknown exposure as safe.
- Fictional demonstration data is isolated, resettable presentation data and
  is never silently persisted or mixed with personal records.
- Every preloaded or generated covenant value remains editable and explains
  why it appeared without claiming suitability for the user.
- Bundled examples are the current offline variant source. A provider-neutral
  generation contract may later support a local OpenAI-compatible endpoint or
  OpenRouter, but runtime model calls require a separately approved successor
  goal, credential-storage decision, and proof gates.
- Deliberately configuring OpenRouter is the consent event; a future
  implementation should not repeat a warning during normal use. Raw
  credentials must never enter SQLite, HTML, logs, exports, or delegated work.

## Brand Commitments

The working product name is Decision Covenant; BubblerEyes remains the
repository codename. Language is calm, plain, specific, and non-prescriptive.
The product must feel contemporary and consequential, never like a generic
administrative form or a gamified investing product.

## Evidence on Hand

- The existing local application implements covenant lifecycle, immutable
  snapshots, deterministic calculations, seven condition types, structured
  reviews, audit replay, and JSON/Markdown exports.
- The approved product and interaction design is recorded in
  `docs/plans/2026-08-25-ai-variant-workspace-design.md`.
- Twelve explicitly fictional example manifests are maintained in
  `packages/examples/` and validated by `tests/examples.test.ts`.
- There are no real customer testimonials, performance claims, market
  forecasts, suitability determinations, or live model-generated variants on
  hand; future surfaces must not fabricate them.

## Product Principles

1. Demonstrate the full lifecycle before asking for personal data.
2. Explain why a condition exists without deciding what the user should do.
3. Keep fictional, personal, deterministic, and model-generated provenance
   visibly distinct.
4. Put current state and the next recordable step ahead of storage mechanics.
5. Preserve local-first operation and explicit consent as capabilities expand.

## Accessibility & Inclusion

The complete workflow must remain keyboard operable with semantic landmarks,
labels, fieldsets, visible focus, useful error recovery, and status information
that does not rely on color. Touch targets are at least 44 pixels. The product
must remain usable at approximately 1440, 768, and 390 pixel widths and honor
reduced-motion preferences.
