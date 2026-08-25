import { randomUUID } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
import { appendAuditEvent, listAuditEvents } from "../audit/store.js";
import { getCovenant } from "../domain/lifecycle.js";
import type { Covenant } from "../domain/types.js";
import {
  completeTriggerReviewInTransaction,
  getTriggerState,
  listTriggerDefinitions,
  listTriggerEvaluations,
} from "../triggers/store.js";
import type { TriggerDefinition, TriggerEvaluationRecord } from "../triggers/types.js";
import { REVIEW_DECISIONS, type ReviewCompletionInput, type ReviewDraft, type ReviewOpeningContext, type ReviewTriggerContext, type StructuredReview } from "./types.js";

type StoredReview = {
  id: string;
  covenant_id: string;
  covenant_version: number;
  review_version: number;
  status: string;
  trigger_ids: string;
  data: string;
  opened_at: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

function normalizeTimestamp(value: string, field: string): string {
  if (typeof value !== "string" || Number.isNaN(Date.parse(value))) throw new Error(`${field} must be a valid timestamp`);
  return new Date(value).toISOString();
}

function requiredText(value: unknown, field: string): string {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${field} is required`);
  return value.trim();
}

function validateDecision(value: unknown): ReviewCompletionInput["decision"] {
  if (typeof value !== "string" || !REVIEW_DECISIONS.includes(value as ReviewCompletionInput["decision"])) throw new Error("decision is unsupported");
  return value as ReviewCompletionInput["decision"];
}

function normalizeCompletion(input: ReviewCompletionInput, completedAt: string): ReviewCompletionInput {
  const followUpAt = input.followUpAt === undefined || input.followUpAt === null ? null : normalizeTimestamp(input.followUpAt, "followUpAt");
  if (followUpAt && Date.parse(followUpAt) < Date.parse(completedAt)) throw new Error("followUpAt cannot precede completion");
  return {
    factualObservations: requiredText(input.factualObservations, "factualObservations"),
    falsifierCheck: requiredText(input.falsifierCheck, "falsifierCheck"),
    decision: validateDecision(input.decision),
    rationale: requiredText(input.rationale, "rationale"),
    followUpAt,
  };
}

function normalizeDraft(input: ReviewDraft): ReviewDraft {
  const draft: ReviewDraft = {};
  if (input.factualObservations !== undefined) draft.factualObservations = requiredText(input.factualObservations, "factualObservations");
  if (input.falsifierCheck !== undefined) draft.falsifierCheck = requiredText(input.falsifierCheck, "falsifierCheck");
  if (input.decision !== undefined) draft.decision = validateDecision(input.decision);
  if (input.rationale !== undefined) draft.rationale = requiredText(input.rationale, "rationale");
  if (input.followUpAt !== undefined) draft.followUpAt = input.followUpAt === null ? null : normalizeTimestamp(input.followUpAt, "followUpAt");
  return draft;
}

function rowToReview(row: StoredReview): StructuredReview {
  return JSON.parse(row.data) as StructuredReview;
}

function reviewOrThrow(db: DatabaseSync, reviewId: string): StructuredReview {
  const row = db.prepare("SELECT * FROM structured_reviews WHERE id = ?").get(reviewId) as StoredReview | undefined;
  if (!row) throw new Error("Structured review not found");
  return rowToReview(row);
}

function latestEvaluation(db: DatabaseSync, triggerId: string): TriggerEvaluationRecord | null {
  return listTriggerEvaluations(db, triggerId).at(-1) ?? null;
}

function triggerContext(db: DatabaseSync, definition: TriggerDefinition): ReviewTriggerContext {
  const state = getTriggerState(db, definition.id);
  const evaluation = latestEvaluation(db, definition.id);
  return {
    triggerId: definition.id,
    triggerType: definition.type,
    triggerVersion: definition.triggerVersion,
    state: state.state,
    evaluationId: evaluation?.id ?? null,
    observedAt: evaluation?.observedAt ?? null,
    metricStatus: evaluation?.metric.status ?? null,
    observedValue: evaluation?.metric.observedValue ?? null,
    unavailableReason: evaluation?.metric.status === "unavailable" ? String(evaluation.metric.details.reason ?? "data unavailable") : null,
  };
}

function openingContext(covenant: Covenant, definitions: TriggerDefinition[], db: DatabaseSync): ReviewOpeningContext {
  return {
    covenantName: covenant.name,
    covenantPurpose: covenant.purpose,
    reviewRules: [...covenant.reviewRules],
    candidateActions: [...covenant.candidateActions],
    deescalationConditions: [...covenant.deescalationConditions],
    reentryConditions: [...covenant.reentryConditions],
    triggerEvaluations: definitions.map((definition) => triggerContext(db, definition)),
  };
}

function saveReview(db: DatabaseSync, review: StructuredReview): void {
  db.prepare(`INSERT INTO structured_reviews
    (id, covenant_id, covenant_version, review_version, status, trigger_ids, data, opened_at, completed_at, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      covenant_version = excluded.covenant_version,
      review_version = excluded.review_version,
      status = excluded.status,
      trigger_ids = excluded.trigger_ids,
      data = excluded.data,
      completed_at = excluded.completed_at,
      updated_at = excluded.updated_at`).run(
    review.id,
    review.covenantId,
    review.covenantVersion,
    review.reviewVersion,
    review.status,
    JSON.stringify(review.triggerIds),
    JSON.stringify(review),
    review.openedAt,
    review.completedAt,
    review.createdAt,
    review.updatedAt,
  );
}

export function openStructuredReview(db: DatabaseSync, covenantId: string, triggerIds: string[], openedAt: string): StructuredReview {
  const covenant = getCovenant(db, covenantId);
  if (covenant.status !== "approved") throw new Error("Structured reviews require an approved covenant");
  const normalizedOpenedAt = normalizeTimestamp(openedAt, "openedAt");
  const uniqueIds = [...new Set(triggerIds)];
  if (uniqueIds.length === 0) throw new Error("at least one trigger is required");
  const definitions = listTriggerDefinitions(db, covenantId).filter((definition) => uniqueIds.includes(definition.id));
  if (definitions.length !== uniqueIds.length) throw new Error("all review triggers must belong to the covenant");
  for (const definition of definitions) {
    const state = getTriggerState(db, definition.id).state;
    if (state !== "review" && state !== "escalated_review") throw new Error("all review triggers must be active");
  }
  const openReviews = listStructuredReviews(db, covenantId).filter((review) => review.status === "open");
  if (openReviews.some((review) => review.triggerIds.some((id) => uniqueIds.includes(id)))) throw new Error("covenant already has an open review for these triggers");
  const now = new Date().toISOString();
  const review: StructuredReview = {
    id: randomUUID(),
    covenantId,
    covenantVersion: covenant.version,
    reviewVersion: 1,
    status: "open",
    triggerIds: uniqueIds,
    openedAt: normalizedOpenedAt,
    completedAt: null,
    openingContext: openingContext(covenant, definitions, db),
    draft: {},
    completion: null,
    createdAt: now,
    updatedAt: normalizedOpenedAt,
  };
  db.exec("BEGIN");
  try {
    saveReview(db, review);
    appendAuditEvent(db, {
      eventType: "review.opened",
      entityType: "structured_review",
      entityId: review.id,
      entityVersion: review.reviewVersion,
      occurredAt: normalizedOpenedAt,
      payload: { review },
    });
    db.exec("COMMIT");
    return review;
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

export function updateStructuredReview(db: DatabaseSync, reviewId: string, input: ReviewDraft, updatedAt: string): StructuredReview {
  const review = reviewOrThrow(db, reviewId);
  if (review.status === "completed") throw new Error("completed review is immutable");
  const normalizedUpdatedAt = normalizeTimestamp(updatedAt, "updatedAt");
  if (Date.parse(normalizedUpdatedAt) < Date.parse(review.openedAt)) throw new Error("updatedAt cannot precede opening");
  const updated: StructuredReview = { ...review, reviewVersion: review.reviewVersion + 1, draft: { ...review.draft, ...normalizeDraft(input) }, updatedAt: normalizedUpdatedAt };
  db.exec("BEGIN");
  try {
    saveReview(db, updated);
    appendAuditEvent(db, {
      eventType: "review.updated",
      entityType: "structured_review",
      entityId: updated.id,
      entityVersion: updated.reviewVersion,
      occurredAt: normalizedUpdatedAt,
      payload: { review: updated },
    });
    db.exec("COMMIT");
    return updated;
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

export function completeStructuredReview(db: DatabaseSync, reviewId: string, input: ReviewCompletionInput, completedAt: string): StructuredReview {
  const review = reviewOrThrow(db, reviewId);
  if (review.status === "completed") throw new Error("review is already completed");
  const normalizedCompletedAt = normalizeTimestamp(completedAt, "completedAt");
  if (Date.parse(normalizedCompletedAt) < Date.parse(review.openedAt)) throw new Error("completedAt cannot precede opening");
  const completion = normalizeCompletion(input, normalizedCompletedAt);
  const completed: StructuredReview = {
    ...review,
    reviewVersion: review.reviewVersion + 1,
    status: "completed",
    completedAt: normalizedCompletedAt,
    draft: { ...review.draft, ...completion },
    completion,
    updatedAt: normalizedCompletedAt,
  };
  db.exec("BEGIN");
  try {
    for (const triggerId of review.triggerIds) completeTriggerReviewInTransaction(db, triggerId, normalizedCompletedAt);
    saveReview(db, completed);
    appendAuditEvent(db, {
      eventType: "review.completed",
      entityType: "structured_review",
      entityId: completed.id,
      entityVersion: completed.reviewVersion,
      occurredAt: normalizedCompletedAt,
      payload: { review: completed, triggerIds: completed.triggerIds },
    });
    db.exec("COMMIT");
    return completed;
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

export function getStructuredReview(db: DatabaseSync, reviewId: string): StructuredReview {
  return reviewOrThrow(db, reviewId);
}

export function listStructuredReviews(db: DatabaseSync, covenantId?: string): StructuredReview[] {
  const rows = (covenantId
    ? db.prepare("SELECT * FROM structured_reviews WHERE covenant_id = ? ORDER BY opened_at ASC, created_at ASC").all(covenantId)
    : db.prepare("SELECT * FROM structured_reviews ORDER BY covenant_id ASC, opened_at ASC, created_at ASC").all()) as unknown as StoredReview[];
  return rows.map(rowToReview);
}

export function replayStructuredReview(db: DatabaseSync, reviewId: string): StructuredReview {
  const events = listAuditEvents(db, reviewId).filter((event) => event.entityType === "structured_review");
  const latest = events.at(-1);
  const review = (latest?.payload as { review?: StructuredReview } | undefined)?.review;
  if (!review) throw new Error("Structured review replay unavailable");
  return review;
}
