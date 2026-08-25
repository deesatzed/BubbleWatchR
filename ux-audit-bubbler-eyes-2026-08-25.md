# UX audit — BubblerEyes / Decision Covenant

Date: 2026-08-25
Scope: the local Decision Covenant web application at `/`, including covenant drafts, immutable portfolio snapshots, seven-trigger evaluation, structured reviews, exports, and the empty state.
Audience assumption: a single owner recording policy and reviewing deterministic evidence later; this is a financially sensitive workflow, so clarity and recovery outrank visual novelty.

## Scope and evidence base

Evidence used:

- `npm run lint`, `npm run typecheck`, `npm test`, `npm run test:e2e`, and `npm run build` on the current checkout. The Chromium workflow covered create, approve, supersede, snapshot import/calculation/export, all seven triggers, and a structured review lifecycle.
- Source inspection of `apps/web/server.ts`, especially the rendered HTML/CSS and browser event handlers at lines 180–310.
- Computed checks from the authored palette: the primary button and link colors have sufficient text contrast against their stated surfaces. No image, third-party script, or external network dependency is present in the page source.

Coverage limitation: the in-app/extension browser surface was unavailable in this environment, so I could not capture rendered screenshots or directly measure 1440px, 768px, and 390px viewports. Rendered findings below are therefore explicitly labeled as code/inference; Chromium workflow behavior is sampled from the repository's existing browser tests, not presented as a visual pass.

## Executive summary

The core product contract is clear: write a policy while calm, preserve immutable evidence, and review predefined conditions without executing trades. The current page supports the tested happy paths, including the newly added structured review flow. The main usability risk is that most successful actions call `location.reload()`, which removes the just-written status message and returns a user to the top of a very long page. The page also has no authored focus-visible treatment, loading lock, or recovery focus for several forms, so keyboard users and users working with slow or malformed input receive weak feedback. All major workflows share one long document with no wayfinding, and the current CSS has no breakpoint or reduced-motion system. The first remediation batch should improve state continuity, form recovery, wayfinding, responsive spacing, and calm motion without changing the local-only domain boundary.

## Quick wins

1. Add a compact skip link and section navigation so users can reach Covenant, Snapshots, Calculations, and Version history directly.
2. Add a reusable status treatment and focus it after asynchronous success or failure; preserve the user’s current section instead of reloading the document.
3. Disable each submitting control while its request is in flight and restore it on failure.
4. Add `:focus-visible`, mobile spacing, readable max measure, and semantic design tokens.
5. Add one restrained reveal/status transition with an explicit `prefers-reduced-motion` override.

## Findings by dimension

### Onboarding and flows

- **UX-FLOW-01 — High — Observed (code + sampled)** — The page starts with a 14-field covenant form and then continues into snapshots, calculations, and version history without an in-page wayfinding layer (`apps/web/server.ts:195-232`). The tested flows work, but a returning user who wants to review a saved covenant or import a snapshot must scan through unrelated sections. Recommendation: add a skip link and compact anchor navigation; keep the existing single-page model. Effort: S.

- **UX-FLOW-02 — High — Observed (code)** — Successful draft, snapshot, trigger-definition, review-open, and review-complete submissions reload the entire page (`apps/web/server.ts:247-309`). The user loses the success status, scroll position, and visual relationship to the control they just used. Recommendation: update the relevant region in place or reload while restoring a section anchor and an explicit success status. Effort: M.

### Navigation and information architecture

- **UX-IA-01 — Medium — Observed (code)** — The four primary areas are siblings in one long `<main>` with no navigation landmarks beyond headings (`apps/web/server.ts:194-233`). Recommendation: add a small `<nav aria-label="Page sections">` with four anchors and matching section IDs. Effort: S.

### Forms and input

- **UX-FORM-01 — High — Observed (code)** — JSON and CSV fields are required for core snapshot work, but the error path only writes a string to a global status paragraph; it does not associate the error with the invalid field or move focus there (`apps/web/server.ts:295-309`). A user who pastes malformed data has to infer which editor failed. Recommendation: add field-level `aria-invalid`, `aria-describedby`, a concise recovery message, and focus the failing field. Effort: M.

- **UX-FORM-02 — Medium — Observed (code)** — Covenant, snapshot, CSV, trigger, and structured-review forms do not consistently disable their submit control while the request is pending (`apps/web/server.ts:247-309`). A slow click or touch can create duplicate requests or leave the user unsure whether work started. Recommendation: centralize submit-state handling and restore controls on failure. Effort: S.

### Feedback and states

- **UX-STATE-01 — High — Observed (code)** — Status elements exist, but successful mutations commonly reload before the user can read them; several button actions report errors in a status belonging to another section (`apps/web/server.ts:247-309`). Recommendation: use section-local status regions with `role="status"`, `aria-live`, a visible success/error tone, and focus management. Effort: M.

- **UX-STATE-02 — Medium — Inferred (code)** — There is no explicit empty-state action or explanation for saved calculations beyond “No portfolio snapshots yet” (`apps/web/server.ts:230`). Recommendation: make the empty state point to the manual and CSV entry forms with anchor links. Effort: S.

