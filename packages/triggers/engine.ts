import { calculateDrawdown, calculateSnapshot } from "../calculations/calculations.js";
import type { PortfolioSnapshot, SnapshotPosition } from "../snapshots/types.js";
import { TRIGGER_TYPES, type TriggerDefinitionInput, type TriggerEvaluationContext, type TriggerMetricEvaluation, type TriggerState, type TriggerTransitionOptions } from "./types.js";

const NUMERIC_TYPES = new Set<TriggerDefinitionInput["type"]>([
  "ai_exposure",
  "single_position_concentration",
  "trailing_drawdown",
  "trailing_volatility",
  "appreciation_concentration",
]);
const SEVERITIES = new Set(["normal", "high", "critical"]);
const MISSING_DATA_POLICIES = new Set(["hold_prior_state", "unavailable", "require_manual_review"]);

function positionKey(position: Pick<SnapshotPosition, "assetId" | "accountGroup">): string {
  return `${position.assetId}\u0000${position.accountGroup}`;
}

function finite(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function timezoneValid(value: unknown): boolean {
  if (typeof value !== "string" || value.trim() === "") return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value }).format();
    return true;
  } catch {
    return false;
  }
}

function thresholdCondition(type: TriggerDefinitionInput["type"], value: number, threshold: number | null): boolean {
  if (threshold === null) return false;
  return type === "trailing_drawdown" ? value < -threshold : value > threshold;
}

function exitCondition(type: TriggerDefinitionInput["type"], value: number, threshold: number | null): boolean {
  if (threshold === null) return false;
  return type === "trailing_drawdown" ? value <= -threshold : value >= threshold;
}

function unavailable(reason: string, inputSnapshotIds: string[] = []): TriggerMetricEvaluation {
  return { status: "unavailable", observedValue: null, condition: null, details: { reason }, inputSnapshotIds };
}

function available(
  definition: TriggerDefinitionInput,
  observedValue: number,
  details: Record<string, unknown>,
  inputSnapshotIds: string[],
): TriggerMetricEvaluation {
  return {
    status: "available",
    observedValue,
    condition: thresholdCondition(definition.type, observedValue, definition.entryThreshold),
    details,
    inputSnapshotIds,
  };
}

function orderedSnapshots(context: TriggerEvaluationContext): PortfolioSnapshot[] {
  return context.snapshots
    .filter((snapshot) => snapshot.portfolioName === context.snapshots.find((item) => item.id === context.currentSnapshotId)?.portfolioName)
    .sort((left, right) => Date.parse(left.asOf) - Date.parse(right.asOf) || left.createdAt.localeCompare(right.createdAt));
}

function currentSnapshot(context: TriggerEvaluationContext): PortfolioSnapshot | null {
  return context.snapshots.find((snapshot) => snapshot.id === context.currentSnapshotId) ?? null;
}

function evaluateAiExposure(definition: TriggerDefinitionInput, context: TriggerEvaluationContext): TriggerMetricEvaluation {
  const current = currentSnapshot(context);
  if (!current) return unavailable("current snapshot is required");
  const calculation = calculateSnapshot(current);
  if (calculation.aiExposure.status !== "complete" || calculation.aiExposure.value === null) {
    return unavailable("ai exposure classification is incomplete", [current.id]);
  }
  return available(definition, calculation.aiExposure.value, { status: "complete" }, [current.id]);
}

function evaluateConcentration(definition: TriggerDefinitionInput, context: TriggerEvaluationContext): TriggerMetricEvaluation {
  const current = currentSnapshot(context);
  if (!current) return unavailable("current snapshot is required");
  const calculation = calculateSnapshot(current);
  const largest = calculation.positions.reduce<typeof calculation.positions[number] | null>(
    (best, position) => !best || position.weight > best.weight ? position : best,
    null,
  );
  if (!largest) return unavailable("no positions are available", [current.id]);
  return available(definition, largest.weight, {
    positionKey: positionKey(largest),
    symbolOrName: largest.symbolOrName,
    totalPortfolioValue: calculation.totalPortfolioValue,
  }, [current.id]);
}

