import type { AuditEvent } from "../audit/store.js";
import type { CalculationBundle } from "../calculations/types.js";
import type { Covenant } from "../domain/types.js";
import type { TriggerDefinition, TriggerEvaluationRecord, TriggerState } from "../triggers/types.js";

export type CovenantExport = {
  exportedAt: string;
  covenant: Covenant;
  auditEvents: AuditEvent[];
};

export type TriggerExport = {
  exportedAt: string;
  covenant: Covenant;
  definitions: TriggerDefinition[];
  states: Array<{ triggerId: string; state: TriggerState }>;
  evaluations: TriggerEvaluationRecord[];
  auditEvents: AuditEvent[];
};

export function buildExport(covenant: Covenant, auditEvents: AuditEvent[]): CovenantExport {
  return { exportedAt: new Date().toISOString(), covenant, auditEvents };
}

export function buildTriggerExport(
  covenant: Covenant,
  definitions: TriggerDefinition[],
  states: Array<{ triggerId: string; state: TriggerState }>,
  evaluations: TriggerEvaluationRecord[],
  auditEvents: AuditEvent[],
): TriggerExport {
  return { exportedAt: new Date().toISOString(), covenant, definitions, states, evaluations, auditEvents };
}

export function toJson(exported: CovenantExport): string {
  return `${JSON.stringify(exported, null, 2)}\n`;
}

function bulletList(items: string[]): string {
  return items.length ? items.map((item) => `- ${item}`).join("\n") : "- None recorded";
}

export function toMarkdown(exported: CovenantExport): string {
  const { covenant, auditEvents } = exported;
  return `# Decision Covenant — ${covenant.name}

> User-authored policy record. This export is not investment advice and does not execute trades.

## Version

- Version: ${covenant.version}
- Status: ${covenant.status}
- Created: ${covenant.createdAt}
- Approved: ${covenant.approvedAt ?? "Not approved"}
- Supersedes: ${covenant.supersedesId ?? "None"}
- Exported: ${exported.exportedAt}

## Policy

- Purpose: ${covenant.purpose}
- Covered exposure: ${covenant.coveredExposure}
- Objective: ${covenant.objective}
- Time horizon: ${covenant.timeHorizon}
- Maximum intended concentration: ${covenant.maximumIntendedConcentration}
- Maximum tolerable drawdown: ${covenant.maximumTolerableDrawdown}
- Cooldown policy: ${covenant.cooldownPolicy}

### Review rules

${bulletList(covenant.reviewRules)}

### Candidate actions

${bulletList(covenant.candidateActions)}

### Falsifiers

${bulletList(covenant.falsifiers)}

### De-escalation conditions

${bulletList(covenant.deescalationConditions)}

### Re-entry conditions

${bulletList(covenant.reentryConditions)}

### Notes

${covenant.notes || "None recorded"}

## Audit events

${auditEvents.map((event) => `- ${event.occurredAt} — ${event.eventType} — ${event.payloadHash}`).join("\n") || "- None recorded"}
`;
}

export function toTriggerJson(exported: TriggerExport): string {
  return `${JSON.stringify(exported, null, 2)}\n`;
}

export function toTriggerMarkdown(exported: TriggerExport): string {
  const stateById = new Map(exported.states.map((item) => [item.triggerId, item.state]));
  const definitions = exported.definitions.map((definition) => {
    const state = stateById.get(definition.id);
    return `### ${definition.type}

- Trigger ID: ${definition.id}
- Covenant version: ${definition.covenantVersion}
- Trigger version: ${definition.triggerVersion}
- State: ${state?.state ?? "normal"}
- Entry threshold: ${definition.entryThreshold ?? "Not applicable"}
- Exit threshold: ${definition.exitThreshold ?? "Not applicable"}
- Persistence observations: ${definition.persistenceObservations}
- Clearing persistence observations: ${definition.clearingPersistenceObservations}
- Cooldown milliseconds: ${definition.cooldownMs}
- Missing-data policy: ${definition.missingDataPolicy}
- Settings: ${JSON.stringify(definition.settings)}
- Review instructions: ${definition.reviewInstructions}`;
  }).join("\n\n");
  const evaluations = exported.evaluations.map((evaluation) => `- ${evaluation.observedAt} — ${evaluation.triggerId} — ${evaluation.metric.status} — ${evaluation.stateBefore.state} -> ${evaluation.stateAfter.state} — ${evaluation.metric.observedValue ?? "Unknown"}`).join("\n") || "- None recorded";
  return `# Decision Covenant — Seven Trigger Export

> User-authored review conditions and deterministic local evaluations. This export is not investment advice and does not execute trades.

## Provenance

- Covenant: ${exported.covenant.name}
- Covenant version: ${exported.covenant.version}
- Exported: ${exported.exportedAt}
- Definitions: ${exported.definitions.length}

## Trigger definitions

${definitions || "No trigger definitions recorded."}

## Evaluations and transitions

${evaluations}

## Audit events

${exported.auditEvents.map((event) => `- ${event.occurredAt} — ${event.eventType} — ${event.payloadHash}`).join("\n") || "- None recorded"}
`;
}

