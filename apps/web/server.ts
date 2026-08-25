import { readFileSync } from "node:fs";
import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import { URL } from "node:url";
import { closeDatabase, listAuditEvents, openDatabase } from "../../packages/audit/store.js";
import { buildCalculationBundle } from "../../packages/calculations/bundle.js";
import {
  approveDraft,
  auditForCovenant,
  createDraft,
  createSuccessorDraft,
  getCovenant,
  listCovenants,
} from "../../packages/domain/lifecycle.js";
import type { Covenant } from "../../packages/domain/types.js";
import { EXAMPLE_PACKS } from "../../packages/examples/index.js";
import type { CovenantExample } from "../../packages/examples/types.js";
import { buildExport, buildReviewExport, buildTriggerExport, toCalculationCollectionJson, toCalculationCollectionMarkdown, toCalculationJson, toCalculationMarkdown, toJson, toMarkdown, toReviewJson, toReviewMarkdown, toTriggerJson, toTriggerMarkdown } from "../../packages/export/serializers.js";
import { completeStructuredReview, getStructuredReview, listStructuredReviews, openStructuredReview, updateStructuredReview } from "../../packages/reviews/store.js";
import type { ReviewCompletionInput, ReviewDraft } from "../../packages/reviews/types.js";
import { createSnapshot, getSnapshot, importCsv, listSnapshots } from "../../packages/snapshots/store.js";
import type { PortfolioSnapshot } from "../../packages/snapshots/types.js";
import { zonedLocalDateTimeToIso } from "../../packages/triggers/presentation.js";
import { acknowledgeTrigger, completeTriggerReview, createTriggerDefinitions, evaluateAndPersistTriggers, getTriggerState, listTriggerDefinitions, listTriggerEvaluations } from "../../packages/triggers/store.js";
import type { TriggerDefinitionInput } from "../../packages/triggers/types.js";
import { projectWorkspaceSummary, type WorkspaceSummary } from "../../packages/workspace/summary.js";

const manropeFont = readFileSync(new URL("../../../assets/fonts/Manrope-Variable.ttf", import.meta.url));

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function send(response: ServerResponse, status: number, body: string, contentType = "text/html; charset=utf-8"): void {
  response.writeHead(status, { "content-type": contentType, "cache-control": "no-store" });
  response.end(body);
}

function sendJson(response: ServerResponse, status: number, body: unknown): void {
  send(response, status, JSON.stringify(body), "application/json; charset=utf-8");
}

function sendFont(response: ServerResponse): void {
  response.writeHead(200, { "content-type": "font/ttf", "cache-control": "public, max-age=31536000, immutable" });
  response.end(manropeFont);
}

function safeJson(value: unknown): string {
  return JSON.stringify(value)
    .replaceAll("<", "\\u003c")
    .replaceAll(">", "\\u003e")
    .replaceAll("&", "\\u0026")
    .replaceAll("\u2028", "\\u2028")
    .replaceAll("\u2029", "\\u2029");
}

async function readJson(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) chunks.push(Buffer.from(chunk));
  if (chunks.length === 0) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8")) as unknown;
}

function normalizePresentedTriggerDefinitions(definitions: unknown[]): unknown[] {
  return definitions.map((value) => {
    if (!value || typeof value !== "object" || Array.isArray(value)) return value;
    const definition = value as Record<string, unknown>;
    if (definition.type !== "scheduled_review" || !definition.settings || typeof definition.settings !== "object" || Array.isArray(definition.settings)) return value;
    const settings = definition.settings as Record<string, unknown>;
    if (typeof settings.scheduledLocal !== "string" || typeof settings.timezone !== "string") return value;
    const { scheduledLocal, ...rest } = settings;
    return { ...definition, settings: { ...rest, scheduledAt: zonedLocalDateTimeToIso(scheduledLocal, settings.timezone) } };
  });
}

function covenantInput(covenant: Covenant): Record<string, unknown> {
  return {
    name: covenant.name,
    purpose: covenant.purpose,
    coveredExposure: covenant.coveredExposure,
    objective: covenant.objective,
    timeHorizon: covenant.timeHorizon,
    maximumIntendedConcentration: covenant.maximumIntendedConcentration,
    maximumTolerableDrawdown: covenant.maximumTolerableDrawdown,
    reviewRules: covenant.reviewRules,
    candidateActions: covenant.candidateActions,
    falsifiers: covenant.falsifiers,
    deescalationConditions: covenant.deescalationConditions,
    reentryConditions: covenant.reentryConditions,
    cooldownPolicy: covenant.cooldownPolicy,
    notes: covenant.notes,
  };
}

function snapshotCard(snapshot: PortfolioSnapshot, series: PortfolioSnapshot[]): string {
  try {
    const bundle = buildCalculationBundle(snapshot, series);
    const unknown = bundle.calculation.aiExposure.unknownPositionKeys.join(", ") || "None";
    const drift = bundle.concentrationDrift ? `Compared with ${escapeHtml(bundle.concentrationDrift.priorSnapshotId)}.` : "No prior snapshot selected.";
    return `<article class="card snapshot-card" data-snapshot-id="${escapeHtml(snapshot.id)}">
      <h3>${escapeHtml(snapshot.portfolioName)} — ${escapeHtml(snapshot.asOf)}</h3>
      <p><strong>Total value:</strong> ${bundle.calculation.totalPortfolioValue.toFixed(2)} · <strong>Source:</strong> ${escapeHtml(snapshot.sourceReference ?? snapshot.source)}</p>
      <p><strong>AI exposure:</strong> ${bundle.calculation.aiExposure.status === "complete" ? `${(bundle.calculation.aiExposure.value! * 100).toFixed(2)}%` : "Unknown / incomplete"}</p>
      <p class="meta"><strong>Unknown classifications:</strong> ${escapeHtml(unknown)} · <strong>Observed drawdown:</strong> ${(bundle.drawdown.drawdown * 100).toFixed(2)}%</p>
      <p class="meta">${drift} Calculation version ${escapeHtml(bundle.calculationVersion)}.</p>
      <a href="/api/snapshots/${escapeHtml(snapshot.id)}/export.md">Export calculations Markdown</a>
      <a href="/api/snapshots/${escapeHtml(snapshot.id)}/export.json">Export calculations JSON</a>
      <details><summary>Position calculations</summary><pre>${escapeHtml(JSON.stringify(bundle.calculation.positions, null, 2))}</pre></details>
    </article>`;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Calculation unavailable";
    return `<article class="card snapshot-card" data-snapshot-id="${escapeHtml(snapshot.id)}"><h3>${escapeHtml(snapshot.portfolioName)} — ${escapeHtml(snapshot.asOf)}</h3><p role="alert">Calculation unavailable: ${escapeHtml(message)}</p></article>`;
  }
}

function triggerAuditForCovenant(db: ReturnType<typeof openDatabase>, covenantId: string): ReturnType<typeof listAuditEvents> {
  const definitions = listTriggerDefinitions(db, covenantId);
  const ids = new Set(definitions.map((definition) => definition.id));
  return listAuditEvents(db).filter((event) => ids.has(event.entityId) || (event.payload as { covenantId?: string }).covenantId === covenantId);
}

function triggerSection(db: ReturnType<typeof openDatabase>, covenant: Covenant): string {
  if (covenant.status !== "approved") return "";
  const definitions = listTriggerDefinitions(db, covenant.id);
  if (definitions.length === 0) {
    const conditionSpecs = [
      { type: "ai_exposure", label: "AI or theme exposure", help: "Uses the user-authored AI exposure classification across a complete saved observation.", entry: 40, exit: 35 },
      { type: "single_position_concentration", label: "Single-position concentration", help: "Tracks the largest observed position weight across the saved portfolio.", entry: 25, exit: 22 },
      { type: "trailing_drawdown", label: "Observed drawdown", help: "Uses arithmetic from the selected saved reference high; cash flows are not modeled.", entry: 20, exit: 15 },
      { type: "trailing_volatility", label: "Observed volatility", help: "Uses sample variability from regularly spaced saved observations.", entry: 22, exit: 18 },
      { type: "appreciation_concentration", label: "Appreciation-led concentration", help: "Separates price-led concentration change from new quantity.", entry: 8, exit: 5 },
      { type: "scheduled_review", label: "Scheduled policy review", help: "Creates a calendar review even when no numeric condition is active.", entry: null, exit: null },
      { type: "overdue_review", label: "Overdue review", help: "Shows when the written review interval has elapsed.", entry: null, exit: null },
    ] as const;
    const controls = conditionSpecs.map((spec) => {
      const prefix = `condition-${escapeHtml(covenant.id)}-${spec.type}`;
      const numeric = spec.entry === null ? "" : `<div class="condition-numbers"><label for="${prefix}-entry">Enter review at (%)<input id="${prefix}-entry" data-config-field="entryPercent" type="number" min="0" max="100" step="1" value="${spec.entry}"></label><label for="${prefix}-exit">Clear below (%)<input id="${prefix}-exit" data-config-field="exitPercent" type="number" min="0" max="100" step="1" value="${spec.exit}"></label></div>`;
      const settings = spec.type === "trailing_volatility"
        ? `<div class="condition-numbers"><label for="${prefix}-lookback">Lookback observations<input id="${prefix}-lookback" data-config-field="lookbackObservations" type="number" min="2" step="1" value="4"></label><label for="${prefix}-annual">Annualization factor<input id="${prefix}-annual" data-config-field="annualizationFactor" type="number" min="1" step="1" value="12"></label><label for="${prefix}-interval">Required interval (days)<input id="${prefix}-interval" data-config-field="returnIntervalDays" type="number" min="1" step="1" value="30"></label></div>`
        : spec.type === "appreciation_concentration"
          ? `<div class="condition-numbers"><label for="${prefix}-change">Minimum concentration change (%)<input id="${prefix}-change" data-config-field="minimumConcentrationChangePercent" type="number" min="0" max="100" value="5"></label><label for="${prefix}-contribution">Minimum appreciation contribution (%)<input id="${prefix}-contribution" data-config-field="minimumAppreciationContributionPercent" type="number" min="0" max="100" value="5"></label></div>`
          : spec.type === "scheduled_review"
            ? `<div class="condition-numbers"><label for="${prefix}-scheduled">Review date and time<input id="${prefix}-scheduled" data-config-field="scheduledAt" type="datetime-local" value="2026-10-01T10:00"></label><label for="${prefix}-timezone">Timezone<input id="${prefix}-timezone" data-config-field="timezone" value="America/New_York"></label></div>`
            : spec.type === "overdue_review"
              ? `<div class="condition-numbers"><label for="${prefix}-interval-days">Review interval (days)<input id="${prefix}-interval-days" data-config-field="reviewIntervalDays" type="number" min="1" value="120"></label><label for="${prefix}-timezone">Timezone<input id="${prefix}-timezone" data-config-field="timezone" value="America/New_York"></label><label for="${prefix}-clock">Review clock<select id="${prefix}-clock" data-config-field="reviewClock"><option value="last_review">Last completed review</option><option value="approval">Covenant approval</option></select></label></div>`
              : "";
      return `<fieldset class="condition-config" data-condition-config="${spec.type}"><legend>${escapeHtml(spec.label)}</legend><p>${escapeHtml(spec.help)}</p>
        <label class="condition-enable"><input data-config-field="enabled" type="checkbox" checked> Enabled</label>${numeric}${settings}
        <div class="condition-numbers"><label for="${prefix}-persistence">Confirming observations<input id="${prefix}-persistence" data-config-field="persistenceObservations" type="number" min="1" step="1" value="${spec.entry === null ? 1 : 2}"></label><label for="${prefix}-clearing">Clearing observations<input id="${prefix}-clearing" data-config-field="clearingPersistenceObservations" type="number" min="1" step="1" value="${spec.entry === null ? 1 : 2}"></label><label for="${prefix}-cooldown">Cooldown (days)<input id="${prefix}-cooldown" data-config-field="cooldownDays" type="number" min="0" step="1" value="14"></label></div>
        <label for="${prefix}-missing">When data is missing<select id="${prefix}-missing" data-config-field="missingDataPolicy"><option value="hold_prior_state">Keep prior state; show unavailable</option><option value="unavailable">Show unavailable</option><option value="require_manual_review">Require manual data-quality review</option></select></label>
        <label for="${prefix}-instructions">What to inspect<textarea id="${prefix}-instructions" data-config-field="reviewInstructions">Inspect the saved observation, verify data quality, and apply only the written covenant.</textarea></label>
      </fieldset>`;
    }).join("\n");
    return `<form data-trigger-form data-covenant-id="${escapeHtml(covenant.id)}">
      <h3>Define review conditions</h3><p>Start with human-readable controls. A condition opens a review; it never instructs a trade.</p>
      <div class="condition-builder">${controls}</div>
      <details class="advanced-tools"><summary>Advanced: trigger definitions JSON</summary><label for="trigger-definitions-${escapeHtml(covenant.id)}">Trigger definitions as JSON</label><textarea id="trigger-definitions-${escapeHtml(covenant.id)}">[]</textarea></details>
      <button type="submit">Save trigger definitions</button>
    </form>`;
  }
  const rows = definitions.map((definition) => {
    const state = getTriggerState(db, definition.id);
    const last = listTriggerEvaluations(db, definition.id).at(-1);
    const status = last?.metric.status === "unavailable" ? `unavailable: ${String(last.metric.details.reason ?? "data unavailable")}` : last ? `${last.metric.status}: ${last.metric.observedValue ?? "Unknown"}` : "not evaluated";
    const reviewButton = state.state === "review" || state.state === "escalated_review" ? `<button data-action="acknowledge-trigger" data-id="${escapeHtml(definition.id)}">Acknowledge trigger</button><button data-action="complete-trigger-review" data-id="${escapeHtml(definition.id)}">Complete minimal review</button>` : "";
    return `<li data-trigger-id="${escapeHtml(definition.id)}"><strong>${escapeHtml(definition.type)}</strong> — ${escapeHtml(state.state)} — ${escapeHtml(status)} ${reviewButton}</li>`;
  }).join("\n");
  return `<section class="trigger-panel" data-trigger-panel="${escapeHtml(covenant.id)}">
    <h3>Seven trigger state</h3>
    <p>${definitions.length} trigger definitions saved. States are descriptive review conditions, not forecasts or actions.</p>
    <ul>${rows}</ul>
    <button data-action="evaluate-triggers" data-id="${escapeHtml(covenant.id)}">Evaluate all triggers</button>
    <a href="/api/covenants/${escapeHtml(covenant.id)}/triggers/export.md">Export trigger Markdown</a>
    <a href="/api/covenants/${escapeHtml(covenant.id)}/triggers/export.json">Export trigger JSON</a>
  </section>`;
}

