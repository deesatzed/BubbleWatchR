import { doesNotMatch, match, strictEqual } from "node:assert/strict";
import { test } from "node:test";
import { startServer } from "../apps/web/server.js";

const draft = {
  name: "Returning-state fixture",
  purpose: "Prove the returning workspace state hook.",
  coveredExposure: "Complete saved portfolio",
  objective: "Keep the policy record deliberate.",
  timeHorizon: "5 years",
  maximumIntendedConcentration: 0.35,
  maximumTolerableDrawdown: 0.25,
  reviewRules: ["Review the configured condition"],
  candidateActions: ["Continue policy"],
  falsifiers: ["The observation is incomplete"],
  deescalationConditions: ["The condition clears"],
  reentryConditions: ["The objective remains valid"],
  cooldownPolicy: "14 days",
  notes: "UI content fixture",
};

test("first use renders the decision workspace structure without remote assets", async () => {
  const app = await startServer({ dbPath: ":memory:" });
  try {
    const html = await fetch(app.url).then((response) => response.text());
    for (const label of ["Examples", "My policy", "Observations", "Reviews", "Record"]) {
      match(html, new RegExp(`>${label}<`));
    }
    match(html, /data-product-state="first-use"/);
    doesNotMatch(html, /data-workstation-summary/);
    match(html, /data-builder hidden/);
    match(html, /mobile-starting-point/);
    match(html, /prefers-reduced-motion: reduce/);
    match(html, /seed de857c1a/);
    match(html, /data-example-card/g);
    doesNotMatch(html, /https?:\/\//);
    doesNotMatch(html, /<script[^>]+src=/);
    doesNotMatch(html, /<link[^>]+href=/);
    const font = await fetch(`${app.url}/assets/fonts/manrope-variable.ttf`);
    strictEqual(font.status, 200);
    strictEqual(font.headers.get("content-type"), "font/ttf");
  } finally {
    await app.close();
  }
});

test("saved personal data switches the surface to its returning state hook", async () => {
  const app = await startServer({ dbPath: ":memory:" });
  try {
    const response = await fetch(`${app.url}/api/covenants`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(draft),
    });
    match(String(response.status), /201/);
    const html = await fetch(app.url).then((result) => result.text());
    match(html, /data-product-state="returning"/);
    match(html, /data-workstation-summary/);
    match(html, />Review the draft</);
    match(html, /Explore another starting point/);
    doesNotMatch(html, /Make the decision process before the moment gets loud/);
  } finally {
    await app.close();
  }
});

test("returning summary uses only enabled definitions on the current covenant version", async () => {
  const app = await startServer({ dbPath: ":memory:" });
  const scheduled = (scheduledAt: string, enabled = true) => ({
    type: "scheduled_review",
    enabled,
    entryThreshold: null,
    exitThreshold: null,
    persistenceObservations: 1,
    clearingPersistenceObservations: 1,
    cooldownMs: 1_209_600_000,
    severity: "normal",
    missingDataPolicy: "hold_prior_state",
    reviewInstructions: "Review on the recorded schedule.",
    settings: { scheduledAt, timezone: "America/New_York" },
  });
  const disabledAi = {
    type: "ai_exposure",
    enabled: false,
    entryThreshold: 0.4,
    exitThreshold: 0.35,
    persistenceObservations: 2,
    clearingPersistenceObservations: 2,
    cooldownMs: 1_209_600_000,
    severity: "normal",
    missingDataPolicy: "hold_prior_state",
    reviewInstructions: "Disabled historical setup.",
    settings: {},
  };
  try {
    const create = await fetch(`${app.url}/api/covenants`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(draft) }).then((response) => response.json());
    const v1 = await fetch(`${app.url}/api/covenants/${create.covenant.id}/approve`, { method: "POST" }).then((response) => response.json());
    await fetch(`${app.url}/api/covenants/${v1.covenant.id}/triggers`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ definitions: [scheduled("2026-09-01T13:00:00.000Z")] }) });

    const successor = await fetch(`${app.url}/api/covenants/${v1.covenant.id}/supersede`, { method: "POST", headers: { "content-type": "application/json" }, body: "{}" }).then((response) => response.json());
    const v2 = await fetch(`${app.url}/api/covenants/${successor.covenant.id}/approve`, { method: "POST" }).then((response) => response.json());
    const currentDefinitions = await fetch(`${app.url}/api/covenants/${v2.covenant.id}/triggers`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ definitions: [scheduled("2026-10-01T13:00:00.000Z"), disabledAi] }) });
    strictEqual(currentDefinitions.status, 201);

    const html = await fetch(app.url).then((response) => response.text());
    const summary = html.match(/<section class="workstation-summary"[\s\S]*?<\/section>/)?.[0] ?? "";
    match(summary, /Approved · version 2/);
    match(summary, /1 unavailable/);
    match(summary, /2026-10-01T13:00:00.000Z/);
    doesNotMatch(summary, /2026-09-01/);
    strictEqual(summary.includes("2 normal"), false);
  } finally {
    await app.close();
  }
});
