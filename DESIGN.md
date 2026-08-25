# Decision Covenant Design System

**Status:** Shipping interface record, 2026-08-25
**Authority:** The server-rendered HTML and CSS in `apps/web/server.ts` are authoritative. This document records that implementation; plans, mocks, and review rasters provide intent and provenance but do not override it.

## Product design thesis

Decision Covenant is a local policy-and-evidence workspace for making the review process before the moment gets loud. It demonstrates a complete fictional lifecycle before asking for personal data, then becomes a compact record of policy, observations, deterministic condition state, and user-authored reviews. It does not predict markets, recommend a trade, or execute an action.

The ownable visual world is a **decision review bench**: a serious editorial workspace borrowing the clarity of labeled assay trays and versioned protocols without becoming a literal laboratory. Pale stone working canvas, deep-ink navigation and summaries, precise cobalt interaction, thin registration rules, clipped controls, tabular evidence, and restrained semantic color make the product feel consequential and inspectable. Spatial grouping and rules carry hierarchy; rounding and shadow are deliberately scarce.

## Shipping tokens

### Color

These are the exact custom properties in `:root`.

| Token | Value | Shipping role |
| --- | --- | --- |
| `--ink` | `#0a1b2e` | Primary text, rail, summary, preview |
| `--ink-2` | `#17324d` | Dark hover surface |
| `--muted` | `#5b6572` | Supporting copy and metadata |
| `--page` | `#f2f0eb` | Warm canvas |
| `--surface` | `#fbfaf7` | Forms and working sheets |
| `--surface-2` | `#ece9e2` | Secondary sheets and chips |
| `--line` | `#d2cec5` | Registration rules |
| `--line-strong` | `#aaa59b` | Strong boundaries |
| `--primary` | `#0a50d8` | Links, selection, primary actions |
| `--primary-dark` | `#083fa9` | Primary hover |
| `--primary-soft` | `#eaf0ff` | Selected and provenance surfaces |
| `--focus` | `#ffb000` | Keyboard focus ring |
| `--notice` | `#fff5d8` | Trust notice and review-state background |
| `--danger` | `#a62b2b` | Invalid and error state |
| `--success` | `#177044` | Local, review, cooldown, and success state |
| `--warning` | `#9a6000` | Defined semantic warning token; not otherwise referenced by the current stylesheet |

Role-bound literal colors also ship. Rail and dark-sheet text/rules use `#f7f9fb`, `#cad5df`, `#5f8eff`, `#122a43`, `#9fb0bf`, `#38506a`, `#bdc9d5`, `#93a8bb`, `#c4d0dc`, and `#96a9bb`. Notice treatment uses `#59420d` and `#e4cf94`. Provider status uses `#88b49d` and `#f0f8f3`. Example and lifecycle states use `#f5f7fb`, `#9eb8ff`, `#694300`, `#d59a21`, `#fff4d5`, `#704600`, `#d9a43f`, and `#f4f6fb`. Forms use `#f8f7f3` and `#8d9299`. The workbench shadow is `rgb(10 27 46 / 8%)`; invalid-field halo is `rgb(166 43 43 / 14%)`. The stylesheet also uses `white`, `transparent`, and `color-mix(in srgb, var(--surface) 92%, transparent)`.

### Type

- Family: self-hosted variable Manrope under the local family name `"Decision Sans"`, with `"Helvetica Neue"`, Arial, and sans-serif fallbacks. The font is served from `/assets/fonts/manrope-variable.ttf`; its OFL license is preserved in `assets/fonts/OFL.txt`. No remote font request ships.
- Root: `1rem` at `1.5` line-height.
- Headings: `1.12` line-height, `-.02em` tracking, balanced wrapping. `h1` is `2.75rem`/`680` with a `17ch` measure; at `max-width: 32rem` it is `2.1rem`. `h2` is `1.65rem`, `h3` is `1.4rem`, and `h4` is `1rem` with `-.01em` tracking.
- Brand: `1.25rem`/`700`/`1.05`; at `min-width: 70rem`, `1.55rem`.
- Supporting sizes in use: `1.1rem`, `1.08rem`, `.92rem`, `.9rem`, `.88rem`, `.84rem`, `.82rem`, `.8rem`, `.78rem`, `.76rem`, `.74rem`, and `.72rem`.
- Explicit weights in use: `400`, `650`, `680`, `700`, and `750`. Dates, values, summary data, and stage numbers use `font-variant-numeric: tabular-nums`.

### Spacing and geometry

There are no named spacing custom properties. Exact lengths used by `gap`, `margin`, and `padding` are `-1rem`, `-.15rem`, `0`, `.1rem`, `.15rem`, `.16rem`, `.18rem`, `.2rem`, `.25rem`, `.3rem`, `.35rem`, `.38rem`, `.4rem`, `.42rem`, `.45rem`, `.5rem`, `.55rem`, `.6rem`, `.65rem`, `.67rem`, `.7rem`, `.72rem`, `.75rem`, `.8rem`, `.85rem`, `.9rem`, `1rem`, `1.1rem`, `1.15rem`, `1.2rem`, `1.25rem`, `1.4rem`, `1.5rem`, `1.75rem`, `2rem`, `2.25rem`, `3rem`, and `3.5rem`. Reuse the existing declarations rather than inventing a parallel spacing scale.

