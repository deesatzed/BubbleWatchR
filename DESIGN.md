---
name: Decision Covenant
description: A local decision review bench where protocol and evidence frame human judgment without becoming a forecast.
colors:
  ink: "#0a1b2e"
  landing-ink-2: "#122a43"
  workspace-ink-2: "#17324d"
  stone: "#f2f0eb"
  paper: "#fbfaf7"
  landing-paper-2: "#e9e6de"
  workspace-surface-2: "#ece9e2"
  landing-line: "#cec9be"
  workspace-line: "#d2cec5"
  landing-line-strong: "#928c80"
  workspace-line-strong: "#aaa59b"
  cobalt: "#0a50d8"
  cobalt-dark: "#083fa9"
  workspace-cobalt-soft: "#eaf0ff"
  amber: "#ffb000"
  landing-lime: "#c8ff3d"
  landing-lime-ink: "#183000"
  landing-muted: "#586573"
  workspace-muted: "#5b6572"
  landing-dark-muted: "#adbbc8"
  landing-danger: "#b32934"
  workspace-notice: "#fff5d8"
  workspace-danger: "#a62b2b"
  workspace-success: "#177044"
  workspace-warning: "#9a6000"
  white: "#ffffff"
typography:
  display-landing:
    fontFamily: '"Decision Sans", "Helvetica Neue", Arial, sans-serif'
    fontSize: "clamp(4rem, 7.4vw, 6rem)"
    fontWeight: 750
    lineHeight: 0.87
    letterSpacing: "-.04em"
  headline-landing:
    fontFamily: '"Decision Sans", "Helvetica Neue", Arial, sans-serif'
    fontSize: "clamp(2.8rem, 5.6vw, 5.5rem)"
    fontWeight: 700
    lineHeight: 0.95
    letterSpacing: "-.04em"
  title-landing:
    fontFamily: '"Decision Sans", "Helvetica Neue", Arial, sans-serif'
    fontSize: "clamp(2.3rem, 4.8vw, 4.8rem)"
    fontWeight: 700
    lineHeight: 0.96
    letterSpacing: "-.04em"
  display-workspace:
    fontFamily: '"Decision Sans", "Helvetica Neue", Arial, sans-serif'
    fontSize: "2.75rem"
    fontWeight: 680
    lineHeight: 1.12
    letterSpacing: "-.02em"
  headline-workspace:
    fontFamily: '"Decision Sans", "Helvetica Neue", Arial, sans-serif'
    fontSize: "1.65rem"
    fontWeight: 700
    lineHeight: 1.12
    letterSpacing: "-.02em"
  body:
    fontFamily: '"Decision Sans", "Helvetica Neue", Arial, sans-serif'
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  label-landing:
    fontFamily: '"Decision Sans", "Helvetica Neue", Arial, sans-serif'
    fontSize: ".67rem"
    fontWeight: 800
    letterSpacing: ".13em"
  label-control:
    fontFamily: '"Decision Sans", "Helvetica Neue", Arial, sans-serif'
    fontSize: ".82rem"
    fontWeight: 800
    lineHeight: 1
  label-workspace:
    fontFamily: '"Decision Sans", "Helvetica Neue", Arial, sans-serif'
    fontSize: ".76rem"
    fontWeight: 650
rounded:
  square: "0"
  workspace-control: ".25rem"
  workspace-field: ".18rem"
  round: "50%"
