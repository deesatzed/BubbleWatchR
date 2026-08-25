import { deepStrictEqual, equal, match, strictEqual } from "node:assert/strict";
import { rmSync } from "node:fs";
import { test } from "node:test";
import { createDraft, approveDraft } from "../packages/domain/lifecycle.js";
import { createSnapshot } from "../packages/snapshots/store.js";
import { closeDatabase, listAuditEvents, openDatabase } from "../packages/audit/store.js";
import {
  calculateTriggerMetric,
  transitionTrigger,
  validateTriggerDefinition,
} from "../packages/triggers/engine.js";
import {
  completeTriggerReview,
  createTriggerDefinitions,
  evaluateAndPersistTrigger,
  evaluateAndPersistTriggers,
  getTriggerState,
  listTriggerEvaluations,
  listTriggerDefinitions,
  replayTriggerState,
  acknowledgeTrigger,
} from "../packages/triggers/store.js";
import type {
  TriggerDefinitionInput,
  TriggerEvaluationContext,
  TriggerState,
} from "../packages/triggers/types.js";

const DAY = 86_400_000;

function definition(type: TriggerDefinitionInput["type"], overrides: Partial<TriggerDefinitionInput> = {}): TriggerDefinitionInput {
  const defaultSettings: Record<string, unknown> = type === "scheduled_review"
    ? { scheduledAt: "2026-03-03T00:00:00.000Z", timezone: "UTC" }
    : type === "overdue_review"
      ? { reviewIntervalMs: 60 * DAY, timezone: "UTC", reviewClock: "approval" }
      : {};
  const { settings: overrideSettings, ...otherOverrides } = overrides;
  return {
    type,
    enabled: true,
    entryThreshold: 0.35,
    exitThreshold: 0.32,
    persistenceObservations: 2,
    clearingPersistenceObservations: 2,
    cooldownMs: 14 * DAY,
    severity: "normal",
    missingDataPolicy: "hold_prior_state",
    reviewInstructions: "Review the predefined condition.",
    ...otherOverrides,
    settings: { ...defaultSettings, ...(overrideSettings ?? {}) },
  };
}

function snapshot(db: ReturnType<typeof openDatabase>, asOf: string, values: Array<{ assetId: string; quantity: number; price: number; aiExposureFraction: number | null }>) {
  return createSnapshot(db, {
    asOf,
    portfolioName: "Trigger Portfolio",
    source: "manual",
    sourceReference: "trigger-fixture",
    positions: values.map((value) => ({
      ...value,
      symbolOrName: value.assetId.toUpperCase(),
      accountGroup: "main",
    })),
  });
}

function context(overrides: Partial<TriggerEvaluationContext> = {}): TriggerEvaluationContext {
  return {
    now: "2026-03-03T00:00:00.000Z",
    snapshots: [],
    currentSnapshotId: null,
    covenantApprovedAt: "2026-01-01T00:00:00.000Z",
    lastCompletedReviewAt: null,
    ...overrides,
  };
}

function covenantInput() {
  return {
    name: "Trigger Covenant",
    purpose: "Review defined portfolio conditions.",
    coveredExposure: "Saved portfolio observations",
    objective: "Preserve deliberate decisions.",
    timeHorizon: "10 years",
    maximumIntendedConcentration: 0.35,
    maximumTolerableDrawdown: 0.25,
    reviewRules: ["Review any confirmed trigger"],
    candidateActions: ["Review the policy"],
    falsifiers: ["The observation is invalid"],
    deescalationConditions: ["The condition clears"],
    reentryConditions: ["The policy remains valid"],
    cooldownPolicy: "14 days",
    notes: "Trigger persistence fixture",
  };
}

