import { readFile, writeFile } from "node:fs/promises";
import { closeDatabase, openDatabase } from "../dist/packages/audit/store.js";
import { buildCalculationBundle } from "../dist/packages/calculations/bundle.js";
import { toCalculationJson, toCalculationMarkdown } from "../dist/packages/export/serializers.js";
import { createSnapshot } from "../dist/packages/snapshots/store.js";

const db = openDatabase(".data/verification-calculations.sqlite");
try {
  const first = createSnapshot(db, {
    asOf: "2026-01-01",
    portfolioName: "Calculation Verification",
    source: "manual",
    sourceReference: "verify:calculations",
    positions: [
      { assetId: "alpha", symbolOrName: "Alpha", quantity: 1, price: 600, aiExposureFraction: 1, accountGroup: "main" },
      { assetId: "beta", symbolOrName: "Beta", quantity: 1, price: 400, aiExposureFraction: 0, accountGroup: "main" },
    ],
  });
  const current = createSnapshot(db, {
    asOf: "2026-02-01",
    portfolioName: "Calculation Verification",
    source: "csv",
    sourceReference: "verify:calculations.csv",
    positions: [
      { assetId: "alpha", symbolOrName: "Alpha", quantity: 1, price: 450, aiExposureFraction: null, accountGroup: "main" },
      { assetId: "beta", symbolOrName: "Beta", quantity: 1, price: 450, aiExposureFraction: 0, accountGroup: "main" },
    ],
  });
  const bundle = buildCalculationBundle(current, [first, current]);
  const jsonPath = ".data/verification-calculations.json";
  const markdownPath = ".data/verification-calculations.md";
  await writeFile(jsonPath, toCalculationJson(bundle));
  await writeFile(markdownPath, toCalculationMarkdown(bundle));
  const [json, markdown] = await Promise.all([readFile(jsonPath, "utf8"), readFile(markdownPath, "utf8")]);
  for (const required of ["source", "totalPortfolioValue", "aiExposure", "calculationVersion", "drawdown", "asOf"]) {
    if (!json.includes(required)) throw new Error(`JSON calculation export is missing ${required}`);
  }
  for (const required of ["Unknown / incomplete", "Observed drawdown", "Formula notes", "Calculation version"]) {
    if (!markdown.includes(required)) throw new Error(`Markdown calculation export is missing ${required}`);
  }
  if (markdown.includes("\u0000")) throw new Error("Markdown calculation export contains an internal NUL separator");
  console.log(`calculation exports verified: ${jsonPath}, ${markdownPath}`);
} finally {
  closeDatabase(db);
}