components:
  button-landing-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.white}"
    typography: "{typography.label-control}"
    rounded: "{rounded.square}"
    padding: ".75rem 1rem"
  button-landing-primary-hover:
    backgroundColor: "{colors.cobalt}"
    textColor: "{colors.white}"
    typography: "{typography.label-control}"
    rounded: "{rounded.square}"
    padding: ".75rem 1rem"
  button-landing-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.label-control}"
    rounded: "{rounded.square}"
    padding: ".75rem 1rem"
  stage-tab-landing-selected:
    backgroundColor: "{colors.cobalt}"
    textColor: "{colors.white}"
    rounded: "{rounded.square}"
    padding: "1rem"
  metric-landing:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.square}"
    padding: "1.4rem"
  condition-row-landing:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.white}"
    rounded: "{rounded.square}"
    padding: "1rem 1.4rem"
  button-workspace-primary:
    backgroundColor: "{colors.cobalt}"
    textColor: "{colors.white}"
    rounded: "{rounded.workspace-control}"
    padding: ".67rem .9rem"
  button-workspace-secondary:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.workspace-control}"
    padding: ".67rem .9rem"
  nav-workspace-current:
    backgroundColor: "{colors.landing-ink-2}"
    textColor: "{colors.white}"
    rounded: "{rounded.square}"
    padding: ".65rem .75rem"
  input-workspace:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.workspace-field}"
    padding: ".72rem .75rem"
  example-row-workspace-selected:
    backgroundColor: "{colors.workspace-cobalt-soft}"
    textColor: "{colors.ink}"
    rounded: "{rounded.square}"
    padding: "1rem 3.5rem 1rem 1.1rem"
---

# Design System: Decision Covenant

## Overview

**Creative North Star: "The Decision Review Bench"**

Decision Covenant is a local policy-and-evidence workspace for making the review process before the moment gets loud. Its ownable world is a serious editorial review bench: pale stone working canvas, deep ink, cobalt action, acid-lime verified evidence on the landing, thin registration rules, clipped controls, tabular evidence, and restrained semantic color. Spatial grouping and rules carry hierarchy; rounding and shadow are deliberately scarce.

The prediction is not the decision. The Persuade-mode landing refuses the generic forecast dashboard and makes a fictional review protocol the spectacle. The Operate-mode workspace preserves the established bench where a person inspects examples, writes a policy, saves observations, sees deterministic condition state, and records a human disposition. Neither route may imply external AI activity, a forecast, performance, suitability, a recommendation, or production readiness.

**Status:** Implemented interface record, 2026-08-26.

**Authority:** `apps/web/landing.ts` is authoritative for `/`. `apps/web/server.ts` is authoritative for `/workspace`, the route dispatch, and the shared local font response. Product truth constrains both routes; plans, mocks, and review rasters provide intent or evidence but do not override route-owned HTML, CSS, state logic, or copy.

| Route | Mode | Implemented surface | Source owner |
| --- | --- | --- | --- |
| `/` | Persuade | Aurora Evidence Theater landing surface: thesis, fictional protocol preview, staged evidence case, method, scope, boundary, and workspace actions | `apps/web/landing.ts` |
| `/workspace` | Operate | Established decision review bench: first-use examples, returning-state summary, policy builder, observations, deterministic conditions, reviews, and record | `apps/web/server.ts` |

### Provenance and screenshots

The approved north-star mock is `.impeccable/mocks/decision-review-bench.png`, with its tool, prompt, approval, and direction seed in `.impeccable/mocks/decision-review-bench.png.json`. It established grounded direction 5 and seed `de857c1a`. The landing extends that world as the approved code-led Evidence Theater form; the mock remains provenance, not a pixel contract.

Current review-only captures are:

- Landing first viewport: `.impeccable/review/landing-desktop.png` (1440 × 900), `landing-tablet.png` (768 × 900), and `landing-mobile.png` (390 × 844).
- Landing evidence stage: `.impeccable/review/landing-evidence-desktop.png` (1440 × 900), `landing-evidence-tablet.png` (768 × 900), and `landing-evidence-mobile.png` (390 × 844).
- Workspace first use: `.impeccable/review/workspace-desktop.png` (1440 × 900), `workspace-tablet.png` (768 × 900), and `workspace-mobile.png` (390 × 844).
- Returning workspace: `.impeccable/review/workspace-returning-desktop.png` (1440 × 900) and `workspace-returning-mobile.png` (390 × 844).
- The earlier workspace record remains in `desktop.png`, `tablet.png`, `mobile.png`, `returning-desktop.png`, and `returning-mobile.png` at the same respective viewport classes.

No shipping raster assets were introduced. Runtime source and `assets/` contain no PNG, JPEG, WebP, GIF, or AVIF; the landing trace is inline SVG, the only shipped visual asset is the local Manrope font, and all PNGs remain non-shipping mock or review evidence under `.impeccable/`.

