export const REVIEW_DECISIONS = [
  "continue_policy",
  "deescalate",
  "defer_review",
  "create_successor",
] as const;

export type ReviewDecision = (typeof REVIEW_DECISIONS)[number];
export type ReviewStatus = "open" | "completed";

export type ReviewCompletionInput = {
  factualObservations: string;
  falsifierCheck: string;
  decision: ReviewDecision;
  rationale: string;
  followUpAt?: string | null;
};

export type ReviewDraft = Partial<ReviewCompletionInput>;

export type ReviewTriggerContext = {
  triggerId: string;
  triggerType: string;
  triggerVersion: number;
  state: string;
  evaluationId: string | null;
  observedAt: string | null;
  metricStatus: string | null;
  observedValue: number | null;
  unavailableReason: string | null;
};

export type ReviewOpeningContext = {
  covenantName: string;
  covenantPurpose: string;
  reviewRules: string[];
  candidateActions: string[];
  deescalationConditions: string[];
  reentryConditions: string[];
  triggerEvaluations: ReviewTriggerContext[];
};

export type StructuredReview = {
  id: string;
  covenantId: string;
  covenantVersion: number;
  reviewVersion: number;
  status: ReviewStatus;
  triggerIds: string[];
  openedAt: string;
  completedAt: string | null;
  openingContext: ReviewOpeningContext;
  draft: ReviewDraft;
  completion: ReviewCompletionInput | null;
  createdAt: string;
  updatedAt: string;
};
