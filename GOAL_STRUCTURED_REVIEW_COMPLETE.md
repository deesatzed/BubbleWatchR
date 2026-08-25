# GOAL.md — Structured Review Workflow

**Status:** Complete
**Working product name:** Decision Covenant
**Repository codename:** BubblerEyes
**Source date:** 2026-08-24
**Predecessor:** `GOAL_TRIGGERS_COMPLETE.md`
**Governing references:** `Decision_Covenant_GOAL.md`,
`Decision_Covenant_BUILD_GUIDELINES.md`, and `Decision_Covenant_ROADMAP.md`

## OUTCOME

A local user can open, complete, persist, inspect, and export a structured
review packet for one or more active trigger conditions. The packet captures
what was observed, which covenant version and trigger evaluations were
reviewed, the user's factual notes and falsifier check, a bounded policy
decision, rationale, and optional follow-up time. Completing the packet closes
the linked trigger reviews through the existing deterministic cooldown path.

This is a recording and review workflow. It does not recommend a trade,
simulate a rebalance, forecast a market event, contact a broker, or call an
external model or data service.

## REVIEW PACKET CONTRACT

An open review is created only for an approved covenant and one or more
existing trigger definitions currently in `review` or `escalated_review`.
Opening snapshots the trigger IDs, covenant version, current trigger states,
latest evaluation IDs, and opening timestamp into the review packet.

Completion requires:

- factual observations or evidence notes;
- a non-empty falsifier check describing what was considered;
- one bounded decision: `continue_policy`, `deescalate`, `defer_review`, or
  `create_successor`;
- a non-empty rationale;
- an optional ISO follow-up timestamp that cannot precede completion.

The packet also retains the covenant's review rules, candidate actions,
de-escalation conditions, and re-entry conditions as read-only context. Those
fields are context, not generated advice. Completed packets are immutable; a
correction creates a new review packet or successor covenant.

## PERSISTENCE AND AUDIT

Use local SQLite only. Each review has a stable ID, covenant ID/version,
review version, status (`open` or `completed`), opened/completed timestamps,
immutable opening context, and completion data. Every open, update, and
completion event is appended to the chained audit log. Completion and linked
trigger review closure must commit atomically, or neither is recorded.

The workflow must reject drafts, unknown covenant/trigger/review IDs, empty
required fields, invalid decisions, invalid timestamps, duplicate completion,
and attempts to edit a completed packet. It must not silently close unrelated
triggers.

## API, UI, AND EXPORT

Provide local JSON routes to list/open/read/complete reviews and export one
review as JSON and Markdown. The approved-covenant page must show active
trigger conditions, an accessible “Open structured review” control, the
review form, visible status/errors, and completed review history. Browser
controls must be keyboard accessible and use calm plain language.

Review Markdown must include covenant and trigger versions, opening context,
evaluation IDs, observed facts, falsifier check, decision, rationale,
follow-up, completion timestamp, and relevant audit events. It must contain
no raw NUL bytes and must state that it is a user-authored review record, not
investment advice.

## PROOF OF DONE

1. `npm ci` exits 0 from the dependency lockfile.
2. `npm run lint` and `npm run typecheck` exit 0.
3. `npm test` exits 0 and includes focused review tests proving:
   - approved-covenant and active-trigger gating;
   - required-field, decision, and timestamp validation;
   - opening context captures versions, states, and evaluation IDs;
   - open review updates are auditable;
   - completion is immutable and idempotently rejected;
   - completion closes only linked triggers into cooldown;
   - rollback leaves no partial review or trigger closure;
   - reopen/replay preserves the packet and audit chain.
4. `npm run test:e2e` proves approve → define/evaluate trigger → open
   structured review → fill required fields → complete → observe linked
   cooldown → export review Markdown.
5. `npm run verify:reviews` writes inspectable JSON and Markdown evidence with
   the completed packet, linked trigger IDs, versions, decision, rationale,
   and audit events; both artifacts are UTF-8 text with no NUL bytes.
6. `npm run verify:core` remains green and includes the new review evidence
   gate.
7. `git diff --check` is clean and governing reference documents remain
   unchanged.
8. `PROGRESS.md`, `DECISIONS.md`, `IMPLEMENT.md`, and `TASK_QUEUE.md` record
   actual commands, decisions, changed files, remaining risks, and the next
   rebalance-simulation successor.

## SCOPE

Modify only:

- `packages/reviews/` for packet types, validation, persistence, lifecycle,
  replay, and audit integration;
- `packages/triggers/` only as needed for an atomic linked-review closure;
- `packages/audit/` for review tables and immutable events;
- `packages/export/` for review JSON/Markdown provenance;
- `apps/web/` for the local accessible review workflow;
- `tests/` and `scripts/` for focused, browser, and evidence verification;
- `GOAL.md`, `TASK_QUEUE.md`, `PROGRESS.md`, `DECISIONS.md`, and `IMPLEMENT.md`
  for truth and proof updates.

Preserve unchanged:

- `GOAL_TRIGGERS_COMPLETE.md`;
- `GOAL_PORTFOLIO_SNAPSHOTS_COMPLETE.md`;
- `GOAL_FOUNDATION_COMPLETE.md`;
- `Decision_Covenant_GOAL.md`;
- `Decision_Covenant_BUILD_GUIDELINES.md`;
- `Decision_Covenant_ROADMAP.md`.

## CONSTRAINTS

- Keep all data local; add no runtime dependency or network call.
- Preserve covenant, snapshot, trigger, and audit immutability guarantees.
- Do not implement rebalance simulation, outcome measurement, notifications,
  recommendations, or broker integration in this goal.
- Do not weaken or delete predecessor tests.
- Keep review decisions descriptive and user-authored; they are not actions.
- Prefer small additive schema/API changes with explicit runtime validation.

## ITERATION AND STOP RULE

Work in small red-green batches. After each batch, run the nearest focused
test, then update `PROGRESS.md`. Stop and report if required verification is
unavailable, the same failure persists after three distinct repairs, a needed
change exceeds this scope, or a product decision would materially alter the
review contract.

## COMPLETE

Mark this goal complete only after every proof item passes from fresh command
output and the generated review evidence has been inspected.