**Key Characteristics:**

- Route-owned expression: Evidence Theater persuades at `/`; the decision review bench operates at `/workspace`.
- Pale stone, deep ink, cobalt action, sharp rules, and editorial Manrope unify both routes.
- Acid lime is landing-only verified evidence; workspace success remains restrained green.
- Fictional, personal, deterministic, and future provider provenance never collapse into one state.
- Desktop compositions use strong asymmetry; compact compositions keep purpose, protocol, promise, and action together.
- Raster imagery is evidence-only, never part of the shipped interface.

**The Route-Owned Authority Rule.** `apps/web/landing.ts` decides `/`; `apps/web/server.ts` decides `/workspace`. Shared language does not erase route-specific tokens or behavior.

## Colors

The palette is warm and editorial rather than financial-dashboard glossy. Exact values live in the frontmatter; the tables preserve the implemented CSS custom-property names and route-specific aliases.

### Primary

- **Cobalt Action** (`colors.cobalt`): links, current selection, primary actions, the landing thesis interruption, and the final landing field.
- **Cobalt Action Hover** (`colors.cobalt-dark`): the workspace primary hover token; the landing defines the same value even though its primary button hover uses full cobalt.
- **Soft Cobalt Selection** (`colors.workspace-cobalt-soft`): workspace selected packs, selected examples, and provenance markers.

### Secondary

- **Verified Acid Lime** (`colors.landing-lime`): landing trace, deterministic fact, normal-state mark, and verified status word on deep ink.
- **Acid Lime Ink** (`colors.landing-lime-ink`): readable text placed on the acid-lime status field.
- **Workspace Success** (`colors.workspace-success`): local-state dot and successful review/cooldown state.

### Tertiary

- **Amber Focus and Review** (`colors.amber`): visible focus on both routes, fictional marker and review alert on the landing, and review-state emphasis.
- **Contrary / Danger Reds** (`colors.landing-danger` and `colors.workspace-danger`): contrary evidence on `/` and invalid/error state on `/workspace`.
- **Workspace Notice and Warning** (`colors.workspace-notice` and `colors.workspace-warning`): trust notice and defined warning semantics. The warning token is defined but not otherwise referenced by the current workspace stylesheet.

### Neutral

- **Deep Ink** (`colors.ink`): primary text and large dark fields on both routes.
- **Pale Stone and Warm Paper** (`colors.stone` and `colors.paper`): shared canvas and working-sheet values under route-specific variable names.
- **Route-specific secondary ink, muted text, paper, and rules** retain their distinct values rather than being normalized across routes.

### Landing custom properties

| CSS variable | Normative token | Implemented role |
| --- | --- | --- |
| `--ink` | `colors.ink` | Primary text and dark protocol fields |
| `--ink-2` | `colors.landing-ink-2` | Defined reserve dark ink; not referenced by the current landing rules |
| `--stone` | `colors.stone` | Page canvas |
| `--paper` | `colors.paper` | Header, sheets, and light fields |
| `--paper-2` | `colors.landing-paper-2` | Hover and unavailable fields |
| `--line` | `colors.landing-line` | Registration rules |
| `--line-strong` | `colors.landing-line-strong` | Strong boundaries |
| `--cobalt` | `colors.cobalt` | Action, selection, and thesis emphasis |
| `--cobalt-dark` | `colors.cobalt-dark` | Defined dark cobalt |
| `--amber` | `colors.amber` | Focus, fictional marker, and review state |
| `--lime` | `colors.landing-lime` | Verified deterministic evidence |
| `--lime-ink` | `colors.landing-lime-ink` | Text on lime |
| `--muted` | `colors.landing-muted` | Supporting copy |
| `--dark-muted` | `colors.landing-dark-muted` | Supporting copy on deep ink |
| `--danger` | `colors.landing-danger` | Contrary evidence |

Landing route-bound literals are `#29435e` for dark-field rules and trace grid, and `#dbe7ff` for final-call supporting copy. White, transparent, and the frontmatter values complete the current landing palette.

