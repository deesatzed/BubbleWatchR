import type { MissingDataPolicy, TriggerDefinitionInput, TriggerSeverity, TriggerType } from "./types.js";

const DAY = 86_400_000;

type WallClockParts = { year: number; month: number; day: number; hour: number; minute: number; second: number };

function wallClockParts(date: Date, timezone: string): WallClockParts {
  let formatter: Intl.DateTimeFormat;
  try {
    formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    throw new Error("Enter a valid IANA timezone");
  }
  const values = Object.fromEntries(formatter.formatToParts(date).map((part) => [part.type, part.value]));
  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    hour: Number(values.hour),
    minute: Number(values.minute),
    second: Number(values.second),
  };
}

function sameWallClock(left: WallClockParts, right: WallClockParts): boolean {
  return left.year === right.year && left.month === right.month && left.day === right.day
    && left.hour === right.hour && left.minute === right.minute && left.second === right.second;
}

export function zonedLocalDateTimeToIso(localDateTime: string, timezone: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(localDateTime);
  if (!match) throw new Error("Enter a complete local date and time");
  const target: WallClockParts = {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
    hour: Number(match[4]),
    minute: Number(match[5]),
    second: Number(match[6] ?? 0),
  };
  const targetUtc = Date.UTC(target.year, target.month - 1, target.day, target.hour, target.minute, target.second);
  const normalized = new Date(targetUtc);
  if (normalized.getUTCFullYear() !== target.year || normalized.getUTCMonth() + 1 !== target.month || normalized.getUTCDate() !== target.day
    || normalized.getUTCHours() !== target.hour || normalized.getUTCMinutes() !== target.minute || normalized.getUTCSeconds() !== target.second) {
    throw new Error("Enter a valid local date and time");
  }

  let candidate = targetUtc;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const represented = wallClockParts(new Date(candidate), timezone);
    const representedUtc = Date.UTC(represented.year, represented.month - 1, represented.day, represented.hour, represented.minute, represented.second);
    const correction = targetUtc - representedUtc;
    if (correction === 0) break;
    candidate += correction;
  }
  if (!sameWallClock(wallClockParts(new Date(candidate), timezone), target)) {
    throw new Error(`The selected local time does not exist in ${timezone}`);
  }
  return new Date(candidate).toISOString();
}

export type TriggerPresentation = {
  type: TriggerType;
  enabled: boolean;
  entryPercent: number | null;
  exitPercent: number | null;
  persistenceObservations: number;
  clearingPersistenceObservations: number;
  cooldownDays: number;
  severity: TriggerSeverity;
  missingDataPolicy: MissingDataPolicy;
  reviewInstructions: string;
  lookbackObservations: number | null;
  annualizationFactor: number | null;
  returnIntervalDays: number | null;
  missingObservationPolicy: string | null;
  minimumConcentrationChangePercent: number | null;
  minimumAppreciationContributionPercent: number | null;
  scheduledAt: string | null;
  timezone: string | null;
  reviewIntervalDays: number | null;
  reviewClock: string | null;
};

function numericSetting(settings: Record<string, unknown>, key: string): number | null {
  return typeof settings[key] === "number" ? settings[key] : null;
}

function stringSetting(settings: Record<string, unknown>, key: string): string | null {
  return typeof settings[key] === "string" ? settings[key] : null;
}

export function toTriggerPresentation(definition: TriggerDefinitionInput): TriggerPresentation {
  return {
    type: definition.type,
    enabled: definition.enabled,
    entryPercent: definition.entryThreshold === null ? null : definition.entryThreshold * 100,
    exitPercent: definition.exitThreshold === null ? null : definition.exitThreshold * 100,
    persistenceObservations: definition.persistenceObservations,
    clearingPersistenceObservations: definition.clearingPersistenceObservations,
    cooldownDays: definition.cooldownMs / DAY,
    severity: definition.severity,
    missingDataPolicy: definition.missingDataPolicy,
    reviewInstructions: definition.reviewInstructions,
    lookbackObservations: numericSetting(definition.settings, "lookbackObservations"),
    annualizationFactor: numericSetting(definition.settings, "annualizationFactor"),
    returnIntervalDays: numericSetting(definition.settings, "returnIntervalMs") === null ? null : numericSetting(definition.settings, "returnIntervalMs")! / DAY,
    missingObservationPolicy: stringSetting(definition.settings, "missingObservationPolicy"),
    minimumConcentrationChangePercent: numericSetting(definition.settings, "minimumConcentrationChange") === null ? null : numericSetting(definition.settings, "minimumConcentrationChange")! * 100,
    minimumAppreciationContributionPercent: numericSetting(definition.settings, "minimumAppreciationContribution") === null ? null : numericSetting(definition.settings, "minimumAppreciationContribution")! * 100,
    scheduledAt: stringSetting(definition.settings, "scheduledAt"),
    timezone: stringSetting(definition.settings, "timezone"),
    reviewIntervalDays: numericSetting(definition.settings, "reviewIntervalMs") === null ? null : numericSetting(definition.settings, "reviewIntervalMs")! / DAY,
    reviewClock: stringSetting(definition.settings, "reviewClock"),
  };
}

export function fromTriggerPresentation(value: TriggerPresentation): TriggerDefinitionInput {
  let settings: Record<string, unknown> = {};
  if (value.type === "trailing_volatility") {
    settings = {
      lookbackObservations: value.lookbackObservations,
      annualizationFactor: value.annualizationFactor,
      ...(value.returnIntervalDays === null ? {} : { returnIntervalMs: value.returnIntervalDays * DAY }),
      ...(value.missingObservationPolicy === null ? {} : { missingObservationPolicy: value.missingObservationPolicy }),
    };
  } else if (value.type === "appreciation_concentration") {
    settings = {
      minimumConcentrationChange: (value.minimumConcentrationChangePercent ?? 0) / 100,
      minimumAppreciationContribution: (value.minimumAppreciationContributionPercent ?? 0) / 100,
    };
  } else if (value.type === "scheduled_review") {
    settings = { scheduledAt: value.scheduledAt, timezone: value.timezone };
  } else if (value.type === "overdue_review") {
    settings = { reviewIntervalMs: (value.reviewIntervalDays ?? 0) * DAY, timezone: value.timezone, reviewClock: value.reviewClock };
  }

  return {
    type: value.type,
    enabled: value.enabled,
    entryThreshold: value.entryPercent === null ? null : value.entryPercent / 100,
    exitThreshold: value.exitPercent === null ? null : value.exitPercent / 100,
    persistenceObservations: value.persistenceObservations,
    clearingPersistenceObservations: value.clearingPersistenceObservations,
    cooldownMs: value.cooldownDays * DAY,
    severity: value.severity,
    missingDataPolicy: value.missingDataPolicy,
    reviewInstructions: value.reviewInstructions,
    settings,
  };
}

export function missingDataPolicyLabel(policy: MissingDataPolicy): string {
  if (policy === "require_manual_review") return "Require a manual data-quality review";
  if (policy === "unavailable") return "Show the condition as unavailable";
  return "Keep the prior state and show data as unavailable";
}
