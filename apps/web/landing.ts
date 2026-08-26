import { AURORA_SHOWPIECE } from "../../packages/examples/index.js";
import type { ShowpieceStage } from "../../packages/examples/index.js";

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function titleCase(value: string): string {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}

function evidenceList(title: string, items: readonly string[], className: string): string {
  return `<section class="evidence-list ${className}">
    <h4>${escapeHtml(title)}</h4>
    <ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
  </section>`;
}

function stagePanel(stage: ShowpieceStage, selected: boolean): string {
  const review = stage.review
    ? `<section class="recorded-decision" aria-label="Recorded disposition">
        <div>
          <span class="label">Recorded disposition</span>
          <strong>${escapeHtml(titleCase(stage.review.decision))}</strong>
        </div>
        <p>${escapeHtml(stage.review.rationale)}</p>
        <dl>
          <div><dt>Follow-up</dt><dd>${stage.review.followUpAt ? escapeHtml(formatDate(stage.review.followUpAt)) : "None"}</dd></div>
          <div><dt>Cooldown</dt><dd>${escapeHtml(stage.review.cooldownDays)} days</dd></div>
        </dl>
      </section>`
    : "";
  const falsifier = stage.falsifierCheck
    ? `<section class="falsifier">
        <span class="label">Falsifier check</span>
        <p>${escapeHtml(stage.falsifierCheck)}</p>
      </section>`
    : "";

  return `<article
    id="panel-${escapeHtml(stage.id)}"
    class="showpiece-panel${selected ? " is-active" : ""}"
    data-showpiece-stage="${escapeHtml(stage.id)}"
    role="tabpanel"
    tabindex="-1"
    aria-labelledby="tab-${escapeHtml(stage.id)}">
    <header class="stage-heading">
      <div class="stage-index" aria-hidden="true">${escapeHtml(stage.step)}</div>
      <div>
        <h3>${escapeHtml(stage.headline)}</h3>
        <p class="stage-narrative">${escapeHtml(stage.narrative)}</p>
        <p class="stage-meta"><strong>Fictional scenario</strong> <span>·</span> ${escapeHtml(stage.eyebrow)} <span>·</span> ${escapeHtml(formatDate(stage.asOf))}</p>
      </div>
    </header>

    <dl class="metric-strip">
      ${stage.metrics.map((metric) => `<div class="metric" data-status="${escapeHtml(metric.status)}">
        <dt>${escapeHtml(metric.label)}</dt>
        <dd>${escapeHtml(metric.value)}</dd>
        <p><span class="status-word">${escapeHtml(titleCase(metric.status))}</span> ${escapeHtml(metric.detail)}</p>
      </div>`).join("")}
    </dl>

    <section class="condition-sheet" aria-label="Deterministic condition states">
      <div class="condition-intro">
        <span class="label">Deterministic condition sheet</span>
        <strong>${escapeHtml(stage.conditions.filter((condition) => condition.state === "escalated_review").length)} escalated</strong>
        <p>A state invokes review. It never generates an action.</p>
      </div>
      <div class="condition-rows">
        ${stage.conditions.map((condition) => `<div class="condition-row" data-state="${escapeHtml(condition.state)}">
          <div>
            <span class="state-mark" aria-hidden="true"></span>
            <strong>${escapeHtml(condition.label)}</strong>
          </div>
          <span class="state-name">${escapeHtml(titleCase(condition.state))}</span>
          <p>${escapeHtml(condition.detail)}</p>
        </div>`).join("")}
      </div>
    </section>

    <div class="evidence-grid">
      ${evidenceList("Observed evidence", stage.evidence, "observed")}
      ${evidenceList("Contrary evidence", stage.contraryEvidence, "contrary")}
    </div>
    ${falsifier}
    ${review}
  </article>`;
}

