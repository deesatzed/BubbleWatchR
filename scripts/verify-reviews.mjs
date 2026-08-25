import { rmSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { closeDatabase, listAuditEvents, openDatabase } from "../dist/packages/audit/store.js";
import { createDraft, approveDraft } from "../dist/packages/domain/lifecycle.js";
import { buildReviewExport, toReviewJson, toReviewMarkdown } from "../dist/packages/export/serializers.js";
import { createSnapshot } from "../dist/packages/snapshots/store.js";
import { createTriggerDefinitions, evaluateAndPersistTrigger, getTriggerState } from "../dist/packages/triggers/store.js";
import { completeStructuredReview, openStructuredReview, updateStructuredReview } from "../dist/packages/reviews/store.js";

const dbPath = ".data/verification-reviews.sqlite";
rmSync(dbPath, { force: true });
const db = openDatabase(dbPath);
try {
  const covenant = approveDraft(db, createDraft(db, {
    name: "Review Verification Covenant",
    purpose: "Verify structured review recording.",
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
    notes: "Generated review verification fixture",
  }).id);
  const [definition] = createTriggerDefinitions(db, covenant, [{
    type: "single_position_concentration",
    enabled: true,
    entryThreshold: 0.35,
    exitThreshold: 0.32,
    persistenceObservations: 1,
    clearingPersistenceObservations: 1,
    cooldownMs: 1209600000,
    severity: "normal",
    missingDataPolicy: "hold_prior_state",
    reviewInstructions: "Review the predefined condition.",
    settings: {},
  }]);
  const snapshot = createSnapshot(db, {
    asOf: "2026-08-01",
    portfolioName: "Review Verification",
    source: "manual",
    sourceReference: "verify:reviews",
    positions: [
      { assetId: "alpha", symbolOrName: "Alpha", quantity: 80, price: 1, aiExposureFraction: 0, accountGroup: "main" },
      { assetId: "beta", symbolOrName: "Beta", quantity: 20, price: 1, aiExposureFraction: 0, accountGroup: "main" },
    ],
  });
  evaluateAndPersistTrigger(db, definition.id, { now: "2026-08-01T00:00:00.000Z", snapshots: [snapshot], currentSnapshotId: snapshot.id, covenantApprovedAt: covenant.approvedAt, lastCompletedReviewAt: null });
  const review = openStructuredReview(db, covenant.id, [definition.id], "2026-08-02T00:00:00.000Z");
  updateStructuredReview(db, review.id, { factualObservations: "The saved concentration exceeds the entry threshold." }, "2026-08-02T01:00:00.000Z");
  const completed = completeStructuredReview(db, review.id, {
    factualObservations: "The saved concentration exceeds the entry threshold.",
    falsifierCheck: "The saved source and timestamp were checked.",
    decision: "continue_policy",
    rationale: "The policy remains deliberate and the condition is documented.",
    followUpAt: null,
  }, "2026-08-03T00:00:00.000Z");
  if (completed.status !== "completed" || getTriggerState(db, definition.id).state !== "cooldown") throw new Error("review did not complete linked cooldown");
  const exported = buildReviewExport(covenant, completed, listAuditEvents(db, review.id));
  const jsonPath = ".data/verification-reviews.json";
  const markdownPath = ".data/verification-reviews.md";
  const json = toReviewJson(exported);
  const markdown = toReviewMarkdown(exported);
  await writeFile(jsonPath, json);
  await writeFile(markdownPath, markdown);
  for (const required of ["Structured Review", "factualObservations", "falsifierCheck", "continue_policy", "review.completed", definition.id]) {
    if (!json.includes(required) && !markdown.includes(required)) throw new Error(`review evidence is missing ${required}`);
  }
  if (markdown.includes("\u0000")) throw new Error("review Markdown contains a raw NUL");
  console.log(`review exports verified: ${jsonPath}, ${markdownPath}`);
} finally {
  closeDatabase(db);
}