export function toCalculationJson(bundle: CalculationBundle): string {
  return `${JSON.stringify(bundle, null, 2)}\n`;
}

export function toCalculationCollectionJson(bundles: CalculationBundle[]): string {
  return `${JSON.stringify({ exportedAt: new Date().toISOString(), calculationVersion: bundles[0]?.calculationVersion ?? "1", bundles }, null, 2)}\n`;
}

function formatPercent(value: number | null): string {
  return value === null ? "Unknown" : `${(value * 100).toFixed(2)}%`;
}

function formatPositionKey(key: string): string {
  return key.replaceAll("\u0000", " / ");
}

export function toCalculationMarkdown(bundle: CalculationBundle): string {
  const { snapshot, calculation, concentrationDrift, drawdown } = bundle;
  const positions = calculation.positions.map((position) =>
    `| ${position.symbolOrName} | ${position.accountGroup} | ${position.marketValue.toFixed(2)} | ${formatPercent(position.weight)} | ${position.aiExposureFraction === null ? "Unknown" : position.aiExposureFraction} |`,
  ).join("\n");
  const drift = concentrationDrift
    ? concentrationDrift.positions.map((position) => `| ${formatPositionKey(position.key)} | ${formatPercent(position.priorWeight)} | ${formatPercent(position.currentWeight)} | ${formatPercent(position.absolutePercentagePointChange)} | ${formatPercent(position.relativeChange)} |`).join("\n")
    : "| None | — | — | — | — |";
  return `# Portfolio Snapshot — ${snapshot.portfolioName}

> User-provided portfolio data and deterministic descriptive calculations. This export is not investment advice.

## Provenance

- Snapshot ID: ${snapshot.id}
- As of: ${snapshot.asOf}
- Source: ${snapshot.sourceReference ?? snapshot.source}
- Created: ${snapshot.createdAt}
- Calculation version: ${bundle.calculationVersion}
- Exported: ${bundle.exportedAt}

## Totals

- Total portfolio value: ${calculation.totalPortfolioValue.toFixed(2)}
- AI exposure status: ${calculation.aiExposure.status}
- AI exposure: ${formatPercent(calculation.aiExposure.value)} (${calculation.aiExposure.status === "complete" ? "complete" : "Unknown / incomplete"})
- Unknown AI positions: ${calculation.aiExposure.unknownPositionKeys.map(formatPositionKey).join(", ") || "None"}

## Positions

| Position | Account | Market value | Weight | AI exposure fraction |
| --- | --- | ---: | ---: | ---: |
${positions}

## Concentration drift

${concentrationDrift ? `Compared with snapshot ${concentrationDrift.priorSnapshotId} as of ${concentrationDrift.priorAsOf}.` : "No prior snapshot was selected."}

| Position | Prior weight | Current weight | Percentage-point change | Relative change |
| --- | ---: | ---: | ---: | ---: |
${drift}

## Observed drawdown

- Current value: ${drawdown.currentValue.toFixed(2)}
- Reference-high rule: ${drawdown.referenceHighRule}
- Reference-high snapshot: ${drawdown.referenceHighSnapshotId}
- Reference-high value: ${drawdown.referenceHighValue.toFixed(2)}
- Observed drawdown: ${formatPercent(drawdown.drawdown)}
- Lookback snapshots: ${drawdown.lookbackSnapshotIds.join(", ")}
- Cash-flow treatment: ${drawdown.cashFlowTreatment}
- Source: ${drawdown.source}

Formula notes: position weight = position market value / total portfolio value. AI exposure is incomplete when any position classification is unknown. Drawdown is observed arithmetic from the selected reference high; it is not a forecast.
`;
}

export function toCalculationCollectionMarkdown(bundles: CalculationBundle[]): string {
  return `# Portfolio Calculation Exports

Generated: ${new Date().toISOString()}

${bundles.map((bundle) => toCalculationMarkdown(bundle)).join("\n---\n\n") || "No snapshots recorded."}`;
}