export function landingPage(): string {
  const stageTabs = AURORA_SHOWPIECE.stages.map((stage, index) => `<button
    id="tab-${escapeHtml(stage.id)}"
    class="stage-tab${index === 0 ? " is-selected" : ""}"
    type="button"
    role="tab"
    aria-selected="${index === 0 ? "true" : "false"}"
    aria-controls="panel-${escapeHtml(stage.id)}"
    tabindex="${index === 0 ? "0" : "-1"}"
    data-showpiece-tab="${escapeHtml(stage.id)}">
    <span>${escapeHtml(stage.step)}</span>
    <strong>${escapeHtml(titleCase(stage.state))}</strong>
  </button>`).join("");
  const stages = AURORA_SHOWPIECE.stages.map((stage, index) => stagePanel(stage, index === 0)).join("");
  const did = AURORA_SHOWPIECE.productBoundary.did.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  const didNot = AURORA_SHOWPIECE.productBoundary.didNot.map((item) => `<li>${escapeHtml(item)}</li>`).join("");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" content="Build a deterministic review protocol around uncertain evidence before the forecast gets loud.">
<title>Decision Covenant — The prediction is not the decision</title>
<style>
  @font-face {
    font-family: "Decision Sans";
    src: url("/assets/fonts/manrope-variable.ttf") format("truetype");
    font-style: normal;
    font-weight: 200 800;
    font-display: swap;
  }

  :root {
    --ink: #0a1b2e;
    --ink-2: #122a43;
    --stone: #f2f0eb;
    --paper: #fbfaf7;
    --paper-2: #e9e6de;
    --line: #cec9be;
    --line-strong: #928c80;
    --cobalt: #0a50d8;
    --cobalt-dark: #083fa9;
    --amber: #ffb000;
    --lime: #c8ff3d;
    --lime-ink: #183000;
    --muted: #586573;
    --dark-muted: #adbbc8;
    --danger: #b32934;
    --max: 92rem;
    color: var(--ink);
    background: var(--stone);
    font-family: "Decision Sans", "Helvetica Neue", Arial, sans-serif;
    font-synthesis: none;
    text-rendering: optimizeLegibility;
  }

  * { box-sizing: border-box; }
  html { scroll-behavior: smooth; }
  body { margin: 0; background: var(--stone); }
  body, button, a { -webkit-font-smoothing: antialiased; }
  a { color: inherit; }
  button { font: inherit; }
  svg { display: block; max-width: 100%; }
  ::selection { color: white; background: var(--cobalt); }

  .skip-link {
    position: fixed;
    top: .5rem;
    left: .5rem;
    z-index: 20;
    padding: .8rem 1rem;
    color: white;
    background: var(--ink);
    transform: translateY(-150%);
  }
  .skip-link:focus { transform: translateY(0); }

  .site-header {
    position: sticky;
    top: 0;
    z-index: 10;
    min-height: 4.75rem;
    border-bottom: 1px solid var(--line);
    background: var(--paper);
  }
  .header-inner {
    width: min(100% - 3rem, var(--max));
    min-height: 4.75rem;
    margin: 0 auto;
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    gap: 2rem;
  }
  .brand {
    display: inline-flex;
    align-items: center;
    gap: .75rem;
    width: max-content;
    color: var(--ink);
    font-weight: 800;
    letter-spacing: -.03em;
    text-decoration: none;
  }
  .brand-mark {
    width: 1rem;
    height: 1rem;
    background: var(--cobalt);
    position: relative;
    background: transparent;
  }
  .brand-mark::before, .brand-mark::after { content: ""; position: absolute; width: .72rem; height: .72rem; }
  .brand-mark::before { top: 0; left: 0; background: var(--cobalt); }
  .brand-mark::after { right: 0; bottom: 0; background: var(--amber); }
  .site-nav { display: flex; align-items: center; gap: 1.6rem; }
  .site-nav a {
    font-size: .82rem;
    font-weight: 700;
    text-decoration: none;
  }
  .site-nav a:hover { color: var(--cobalt); }
  .header-action { justify-self: end; }

  .button {
    min-height: 2.75rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: .65rem;
    padding: .75rem 1rem;
    border: 1px solid var(--ink);
    color: white;
    background: var(--ink);
    font-size: .82rem;
    font-weight: 800;
    line-height: 1;
    text-decoration: none;
  }
  .button:hover { border-color: var(--cobalt); background: var(--cobalt); }
  .button.secondary { color: var(--ink); background: transparent; }
  .button.secondary:hover { color: white; background: var(--ink); }
  :focus-visible { outline: 3px solid var(--amber); outline-offset: 3px; }

  .hero {
    min-height: calc(100svh - 4.75rem);
    display: grid;
    grid-template-columns: minmax(0, 1.05fr) minmax(28rem, .75fr);
    border-bottom: 1px solid var(--line);
  }
  .hero-copy {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    min-width: 0;
    padding: clamp(3.5rem, 7vw, 7rem) max(3rem, calc((100vw - var(--max)) / 2));
    padding-right: clamp(3rem, 7vw, 7rem);
  }
  .hero-copy h1 {
    max-width: 11ch;
    margin: 0;
    font-size: clamp(4rem, 7.4vw, 6rem);
    font-weight: 750;
    letter-spacing: -.04em;
    line-height: .87;
  }
  .hero-copy h1 span { color: var(--cobalt); }
  .hero-deck {
    max-width: 39rem;
    margin-top: 3.5rem;
    padding-top: 1.4rem;
    border-top: 1px solid var(--line-strong);
  }
  .hero-deck > p {
    max-width: 34rem;
    margin: 0;
    color: var(--muted);
    font-size: clamp(1.1rem, 1.8vw, 1.45rem);
    line-height: 1.5;
  }
  .hero-actions { display: flex; flex-wrap: wrap; gap: .75rem; margin-top: 1.8rem; }

  .compact-protocol { display: none; }

  .protocol-preview {
    min-width: 0;
    padding: clamp(2rem, 4vw, 4rem);
    color: white;
    background: var(--ink);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    overflow: hidden;
  }
  .preview-meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    color: var(--dark-muted);
    font-size: .68rem;
    font-weight: 800;
    letter-spacing: .13em;
    text-transform: uppercase;
  }
  .fictional-tag {
    display: inline-flex;
    min-height: 1.8rem;
    align-items: center;
    padding: .35rem .55rem;
    color: var(--ink);
    background: var(--amber);
    letter-spacing: .08em;
  }
  .protocol-preview h2 {
    max-width: 12ch;
    margin: clamp(2rem, 5vh, 5rem) 0 1rem;
    font-size: clamp(2.5rem, 4.4vw, 4.6rem);
    line-height: .95;
    letter-spacing: -.04em;
  }
  .protocol-preview > p {
    max-width: 34rem;
    margin: 0;
    color: var(--dark-muted);
    font-size: 1rem;
    line-height: 1.55;
  }
  .trace {
    margin: clamp(2rem, 5vh, 4rem) 0 2rem;
    border-block: 1px solid #29435e;
  }
  .trace-grid { stroke: #29435e; stroke-width: 1; }
  .trace-line {
    fill: none;
    stroke: var(--lime);
    stroke-width: 3;
    stroke-linecap: square;
    stroke-linejoin: miter;
  }
  .landing-has-js .trace-line {
    stroke-dasharray: 580;
    stroke-dashoffset: 580;
    animation: draw-trace 1.25s cubic-bezier(.22, 1, .36, 1) .2s forwards;
  }
  .trace-node { fill: var(--ink); stroke: var(--lime); stroke-width: 3; }
  .trace-alert { fill: var(--amber); stroke: var(--ink); stroke-width: 2; }
  .trace text { fill: var(--dark-muted); font: 700 11px "Decision Sans", sans-serif; letter-spacing: .08em; }
  @keyframes draw-trace { to { stroke-dashoffset: 0; } }
  .preview-facts { display: grid; grid-template-columns: repeat(3, 1fr); border: 1px solid #29435e; }
  .preview-facts div { min-width: 0; padding: 1rem; border-right: 1px solid #29435e; }
  .preview-facts div:last-child { border-right: 0; }
  .preview-facts dt {
    color: var(--dark-muted);
    font-size: .62rem;
    font-weight: 800;
    letter-spacing: .12em;
    text-transform: uppercase;
  }
  .preview-facts dd { margin: .45rem 0 0; font-size: .9rem; font-weight: 750; }
  .preview-facts .verified { color: var(--lime); }

  .truth-tape {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    border-bottom: 1px solid var(--line);
    background: var(--paper);
  }
  .truth-tape div {
    min-height: 7.5rem;
    padding: 1.5rem max(1.5rem, calc((100vw - var(--max)) / 8));
    border-right: 1px solid var(--line);
  }
  .truth-tape div:last-child { border-right: 0; }
  .truth-tape strong {
    display: block;
    font-size: 2.3rem;
    font-weight: 650;
    letter-spacing: -.04em;
    line-height: 1;
  }
  .truth-tape span { display: block; margin-top: .6rem; color: var(--muted); font-size: .75rem; font-weight: 700; }

  .section-shell { width: min(100% - 3rem, var(--max)); margin: 0 auto; }
  .showpiece { padding: clamp(5rem, 9vw, 9rem) 0; }
  .section-heading {
    display: grid;
    grid-template-columns: .55fr 1fr;
    gap: 3rem;
    align-items: end;
    margin-bottom: 3rem;
  }
  .section-heading > div { grid-column: 2; }
  .section-heading h2 {
    max-width: 13ch;
    margin: 0;
    font-size: clamp(2.8rem, 5.6vw, 5.5rem);
    line-height: .95;
    letter-spacing: -.04em;
  }
  .section-heading p {
    max-width: 42rem;
    margin: 1.25rem 0 0;
    color: var(--muted);
    font-size: 1.05rem;
    line-height: 1.55;
  }
  .label, .stage-meta {
    color: var(--muted);
    font-size: .67rem;
    font-weight: 800;
    letter-spacing: .13em;
    text-transform: uppercase;
  }
  .showpiece-tabs {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    border-block: 1px solid var(--line-strong);
  }
  .stage-tab {
    min-height: 5.25rem;
    padding: 1rem;
    border: 0;
    border-right: 1px solid var(--line);
    color: var(--muted);
    background: transparent;
    text-align: left;
    cursor: pointer;
  }
  .stage-tab:last-child { border-right: 0; }
  .stage-tab span { display: block; font-size: .68rem; font-weight: 800; letter-spacing: .1em; }
  .stage-tab strong { display: block; margin-top: .35rem; color: var(--ink); font-size: .92rem; }
  .stage-tab:hover { background: var(--paper-2); }
  .stage-tab.is-selected { color: white; background: var(--cobalt); }
  .stage-tab.is-selected strong { color: white; }

  .showpiece-panel { padding: clamp(2.25rem, 5vw, 5rem) 0 1rem; scroll-margin-top: 6rem; }
  .landing-has-js .showpiece-panel:not(.is-active) { display: none; }
  .stage-heading {
    display: grid;
    grid-template-columns: minmax(5rem, .25fr) 1fr;
    gap: 2rem;
    align-items: start;
  }
  .stage-index {
    color: var(--cobalt);
    font-size: clamp(3.5rem, 7vw, 6rem);
    font-weight: 250;
    letter-spacing: -.04em;
    line-height: .8;
  }
  .stage-heading h3 {
    max-width: 16ch;
    margin: 0;
    font-size: clamp(2.3rem, 4.8vw, 4.8rem);
    letter-spacing: -.04em;
    line-height: .96;
  }
  .stage-narrative {
    max-width: 52rem;
    margin: 1.5rem 0 0;
    color: var(--muted);
    font-size: 1.05rem;
    line-height: 1.6;
  }
  .stage-meta { margin: 1.25rem 0 0; }
  .stage-meta strong { color: var(--ink); }
  .stage-meta span { color: var(--cobalt); }
  .metric-strip {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    margin: 4rem 0 0;
    border: 1px solid var(--line-strong);
    background: var(--paper);
  }
  .metric { min-width: 0; padding: 1.4rem; border-right: 1px solid var(--line); }
  .metric:last-child { border-right: 0; }
  .metric dt { color: var(--muted); font-size: .7rem; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; }
  .metric dd { margin: .65rem 0 .8rem; font-size: clamp(1.7rem, 3vw, 2.75rem); font-weight: 700; letter-spacing: -.04em; line-height: 1; }
  .metric p { margin: 0; color: var(--muted); font-size: .78rem; line-height: 1.45; }
  .status-word { display: inline-block; margin-right: .25rem; color: var(--lime-ink); background: var(--lime); font-size: .62rem; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; }
  .metric[data-status="unavailable"] .status-word { color: var(--ink); background: var(--paper-2); }
  .metric[data-status="watch"] .status-word,
  .metric[data-status="review"] .status-word,
  .metric[data-status="cooldown"] .status-word { color: var(--ink); background: var(--amber); }

  .condition-sheet {
    display: grid;
    grid-template-columns: minmax(14rem, .55fr) 1fr;
    margin-top: 1.5rem;
    color: white;
    background: var(--ink);
  }
  .condition-intro { padding: 2rem; border-right: 1px solid #29435e; }
  .condition-intro .label { color: var(--dark-muted); }
  .condition-intro strong { display: block; margin: 3rem 0 .5rem; font-size: 2rem; letter-spacing: -.04em; }
  .condition-intro p { margin: 0; color: var(--dark-muted); font-size: .82rem; line-height: 1.5; }
  .condition-row {
    display: grid;
    grid-template-columns: minmax(10rem, .8fr) auto 1.15fr;
    gap: 1rem;
    align-items: center;
    min-height: 5rem;
    padding: 1rem 1.4rem;
    border-bottom: 1px solid #29435e;
  }
  .condition-row:last-child { border-bottom: 0; }
  .condition-row > div { display: flex; gap: .7rem; align-items: center; }
  .condition-row strong { font-size: .85rem; }
  .condition-row p { margin: 0; color: var(--dark-muted); font-size: .76rem; line-height: 1.4; }
  .state-mark { width: .6rem; height: .6rem; flex: 0 0 auto; border: 2px solid var(--dark-muted); }
  .state-name {
    color: var(--dark-muted);
    font-size: .62rem;
    font-weight: 800;
    letter-spacing: .08em;
    text-transform: uppercase;
  }
  .condition-row[data-state="normal"] .state-mark { border-color: var(--lime); background: var(--lime); }
  .condition-row[data-state="watch"] .state-mark,
  .condition-row[data-state="escalated_review"] .state-mark,
  .condition-row[data-state="cooldown"] .state-mark { border-color: var(--amber); background: var(--amber); }

  .evidence-grid { display: grid; grid-template-columns: 1fr 1fr; margin-top: 1.5rem; border: 1px solid var(--line-strong); }
  .evidence-list { padding: 2rem; }
  .evidence-list + .evidence-list { border-left: 1px solid var(--line); }
  .evidence-list h4 { margin: 0 0 1.25rem; font-size: .75rem; letter-spacing: .1em; text-transform: uppercase; }
  .evidence-list.observed h4 { color: var(--cobalt); }
  .evidence-list.contrary h4 { color: var(--danger); }
  .evidence-list ul, .trust-column ul { margin: 0; padding: 0; list-style: none; }
  .evidence-list li {
    position: relative;
    margin-top: .85rem;
    padding-left: 1.3rem;
    color: var(--muted);
    font-size: .88rem;
    line-height: 1.55;
  }
  .evidence-list li::before { content: ""; position: absolute; top: .55rem; left: 0; width: .45rem; height: .45rem; background: var(--cobalt); }
  .evidence-list.contrary li::before { background: var(--danger); }
  .falsifier, .recorded-decision { margin-top: 1.5rem; padding: 2rem; border: 1px solid var(--amber); background: var(--paper); }
  .falsifier p { max-width: 60rem; margin: .8rem 0 0; font-size: 1rem; line-height: 1.55; }
  .recorded-decision { display: grid; grid-template-columns: .65fr 1.2fr .65fr; gap: 2rem; align-items: start; border-color: var(--cobalt); }
  .recorded-decision strong { display: block; margin-top: .6rem; font-size: 1.7rem; letter-spacing: -.035em; }
  .recorded-decision > p { margin: 0; color: var(--muted); line-height: 1.55; }
  .recorded-decision dl { display: grid; grid-template-columns: 1fr 1fr; margin: 0; }
  .recorded-decision dl div { padding-left: 1rem; border-left: 1px solid var(--line); }
  .recorded-decision dt { color: var(--muted); font-size: .65rem; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; }
  .recorded-decision dd { margin: .45rem 0 0; font-weight: 750; }

  .anatomy { padding: clamp(5rem, 9vw, 9rem) 0; color: white; background: var(--ink); }
  .anatomy .section-heading { align-items: start; }
  .anatomy .section-heading p, .anatomy .label { color: var(--dark-muted); }
  .anatomy-grid { display: grid; grid-template-columns: repeat(4, 1fr); margin-top: 4rem; border-top: 1px solid #29435e; }
  .anatomy-step { min-height: 18rem; padding: 1.5rem; border-right: 1px solid #29435e; }
  .anatomy-step:last-child { border-right: 0; }
  .anatomy-step span { color: var(--lime); font-size: .68rem; font-weight: 800; letter-spacing: .12em; }
  .anatomy-step h3 { margin: 5rem 0 1rem; font-size: 1.5rem; letter-spacing: -.035em; }
  .anatomy-step p { margin: 0; color: var(--dark-muted); font-size: .88rem; line-height: 1.55; }

  .use-cases { padding: clamp(5rem, 9vw, 9rem) 0; }
  .use-case-list { margin-top: 3rem; border-top: 1px solid var(--line-strong); }
  .use-case {
    min-height: 8.5rem;
    display: grid;
    grid-template-columns: 5rem .75fr 1fr;
    gap: 2rem;
    align-items: center;
    border-bottom: 1px solid var(--line);
    text-decoration: none;
  }
  .use-case > span:first-child { color: var(--cobalt); font-weight: 800; }
  .use-case h3 { margin: 0; font-size: clamp(1.35rem, 2vw, 2rem); letter-spacing: -.035em; }
  .use-case p { max-width: 38rem; margin: 0; color: var(--muted); font-size: .9rem; line-height: 1.5; }
  .use-case:hover { background: var(--paper); }

  .trust { padding: clamp(5rem, 9vw, 9rem) 0; border-block: 1px solid var(--line); background: var(--paper); }
  .trust-grid { display: grid; grid-template-columns: 1fr 1fr; border: 1px solid var(--line-strong); }
  .trust-column { padding: clamp(2rem, 4vw, 4rem); }
  .trust-column + .trust-column { border-left: 1px solid var(--line-strong); }
  .trust-column h3 { margin: 0 0 2rem; font-size: clamp(1.8rem, 3vw, 3rem); letter-spacing: -.04em; }
  .trust-column li { position: relative; margin: 1rem 0; padding-left: 1.5rem; color: var(--muted); line-height: 1.5; }
  .trust-column li::before { content: "+"; position: absolute; left: 0; color: var(--cobalt); font-weight: 800; }
  .trust-column.did-not li::before { content: "—"; color: var(--danger); }
  .trust-footnote { max-width: 62rem; margin: 2rem 0 0; color: var(--muted); font-size: .8rem; line-height: 1.5; }

  .final-cta { padding: clamp(5rem, 9vw, 9rem) 0; color: white; background: var(--cobalt); }
  .final-cta .section-shell { display: grid; grid-template-columns: 1fr auto; gap: 3rem; align-items: end; }
  .final-cta h2 { max-width: 12ch; margin: 0; font-size: clamp(3rem, 6.5vw, 6rem); line-height: .9; letter-spacing: -.04em; }
  .final-cta p { max-width: 40rem; margin: 1.5rem 0 0; color: #dbe7ff; font-size: 1rem; line-height: 1.55; }
  .final-cta .button { border-color: white; color: var(--cobalt); background: white; }
  .final-cta .button:hover { color: white; background: var(--ink); }

  .site-footer { color: var(--dark-muted); background: var(--ink); }
  .footer-inner {
    width: min(100% - 3rem, var(--max));
    min-height: 7rem;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 2rem;
    font-size: .75rem;
  }
  .footer-inner p { margin: 0; }

  @media (max-width: 70rem) {
    .hero { grid-template-columns: 1fr; }
    .hero-copy { min-height: 43rem; padding-inline: max(1.5rem, calc((100vw - var(--max)) / 2)); }
    .compact-protocol {
      display: block;
      margin-top: 2rem;
      border: 1px solid var(--line-strong);
      background: var(--paper);
    }
    .compact-protocol header { display: flex; justify-content: space-between; gap: 1rem; padding: .7rem .85rem; border-bottom: 1px solid var(--line); font-size: .64rem; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; }
    .compact-protocol header strong { color: var(--ink); }
    .compact-protocol header span { color: var(--muted); }
    .compact-protocol ol { display: grid; grid-template-columns: repeat(5, 1fr); margin: 0; padding: 0; list-style: none; }
    .compact-protocol li { position: relative; min-width: 0; padding: .8rem .35rem; border-right: 1px solid var(--line); color: var(--muted); font-size: .62rem; font-weight: 800; text-align: center; text-transform: uppercase; }
    .compact-protocol li:last-child { border-right: 0; }
    .compact-protocol li.active { color: white; background: var(--cobalt); }
    .compact-protocol footer { display: flex; justify-content: space-between; gap: 1rem; padding: .65rem .85rem; border-top: 1px solid var(--line); color: var(--muted); font-size: .68rem; }
    .compact-protocol footer strong { color: var(--cobalt); }
    .section-heading { grid-template-columns: 1fr; }
    .section-heading > div { grid-column: auto; }
    .protocol-preview { min-height: 42rem; }
    .section-heading { grid-template-columns: 1fr; }
    .condition-row { grid-template-columns: minmax(10rem, .8fr) auto; }
    .condition-row p { grid-column: 1 / -1; padding-left: 1.3rem; }
    .use-case { grid-template-columns: 3rem .8fr 1fr; gap: 1.2rem; }
  }

  @media (max-width: 48rem) {
    html { scroll-behavior: auto; }
    .header-inner { width: min(100% - 2rem, var(--max)); grid-template-columns: 1fr auto; }
    .site-nav { display: none; }
    .hero-copy { min-height: calc(100svh - 4.75rem); justify-content: flex-start; gap: 1.25rem; padding: 2rem 1rem; }
    .hero-copy h1 { font-size: clamp(3.1rem, 14.5vw, 5rem); }
    .compact-protocol { margin-top: .25rem; }
    .compact-protocol header { padding: .55rem .65rem; }
    .compact-protocol li { min-height: 2.75rem; display: flex; align-items: center; justify-content: center; padding: .55rem .2rem; font-size: .55rem; }
    .compact-protocol footer { padding: .5rem .65rem; font-size: .62rem; }
    .hero-deck { margin-top: .25rem; padding-top: 1rem; }
    .hero-deck > p { font-size: 1rem; }
    .hero-actions { margin-top: 1rem; }
    .hero-actions .button { width: 100%; }
    .protocol-preview { min-height: auto; padding: 3rem 1rem; }
    .protocol-preview h2 { font-size: clamp(2.7rem, 12vw, 4.2rem); }
    .preview-facts, .truth-tape { grid-template-columns: 1fr; }
    .preview-facts div, .truth-tape div { border-right: 0; border-bottom: 1px solid var(--line); }
    .preview-facts div { border-bottom-color: #29435e; }
    .preview-facts div:last-child, .truth-tape div:last-child { border-bottom: 0; }
    .truth-tape div { min-height: auto; padding: 1.25rem 1rem; }
    .section-shell { width: min(100% - 2rem, var(--max)); }
    .showpiece-tabs { grid-template-columns: repeat(5, minmax(0, 1fr)); }
    .stage-tab { min-height: 4rem; padding: .6rem .2rem; border-right: 1px solid var(--line); text-align: center; }
    .stage-tab:last-child { border-right: 0; }
    .stage-tab strong { margin-top: .3rem; font-size: .62rem; }
    .stage-heading { grid-template-columns: 1fr; }
    .stage-index { font-size: 4.5rem; }
    .metric-strip, .condition-sheet, .evidence-grid, .recorded-decision, .trust-grid, .final-cta .section-shell { grid-template-columns: 1fr; }
    .metric, .condition-intro, .evidence-list + .evidence-list, .trust-column + .trust-column { border-right: 0; border-left: 0; border-bottom: 1px solid var(--line); }
    .metric:last-child, .trust-column:last-child { border-bottom: 0; }
    .condition-intro { border-bottom-color: #29435e; }
    .condition-row { grid-template-columns: 1fr; gap: .5rem; }
    .condition-row p { grid-column: auto; padding-left: 1.3rem; }
    .recorded-decision dl { grid-template-columns: 1fr; gap: 1rem; }
    .anatomy-grid { grid-template-columns: 1fr; }
    .anatomy-step { min-height: auto; border-right: 0; border-bottom: 1px solid #29435e; }
    .anatomy-step h3 { margin-top: 2.5rem; }
    .use-case { grid-template-columns: 2.5rem 1fr; padding: 1.5rem 0; }
    .use-case p { grid-column: 2 / -1; }
    .final-cta .button { width: 100%; }
    .footer-inner { min-height: 9rem; flex-direction: column; align-items: flex-start; justify-content: center; }
  }

  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { scroll-behavior: auto !important; animation-duration: .01ms !important; animation-iteration-count: 1 !important; transition-duration: .01ms !important; }
    .landing-has-js .trace-line { stroke-dashoffset: 0; }
  }
</style>
</head>
<body>
<!--
THESIS: The prediction is not the decision; this surface refuses the generic forecast dashboard and makes the review protocol the spectacle.
OWN-WORLD: Pale stone, deep ink, cobalt action, acid-lime verified evidence, sharp registration rules, and editorial Manrope extend the decision review bench.
STORY: A prediction practitioner watches a fictional protocol move from calm precommitment through convergence, challenge, and a recorded deferral, then opens the real workspace.
FIRST VIEWPORT: A near-full-height split pairs a six-to-eight-rem thesis with a deep-ink live protocol trace; the primary evidence action sits below the thesis and the workspace action stays in the header.
FORM: Evidence Theater, the approved lead direction, extending direction seed de857c1a.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
-->
<a class="skip-link" href="#main-content">Skip to content</a>
<header class="site-header">
  <div class="header-inner">
    <a class="brand" href="/" aria-label="Decision Covenant home"><span class="brand-mark" aria-hidden="true"></span>Decision Covenant</a>
    <nav class="site-nav" aria-label="Landing page"><a href="#aurora">Aurora case</a><a href="#anatomy">Method</a><a href="#scope">Use cases</a></nav>
    <a class="button header-action" href="/workspace">Open the workspace</a>
  </div>
</header>
<main id="main-content">
  <section class="hero" aria-labelledby="hero-heading">
    <div class="hero-copy">
      <h1 id="hero-heading">The prediction is <span>not the decision.</span></h1>
      <section class="compact-protocol" aria-label="Fictional Aurora protocol summary">
        <header><strong>Fictional scenario</strong><span>Aurora protocol</span></header>
        <ol><li>Write</li><li>Observe</li><li>Confirm</li><li class="active">Review</li><li>Record</li></ol>
        <footer><span><strong>Deterministic</strong> review invocation</span><span>Human disposition</span></footer>
      </section>
      <div class="hero-deck">
        <p>Build the review protocol around uncertain evidence before the forecast gets loud. Then preserve what was known, challenged, and decided.</p>
        <div class="hero-actions">
          <a class="button secondary" href="#aurora">Explore the evidence</a>
          <a class="button" href="/workspace">Open the workspace</a>
        </div>
      </div>
    </div>
    <aside class="protocol-preview" aria-label="Aurora protocol preview">
      <div>
        <div class="preview-meta"><span class="fictional-tag">Fictional scenario</span><span>Protocol 01 / Aurora</span></div>
        <h2>Evidence can escalate. Action does not.</h2>
        <p>A deterministic condition trace shows how two observations invoke a review while incomplete evidence stays visibly unavailable.</p>
      </div>
      <svg class="trace" viewBox="0 0 620 240" role="img" aria-labelledby="trace-title trace-desc">
        <title id="trace-title">Aurora deterministic condition trace</title>
        <desc id="trace-desc">A non-predictive sequence from precommitment through two observations to a review and recorded deferral.</desc>
        <path class="trace-grid" d="M30 48H590M30 120H590M30 192H590M70 24V216M190 24V216M310 24V216M430 24V216M550 24V216"/>
        <path class="trace-line" d="M70 174L190 153L310 112L430 67L550 128"/>
        <circle class="trace-node" cx="70" cy="174" r="8"/><circle class="trace-node" cx="190" cy="153" r="8"/><circle class="trace-node" cx="310" cy="112" r="8"/>
        <rect class="trace-alert" x="420" y="57" width="20" height="20"/><circle class="trace-node" cx="550" cy="128" r="8"/>
        <text x="48" y="232">WRITE</text><text x="162" y="232">OBSERVE</text><text x="278" y="232">CONFIRM</text><text x="403" y="232">REVIEW</text><text x="526" y="232">RECORD</text>
      </svg>
      <dl class="preview-facts">
        <div><dt>Input</dt><dd>Saved observations</dd></div>
        <div><dt>Condition</dt><dd class="verified">Deterministic</dd></div>
        <div><dt>Disposition</dt><dd>Human-authored</dd></div>
      </dl>
    </aside>
  </section>

  <section class="truth-tape" aria-label="Product facts">
    <div><strong>7</strong><span>condition types</span></div>
    <div><strong>12</strong><span>fictional lifecycles</span></div>
    <div><strong>0</strong><span>runtime model calls</span></div>
    <div><strong>1</strong><span>local SQLite record</span></div>
  </section>

  <section class="showpiece" id="aurora" aria-labelledby="aurora-heading">
    <div class="section-shell">
      <header class="section-heading">
        <div>
          <h2 id="aurora-heading">${escapeHtml(AURORA_SHOWPIECE.title)}</h2>
          <p>${escapeHtml(AURORA_SHOWPIECE.subtitle)} Every number below illustrates review mechanics, not a live forecast, return, or recommendation.</p>
        </div>
      </header>
      <div class="showpiece-tabs" role="tablist" aria-label="Aurora evidence stages">${stageTabs}</div>
      <div class="showpiece-panels">${stages}</div>
    </div>
  </section>

  <section class="anatomy" id="anatomy" aria-labelledby="anatomy-heading">
    <div class="section-shell">
      <header class="section-heading">
        <div><h2 id="anatomy-heading">A defensible decision has anatomy.</h2><p>The product keeps policy, evidence, review conditions, and human judgment connected without pretending they are the same thing.</p></div>
      </header>
      <div class="anatomy-grid">
        <article class="anatomy-step"><span>01 / PRECOMMIT</span><h3>Write while calm.</h3><p>State the purpose, boundary, candidate responses, and falsifiers before any condition is active.</p></article>
        <article class="anatomy-step"><span>02 / OBSERVE</span><h3>Preserve the unknown.</h3><p>Save comparable evidence and keep missing inputs unavailable instead of quietly translating them into safety.</p></article>
        <article class="anatomy-step"><span>03 / INVOKE</span><h3>Conditions call review.</h3><p>Versioned deterministic rules explain why attention escalated. They do not choose an action.</p></article>
        <article class="anatomy-step"><span>04 / RECORD</span><h3>Judgment leaves a trace.</h3><p>Store the human disposition, rationale, contrary evidence, follow-up, and cooldown as one review packet.</p></article>
      </div>
    </div>
  </section>

  <section class="use-cases" id="scope" aria-labelledby="scope-heading">
    <div class="section-shell">
      <header class="section-heading">
        <div><h2 id="scope-heading">Four ways to practice the method.</h2><p>Start with one of twelve fictional examples, inspect the complete lifecycle, then copy only the policy fields you want to customize.</p></div>
      </header>
      <div class="use-case-list">
        <a class="use-case" href="/workspace#examples"><span>01</span><h3>AI or thematic exposure</h3><p>Review a thesis when classified exposure crosses written boundaries while some holdings remain unknown.</p></a>
        <a class="use-case" href="/workspace#examples"><span>02</span><h3>Employer or single-stock concentration</h3><p>Separate vesting accumulation, whole-portfolio concentration, and the evidence needed before a review.</p></a>
        <a class="use-case" href="/workspace#examples"><span>03</span><h3>Drawdown or volatility</h3><p>Distinguish a real decline from stale prices, account-scope drift, or insufficient comparable history.</p></a>
        <a class="use-case" href="/workspace#examples"><span>04</span><h3>Scheduled policy review</h3><p>Revisit a policy on a calendar without manufacturing urgency or waiting for a dramatic signal.</p></a>
      </div>
    </div>
  </section>

  <section class="trust" aria-labelledby="trust-heading">
    <div class="section-shell">
      <header class="section-heading">
        <div><h2 id="trust-heading">Clear product. Clear boundary.</h2><p>A local policy and evidence workspace should be explicit about what it records—and what remains outside the system.</p></div>
      </header>
      <div class="trust-grid">
        <section class="trust-column"><h3>What it did</h3><ul>${did}</ul></section>
        <section class="trust-column did-not"><h3>What it did not do</h3><ul>${didNot}</ul></section>
      </div>
      <p class="trust-footnote">Local SQLite is the default record. Calculations are deterministic and versioned. Accepted records and chained audit events are exportable as JSON or Markdown. This is not an investment adviser, brokerage, compliance certification, or claim of tamper-proof storage.</p>
    </div>
  </section>

  <section class="final-cta" aria-labelledby="cta-heading">
    <div class="section-shell">
      <div><h2 id="cta-heading">Make the process inspectable.</h2><p>Explore the twelve fictional lifecycles, copy a useful structure, and adapt the policy in your own local workspace.</p></div>
      <a class="button" href="/workspace">Open the workspace</a>
    </div>
  </section>
</main>
<footer class="site-footer">
  <div class="footer-inner"><p><strong>Decision Covenant</strong> · Local policy and evidence workspace.</p><p>No prediction, recommendation, or trade execution.</p></div>
</footer>
<script>
  (() => {
    document.documentElement.classList.add("landing-has-js");
    const tabs = [...document.querySelectorAll("[data-showpiece-tab]")];
    const panels = [...document.querySelectorAll("[data-showpiece-stage]")];

    function selectStage(stageId, focusPanel = false) {
      tabs.forEach((tab) => {
        const selected = tab.dataset.showpieceTab === stageId;
        tab.classList.toggle("is-selected", selected);
        tab.setAttribute("aria-selected", String(selected));
        tab.tabIndex = selected ? 0 : -1;
      });
      panels.forEach((panel) => {
        panel.classList.toggle("is-active", panel.dataset.showpieceStage === stageId);
      });
      if (focusPanel) {
        panels.find((panel) => panel.dataset.showpieceStage === stageId)?.focus({ preventScroll: true });
      }
    }

    tabs.forEach((tab, index) => {
      tab.addEventListener("click", () => selectStage(tab.dataset.showpieceTab));
      tab.addEventListener("keydown", (event) => {
        let target = index;
        if (event.key === "ArrowRight" || event.key === "ArrowDown") target = (index + 1) % tabs.length;
        else if (event.key === "ArrowLeft" || event.key === "ArrowUp") target = (index - 1 + tabs.length) % tabs.length;
        else if (event.key === "Home") target = 0;
        else if (event.key === "End") target = tabs.length - 1;
        else return;
        event.preventDefault();
        tabs[target].focus();
        selectStage(tabs[target].dataset.showpieceTab);
      });
    });

    selectStage(tabs[0]?.dataset.showpieceTab);
  })();
</script>
</body>
</html>`;
}