### Workspace custom properties

| CSS variable | Normative token | Implemented role |
| --- | --- | --- |
| `--ink` | `colors.ink` | Primary text, rail, summary, and preview |
| `--ink-2` | `colors.workspace-ink-2` | Dark hover surface |
| `--muted` | `colors.workspace-muted` | Supporting copy and metadata |
| `--page` | `colors.stone` | Warm canvas |
| `--surface` | `colors.paper` | Forms and working sheets |
| `--surface-2` | `colors.workspace-surface-2` | Secondary sheets and chips |
| `--line` | `colors.workspace-line` | Registration rules |
| `--line-strong` | `colors.workspace-line-strong` | Strong boundaries |
| `--primary` | `colors.cobalt` | Links, selection, and primary actions |
| `--primary-dark` | `colors.cobalt-dark` | Primary hover |
| `--primary-soft` | `colors.workspace-cobalt-soft` | Selected and provenance surfaces |
| `--focus` | `colors.amber` | Keyboard focus ring |
| `--notice` | `colors.workspace-notice` | Trust notice and review-state background |
| `--danger` | `colors.workspace-danger` | Invalid and error state |
| `--success` | `colors.workspace-success` | Local, review, cooldown, and success state |
| `--warning` | `colors.workspace-warning` | Defined warning reserve |

Workspace route-bound literals remain `#f7f9fb`, `#cad5df`, `#5f8eff`, `#122a43`, `#9fb0bf`, `#38506a`, `#bdc9d5`, `#93a8bb`, `#c4d0dc`, `#96a9bb`, `#59420d`, `#e4cf94`, `#88b49d`, `#f0f8f3`, `#f5f7fb`, `#9eb8ff`, `#694300`, `#d59a21`, `#fff4d5`, `#704600`, `#d9a43f`, `#f4f6fb`, `#f8f7f3`, and `#8d9299`. The workbench shadow uses `rgb(10 27 46 / 8%)` and the invalid-field halo uses `rgb(166 43 43 / 14%)`. The stylesheet also uses white, transparent, and `color-mix(in srgb, var(--surface) 92%, transparent)`.

**The Acid-Lime Rule.** Acid lime verifies evidence on the landing; it never becomes a generic decorative accent or a promise of outcome.

## Typography

**Display Font:** Decision Sans, the self-hosted Manrope variable font, with Helvetica Neue, Arial, and sans-serif fallbacks.

**Body Font:** Decision Sans with the same local fallback stack.

**Character:** Manrope is used editorially: compressed, oversized landing declarations against small uppercase protocol labels, then a calmer, denser hierarchy inside the workspace. The font is served at `/assets/fonts/manrope-variable.ttf` from `assets/fonts/Manrope-Variable.ttf`; its OFL license is preserved in `assets/fonts/OFL.txt`, and no remote font request ships.

### Landing hierarchy

- **Hero display** (750, `clamp(4rem, 7.4vw, 6rem)`, .87, `-.04em`): an `11ch` thesis on desktop. At `max-width: 48rem` it becomes `clamp(3.1rem, 14.5vw, 5rem)`.
- **Protocol preview display** (`clamp(2.5rem, 4.4vw, 4.6rem)`, .95, `-.04em`): the dark-trace assertion; on compact mobile it becomes `clamp(2.7rem, 12vw, 4.2rem)`.
- **Section display** (`clamp(2.8rem, 5.6vw, 5.5rem)`, .95, `-.04em`): Aurora, method, scope, and trust headings.
- **Stage title** (`clamp(2.3rem, 4.8vw, 4.8rem)`, .96, `-.04em`): the active evidence-panel headline.
- **Final call** (`clamp(3rem, 6.5vw, 6rem)`, .9, `-.04em`): the cobalt close.
- **Hero deck** (`clamp(1.1rem, 1.8vw, 1.45rem)`, 1.5): the promise below a strong registration rule.
- **Supporting copy** (1rem, 1.5–1.6): protocol explanation, evidence narrative, and calls to action. Supporting sizes also include `1.05rem`, `.9rem`, `.88rem`, `.82rem`, `.8rem`, `.78rem`, `.76rem`, and `.75rem`.
- **Protocol labels** (`.62rem`–`.7rem`, 700–800, `.06em`–`.13em`, uppercase): metadata, states, facts, and stage navigation.
- **Numeric display** (250–750): stage indices, truth-tape facts, metrics, dates, and cooldown values. The trace uses an explicit `700 11px` Decision Sans label.

