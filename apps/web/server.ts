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
import { buildExport, buildTriggerExport, toCalculationCollectionJson, toCalculationCollectionMarkdown, toCalculationJson, toCalculationMarkdown, toJson, toMarkdown, toTriggerJson, toTriggerMarkdown } from "../../packages/export/serializers.js";
import { createSnapshot, getSnapshot, importCsv, listSnapshots } from "../../packages/snapshots/store.js";
import type { PortfolioSnapshot } from "../../packages/snapshots/types.js";
import { acknowledgeTrigger, completeTriggerReview, createTriggerDefinitions, evaluateAndPersistTriggers, getTriggerState, listTriggerDefinitions, listTriggerEvaluations } from "../../packages/triggers/store.js";
import type { TriggerDefinitionInput } from "../../packages/triggers/types.js";

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

async function readJson(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) chunks.push(Buffer.from(chunk));
  if (chunks.length === 0) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8")) as unknown;
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
    return `<form data-trigger-form data-covenant-id="${escapeHtml(covenant.id)}">
      <h3>Define the seven review triggers</h3>
      <label for="trigger-definitions-${escapeHtml(covenant.id)}">Trigger definitions as JSON</label>
      <textarea id="trigger-definitions-${escapeHtml(covenant.id)}" required>[]</textarea>
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

function page(db: ReturnType<typeof openDatabase>): string {
  const covenants = listCovenants(db);
  const snapshots = listSnapshots(db);
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
      <details><summary>Audit history</summary><pre>${escapeHtml(JSON.stringify(auditForCovenant(db, covenant.id), null, 2))}</pre></details>
    </article>`).join("\n");
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Decision Covenant</title>
<style>
  :root { color-scheme: light; font-family: system-ui, sans-serif; line-height: 1.45; }
  body { max-width: 960px; margin: 0 auto; padding: 2rem 1rem; color: #202124; background: #f7f8fa; }
  h1 { margin-bottom: .25rem; } .notice { background: #fff8e1; padding: .8rem; border-left: 4px solid #b26a00; }
  form, .card { background: white; border: 1px solid #d7dbe0; border-radius: .5rem; padding: 1rem; margin: 1rem 0; }
  label { display: block; font-weight: 650; margin-top: .75rem; } input, textarea { box-sizing: border-box; width: 100%; padding: .55rem; margin-top: .25rem; border: 1px solid #8a9199; border-radius: .25rem; font: inherit; }
  textarea { min-height: 4rem; } button, a { display: inline-block; margin: .6rem .6rem .1rem 0; padding: .55rem .75rem; border-radius: .25rem; font: inherit; } button { border: 1px solid #153e75; background: #153e75; color: white; cursor: pointer; } a { color: #153e75; }
  .meta { color: #515861; } pre { overflow: auto; background: #f1f3f5; padding: .75rem; } #status { min-height: 1.5rem; font-weight: 600; }
</style></head><body>
<header><h1>Decision Covenant</h1><p>Write a policy while calm, then review it when your predefined conditions occur.</p></header>
<p class="notice">This local application records your policy and deterministic arithmetic. It does not provide investment advice or execute trades.</p>
<main>
<section aria-labelledby="create-heading"><h2 id="create-heading">Create a covenant draft</h2>
<form id="covenant-form">
  <label for="name">Policy name</label><input id="name" name="name" required>
  <label for="purpose">Purpose</label><textarea id="purpose" name="purpose" required></textarea>
  <label for="coveredExposure">Covered exposure</label><input id="coveredExposure" name="coveredExposure" required>
  <label for="objective">Objective</label><textarea id="objective" name="objective" required></textarea>
  <label for="timeHorizon">Time horizon</label><input id="timeHorizon" name="timeHorizon" required>
  <label for="maximumIntendedConcentration">Maximum intended concentration (0–1)</label><input id="maximumIntendedConcentration" name="maximumIntendedConcentration" type="number" min="0" max="1" step="0.01" required>
  <label for="maximumTolerableDrawdown">Maximum tolerable drawdown (0–1)</label><input id="maximumTolerableDrawdown" name="maximumTolerableDrawdown" type="number" min="0" max="1" step="0.01" required>
  <label for="reviewRules">Review rules (one per line)</label><textarea id="reviewRules" name="reviewRules" required></textarea>
  <label for="candidateActions">Candidate actions (one per line)</label><textarea id="candidateActions" name="candidateActions" required></textarea>
  <label for="falsifiers">Falsifiers (one per line)</label><textarea id="falsifiers" name="falsifiers"></textarea>
  <label for="deescalationConditions">De-escalation conditions (one per line)</label><textarea id="deescalationConditions" name="deescalationConditions"></textarea>
  <label for="reentryConditions">Re-entry conditions (one per line)</label><textarea id="reentryConditions" name="reentryConditions"></textarea>
  <label for="cooldownPolicy">Cooldown policy</label><input id="cooldownPolicy" name="cooldownPolicy" required>
  <label for="notes">Notes</label><textarea id="notes" name="notes"></textarea>
  <button type="submit">Save draft</button>
</form><p id="status" role="status" aria-live="polite"></p><p id="trigger-status" role="status" aria-live="polite"></p></section>
<section aria-labelledby="snapshot-heading"><h2 id="snapshot-heading">Portfolio snapshots</h2>
<p>Snapshots are immutable source records. Missing AI classifications remain unknown.</p>
<form id="manual-snapshot-form">
  <h3>Enter a snapshot manually</h3>
  <label for="manual-as-of">As of</label><input id="manual-as-of" type="date" required>
  <label for="manual-portfolio-name">Portfolio name</label><input id="manual-portfolio-name" required>
  <label for="manual-source">Source</label><input id="manual-source" value="manual entry" required>
  <label for="manual-positions">Positions as JSON</label><textarea id="manual-positions" required>[{"assetId":"example","symbolOrName":"Example","quantity":1,"price":100,"aiExposureFraction":null,"accountGroup":"main"}]</textarea>
  <button type="submit">Save manual snapshot</button>
</form>
<form id="csv-snapshot-form">
  <h3>Import a CSV snapshot</h3>
  <label for="csv-source">Source reference</label><input id="csv-source" value="user CSV import">
  <label for="csv-data">CSV data</label><textarea id="csv-data" required>as_of,portfolio_name,asset_id,symbol_or_name,quantity,price,market_value,ai_exposure_fraction,account_group
2026-01-01,Example Portfolio,example,Example,1,100,,,main</textarea>
  <button type="submit">Import CSV snapshot</button>
</form><p id="snapshot-status" role="status" aria-live="polite"></p></section>
<section aria-labelledby="snapshot-history-heading"><h2 id="snapshot-history-heading">Saved calculations</h2>${snapshots.map((snapshot) => snapshotCard(snapshot, snapshots)).join("\n") || "<p>No portfolio snapshots yet.</p>"}
<p><a href="/api/snapshots/export.md">Export all calculations Markdown</a> <a href="/api/snapshots/export.json">Export all calculations JSON</a></p></section>
<section aria-labelledby="history-heading"><h2 id="history-heading">Saved covenant versions</h2>${cards || "<p>No covenant drafts yet.</p>"}</section>
</main>
<script>
  const fields = ['name','purpose','coveredExposure','objective','timeHorizon','maximumIntendedConcentration','maximumTolerableDrawdown','reviewRules','candidateActions','falsifiers','deescalationConditions','reentryConditions','cooldownPolicy','notes'];
  const lines = new Set(['reviewRules','candidateActions','falsifiers','deescalationConditions','reentryConditions']);
  const formData = () => Object.fromEntries(fields.map((field) => {
    const value = document.getElementById(field).value;
    return [field, lines.has(field) ? value.split('\\n').map((item) => item.trim()).filter(Boolean) : (field.includes('Concentration') || field.includes('Drawdown') ? Number(value) : value)];
  }));
  async function request(url, options) {
    const response = await fetch(url, options);
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error || 'Request failed');
    return body;
  }
  document.getElementById('covenant-form').addEventListener('submit', async (event) => {
    event.preventDefault(); document.getElementById('status').textContent = 'Saving draft…';
    try { await request('/api/covenants', { method: 'POST', headers: {'content-type':'application/json'}, body: JSON.stringify(formData()) }); location.reload(); }
    catch (error) { document.getElementById('status').textContent = error.message; }
  });
  document.querySelectorAll('[data-action="approve"], [data-action="successor"]').forEach((button) => button.addEventListener('click', async () => {
    const id = button.dataset.id; const action = button.dataset.action; button.disabled = true;
    try { await request('/api/covenants/' + id + '/' + (action === 'approve' ? 'approve' : 'supersede'), { method: 'POST', headers: {'content-type':'application/json'}, body: action === 'supersede' ? JSON.stringify({}) : undefined }); location.reload(); }
    catch (error) { document.getElementById('status').textContent = error.message; button.disabled = false; }
  }));
  document.querySelectorAll('[data-trigger-form]').forEach((form) => form.addEventListener('submit', async (event) => {
    event.preventDefault(); document.getElementById('trigger-status').textContent = 'Saving trigger definitions…';
    try {
      const covenantId = form.dataset.covenantId;
      const definitions = JSON.parse(form.querySelector('textarea').value);
      await request('/api/covenants/' + covenantId + '/triggers', { method: 'POST', headers: {'content-type':'application/json'}, body: JSON.stringify({ definitions }) });
      location.reload();
    } catch (error) { document.getElementById('trigger-status').textContent = error.message; }
  }));
  document.querySelectorAll('[data-action="evaluate-triggers"]').forEach((button) => button.addEventListener('click', async () => {
    document.getElementById('trigger-status').textContent = 'Evaluating triggers…';
    try {
      const result = await request('/api/covenants/' + button.dataset.id + '/triggers/evaluate', { method: 'POST', headers: {'content-type':'application/json'}, body: JSON.stringify({}) });
      document.getElementById('trigger-status').textContent = 'Trigger evaluation complete: ' + result.evaluations.map((item) => item.triggerType + ' ' + item.metric.status + (item.metric.details?.reason ? ' ' + item.metric.details.reason : '')).join('; ');
    } catch (error) { document.getElementById('trigger-status').textContent = error.message; }
  }));
  document.querySelectorAll('[data-action="complete-trigger-review"]').forEach((button) => button.addEventListener('click', async () => {
    try { await request('/api/triggers/' + button.dataset.id + '/review-complete', { method: 'POST', headers: {'content-type':'application/json'}, body: JSON.stringify({}) }); document.getElementById('trigger-status').textContent = 'Review completed; cooldown active.'; }
    catch (error) { document.getElementById('trigger-status').textContent = error.message; }
  }));
  document.querySelectorAll('[data-action="acknowledge-trigger"]').forEach((button) => button.addEventListener('click', async () => {
    try { await request('/api/triggers/' + button.dataset.id + '/acknowledge', { method: 'POST', headers: {'content-type':'application/json'}, body: JSON.stringify({}) }); document.getElementById('trigger-status').textContent = 'Trigger acknowledged.'; }
    catch (error) { document.getElementById('trigger-status').textContent = error.message; }
  }));
  document.getElementById('manual-snapshot-form').addEventListener('submit', async (event) => {
    event.preventDefault(); document.getElementById('snapshot-status').textContent = 'Saving snapshot…';
    try {
      const positions = JSON.parse(document.getElementById('manual-positions').value);
      await request('/api/snapshots/manual', { method: 'POST', headers: {'content-type':'application/json'}, body: JSON.stringify({ asOf: document.getElementById('manual-as-of').value, portfolioName: document.getElementById('manual-portfolio-name').value, source: 'manual', sourceReference: document.getElementById('manual-source').value, positions }) });
      location.reload();
    } catch (error) { document.getElementById('snapshot-status').textContent = error.message; }
  });
  document.getElementById('csv-snapshot-form').addEventListener('submit', async (event) => {
    event.preventDefault(); document.getElementById('snapshot-status').textContent = 'Importing CSV…';
    try {
      await request('/api/snapshots/import', { method: 'POST', headers: {'content-type':'application/json'}, body: JSON.stringify({ csv: document.getElementById('csv-data').value, sourceReference: document.getElementById('csv-source').value }) });
      location.reload();
    } catch (error) { document.getElementById('snapshot-status').textContent = error.message; }
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
        return sendJson(response, 201, { definitions: createTriggerDefinitions(db, covenant, body.definitions as TriggerDefinitionInput[]) });
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
