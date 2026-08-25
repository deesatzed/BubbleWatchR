import type { PortfolioSnapshot } from "../snapshots/types.js";

export const CALCULATION_VERSION = "1";

export type PositionCalculation = {
  assetId: string;
  accountGroup: string;
  symbolOrName: string;
  marketValue: number;
  weight: number;
  aiExposureFraction: number | null;
};

export type AiExposureCalculation = {
  status: "complete" | "incomplete";
  value: number | null;
  unknownPositionKeys: string[];
};

export type SnapshotCalculation = {
  calculationVersion: string;
  snapshotId: string;
  inputSnapshotIds: string[];
  asOf: string;
  source: string;
  totalPortfolioValue: number;
  positions: PositionCalculation[];
  aiExposure: AiExposureCalculation;
};

export type ConcentrationDrift = {
  calculationVersion: string;
  currentSnapshotId: string;
  priorSnapshotId: string;
  currentAsOf: string;
  priorAsOf: string;
  positions: Array<{
    key: string;
    currentWeight: number;
    priorWeight: number;
    absolutePercentagePointChange: number;
    relativeChange: number | null;
  }>;
};

export type DrawdownCalculation = {
  calculationVersion: string;
  currentSnapshotId: string;
  inputSnapshotIds: string[];
  currentAsOf: string;
  referenceHighRule: "highest_observed_total_value_up_to_current_as_of";
  referenceHighSnapshotId: string;
  referenceHighValue: number;
  currentValue: number;
  drawdown: number;
  lookbackSnapshotIds: string[];
  cashFlowTreatment: "not modeled";
  source: "local portfolio snapshots";
};

export type CalculationBundle = {
  exportedAt: string;
  calculationVersion: string;
  snapshot: PortfolioSnapshot;
  calculation: SnapshotCalculation;
  priorCalculation: SnapshotCalculation | null;
  concentrationDrift: ConcentrationDrift | null;
  drawdown: DrawdownCalculation;
};
