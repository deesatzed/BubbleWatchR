import { deepStrictEqual, strictEqual, throws } from "node:assert/strict";
import { test } from "node:test";
import { normalizeVariantResponse } from "../packages/variants/normalize.js";

const covenant = {
  name: "Generated policy variant", purpose: "Compare a normalized draft.", coveredExposure: "User-described exposure", objective: "Keep the review process deliberate.", timeHorizon: "5 years",
  maximumIntendedConcentration: 0.35, maximumTolerableDrawdown: 0.25,
  reviewRules: ["Review persistent observations"], candidateActions: ["Continue policy", "Create a successor covenant"],
  falsifiers: ["The observation is incomplete"], deescalationConditions: ["The condition clears"], reentryConditions: ["The objective remains valid"], cooldownPolicy: "14 days", notes: "Model-drafted; user editable.",
};
const trigger = { type: "single_position_concentration", enabled: true, entryThreshold: 0.35, exitThreshold: 0.3, persistenceObservations: 2, clearingPersistenceObservations: 2, cooldownMs: 1_209_600_000, severity: "normal", missingDataPolicy: "hold_prior_state", reviewInstructions: "Inspect saved evidence.", settings: {} };

function response() {
  return { provenance: { providerId: "local-main", kind: "local", model: "example-model", requestId: "request-1" }, variants: [
    { id: "steady", title: "Steady evidence", philosophy: "Wait for persistence.", covenant, triggers: [trigger], explanations: ["Three observations reduce one-point noise."], assumptions: ["Saved observations are complete."], tradeoffs: ["The review may occur later."], ignored: "strip me" },
    { id: "calendar", title: "Calendar plus evidence", philosophy: "Review on schedule or evidence.", covenant: { ...covenant, name: "Calendar policy" }, triggers: [trigger], explanations: ["Adds a cadence."], assumptions: ["Calendar is maintained."], tradeoffs: ["May review without a threshold."], ignored: "strip me" },
  ] };
}

test("normalizes valid provider output into comparable non-persistent variants", () => {
  const normalized = normalizeVariantResponse(response());
  strictEqual(normalized.variants.length, 2);
  strictEqual(normalized.provenance.kind, "local");
  strictEqual("ignored" in normalized.variants[0]!, false);
  deepStrictEqual(normalized.variants.map((variant) => variant.id), ["steady", "calendar"]);
});

test("rejects malformed, duplicate, unsafe, invalid, and prescriptive provider output", () => {
  throws(() => normalizeVariantResponse({}), /provenance/i);
  const duplicate = response(); duplicate.variants[1]!.id = "steady";
  throws(() => normalizeVariantResponse(duplicate), /duplicate/i);
  const unsafe = response() as ReturnType<typeof response> & { provenance: Record<string, unknown> }; unsafe.provenance.apiKey = "secret";
  throws(() => normalizeVariantResponse(unsafe), /provenance/i);
  const invalid = response(); invalid.variants[0]!.covenant = { ...covenant, purpose: "" };
  throws(() => normalizeVariantResponse(invalid), /covenant/i);
  const badTrigger = response(); badTrigger.variants[0]!.triggers = [{ ...trigger, entryThreshold: 2 }];
  throws(() => normalizeVariantResponse(badTrigger), /trigger/i);
  const prescriptive = response(); prescriptive.variants[0]!.covenant = { ...covenant, candidateActions: ["Sell the position"] };
  throws(() => normalizeVariantResponse(prescriptive), /unsupported action/i);
});