test("validates all seven trigger definitions and rejects unsafe settings", () => {
  const types: TriggerDefinitionInput["type"][] = [
    "ai_exposure",
    "single_position_concentration",
    "trailing_drawdown",
    "trailing_volatility",
    "appreciation_concentration",
    "scheduled_review",
    "overdue_review",
  ];
  for (const type of types) strictEqual(validateTriggerDefinition(definition(type)).ok, true);
  const invalid = validateTriggerDefinition(definition("trailing_volatility", {
    settings: { lookbackObservations: 1, annualizationFactor: -1 },
  }));
  strictEqual(invalid.ok, false);
  if (!invalid.ok) match(invalid.errors.join("\n"), /annualizationFactor|lookback/);
  const invalidPolicy = validateTriggerDefinition(definition("single_position_concentration", {
    exitThreshold: 0.4,
    severity: "unsafe" as TriggerDefinitionInput["severity"],
    missingDataPolicy: "ignore" as TriggerDefinitionInput["missingDataPolicy"],
  }));
  strictEqual(invalidPolicy.ok, false);
  if (!invalidPolicy.ok) match(invalidPolicy.errors.join("\n"), /severity|missingDataPolicy|exitThreshold/);
});

test("evaluates AI exposure, concentration, and drawdown without treating unknown as zero", () => {
  const db = openDatabase(":memory:");
  try {
    const current = snapshot(db, "2026-03-01", [
      { assetId: "alpha", quantity: 1, price: 450, aiExposureFraction: null },
      { assetId: "beta", quantity: 1, price: 450, aiExposureFraction: 0 },
    ]);
    const prior = snapshot(db, "2026-02-01", [
      { assetId: "alpha", quantity: 1, price: 600, aiExposureFraction: 1 },
      { assetId: "beta", quantity: 1, price: 400, aiExposureFraction: 0 },
    ]);
    const currentContext = context({ snapshots: [prior, current], currentSnapshotId: current.id });
    const ai = calculateTriggerMetric(definition("ai_exposure"), currentContext);
    strictEqual(ai.status, "unavailable");
    strictEqual(ai.observedValue, null);
    const concentration = calculateTriggerMetric(definition("single_position_concentration"), currentContext);
    equal(concentration.observedValue, 0.5);
    strictEqual(concentration.details.positionKey, "alpha\u0000main");
    const drawdown = calculateTriggerMetric(definition("trailing_drawdown"), currentContext);
    equal(drawdown.observedValue, -0.1);
    strictEqual(drawdown.details.referenceHighSnapshotId, prior.id);
  } finally {
    closeDatabase(db);
  }
});

test("evaluates volatility and appreciation-driven concentration from saved snapshots", () => {
  const db = openDatabase(":memory:");
  try {
    const first = snapshot(db, "2026-01-01", [
      { assetId: "alpha", quantity: 1, price: 100, aiExposureFraction: 0 },
      { assetId: "beta", quantity: 1, price: 100, aiExposureFraction: 0 },
    ]);
    const second = snapshot(db, "2026-02-01", [
      { assetId: "alpha", quantity: 1, price: 120, aiExposureFraction: 0 },
      { assetId: "beta", quantity: 1, price: 100, aiExposureFraction: 0 },
    ]);
    const third = snapshot(db, "2026-03-01", [
      { assetId: "alpha", quantity: 1, price: 150, aiExposureFraction: 0 },
      { assetId: "beta", quantity: 1, price: 100, aiExposureFraction: 0 },
    ]);
    const currentContext = context({ snapshots: [first, second, third], currentSnapshotId: third.id });
    const volatility = calculateTriggerMetric(definition("trailing_volatility", {
      settings: { lookbackObservations: 2, annualizationFactor: 1 },
    }), currentContext);
    equal(volatility.status, "available");
    equal(volatility.details.returnCount, 2);
    strictEqual(typeof volatility.observedValue, "number");
    const nonConsecutive = calculateTriggerMetric(definition("trailing_volatility", {
      settings: { lookbackObservations: 2, annualizationFactor: 1, returnIntervalMs: 31 * DAY },
    }), currentContext);
    equal(nonConsecutive.status, "unavailable");
    match(String(nonConsecutive.details.reason), /non-consecutive/);
    const appreciation = calculateTriggerMetric(definition("appreciation_concentration"), context({
      snapshots: [second, third],
      currentSnapshotId: third.id,
    }));
    equal(appreciation.status, "available");
    strictEqual(appreciation.details.positionKey, "alpha\u0000main");
    strictEqual(typeof appreciation.details.appreciationContribution, "number");
  } finally {
    closeDatabase(db);
  }
});

