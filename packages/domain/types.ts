export type CovenantStatus = "draft" | "approved";

export type CovenantInput = {
  name: string;
  purpose: string;
  coveredExposure: string;
  objective: string;
  timeHorizon: string;
  maximumIntendedConcentration: number;
  maximumTolerableDrawdown: number;
  reviewRules: string[];
  candidateActions: string[];
  falsifiers: string[];
  deescalationConditions: string[];
  reentryConditions: string[];
  cooldownPolicy: string;
  notes: string;
};

export type Covenant = CovenantInput & {
  id: string;
  version: number;
  status: CovenantStatus;
  createdAt: string;
  approvedAt: string | null;
  supersedesId: string | null;
};

export type ValidationResult =
  | { ok: true; value: CovenantInput }
  | { ok: false; errors: string[] };
