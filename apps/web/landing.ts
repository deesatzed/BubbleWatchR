import { AURORA_SHOWPIECE } from "../../packages/examples/index.js";

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function landingPage(): string {
  const stages = AURORA_SHOWPIECE.stages.map((stage) => `<article data-showpiece-stage="${escapeHtml(stage.id)}">
    <p>${escapeHtml(stage.step)} · ${escapeHtml(stage.eyebrow)}</p>
    <h3>${escapeHtml(stage.headline)}</h3>
    <p>${escapeHtml(stage.narrative)}</p>
  </article>`).join("\n");
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Decision Covenant — The prediction is not the decision</title>
<style>
  @font-face { font-family: "Decision Sans"; src: url("/assets/fonts/manrope-variable.ttf") format("truetype"); font-style: normal; font-weight: 200 800; font-display: swap; }
  :root { font-family: "Decision Sans", "Helvetica Neue", Arial, sans-serif; color: #0a1b2e; background: #f2f0eb; }
  body { margin: 0; } header, main, footer { padding: 1.25rem; } a { color: #0a50d8; }
</style></head><body>
<header><a href="/" aria-label="Decision Covenant home">Decision Covenant</a><a href="/workspace">Open the workspace</a></header>
<main id="main-content">
  <section><p>Prediction discipline for consequential decisions</p><h1>The prediction is not the decision.</h1><p>Build the protocol before the forecast gets loud.</p><a href="#aurora">Explore the evidence</a></section>
  <section id="aurora" aria-labelledby="aurora-heading"><p>Fictional scenario</p><h2 id="aurora-heading">${escapeHtml(AURORA_SHOWPIECE.title)}</h2><p>${escapeHtml(AURORA_SHOWPIECE.subtitle)}</p>${stages}</section>
  <section><h2>Anatomy of a defensible decision</h2><p>Precommit. Observe. Challenge. Record.</p></section>
  <section><h2>Use the complete decision workspace</h2><a href="/workspace">Open the workspace</a></section>
</main>
<footer><p>Local policy and evidence workspace. No forecast, recommendation, or trade execution.</p></footer>
</body></html>`;
}