test("evaluates scheduled and overdue review timestamps inclusively", () => {
  const scheduled = calculateTriggerMetric(definition("scheduled_review", {
    settings: { scheduledAt: "2026-03-03T00:00:00.000Z", timezone: "UTC" },
  }), context());
  equal(scheduled.status, "available");
  equal(scheduled.observedValue, 1);
  const overdue = calculateTriggerMetric(definition("overdue_review", {
    settings: { reviewIntervalMs: 60 * DAY, timezone: "UTC", reviewClock: "approval" },
  }), context());
  equal(overdue.status, "available");
  equal(overdue.observedValue, 1);
});

test("keeps missing data unavailable, preserves prior state, and respects threshold boundaries", () => {
  const boundary = calculateTriggerMetric(definition("single_position_concentration", { entryThreshold: 0.5 }), context({
    snapshots: [],
    currentSnapshotId: null,
  }));
  strictEqual(boundary.status, "unavailable");
  const thresholdDefinition = definition("single_position_concentration", { entryThreshold: 0.5, persistenceObservations: 2 });
  const normal: TriggerState = { state: "normal", qualifyingObservations: 0, clearingObservations: 0, cooldownUntil: null, lastReviewAt: null };
  equal(transitionTrigger(thresholdDefinition, normal, { status: "available", observedValue: 0.5, condition: false, details: {}, inputSnapshotIds: [] }, "2026-03-03T00:00:00.000Z").state, "normal");
  equal(transitionTrigger(thresholdDefinition, normal, { status: "available", observedValue: 0.5001, condition: true, details: {}, inputSnapshotIds: [] }, "2026-03-03T00:00:00.000Z").state, "watch");
  const prior: TriggerState = { state: "review", qualifyingObservations: 2, clearingObservations: 0, cooldownUntil: null, lastReviewAt: null };
  const held = transitionTrigger(definition("ai_exposure"), prior, { status: "unavailable", observedValue: null, condition: null, details: { reason: "unknown" }, inputSnapshotIds: [] }, "2026-03-03T00:00:00.000Z");
  deepStrictEqual(held, prior);
});

test("escalates critical conditions and allows escalated review completion", () => {
  const critical = definition("single_position_concentration", { severity: "critical", persistenceObservations: 1 });
  const normal: TriggerState = { state: "normal", qualifyingObservations: 0, clearingObservations: 0, cooldownUntil: null, lastReviewAt: null };
  const escalated = transitionTrigger(critical, normal, { status: "available", observedValue: 0.6, condition: true, details: {}, inputSnapshotIds: [] }, "2026-03-03T00:00:00.000Z");
  equal(escalated.state, "escalated_review");
  const completed = transitionTrigger(critical, escalated, { status: "available", observedValue: 0, condition: false, details: {}, inputSnapshotIds: [] }, "2026-03-04T00:00:00.000Z", { completedReviewAt: "2026-03-04T00:00:00.000Z" });
  equal(completed.state, "cooldown");
});

test("allows an explicitly configured emergency threshold to bypass cooldown", () => {
  const definitionWithEmergency = definition("single_position_concentration", { emergencyThreshold: 0.6 });
  const cooldown: TriggerState = { state: "cooldown", qualifyingObservations: 0, clearingObservations: 0, cooldownUntil: "2026-03-10T00:00:00.000Z", lastReviewAt: "2026-03-01T00:00:00.000Z" };
  const emergency = transitionTrigger(definitionWithEmergency, cooldown, { status: "available", observedValue: 0.7, condition: true, details: {}, inputSnapshotIds: [] }, "2026-03-03T00:00:00.000Z");
  equal(emergency.state, "escalated_review");
  strictEqual(emergency.cooldownUntil, null);
});

