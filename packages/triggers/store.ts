import { randomUUID } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
import { appendAuditEvent } from "../audit/store.js";
import type { Covenant } from "../domain/types.js";
import { calculateTriggerMetric, transitionTrigger, validateTriggerDefinition } from "./engine.js";
import type { TriggerDefinition, TriggerDefinitionInput, TriggerEvaluationContext, TriggerEvaluationRecord, TriggerMetricEvaluation, TriggerState } from "./types.js";

type StoredDefinition = {
  id: string;
  covenant_id: string;
  covenant_version: number;
  trigger_version: number;
  trigger_type: TriggerDefinition["type"];
  data: string;
  created_at: string;
};

type StoredState = {
  trigger_id: string;
  data: string;
  updated_at: string;
};

type StoredEvaluation = {
  id: string;
  trigger_id: string;
  observed_at: string;
  data: string;
  created_at: string;
};

function rowToDefinition(row: StoredDefinition): TriggerDefinition {
  return {
    ...(JSON.parse(row.data) as TriggerDefinitionInput),
    id: row.id,
    covenantId: row.covenant_id,
    covenantVersion: row.covenant_version,
    triggerVersion: row.trigger_version,
    createdAt: row.created_at,
  };
}

function rowToState(row: StoredState | undefined): TriggerState {
  return row
    ? JSON.parse(row.data) as TriggerState
    : { state: "normal", qualifyingObservations: 0, clearingObservations: 0, cooldownUntil: null, lastReviewAt: null };
}

function rowToEvaluation(row: StoredEvaluation): TriggerEvaluationRecord {
  const data = JSON.parse(row.data) as { metric: TriggerMetricEvaluation; stateBefore: TriggerState; stateAfter: TriggerState };
  return { id: row.id, triggerId: row.trigger_id, observedAt: row.observed_at, metric: data.metric, stateBefore: data.stateBefore, stateAfter: data.stateAfter, createdAt: row.created_at };
}

function definitionOrThrow(db: DatabaseSync, id: string): TriggerDefinition {
  const row = db.prepare("SELECT * FROM trigger_definitions WHERE id = ?").get(id) as StoredDefinition | undefined;
  if (!row) throw new Error("Trigger definition not found");
  return rowToDefinition(row);
}

