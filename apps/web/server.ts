import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import { URL } from "node:url";
import { closeDatabase, openDatabase } from "../../packages/audit/store.js";
import {
  approveDraft,
  auditForCovenant,
  createDraft,
  createSuccessorDraft,
  getCovenant,
  listCovenants,
} from "../../packages/domain/lifecycle.js";
import type { Covenant } from "../../packages/domain/types.js";
import { buildExport, toJson, toMarkdown } from "../../packages/export/serializers.js";

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

function page(db: ReturnType<typeof openDatabase>): string {
  const covenants = listCovenants(db);
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
</form><p id="status" role="status" aria-live="polite"></p></section>
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
  document.querySelectorAll('[data-action]').forEach((button) => button.addEventListener('click', async () => {
    const id = button.dataset.id; const action = button.dataset.action; button.disabled = true;
    try { await request('/api/covenants/' + id + '/' + (action === 'approve' ? 'approve' : 'supersede'), { method: 'POST', headers: {'content-type':'application/json'}, body: action === 'supersede' ? JSON.stringify({}) : undefined }); location.reload(); }
    catch (error) { document.getElementById('status').textContent = error.message; button.disabled = false; }
  }));
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
