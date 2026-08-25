import { createHash, randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";

export type AuditEvent = {
  id: string;
  eventType: string;
  entityType: string;
  entityId: string;
  entityVersion: number;
  occurredAt: string;
  previousHash: string | null;
  payloadHash: string;
  payload: unknown;
};

type StoredAuditEvent = {
  id: string;
  event_type: string;
  entity_type: string;
  entity_id: string;
  entity_version: number;
  occurred_at: string;
  previous_hash: string | null;
  payload_hash: string;
  payload: string;
};

export function openDatabase(path = ".data/decision-covenant.sqlite"): DatabaseSync {
  if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec(`
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS covenants (
      id TEXT PRIMARY KEY,
      version INTEGER NOT NULL,
      status TEXT NOT NULL,
      data TEXT NOT NULL,
      created_at TEXT NOT NULL,
      approved_at TEXT,
      supersedes_id TEXT
    );
    CREATE TABLE IF NOT EXISTS audit_events (
      id TEXT PRIMARY KEY,
      event_type TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      entity_version INTEGER NOT NULL,
      occurred_at TEXT NOT NULL,
      previous_hash TEXT,
      payload_hash TEXT NOT NULL UNIQUE,
      payload TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS audit_events_entity_idx
      ON audit_events(entity_type, entity_id, occurred_at);
    CREATE TABLE IF NOT EXISTS portfolio_snapshots (
      id TEXT PRIMARY KEY,
      as_of TEXT NOT NULL,
      portfolio_name TEXT NOT NULL,
      source TEXT NOT NULL,
      source_reference TEXT,
      data TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS snapshot_import_attempts (
      id TEXT PRIMARY KEY,
      source_reference TEXT,
      raw_data TEXT NOT NULL,
      errors TEXT NOT NULL,
      accepted_snapshot_id TEXT,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS portfolio_snapshots_as_of_idx
      ON portfolio_snapshots(portfolio_name, as_of, created_at);
    CREATE TABLE IF NOT EXISTS trigger_definitions (
      id TEXT PRIMARY KEY,
      covenant_id TEXT NOT NULL,
      covenant_version INTEGER NOT NULL,
      trigger_version INTEGER NOT NULL,
      trigger_type TEXT NOT NULL,
      data TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE UNIQUE INDEX IF NOT EXISTS trigger_definitions_covenant_type_idx
      ON trigger_definitions(covenant_id, trigger_type);
    CREATE TABLE IF NOT EXISTS trigger_states (
      trigger_id TEXT PRIMARY KEY,
      data TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS trigger_evaluations (
      id TEXT PRIMARY KEY,
      trigger_id TEXT NOT NULL,
      observed_at TEXT NOT NULL,
      data TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS trigger_evaluations_trigger_idx
      ON trigger_evaluations(trigger_id, observed_at, created_at);
    CREATE UNIQUE INDEX IF NOT EXISTS trigger_evaluations_trigger_time_idx
      ON trigger_evaluations(trigger_id, observed_at);
  `);
  return db;
}

export function appendAuditEvent(
  db: DatabaseSync,
  event: Omit<AuditEvent, "id" | "previousHash" | "payloadHash">,
): AuditEvent {
  const previous = db.prepare(
    "SELECT payload_hash FROM audit_events ORDER BY rowid DESC LIMIT 1",
  ).get() as { payload_hash?: string } | undefined;
  const previousHash = previous?.payload_hash ?? null;
  const payloadText = JSON.stringify(event.payload);
  const payloadHash = createHash("sha256")
    .update(`${previousHash ?? ""}|${payloadText}`)
    .digest("hex");
  const id = randomUUID();
  db.prepare(`
    INSERT INTO audit_events
      (id, event_type, entity_type, entity_id, entity_version, occurred_at,
       previous_hash, payload_hash, payload)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    event.eventType,
    event.entityType,
    event.entityId,
    event.entityVersion,
    event.occurredAt,
    previousHash,
    payloadHash,
    payloadText,
  );
  return { ...event, id, previousHash, payloadHash };
}

export function listAuditEvents(db: DatabaseSync, entityId?: string): AuditEvent[] {
  const rows = (entityId
    ? db.prepare(
      "SELECT * FROM audit_events WHERE entity_id = ? ORDER BY rowid ASC",
    ).all(entityId)
    : db.prepare("SELECT * FROM audit_events ORDER BY rowid ASC").all()) as unknown as StoredAuditEvent[];
  return rows.map((row) => ({
    id: row.id,
    eventType: row.event_type,
    entityType: row.entity_type,
    entityId: row.entity_id,
    entityVersion: row.entity_version,
    occurredAt: row.occurred_at,
    previousHash: row.previous_hash,
    payloadHash: row.payload_hash,
    payload: JSON.parse(row.payload) as unknown,
  }));
}

export function closeDatabase(db: DatabaseSync): void {
  db.close();
}