export function createTriggerDefinitions(db: DatabaseSync, covenant: Covenant, inputs: TriggerDefinitionInput[]): TriggerDefinition[] {
  if (covenant.status !== "approved") throw new Error("Trigger definitions require an approved covenant");
  if (inputs.length === 0) throw new Error("at least one trigger definition is required");
  const types = new Set<string>();
  const validated = inputs.map((input) => {
    const result = validateTriggerDefinition(input);
    if (!result.ok) throw new Error(result.errors.join("; "));
    if (types.has(input.type)) throw new Error(`duplicate trigger type: ${input.type}`);
    types.add(input.type);
    return result.value;
  });
  const createdAt = new Date().toISOString();
  const definitions: TriggerDefinition[] = validated.map((input) => ({
    ...input,
    id: randomUUID(),
    covenantId: covenant.id,
    covenantVersion: covenant.version,
    triggerVersion: 1,
    createdAt,
  }));
  db.exec("BEGIN");
  try {
    for (const definition of definitions) {
      db.prepare(`INSERT INTO trigger_definitions
        (id, covenant_id, covenant_version, trigger_version, trigger_type, data, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)`).run(
        definition.id,
        definition.covenantId,
        definition.covenantVersion,
        definition.triggerVersion,
        definition.type,
        JSON.stringify(definition),
        definition.createdAt,
      );
      appendAuditEvent(db, {
        eventType: "trigger.definition.created",
        entityType: "trigger_definition",
        entityId: definition.id,
        entityVersion: definition.triggerVersion,
        occurredAt: createdAt,
        payload: { covenantId: covenant.id, covenantVersion: covenant.version, definition },
      });
    }
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
  return definitions;
}

export function listTriggerDefinitions(db: DatabaseSync, covenantId?: string): TriggerDefinition[] {
  const rows = (covenantId
    ? db.prepare("SELECT * FROM trigger_definitions WHERE covenant_id = ? ORDER BY trigger_type ASC").all(covenantId)
    : db.prepare("SELECT * FROM trigger_definitions ORDER BY covenant_id ASC, trigger_type ASC").all()) as unknown as StoredDefinition[];
  return rows.map(rowToDefinition);
}

export function getTriggerState(db: DatabaseSync, triggerId: string): TriggerState {
  return rowToState(db.prepare("SELECT * FROM trigger_states WHERE trigger_id = ?").get(triggerId) as StoredState | undefined);
}

function saveState(db: DatabaseSync, triggerId: string, state: TriggerState, updatedAt: string): void {
  db.prepare(`INSERT INTO trigger_states (trigger_id, data, updated_at) VALUES (?, ?, ?)
    ON CONFLICT(trigger_id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at`).run(triggerId, JSON.stringify(state), updatedAt);
}

function saveEvaluation(db: DatabaseSync, triggerId: string, context: TriggerEvaluationContext, metric: TriggerMetricEvaluation, before: TriggerState, after: TriggerState): TriggerEvaluationRecord {
  const id = randomUUID();
  const createdAt = new Date().toISOString();
  const record = { id, triggerId, observedAt: context.now, metric, stateBefore: before, stateAfter: after, createdAt };
  db.prepare("INSERT INTO trigger_evaluations (id, trigger_id, observed_at, data, created_at) VALUES (?, ?, ?, ?, ?)")
    .run(id, triggerId, context.now, JSON.stringify({ metric, stateBefore: before, stateAfter: after }), createdAt);
  return record;
}

function appendEvaluationAudits(db: DatabaseSync, definition: TriggerDefinition, context: TriggerEvaluationContext, record: TriggerEvaluationRecord): void {
  appendAuditEvent(db, {
    eventType: "trigger.evaluated",
    entityType: "trigger_definition",
    entityId: definition.id,
    entityVersion: definition.triggerVersion,
    occurredAt: context.now,
    payload: { definition, record },
  });
  if (record.stateBefore.state !== record.stateAfter.state) {
    appendAuditEvent(db, {
      eventType: "trigger.state.changed",
      entityType: "trigger_definition",
      entityId: definition.id,
      entityVersion: definition.triggerVersion,
      occurredAt: context.now,
      payload: { from: record.stateBefore.state, to: record.stateAfter.state, record },
    });
  }
  if (record.stateBefore.state === "cooldown" && record.stateAfter.state === "escalated_review") {
    appendAuditEvent(db, {
      eventType: "trigger.cooldown.bypassed",
      entityType: "trigger_definition",
      entityId: definition.id,
      entityVersion: definition.triggerVersion,
      occurredAt: context.now,
      payload: { reason: "emergency threshold", record },
    });
  }
}

export function evaluateAndPersistTrigger(db: DatabaseSync, triggerId: string, context: TriggerEvaluationContext): TriggerEvaluationRecord {
  const definition = definitionOrThrow(db, triggerId);
  const existing = db.prepare("SELECT * FROM trigger_evaluations WHERE trigger_id = ? AND observed_at = ?").get(triggerId, context.now) as StoredEvaluation | undefined;
  if (existing) return rowToEvaluation(existing);
  const before = getTriggerState(db, triggerId);
  const metric = calculateTriggerMetric(definition, context);
  const after = transitionTrigger(definition, before, metric, context.now);
  db.exec("BEGIN");
  try {
    const record = saveEvaluation(db, triggerId, context, metric, before, after);
    saveState(db, triggerId, after, context.now);
    appendEvaluationAudits(db, definition, context, record);
    db.exec("COMMIT");
    return record;
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

export function evaluateAndPersistTriggers(db: DatabaseSync, covenantId: string, context: TriggerEvaluationContext): TriggerEvaluationRecord[] {
  const definitions = listTriggerDefinitions(db, covenantId);
  const pending = definitions.map((definition) => {
    const existing = db.prepare("SELECT * FROM trigger_evaluations WHERE trigger_id = ? AND observed_at = ?").get(definition.id, context.now) as StoredEvaluation | undefined;
    return { definition, existing, metric: existing ? rowToEvaluation(existing).metric : calculateTriggerMetric(definition, context) };
  });
  const activeTriggerCount = pending.filter((item) => item.metric.status === "available" && item.metric.condition === true).length;
  db.exec("BEGIN");
  try {
    const records = pending.map(({ definition, existing, metric }) => {
      if (existing) return rowToEvaluation(existing);
      const before = getTriggerState(db, definition.id);
      const after = transitionTrigger(definition, before, metric, context.now, { activeTriggerCount });
      const record = saveEvaluation(db, definition.id, context, metric, before, after);
      saveState(db, definition.id, after, context.now);
      appendEvaluationAudits(db, definition, context, record);
      return record;
    });
    db.exec("COMMIT");
    return records;
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

export function completeTriggerReview(db: DatabaseSync, triggerId: string, completedAt: string): TriggerState {
  const definition = definitionOrThrow(db, triggerId);
  const before = getTriggerState(db, triggerId);
  if (before.state !== "review" && before.state !== "escalated_review") throw new Error("only an active review can be completed");
  const after = transitionTrigger(definition, before, { status: "available", observedValue: 0, condition: false, details: { reviewCompleted: true }, inputSnapshotIds: [] }, completedAt, { completedReviewAt: completedAt });
  db.exec("BEGIN");
  try {
    saveEvaluation(db, triggerId, { now: completedAt, snapshots: [], currentSnapshotId: null, covenantApprovedAt: null, lastCompletedReviewAt: completedAt }, { status: "available", observedValue: 0, condition: false, details: { reviewCompleted: true }, inputSnapshotIds: [] }, before, after);
    saveState(db, triggerId, after, completedAt);
    appendAuditEvent(db, {
      eventType: "trigger.review.completed",
      entityType: "trigger_definition",
      entityId: triggerId,
      entityVersion: definition.triggerVersion,
      occurredAt: completedAt,
      payload: { from: before.state, to: after.state, completedAt },
    });
    db.exec("COMMIT");
    return after;
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

export function acknowledgeTrigger(db: DatabaseSync, triggerId: string, acknowledgedAt: string): TriggerState {
  const definition = definitionOrThrow(db, triggerId);
  const state = getTriggerState(db, triggerId);
  if (state.state !== "review" && state.state !== "escalated_review") throw new Error("only an active review can be acknowledged");
  appendAuditEvent(db, {
    eventType: "trigger.acknowledged",
    entityType: "trigger_definition",
    entityId: triggerId,
    entityVersion: definition.triggerVersion,
    occurredAt: acknowledgedAt,
    payload: { triggerId, state: state.state, acknowledgedAt },
  });
  return state;
}

export function listTriggerEvaluations(db: DatabaseSync, triggerId?: string): TriggerEvaluationRecord[] {
  const rows = (triggerId
    ? db.prepare("SELECT * FROM trigger_evaluations WHERE trigger_id = ? ORDER BY observed_at ASC, created_at ASC").all(triggerId)
    : db.prepare("SELECT * FROM trigger_evaluations ORDER BY trigger_id ASC, observed_at ASC, created_at ASC").all()) as unknown as StoredEvaluation[];
  return rows.map(rowToEvaluation);
}

export function replayTriggerState(db: DatabaseSync, triggerId: string): TriggerState {
  const evaluations = listTriggerEvaluations(db, triggerId);
  return evaluations.at(-1)?.stateAfter ?? { state: "normal", qualifyingObservations: 0, clearingObservations: 0, cooldownUntil: null, lastReviewAt: null };
}