- Content and workbench maximum width: `92rem`.
- Desktop rail: `12.75rem`; full viewport height and sticky at `top: 0`.
- Minimum interactive height: `2.75rem` (44px at the root size).
- Default radius: `--radius` = `.25rem`; fields use `.18rem`; pack and example selectors use `0`; stage indicators and the local-state dot use `50%`.
- Borders are generally `1px`; selection uses a `2px` bottom rule or `3px` inset rule.

### Focus and motion

- Keyboard focus is `outline: 3px solid var(--focus)` with `3px` offset on buttons, links, fields, selects, and summaries. The skip link moves from `translateY(-180%)` to `translateY(0)` on focus.
- Standard buttons transition background, border color, and transform for `180ms ease-out`; active press is `translateY(1px)`. Disabled/busy controls use `opacity: .58` and `cursor: wait`.
- Text-swap tokens are `--text-swap-dur` = `180ms`, `--text-swap-translate-y` = `4px`, `--text-swap-blur` = `2px`, and `--text-swap-ease` = `cubic-bezier(.2,.8,.2,1)`. Status text transitions only transform, blur, and opacity.
- Document scrolling is smooth. Under `prefers-reduced-motion: reduce`, scrolling becomes automatic and transitions/animations become `.01ms` with one animation iteration.

## Layout and product state

### First use

First use is selected when there are no covenants and no snapshots. The composition is app navigation, the “Decision review bench” local-state bar, a plain-language trust notice, then the example-led opening. The opening pairs the product thesis with **Explore examples**, the honest provider setup disclosure, and secondary **Start blank**. At compact mobile width, an explicitly fictional selected starting point and **Use this example** action appear inside the opening so purpose, example, and action share the first viewport. The workbench keeps pack and example context beside the selected fictional lifecycle. The covenant builder is present but hidden until a user chooses an example, opens **My policy**, or starts blank. Observation and record sections follow below.

### Returning use

Returning mode begins when at least one covenant or snapshot exists. A deep-ink workstation summary appears before the examples and reports policy status, latest observation, condition counts, open reviews, next scheduled review, and one deterministic next-step link. The large first-use thesis contracts to **Explore another starting point** before the library; returning mode preserves the learning surface without replaying onboarding. Operational forms remain lower in the document and the covenant builder remains disclosure-driven.

The summary reports saved state only. It must not turn unavailable into normal, infer advice, or perform its linked next action.

## Component contracts

### Navigation

An off-canvas-until-focused skip link precedes a semantic `aside` and `nav`. The rail contains the two-line wordmark, five anchors—Examples, My policy, Observations, Reviews, Record—and a local-first/no-forecast note on desktop. Examples is the current page in the shipping single-page shell. Hover/current state uses light text, a cobalt rule, and a dark inset surface; focus uses the global amber ring. Below `70rem`, navigation becomes a horizontally scrollable top bar rather than a compressed side rail.

### Example workbench

The workbench consists of an opening statement and entry actions, an optional provider panel, a library header, four pack buttons, three visible example rows, and an inspector stack. Pack and example buttons expose selection with `aria-pressed`, `.is-selected`, cobalt rules, and a soft-cobalt surface; hover and hidden/filter states are distinct. The initial state selects the first pack and example. Reset returns only browser presentation state. **Use as my starting point** copies editable covenant values into the unsaved builder; fictional observations and reviews are never copied or persisted.

### Lifecycle inspector

The inspector contains a fictional marker, title, copy/reset tools, philosophy, situation, emphasis labels, a five-stage ordered lifecycle, a disclosed observation table, the recorded review, tradeoffs, may-not-fit reasons, and a final copy action. Stage numbers and a connecting rule make sequence primary. Condition-ready is amber; review and cooldown are green; text labels and stage titles carry meaning independently of color. The table has a `44rem` minimum width inside an overflow container.

### Provider note

**Generate variants** only toggles a disclosure. Its shipping state is “Model generation is provider-ready, not simulated” with “Bundled examples active.” Bundled examples work offline. No Generate action, local adapter, OpenRouter adapter, credential capture, network call, loading stream, or generated result ships. Provider setup and runtime generation remain a separately approved successor boundary.

### Covenant builder

The builder is a hidden, editable form organized into four semantic fieldsets: Intent, Guardrails, Decision boundaries, and Preview. Example selection fills only covenant fields and converts stored fractions to displayed percentages. The preview is deterministic, browser-local, and live; saving creates a draft, while approval remains separate. Required inputs, percentage bounds, pending/success/error status, busy labels, and server error feedback are visible. Approval locks a version; a successor creates a new draft rather than editing the approved record.