The landing declares the font face at weights 200–800, disables synthesis, and keeps every requested weight within that declared variable range.

### Workspace hierarchy

- **Root body** (400, 1rem, 1.5): the default reading and form rhythm.
- **Display** (680, 2.75rem, 1.12, `-.02em`): first-use and returning summary headlines, with a `17ch` measure; at `max-width: 32rem` it becomes `2.1rem`.
- **Headline** (1.65rem, 1.12): primary workspace section headings.
- **Title** (1.4rem): inspector and form titles. Fourth-level headings are 1rem with `-.01em` tracking.
- **Brand** (700, 1.25rem, 1.05): two-line rail wordmark; at `min-width: 70rem` it becomes 1.55rem.
- **Supporting sizes**: `1.1rem`, `1.08rem`, `.92rem`, `.9rem`, `.88rem`, `.84rem`, `.82rem`, `.8rem`, `.78rem`, `.76rem`, `.74rem`, and `.72rem`.
- **Weights**: 400, 650, 680, 700, and 750. Dates, values, summary data, and stage numbers use tabular numerals.

**The Six-Rem Thesis Rule.** The landing earns its scale through one short thesis; workspace type stays compact enough to inspect records and complete forms.

## Layout

The shared maximum content width is `92rem`. Both routes use borders and dark/light field changes to establish hierarchy, but their viewport strategies differ.

### Landing first viewport and responsive protocol

Above `70rem`, the `4.75rem` sticky header sits over a hero with `min-height: calc(100svh - 4.75rem)`. The hero is a split grid: `minmax(0, 1.05fr)` thesis copy beside a `minmax(28rem, .75fr)` deep-ink protocol trace. The copy uses `clamp(3.5rem, 7vw, 7rem)` vertical padding, desktop gutter math against `--max: 92rem`, and up to `7rem` between thesis and trace. The thesis, promise, evidence action, and workspace action are all present in that first composition.

At `max-width: 70rem`, the hero stacks. The copy keeps a `43rem` minimum height and introduces a compact fictional protocol summary inside the thesis column; the full deep-ink preview follows as a separate `42rem` minimum-height field. At `max-width: 48rem`, the secondary header navigation hides, the hero copy becomes `calc(100svh - 4.75rem)` with `2rem 1rem` padding, the compact protocol, promise, and two full-width actions remain together, and the full preview becomes content-height with `3rem 1rem` padding.

The compact summary is five equal cells—Write, Observe, Confirm, Review, Record—with Review selected, a fictional header, and deterministic/human disposition footer. The Aurora stage navigator is a separate five-cell tablist. On mobile it remains one row of five equal `minmax(0, 1fr)` columns; each tab is at least `4rem` high, center-aligned, and shows stage number plus state label. Content below reflows linearly: metrics, condition sheet, evidence, recorded decision, trust boundary, and final action become one column.

### Landing stage and section rhythm

The showpiece uses `clamp(5rem, 9vw, 9rem)` block padding and a `92rem` shell. Desktop section headings place their content in the second column of a `.55fr 1fr` grid. The selected panel starts after a strong five-cell rule and uses `clamp(2.25rem, 5vw, 5rem)` top padding. The metric strip is three columns; the condition sheet is `minmax(14rem, .55fr) 1fr`; observed and contrary evidence split evenly; the recorded disposition uses `.65fr 1.2fr .65fr`. Tablet simplifies condition rows; mobile stacks every evidence field while preserving source order.

### Workspace state and responsive record

