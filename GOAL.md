# GOAL.md — Prediction Discipline Showpiece and Landing

**Status:** Complete
**Working product name:** Decision Covenant
**Repository codename:** BubblerEyes
**Source date:** 2026-08-26
**Predecessor:** GOAL_STRUCTURED_REVIEW_COMPLETE.md
**Approved design:** docs/plans/2026-08-26-prediction-discipline-showpiece-design.md

## OUTCOME

A first-time visitor can open the root route and understand, within the first
viewport, that Decision Covenant creates an advance-written review protocol
around uncertain evidence. The visitor can then explore one complete,
explicitly fictional five-stage case and enter the working product at
/workspace.

The memorable thesis is:

> The prediction is not the decision. Build the protocol before the forecast
> gets loud.

The landing page persuades by demonstrating the product's real decision
mechanics. It does not generate a prediction, probability, recommendation, or
trade; claim performance; contact a broker; call a model; or persist the
fictional showpiece.

## ROUTE AND PRODUCT CONTRACT

- GET / renders the Aurora Evidence Theater landing page.
- GET /workspace renders the complete existing Decision Covenant workspace.
- GET /assets/... continues to serve existing self-hosted assets.
- /api/* behavior is unchanged.
- Existing personal SQLite records are unchanged.

All four existing use-case packs and twelve fictional workspace lifecycles
remain available at /workspace. The route split must not change API paths,
database schemas, exports, deterministic calculations, trigger transitions,
structured reviews, or personal persistence.

## AURORA SHOWPIECE CONTRACT

packages/examples/showpiece.ts owns one deeply immutable manifest,
AURORA_SHOWPIECE, titled **The Aurora Compute Cycle**. It is separate from the
four example packs and never becomes personal seed data.

The five ordered stages are:

1. **Precommit** — write scope, thresholds, persistence, contrary evidence,
   and falsifiers before a condition is active.
2. **Observe** — save comparable evidence and keep insufficient volatility
   explicitly Unavailable.
3. **Converge** — two deterministic conditions invoke escalated review; they
   do not generate an action.
4. **Challenge** — separate observed arithmetic from interpretation and retain
   contrary evidence.
5. **Record** — store a fictional defer_review disposition, rationale, dated
   follow-up, and 14-day cooldown.

Every showpiece surface must retain fictional provenance. Missing evidence
must never become zero, normal, cleared, or safe. The final record must remain
a bounded human-authored disposition.

## LANDING EXPERIENCE

The landing is a server-rendered, dependency-free Persuade surface in
apps/web/landing.ts.

- Desktop opens with a split thesis and deep-ink protocol trace.
- Tablet and mobile keep the thesis, fictional protocol summary, supporting
  promise, and both actions together in the first viewport.
- Five semantic tab controls move through the Aurora stages.
- Raw server HTML includes all five complete panels. JavaScript adds the
  single-panel interaction; it does not use hidden attributes to erase the
  no-script narrative.
- The page explains the four current use-case families, the anatomy of a
  defensible decision, and the product/non-product boundary.
- Typography is self-hosted Manrope. The visual system extends the decision
  review bench with pale stone, deep ink, cobalt action, amber review state,
  restrained acid-lime verification, and sharp registration rules.
- Controls remain keyboard operable, visibly focused, at least 44 pixels high,
  reduced-motion safe, and free of horizontal document overflow at 1440, 768,
  and 390 pixels.

## PROOF OF DONE

1. The Aurora manifest has exactly five ordered, schema-valid, deeply frozen,
   explicitly fictional stages.
2. The root route renders the landing and /workspace renders the complete
   existing product; /api/* remains unchanged.
3. The landing stage controls work by pointer and keyboard, expose unavailable
   evidence, and enter the workspace without persistence.
4. Raw landing HTML contains all five panels and no stage panel has a hidden
   attribute.
5. The four workspace packs and twelve examples remain unchanged.
6. npm ci, lint, typecheck, deterministic tests, 9 Chromium workflows,
   export/calculation/trigger/review evidence gates, and final build pass.
7. Responsive verification passes both routes at 1440, 768, and 390 pixels,
   including overflow, font, target, focus, stage, invalid-input, navigation,
   persistence, and returning-state checks.
8. Landing and workspace review rasters are captured and inspected; the
   landing visibly identifies fictional evidence and makes no result claim.
9. The one-time Impeccable detector reports no mechanical findings and the
   independent finish reviewer closes its material-fix verdict.
10. Generated evidence remains readable UTF-8/JSON and contains no raw NUL
    bytes.
11. git diff --check passes and the truth files report fresh command output
    rather than anticipated results.

## SCOPE

Modify only:

- packages/examples/ for the typed Aurora manifest;
- apps/web/ for the route split and landing renderer;
- tests/ and scripts/verify-responsive.mjs for bounded proof;
- DESIGN.md and project truth files for the shipped record;
- .impeccable/review/ for review-only screenshot evidence.

Preserve unchanged:

- existing API and SQLite contracts;
- the four example packs and twelve workspace examples;
- completed predecessor goal files;
- local-first, deterministic, non-prescriptive product boundaries;
- the five unrelated Docs_*_2026-08-26.md worktree files.

## NON-GOALS

- Runtime local-model or OpenRouter generation.
- Provider credentials, model selection, streaming, or generated variants.
- Market data, prediction probabilities, model calibration, or return claims.
- Rebalance simulation, brokerage, notifications, telemetry, or deployment.
- New runtime dependencies, database tables, or API endpoints.

## STOP RULE

Stop and report if a required browser or evidence gate remains unavailable
after mitigation, a reviewer requires a second wholesale rebuild, a change
would alter product or persistence scope, credentials are required, or any
result would need an unsupported prediction, advice, performance, or
production-readiness claim.

## COMPLETE

Change status to **Complete** only after every proof item passes from fresh
output, the finish reviewer closes the requested fixes, the built visual
system is recorded in DESIGN.md, and the final exact-path commits exclude the
unrelated documentation files.
