import { deepStrictEqual, strictEqual } from "node:assert/strict";
import { test } from "node:test";
import { projectWorkspaceSummary } from "../packages/workspace/summary.js";

const approved = { status: "approved" as const, version: 1 };
const observed = [{ asOf: "2026-08-20" }];

test("projects first-use, draft, and approved-without-observation next steps", () => {
  const empty = projectWorkspaceSummary({ policies: [], observations: [], conditions: [], openReviewCount: 0, now: "2026-08-25T12:00:00.000Z" });
  strictEqual(empty.mode, "first_use");
  strictEqual(empty.nextAction, "create_policy");

  const observationOnly = projectWorkspaceSummary({ policies: [], observations: observed, conditions: [], openReviewCount: 0, now: "2026-08-25T12:00:00.000Z" });
  strictEqual(observationOnly.mode, "workstation");
  strictEqual(observationOnly.policyStatus, "No personal policy yet");
  strictEqual(observationOnly.latestObservationAt, "2026-08-20");
  strictEqual(observationOnly.nextAction, "create_policy");

  const draft = projectWorkspaceSummary({ policies: [{ status: "draft", version: 1 }], observations: [], conditions: [], openReviewCount: 0, now: "2026-08-25T12:00:00.000Z" });
  strictEqual(draft.policyStatus, "Draft · version 1");
  strictEqual(draft.nextAction, "approve_policy");

  const noObservation = projectWorkspaceSummary({ policies: [approved], observations: [], conditions: [], openReviewCount: 0, now: "2026-08-25T12:00:00.000Z" });
  strictEqual(noObservation.nextAction, "add_observation");
});

test("keeps unavailable separate, surfaces reviews, and finds the next schedule", () => {
  const unavailable = projectWorkspaceSummary({
    policies: [approved], observations: observed,
    conditions: [
      { type: "trailing_volatility", state: "normal", availability: "unavailable" },
      { type: "single_position_concentration", state: "normal", availability: "available" },
      { type: "scheduled_review", state: "normal", availability: "available", scheduledAt: "2026-10-01T14:00:00.000Z" },
      { type: "scheduled_review", state: "normal", availability: "available", scheduledAt: "2027-01-05T15:00:00.000Z" },
    ],
    openReviewCount: 0,
    now: "2026-08-25T12:00:00.000Z",
  });
  strictEqual(unavailable.latestObservationAt, "2026-08-20");
  strictEqual(unavailable.conditionCounts.unavailable, 1);
  strictEqual(unavailable.conditionCounts.normal, 3);
  strictEqual(unavailable.nextScheduledReviewAt, "2026-10-01T14:00:00.000Z");
  strictEqual(unavailable.nextAction, "none");

  const active = projectWorkspaceSummary({ policies: [approved], observations: observed, conditions: [{ type: "trailing_drawdown", state: "review", availability: "available" }], openReviewCount: 0, now: "2026-08-25T12:00:00.000Z" });
  strictEqual(active.nextAction, "review_condition");
  strictEqual(active.conditionCounts.review, 1);

  const open = projectWorkspaceSummary({ policies: [approved], observations: observed, conditions: [], openReviewCount: 2, now: "2026-08-25T12:00:00.000Z" });
  strictEqual(open.nextAction, "review_condition");
  strictEqual(open.openReviewCount, 2);
  deepStrictEqual(Object.keys(open.conditionCounts).sort(), ["cooldown", "escalated_review", "normal", "review", "unavailable", "watch"]);
});
