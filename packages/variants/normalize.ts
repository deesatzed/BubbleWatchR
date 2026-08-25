import { validateCovenantInput } from "../domain/lifecycle.js";
import { validateTriggerDefinition } from "../triggers/engine.js";
import type { TriggerDefinitionInput } from "../triggers/types.js";
import type { NormalizedVariant, VariantProvenance, VariantResponse } from "./types.js";

function record(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`${label} must be an object`);
  return value as Record<string, unknown>;
}

function nonEmptyString(value: unknown, label: string): string {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${label} must be a non-empty string`);
  return value.trim();
}

function stringList(value: unknown, label: string): string[] {
  if (!Array.isArray(value) || value.length === 0 || !value.every((item) => typeof item === "string" && item.trim())) throw new Error(`${label} must be a non-empty string array`);
  return value.map((item) => String(item).trim());
}

function normalizeProvenance(value: unknown): VariantProvenance {
  const source = record(value, "provenance");
  const allowed = new Set(["providerId", "kind", "model", "requestId"]);
  if (Object.keys(source).some((key) => !allowed.has(key))) throw new Error("Unsafe provenance fields are not allowed");
  if (source.kind !== "local" && source.kind !== "openrouter") throw new Error("provenance.kind must be local or openrouter");
  return {
    providerId: nonEmptyString(source.providerId, "provenance.providerId"),
    kind: source.kind,
    model: nonEmptyString(source.model, "provenance.model"),
    requestId: nonEmptyString(source.requestId, "provenance.requestId"),
  };
}

function normalizeVariant(value: unknown, index: number): NormalizedVariant {
  const source = record(value, `variant ${index + 1}`);
  const covenantResult = validateCovenantInput(source.covenant);
  if (!covenantResult.ok) throw new Error(`Variant ${index + 1} covenant is invalid: ${covenantResult.errors.join("; ")}`);
  if (covenantResult.value.candidateActions.some((action) => /\b(?:buy|sell|trade|rebalance|place an? order)\b/i.test(action))) {
    throw new Error(`Variant ${index + 1} contains an unsupported action`);
  }
  if (!Array.isArray(source.triggers) || source.triggers.length === 0) throw new Error(`Variant ${index + 1} triggers must be a non-empty array`);
  const triggers = source.triggers.map((trigger, triggerIndex) => {
    const result = validateTriggerDefinition(trigger as TriggerDefinitionInput);
    if (!result.ok) throw new Error(`Variant ${index + 1} trigger ${triggerIndex + 1} is invalid: ${result.errors.join("; ")}`);
    return result.value;
  });
  return {
    id: nonEmptyString(source.id, `variant ${index + 1}.id`),
    title: nonEmptyString(source.title, `variant ${index + 1}.title`),
    philosophy: nonEmptyString(source.philosophy, `variant ${index + 1}.philosophy`),
    covenant: covenantResult.value,
    triggers,
    explanations: stringList(source.explanations, `variant ${index + 1}.explanations`),
    assumptions: stringList(source.assumptions, `variant ${index + 1}.assumptions`),
    tradeoffs: stringList(source.tradeoffs, `variant ${index + 1}.tradeoffs`),
  };
}

export function normalizeVariantResponse(value: unknown): VariantResponse {
  const source = record(value, "response");
  const provenance = normalizeProvenance(source.provenance);
  if (!Array.isArray(source.variants) || source.variants.length < 2 || source.variants.length > 3) throw new Error("Response variants must contain two or three items");
  const variants = source.variants.map(normalizeVariant);
  if (new Set(variants.map((variant) => variant.id)).size !== variants.length) throw new Error("Response contains duplicate variant IDs");
  return { provenance, variants };
}