First use is selected when there are no covenants and no snapshots. It begins with app navigation, the local-state bar, the trust notice, and an example-led opening. At compact mobile width, an explicitly fictional selected starting point and `Use this example` action enter the opening so purpose, example, and action share the first viewport. The covenant builder remains hidden until the user chooses an example, opens My policy, or starts blank.

Returning use begins when at least one covenant or snapshot exists. A deep-ink workstation summary precedes the examples and reports saved policy status, latest observation, condition counts, open reviews, next scheduled review, and one deterministic next-step link. The opening contracts to `Explore another starting point`, while operational forms remain lower in the document and disclosure-driven.

| Width | Implemented `/workspace` composition |
| --- | --- |
| 1440px | The `70rem` desktop breakpoint is active: sticky `12.75rem` left rail, `3rem 2rem` section padding, four pack columns, and a `minmax(26rem, .9fr) minmax(31rem, 1.1fr)` workbench. Returning state uses a two-column summary. |
| 768px | The `48rem` breakpoint is active but the desktop rail is not. Navigation is a horizontal top bar; forms, fit grids, rows, conditions, inspector action, review definitions, and workstation summary use declared two-column layouts. The workbench remains stacked and packs use two columns. |
| 390px | The `32rem` compact rules are active: 2.1rem h1, `.8rem` section gutters, a first-viewport fictional starting point, full-width entry actions, one-column packs, stacked tools/provider note, and uncapped numeric inputs. The page remains a linear document. |

There is no named spacing scale in either source. The landing owns `--max: 92rem`; the workspace reuses exact declarations rather than a scale. Workspace gap, margin, and padding lengths in current use are `-1rem`, `-.15rem`, `0`, `.1rem`, `.15rem`, `.16rem`, `.18rem`, `.2rem`, `.25rem`, `.3rem`, `.35rem`, `.38rem`, `.4rem`, `.42rem`, `.45rem`, `.5rem`, `.55rem`, `.6rem`, `.65rem`, `.67rem`, `.7rem`, `.72rem`, `.75rem`, `.8rem`, `.85rem`, `.9rem`, `1rem`, `1.1rem`, `1.15rem`, `1.2rem`, `1.25rem`, `1.4rem`, `1.5rem`, `1.75rem`, `2rem`, `2.25rem`, `3rem`, and `3.5rem`.

### Accessibility and progressive enhancement

- Both routes begin with a skip link and preserve semantic landmarks, heading order, native links/buttons, visible focus, and at least `2.75rem` interactive height.
- The landing tablist supports click, Arrow keys, Home, and End with roving `tabindex` and `aria-selected`. Selecting a stage reveals the matching labeled `tabpanel`.
- JavaScript adds `landing-has-js`. Only then are inactive stage panels hidden and the trace line animated. Without JavaScript, every stage panel remains visible in source order and the SVG trace remains fully drawn; navigation and workspace links remain ordinary links.
- The landing trace has a title and description. Fictional, state, evidence, and review meaning is always carried by text, not color alone.
- Under `prefers-reduced-motion: reduce`, both routes switch scrolling to automatic and force transitions/animations to `.01ms`. The landing also forces the trace to its completed state.
- Workspace forms retain labels, fieldsets/legends, `details/summary` disclosures, `aria-live` statuses, focused error recovery, horizontally scrollable tables, and color-independent state names.

**The First-Viewport Protocol Rule.** Compact composition may remove the large trace from the thesis column, but it must retain the fictional protocol summary, promise, and both actions before the full evidence field.

## Elevation & Depth

The landing is flat by construction: it declares no `box-shadow`. Deep-ink fields, cobalt blocks, one-pixel registration rules, and adjacent tonal planes create depth. The workspace is also flat by default, with two functional exceptions.

### Shadow vocabulary

- **Workbench lift** (`0 14px 38px rgb(10 27 46 / 8%)`): separates the example browser and inspector from the page canvas.
- **Invalid-field halo** (`0 0 0 2px rgb(166 43 43 / 14%)`): reinforces the danger border without replacing focused error text.

**The Flat Landing Rule.** Evidence Theater uses field contrast and registration, never decorative card shadow.

## Shapes