### Accessibility and responsive behavior

- **UX-A11Y-01 — Medium — Observed (code)** — The stylesheet has no authored `:focus-visible` rule, despite a keyboard-accessible app with many controls (`apps/web/server.ts:183-190`). Browser defaults may still provide a ring, but the product does not guarantee a consistent high-contrast focus treatment across its own controls. Recommendation: add a two-layer focus ring using the existing blue palette and preserve native semantics. Effort: S.

- **UX-A11Y-02 — Medium — Observed (code; rendered result not directly measured)** — There are no responsive breakpoints or mobile-specific spacing rules (`apps/web/server.ts:184-190`). The controls remain usable in a single column, but the page has no deliberate 390px/768px composition or touch-target rhythm. Recommendation: add narrow-screen padding, heading scale, stacked action groups, and a readable content measure. Effort: S.

### Visual hierarchy and design system

- **UX-VIS-01 — Medium — Observed (code)** — Forms and saved records use the same white bordered-card treatment (`apps/web/server.ts:187`), while semantic states have no reusable tokens. This makes editing, evidence, and history feel equally weighted. Recommendation: introduce small semantic tokens and differentiate primary work surfaces from read-only evidence with restrained headings and backgrounds. Effort: M.

### Motion and transitions

- **UX-MOTION-01 — Low — Observed (code)** — The current page has no authored transitions or `prefers-reduced-motion` handling (`apps/web/server.ts:183-190`). That is not a blocker, but it leaves state changes abrupt and provides no product-level motion contract. Recommendation: add only a short status/reveal treatment, guarded by reduced motion; do not animate financial values or audit data. Effort: S.

### Content, data display, trust, and performance

No additional high-confidence defects were found in the available evidence. The local-only notice, non-advice boundary, explicit unknown classification language, labeled observed drawdown, raw audit details, and export links were left alone because they reinforce the product’s safety and provenance contract. The existing raw JSON details are appropriate as an inspection affordance; they should not be replaced with decorative summaries without a product decision.

## Prioritized backlog

1. Preserve mutation feedback and context; add request locking and failure focus.
2. Add section wayfinding and a useful calculations empty state.
3. Add focus-visible, responsive, semantic tokens, and action-group layout.
4. Add restrained status/reveal motion with reduced-motion support.
5. Re-run functional tests and repeat the browser audit when a browser surface is available for direct visual measurement.

## What works and what was left alone

The repository’s browser workflows pass for the covenant, snapshot, trigger, and structured-review paths. Labels are explicit, the page declares its language and viewport, status regions use live semantics, and the product’s local-only/non-advice language is visible. I left domain wording, immutable-record behavior, exports, raw audit evidence, and the single-page server-rendered stack unchanged. No browser screenshots were available, so visual claims are intentionally limited to authored source and computed palette checks.

## Open questions

- Which section should be the default return point after a successful mutation when the app is used on a very tall history page?
- Should the numeric concentration/drawdown inputs remain fractions for the intended audience, or display percentages while submitting normalized values?
- Direct in-app browser screenshots would still add visual evidence, but the executable browser matrix now verifies wrapping/layout behavior, focus, touch-target size, and horizontal overflow at 1440px, 768px, and 390px.

## Post-implementation verification

The bounded browser verification added after the first pass exercised the built
page at 1440px, 768px, and 390px. It verified no horizontal overflow, visible
section navigation, the main landmark, 44px-or-larger button targets, desktop
snapshot-form columns, mobile stacking, skip-link focus, malformed JSON recovery
focus, and the success hash/status context after a saved snapshot. The direct
in-app/extension browser connector remains unavailable for screenshots and
manual visual inspection, but the required viewport behavior, keyboard start,
back navigation, and refresh persistence now have executable browser evidence in
`scripts/verify-responsive.mjs`.

## Guided workspace redesign outcome — 2026-08-25

The subsequent product pass resolves the audit's larger first-use limitation,
not just its original form mechanics. The page now opens with a plain-language
purpose statement, four scenario packs, twelve complete fictional lifecycle
examples, an integrated lifecycle inspector, and a visible copy-to-draft
action. The personal builder is progressively revealed, grouped by intent,
guardrails, decision boundaries, and preview. Returning use adds a deterministic
record summary before the examples.

The observation workflow now defaults to editable human-readable position rows,
and the condition workflow defaults to guided controls for every one of the
seven deterministic trigger types. Exact JSON remains available under Advanced
disclosures. The optional Generate variants surface states the honest
provider-ready boundary and does not simulate a model response.

Direct Playwright screenshots are now preserved in `.impeccable/review/` for
first-use desktop, tablet, and mobile states plus returning desktop and mobile
states. The visual inspection confirms the intended warm-stone, deep-ink, and
cobalt review-bench hierarchy; the earlier statement that no rendered
screenshots were available applies only to the pre-redesign audit snapshot.
The final one-time Impeccable anti-pattern detector returned no findings.