function reviewSection(db: ReturnType<typeof openDatabase>, covenant: Covenant): string {
  if (covenant.status !== "approved") return "";
  const definitions = listTriggerDefinitions(db, covenant.id);
  const active = definitions.filter((definition) => {
    const state = getTriggerState(db, definition.id).state;
    return state === "review" || state === "escalated_review";
  });
  const reviews = listStructuredReviews(db, covenant.id);
  const openReviews = reviews.filter((review) => review.status === "open");
  const openButton = active.length && !openReviews.some((review) => review.triggerIds.some((id) => active.some((definition) => definition.id === id)))
    ? `<button data-action="open-structured-review" data-id="${escapeHtml(covenant.id)}" data-trigger-ids="${escapeHtml(JSON.stringify(active.map((definition) => definition.id)))}">Open structured review for active conditions</button>`
    : "";
  const forms = openReviews.map((review) => {
    const factsId = `review-facts-${review.id}`;
    const falsifierId = `review-falsifier-${review.id}`;
    const decisionId = `review-decision-${review.id}`;
    const rationaleId = `review-rationale-${review.id}`;
    const followUpId = `review-followup-${review.id}`;
    return `<form data-review-form data-id="${escapeHtml(review.id)}">
      <h4>Open structured review</h4>
      <p class="meta">Opened ${escapeHtml(review.openedAt)} for ${escapeHtml(review.triggerIds.join(", "))}.</p>
      <details><summary>Opening evidence and policy context</summary><pre>${escapeHtml(JSON.stringify(review.openingContext, null, 2))}</pre></details>
      <label for="${factsId}">What was observed?</label><textarea id="${factsId}" data-field="factualObservations" required>${escapeHtml(review.draft.factualObservations ?? "")}</textarea>
      <label for="${falsifierId}">What falsifier or data-quality concern did you check?</label><textarea id="${falsifierId}" data-field="falsifierCheck" required>${escapeHtml(review.draft.falsifierCheck ?? "")}</textarea>
      <label for="${decisionId}">Decision</label><select id="${decisionId}" data-field="decision"><option value="continue_policy"${review.draft.decision === "continue_policy" ? " selected" : ""}>Continue policy</option><option value="deescalate"${review.draft.decision === "deescalate" ? " selected" : ""}>De-escalate</option><option value="defer_review"${review.draft.decision === "defer_review" ? " selected" : ""}>Defer review</option><option value="create_successor"${review.draft.decision === "create_successor" ? " selected" : ""}>Create successor</option></select>
      <label for="${rationaleId}">Why?</label><textarea id="${rationaleId}" data-field="rationale" required>${escapeHtml(review.draft.rationale ?? "")}</textarea>
      <label for="${followUpId}">Optional follow-up time</label><input id="${followUpId}" data-field="followUpAt" type="datetime-local" value="${escapeHtml(review.draft.followUpAt ?? "")}">
      <button type="submit">Complete structured review</button>
    </form>`;
  }).join("\n");
  const history = reviews.filter((review) => review.status === "completed").map((review) => `<li>Completed ${escapeHtml(review.completedAt ?? "unknown")} — ${escapeHtml(review.completion?.decision ?? "unknown")} — <a href="/api/reviews/${escapeHtml(review.id)}/export.md">Export review Markdown</a> <a href="/api/reviews/${escapeHtml(review.id)}/export.json">JSON</a></li>`).join("\n");
  return `<section class="review-panel" data-review-panel="${escapeHtml(covenant.id)}">
    <h3>Structured reviews</h3>
    <p>Review packets record your observations and policy decision. They do not recommend or execute trades.</p>
    ${openButton || (active.length ? "<p>No new review opened; an active review is already open.</p>" : "<p>No active trigger condition is currently open for structured review.</p>")}
    ${forms}
    <h4>Completed review history</h4><ul>${history || "<li>None recorded.</li>"}</ul>
  </section>`;
}

function stateLabel(value: string): string {
  return value.replaceAll("_", " ").replace(/^./, (letter) => letter.toUpperCase());
}

function exampleDetail(example: CovenantExample, selected: boolean): string {
  const observations = example.story.snapshots.map((snapshot) => `<tr>
    <td><time datetime="${escapeHtml(snapshot.asOf)}">${escapeHtml(snapshot.asOf)}</time></td>
    <td>${escapeHtml(snapshot.label)}</td>
    <td><span class="state-mark state-${escapeHtml(snapshot.conditionState)}">${escapeHtml(stateLabel(snapshot.conditionState))}</span></td>
    <td>${escapeHtml(snapshot.summary)}</td>
  </tr>`).join("\n");
  const stages = example.story.stages.map((stage, index) => `<li data-story-state="${escapeHtml(stage.state)}">
    <span class="stage-index" aria-hidden="true">${index + 1}</span>
    <div><h4>${escapeHtml(stage.title)}</h4><p>${escapeHtml(stage.body)}</p></div>
  </li>`).join("\n");
  return `<article class="example-inspector" data-example-panel="${escapeHtml(example.id)}" data-example-detail${selected ? "" : " hidden"}>
    <header class="inspector-header">
      <div><p class="demo-marker">Fictional walkthrough</p><h3>${escapeHtml(example.title)}</h3></div>
      <div class="inspector-tools">
        <button type="button" data-use-example="${escapeHtml(example.id)}">Use this example</button>
        <button class="quiet-button" type="button" data-reset-example>Reset example</button>
      </div>
    </header>
    <p class="inspector-philosophy">${escapeHtml(example.philosophy)}</p>
    <p>${escapeHtml(example.situation)}</p>
    <ul class="emphasis-list" aria-label="Example emphasis">${example.emphasis.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>

    <section class="inspector-section" aria-labelledby="lifecycle-${escapeHtml(example.id)}">
      <h4 id="lifecycle-${escapeHtml(example.id)}">Full lifecycle</h4>
      <ol class="lifecycle">${stages}</ol>
    </section>

    <details class="evidence-sheet">
      <summary>Inspect fictional observations</summary>
      <div class="table-scroll"><table><thead><tr><th>Date</th><th>Observation</th><th>State</th><th>What changed</th></tr></thead><tbody>${observations}</tbody></table></div>
    </details>

    <section class="review-record" aria-labelledby="review-${escapeHtml(example.id)}">
      <h4 id="review-${escapeHtml(example.id)}">Recorded review</h4>
      <dl>
        <div><dt>Observed</dt><dd>${escapeHtml(example.story.review.factualObservations)}</dd></div>
        <div><dt>Falsifier checked</dt><dd>${escapeHtml(example.story.review.falsifierCheck)}</dd></div>
        <div><dt>Decision</dt><dd>${escapeHtml(stateLabel(example.story.review.decision))}</dd></div>
        <div><dt>Rationale</dt><dd>${escapeHtml(example.story.review.rationale)}</dd></div>
      </dl>
    </section>

    <div class="fit-grid">
      <section><h4>Tradeoffs</h4><ul>${example.tradeoffs.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></section>
      <section><h4>May not fit</h4><ul>${example.notFor.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></section>
    </div>

    <footer class="inspector-action">
      <div><strong>Make it editable</strong><span>Only the covenant draft is copied. Fictional observations and reviews stay here.</span></div>
      <button type="button" data-use-example="${escapeHtml(example.id)}">Use as my starting point</button>
    </footer>
  </article>`;
}