The landing is square and registered. Buttons, tabs, facts, stage marks, evidence sheets, and calls to action have no radius; the brand mark is two overlapping squares; trace caps are square and joins are mitered. One-pixel rules define most edges, while selected workspace examples use a three-pixel cobalt inset rule.

The workspace permits only a clipped `.25rem` control/container radius and `.18rem` field radius. Pack and example selectors remain square. Circular geometry is reserved for sequence indices and the local-state dot (`50%`), not general containers.

**The Sharp Registration Rule.** Rounded-card language is not the bridge between the two routes; aligned rules, clipped controls, and explicit state fields are.

## Components

### Landing navigation and actions

The sticky paper header uses a three-column desktop grid: square registration mark and wordmark, three in-page anchors, and `Open the workspace`. Below `48rem` the in-page navigation hides, while the workspace action remains. Primary buttons are deep ink with a one-pixel ink border and become cobalt on hover. Secondary buttons are transparent ink and invert to deep ink on hover. Every action is a real anchor; the page does not depend on JavaScript to reach evidence or the workspace.

### Landing hero and protocol preview

The hero pairs the short cobalt-interrupted thesis with a deep-ink fictional Aurora trace. The trace is inline SVG and labeled as non-predictive. Its three facts distinguish saved input, deterministic condition, and human-authored disposition. On tablet/mobile, the compact five-step summary duplicates the protocol shape in a denser, static form before the full preview.

### Landing stage navigator

Five native buttons form a `role="tablist"`. Default tabs are transparent with muted labels and a right registration rule; hover uses secondary paper; selected state is full cobalt with white type. Desktop minimum height is `5.25rem` and mobile minimum height is `4rem`. The first stage is selected in HTML and reaffirmed by the script.

### Landing stage and panel anatomy

Each `tabpanel` contains, in order:

1. A large stage index, headline, narrative, fictional marker, eyebrow, and UTC-formatted date.
2. A three-cell metric strip. Every cell provides label, value, written status, and detail; verified, unavailable, watch, review, and cooldown have distinct but text-backed treatments.
3. A deep-ink deterministic condition sheet with the escalated count, the explicit “review, never action” boundary, and condition rows containing label, state name, and explanation.
4. Split observed and contrary evidence lists, using cobalt and red square markers plus headings.
5. An optional amber falsifier sheet.
6. An optional cobalt recorded-disposition sheet with decision, rationale, follow-up, and cooldown.

With JavaScript, one panel is visible at a time. Without it, all five remain readable in sequence.

### Landing supporting sections

The four-cell truth tape records implemented product facts without forecasting. The dark anatomy field presents Precommit, Observe, Invoke, and Record as four registered columns. The use-case list is a ruled index into `/workspace#examples`. The trust section pairs “What it did” with “What it did not do,” then states the local/deterministic boundary. The final cobalt field has one white workspace action. Footer copy repeats the no-prediction, no-recommendation, no-execution boundary.

### Workspace navigation

An off-canvas-until-focused skip link precedes a semantic `aside` and `nav`. The rail contains the two-line wordmark; Examples, My policy, Observations, Reviews, and Record anchors; and a local-first/no-forecast note on desktop. Examples is current in the shipping single-page workspace. Hover/current state uses light text, a cobalt rule, and a dark inset surface. Below `70rem`, navigation becomes a horizontally scrollable top bar rather than a compressed side rail.

### Workspace example workbench

The workbench contains the opening and entry actions, optional provider disclosure, four pack buttons, three visible example rows, and an inspector stack. Pack and example buttons expose selection with `aria-pressed`, cobalt rules, and a soft-cobalt surface. The initial state selects the first pack and example. Reset returns only browser presentation state. `Use as my starting point` copies editable covenant values into the unsaved builder; fictional observations and reviews are never copied or persisted.

### Workspace lifecycle inspector

The inspector contains a fictional marker, title, copy/reset tools, philosophy, situation, emphasis labels, a five-stage ordered lifecycle, disclosed observation table, recorded review, tradeoffs, may-not-fit reasons, and final copy action. Stage numbers and a connecting rule make sequence primary. Condition-ready is amber; review and cooldown are green; labels carry meaning independently of color. The table keeps a `44rem` minimum width inside an overflow container.

