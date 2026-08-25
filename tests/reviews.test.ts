import { deepStrictEqual, equal, match, strictEqual, throws } from "node:assert/strict";
import { test } from "node:test";
import { closeDatabase, listAuditEvents, openDatabase } from "../packages/audit/store.js";
import { approveDraft, createDraft } from "../packages/domain/lifecycle.js";
import { createSnapshot } from "../packages/snapshots/store.js";
import { completeTriggerReview, createTriggerDefinitions, evaluateAndPersistTrigger, getTriggerState, listTriggerEvaluations } from "../packages/triggers/store.js";
import type { TriggerDefinitionInput } from "../packages/triggers/types.js";
import {
  completeStructuredReview,
  getStructuredReview,
  listStructuredReviews,
  openStructuredReview,
  replayStructuredReview,
  updateStructuredReview,
} from "../packages/reviews/store.js";
import type { ReviewCompletionInput } from "../packages/reviews/types.js";

function covenantInput() {
  return {
    name: "Review Workflow Covenant",
    purpose: "Record deliberate review decisions.",
    coveredExposure: "Saved portfolio observations",
    objective: "Preserve a written policy.",
    timeHorizon: "10 years",
    maximumIntendedConcentration: 0.35,
    maximumTolerableDrawdown: 0.25,
    reviewRules: ["Review active conditions"],
    candidateActions: ["Review the policy"],
    falsifiers: ["The observation is stale"],
    deescalationConditions: ["The condition clears"],
    reentryConditions: ["The policy remains valid"],
    cooldownPolicy: "14 days",
    notes: "Review fixture",
  };
}

function triggerInput(): TriggerDefinitionInput {
  return {
    type: "single_position_concentration",
    enabled: true,
    entryThreshold: 0.35,
    exitThreshold: 0.32,
    persistenceObservations: 1,
    clearingPersistenceObservations: 1,
    cooldownMs: 14 * 86_400_000,
    severity: "normal",
    missingDataPolicy: "hold_prior_state",
    reviewInstructions: "Review the predefined condition.",
    settings: {},
  };
}

function completion(overrides: Partial<ReviewCompletionInput> = {}): ReviewCompletionInput {
  return {
    factualObservations: "The saved snapshot shows the position above the entry threshold.",
    falsifierCheck: "I checked whether the snapshot was stale or malformed; it was not.",
    decision: "continue_policy",
    rationale: "The policy remains deliberate and the observed condition is documented.",
    ...overrides,
  };
}

test("opens only for active triggers and captures immutable review context", () => {
  const db = openDatabase(":memory:");
  try {
    const draft = createDraft(db, covenantInput());
    const covenant = approveDraft(db, draft.id);
    const [definition] = createTriggerDefinitions(db, covenant, [triggerInput()]);
    const current = createSnapshot(db, {
      asOf: "2026-08-01",
      portfolioName: "Review Portfolio",
      source: "manual",
      sourceReference: "review-fixture",
      positions: [
        { assetId: "alpha", symbolOrName: "Alpha", quantity: 1, price: 80, aiExposureFraction: 0, accountGroup: "main" },
        { assetId: "beta", symbolOrName: "Beta", quantity: 1, price: 20, aiExposureFraction: 0, accountGroup: "main" },
      ],
    });
    const evaluation = evaluateAndPersistTrigger(db, definition!.id, {
      now: "2026-08-01T00:00:00.000Z",
      snapshots: [current],
      currentSnapshotId: current.id,
      covenantApprovedAt: covenant.approvedAt,
      lastCompletedReviewAt: null,
    });
    equal(evaluation.stateAfter.state, "review");
    const review = openStructuredReview(db, covenant.id, [definition!.id], "2026-08-02T00:00:00.000Z");
    equal(review.status, "open");
    equal(review.covenantVersion, covenant.version);
    deepStrictEqual(review.triggerIds, [definition!.id]);
    equal(review.openingContext.triggerEvaluations[0]?.evaluationId, evaluation.id);
    equal(listStructuredReviews(db, covenant.id).length, 1);
    strictEqual(listAuditEvents(db, review.id).some((event) => event.eventType === "review.opened"), true);
    throws(() => openStructuredReview(db, covenant.id, [definition!.id], "2026-08-02T00:00:00.000Z"), /already has an open review/);
  } finally {
    closeDatabase(db);
  }
});