function exampleLibrary(productState: "first-use" | "returning"): string {
  const examples = EXAMPLE_PACKS.flatMap((pack) => pack.examples);
  const firstPack = EXAMPLE_PACKS[0]!;
  const firstExample = firstPack.examples[0]!;
  const returning = productState === "returning";
  const packButtons = EXAMPLE_PACKS.map((pack, index) => `<button type="button" class="pack-button${index === 0 ? " is-selected" : ""}" aria-label="${escapeHtml(pack.title)}" aria-pressed="${index === 0 ? "true" : "false"}" data-example-pack="${escapeHtml(pack.id)}">
    <span>${escapeHtml(pack.title)}</span><small>${pack.examples.length} approaches</small>
  </button>`).join("\n");
  const exampleButtons = EXAMPLE_PACKS.flatMap((pack) => pack.examples.map((example, index) => `<button type="button" class="example-row${pack.id === firstPack.id && index === 0 ? " is-selected" : ""}" data-example-card data-pack-id="${escapeHtml(pack.id)}" data-example-id="${escapeHtml(example.id)}" aria-pressed="${pack.id === firstPack.id && index === 0 ? "true" : "false"}"${pack.id === firstPack.id ? "" : " hidden"}>
    <span class="example-name">${escapeHtml(example.title)}</span>
    <span class="example-philosophy">${escapeHtml(example.philosophy)}</span>
    <span class="example-open" aria-hidden="true">View</span>
  </button>`)).join("\n");
  const panels = examples.map((example) => exampleDetail(example, example.id === firstExample.id)).join("\n");
  return `<section id="examples" class="examples-section${returning ? " is-returning" : ""}" aria-labelledby="examples-heading">
    <div class="opening">
      <div>${returning ? `<h2 id="examples-heading">Explore another starting point.</h2><p>Examples remain available when you want to compare a different review posture.</p>` : `<h1 id="examples-heading">Make the decision process before the moment gets loud.</h1><p>Define what deserves review, which evidence matters, and how you will record the decision—without predicting a market move.</p>
      <div class="mobile-starting-point"><div><span class="demo-marker">Fictional starting point</span><strong>${escapeHtml(firstExample.title)}</strong></div><button type="button" data-use-example="${escapeHtml(firstExample.id)}">Use this example</button></div>`}</div>
      <div class="entry-actions" aria-label="Ways to begin">
        <a class="primary-action" href="#example-library">${returning ? "Browse examples" : "Explore examples"}</a>
        <button class="secondary-action" type="button" data-generation-toggle aria-expanded="false">Generate variants</button>
        <button class="text-action" type="button" data-start-blank>Start blank</button>
      </div>
    </div>
    <div class="provider-note" data-generation-panel hidden>
      <div><strong>Model generation is provider-ready, not simulated.</strong><p>Bundled variants work offline now. Local OpenAI-compatible and OpenRouter adapters require the separately approved provider goal before they can make model calls.</p></div>
      <span class="provider-state">Bundled examples active</span>
    </div>
    <div id="example-library" class="example-workbench">
      <div class="example-browser">
        <header><h2>Choose a starting point</h2><p>Four situations. Three distinct policy philosophies in each. All data below is fictional.</p></header>
        <div class="pack-selector" aria-label="Example packs">${packButtons}</div>
        <div class="example-list" aria-live="polite">${exampleButtons}</div>
        <p class="demo-footnote">Fictional demonstration only. Exploring or resetting an example never writes to your records.</p>
      </div>
      <div class="inspector-stack">${panels}</div>
    </div>
  </section>`;
}

function workspaceSummarySection(summary: WorkspaceSummary): string {
  const nextActions: Record<WorkspaceSummary["nextAction"], { label: string; href: string } | null> = {
    create_policy: { label: "Choose a starting point", href: "#examples" },
    approve_policy: { label: "Review the draft", href: "#history" },
    add_observation: { label: "Add an observation", href: "#snapshots" },
    review_condition: { label: "Open the review record", href: "#history" },
    none: null,
  };
  const action = nextActions[summary.nextAction];
  const conditionSummary = [
    `${summary.conditionCounts.review + summary.conditionCounts.escalated_review} active`,
    `${summary.conditionCounts.watch} watch`,
    `${summary.conditionCounts.unavailable} unavailable`,
    `${summary.conditionCounts.normal} normal`,
    `${summary.conditionCounts.cooldown} cooldown`,
  ].join(" · ");
  return `<section class="workstation-summary" data-workstation-summary aria-labelledby="workstation-heading">
    <div class="summary-lead"><h1 id="workstation-heading">Your decision record, at a glance.</h1><p>Current policy state and saved evidence only. Nothing here predicts a market move or performs an action.</p>${action ? `<a class="primary-action" href="${action.href}">${action.label}</a>` : ""}</div>
    <dl class="summary-grid">
      <div><dt>Policy</dt><dd>${escapeHtml(summary.policyStatus)}</dd></div>
      <div><dt>Latest observation</dt><dd>${escapeHtml(summary.latestObservationAt ?? "None saved")}</dd></div>
      <div><dt>Conditions</dt><dd>${escapeHtml(conditionSummary)}</dd></div>
      <div><dt>Open reviews</dt><dd>${summary.openReviewCount}</dd></div>
      <div><dt>Next scheduled review</dt><dd>${escapeHtml(summary.nextScheduledReviewAt ?? "None scheduled")}</dd></div>
    </dl>
  </section>`;
}