function evaluateDrawdown(definition: TriggerDefinitionInput, context: TriggerEvaluationContext): TriggerMetricEvaluation {
  const current = currentSnapshot(context);
  if (!current) return unavailable("current snapshot is required");
  const series = orderedSnapshots(context);
  const calculation = calculateDrawdown(current, series);
  return available(definition, calculation.drawdown, {
    referenceHighRule: calculation.referenceHighRule,
    referenceHighSnapshotId: calculation.referenceHighSnapshotId,
    referenceHighValue: calculation.referenceHighValue,
    currentValue: calculation.currentValue,
    lookbackSnapshotIds: calculation.lookbackSnapshotIds,
    cashFlowTreatment: calculation.cashFlowTreatment,
    source: calculation.source,
    calculationVersion: calculation.calculationVersion,
  }, calculation.inputSnapshotIds);
}

function evaluateVolatility(definition: TriggerDefinitionInput, context: TriggerEvaluationContext): TriggerMetricEvaluation {
  const series = orderedSnapshots(context);
  const lookback = Number(definition.settings.lookbackObservations ?? 20);
  const annualizationFactor = Number(definition.settings.annualizationFactor ?? 252);
  if (!Number.isInteger(lookback) || lookback < 2 || !finite(annualizationFactor) || annualizationFactor <= 0) {
    return unavailable("volatility settings are invalid", series.map((snapshot) => snapshot.id));
  }
  const returnIntervalMs = definition.settings.returnIntervalMs === undefined ? null : Number(definition.settings.returnIntervalMs);
  if (returnIntervalMs !== null) {
    for (let index = 1; index < series.length; index += 1) {
      if (Date.parse(series[index]!.asOf) - Date.parse(series[index - 1]!.asOf) !== returnIntervalMs) {
        return unavailable("non-consecutive observations for configured return interval", series.map((snapshot) => snapshot.id));
      }
    }
  }
  const returns: number[] = [];
  for (let index = 1; index < series.length; index += 1) {
    const prior = calculateSnapshot(series[index - 1]!);
    const current = calculateSnapshot(series[index]!);
    if (prior.totalPortfolioValue <= 0 || current.totalPortfolioValue <= 0) return unavailable("portfolio value is invalid", series.map((snapshot) => snapshot.id));
    returns.push(current.totalPortfolioValue / prior.totalPortfolioValue - 1);
  }
  if (returns.length < lookback) return unavailable("insufficient observations for volatility", series.map((snapshot) => snapshot.id));
  const selected = returns.slice(-lookback);
  const mean = selected.reduce((total, value) => total + value, 0) / selected.length;
  const variance = selected.reduce((total, value) => total + (value - mean) ** 2, 0) / (selected.length - 1);
  const observedValue = Math.sqrt(variance) * Math.sqrt(annualizationFactor);
  return available(definition, observedValue, {
    returnCount: selected.length,
    lookbackObservations: lookback,
    returnInterval: definition.settings.returnInterval ?? "snapshot interval",
    returnIntervalMs,
    annualizationFactor,
    missingObservationPolicy: definition.settings.missingObservationPolicy ?? definition.missingDataPolicy,
    priceAdjustmentConvention: definition.settings.priceAdjustmentConvention ?? "user-entered portfolio market values",
    returnFormula: "current total value / prior total value - 1",
  }, series.slice(-lookback - 1).map((snapshot) => snapshot.id));
}

