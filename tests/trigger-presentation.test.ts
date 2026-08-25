import { deepStrictEqual, strictEqual, throws } from "node:assert/strict";
import { test } from "node:test";
import { fromTriggerPresentation, missingDataPolicyLabel, toTriggerPresentation, zonedLocalDateTimeToIso } from "../packages/triggers/presentation.js";
import type { TriggerDefinitionInput } from "../packages/triggers/types.js";

const DAY = 86_400_000;

const definitions: TriggerDefinitionInput[] = [
  { type: "ai_exposure", enabled: true, entryThreshold: 0.4, exitThreshold: 0.35, persistenceObservations: 3, clearingPersistenceObservations: 2, cooldownMs: 21 * DAY, severity: "normal", missingDataPolicy: "require_manual_review", reviewInstructions: "Review AI scope.", settings: {} },
  { type: "single_position_concentration", enabled: true, entryThreshold: 0.25, exitThreshold: 0.22, persistenceObservations: 2, clearingPersistenceObservations: 2, cooldownMs: 14 * DAY, severity: "high", missingDataPolicy: "hold_prior_state", reviewInstructions: "Review issuer scope.", settings: {} },
  { type: "trailing_drawdown", enabled: true, entryThreshold: 0.2, exitThreshold: 0.15, persistenceObservations: 2, clearingPersistenceObservations: 2, cooldownMs: 12 * DAY, severity: "normal", missingDataPolicy: "hold_prior_state", reviewInstructions: "Verify reference high.", settings: {} },
  { type: "trailing_volatility", enabled: true, entryThreshold: 0.22, exitThreshold: 0.18, persistenceObservations: 2, clearingPersistenceObservations: 2, cooldownMs: 18 * DAY, severity: "normal", missingDataPolicy: "unavailable", reviewInstructions: "Verify cadence.", settings: { lookbackObservations: 4, annualizationFactor: 12, returnIntervalMs: 30 * DAY, missingObservationPolicy: "hold_prior_state" } },
  { type: "appreciation_concentration", enabled: true, entryThreshold: 0.08, exitThreshold: 0.05, persistenceObservations: 2, clearingPersistenceObservations: 2, cooldownMs: 30 * DAY, severity: "normal", missingDataPolicy: "hold_prior_state", reviewInstructions: "Verify price-led drift.", settings: { minimumConcentrationChange: 0.05, minimumAppreciationContribution: 0.05 } },
  { type: "scheduled_review", enabled: true, entryThreshold: null, exitThreshold: null, persistenceObservations: 1, clearingPersistenceObservations: 1, cooldownMs: 5 * DAY, severity: "normal", missingDataPolicy: "hold_prior_state", reviewInstructions: "Review on schedule.", settings: { scheduledAt: "2026-10-01T14:00:00.000Z", timezone: "America/New_York" } },
  { type: "overdue_review", enabled: true, entryThreshold: null, exitThreshold: null, persistenceObservations: 1, clearingPersistenceObservations: 1, cooldownMs: 9 * DAY, severity: "normal", missingDataPolicy: "hold_prior_state", reviewInstructions: "Restore cadence.", settings: { reviewIntervalMs: 120 * DAY, timezone: "America/New_York", reviewClock: "last_review" } },
];

test("all seven trigger types round-trip through human presentation units", () => {
  for (const definition of definitions) {
    const presentation = toTriggerPresentation(definition);
    if (definition.entryThreshold !== null) strictEqual(presentation.entryPercent, definition.entryThreshold * 100);
    strictEqual(presentation.cooldownDays, definition.cooldownMs / DAY);
    deepStrictEqual(fromTriggerPresentation(presentation), definition);
  }
});

test("presentation exposes date, volatility, cooldown, and missing-data meaning", () => {
  const volatility = toTriggerPresentation(definitions[3]!);
  strictEqual(volatility.lookbackObservations, 4);
  strictEqual(volatility.returnIntervalDays, 30);
  const scheduled = toTriggerPresentation(definitions[5]!);
  strictEqual(scheduled.scheduledAt, "2026-10-01T14:00:00.000Z");
  const overdue = toTriggerPresentation(definitions[6]!);
  strictEqual(overdue.reviewIntervalDays, 120);
  strictEqual(missingDataPolicyLabel("hold_prior_state"), "Keep the prior state and show data as unavailable");
  strictEqual(missingDataPolicyLabel("require_manual_review"), "Require a manual data-quality review");
});

test("scheduled wall time uses the selected IANA timezone instead of the runtime timezone", () => {
  strictEqual(zonedLocalDateTimeToIso("2026-12-15T09:00", "America/New_York"), "2026-12-15T14:00:00.000Z");
  strictEqual(zonedLocalDateTimeToIso("2026-12-15T09:00", "America/Los_Angeles"), "2026-12-15T17:00:00.000Z");
  strictEqual(zonedLocalDateTimeToIso("2026-12-15T09:00", "UTC"), "2026-12-15T09:00:00.000Z");
  throws(() => zonedLocalDateTimeToIso("2026-03-08T02:30", "America/New_York"), /does not exist/);
  throws(() => zonedLocalDateTimeToIso("2026-12-15T09:00", "Not\/A_Zone"), /timezone/);
});
