import type { PortfolioSnapshot } from "../snapshots/types.js";

export const TRIGGER_TYPES = [
  "ai_exposure",
  "single_position_concentration",
  "trailing_drawdown",
  "trailing_volatility",
  "appreciation_concentration",
  "scheduled_review",
  "overdue_review",
] as const;

export type TriggerType = (typeof TRIGGER_TYPES)[number];
export type TriggerSeverity = "normal" | "high" | "critical";
export type MissingDataPolicy = "hold_prior_state" | "unavailable" | "require_manual_review";

export type TriggerDefinitionInput = {
  type: TriggerType;
  enabled: boolean;
  entryThreshold: number | null;
  exitThreshold: number | null;
  persistenceObservations: number;
  clearingPersistenceObservations: number;
  cooldownMs: number;
  severity: TriggerSeverity;
  emergencyThreshold?: number | null;
  missingDataPolicy: MissingDataPolicy;
  reviewInstructions: string;
  settings: Record<string, unknown>;
};

export type TriggerDefinition = TriggerDefinitionInput & {
  id: string;
  covenantId: string;
  covenantVersion: number;
  triggerVersion: number;
  createdAt: string;
};

export type TriggerStateName = "normal" | "watch" | "review" | "escalated_review" | "cooldown";

export type TriggerState = {
  state: TriggerStateName;
  qualifyingObservations: number;
  clearingObservations: number;
  cooldownUntil: string | null;
  lastReviewAt: string | null;
};

export type TriggerEvaluationContext = {
  now: string;
  snapshots: PortfolioSnapshot[];
  currentSnapshotId: string | null;
  covenantApprovedAt: string | null;
  lastCompletedReviewAt: string | null;
};

export type TriggerMetricEvaluation = {
  status: "available" | "unavailable";
  observedValue: number | null;
  condition: boolean | null;
  details: Record<string, unknown>;
  inputSnapshotIds: string[];
};

export type TriggerEvaluationRecord = {
  id: string;
  triggerId: string;
  observedAt: string;
  metric: TriggerMetricEvaluation;
  stateBefore: TriggerState;
  stateAfter: TriggerState;
  createdAt: string;
};

export type TriggerTransitionOptions = {
  completedReviewAt?: string | null;
  activeTriggerCount?: number;
};
