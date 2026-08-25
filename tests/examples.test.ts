import { deepStrictEqual, ok, strictEqual } from "node:assert/strict";
import { test } from "node:test";
import { validateCovenantInput } from "../packages/domain/lifecycle.js";
import type { CovenantInput } from "../packages/domain/types.js";
import { EXAMPLE_PACKS } from "../packages/examples/index.js";
import { validateTriggerDefinition } from "../packages/triggers/engine.js";
import type { TriggerDefinitionInput } from "../packages/triggers/types.js";

const DAY = 86_400_000;

function isDeepFrozen(value: unknown): boolean {
  if (!value || typeof value !== "object") return true;
  return Object.isFrozen(value) && Object.values(value).every(isDeepFrozen);
}

test("ships four use-case packs with three meaningful schema-valid examples each", () => {
  deepStrictEqual(EXAMPLE_PACKS.map((pack) => pack.id), [
    "ai-theme",
    "employer-equity",
    "drawdown-volatility",
    "scheduled-review",
  ]);
  strictEqual(EXAMPLE_PACKS.length, 4);
  const examples = EXAMPLE_PACKS.flatMap((pack) => {
    strictEqual(pack.examples.length, 3, `${pack.id} should contain three examples`);
    return pack.examples;
  });
  strictEqual(examples.length, 12);
  strictEqual(new Set(examples.map((example) => example.id)).size, 12);

  for (const example of examples) {
    strictEqual(validateCovenantInput(example.covenant as unknown as CovenantInput).ok, true, `${example.id} covenant should validate`);
    ok(example.triggers.length > 0, `${example.id} should define conditions`);
    for (const trigger of example.triggers) {
      strictEqual(validateTriggerDefinition(trigger as unknown as TriggerDefinitionInput).ok, true, `${example.id} ${trigger.type} should validate`);
      strictEqual(trigger.cooldownMs, example.cooldownDays * DAY, `${example.id} trigger cooldown should match its covenant`);
    }
    ok(example.covenant.cooldownPolicy.includes(String(example.cooldownDays)), `${example.id} cooldown prose should expose the operational day count`);
    strictEqual(example.story.fictional, true);
    ok(example.story.persona.startsWith("Fictional "));
    ok(example.story.snapshots.length >= 2, `${example.id} should show observation change`);
    strictEqual(example.story.snapshots[0]?.conditionState, "normal", `${example.id} should begin calm`);
    ok(["review", "escalated_review"].includes(example.story.snapshots.at(-1)?.conditionState ?? ""), `${example.id} should end in a reviewable condition`);
    ok(new Set(example.story.snapshots.map((snapshot) => snapshot.conditionState)).size >= 2, `${example.id} should show a real state change`);
    ok(example.story.stages.length >= 5, `${example.id} should show the complete lifecycle`);
    ok(example.story.review.factualObservations.trim().length > 0, `${example.id} should include fictional facts`);
    ok(example.story.review.falsifierCheck.trim().length > 0, `${example.id} should include a falsifier check`);
    ok(example.story.review.rationale.trim().length > 0, `${example.id} should include a review rationale`);
    ok(example.covenant.reviewRules.some((rule) => rule !== "Review only after the configured condition persists in saved observations."), `${example.id} should preserve specific evidence rules when copied`);
    ok(example.covenant.falsifiers.some((falsifier) => falsifier !== "The observation is stale, incomplete, duplicated, or measured against the wrong scope."), `${example.id} should preserve specific falsifiers when copied`);
    ok(example.tradeoffs.length > 0, `${example.id} should disclose tradeoffs`);
    ok(example.notFor.length > 0, `${example.id} should say when it may not fit`);
    ok(example.emphasis.length > 0, `${example.id} should have a distinct emphasis`);
    strictEqual(isDeepFrozen(example), true, `${example.id} presentation data should be deeply immutable`);
  }

  strictEqual(isDeepFrozen(EXAMPLE_PACKS), true, "the complete example library should be deeply immutable");
  strictEqual(new Set(examples.map((example) => example.covenant.falsifiers.join("\n"))).size, 12, "each example should carry distinct evidence checks into a draft");
});

test("examples differ in philosophy, enabled conditions, and cooldown posture", () => {
  for (const pack of EXAMPLE_PACKS) {
    strictEqual(new Set(pack.examples.map((example) => example.philosophy)).size, 3, `${pack.id} philosophies should differ`);
    strictEqual(new Set(pack.examples.map((example) => example.triggers.map((trigger) => trigger.type).sort().join(","))).size, 3, `${pack.id} condition sets should differ`);
    strictEqual(new Set(pack.examples.map((example) => example.covenant.cooldownPolicy)).size, 3, `${pack.id} cooldown posture should differ`);
  }
});

test("calendar stories reach their configured review date and numeric stories show persistence", () => {
  const examples = EXAMPLE_PACKS.flatMap((pack) => pack.examples);
  for (const example of examples) {
    const lastDate = example.story.snapshots.at(-1)?.asOf ?? "";
    const scheduled = example.triggers.find((trigger) => trigger.type === "scheduled_review");
    if (["employer-scheduled", "scheduled-quarterly", "scheduled-annual"].includes(example.id)) {
      const scheduledAt = String(scheduled?.settings.scheduledAt ?? "").slice(0, 10);
      ok(lastDate >= scheduledAt, `${example.id} story should reach its scheduled review date`);
    }

    if (!example.triggers.some((trigger) => trigger.type === "scheduled_review" || trigger.type === "overdue_review")) {
      const persistence = Math.max(...example.triggers.map((trigger) => trigger.persistenceObservations));
      const qualifying = example.story.snapshots.filter((snapshot) => snapshot.conditionState === "watch" || snapshot.conditionState === "review" || snapshot.conditionState === "escalated_review");
      ok(qualifying.length >= persistence, `${example.id} story should contain enough qualifying observations`);
    }
  }

  for (const id of ["ai-cross-account", "ai-appreciation-drift", "employer-issuer-drift", "employer-scheduled", "multi-condition"]) {
    const example = examples.find((candidate) => candidate.id === id)!;
    strictEqual(example.story.snapshots.at(-1)?.conditionState, "escalated_review", `${id} should show aggregate escalation`);
  }

  const overdue = examples.find((example) => example.id === "scheduled-overdue")!;
  const elapsedDays = (Date.parse(`${overdue.story.snapshots.at(-1)?.asOf}T00:00:00.000Z`) - Date.parse(`${overdue.story.snapshots[0]?.asOf}T00:00:00.000Z`)) / DAY;
  strictEqual(elapsedDays, 29, "overdue story dates should advance from day 92 to day 121");
});
