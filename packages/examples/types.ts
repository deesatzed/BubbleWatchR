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
