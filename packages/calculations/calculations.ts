import type { PortfolioSnapshot } from "../snapshots/types.js";
import { CALCULATION_VERSION, type ConcentrationDrift, type DrawdownCalculation, type SnapshotCalculation } from "./types.js";

function round(value: number): number {
  return Number(value.toFixed(12));
}

function positionKey(assetId: string, accountGroup: string): string {
  return `${assetId}\u0000${accountGroup}`;
}

export function calculateSnapshot(snapshot: PortfolioSnapshot): SnapshotCalculation {
  const totalPortfolioValue = snapshot.positions.reduce((total, position) => total + position.marketValue, 0);
  if (!Number.isFinite(totalPortfolioValue) || totalPortfolioValue <= 0) throw new Error("total portfolio value must be greater than zero");
  const positions = snapshot.positions.map((position) => ({
    assetId: position.assetId,
    accountGroup: position.accountGroup,
    symbolOrName: position.symbolOrName,
    marketValue: position.marketValue,
    weight: round(position.marketValue / totalPortfolioValue),
    aiExposureFraction: position.aiExposureFraction,
  }));
  const unknownPositionKeys = positions
    .filter((position) => position.aiExposureFraction === null)
    .map((position) => positionKey(position.assetId, position.accountGroup));
  const complete = unknownPositionKeys.length === 0;
  const value = complete
    ? round(positions.reduce((total, position) => total + position.weight * (position.aiExposureFraction ?? 0), 0))
    : null;
  return {
    calculationVersion: CALCULATION_VERSION,
    snapshotId: snapshot.id,
    inputSnapshotIds: [snapshot.id],
    asOf: snapshot.asOf,
    source: snapshot.sourceReference ?? snapshot.source,
    totalPortfolioValue,
    positions,
    aiExposure: { status: complete ? "complete" : "incomplete", value, unknownPositionKeys },
  };
}

export function calculateConcentrationDrift(current: PortfolioSnapshot, prior: PortfolioSnapshot): ConcentrationDrift {
  const currentCalculation = calculateSnapshot(current);
  const priorCalculation = calculateSnapshot(prior);
  const priorByKey = new Map(priorCalculation.positions.map((position) => [positionKey(position.assetId, position.accountGroup), position.weight]));
  const currentByKey = new Map(currentCalculation.positions.map((position) => [positionKey(position.assetId, position.accountGroup), position.weight]));
  const keys = [...new Set([...currentByKey.keys(), ...priorByKey.keys()])].sort();
  return {
    calculationVersion: CALCULATION_VERSION,
    currentSnapshotId: current.id,
    priorSnapshotId: prior.id,
    currentAsOf: current.asOf,
    priorAsOf: prior.asOf,
    positions: keys.map((key) => {
      const currentWeight = currentByKey.get(key) ?? 0;
      const priorWeight = priorByKey.get(key) ?? 0;
      return {
        key,
        currentWeight,
        priorWeight,
        absolutePercentagePointChange: round(currentWeight - priorWeight),
        relativeChange: priorWeight === 0 ? null : round((currentWeight - priorWeight) / priorWeight),
      };
    }),
  };
}

export function calculateDrawdown(current: PortfolioSnapshot, series: PortfolioSnapshot[]): DrawdownCalculation {
  const calculations = series.map((snapshot) => ({ snapshot, calculation: calculateSnapshot(snapshot) }))
    .filter(({ snapshot }) => snapshot.portfolioName === current.portfolioName && Date.parse(snapshot.asOf) <= Date.parse(current.asOf))
    .sort((left, right) => Date.parse(left.snapshot.asOf) - Date.parse(right.snapshot.asOf) || left.snapshot.createdAt.localeCompare(right.snapshot.createdAt));
  if (!calculations.some(({ snapshot }) => snapshot.id === current.id)) calculations.push({ snapshot: current, calculation: calculateSnapshot(current) });
  const reference = calculations.reduce((best, item) => item.calculation.totalPortfolioValue > best.calculation.totalPortfolioValue ? item : best);
  const currentCalculation = calculations.find(({ snapshot }) => snapshot.id === current.id);
  if (!currentCalculation) throw new Error("current snapshot is missing from drawdown inputs");
  return {
    calculationVersion: CALCULATION_VERSION,
    currentSnapshotId: current.id,
    inputSnapshotIds: calculations.map(({ snapshot }) => snapshot.id),
    currentAsOf: current.asOf,
    referenceHighRule: "highest_observed_total_value_up_to_current_as_of",
    referenceHighSnapshotId: reference.snapshot.id,
    referenceHighValue: reference.calculation.totalPortfolioValue,
    currentValue: currentCalculation.calculation.totalPortfolioValue,
    drawdown: round((currentCalculation.calculation.totalPortfolioValue - reference.calculation.totalPortfolioValue) / reference.calculation.totalPortfolioValue),
    lookbackSnapshotIds: calculations.map(({ snapshot }) => snapshot.id),
    cashFlowTreatment: "not modeled",
    source: "local portfolio snapshots",
  };
}
