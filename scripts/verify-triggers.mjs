import { rmSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { closeDatabase, listAuditEvents, openDatabase } from "../dist/packages/audit/store.js";
import { createDraft, approveDraft } from "../dist/packages/domain/lifecycle.js";
import { buildTriggerExport, toTriggerJson, toTriggerMarkdown } from "../dist/packages/export/serializers.js";
import { createSnapshot } from "../dist/packages/snapshots/store.js";
import { completeTriggerReview, evaluateAndPersistTrigger, createTriggerDefinitions, getTriggerState, listTriggerEvaluations, listTriggerDefinitions } from "../dist/packages/triggers/store.js";

const dbPath = ".data/verification-triggers.sqlite";
rmSync(dbPath, { force: true });
const db = openDatabase(dbPath);
const triggerTypes = [
  "ai_exposure",
  "single_position_concentration",
  "trailing_drawdown",
  "trailing_volatility",
  "appreciation_concentration",
  "scheduled_review",
  "overdue_review",
];
const baseDefinition = (type) => ({
  type,
  enabled: true,
  entryThreshold: 0.35,
  exitThreshold: 0.32,
  persistenceObservations: 1,
  clearingPersistenceObservations: 1,
  cooldownMs: 1209600000,
  severity: "normal",
  missingDataPolicy: "hold_prior_state",
  reviewInstructions: "Review this predefined condition.",
  settings: type === "trailing_volatility"
    ? { lookbackObservations: 3, annualizationFactor: 1, returnInterval: "monthly", priceAdjustmentConvention: "user-entered portfolio market values" }
    : type === "scheduled_review"
      ? { scheduledAt: "2026-01-01T00:00:00.000Z", timezone: "UTC" }
      : type === "overdue_review"
        ? { reviewIntervalMs: 1, timezone: "UTC", reviewClock: "approval" }
        : {},
});
const positions = (alphaPrice, alphaAI) => [
  { assetId: "alpha", symbolOrName: "Alpha", quantity: 1, price: alphaPrice, aiExposureFraction: alphaAI, accountGroup: "main" },
  { assetId: "beta", symbolOrName: "Beta", quantity: 1, price: 100, aiExposureFraction: 0, accountGroup: "main" },
];
try {
  const covenant = approveDraft(db, createDraft(db, {
    name: "Trigger Verification Covenant",
    purpose: "Verify deterministic review conditions.",
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
    cooldownPolicy: "Fourteen days",
    notes: "Generated verification fixture",
  }).id);
  const definitions = createTriggerDefinitions(db, covenant, triggerTypes.map((type) => ({ ...baseDefinition(type), ...(type === "single_position_concentration" ? { emergencyThreshold: 0.6 } : {}) })));
  const first = createSnapshot(db, { asOf: "2026-01-01", portfolioName: "Trigger Verification", source: "manual", sourceReference: "verify:triggers", positions: positions(100, 0) });
  const second = createSnapshot(db, { asOf: "2026-02-01", portfolioName: "Trigger Verification", source: "manual", sourceReference: "verify:triggers", positions: positions(120, 0) });
  const third = createSnapshot(db, { asOf: "2026-03-01", portfolioName: "Trigger Verification", source: "manual", sourceReference: "verify:triggers", positions: positions(150, 1) });
  const current = createSnapshot(db, { asOf: "2026-04-01", portfolioName: "Trigger Verification", source: "csv", sourceReference: "verify:triggers.csv", positions: positions(180, null) });
  const context = { now: "2026-04-01T00:00:00.000Z", snapshots: [first, second, third, current], currentSnapshotId: current.id, covenantApprovedAt: covenant.approvedAt, lastCompletedReviewAt: null };
  for (const definition of definitions) evaluateAndPersistTrigger(db, definition.id, context);
  const concentration = definitions.find((definition) => definition.type === "single_position_concentration");
  if (!concentration) throw new Error("concentration trigger is missing");
  completeTriggerReview(db, concentration.id, "2026-04-02T00:00:00.000Z");
  evaluateAndPersistTrigger(db, concentration.id, { ...context, now: "2026-04-03T00:00:00.000Z" });
  const exported = buildTriggerExport(
    covenant,
    listTriggerDefinitions(db, covenant.id),
    definitions.map((definition) => ({ triggerId: definition.id, state: getTriggerState(db, definition.id) })),
    definitions.flatMap((definition) => listTriggerEvaluations(db, definition.id)),
    listAuditEvents(db).filter((event) => definitions.some((definition) => definition.id === event.entityId) || event.eventType.startsWith("covenant.")),
  );
  const jsonPath = ".data/verification-triggers.json";
  const markdownPath = ".data/verification-triggers.md";
  await writeFile(jsonPath, toTriggerJson(exported));
  await writeFile(markdownPath, toTriggerMarkdown(exported));
  const json = toTriggerJson(exported);
  const markdown = toTriggerMarkdown(exported);
  for (const type of triggerTypes) {
    if (!json.includes(type) || !markdown.includes(type)) throw new Error(`trigger evidence is missing ${type}`);
  }
  for (const required of ["unavailable", "calculationVersion", "covenantVersion", "triggerVersion", "reviewInstructions", "trigger.definition.created", "trigger.evaluated", "trigger.cooldown.bypassed"]) {
    if (!json.includes(required) && !markdown.includes(required)) throw new Error(`trigger evidence is missing ${required}`);
  }
  if (markdown.includes("\u0000")) throw new Error("trigger Markdown contains an internal NUL separator");
  console.log(`trigger exports verified: ${jsonPath}, ${markdownPath}`);
} finally {
  closeDatabase(db);
}