function evaluateAppreciation(definition: TriggerDefinitionInput, context: TriggerEvaluationContext): TriggerMetricEvaluation {
  const current = currentSnapshot(context);
  if (!current) return unavailable("current snapshot is required");
  const series = orderedSnapshots(context);
  const currentIndex = series.findIndex((snapshot) => snapshot.id === current.id);
  const prior = currentIndex > 0 ? series[currentIndex - 1] : null;
  if (!prior) return unavailable("prior snapshot is required", [current.id]);
  const priorByKey = new Map(prior.positions.map((position) => [positionKey(position), position]));
  if (current.positions.some((position) => position.price === null || !priorByKey.has(positionKey(position)) || priorByKey.get(positionKey(position))?.price === null)) {
    return unavailable("matched prior prices are required", [prior.id, current.id]);
  }
  const currentTotal = current.positions.reduce((total, position) => total + position.marketValue, 0);
  const priorTotal = prior.positions.reduce((total, position) => total + position.marketValue, 0);
  const counterfactualTotal = current.positions.reduce((total, position) => total + position.quantity * (priorByKey.get(positionKey(position))?.price ?? 0), 0);
  if (currentTotal <= 0 || priorTotal <= 0 || counterfactualTotal <= 0) return unavailable("portfolio value is invalid", [prior.id, current.id]);
  const candidates = current.positions.map((position) => {
    const priorPosition = priorByKey.get(positionKey(position))!;
    const currentWeight = position.marketValue / currentTotal;
    const counterfactualWeight = position.quantity * (priorPosition.price ?? 0) / counterfactualTotal;
    const priorWeight = priorPosition.marketValue / priorTotal;
    return {
      position,
      currentWeight,
      counterfactualWeight,
      priorWeight,
      appreciationContribution: currentWeight - counterfactualWeight,
      concentrationChange: currentWeight - priorWeight,
    };
  });
  const candidate = candidates.reduce((best, item) => !best || item.concentrationChange > best.concentrationChange ? item : best, null as typeof candidates[number] | null);
  if (!candidate) return unavailable("no matched positions are available", [prior.id, current.id]);
  const minimumChange = Number(definition.settings.minimumConcentrationChange ?? 0.05);
  const minimumContribution = Number(definition.settings.minimumAppreciationContribution ?? 0.05);
  const condition = candidate.concentrationChange > minimumChange && candidate.appreciationContribution > minimumContribution;
  return {
    status: "available",
    observedValue: candidate.appreciationContribution,
    condition,
    details: {
      positionKey: positionKey(candidate.position),
      currentWeight: candidate.currentWeight,
      counterfactualWeight: candidate.counterfactualWeight,
      priorWeight: candidate.priorWeight,
      appreciationContribution: candidate.appreciationContribution,
      concentrationChange: candidate.concentrationChange,
      minimumConcentrationChange: minimumChange,
      minimumAppreciationContribution: minimumContribution,
    },
    inputSnapshotIds: [prior.id, current.id],
  };
}

function evaluateScheduled(definition: TriggerDefinitionInput, context: TriggerEvaluationContext): TriggerMetricEvaluation {
  const scheduledAt = definition.settings.scheduledAt;
  if (typeof scheduledAt !== "string" || Number.isNaN(Date.parse(scheduledAt))) return unavailable("scheduledAt is invalid");
  const due = Date.parse(context.now) >= Date.parse(scheduledAt);
  return { status: "available", observedValue: due ? 1 : 0, condition: due, details: { scheduledAt, timezone: definition.settings.timezone }, inputSnapshotIds: [] };
}

function evaluateOverdue(definition: TriggerDefinitionInput, context: TriggerEvaluationContext): TriggerMetricEvaluation {
  const interval = Number(definition.settings.reviewIntervalMs);
  const clock = definition.settings.reviewClock === "last_review" ? context.lastCompletedReviewAt : context.covenantApprovedAt;
  if (!finite(interval) || interval <= 0 || !clock || Number.isNaN(Date.parse(clock))) return unavailable("review interval or review clock is unavailable");
  const dueAt = Date.parse(clock) + interval;
  const due = Date.parse(context.now) >= dueAt;
  return { status: "available", observedValue: due ? 1 : 0, condition: due, details: { dueAt: new Date(dueAt).toISOString(), timezone: definition.settings.timezone, reviewClock: definition.settings.reviewClock ?? "approval" }, inputSnapshotIds: [] };
}

