import type { TriggerStateName, TriggerType } from "../triggers/types.js";

export type WorkspaceConditionInput = {
  type: TriggerType;
  state: TriggerStateName;
  availability: "available" | "unavailable";
  scheduledAt?: string | null;
};

export type WorkspaceSummaryInput = {
  policies: readonly { status: "draft" | "approved"; version: number }[];
  observations: readonly { asOf: string }[];
  conditions: readonly WorkspaceConditionInput[];
  openReviewCount: number;
  now: string;
};

export type WorkspaceSummary = {
  mode: "first_use" | "workstation";
  policyStatus: string;
  latestObservationAt: string | null;
  conditionCounts: Record<TriggerStateName | "unavailable", number>;
  openReviewCount: number;
  nextScheduledReviewAt: string | null;
  nextAction: "create_policy" | "approve_policy" | "add_observation" | "review_condition" | "none";
};

export function projectWorkspaceSummary(input: WorkspaceSummaryInput): WorkspaceSummary {
  const policy = [...input.policies].sort((left, right) => left.version - right.version).at(-1) ?? null;
  const latestObservationAt = [...input.observations].map((observation) => observation.asOf).sort().at(-1) ?? null;
  const conditionCounts: WorkspaceSummary["conditionCounts"] = {
    normal: 0,
    watch: 0,
    review: 0,
    escalated_review: 0,
    cooldown: 0,
    unavailable: 0,
  };

  for (const condition of input.conditions) {
    if (condition.availability === "unavailable") conditionCounts.unavailable += 1;
    else conditionCounts[condition.state] += 1;
  }

  const nextScheduledReviewAt = input.conditions
    .filter((condition) => condition.type === "scheduled_review" && condition.scheduledAt && condition.scheduledAt >= input.now)
    .map((condition) => condition.scheduledAt as string)
    .sort()
    .at(0) ?? null;

  let nextAction: WorkspaceSummary["nextAction"] = "none";
  if (!policy) nextAction = "create_policy";
  else if (policy.status === "draft") nextAction = "approve_policy";
  else if (!latestObservationAt) nextAction = "add_observation";
  else if (input.openReviewCount > 0 || conditionCounts.review > 0 || conditionCounts.escalated_review > 0) nextAction = "review_condition";

  return {
    mode: policy || latestObservationAt ? "workstation" : "first_use",
    policyStatus: policy ? `${policy.status === "approved" ? "Approved" : "Draft"} · version ${policy.version}` : "No personal policy yet",
    latestObservationAt,
    conditionCounts,
    openReviewCount: input.openReviewCount,
    nextScheduledReviewAt,
    nextAction,
  };
}