test("updates and completes a review atomically with linked trigger cooldown", () => {
  const db = openDatabase(":memory:");
  try {
    const draft = createDraft(db, covenantInput());
    const covenant = approveDraft(db, draft.id);
    const [definition] = createTriggerDefinitions(db, covenant, [triggerInput()]);
    const current = createSnapshot(db, {
      asOf: "2026-08-01",
      portfolioName: "Review Portfolio",
      source: "manual",
      sourceReference: "review-fixture",
      positions: [
        { assetId: "alpha", symbolOrName: "Alpha", quantity: 80, price: 1, aiExposureFraction: 0, accountGroup: "main" },
        { assetId: "beta", symbolOrName: "Beta", quantity: 20, price: 1, aiExposureFraction: 0, accountGroup: "main" },
      ],
    });
    evaluateAndPersistTrigger(db, definition!.id, {
      now: "2026-08-01T00:00:00.000Z",
      snapshots: [current],
      currentSnapshotId: current.id,
      covenantApprovedAt: covenant.approvedAt,
      lastCompletedReviewAt: null,
    });
    const opened = openStructuredReview(db, covenant.id, [definition!.id], "2026-08-02T00:00:00.000Z");
    const updated = updateStructuredReview(db, opened.id, { factualObservations: "Updated after checking the saved source." }, "2026-08-02T01:00:00.000Z");
    equal(updated.status, "open");
    equal(updated.draft.factualObservations, "Updated after checking the saved source.");
    const completed = completeStructuredReview(db, opened.id, completion(), "2026-08-03T00:00:00.000Z");
    equal(completed.status, "completed");
    equal(completed.completion?.decision, "continue_policy");
    equal(getTriggerState(db, definition!.id).state, "cooldown");
    equal(listTriggerEvaluations(db, definition!.id).at(-1)?.stateAfter.state, "cooldown");
    strictEqual(listAuditEvents(db, opened.id).some((event) => event.eventType === "review.updated"), true);
    strictEqual(listAuditEvents(db, opened.id).some((event) => event.eventType === "review.completed"), true);
    deepStrictEqual(replayStructuredReview(db, opened.id), getStructuredReview(db, opened.id));
    throws(() => completeStructuredReview(db, opened.id, completion(), "2026-08-04T00:00:00.000Z"), /already completed/);
    throws(() => updateStructuredReview(db, opened.id, { factualObservations: "Attempted mutation" }, "2026-08-04T00:00:00.000Z"), /completed review is immutable/);
    match(JSON.stringify(completed), /Review Workflow Covenant/);
  } finally {
    closeDatabase(db);
  }
});

test("rejects incomplete review completion without changing the open packet", () => {
  const db = openDatabase(":memory:");
  try {
    const draft = createDraft(db, covenantInput());
    const covenant = approveDraft(db, draft.id);
    const [definition] = createTriggerDefinitions(db, covenant, [triggerInput()]);
    const current = createSnapshot(db, {
      asOf: "2026-08-01",
      portfolioName: "Review Portfolio",
      source: "manual",
      sourceReference: "review-fixture",
      positions: [{ assetId: "alpha", symbolOrName: "Alpha", quantity: 1, price: 1, aiExposureFraction: 0, accountGroup: "main" }],
    });
    evaluateAndPersistTrigger(db, definition!.id, { now: "2026-08-01T00:00:00.000Z", snapshots: [current], currentSnapshotId: current.id, covenantApprovedAt: covenant.approvedAt, lastCompletedReviewAt: null });
    const review = openStructuredReview(db, covenant.id, [definition!.id], "2026-08-02T00:00:00.000Z");
    throws(() => completeStructuredReview(db, review.id, completion({ rationale: "" }), "2026-08-03T00:00:00.000Z"), /rationale is required/);
    throws(() => completeStructuredReview(db, review.id, completion({ decision: "invalid" as ReviewCompletionInput["decision"] }), "2026-08-03T00:00:00.000Z"), /decision is unsupported/);
    throws(() => completeStructuredReview(db, review.id, completion({ followUpAt: "2026-08-02T00:00:00.000Z" }), "2026-08-03T00:00:00.000Z"), /followUpAt cannot precede completion/);
    equal(getStructuredReview(db, review.id).status, "open");
    equal(getTriggerState(db, definition!.id).state, "review");
  } finally {
    closeDatabase(db);
  }
});

test("rolls back linked trigger closure when one linked trigger is no longer active", () => {
  const db = openDatabase(":memory:");
  try {
    const draft = createDraft(db, covenantInput());
    const covenant = approveDraft(db, draft.id);
    const definitions = createTriggerDefinitions(db, covenant, [
      triggerInput(),
      { ...triggerInput(), type: "ai_exposure" },
    ]);
    const current = createSnapshot(db, {
      asOf: "2026-08-01",
      portfolioName: "Review Portfolio",
      source: "manual",
      sourceReference: "review-fixture",
      positions: [
        { assetId: "alpha", symbolOrName: "Alpha", quantity: 80, price: 1, aiExposureFraction: 1, accountGroup: "main" },
        { assetId: "beta", symbolOrName: "Beta", quantity: 20, price: 1, aiExposureFraction: 0, accountGroup: "main" },
      ],
    });
    const context = { now: "2026-08-01T00:00:00.000Z", snapshots: [current], currentSnapshotId: current.id, covenantApprovedAt: covenant.approvedAt, lastCompletedReviewAt: null };
    for (const definition of definitions) evaluateAndPersistTrigger(db, definition.id, context);
    const review = openStructuredReview(db, covenant.id, definitions.map((definition) => definition.id), "2026-08-02T00:00:00.000Z");
    completeTriggerReview(db, definitions[1]!.id, "2026-08-02T01:00:00.000Z");
    throws(() => completeStructuredReview(db, review.id, completion(), "2026-08-03T00:00:00.000Z"), /only an active review/);
    equal(getStructuredReview(db, review.id).status, "open");
    equal(getTriggerState(db, definitions[0]!.id).state, "review");
  } finally {
    closeDatabase(db);
  }
});