export function validateTriggerDefinition(input: TriggerDefinitionInput): { ok: true; value: TriggerDefinitionInput } | { ok: false; errors: string[] } {
  const errors: string[] = [];
  if (!TRIGGER_TYPES.includes(input.type)) errors.push("type is unsupported");
  if (typeof input.enabled !== "boolean") errors.push("enabled must be boolean");
  if (!SEVERITIES.has(input.severity)) errors.push("severity is unsupported");
  if (!MISSING_DATA_POLICIES.has(input.missingDataPolicy)) errors.push("missingDataPolicy is unsupported");
  if (!input.settings || typeof input.settings !== "object" || Array.isArray(input.settings)) errors.push("settings must be an object");
  if (!Number.isInteger(input.persistenceObservations) || input.persistenceObservations < 1) errors.push("persistenceObservations must be a positive integer");
  if (!Number.isInteger(input.clearingPersistenceObservations) || input.clearingPersistenceObservations < 1) errors.push("clearingPersistenceObservations must be a positive integer");
  if (!finite(input.cooldownMs) || input.cooldownMs < 0) errors.push("cooldownMs must be non-negative");
  if (!input.reviewInstructions.trim()) errors.push("reviewInstructions is required");
  if (!NUMERIC_TYPES.has(input.type) && input.type !== "scheduled_review" && input.type !== "overdue_review") errors.push("type is unsupported");
  if (NUMERIC_TYPES.has(input.type)) {
    if (!finite(input.entryThreshold) || input.entryThreshold! < 0) errors.push("entryThreshold must be non-negative");
    if (!finite(input.exitThreshold) || input.exitThreshold! < 0) errors.push("exitThreshold must be non-negative");
    if (finite(input.entryThreshold) && finite(input.exitThreshold) && input.exitThreshold! > input.entryThreshold!) errors.push("exitThreshold cannot exceed entryThreshold");
    if (input.type === "ai_exposure" || input.type === "single_position_concentration") {
      if (input.entryThreshold! > 1 || input.exitThreshold! > 1) errors.push("fraction thresholds must be between 0 and 1");
    }
  }
  if (input.emergencyThreshold !== undefined && input.emergencyThreshold !== null && (!finite(input.emergencyThreshold) || input.emergencyThreshold < 0)) errors.push("emergencyThreshold must be non-negative");
  if (input.type === "trailing_volatility") {
    const lookback = Number(input.settings.lookbackObservations ?? 20);
    const annualization = Number(input.settings.annualizationFactor ?? 252);
    if (!Number.isInteger(lookback) || lookback < 2) errors.push("lookbackObservations must be at least 2");
    if (!finite(annualization) || annualization <= 0) errors.push("annualizationFactor must be positive");
    for (const field of ["returnInterval", "missingObservationPolicy", "priceAdjustmentConvention"] as const) {
      if (input.settings[field] !== undefined && (typeof input.settings[field] !== "string" || !(input.settings[field] as string).trim())) errors.push(`${field} must be a non-empty string`);
    }
    if (input.settings.returnIntervalMs !== undefined && (!finite(Number(input.settings.returnIntervalMs)) || Number(input.settings.returnIntervalMs) <= 0)) errors.push("returnIntervalMs must be positive");
    if (input.settings.missingObservationPolicy !== undefined && (typeof input.settings.missingObservationPolicy !== "string" || !MISSING_DATA_POLICIES.has(input.settings.missingObservationPolicy))) errors.push("settings.missingObservationPolicy is unsupported");
  }
  if (input.type === "appreciation_concentration") {
    for (const field of ["minimumConcentrationChange", "minimumAppreciationContribution"] as const) {
      const value = Number(input.settings[field] ?? 0.05);
      if (!finite(value) || value < 0 || value > 1) errors.push(`${field} must be between 0 and 1`);
    }
  }
  if (input.type === "scheduled_review") {
    if (typeof input.settings.scheduledAt !== "string" || Number.isNaN(Date.parse(input.settings.scheduledAt))) errors.push("scheduledAt must be a valid timestamp");
    if (!timezoneValid(input.settings.timezone)) errors.push("timezone must be a valid IANA timezone");
  }
  if (input.type === "overdue_review") {
    if (!finite(Number(input.settings.reviewIntervalMs)) || Number(input.settings.reviewIntervalMs) <= 0) errors.push("reviewIntervalMs must be positive");
    if (!timezoneValid(input.settings.timezone)) errors.push("timezone must be a valid IANA timezone");
    if (input.settings.reviewClock !== undefined && input.settings.reviewClock !== "approval" && input.settings.reviewClock !== "last_review") errors.push("reviewClock must be approval or last_review");
  }
  return errors.length ? { ok: false, errors } : { ok: true, value: input };
}

