import { randomUUID } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
import { appendAuditEvent, listAuditEvents, type AuditEvent } from "../audit/store.js";
import type { Covenant, CovenantInput, ValidationResult } from "./types.js";

type StoredCovenant = {
  id: string;
  version: number;
  status: "draft" | "approved";
  data: string;
  created_at: string;
  approved_at: string | null;
  supersedes_id: string | null;
};

const requiredText: Array<keyof CovenantInput> = [
  "name",
  "purpose",
  "coveredExposure",
  "objective",
  "timeHorizon",
  "cooldownPolicy",
];

const arrayFields: Array<keyof CovenantInput> = [
  "reviewRules",
  "candidateActions",
  "falsifiers",
  "deescalationConditions",
  "reentryConditions",
];

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

function asFraction(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim() !== "") return Number(value);
  return Number.NaN;
}

export function validateCovenantInput(input: unknown): ValidationResult {
  const candidate = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const normalized = {
    name: asString(candidate.name),
    purpose: asString(candidate.purpose),
    coveredExposure: asString(candidate.coveredExposure),
    objective: asString(candidate.objective),
    timeHorizon: asString(candidate.timeHorizon),
    maximumIntendedConcentration: asFraction(candidate.maximumIntendedConcentration),
    maximumTolerableDrawdown: asFraction(candidate.maximumTolerableDrawdown),
    reviewRules: asStringArray(candidate.reviewRules),
    candidateActions: asStringArray(candidate.candidateActions),
    falsifiers: asStringArray(candidate.falsifiers),
    deescalationConditions: asStringArray(candidate.deescalationConditions),
    reentryConditions: asStringArray(candidate.reentryConditions),
    cooldownPolicy: asString(candidate.cooldownPolicy),
    notes: asString(candidate.notes),
  } satisfies CovenantInput;
  const errors: string[] = [];
  for (const field of requiredText) {
    if (!normalized[field]) errors.push(`${field} is required`);
  }
  for (const field of arrayFields) {
    if (field === "reviewRules" && normalized[field].length === 0) {
      errors.push("reviewRules requires at least one rule");
    }
    if (field === "candidateActions" && normalized[field].length === 0) {
      errors.push("candidateActions requires at least one action");
    }
  }
  for (const field of ["maximumIntendedConcentration", "maximumTolerableDrawdown"] as const) {
    if (!Number.isFinite(normalized[field]) || normalized[field] < 0 || normalized[field] > 1) {
      errors.push(`${field} must be a number between 0 and 1`);
    }
  }
  return errors.length ? { ok: false, errors } : { ok: true, value: normalized };
}

function rowToCovenant(row: StoredCovenant): Covenant {
  return {
    ...(JSON.parse(row.data) as CovenantInput),
    id: row.id,
    version: row.version,
    status: row.status,
    createdAt: row.created_at,
    approvedAt: row.approved_at,
    supersedesId: row.supersedes_id,
  };
}

function getRow(db: DatabaseSync, id: string): StoredCovenant | undefined {
  return db.prepare("SELECT * FROM covenants WHERE id = ?").get(id) as StoredCovenant | undefined;
}

function getCovenantOrThrow(db: DatabaseSync, id: string): Covenant {
  const row = getRow(db, id);
  if (!row) throw new Error("Covenant not found");
  return rowToCovenant(row);
}

function insertDraft(db: DatabaseSync, input: CovenantInput, supersedesId: string | null): Covenant {
  const predecessor = supersedesId ? getCovenantOrThrow(db, supersedesId) : null;
  if (predecessor && predecessor.status !== "approved") {
    throw new Error("Only an approved covenant can have a successor");
  }
  const id = randomUUID();
  const version = predecessor ? predecessor.version + 1 : 1;
  const createdAt = new Date().toISOString();
  const covenant: Covenant = {
    ...input,
    id,
    version,
    status: "draft",
    createdAt,
    approvedAt: null,
    supersedesId,
  };
  db.prepare(`
    INSERT INTO covenants
      (id, version, status, data, created_at, approved_at, supersedes_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, version, covenant.status, JSON.stringify(input), createdAt, null, supersedesId);
  appendAuditEvent(db, {
    eventType: supersedesId ? "covenant.successor.created" : "covenant.created",
    entityType: "covenant",
    entityId: id,
    entityVersion: version,
    occurredAt: createdAt,
    payload: { covenant },
  });
  if (supersedesId && predecessor) {
    appendAuditEvent(db, {
      eventType: "covenant.superseded",
      entityType: "covenant",
      entityId: predecessor.id,
      entityVersion: predecessor.version,
      occurredAt: createdAt,
      payload: { successorId: id, successorVersion: version },
    });
  }
  return covenant;
}

export function createDraft(db: DatabaseSync, rawInput: unknown): Covenant {
  const result = validateCovenantInput(rawInput);
  if (!result.ok) throw new Error(result.errors.join("; "));
  return insertDraft(db, result.value, null);
}

export function createSuccessorDraft(db: DatabaseSync, predecessorId: string, rawInput: unknown): Covenant {
  const result = validateCovenantInput(rawInput);
  if (!result.ok) throw new Error(result.errors.join("; "));
  return insertDraft(db, result.value, predecessorId);
}

export function approveDraft(db: DatabaseSync, id: string): Covenant {
  const current = getCovenantOrThrow(db, id);
  if (current.status !== "draft") throw new Error("Only a draft covenant can be approved");
  const approvedAt = new Date().toISOString();
  db.prepare("UPDATE covenants SET status = 'approved', approved_at = ? WHERE id = ? AND status = 'draft'")
    .run(approvedAt, id);
  const approved = getCovenantOrThrow(db, id);
  appendAuditEvent(db, {
    eventType: "covenant.approved",
    entityType: "covenant",
    entityId: id,
    entityVersion: approved.version,
    occurredAt: approvedAt,
    payload: { covenant: approved },
  });
  return approved;
}

export function getCovenant(db: DatabaseSync, id: string): Covenant {
  return getCovenantOrThrow(db, id);
}

export function listCovenants(db: DatabaseSync): Covenant[] {
  const rows = db.prepare("SELECT * FROM covenants ORDER BY version ASC, created_at ASC").all() as unknown as StoredCovenant[];
  return rows.map(rowToCovenant);
}

export function auditForCovenant(db: DatabaseSync, id: string): AuditEvent[] {
  return listAuditEvents(db).filter((event) =>
    event.entityId === id || (event.payload as { covenant?: { id?: string } }).covenant?.id === id,
  );
}

export function replayCovenant(db: DatabaseSync, id: string): Covenant {
  const events = auditForCovenant(db, id)
    .filter((event) => event.payload && typeof event.payload === "object")
    .filter((event) => "covenant" in (event.payload as Record<string, unknown>));
  const last = events.at(-1);
  if (!last) throw new Error("No replayable audit events for covenant");
  return (last.payload as { covenant: Covenant }).covenant;
}
