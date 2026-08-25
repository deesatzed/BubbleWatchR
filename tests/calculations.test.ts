import { deepStrictEqual, equal, match, strictEqual } from "node:assert/strict";
import { test } from "node:test";
import { closeDatabase, openDatabase } from "../packages/audit/store.js";
import { calculateConcentrationDrift, calculateDrawdown, calculateSnapshot } from "../packages/calculations/calculations.js";
import { buildCalculationBundle } from "../packages/calculations/bundle.js";
import { toCalculationJson, toCalculationMarkdown } from "../packages/export/serializers.js";
import { createSnapshot, importCsv, validateSnapshotInput } from "../packages/snapshots/store.js";
import type { PortfolioSnapshot } from "../packages/snapshots/types.js";

function position(assetId: string, marketValue: number, aiExposureFraction: number | null, accountGroup = "main") {
  return { assetId, symbolOrName: assetId.toUpperCase(), quantity: 1, price: marketValue, marketValue, aiExposureFraction, accountGroup };
}

function snapshot(db: ReturnType<typeof openDatabase>, asOf: string, positions: unknown[], portfolioName = "Test Portfolio"): PortfolioSnapshot {
  return createSnapshot(db, { asOf, portfolioName, source: "manual", sourceReference: "fixture", positions });
}

test("CSV import calculates missing market value and preserves unknown AI classification", () => {
  const db = openDatabase(":memory:");
  try {
    const csv = [
      "as_of,portfolio_name,asset_id,symbol_or_name,quantity,price,market_value,ai_exposure_fraction,account_group",
      "2026-01-01,Test Portfolio,a,Alpha,2,100,,,main",
      "2026-01-01,Test Portfolio,b,Beta,1,50,50,0.5,main",
    ].join("\n");
    const result = importCsv(db, csv, "fixture.csv");
    strictEqual(result.ok, true);
    if (!result.ok) return;
    equal(result.snapshot.positions[0]?.marketValue, 200);
    strictEqual(result.snapshot.positions[0]?.aiExposureFraction, null);
    const calculation = calculateSnapshot(result.snapshot);
    equal(calculation.totalPortfolioValue, 250);
    strictEqual(calculation.aiExposure.status, "incomplete");
    strictEqual(calculation.aiExposure.value, null);
    deepStrictEqual(calculation.aiExposure.unknownPositionKeys, ["a\u0000main"]);
  } finally {
    closeDatabase(db);
  }
});

test("CSV conflicts and duplicates are rejected and recorded as import attempts", () => {
  const db = openDatabase(":memory:");
  try {
    const header = "as_of,portfolio_name,asset_id,symbol_or_name,quantity,price,market_value,ai_exposure_fraction,account_group";
    const conflict = importCsv(db, [header, "2026-01-01,P,a,Alpha,2,100,250,0.5,main"].join("\n"));
    strictEqual(conflict.ok, false);
    if (!conflict.ok) match(conflict.errors.map((item) => item.code).join(","), /conflict/);
    const duplicate = importCsv(db, [header, "2026-01-01,P,a,Alpha,2,100,200,0.5,main", "2026-01-01,P,a,Alpha,1,100,100,0.5,main"].join("\n"));
    strictEqual(duplicate.ok, false);
    if (!duplicate.ok) match(duplicate.errors.map((item) => item.code).join(","), /duplicate/);
    equal((db.prepare("SELECT COUNT(*) AS count FROM snapshot_import_attempts").get() as { count: number }).count, 2);
    equal((db.prepare("SELECT COUNT(*) AS count FROM portfolio_snapshots").get() as { count: number }).count, 0);
  } finally {
    closeDatabase(db);
  }
});

test("snapshot validation rejects invalid and zero-position inputs explicitly", () => {
  const invalid = validateSnapshotInput({ asOf: "2026-01-01", portfolioName: "P", source: "manual", positions: [{ assetId: "a", symbolOrName: "A", quantity: 1, price: "not-a-number", accountGroup: "main" }] });
  strictEqual(invalid.ok, false);
  if (!invalid.ok) match(invalid.errors.map((item) => item.code).join(","), /number/);
  const empty = validateSnapshotInput({ asOf: "2026-01-01", portfolioName: "P", source: "manual", positions: [] });
  strictEqual(empty.ok, false);
  if (!empty.ok) match(empty.errors.map((item) => item.code).join(","), /empty/);
});

test("calculation, drift, and observed drawdown are deterministic and versioned", () => {
  const db = openDatabase(":memory:");
  try {
    const first = snapshot(db, "2026-01-01", [position("a", 600, 1), position("b", 400, 0)]);
    const second = snapshot(db, "2026-02-01", [position("a", 450, 1), position("b", 450, 0)]);
    const firstCalculation = calculateSnapshot(first);
    const secondCalculation = calculateSnapshot(second);
    deepStrictEqual(secondCalculation, calculateSnapshot(second));
    equal(firstCalculation.totalPortfolioValue, 1000);
    equal(secondCalculation.totalPortfolioValue, 900);
    equal(secondCalculation.positions[0]?.weight, 0.5);
    equal(secondCalculation.aiExposure.value, 0.5);
    const drift = calculateConcentrationDrift(second, first);
    equal(drift.calculationVersion, "1");
    equal(drift.positions.find((item) => item.key === "a\u0000main")?.absolutePercentagePointChange, -0.1);
    const drawdown = calculateDrawdown(second, [first, second]);
    equal(drawdown.referenceHighSnapshotId, first.id);
    equal(drawdown.referenceHighValue, 1000);
    equal(drawdown.currentValue, 900);
    equal(drawdown.drawdown, -0.1);
    equal(drawdown.cashFlowTreatment, "not modeled");
    const before = JSON.stringify(db.prepare("SELECT data FROM portfolio_snapshots WHERE id = ?").get(second.id));
    const bundle = buildCalculationBundle(second, [first, second]);
    const after = JSON.stringify(db.prepare("SELECT data FROM portfolio_snapshots WHERE id = ?").get(second.id));
    equal(before, after);
    match(toCalculationJson(bundle), /"calculationVersion": "1"/);
    match(toCalculationJson(bundle), /"cashFlowTreatment": "not modeled"/);
    const markdown = toCalculationMarkdown(bundle);
    match(markdown, /Observed drawdown/);
    match(markdown, /Formula notes/);
    strictEqual(markdown.includes("\u0000"), false);
  } finally {
    closeDatabase(db);
  }
});
