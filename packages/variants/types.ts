import type { CovenantInput } from "../domain/types.js";
import type { TriggerDefinitionInput } from "../triggers/types.js";

export type VariantProviderKind = "local" | "openrouter";

export type VariantRequest = {
  situation: string;
  count: 2 | 3;
  useCasePack?: string | null;
};

export type VariantProvenance = {
  providerId: string;
  kind: VariantProviderKind;
  model: string;
  requestId: string;
};

export type NormalizedVariant = {
  id: string;
  title: string;
  philosophy: string;
  covenant: CovenantInput;
  triggers: TriggerDefinitionInput[];
  explanations: string[];
  assumptions: string[];
  tradeoffs: string[];
};

export type VariantResponse = {
  provenance: VariantProvenance;
  variants: NormalizedVariant[];
};

export interface VariantProvider {
  id: string;
  kind: VariantProviderKind;
  generate(request: VariantRequest): Promise<VariantResponse>;
}

export type VariantGenerationError = {
  code: "provider_unavailable" | "invalid_response" | "credential_unavailable";
  message: string;
  retryable: boolean;
};
