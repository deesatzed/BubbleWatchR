import type { CovenantInput } from "../domain/types.js";
import type { TriggerDefinitionInput, TriggerStateName } from "../triggers/types.js";

export type ExamplePackId = "ai-theme" | "employer-equity" | "drawdown-volatility" | "scheduled-review";

export type DeepReadonly<T> = T extends (...args: never[]) => unknown
  ? T
  : T extends readonly (infer Item)[]
    ? readonly DeepReadonly<Item>[]
    : T extends object
      ? { readonly [Key in keyof T]: DeepReadonly<T[Key]> }
      : T;

export type FictionalObservation = DeepReadonly<{
  asOf: string;
  label: string;
  totalValue: number;
  summary: string;
  conditionState: TriggerStateName;
}>;

export type FictionalStoryStage = DeepReadonly<{
  title: string;
  body: string;
  state: "policy" | "observation" | "condition" | "review" | "cooldown";
}>;

export type FictionalExampleStory = DeepReadonly<{
  fictional: true;
  persona: string;
  situation: string;
  snapshots: FictionalObservation[];
  stages: FictionalStoryStage[];
  review: {
    factualObservations: string;
    falsifierCheck: string;
    decision: "continue_policy" | "deescalate" | "defer_review" | "create_successor";
    rationale: string;
  };
}>;

export type CovenantExample = DeepReadonly<{
  id: string;
  title: string;
  philosophy: string;
  situation: string;
  emphasis: string[];
  tradeoffs: string[];
  notFor: string[];
  covenant: CovenantInput;
  triggers: TriggerDefinitionInput[];
  story: FictionalExampleStory;
  cooldownDays: number;
}>;

export type ExamplePack = DeepReadonly<{
  id: ExamplePackId;
  title: string;
  description: string;
  examples: CovenantExample[];
}>;

export type ShowpieceMetricStatus = "available" | "unavailable" | "watch" | "review" | "cooldown";

export type ShowpieceStage = DeepReadonly<{
  id: string;
  state: "precommit" | "observe" | "converge" | "challenge" | "record";
  step: string;
  eyebrow: string;
  headline: string;
  narrative: string;
  asOf: string;
  metrics: Array<{
    label: string;
    value: string;
    detail: string;
    status: ShowpieceMetricStatus;
  }>;
  conditions: Array<{
    label: string;
    state: TriggerStateName | "unavailable";
    detail: string;
  }>;
  evidence: string[];
  contraryEvidence: string[];
  falsifierCheck: string | null;
  review: null | {
    decision: "continue_policy" | "deescalate" | "defer_review" | "create_successor";
    rationale: string;
    followUpAt: string | null;
    cooldownDays: number;
  };
}>;

export type PredictionDisciplineShowpiece = DeepReadonly<{
  id: string;
  fictional: true;
  title: string;
  subtitle: string;
  audience: string;
  framing: string;
  stages: ShowpieceStage[];
  productBoundary: {
    did: string[];
    didNot: string[];
  };
}>;