### Workspace provider note

`Generate variants` only toggles a disclosure. Its implemented state is “Model generation is provider-ready, not simulated” with “Bundled examples active.” Bundled examples work offline. No Generate action, local adapter, OpenRouter adapter, credential capture, network call, loading stream, or generated result ships.

### Workspace covenant builder

The hidden editable form is organized into Intent, Guardrails, Decision boundaries, and Preview fieldsets. Example selection fills only covenant fields and converts stored fractions to displayed percentages. The preview is deterministic, browser-local, and live; saving creates a draft, while approval remains separate. Required inputs, percentage bounds, pending/success/error status, busy labels, and server error feedback are visible. Approval locks a version; a successor creates a new draft instead of editing the approved record.

### Workspace observation rows and guided conditions

Manual observation entry starts with source metadata and one position row. Add clones a cleared row with unique IDs, focuses its first field, and announces the change. Remove is disabled while one row remains. Validation focuses the exact invalid field; missing AI classification remains unknown. Advanced JSON is disclosed, while CSV is a first-class sibling form.

For an approved covenant without definitions, the condition builder renders seven fieldsets with enable controls, plain-language explanation, relevant settings, persistence, clearing persistence, cooldown, missing-data policy, and review instructions. Exact trigger JSON remains under Advanced tools. Once definitions exist, the surface changes to a state list with evaluation and context-appropriate controls. States are descriptive—normal, watch, review, escalated review, cooldown, or unavailable—not forecasts or instructions.

### Workspace review records

An approved covenant shows structured-review state. With active conditions and no overlapping open review, the user may open a review. An open packet discloses immutable opening evidence and asks for factual observations, a falsifier/data-quality check, one bounded decision, rationale, and optional follow-up. Completion closes only the linked review path. Empty states distinguish no active condition from an already-open review. Completed history is read-only and links to Markdown and JSON exports.

**The Prediction Is Not the Decision Rule.** A condition may invoke review; only a person records a disposition. No visual state is an instruction, forecast, recommendation, or performance claim.

## Do's and Don'ts

### Do:

- **Do** keep `/` expressive and `/workspace` operational while preserving the same stone, ink, cobalt, rule, and Manrope world.
- **Do** keep fictional provenance in the landing header, stage metadata, trace description, evidence copy, and workspace walkthrough markers.
- **Do** preserve all five landing stages without JavaScript and expose one keyboard-operable tab panel at a time with JavaScript.
- **Do** keep controls at least `2.75rem` high, focus visible, status text explicit, and tables horizontally scrollable.
- **Do** keep personal, fictional, deterministic, and future model-generated provenance visibly distinct.
- **Do** keep unknown or unavailable evidence visible; never translate it into zero, normal, cleared, or safe.
- **Do** treat mock and review PNGs as non-shipping evidence and keep shipping visual assets code-led.
- **Do** defer to each route’s authoritative source when this document, a plan, a mock, or a screenshot differs.

### Don't:

- **Don't** turn either route into a forecast dashboard, trading assistant, performance report, suitability screen, or recommendation engine.
- **Don't** introduce rounded-card grids, pill navigation, glassmorphism, gradients, neon, crypto-dashboard styling, or gamified investing cues.
- **Don't** use decorative finance photography, charts that imply live evidence, or raster imagery as interface decoration.
- **Don't** use acid lime as decoration or outcome promise; reserve it for verified deterministic evidence on the landing.
- **Don't** hide tradeoffs, falsifiers, unavailable data, or state meaning behind color alone.
- **Don't** compress the desktop bench into a dense mobile dashboard; preserve a linear evidence and action sequence.
- **Don't** imply runtime AI exists because a provider disclosure exists; no provider adapter or model result currently ships.
- **Don't** place provider credentials in SQLite, HTML, logs, exports, fixtures, or delegated work.
- **Don't** mix fictional walkthrough records with personal persistence.
- **Don't** claim production readiness from the existence of implemented routes, screenshots, documentation, or a review artifact.