function page(db: ReturnType<typeof openDatabase>): string {
  const covenants = listCovenants(db);
  const snapshots = listSnapshots(db);
  const productState = covenants.length > 0 || snapshots.length > 0 ? "returning" : "first-use";
  const currentCovenant = covenants.at(-1) ?? null;
  const summaryConditions = (currentCovenant ? listTriggerDefinitions(db, currentCovenant.id) : []).filter((definition) => definition.enabled).map((definition) => {
    const last = listTriggerEvaluations(db, definition.id).at(-1);
    const scheduledAt = definition.type === "scheduled_review" && typeof definition.settings.scheduledAt === "string" ? definition.settings.scheduledAt : null;
    return {
      type: definition.type,
      state: getTriggerState(db, definition.id).state,
      availability: !last || last.metric.status === "unavailable" ? "unavailable" as const : "available" as const,
      scheduledAt,
    };
  });
  const workspaceSummary = projectWorkspaceSummary({
    policies: covenants,
    observations: snapshots,
    conditions: summaryConditions,
    openReviewCount: listStructuredReviews(db).filter((review) => review.status === "open").length,
    now: new Date().toISOString(),
  });
  const cards = covenants.map((covenant) => `
    <article class="card" data-covenant-id="${escapeHtml(covenant.id)}">
      <h2>${escapeHtml(covenant.name)}</h2>
      <p><strong>Version ${covenant.version}</strong> · ${escapeHtml(covenant.status)} · created ${escapeHtml(covenant.createdAt)}</p>
      <p>${escapeHtml(covenant.purpose)}</p>
      <p class="meta">Maximum concentration: ${escapeHtml(covenant.maximumIntendedConcentration)} · Maximum drawdown: ${escapeHtml(covenant.maximumTolerableDrawdown)}</p>
      <p>
        ${covenant.status === "draft" ? `<button data-action="approve" data-id="${escapeHtml(covenant.id)}">Approve and lock</button>` : ""}
        ${covenant.status === "approved" ? `<button data-action="successor" data-id="${escapeHtml(covenant.id)}">Create successor draft</button>` : ""}
        <a href="/api/covenants/${escapeHtml(covenant.id)}/export.md">Export Markdown</a>
        <a href="/api/covenants/${escapeHtml(covenant.id)}/export.json">Export JSON</a>
      </p>
      ${triggerSection(db, covenant)}
      ${reviewSection(db, covenant)}
      <details><summary>Audit history</summary><pre>${escapeHtml(JSON.stringify(auditForCovenant(db, covenant.id), null, 2))}</pre></details>
    </article>`).join("\n");
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Decision Covenant</title>
<style>
  @font-face { font-family: "Decision Sans"; src: url("/assets/fonts/manrope-variable.ttf") format("truetype"); font-style: normal; font-weight: 200 800; font-display: swap; }
  :root { color-scheme: light; font-family: "Decision Sans", "Helvetica Neue", Arial, sans-serif; line-height: 1.5; --ink: #0a1b2e; --ink-2: #17324d; --muted: #5b6572; --page: #f2f0eb; --surface: #fbfaf7; --surface-2: #ece9e2; --line: #d2cec5; --line-strong: #aaa59b; --primary: #0a50d8; --primary-dark: #083fa9; --primary-soft: #eaf0ff; --focus: #ffb000; --notice: #fff5d8; --danger: #a62b2b; --success: #177044; --warning: #9a6000; --radius: .25rem; --text-swap-dur: 180ms; --text-swap-translate-y: 4px; --text-swap-blur: 2px; --text-swap-ease: cubic-bezier(.2,.8,.2,1); }
  * { box-sizing: border-box; }
  [hidden] { display: none !important; }
  html { scroll-behavior: smooth; background: var(--page); }
  body { margin: 0; color: var(--ink); background: var(--page); font-size: 1rem; }
  ::selection { color: white; background: var(--primary); }
  * { scrollbar-color: var(--line-strong) var(--surface-2); }
  input, textarea { caret-color: var(--primary); }
  h1, h2, h3, h4 { margin-top: 0; line-height: 1.12; letter-spacing: -.02em; text-wrap: balance; }
  h1 { max-width: 17ch; margin-bottom: 1rem; font-size: 2.75rem; font-weight: 680; }
  h2 { font-size: 1.65rem; } h3 { font-size: 1.4rem; } h4 { font-size: 1rem; letter-spacing: -.01em; }
  p { max-width: 72ch; }
  a { color: var(--primary); text-decoration-thickness: 1px; text-underline-offset: .2em; }
  button, input, textarea, select { font: inherit; }
  button { min-height: 2.75rem; border: 1px solid var(--primary); border-radius: var(--radius); padding: .67rem .9rem; color: white; background: var(--primary); cursor: pointer; transition: background 180ms ease-out, border-color 180ms ease-out, transform 180ms ease-out; }
  button:hover { background: var(--primary-dark); border-color: var(--primary-dark); }
  button:active { transform: translateY(1px); }
  button[disabled] { cursor: wait; opacity: .58; }
  button:focus-visible, a:focus-visible, input:focus-visible, textarea:focus-visible, select:focus-visible, summary:focus-visible { outline: 3px solid var(--focus); outline-offset: 3px; }
  .skip-link { position: fixed; left: 1rem; top: 1rem; z-index: 20; transform: translateY(-180%); min-height: 2.75rem; padding: .7rem 1rem; color: white; background: var(--ink); }
  .skip-link:focus { transform: translateY(0); }
  .app-shell { min-height: 100vh; }
  .app-rail { color: #f7f9fb; background: var(--ink); }
  .brand { display: block; padding: 1.15rem 1.25rem .85rem; color: white; font-size: 1.25rem; font-weight: 700; line-height: 1.05; text-decoration: none; }
  .app-rail nav { display: flex; gap: .25rem; overflow-x: auto; padding: 0 .75rem .75rem; }
  .app-rail nav a { display: grid; min-width: max-content; min-height: 2.75rem; place-items: center; padding: .55rem .75rem; color: #cad5df; border-bottom: 2px solid transparent; text-decoration: none; }
  .app-rail nav a:hover, .app-rail nav a[aria-current="page"] { color: white; border-color: #5f8eff; background: #122a43; }
  .rail-note { display: none; }
  .workspace { min-width: 0; }
  .workspace-bar { display: flex; min-height: 3.75rem; align-items: center; justify-content: space-between; gap: 1rem; padding: .7rem 1rem; border-bottom: 1px solid var(--line); background: color-mix(in srgb, var(--surface) 92%, transparent); }
  .workspace-bar strong { font-size: .92rem; }
  .local-state { display: inline-flex; align-items: center; gap: .5rem; color: var(--muted); font-size: .84rem; }
  .local-state::before { width: .55rem; height: .55rem; border-radius: 50%; background: var(--success); content: ""; }
  .notice { margin: 0; padding: .7rem 1rem; color: #59420d; border-bottom: 1px solid #e4cf94; background: var(--notice); font-size: .9rem; }
  main { display: grid; gap: 0; }
  main > section { scroll-margin-top: 1rem; padding: 2rem 1rem; border-bottom: 1px solid var(--line); }
  .workstation-summary { display: grid; gap: 1.5rem; color: white; background: var(--ink); }
  .summary-lead h1 { margin-bottom: .7rem; color: white; }
  .summary-lead p { margin: 0 0 1.2rem; color: #bdc9d5; }
  .summary-grid { display: grid; gap: 0; margin: 0; border-top: 1px solid #38506a; }
  .summary-grid div { padding: .9rem 0; border-bottom: 1px solid #38506a; }
  .summary-grid dt { color: #93a8bb; font-size: .76rem; font-weight: 650; }
  .summary-grid dd { margin: .2rem 0 0; color: white; font-variant-numeric: tabular-nums; }
  .examples-section { padding-top: 2.25rem; }
  .opening { display: grid; gap: 1.5rem; align-items: end; max-width: 92rem; margin: 0 auto 2rem; }
  .opening h2 { max-width: 22ch; margin-bottom: .45rem; font-size: 2rem; }
  .opening > div > p { margin-bottom: 0; color: var(--muted); font-size: 1.08rem; }
  .mobile-starting-point { display: none; }
  .entry-actions { display: flex; flex-wrap: wrap; align-items: center; gap: .55rem; }
  .primary-action, .secondary-action, .text-action { min-height: 2.75rem; padding: .67rem .9rem; border-radius: var(--radius); }
  .primary-action { color: white; background: var(--primary); text-decoration: none; }
  .primary-action:hover { background: var(--primary-dark); }
  .secondary-action { color: var(--ink); border-color: var(--line-strong); background: var(--surface); }
  .secondary-action:hover { color: white; background: var(--ink-2); border-color: var(--ink-2); }
  .text-action { color: var(--primary); border-color: transparent; background: transparent; text-decoration: underline; text-underline-offset: .2em; }
  .text-action:hover { color: white; background: var(--ink-2); }
  .provider-note { display: flex; max-width: 92rem; align-items: center; justify-content: space-between; gap: 1rem; margin: -1rem auto 1.5rem; padding: 1rem; border-block: 1px solid var(--line); background: var(--surface-2); }
  .provider-note p { margin: .25rem 0 0; color: var(--muted); }
  .provider-state { flex: 0 0 auto; padding: .35rem .55rem; color: var(--success); border: 1px solid #88b49d; background: #f0f8f3; font-size: .82rem; font-weight: 650; }
  .example-workbench { display: grid; max-width: 92rem; margin: 0 auto; border: 1px solid var(--line-strong); background: var(--surface); box-shadow: 0 14px 38px rgb(10 27 46 / 8%); }
  .examples-section.is-returning { padding-top: 1.5rem; }
  .examples-section.is-returning .opening { margin-bottom: 1.25rem; }
  .example-browser { min-width: 0; border-bottom: 1px solid var(--line-strong); }
  .example-browser > header { padding: 1.25rem; border-bottom: 1px solid var(--line); }
  .example-browser > header h2 { margin-bottom: .35rem; }
  .example-browser > header p { margin: 0; color: var(--muted); }
  .pack-selector { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); border-bottom: 1px solid var(--line); }
  .pack-button { display: grid; min-height: 4.25rem; align-content: center; gap: .1rem; padding: .65rem .8rem; color: var(--ink); text-align: left; border: 0; border-right: 1px solid var(--line); border-bottom: 2px solid transparent; border-radius: 0; background: var(--surface); }
  .pack-button:nth-child(even) { border-right: 0; }
  .pack-button:hover { color: var(--ink); background: var(--surface-2); }
  .pack-button.is-selected { color: var(--primary); border-bottom-color: var(--primary); background: var(--primary-soft); }
  .pack-button span { font-weight: 650; }
  .pack-button small { color: var(--muted); }
  .example-list { min-height: 20rem; }
  .example-row { position: relative; display: grid; width: 100%; grid-template-columns: 1fr auto; gap: .35rem 1rem; min-height: 6.25rem; align-content: center; padding: 1rem 3.5rem 1rem 1.1rem; color: var(--ink); text-align: left; border: 0; border-bottom: 1px solid var(--line); border-radius: 0; background: var(--surface); }
  .example-row:hover { color: var(--ink); background: #f5f7fb; }
  .example-row.is-selected { box-shadow: inset 3px 0 0 var(--primary); background: var(--primary-soft); }
  .example-name { font-weight: 700; }
  .example-philosophy { grid-column: 1; color: var(--muted); font-size: .88rem; }
  .example-open { position: absolute; right: 1rem; top: 50%; color: var(--primary); font-size: .82rem; transform: translateY(-50%); }
  .demo-footnote { margin: 0; padding: 1rem 1.1rem; color: var(--muted); font-size: .8rem; }
  .inspector-stack { min-width: 0; }
  .example-inspector { min-width: 0; }
  .inspector-header { display: flex; align-items: start; justify-content: space-between; gap: 1rem; padding: 1.25rem; border-bottom: 1px solid var(--line); }
  .inspector-header h3 { margin-bottom: 0; }
  .inspector-tools { display: flex; flex: 0 0 auto; flex-wrap: wrap; justify-content: flex-end; gap: .45rem; }
  .demo-marker { display: inline-block; margin: 0 0 .55rem; padding: .2rem .42rem; color: var(--primary); border: 1px solid #9eb8ff; background: var(--primary-soft); font-size: .72rem; font-weight: 750; letter-spacing: .04em; }
  .quiet-button { flex: 0 0 auto; min-height: 2.75rem; padding: .5rem .65rem; color: var(--muted); border-color: var(--line); background: transparent; font-size: .82rem; }
  .quiet-button:hover { color: white; background: var(--ink-2); }
  .inspector-philosophy { margin: 1.25rem 1.25rem .35rem; font-weight: 650; }
  .inspector-philosophy + p { margin: 0 1.25rem; color: var(--muted); }
  .emphasis-list { display: flex; flex-wrap: wrap; gap: .4rem; margin: 1rem 1.25rem; padding: 0; list-style: none; }
  .emphasis-list li { padding: .3rem .45rem; border: 1px solid var(--line); background: var(--surface-2); font-size: .78rem; }
  .inspector-section, .review-record, .fit-grid { padding: 1.25rem; border-top: 1px solid var(--line); }
  .inspector-section > h4, .review-record > h4, .fit-grid h4 { margin-bottom: .9rem; }
  .lifecycle { margin: 0; padding: 0; list-style: none; }
  .lifecycle li { position: relative; display: grid; grid-template-columns: 2.15rem 1fr; gap: .7rem; min-height: 4.25rem; padding-bottom: .8rem; }
  .lifecycle li:not(:last-child)::before { position: absolute; left: 1.03rem; top: 2rem; bottom: -.15rem; width: 1px; background: var(--line-strong); content: ""; }
  .stage-index { position: relative; z-index: 1; display: grid; width: 2.1rem; height: 2.1rem; place-items: center; color: var(--ink); border: 1px solid var(--line-strong); border-radius: 50%; background: var(--surface); font-size: .8rem; font-variant-numeric: tabular-nums; }
  [data-story-state="condition"] .stage-index { color: #694300; border-color: #d59a21; background: #fff4d5; }
  [data-story-state="review"] .stage-index, [data-story-state="cooldown"] .stage-index { color: white; border-color: var(--success); background: var(--success); }
  .lifecycle h4 { margin: .15rem 0 .18rem; }
  .lifecycle p { margin: 0; color: var(--muted); font-size: .88rem; }
  .evidence-sheet { border-top: 1px solid var(--line); }
  .evidence-sheet summary { min-height: 2.75rem; padding: .85rem 1.25rem; color: var(--primary); cursor: pointer; font-weight: 650; }
  .table-scroll { overflow-x: auto; padding: 0 1.25rem 1.25rem; }
  table { width: 100%; min-width: 44rem; border-collapse: collapse; font-size: .82rem; }
  th, td { padding: .65rem .55rem; text-align: left; vertical-align: top; border-bottom: 1px solid var(--line); }
  th { color: var(--muted); font-weight: 650; }
  time, .meta { font-variant-numeric: tabular-nums; }
  .state-mark { display: inline-block; padding: .16rem .38rem; border: 1px solid var(--line-strong); background: var(--surface-2); font-size: .74rem; font-weight: 650; }
  .state-review, .state-escalated_review { color: #704600; border-color: #d9a43f; background: #fff5d8; }
  .review-record dl { margin: 0; }
  .review-record dl div { display: grid; gap: .25rem; padding: .7rem 0; border-top: 1px solid var(--line); }
  .review-record dt { color: var(--muted); font-size: .78rem; font-weight: 650; }
  .review-record dd { margin: 0; }
  .fit-grid { display: grid; gap: 1rem; }
  .fit-grid section { padding: 0; }
  .fit-grid ul { margin: 0; padding-left: 1.2rem; color: var(--muted); }
  .inspector-action { display: grid; gap: 1rem; align-items: center; padding: 1.25rem; border-top: 1px solid var(--line-strong); background: #f4f6fb; }
  .inspector-action div { display: grid; gap: .2rem; }
  .inspector-action span { color: var(--muted); font-size: .82rem; }
  .workspace-section { max-width: 92rem; width: 100%; margin: 0 auto; }
  .section-heading { display: grid; gap: .25rem; margin-bottom: 1.25rem; }
  .section-heading p { margin: 0; color: var(--muted); }
  form, .card { margin: 0; border: 1px solid var(--line-strong); border-radius: var(--radius); background: var(--surface); }
  form { padding: 1.25rem; }
  fieldset { margin: 0; padding: 0 0 1.5rem; border: 0; }
  fieldset + fieldset { padding-top: 1.5rem; border-top: 1px solid var(--line); }
  legend { margin-bottom: .4rem; padding: 0; font-size: 1.1rem; font-weight: 700; }
  .policy-preview { padding: 1.25rem; color: white; background: var(--ink); }
  .policy-preview h3 { margin-bottom: .4rem; color: white; }
  .policy-preview > p { margin: 0 0 1rem; color: #c4d0dc; }
  .policy-preview dl { display: grid; gap: .7rem; margin: 0; }
  .policy-preview dl div { display: grid; gap: .15rem; padding-top: .65rem; border-top: 1px solid #38506a; }
  .policy-preview dt { color: #96a9bb; font-size: .76rem; font-weight: 650; }
  .policy-preview dd { margin: 0; }
  .position-editor { margin-top: 1.25rem; padding-top: 1.25rem; border-top: 1px solid var(--line); }
  .position-row { display: grid; gap: .8rem; padding: 1rem 0; border-bottom: 1px solid var(--line); }
  .position-row:first-child { border-top: 1px solid var(--line); }
  .position-row label { margin-top: 0; font-size: .84rem; }
  .position-row label span { color: var(--muted); font-weight: 400; }
  .remove-position { align-self: end; }
  .advanced-tools { margin: 1.25rem 0; padding: .75rem 0; border-block: 1px solid var(--line); }
  .advanced-tools summary { min-height: 2.75rem; padding: .6rem 0; color: var(--primary); cursor: pointer; font-weight: 650; }
  .condition-builder { display: grid; gap: 1rem; margin: 1rem 0; }
  .condition-config { padding: 1rem; border: 1px solid var(--line); background: #f8f7f3; }
  .condition-config + .condition-config { padding-top: 1rem; border-top: 1px solid var(--line); }
  .condition-config > p { margin: .2rem 0 .75rem; color: var(--muted); font-size: .88rem; }
  .condition-enable { display: inline-flex; align-items: center; gap: .5rem; margin: 0; }
  .condition-enable input { width: 1.15rem; height: 1.15rem; margin: 0; }
  .condition-numbers { display: grid; gap: .75rem; }
  label { display: block; margin-top: .9rem; font-weight: 650; }
  input, textarea, select { width: 100%; margin-top: .3rem; padding: .72rem .75rem; color: var(--ink); border: 1px solid #8d9299; border-radius: .18rem; background: white; }
  textarea { min-height: 5rem; resize: vertical; }
  input[type="number"] { max-width: 16rem; font-variant-numeric: tabular-nums; }
  input:hover, textarea:hover, select:hover { border-color: var(--ink-2); }
  input[aria-invalid="true"], textarea[aria-invalid="true"], select[aria-invalid="true"] { border-color: var(--danger); box-shadow: 0 0 0 2px rgb(166 43 43 / 14%); }
  .form-grid { display: grid; gap: 1rem; }
  .card { padding: 1.25rem; }
  .card + .card { margin-top: 1rem; }
  .helper, .meta { color: var(--muted); }
  .helper { margin: .35rem 0 0; font-size: .9rem; }
  pre { overflow: auto; padding: .85rem; border: 1px solid var(--line); background: var(--surface-2); }
  .status { min-height: 1.65rem; margin: .75rem 0 0; font-weight: 650; }
  .status[data-state="error"] { color: var(--danger); } .status[data-state="success"] { color: var(--success); } .status[data-state="pending"] { color: var(--muted); }
  .t-text-swap { display: inline-block; transform: translateY(0); filter: blur(0); opacity: 1; transition: transform var(--text-swap-dur) var(--text-swap-ease), filter var(--text-swap-dur) var(--text-swap-ease), opacity var(--text-swap-dur) var(--text-swap-ease); will-change: transform, filter, opacity; }
  .t-text-swap.is-exit { transform: translateY(calc(var(--text-swap-translate-y) * -1)); filter: blur(var(--text-swap-blur)); opacity: 0; }
  .t-text-swap.is-enter-start { transform: translateY(var(--text-swap-translate-y)); filter: blur(var(--text-swap-blur)); opacity: 0; transition: none; }
  @media (min-width: 48rem) {
    .opening { grid-template-columns: minmax(0, 1fr) auto; }
    .form-grid, .fit-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .position-row { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .condition-builder { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .condition-numbers { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .inspector-action { grid-template-columns: minmax(0, 1fr) auto; }
    .review-record dl div { grid-template-columns: 8.5rem 1fr; gap: 1rem; }
    .workstation-summary { grid-template-columns: minmax(18rem, .75fr) minmax(26rem, 1.25fr); align-items: end; }
    .summary-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .summary-grid div { padding: .9rem 1rem; border-right: 1px solid #38506a; }
  }
  @media (min-width: 70rem) {
    .app-shell { display: grid; grid-template-columns: 12.75rem minmax(0, 1fr); }
    .app-rail { position: sticky; top: 0; display: grid; height: 100vh; grid-template-rows: auto 1fr auto; }
    .brand { padding: 2rem 1.4rem 1.4rem; font-size: 1.55rem; }
    .app-rail nav { display: block; overflow: visible; padding: .25rem .75rem; }
    .app-rail nav a { display: flex; justify-content: flex-start; margin-bottom: .2rem; padding: .65rem .75rem; border-bottom: 0; border-left: 3px solid transparent; }
    .app-rail nav a:hover, .app-rail nav a[aria-current="page"] { border-left-color: #5f8eff; }
    .rail-note { display: block; margin: 1rem; padding-top: 1rem; color: #9fb0bf; border-top: 1px solid #38506a; font-size: .76rem; }
    .workspace-bar, .notice { padding-inline: 1.75rem; }
    main > section { padding: 3rem 2rem; }
    .example-workbench { grid-template-columns: minmax(26rem, .9fr) minmax(31rem, 1.1fr); }
    .example-browser { border-right: 1px solid var(--line-strong); border-bottom: 0; }
    .pack-selector { grid-template-columns: repeat(4, minmax(0, 1fr)); }
    .pack-button { border-right: 1px solid var(--line); }
    .pack-button:nth-child(even) { border-right: 1px solid var(--line); }
    .pack-button:last-child { border-right: 0; }
  }
  @media (max-width: 32rem) {
    h1 { font-size: 2.1rem; }
    .workspace-bar { align-items: flex-start; }
    .local-state { max-width: 10rem; text-align: right; }
    main > section { padding-inline: .8rem; }
    .entry-actions > * { flex: 1 1 100%; text-align: center; }
    .mobile-starting-point { display: grid; gap: .7rem; margin-top: 1rem; padding: .8rem; border-block: 1px solid var(--line-strong); background: var(--surface); }
    .mobile-starting-point > div { display: grid; gap: .2rem; }
    .mobile-starting-point .demo-marker { width: max-content; margin: 0; }
    .examples-section.is-returning .mobile-starting-point { display: none; }
    .pack-selector { grid-template-columns: 1fr; }
    .pack-button, .pack-button:nth-child(even) { border-right: 0; }
    .example-workbench { margin-inline: -.15rem; }
    .inspector-header { align-items: stretch; flex-direction: column; }
    .inspector-tools { justify-content: stretch; }
    .inspector-tools > * { flex: 1 1 auto; }
    .provider-note { align-items: flex-start; flex-direction: column; }
    input[type="number"] { max-width: none; }
  }
  @media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } *, *::before, *::after { scroll-behavior: auto !important; transition-duration: .01ms !important; animation-duration: .01ms !important; animation-iteration-count: 1 !important; } }
</style></head><body>
<!--
THESIS: A policy review bench makes examples inspectable before any personal form; it refuses the blank-form homepage.
OWN-WORLD: Pale stone working canvas, deep-ink navigation, cobalt selection, thin registration rules, clipped controls, and state labels replace generic rounded cards.
STORY: Understand the lifecycle, inspect one fictional policy, choose a philosophy, then move only editable policy text into a personal draft.
FIRST VIEWPORT: A narrow navigation rail frames a large purpose statement above a two-part example browser and integrated lifecycle inspection sheet; the copy action remains visible in that sheet.
FORM: Decision review bench, grounded direction 5, seed de857c1a.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
-->
<a class="skip-link" href="#main-content">Skip to main content</a>
<div class="app-shell">
<aside class="app-rail"><a class="brand" href="#examples">Decision<br>Covenant</a>
<nav aria-label="Primary"><a href="#examples" aria-current="page">Examples</a><a href="#covenant" data-open-builder>My policy</a><a href="#snapshots">Observations</a><a href="#history">Reviews</a><a href="#history">Record</a></nav>
<p class="rail-note">Local-first policy records<br>No trades · no forecasts</p></aside>
<div class="workspace" data-product-state="${productState}"><header class="workspace-bar"><strong>Decision review bench</strong><span class="local-state">Saved locally on this device</span></header>
<p class="notice">This application records your policy and deterministic arithmetic. It does not provide investment advice or execute trades.</p>
<main id="main-content">
${workspaceSummary.mode === "workstation" ? workspaceSummarySection(workspaceSummary) : ""}
${exampleLibrary(productState)}
<section id="covenant" class="workspace-section" aria-labelledby="create-heading" data-builder hidden><div class="section-heading"><h2 id="create-heading" tabindex="-1">Build your covenant</h2><p>Everything is editable. Save creates a draft; approval is a separate action.</p></div>
<form id="covenant-form">
  <fieldset><legend>Intent</legend>
  <label for="name">Policy name</label><input id="name" name="name" required>
  <label for="purpose">Purpose</label><textarea id="purpose" name="purpose" required></textarea>
  <label for="coveredExposure">Covered exposure</label><input id="coveredExposure" name="coveredExposure" required>
  <label for="objective">Objective</label><textarea id="objective" name="objective" required></textarea>
  <label for="timeHorizon">Time horizon</label><input id="timeHorizon" name="timeHorizon" required></fieldset>
  <fieldset><legend>Guardrails</legend>
  <label for="maximumIntendedConcentration">Maximum intended concentration (%)</label><input id="maximumIntendedConcentration" name="maximumIntendedConcentration" type="number" min="0" max="100" step="1" required aria-describedby="fraction-help"><p id="fraction-help" class="helper">Enter a percentage from 0 to 100, such as 25.</p>
  <label for="maximumTolerableDrawdown">Maximum tolerable drawdown (%)</label><input id="maximumTolerableDrawdown" name="maximumTolerableDrawdown" type="number" min="0" max="100" step="1" required aria-describedby="fraction-help"></fieldset>
  <fieldset><legend>Decision boundaries</legend>
  <label for="reviewRules">Review rules (one per line)</label><textarea id="reviewRules" name="reviewRules" required></textarea>
  <label for="candidateActions">Candidate actions (one per line)</label><textarea id="candidateActions" name="candidateActions" required></textarea>
  <label for="falsifiers">Falsifiers (one per line)</label><textarea id="falsifiers" name="falsifiers"></textarea>
  <label for="deescalationConditions">De-escalation conditions (one per line)</label><textarea id="deescalationConditions" name="deescalationConditions"></textarea>
  <label for="reentryConditions">Re-entry conditions (one per line)</label><textarea id="reentryConditions" name="reentryConditions"></textarea>
  <label for="cooldownPolicy">Cooldown policy</label><input id="cooldownPolicy" name="cooldownPolicy" required>
  <label for="notes">Notes</label><textarea id="notes" name="notes"></textarea></fieldset>
  <fieldset><legend>Preview</legend>
    <article class="policy-preview" aria-live="polite">
      <h3 id="preview-name">Untitled policy</h3>
      <p id="preview-purpose">Describe why this covenant exists.</p>
      <dl><div><dt>Exposure</dt><dd id="preview-exposure">Not set</dd></div><div><dt>Horizon</dt><dd id="preview-horizon">Not set</dd></div><div><dt>Guardrails</dt><dd id="preview-guardrails">Not set</dd></div><div><dt>Review posture</dt><dd id="preview-review">Not set</dd></div></dl>
    </article>
  </fieldset>
  <button type="submit">Save draft</button>
</form><p id="status" class="status t-text-swap" data-status role="status" aria-live="polite" tabindex="-1"></p></section>
<section id="snapshots" class="workspace-section" aria-labelledby="snapshot-heading"><h2 id="snapshot-heading" tabindex="-1">Portfolio snapshots</h2>
<p>Snapshots are immutable source records. Missing AI classifications remain unknown.</p>
<div class="form-grid"><form id="manual-snapshot-form">
  <h3>Enter a snapshot manually</h3>
  <label for="manual-as-of">As of</label><input id="manual-as-of" type="date" required>
  <label for="manual-portfolio-name">Portfolio name</label><input id="manual-portfolio-name" required>
  <label for="manual-source">Source</label><input id="manual-source" value="manual entry" required>
  <fieldset class="position-editor"><legend>Positions</legend>
    <p class="helper">Add each observed holding. AI exposure is your optional classification, not a universal label.</p>
    <div id="position-rows" data-position-rows>
      <div class="position-row" data-position-row data-row-id="1">
        <label for="position-1-asset">Asset ID<input id="position-1-asset" data-position-field="assetId" autocomplete="off"></label>
        <label for="position-1-name">Name or symbol<input id="position-1-name" data-position-field="symbolOrName" autocomplete="off"></label>
        <label for="position-1-quantity">Quantity<input id="position-1-quantity" data-position-field="quantity" type="number" step="any"></label>
        <label for="position-1-price">Price<input id="position-1-price" data-position-field="price" type="number" min="0" step="any"></label>
        <label for="position-1-market">Market value <span>(optional)</span><input id="position-1-market" data-position-field="marketValue" type="number" min="0" step="any"></label>
        <label for="position-1-ai">AI exposure % <span>(optional)</span><input id="position-1-ai" data-position-field="aiExposurePercent" type="number" min="0" max="100" step="1"></label>
        <label for="position-1-account">Account group<input id="position-1-account" data-position-field="accountGroup" autocomplete="off"></label>
        <button class="quiet-button remove-position" type="button" data-remove-position aria-label="Remove position">Remove</button>
      </div>
    </div>
    <button class="secondary-action" type="button" data-add-position>Add position</button>
    <p id="position-row-status" class="status" role="status" aria-live="polite"></p>
  </fieldset>
  <details class="advanced-tools"><summary>Advanced: positions JSON</summary><p class="helper">Use this exact-input path when you already have valid position JSON.</p>
    <label for="manual-positions">Positions as JSON</label><textarea id="manual-positions">[{"assetId":"example","symbolOrName":"Example","quantity":1,"price":100,"aiExposureFraction":null,"accountGroup":"main"}]</textarea>
  </details>
  <button type="submit">Save manual snapshot</button>
</form>
<form id="csv-snapshot-form">
  <h3>Import a CSV snapshot</h3>
  <label for="csv-source">Source reference</label><input id="csv-source" value="user CSV import">
  <label for="csv-data">CSV data</label><textarea id="csv-data" required>as_of,portfolio_name,asset_id,symbol_or_name,quantity,price,market_value,ai_exposure_fraction,account_group
2026-01-01,Example Portfolio,example,Example,1,100,,,main</textarea>
  <button type="submit">Import CSV snapshot</button>
</form></div><p id="snapshot-status" class="status t-text-swap" data-status role="status" aria-live="polite" tabindex="-1"></p></section>
<section id="calculations" class="workspace-section" aria-labelledby="snapshot-history-heading"><h2 id="snapshot-history-heading" tabindex="-1">Saved calculations</h2>${snapshots.map((snapshot) => snapshotCard(snapshot, snapshots)).join("\n") || "<p>No portfolio snapshots yet. <a href=\"#snapshots\">Add a snapshot</a> to see deterministic calculations here.</p>"}
<p><a href="/api/snapshots/export.md">Export all calculations Markdown</a> <a href="/api/snapshots/export.json">Export all calculations JSON</a></p></section>
<section id="history" class="workspace-section" aria-labelledby="history-heading"><h2 id="history-heading" tabindex="-1">Saved covenant versions</h2>${cards || "<p>No covenant drafts yet. <a href=\"#covenant\" data-open-builder>Create a draft</a> to begin.</p>"}<p id="trigger-status" class="status t-text-swap" data-status role="status" aria-live="polite" tabindex="-1"></p></section>
</main></div></div>
<script id="example-data" type="application/json">${safeJson(EXAMPLE_PACKS)}</script>
<script>
  const fields = ['name','purpose','coveredExposure','objective','timeHorizon','maximumIntendedConcentration','maximumTolerableDrawdown','reviewRules','candidateActions','falsifiers','deescalationConditions','reentryConditions','cooldownPolicy','notes'];
  const lines = new Set(['reviewRules','candidateActions','falsifiers','deescalationConditions','reentryConditions']);
  const percentageFields = new Set(['maximumIntendedConcentration','maximumTolerableDrawdown']);
  const examplePacks = JSON.parse(document.getElementById('example-data').textContent || '[]');
  const examples = examplePacks.flatMap((pack) => pack.examples);
  const firstPackId = examplePacks[0]?.id;
  const firstExampleId = examplePacks[0]?.examples[0]?.id;
  const builder = document.querySelector('[data-builder]');
  function openBuilder({ clear = false, focus = true } = {}) {
    builder.hidden = false;
    if (clear) { document.getElementById('covenant-form').reset(); renderPreview(); }
    if (focus) {
      document.getElementById('create-heading').focus({ preventScroll: true });
      builder.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
  function selectExample(exampleId) {
    document.querySelectorAll('[data-example-card]').forEach((item) => {
      const selected = item.dataset.exampleId === exampleId;
      item.classList.toggle('is-selected', selected); item.setAttribute('aria-pressed', String(selected));
    });
    document.querySelectorAll('[data-example-panel]').forEach((panel) => { panel.hidden = panel.dataset.examplePanel !== exampleId; });
  }
  function selectPack(packId, chooseFirst = true) {
    document.querySelectorAll('[data-example-pack]').forEach((item) => {
      const selected = item.dataset.examplePack === packId;
      item.classList.toggle('is-selected', selected); item.setAttribute('aria-pressed', String(selected));
    });
    const matching = [...document.querySelectorAll('[data-example-card]')].filter((item) => item.dataset.packId === packId);
    document.querySelectorAll('[data-example-card]').forEach((item) => { item.hidden = item.dataset.packId !== packId; });
    if (chooseFirst && matching[0]) selectExample(matching[0].dataset.exampleId);
  }
  document.querySelectorAll('[data-example-pack]').forEach((button) => button.addEventListener('click', () => selectPack(button.dataset.examplePack)));
  document.querySelectorAll('[data-example-card]').forEach((button) => button.addEventListener('click', () => selectExample(button.dataset.exampleId)));
  document.querySelectorAll('[data-reset-example]').forEach((button) => button.addEventListener('click', () => { selectPack(firstPackId, false); selectExample(firstExampleId); document.getElementById('example-library').scrollIntoView({ behavior: 'smooth', block: 'start' }); }));
  document.querySelectorAll('[data-start-blank]').forEach((button) => button.addEventListener('click', () => openBuilder({ clear: true })));
  document.querySelectorAll('[data-open-builder]').forEach((link) => link.addEventListener('click', () => openBuilder()));
  document.querySelector('[data-generation-toggle]').addEventListener('click', (event) => {
    const panel = document.querySelector('[data-generation-panel]');
    panel.hidden = !panel.hidden; event.currentTarget.setAttribute('aria-expanded', String(!panel.hidden));
  });
  document.querySelectorAll('[data-use-example]').forEach((button) => button.addEventListener('click', () => {
    const selected = examples.find((example) => example.id === button.dataset.useExample);
    if (!selected) return;
    for (const field of fields) {
      const input = document.getElementById(field); const value = selected.covenant[field];
      input.value = Array.isArray(value) ? value.join('\\n') : percentageFields.has(field) ? String(Number(value) * 100) : String(value ?? '');
    }
    renderPreview(); openBuilder(); setStatus('status', selected.title + ' copied into an editable draft. No fictional observations were copied.', 'success', true);
  }));
  const formData = () => Object.fromEntries(fields.map((field) => {
    const value = document.getElementById(field).value;
    return [field, lines.has(field) ? value.split('\\n').map((item) => item.trim()).filter(Boolean) : (percentageFields.has(field) ? Number(value) / 100 : value)];
  }));
  function renderPreview() {
    const value = (id) => document.getElementById(id)?.value.trim() || '';
    document.getElementById('preview-name').textContent = value('name') || 'Untitled policy';
    document.getElementById('preview-purpose').textContent = value('purpose') || 'Describe why this covenant exists.';
    document.getElementById('preview-exposure').textContent = value('coveredExposure') || 'Not set';
    document.getElementById('preview-horizon').textContent = value('timeHorizon') || 'Not set';
    const concentration = value('maximumIntendedConcentration'); const drawdown = value('maximumTolerableDrawdown');
    document.getElementById('preview-guardrails').textContent = concentration || drawdown ? ('Concentration ' + (concentration || '—') + '% · Drawdown ' + (drawdown || '—') + '%') : 'Not set';
    document.getElementById('preview-review').textContent = value('reviewRules') || 'Not set';
  }
  async function request(url, options) {
    const response = await fetch(url, options);
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error || 'Request failed');
    return body;
  }
  const flashKey = 'decision-covenant-flash';
  function swapText(el, next) {
    if (!el) return;
    const duration = Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--text-swap-dur')) || 150;
    if (!el.textContent) { el.textContent = next; return; }
    el.classList.add('is-exit');
    window.setTimeout(() => {
      el.textContent = next; el.classList.remove('is-exit'); el.classList.add('is-enter-start'); void el.offsetHeight; el.classList.remove('is-enter-start');
    }, duration);
  }
  function setStatus(id, message, state = 'pending', focus = false) {
    const status = document.getElementById(id);
    if (!status) return;
    status.dataset.state = state; swapText(status, message);
    if (focus) window.setTimeout(() => status.focus({ preventScroll: true }), 0);
  }
  function setBusy(target, busy, label = 'Working…') {
    const button = target instanceof HTMLButtonElement ? target : target.querySelector('button[type="submit"]');
    if (!button) return;
    if (busy) { button.dataset.idleLabel = button.textContent || ''; button.disabled = true; button.textContent = label; }
    else { button.disabled = false; button.textContent = button.dataset.idleLabel || button.textContent; delete button.dataset.idleLabel; }
  }
  function showFieldError(fieldId, message, statusId) {
    const field = document.getElementById(fieldId);
    if (field) { field.setAttribute('aria-invalid', 'true'); field.setAttribute('aria-describedby', statusId); }
    setStatus(statusId, message, 'error');
    if (field) window.setTimeout(() => field.focus(), 0);
  }
  function reloadWithFlash(sectionId, statusId, message) {
    try { sessionStorage.setItem(flashKey, JSON.stringify({ sectionId, statusId, message })); } catch { /* Private browsing may disable session storage. */ }
    window.location.hash = sectionId;
    location.reload();
  }
  try {
    const flash = JSON.parse(sessionStorage.getItem(flashKey) || 'null');
    if (flash) {
      sessionStorage.removeItem(flashKey); setStatus(flash.statusId, flash.message, 'success', true);
      window.setTimeout(() => document.getElementById(flash.sectionId)?.scrollIntoView({ block: 'start' }), 0);
    }
  } catch { /* A missing flash message does not block the page. */ }
  document.querySelectorAll('input, textarea, select').forEach((field) => field.addEventListener('input', () => { field.removeAttribute('aria-invalid'); renderPreview(); }));
  renderPreview();
  document.getElementById('covenant-form').addEventListener('submit', async (event) => {
    event.preventDefault(); const form = event.currentTarget; setBusy(form, true, 'Saving…'); setStatus('status', 'Saving draft…');
    try { await request('/api/covenants', { method: 'POST', headers: {'content-type':'application/json'}, body: JSON.stringify(formData()) }); reloadWithFlash('covenant', 'status', 'Draft saved.'); }
    catch (error) { setBusy(form, false); setStatus('status', error.message, 'error', true); }
  });
  document.querySelectorAll('[data-action="approve"], [data-action="successor"]').forEach((button) => button.addEventListener('click', async () => {
    const id = button.dataset.id; const action = button.dataset.action; setBusy(button, true, action === 'approve' ? 'Locking…' : 'Creating…'); setStatus('trigger-status', action === 'approve' ? 'Locking covenant…' : 'Creating successor draft…');
    try { await request('/api/covenants/' + id + '/' + (action === 'approve' ? 'approve' : 'supersede'), { method: 'POST', headers: {'content-type':'application/json'}, body: action === 'supersede' ? JSON.stringify({}) : undefined }); reloadWithFlash('history', 'trigger-status', action === 'approve' ? 'Covenant approved and locked.' : 'Successor draft created.'); }
    catch (error) { setBusy(button, false); setStatus('trigger-status', error.message, 'error', true); }
  }));
  function serializeConditionBuilder(form) {
    const DAY = 86400000; const numericTypes = new Set(['ai_exposure','single_position_concentration','trailing_drawdown','trailing_volatility','appreciation_concentration']);
    return [...form.querySelectorAll('[data-condition-config]')].map((block) => {
      const field = (name) => block.querySelector('[data-config-field="' + name + '"]');
      const number = (name) => Number(field(name).value);
      const type = block.dataset.conditionConfig; let settings = {};
      if (type === 'trailing_volatility') settings = { lookbackObservations: number('lookbackObservations'), annualizationFactor: number('annualizationFactor'), returnIntervalMs: number('returnIntervalDays') * DAY, missingObservationPolicy: 'hold_prior_state' };
      if (type === 'appreciation_concentration') settings = { minimumConcentrationChange: number('minimumConcentrationChangePercent') / 100, minimumAppreciationContribution: number('minimumAppreciationContributionPercent') / 100 };
      if (type === 'scheduled_review') settings = { scheduledLocal: field('scheduledAt').value, timezone: field('timezone').value.trim() };
      if (type === 'overdue_review') settings = { reviewIntervalMs: number('reviewIntervalDays') * DAY, timezone: field('timezone').value.trim(), reviewClock: field('reviewClock').value };
      return {
        type, enabled: field('enabled').checked,
        entryThreshold: numericTypes.has(type) ? number('entryPercent') / 100 : null,
        exitThreshold: numericTypes.has(type) ? number('exitPercent') / 100 : null,
        persistenceObservations: number('persistenceObservations'), clearingPersistenceObservations: number('clearingPersistenceObservations'),
        cooldownMs: number('cooldownDays') * DAY, severity: 'normal', missingDataPolicy: field('missingDataPolicy').value,
        reviewInstructions: field('reviewInstructions').value.trim(), settings,
      };
    });
  }
  document.querySelectorAll('[data-trigger-form]').forEach((form) => form.addEventListener('submit', async (event) => {
    event.preventDefault(); setBusy(form, true, 'Saving…'); setStatus('trigger-status', 'Saving trigger definitions…');
    try {
      const covenantId = form.dataset.covenantId;
      const json = form.querySelector('.advanced-tools textarea').value.trim();
      const definitions = json && json !== '[]' ? JSON.parse(json) : serializeConditionBuilder(form);
      await request('/api/covenants/' + covenantId + '/triggers', { method: 'POST', headers: {'content-type':'application/json'}, body: JSON.stringify({ definitions }) });
      reloadWithFlash('history', 'trigger-status', 'Trigger definitions saved.');
    } catch (error) { setBusy(form, false); showFieldError(form.querySelector('textarea').id, error.message, 'trigger-status'); }
  }));
  document.querySelectorAll('[data-action="evaluate-triggers"]').forEach((button) => button.addEventListener('click', async () => {
    setBusy(button, true, 'Evaluating…'); setStatus('trigger-status', 'Evaluating triggers…');
    try {
      const result = await request('/api/covenants/' + button.dataset.id + '/triggers/evaluate', { method: 'POST', headers: {'content-type':'application/json'}, body: JSON.stringify({}) });
      setBusy(button, false); setStatus('trigger-status', 'Trigger evaluation complete: ' + result.evaluations.map((item) => item.triggerType + ' ' + item.metric.status + (item.metric.details?.reason ? ' ' + item.metric.details.reason : '')).join('; '), 'success', true);
    } catch (error) { setBusy(button, false); setStatus('trigger-status', error.message, 'error', true); }
  }));
  document.querySelectorAll('[data-action="complete-trigger-review"]').forEach((button) => button.addEventListener('click', async () => {
    setBusy(button, true, 'Completing…');
    try { await request('/api/triggers/' + button.dataset.id + '/review-complete', { method: 'POST', headers: {'content-type':'application/json'}, body: JSON.stringify({}) }); setBusy(button, false); setStatus('trigger-status', 'Review completed; cooldown active.', 'success', true); }
    catch (error) { setBusy(button, false); setStatus('trigger-status', error.message, 'error', true); }
  }));
  document.querySelectorAll('[data-action="acknowledge-trigger"]').forEach((button) => button.addEventListener('click', async () => {
    setBusy(button, true, 'Acknowledging…');
    try { await request('/api/triggers/' + button.dataset.id + '/acknowledge', { method: 'POST', headers: {'content-type':'application/json'}, body: JSON.stringify({}) }); setBusy(button, false); setStatus('trigger-status', 'Trigger acknowledged.', 'success', true); }
    catch (error) { setBusy(button, false); setStatus('trigger-status', error.message, 'error', true); }
  }));
  document.querySelectorAll('[data-action="open-structured-review"]').forEach((button) => button.addEventListener('click', async () => {
    setBusy(button, true, 'Opening…');
    try {
      await request('/api/covenants/' + button.dataset.id + '/reviews', { method: 'POST', headers: {'content-type':'application/json'}, body: JSON.stringify({ triggerIds: JSON.parse(button.dataset.triggerIds), openedAt: new Date().toISOString() }) });
      reloadWithFlash('history', 'trigger-status', 'Structured review opened.');
    } catch (error) { setBusy(button, false); setStatus('trigger-status', error.message, 'error', true); }
  }));
  document.querySelectorAll('[data-review-form]').forEach((form) => form.addEventListener('submit', async (event) => {
    event.preventDefault(); setBusy(form, true, 'Completing…'); setStatus('trigger-status', 'Completing structured review…');
    try {
      const value = (field) => form.querySelector('[data-field="' + field + '"]').value;
      await request('/api/reviews/' + form.dataset.id + '/complete', { method: 'POST', headers: {'content-type':'application/json'}, body: JSON.stringify({ factualObservations: value('factualObservations'), falsifierCheck: value('falsifierCheck'), decision: value('decision'), rationale: value('rationale'), followUpAt: value('followUpAt') || null, completedAt: new Date().toISOString() }) });
      reloadWithFlash('history', 'trigger-status', 'Structured review completed.');
    } catch (error) { setBusy(form, false); setStatus('trigger-status', error.message, 'error', true); }
  }));
  let positionRowCounter = 1;
  const positionSuffix = { assetId: 'asset', symbolOrName: 'name', quantity: 'quantity', price: 'price', marketValue: 'market', aiExposurePercent: 'ai', accountGroup: 'account' };
  function updatePositionRemoveButtons() {
    const rows = document.querySelectorAll('[data-position-row]');
    rows.forEach((row) => { row.querySelector('[data-remove-position]').disabled = rows.length === 1; });
  }
  function addPositionRow() {
    const source = document.querySelector('[data-position-row]'); const row = source.cloneNode(true); positionRowCounter += 1;
    row.dataset.rowId = String(positionRowCounter);
    row.querySelectorAll('[data-position-field]').forEach((field) => {
      field.value = ''; field.removeAttribute('aria-invalid');
      field.id = 'position-' + positionRowCounter + '-' + positionSuffix[field.dataset.positionField];
      field.closest('label').htmlFor = field.id;
    });
    document.getElementById('position-rows').append(row); updatePositionRemoveButtons();
    row.querySelector('[data-position-field]').focus(); setStatus('position-row-status', 'Position ' + positionRowCounter + ' added.', 'success');
  }
  document.querySelector('[data-add-position]').addEventListener('click', addPositionRow);
  document.getElementById('position-rows').addEventListener('click', (event) => {
    const button = event.target.closest('[data-remove-position]'); if (!button) return;
    button.closest('[data-position-row]').remove(); updatePositionRemoveButtons(); setStatus('position-row-status', 'Position removed.', 'success');
  });
  updatePositionRemoveButtons();
  function readPositionRows() {
    const rows = [...document.querySelectorAll('[data-position-row]')];
    const hasRowData = rows.some((row) => [...row.querySelectorAll('[data-position-field]')].some((field) => field.value.trim()));
    if (!hasRowData) return null;
    const required = ['assetId', 'symbolOrName', 'quantity', 'price', 'accountGroup'];
    return rows.map((row, index) => {
      const get = (name) => row.querySelector('[data-position-field="' + name + '"]');
      for (const name of required) {
        const field = get(name); if (!field.value.trim()) { const error = new Error('Position ' + (index + 1) + ': ' + field.closest('label').childNodes[0].textContent.trim() + ' is required.'); error.positionFieldId = field.id; throw error; }
      }
      const quantity = Number(get('quantity').value); const price = Number(get('price').value);
      const marketValueText = get('marketValue').value.trim(); const aiText = get('aiExposurePercent').value.trim();
      if (!Number.isFinite(quantity)) { const error = new Error('Position ' + (index + 1) + ': quantity must be a number.'); error.positionFieldId = get('quantity').id; throw error; }
      if (!Number.isFinite(price) || price < 0) { const error = new Error('Position ' + (index + 1) + ': price must be zero or greater.'); error.positionFieldId = get('price').id; throw error; }
      if (marketValueText && (!Number.isFinite(Number(marketValueText)) || Number(marketValueText) < 0)) { const error = new Error('Position ' + (index + 1) + ': market value must be zero or greater.'); error.positionFieldId = get('marketValue').id; throw error; }
      if (aiText && (!Number.isFinite(Number(aiText)) || Number(aiText) < 0 || Number(aiText) > 100)) { const error = new Error('Position ' + (index + 1) + ': AI exposure must be from 0 to 100%.'); error.positionFieldId = get('aiExposurePercent').id; throw error; }
      return {
        assetId: get('assetId').value.trim(), symbolOrName: get('symbolOrName').value.trim(), quantity, price,
        ...(marketValueText ? { marketValue: Number(marketValueText) } : {}),
        aiExposureFraction: aiText ? Number(aiText) / 100 : null,
        accountGroup: get('accountGroup').value.trim(),
      };
    });
  }
  document.getElementById('manual-snapshot-form').addEventListener('submit', async (event) => {
    event.preventDefault(); const form = event.currentTarget; setBusy(form, true, 'Saving…'); setStatus('snapshot-status', 'Saving snapshot…');
    try {
      const positions = readPositionRows() ?? JSON.parse(document.getElementById('manual-positions').value);
      await request('/api/snapshots/manual', { method: 'POST', headers: {'content-type':'application/json'}, body: JSON.stringify({ asOf: document.getElementById('manual-as-of').value, portfolioName: document.getElementById('manual-portfolio-name').value, source: 'manual', sourceReference: document.getElementById('manual-source').value, positions }) });
      reloadWithFlash('snapshots', 'snapshot-status', 'Snapshot saved.');
    } catch (error) { setBusy(form, false); showFieldError(error.positionFieldId || 'manual-positions', error.message, 'snapshot-status'); }
  });
  document.getElementById('csv-snapshot-form').addEventListener('submit', async (event) => {
    event.preventDefault(); const form = event.currentTarget; setBusy(form, true, 'Importing…'); setStatus('snapshot-status', 'Importing CSV…');
    try {
      await request('/api/snapshots/import', { method: 'POST', headers: {'content-type':'application/json'}, body: JSON.stringify({ csv: document.getElementById('csv-data').value, sourceReference: document.getElementById('csv-source').value }) });
      reloadWithFlash('snapshots', 'snapshot-status', 'CSV snapshot imported.');
    } catch (error) { setBusy(form, false); showFieldError('csv-data', error.message, 'snapshot-status'); }
  });
</script></body></html>`;
}

function routeParts(pathname: string): string[] {
  return pathname.split("/").filter(Boolean);
}

export function createApp(db = openDatabase()): Server {
  return createServer(async (request, response) => {
    try {
      const url = new URL(request.url ?? "/", "http://127.0.0.1");
      const parts = routeParts(url.pathname);
      if (request.method === "GET" && url.pathname === "/assets/fonts/manrope-variable.ttf") return sendFont(response);
      if (request.method === "GET" && url.pathname === "/") return send(response, 200, page(db));
      if (request.method === "GET" && url.pathname === "/api/snapshots/export.json") {
        const series = listSnapshots(db);
        return send(response, 200, toCalculationCollectionJson(series.map((snapshot) => buildCalculationBundle(snapshot, series))), "application/json; charset=utf-8");
      }
      if (request.method === "GET" && url.pathname === "/api/snapshots/export.md") {
        const series = listSnapshots(db);
        return send(response, 200, toCalculationCollectionMarkdown(series.map((snapshot) => buildCalculationBundle(snapshot, series))), "text/markdown; charset=utf-8");
      }
      if (request.method === "GET" && parts[0] === "api" && parts[1] === "snapshots" && parts[2] && parts[3] === "export.json") {
        const snapshot = getSnapshot(db, parts[2]);
        return send(response, 200, toCalculationJson(buildCalculationBundle(snapshot, listSnapshots(db))), "application/json; charset=utf-8");
      }
      if (request.method === "GET" && parts[0] === "api" && parts[1] === "snapshots" && parts[2] && parts[3] === "export.md") {
        const snapshot = getSnapshot(db, parts[2]);
        return send(response, 200, toCalculationMarkdown(buildCalculationBundle(snapshot, listSnapshots(db))), "text/markdown; charset=utf-8");
      }
      if (request.method === "GET" && parts[0] === "api" && parts[1] === "snapshots" && parts[2]) {
        const snapshot = getSnapshot(db, parts[2]);
        return sendJson(response, 200, buildCalculationBundle(snapshot, listSnapshots(db)));
      }
      if (request.method === "GET" && url.pathname === "/api/snapshots") {
        const series = listSnapshots(db);
        return sendJson(response, 200, { snapshots: series, calculations: series.map((snapshot) => buildCalculationBundle(snapshot, series)) });
      }
      if (request.method === "POST" && url.pathname === "/api/snapshots/manual") {
        return sendJson(response, 201, { snapshot: createSnapshot(db, await readJson(request)) });
      }
      if (request.method === "POST" && url.pathname === "/api/snapshots/import") {
        const body = await readJson(request) as { csv?: unknown; sourceReference?: unknown };
        const result = importCsv(db, typeof body.csv === "string" ? body.csv : "", typeof body.sourceReference === "string" ? body.sourceReference : null);
        if (!result.ok) return sendJson(response, 422, result);
        return sendJson(response, 201, result);
      }
      if (request.method === "GET" && parts[0] === "api" && parts[1] === "covenants" && parts[2] && parts[3] === "reviews") {
        const covenant = getCovenant(db, parts[2]);
        return sendJson(response, 200, { reviews: listStructuredReviews(db, covenant.id) });
      }
      if (request.method === "POST" && parts[0] === "api" && parts[1] === "covenants" && parts[2] && parts[3] === "reviews") {
        const body = await readJson(request) as { triggerIds?: unknown; openedAt?: unknown };
        if (!Array.isArray(body.triggerIds) || !body.triggerIds.every((id) => typeof id === "string")) throw new Error("triggerIds must be an array of strings");
        return sendJson(response, 201, { review: openStructuredReview(db, parts[2], body.triggerIds, typeof body.openedAt === "string" ? body.openedAt : new Date().toISOString()) });
      }
      if (request.method === "GET" && parts[0] === "api" && parts[1] === "reviews" && parts[2] && parts[3] === "export.json") {
        const review = getStructuredReview(db, parts[2]);
        const exported = buildReviewExport(getCovenant(db, review.covenantId), review, listAuditEvents(db, review.id));
        return send(response, 200, toReviewJson(exported), "application/json; charset=utf-8");
      }
      if (request.method === "GET" && parts[0] === "api" && parts[1] === "reviews" && parts[2] && parts[3] === "export.md") {
        const review = getStructuredReview(db, parts[2]);
        const exported = buildReviewExport(getCovenant(db, review.covenantId), review, listAuditEvents(db, review.id));
        return send(response, 200, toReviewMarkdown(exported), "text/markdown; charset=utf-8");
      }
      if (request.method === "GET" && parts[0] === "api" && parts[1] === "reviews" && parts[2]) {
        return sendJson(response, 200, { review: getStructuredReview(db, parts[2]) });
      }
      if (request.method === "PATCH" && parts[0] === "api" && parts[1] === "reviews" && parts[2]) {
        const body = await readJson(request) as { draft?: unknown; updatedAt?: unknown };
        const draft = body.draft && typeof body.draft === "object" && !Array.isArray(body.draft) ? body.draft : body;
        return sendJson(response, 200, { review: updateStructuredReview(db, parts[2], draft as ReviewDraft, typeof body.updatedAt === "string" ? body.updatedAt : new Date().toISOString()) });
      }
      if (request.method === "POST" && parts[0] === "api" && parts[1] === "reviews" && parts[2] && parts[3] === "complete") {
        const body = await readJson(request) as ReviewCompletionInput & { completedAt?: unknown };
        const { completedAt, ...completion } = body;
        return sendJson(response, 200, { review: completeStructuredReview(db, parts[2], completion, typeof completedAt === "string" ? completedAt : new Date().toISOString()) });
      }
      if (request.method === "GET" && parts[0] === "api" && parts[1] === "covenants" && parts[2] && parts[3] === "triggers" && parts[4] === "export.json") {
        const covenant = getCovenant(db, parts[2]);
        const definitions = listTriggerDefinitions(db, covenant.id);
        const exported = buildTriggerExport(covenant, definitions, definitions.map((definition) => ({ triggerId: definition.id, state: getTriggerState(db, definition.id) })), definitions.flatMap((definition) => listTriggerEvaluations(db, definition.id)), triggerAuditForCovenant(db, covenant.id));
        return send(response, 200, toTriggerJson(exported), "application/json; charset=utf-8");
      }
      if (request.method === "GET" && parts[0] === "api" && parts[1] === "covenants" && parts[2] && parts[3] === "triggers" && parts[4] === "export.md") {
        const covenant = getCovenant(db, parts[2]);
        const definitions = listTriggerDefinitions(db, covenant.id);
        const exported = buildTriggerExport(covenant, definitions, definitions.map((definition) => ({ triggerId: definition.id, state: getTriggerState(db, definition.id) })), definitions.flatMap((definition) => listTriggerEvaluations(db, definition.id)), triggerAuditForCovenant(db, covenant.id));
        return send(response, 200, toTriggerMarkdown(exported), "text/markdown; charset=utf-8");
      }
      if (request.method === "GET" && parts[0] === "api" && parts[1] === "covenants" && parts[2] && parts[3] === "triggers") {
        const definitions = listTriggerDefinitions(db, parts[2]);
        return sendJson(response, 200, { definitions, states: definitions.map((definition) => ({ triggerId: definition.id, state: getTriggerState(db, definition.id) })) });
      }
      if (request.method === "POST" && parts[0] === "api" && parts[1] === "covenants" && parts[2] && parts[3] === "triggers" && parts[4] === "evaluate") {
        const covenant = getCovenant(db, parts[2]);
        const body = await readJson(request) as { currentSnapshotId?: unknown; now?: unknown; lastCompletedReviewAt?: unknown };
        const snapshots = listSnapshots(db);
        const currentSnapshotId = typeof body.currentSnapshotId === "string" ? body.currentSnapshotId : snapshots.at(-1)?.id ?? null;
        const now = typeof body.now === "string" ? body.now : new Date().toISOString();
        const definitions = listTriggerDefinitions(db, covenant.id);
        const suppliedReviewAt = typeof body.lastCompletedReviewAt === "string" ? body.lastCompletedReviewAt : null;
        const derivedReviewAt = definitions.map((definition) => getTriggerState(db, definition.id).lastReviewAt).filter((value): value is string => Boolean(value)).sort().at(-1) ?? null;
        const evaluations = evaluateAndPersistTriggers(db, covenant.id, { now, snapshots, currentSnapshotId, covenantApprovedAt: covenant.approvedAt, lastCompletedReviewAt: suppliedReviewAt ?? derivedReviewAt })
          .map((evaluation) => ({
            triggerType: definitions.find((definition) => definition.id === evaluation.triggerId)?.type ?? evaluation.triggerId,
            ...evaluation,
          }));
        return sendJson(response, 200, { evaluations });
      }
      if (request.method === "POST" && parts[0] === "api" && parts[1] === "covenants" && parts[2] && parts[3] === "triggers") {
        const covenant = getCovenant(db, parts[2]);
        const body = await readJson(request) as { definitions?: unknown };
        if (!Array.isArray(body.definitions)) throw new Error("definitions must be an array");
        const definitions = normalizePresentedTriggerDefinitions(body.definitions) as TriggerDefinitionInput[];
        return sendJson(response, 201, { definitions: createTriggerDefinitions(db, covenant, definitions) });
      }
      if (request.method === "POST" && parts[0] === "api" && parts[1] === "triggers" && parts[2] && parts[3] === "review-complete") {
        const body = await readJson(request) as { completedAt?: unknown };
        return sendJson(response, 200, { state: completeTriggerReview(db, parts[2], typeof body.completedAt === "string" ? body.completedAt : new Date().toISOString()) });
      }
      if (request.method === "POST" && parts[0] === "api" && parts[1] === "triggers" && parts[2] && parts[3] === "acknowledge") {
        const body = await readJson(request) as { acknowledgedAt?: unknown };
        return sendJson(response, 200, { state: acknowledgeTrigger(db, parts[2], typeof body.acknowledgedAt === "string" ? body.acknowledgedAt : new Date().toISOString()) });
      }
      if (request.method === "GET" && parts[0] === "api" && parts[1] === "covenants" && parts[2] && parts[3] === "export.json") {
        const covenant = getCovenant(db, parts[2]);
        return send(response, 200, toJson(buildExport(covenant, auditForCovenant(db, covenant.id))), "application/json; charset=utf-8");
      }
      if (request.method === "GET" && parts[0] === "api" && parts[1] === "covenants" && parts[2] && parts[3] === "export.md") {
        const covenant = getCovenant(db, parts[2]);
        return send(response, 200, toMarkdown(buildExport(covenant, auditForCovenant(db, covenant.id))), "text/markdown; charset=utf-8");
      }
      if (request.method === "GET" && parts[0] === "api" && parts[1] === "covenants" && parts[2]) {
        const covenant = getCovenant(db, parts[2]);
        return sendJson(response, 200, { covenant, auditEvents: auditForCovenant(db, covenant.id) });
      }
      if (request.method === "GET" && url.pathname === "/api/covenants") {
        return sendJson(response, 200, { covenants: listCovenants(db) });
      }
      if (request.method === "POST" && url.pathname === "/api/covenants") {
        return sendJson(response, 201, { covenant: createDraft(db, await readJson(request)) });
      }
      if (request.method === "POST" && parts[0] === "api" && parts[1] === "covenants" && parts[2] && parts[3] === "approve") {
        return sendJson(response, 200, { covenant: approveDraft(db, parts[2]) });
      }
      if (request.method === "POST" && parts[0] === "api" && parts[1] === "covenants" && parts[2] && parts[3] === "supersede") {
        const predecessor = getCovenant(db, parts[2]);
        const raw = await readJson(request);
        return sendJson(response, 201, { covenant: createSuccessorDraft(db, predecessor.id, Object.keys(raw as object).length ? raw : covenantInput(predecessor)) });
      }
      return sendJson(response, 404, { error: "Not found" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unexpected error";
      const status = message === "Covenant not found" ? 404 : 400;
      return sendJson(response, status, { error: message });
    }
  });
}

export async function startServer(options: { dbPath?: string; port?: number } = {}): Promise<{ server: Server; url: string; close: () => Promise<void> }> {
  const db = openDatabase(options.dbPath);
  const server = createApp(db);
  await new Promise<void>((resolve) => server.listen(options.port ?? 0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Server did not bind to a TCP port");
  return {
    server,
    url: `http://127.0.0.1:${address.port}`,
    close: async () => {
      closeDatabase(db);
      await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    },
  };
}

if (process.argv[1]?.endsWith("server.js")) {
  const app = await startServer({ port: Number(process.env.PORT ?? 3000) });
  console.log(`Decision Covenant listening at ${app.url}`);
}
