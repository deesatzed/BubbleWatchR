import { deepStrictEqual, equal, match, rejects, strictEqual } from "node:assert/strict";
import { test } from "node:test";
import { closeDatabase, openDatabase } from "../packages/audit/store.js";
import {
  approveDraft,
  auditForCovenant,
  createDraft,
  createSuccessorDraft,
  getCovenant,
  replayCovenant,
  validateCovenantInput,
} from "../packages/domain/lifecycle.js";
import { buildExport, toJson, toMarkdown } from "../packages/export/serializers.js";

function input(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    name: "Calm AI Exposure Policy",
    purpose: "Define a review process before market stress.",
    coveredExposure: "AI-related equity exposure",
    objective: "Preserve long-term participation within a tolerable loss boundary.",
    timeHorizon: "10 years",
    maximumIntendedConcentration: 0.35,
    maximumTolerableDrawdown: 0.25,
    reviewRules: ["Review when exposure exceeds the maximum for five observations."],
    candidateActions: ["Review current allocation", "Defer with a written reason"],
    falsifiers: ["Evidence that the concentration measurement is stale"],
    deescalationConditions: ["Exposure returns below the exit threshold"],
    reentryConditions: ["The original objective remains valid"],
    cooldownPolicy: "Fourteen days after a completed review",
    notes: "User-authored policy note.",
    ...overrides,
  };
}

test("validation rejects missing required fields and accepts a complete policy", () => {
  const invalid = validateCovenantInput({ name: "" });
  strictEqual(invalid.ok, false);
  if (!invalid.ok) match(invalid.errors.join("\n"), /purpose is required/);
  const valid = validateCovenantInput(input());
  strictEqual(valid.ok, true);
});

test("approval locks a covenant and preserves its prior serialized record", async () => {
  const db = openDatabase(":memory:");
  try {
    const draft = createDraft(db, input());
    const before = db.prepare("SELECT data, status, approved_at FROM covenants WHERE id = ?").get(draft.id);
    const approved = approveDraft(db, draft.id);
    const after = db.prepare("SELECT data, status, approved_at FROM covenants WHERE id = ?").get(draft.id);
    equal(approved.status, "approved");
    equal((before as { data: string }).data, (after as { data: string }).data);
    equal((after as { status: string }).status, "approved");
    await rejects(async () => approveDraft(db, draft.id), /Only a draft covenant can be approved/);
  } finally {
    closeDatabase(db);
  }
});

test("successor creation preserves the approved version and records an audit relationship", () => {
  const db = openDatabase(":memory:");
  try {
    const first = approveDraft(db, createDraft(db, input()).id);
    const successor = createSuccessorDraft(db, first.id, input({ name: "Calm AI Exposure Policy v2" }));
    equal(successor.version, 2);
    equal(successor.supersedesId, first.id);
    equal(getCovenant(db, first.id).status, "approved");
    const events = auditForCovenant(db, first.id);
    strictEqual(events.some((event) => event.eventType === "covenant.superseded"), true);
  } finally {
    closeDatabase(db);
  }
});

test("audit replay reconstructs the approved state and exports retain provenance", () => {
  const db = openDatabase(":memory:");
  try {
    const approved = approveDraft(db, createDraft(db, input()).id);
    const replayed = replayCovenant(db, approved.id);
    deepStrictEqual(replayed, approved);
    const exported = buildExport(approved, auditForCovenant(db, approved.id));
    const json = toJson(exported);
    const markdown = toMarkdown(exported);
    match(json, /"version": 1/);
    match(json, /"approvedAt":/);
    match(json, /"auditEvents":/);
    match(markdown, /## Audit events/);
    match(markdown, /Approved:/);
  } finally {
    closeDatabase(db);
  }
});