export function calculateTriggerMetric(definition: TriggerDefinitionInput, context: TriggerEvaluationContext): TriggerMetricEvaluation {
  if (!definition.enabled) return unavailable("trigger is disabled");
  switch (definition.type) {
    case "ai_exposure": return evaluateAiExposure(definition, context);
    case "single_position_concentration": return evaluateConcentration(definition, context);
    case "trailing_drawdown": return evaluateDrawdown(definition, context);
    case "trailing_volatility": return evaluateVolatility(definition, context);
    case "appreciation_concentration": return evaluateAppreciation(definition, context);
    case "scheduled_review": return evaluateScheduled(definition, context);
    case "overdue_review": return evaluateOverdue(definition, context);
  }
}

export function transitionTrigger(
  definition: TriggerDefinitionInput,
  previous: TriggerState,
  evaluation: TriggerMetricEvaluation,
  now: string,
  options: TriggerTransitionOptions = {},
): TriggerState {
  if (evaluation.status === "unavailable" || evaluation.condition === null) return previous;
  if (previous.state === "cooldown") {
    const emergency = definition.emergencyThreshold !== null && definition.emergencyThreshold !== undefined && evaluation.observedValue !== null && thresholdCondition(definition.type, evaluation.observedValue, definition.emergencyThreshold);
    if (emergency) return { ...previous, state: "escalated_review", qualifyingObservations: 1, clearingObservations: 0, cooldownUntil: null };
    if (previous.cooldownUntil && Date.parse(now) < Date.parse(previous.cooldownUntil)) return previous;
    return { ...previous, state: "normal", qualifyingObservations: 0, clearingObservations: 0, cooldownUntil: null };
  }
  if (options.completedReviewAt && (previous.state === "review" || previous.state === "escalated_review")) {
    const cooldownUntil = new Date(Date.parse(options.completedReviewAt) + definition.cooldownMs).toISOString();
    return { ...previous, state: "cooldown", cooldownUntil, lastReviewAt: options.completedReviewAt, qualifyingObservations: 0, clearingObservations: 0 };
  }
  if (evaluation.condition) {
    const qualifyingObservations = previous.qualifyingObservations + 1;
    const nextState = definition.severity === "critical" || (options.activeTriggerCount !== undefined && options.activeTriggerCount >= 2) || (definition.emergencyThreshold !== null && definition.emergencyThreshold !== undefined && evaluation.observedValue !== null && thresholdCondition(definition.type, evaluation.observedValue, definition.emergencyThreshold))
      ? "escalated_review"
      : qualifyingObservations >= definition.persistenceObservations ? "review" : "watch";
    return { ...previous, state: nextState, qualifyingObservations, clearingObservations: 0 };
  }
  if (previous.state !== "normal" && previous.state !== "watch" && NUMERIC_TYPES.has(definition.type) && evaluation.observedValue !== null && exitCondition(definition.type, evaluation.observedValue, definition.exitThreshold)) {
    return { ...previous, clearingObservations: 0 };
  }
  const clearingObservations = previous.clearingObservations + 1;
  if (previous.state === "normal" || previous.state === "watch") return { ...previous, state: "normal", qualifyingObservations: 0, clearingObservations: 0 };
  if (clearingObservations >= definition.clearingPersistenceObservations) return { ...previous, state: "normal", qualifyingObservations: 0, clearingObservations: 0 };
  return { ...previous, clearingObservations };
}