test("escalates independently active conditions when evaluated together", () => {
  const trigger = definition("single_position_concentration", { persistenceObservations: 3 });
  const metric = { status: "available" as const, observedValue: 0.5, condition: true, details: {}, inputSnapshotIds: [] };
  const next = transitionTrigger(trigger, { state: "normal", qualifyingObservations: 0, clearingObservations: 0, cooldownUntil: null, lastReviewAt: null }, metric, "2026-01-01T00:00:00.000Z", { activeTriggerCount: 2 });
  equal(next.state, "escalated_review");
});

test("aggregate persistence escalates two active trigger definitions", () => {
  const db = openDatabase(":memory:");
  try {
    const draft = createDraft(db, covenantInput());
    const covenant = approveDraft(db, draft.id);
    const definitions = createTriggerDefinitions(db, covenant, [
      definition("ai_exposure", { persistenceObservations: 3 }),
      definition("single_position_concentration", { persistenceObservations: 3 }),
    ]);
    const current = snapshot(db, "2026-01-01", [
      { assetId: "alpha", quantity: 1, price: 800, aiExposureFraction: 0.8 },
      { assetId: "beta", quantity: 1, price: 200, aiExposureFraction: 0.2 },
    ]);
    const evaluations = evaluateAndPersistTriggers(db, covenant.id, context({ snapshots: [current], currentSnapshotId: current.id, now: "2026-01-01T00:00:00.000Z" }));
    equal(evaluations.length, definitions.length);
    for (const evaluation of evaluations) equal(evaluation.stateAfter.state, "escalated_review");
  } finally {
    closeDatabase(db);
  }
});

test("requires current and prior prices for appreciation attribution", () => {
  const db = openDatabase(":memory:");
  try {
    const prior = snapshot(db, "2026-01-01", [
      { assetId: "alpha", quantity: 1, price: 100, aiExposureFraction: 0 },
      { assetId: "beta", quantity: 1, price: 100, aiExposureFraction: 0 },
    ]);
    const current = createSnapshot(db, {
      asOf: "2026-02-01",
      portfolioName: "Trigger Portfolio",
      source: "csv",
      sourceReference: "missing-price",
      positions: [
        { assetId: "alpha", symbolOrName: "ALPHA", quantity: 1, price: null, marketValue: 150, accountGroup: "main" },
        { assetId: "beta", symbolOrName: "BETA", quantity: 1, price: 100, accountGroup: "main" },
      ],
    });
    const result = calculateTriggerMetric(definition("appreciation_concentration"), context({ snapshots: [prior, current], currentSnapshotId: current.id }));
    strictEqual(result.status, "unavailable");
    match(String(result.details.reason), /price/);
  } finally {
    closeDatabase(db);
  }
});

test("transitions through watch, review, clear, and cooldown deterministically", () => {
  const trigger = definition("single_position_concentration", { persistenceObservations: 2, clearingPersistenceObservations: 2 });
  const normal: TriggerState = { state: "normal", qualifyingObservations: 0, clearingObservations: 0, cooldownUntil: null, lastReviewAt: null };
  const metric = { status: "available" as const, observedValue: 0.5, condition: true, details: {}, inputSnapshotIds: [] };
  const watch = transitionTrigger(trigger, normal, metric, "2026-01-01T00:00:00.000Z");
  equal(watch.state, "watch");
  const review = transitionTrigger(trigger, watch, metric, "2026-01-02T00:00:00.000Z");
  equal(review.state, "review");
  const clearOne = transitionTrigger(trigger, { ...review, state: "review" }, { ...metric, observedValue: 0.2, condition: false }, "2026-01-03T00:00:00.000Z");
  equal(clearOne.state, "review");
  const clearTwo = transitionTrigger(trigger, clearOne, { ...metric, observedValue: 0.2, condition: false }, "2026-01-04T00:00:00.000Z");
  equal(clearTwo.state, "normal");
  const cooldown = transitionTrigger(trigger, { ...review, state: "review" }, metric, "2026-01-05T00:00:00.000Z", { completedReviewAt: "2026-01-05T00:00:00.000Z" });
  equal(cooldown.state, "cooldown");
  deepStrictEqual(transitionTrigger(trigger, cooldown, metric, "2026-01-06T00:00:00.000Z").state, "cooldown");
});

