import type { PortfolioSnapshot } from "../snapshots/types.js";
import { calculateConcentrationDrift, calculateDrawdown, calculateSnapshot } from "./calculations.js";
import { CALCULATION_VERSION, type CalculationBundle } from "./types.js";

export function buildCalculationBundle(snapshot: PortfolioSnapshot, series: PortfolioSnapshot[]): CalculationBundle {
  const ordered = series.filter((item) => item.portfolioName === snapshot.portfolioName)
    .sort((left, right) => Date.parse(left.asOf) - Date.parse(right.asOf) || left.createdAt.localeCompare(right.createdAt));
  const prior = [...ordered].reverse().find((item) => item.asOf < snapshot.asOf) ?? null;
  const calculation = calculateSnapshot(snapshot);
  const priorCalculation = prior ? calculateSnapshot(prior) : null;
  return {
    exportedAt: new Date().toISOString(),
    calculationVersion: CALCULATION_VERSION,
    snapshot,
    calculation,
    priorCalculation,
    concentrationDrift: prior ? calculateConcentrationDrift(snapshot, prior) : null,
    drawdown: calculateDrawdown(snapshot, ordered),
  };
}