### Observation rows

Manual entry starts with source metadata and one position row. Each row contains asset ID, name or symbol, quantity, price, optional market value, optional user-authored AI exposure percentage, account group, and Remove. Add clones a cleared row with unique IDs, focuses its first field, and announces the change. Remove is disabled while only one row remains. Validation focuses the exact incomplete or invalid field; missing AI classification remains unknown. Advanced JSON is disclosed, while CSV import remains a first-class sibling form.

### Guided conditions

For an approved covenant without definitions, the condition builder renders seven fieldsets: AI/theme exposure, single-position concentration, observed drawdown, observed volatility, appreciation-led concentration, scheduled review, and overdue review. Each includes an enable control, a plain-language explanation, relevant settings, persistence, clearing persistence, cooldown, missing-data policy, and review instructions. Exact trigger JSON remains under Advanced tools. Once definitions exist, the surface changes to a state list with evaluation and context-appropriate acknowledge/minimal-review controls. States are descriptive—normal, watch, review, escalated review, cooldown, or unavailable—not forecasts or instructions.

### Review records

An approved covenant shows structured-review state. With active conditions and no overlapping open review, the user may open a review. An open packet discloses immutable opening evidence and asks for factual observations, a falsifier/data-quality check, one bounded decision, rationale, and optional follow-up. Completion uses pending/error/success status and closes only the linked review path. Empty states distinguish no active condition from an already-open review. Completed history is read-only and links to Markdown and JSON exports.

## Responsive behavior

| Width | Implemented composition |
| --- | --- |
| `1440px` | The `70rem` desktop breakpoint is active: a sticky `12.75rem` left rail and working canvas; `3rem 2rem` section padding; four pack columns; a two-column workbench (`minmax(26rem, .9fr)` and `minmax(31rem, 1.1fr)`). Returning state uses a two-column summary lead/data composition. |
| `768px` | The `48rem` breakpoint is active but the desktop rail is not. Navigation remains a horizontal top bar. The opening, form/fit grids, position rows, condition grid, inspector action, review definition rows, and workstation summary become two-column where declared; the workbench itself remains stacked and pack selection remains two columns. |
| `390px` | The `32rem` compact rules are active: `h1` is `2.1rem`; sections use `.8rem` inline padding; the fictional mobile starting point and its copy action enter the first-use opening; entry actions become full-width; packs become one column; inspector tools and provider note stack; number inputs lose their `16rem` cap. Navigation remains horizontally scrollable. Content is a linear document, not a compressed dashboard. |

## Accessibility, trust, and provenance

- Preserve landmarks, heading order, labels, fieldsets/legends, native buttons and links, `details`/`summary`, `aria-pressed`, `aria-live` status regions, and the skip link.
- Keep controls at least `2.75rem` high, focus visible, tables horizontally scrollable, and error recovery focused on the relevant field. Never encode provider, condition, success, warning, or error state by color alone.
- “Saved locally on this device” and the investment-advice/execution notice stay visible near the top. Current data lives in local SQLite and is not transmitted by default.
- Mark fictional walkthroughs in the header, copy, footnote, and data names. Exploring and resetting must not call mutation routes. Copy only editable policy text into a personal draft.
- Keep personal, fictional, deterministic, and future model-generated provenance distinct. Do not turn unknown or unavailable data into zero, normal, cleared, or safe.
- Approved covenants, accepted observations, completed reviews, and audit events retain their immutability and export provenance. Raw JSON and audit detail remain progressive disclosures.
- Never place provider credentials in SQLite, HTML, logs, exports, or delegated work. Do not imply runtime AI exists until an adapter, consent boundary, credential decision, and proof gates ship.

## Anti-patterns

Avoid a blank long-form homepage; generic rounded-card grids or pill navigation; glassmorphism, gradients, neon, crypto-dashboard styling, and gamified investing cues; giant empty heroes, decorative finance photography, or charts that imply real evidence; broad radius, floating panels, and excessive shadow; tiny operational text; dense desktop dashboards squeezed onto mobile; hidden tradeoffs or color-only state; recommendation, suitability, performance, or market-timing language; fake AI generation or streaming; silent provider calls; and any mixing of fictional records with personal persistence.

## Direction provenance

The approved north-star mock is `.impeccable/mocks/decision-review-bench.png`, with metadata in `.impeccable/mocks/decision-review-bench.png.json`. It established grounded direction 5 and direction seed `de857c1a`: the review-bench metaphor, deep-ink rail, pale stone canvas, cobalt selection, integrated lifecycle sheet, and example-before-form structure. The review rasters in `.impeccable/review/` show the implemented first-use and returning states at 1440, 768, and 390 widths.

The north-star is provenance, not a pixel contract. When it or either plan differs from the shipped page, the HTML/CSS and state logic in `apps/web/server.ts` are authoritative.
