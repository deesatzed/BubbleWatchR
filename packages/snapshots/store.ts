import { randomUUID } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
import { appendAuditEvent } from "../audit/store.js";
import { CSV_COLUMNS, type CsvImportResult, type PortfolioSnapshot, type SnapshotInput, type SnapshotPosition, type SnapshotValidationError, type SnapshotValidationResult } from "./types.js";

type StoredSnapshot = {
  id: string;
  as_of: string;
  portfolio_name: string;
  source: "manual" | "csv";
  source_reference: string | null;
  data: string;
  created_at: string;
};

const ROUNDING_TOLERANCE = 0.01;

function error(row: number | null, column: string | null, code: string, message: string): SnapshotValidationError {
  return { row, column, code, message };
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function present(value: unknown): boolean {
  return value !== null && value !== undefined && (typeof value !== "string" || value.trim() !== "");
}

function numberValue(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function validDate(value: string): boolean {
  return value !== "" && !Number.isNaN(Date.parse(value));
}

function parsePosition(raw: unknown, row: number): { position?: SnapshotPosition; errors: SnapshotValidationError[] } {
  const candidate = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const assetId = text(candidate.assetId ?? candidate.asset_id);
  const symbolOrName = text(candidate.symbolOrName ?? candidate.symbol_or_name);
  const accountGroup = text(candidate.accountGroup ?? candidate.account_group);
  const quantity = numberValue(candidate.quantity);
  const rawPrice = candidate.price;
  const rawMarketValue = candidate.marketValue ?? candidate.market_value;
  const priceProvided = present(rawPrice);
  const marketValueProvided = typeof candidate.marketValueProvided === "boolean" ? candidate.marketValueProvided : present(rawMarketValue);
  const price = numberValue(rawPrice);
  const suppliedMarketValue = numberValue(rawMarketValue);
  const aiRaw = candidate.aiExposureFraction ?? candidate.ai_exposure_fraction;
  const aiExposureFraction = present(aiRaw) ? numberValue(aiRaw) : null;
  const errors: SnapshotValidationError[] = [];
  if (!assetId) errors.push(error(row, "asset_id", "required", "asset_id is required"));
  if (!symbolOrName) errors.push(error(row, "symbol_or_name", "required", "symbol_or_name is required"));
  if (!accountGroup) errors.push(error(row, "account_group", "required", "account_group is required"));
  if (quantity === null) errors.push(error(row, "quantity", "number", "quantity must be a finite number"));
  if (priceProvided && price === null) errors.push(error(row, "price", "number", "price must be a finite number"));
  if (price !== null && price < 0) errors.push(error(row, "price", "range", "price cannot be negative"));
  if (marketValueProvided && suppliedMarketValue === null) errors.push(error(row, "market_value", "number", "market_value must be a finite number"));
  if (price === null && suppliedMarketValue === null) {
    errors.push(error(row, "market_value", "missing", "provide market_value or price"));
  }
  if (present(aiRaw) && aiExposureFraction === null) {
    errors.push(error(row, "ai_exposure_fraction", "number", "ai_exposure_fraction must be a number between 0 and 1"));
  } else if (aiExposureFraction !== null && (aiExposureFraction < 0 || aiExposureFraction > 1)) {
    errors.push(error(row, "ai_exposure_fraction", "range", "ai_exposure_fraction must be between 0 and 1"));
  }
  if (errors.length > 0 || quantity === null) return { errors };
  const calculatedMarketValue = price === null ? null : quantity * price;
  if (suppliedMarketValue !== null && calculatedMarketValue !== null && Math.abs(suppliedMarketValue - calculatedMarketValue) > ROUNDING_TOLERANCE) {
    errors.push(error(row, "market_value", "conflict", `market_value conflicts with quantity * price beyond ${ROUNDING_TOLERANCE.toFixed(2)} tolerance`));
  }
  if (errors.length > 0) return { errors };
  return {
    errors,
    position: {
      assetId,
      symbolOrName,
      quantity,
      price,
      marketValue: suppliedMarketValue ?? calculatedMarketValue ?? 0,
      marketValueProvided,
      aiExposureFraction,
      accountGroup,
    },
  };
}

export function validateSnapshotInput(raw: unknown): SnapshotValidationResult {
  const candidate = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const asOf = text(candidate.asOf ?? candidate.as_of);
  const portfolioName = text(candidate.portfolioName ?? candidate.portfolio_name);
  const source = candidate.source === "csv" ? "csv" : "manual";
  const sourceReference = text(candidate.sourceReference ?? candidate.source_reference) || null;
  const rawPositions = Array.isArray(candidate.positions) ? candidate.positions : [];
  const errors: SnapshotValidationError[] = [];
  if (!validDate(asOf)) errors.push(error(null, "as_of", "date", "as_of must be a valid date"));
  if (!portfolioName) errors.push(error(null, "portfolio_name", "required", "portfolio_name is required"));
  if (rawPositions.length === 0) errors.push(error(null, "positions", "empty", "at least one position is required"));
  const positions: SnapshotPosition[] = [];
  const seen = new Set<string>();
  rawPositions.forEach((rawPosition, index) => {
    const parsed = parsePosition(rawPosition, index + 1);
    errors.push(...parsed.errors);
    if (parsed.position) {
      const key = `${portfolioName}\u0000${parsed.position.assetId}\u0000${parsed.position.accountGroup}`;
      if (seen.has(key)) errors.push(error(index + 1, "asset_id", "duplicate", "duplicate portfolio, asset_id, and account_group requires explicit resolution"));
      seen.add(key);
      positions.push(parsed.position);
    }
  });
  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, value: { asOf, portfolioName, source, sourceReference, positions } };
}

function rowToSnapshot(row: StoredSnapshot): PortfolioSnapshot {
  return {
    id: row.id,
    asOf: row.as_of,
    portfolioName: row.portfolio_name,
    source: row.source,
    sourceReference: row.source_reference,
    createdAt: row.created_at,
    positions: JSON.parse(row.data) as SnapshotPosition[],
  };
}

export function getSnapshot(db: DatabaseSync, id: string): PortfolioSnapshot {
  const row = db.prepare("SELECT * FROM portfolio_snapshots WHERE id = ?").get(id) as StoredSnapshot | undefined;
  if (!row) throw new Error("Portfolio snapshot not found");
  return rowToSnapshot(row);
}

export function listSnapshots(db: DatabaseSync, portfolioName?: string): PortfolioSnapshot[] {
  const rows = (portfolioName
    ? db.prepare("SELECT * FROM portfolio_snapshots WHERE portfolio_name = ? ORDER BY as_of ASC, created_at ASC").all(portfolioName)
    : db.prepare("SELECT * FROM portfolio_snapshots ORDER BY as_of ASC, created_at ASC").all()) as unknown as StoredSnapshot[];
  return rows.map(rowToSnapshot);
}

function recordImportAttempt(db: DatabaseSync, rawData: string, sourceReference: string | null, errors: SnapshotValidationError[], acceptedSnapshotId: string | null): string {
  const id = randomUUID();
  db.prepare(`INSERT INTO snapshot_import_attempts
    (id, source_reference, raw_data, errors, accepted_snapshot_id, created_at)
    VALUES (?, ?, ?, ?, ?, ?)`)
    .run(id, sourceReference, rawData, JSON.stringify(errors), acceptedSnapshotId, new Date().toISOString());
  return id;
}

export function createSnapshot(db: DatabaseSync, raw: unknown): PortfolioSnapshot {
  const result = validateSnapshotInput(raw);
  if (!result.ok) throw new Error(result.errors.map((item) => `${item.column ?? "snapshot"}: ${item.message}`).join("; "));
  const value = result.value;
  const id = randomUUID();
  const createdAt = new Date().toISOString();
  const sourceReference = value.sourceReference ?? null;
  const snapshot: PortfolioSnapshot = { ...value, sourceReference, id, createdAt };
  db.prepare(`INSERT INTO portfolio_snapshots
    (id, as_of, portfolio_name, source, source_reference, data, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .run(id, value.asOf, value.portfolioName, value.source, sourceReference, JSON.stringify(value.positions), createdAt);
  appendAuditEvent(db, {
    eventType: "portfolio_snapshot.created",
    entityType: "portfolio_snapshot",
    entityId: id,
    entityVersion: 1,
    occurredAt: createdAt,
    payload: { snapshot },
  });
  return snapshot;
}

export function parseCsvRows(csv: string): { headers: string[]; rows: string[][]; errors: SnapshotValidationError[] } {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < csv.length; index += 1) {
    const char = csv[index];
    const next = csv[index + 1];
    if (quoted && char === '"' && next === '"') { field += '"'; index += 1; continue; }
    if (char === '"') { quoted = !quoted; continue; }
    if (!quoted && char === ",") { row.push(field); field = ""; continue; }
    if (!quoted && (char === "\n" || char === "\r")) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(field); field = "";
      if (row.some((cell) => cell.trim() !== "")) rows.push(row);
      row = [];
      continue;
    }
    field += char;
  }
  if (quoted) return { headers: [], rows: [], errors: [error(null, null, "csv_quote", "CSV contains an unclosed quoted field")] };
  if (field !== "" || row.length > 0) { row.push(field); rows.push(row); }
  const headers = (rows.shift() ?? []).map((header) => header.trim());
  const errors: SnapshotValidationError[] = [];
  for (const required of CSV_COLUMNS) if (!headers.includes(required)) errors.push(error(1, required, "missing_column", `CSV is missing required column ${required}`));
  if (headers.length !== new Set(headers).size) errors.push(error(1, null, "duplicate_column", "CSV contains duplicate column names"));
  return { headers, rows, errors };
}

export function importCsv(db: DatabaseSync, csv: string, sourceReference: string | null = null): CsvImportResult {
  const parsed = parseCsvRows(csv);
  if (parsed.errors.length > 0) {
    const attemptId = recordImportAttempt(db, csv, sourceReference, parsed.errors, null);
    return { ok: false, errors: parsed.errors, attemptId };
  }
  const positions: Record<string, unknown>[] = [];
  const errors: SnapshotValidationError[] = [];
  let asOf = "";
  let portfolioName = "";
  parsed.rows.forEach((values, rowIndex) => {
    const rowNumber = rowIndex + 2;
    const record: Record<string, unknown> = {};
    parsed.headers.forEach((header, index) => { record[header] = values[index] ?? ""; });
    if (!asOf) asOf = text(record.as_of);
    if (!portfolioName) portfolioName = text(record.portfolio_name);
    if (text(record.as_of) !== asOf) errors.push(error(rowNumber, "as_of", "mixed_snapshot", "all rows must share one as_of date"));
    if (text(record.portfolio_name) !== portfolioName) errors.push(error(rowNumber, "portfolio_name", "mixed_portfolio", "all rows must share one portfolio_name"));
    const parsedPosition = parsePosition(record, rowNumber);
    errors.push(...parsedPosition.errors);
    if (parsedPosition.position) positions.push(parsedPosition.position);
  });
  const result = errors.length > 0 ? { ok: false as const, errors } : validateSnapshotInput({ asOf, portfolioName, source: "csv", sourceReference, positions });
  if (!result.ok) {
    const finalErrors = result.errors;
    const attemptId = recordImportAttempt(db, csv, sourceReference, finalErrors, null);
    return { ok: false, errors: finalErrors, attemptId };
  }
  const snapshot = createSnapshot(db, result.value);
  const attemptId = recordImportAttempt(db, csv, sourceReference, [], snapshot.id);
  return { ok: true, snapshot, attemptId };
}