test("holds an active numeric trigger between exit and entry thresholds", () => {
  const trigger = definition("single_position_concentration", { entryThreshold: 0.35, exitThreshold: 0.32, clearingPersistenceObservations: 1 });
  const active: TriggerState = { state: "review", qualifyingObservations: 2, clearingObservations: 0, cooldownUntil: null, lastReviewAt: null };
  const between = transitionTrigger(trigger, active, { status: "available", observedValue: 0.34, condition: false, details: {}, inputSnapshotIds: [] }, "2026-01-03T00:00:00.000Z");
  equal(between.state, "review");
  const cleared = transitionTrigger(trigger, between, { status: "available", observedValue: 0.31, condition: false, details: {}, inputSnapshotIds: [] }, "2026-01-04T00:00:00.000Z");
  equal(cleared.state, "normal");
});

test("persists all seven definitions and replays durable trigger state after reopen", () => {
  const dbPath = "/private/tmp/bubblereyes-trigger-store.sqlite";
  rmSync(dbPath, { force: true });
  const db = openDatabase(dbPath);
  try {
    const draft = createDraft(db, covenantInput());
    const covenant = approveDraft(db, draft.id);
    const inputs = [...TRIGGER_TYPES_FOR_TEST].map((type) => definition(type));
    const stored = createTriggerDefinitions(db, covenant, inputs);
    equal(stored.length, 7);
    equal(listTriggerDefinitions(db, covenant.id).length, 7);
    const definitionDataBefore = db.prepare("SELECT data FROM trigger_definitions ORDER BY id").all();
    const current = snapshot(db, "2026-03-01", [
      { assetId: "alpha", quantity: 1, price: 600, aiExposureFraction: 0 },
      { assetId: "beta", quantity: 1, price: 400, aiExposureFraction: 0 },
    ]);
    const concentration = stored.find((item) => item.type === "single_position_concentration");
    if (!concentration) throw new Error("concentration trigger missing");
    const evaluationContext = context({ snapshots: [current], currentSnapshotId: current.id, now: "2026-03-01T00:00:00.000Z" });
    const firstEvaluation = evaluateAndPersistTrigger(db, concentration.id, evaluationContext);
    const duplicateEvaluation = evaluateAndPersistTrigger(db, concentration.id, evaluationContext);
    strictEqual(duplicateEvaluation.id, firstEvaluation.id);
    const second = evaluateAndPersistTrigger(db, concentration.id, { ...evaluationContext, now: "2026-03-02T00:00:00.000Z" });
    equal(second.stateAfter.state, "review");
    acknowledgeTrigger(db, concentration.id, "2026-03-02T00:30:00.000Z");
    completeTriggerReview(db, concentration.id, "2026-03-02T00:30:00.000Z");
    equal(getTriggerState(db, concentration.id).state, "cooldown");
    strictEqual(listAuditEvents(db, concentration.id).some((event) => event.eventType === "trigger.acknowledged"), true);
    equal(listTriggerEvaluations(db, concentration.id).length, 3);
    deepStrictEqual(replayTriggerState(db, concentration.id), getTriggerState(db, concentration.id));
    deepStrictEqual(db.prepare("SELECT data FROM trigger_definitions ORDER BY id").all(), definitionDataBefore);
  } finally {
    closeDatabase(db);
  }
  const reopened = openDatabase(dbPath);
  try {
    equal(listTriggerDefinitions(reopened).length, 7);
  } finally {
    closeDatabase(reopened);
    rmSync(dbPath, { force: true });
  }
});

const TRIGGER_TYPES_FOR_TEST = [
  "ai_exposure",
  "single_position_concentration",
  "trailing_drawdown",
  "trailing_volatility",
  "appreciation_concentration",
  "scheduled_review",
  "overdue_review",
] as const;
