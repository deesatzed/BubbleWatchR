import type { AuditEvent } from "../audit/store.js";
import type { Covenant } from "../domain/types.js";

export type CovenantExport = {
  exportedAt: string;
  covenant: Covenant;
  auditEvents: AuditEvent[];
};

export function buildExport(covenant: Covenant, auditEvents: AuditEvent[]): CovenantExport {
  return { exportedAt: new Date().toISOString(), covenant, auditEvents };
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
