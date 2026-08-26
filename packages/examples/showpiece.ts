import type { DeepReadonly, PredictionDisciplineShowpiece } from "./types.js";

function deepFreeze<T>(value: T): DeepReadonly<T> {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value as DeepReadonly<T>;
}

export const AURORA_SHOWPIECE: PredictionDisciplineShowpiece = deepFreeze({
  id: "aurora-compute-cycle",
  fictional: true,
  title: "The Aurora Compute Cycle",
  subtitle: "A fictional forecast desk tests its decision discipline when multiple conditions converge.",
  audience: "Prediction analytics practitioners evaluating how uncertain evidence becomes a recorded human decision.",
  framing: "The forecast is context. The advance-written review protocol is the product.",
  stages: [
    {
      id: "aurora-precommit",
      state: "precommit",
      step: "01",
      eyebrow: "Before the signal",
      headline: "Write the protocol while the room is quiet.",
      narrative: "The fictional Aurora desk records the evidence it will inspect, the conditions that deserve review, and the facts that could invalidate its interpretation before any condition is active.",
      asOf: "2026-06-30T14:00:00.000Z",
      metrics: [
        { label: "AI exposure", value: "31%", detail: "User-classified baseline; review enters at 38%.", status: "available" },
        { label: "Largest position", value: "24%", detail: "Whole-portfolio baseline; review enters at 28%.", status: "available" },
        { label: "Review posture", value: "Normal", detail: "No configured condition is active.", status: "available" },
      ],
      conditions: [
        { label: "AI exposure", state: "normal", detail: "31% observed against a 38% entry and 34% exit." },
        { label: "Single-position concentration", state: "normal", detail: "24% observed against a 28% entry and 25% exit." },
        { label: "Trailing volatility", state: "unavailable", detail: "Not enough comparable observations yet." },
      ],
      evidence: [
        "Account scope and as-of time are fixed before comparison.",
        "AI classifications are user-authored and may remain unknown.",
        "Two independent active conditions invoke escalated review.",
      ],
      contraryEvidence: [
        "A classification change can alter measured exposure without a market move.",
        "A contribution or account omission can mimic concentration drift.",
      ],
      falsifierCheck: null,
      review: null,
    },
    {
      id: "aurora-observe",
      state: "observe",
      step: "02",
      eyebrow: "Saved observation",
      headline: "One number moves. Another stays unknown.",
      narrative: "A new fictional observation crosses both written entry thresholds. Volatility remains unavailable because the series still lacks two comparable intervals; the product does not convert that absence into reassurance.",
      asOf: "2026-09-30T14:00:00.000Z",
      metrics: [
        { label: "AI exposure", value: "39%", detail: "Above the 38% entry threshold; first qualifying observation.", status: "watch" },
        { label: "Largest position", value: "29%", detail: "Above the 28% entry threshold; first qualifying observation.", status: "watch" },
        { label: "Trailing volatility", value: "Unavailable", detail: "Two comparable observation intervals are required.", status: "unavailable" },
      ],
      conditions: [
        { label: "AI exposure", state: "watch", detail: "One of two required qualifying observations." },
        { label: "Single-position concentration", state: "watch", detail: "One of two required qualifying observations." },
        { label: "Trailing volatility", state: "unavailable", detail: "Prior state held; unavailable is not normal." },
      ],
      evidence: [
        "AI exposure increased from 31% to 39% in the same saved scope.",
        "The largest position increased from 24% to 29%.",
      ],
      contraryEvidence: [
        "One saved observation is insufficient under the written persistence rule.",
        "One holding still has incomplete classification evidence.",
      ],
      falsifierCheck: null,
      review: null,
    },
    {
      id: "aurora-converge",
      state: "converge",
      step: "03",
      eyebrow: "Condition convergence",
      headline: "Two conditions converge. Review—not action—escalates.",
      narrative: "A second comparable fictional observation confirms AI exposure and single-position concentration above their entries. The deterministic batch escalates the review because two independent conditions are active together.",
      asOf: "2026-10-07T14:00:00.000Z",
      metrics: [
        { label: "AI exposure", value: "40%", detail: "Second qualifying observation; review active.", status: "review" },
        { label: "Largest position", value: "30%", detail: "Second qualifying observation; review active.", status: "review" },
        { label: "Aggregate state", value: "Escalated review", detail: "Two independent active conditions; no action generated.", status: "review" },
      ],
      conditions: [
        { label: "AI exposure", state: "escalated_review", detail: "Persistence reached in the combined evaluation batch." },
        { label: "Single-position concentration", state: "escalated_review", detail: "Persistence reached in the combined evaluation batch." },
        { label: "Trailing volatility", state: "unavailable", detail: "Still displayed separately from active conditions." },
      ],
      evidence: [
        "Both entry conditions persist across two saved observations.",
        "The same account scope and as-of discipline were used.",
        "The engine records why escalation occurred.",
      ],
      contraryEvidence: [
        "Convergence does not establish a causal market thesis.",
        "Unavailable volatility limits the evidence packet.",
      ],
      falsifierCheck: null,
      review: null,
    },
    {
      id: "aurora-challenge",
      state: "challenge",
      step: "04",
      eyebrow: "Falsifier check",
      headline: "Challenge the story before recording the decision.",
      narrative: "The fictional desk separates observed arithmetic from interpretation, checks for account and classification drift, and keeps contrary evidence next to the active conditions.",
      asOf: "2026-10-08T14:00:00.000Z",
      metrics: [
        { label: "Data scope", value: "Matched", detail: "Accounts and as-of timestamps align across observations.", status: "available" },
        { label: "Classification", value: "Incomplete", detail: "One position remains explicitly unclassified.", status: "unavailable" },
        { label: "Review status", value: "Open", detail: "No disposition has been recorded yet.", status: "review" },
      ],
      conditions: [
        { label: "AI exposure", state: "escalated_review", detail: "Active while the evidence is challenged." },
        { label: "Single-position concentration", state: "escalated_review", detail: "Active while the evidence is challenged." },
        { label: "Trailing volatility", state: "unavailable", detail: "Cannot confirm or contradict the interpretation." },
      ],
      evidence: [
        "Saved weights reproduce the displayed concentration.",
        "No duplicate position or mismatched account date was found.",
      ],
      contraryEvidence: [
        "One incomplete classification could change aggregate AI exposure.",
        "Co-movement does not prove that the forecast thesis caused concentration.",
        "The unavailable volatility series weakens any claim about regime change.",
      ],
      falsifierCheck: "The desk verified same-date account scope and duplicates, retained one unknown classification, and rejected a causal inference from co-movement alone.",
      review: null,
    },
    {
      id: "aurora-record",
      state: "record",
      step: "05",
      eyebrow: "Immutable disposition",
      headline: "Restraint becomes a decision when the record is complete.",
      narrative: "The fictional desk defers the review to gather one more classified, comparable observation. The rationale, follow-up time, linked conditions, and cooldown are recorded without changing the policy or portfolio snapshot.",
      asOf: "2026-10-08T14:30:00.000Z",
      metrics: [
        { label: "Disposition", value: "Defer review", detail: "A bounded human-authored decision, not an automated action.", status: "cooldown" },
        { label: "Follow-up", value: "15 Oct 2026", detail: "A dated next review replaces open-ended delay.", status: "available" },
        { label: "Cooldown", value: "14 days", detail: "Linked conditions are closed through the written cooldown path.", status: "cooldown" },
      ],
      conditions: [
        { label: "AI exposure", state: "cooldown", detail: "Linked review completed; history retained." },
        { label: "Single-position concentration", state: "cooldown", detail: "Linked review completed; history retained." },
        { label: "Trailing volatility", state: "unavailable", detail: "The missing series remains explicit in the completed record." },
      ],
      evidence: [
        "Two deterministic conditions reached review persistence.",
        "The falsifier check and contrary evidence are stored with the packet.",
        "The follow-up is explicit and time-bounded.",
      ],
      contraryEvidence: [
        "The evidence remains incomplete enough to avoid changing the policy.",
      ],
      falsifierCheck: "The completed record retains the unknown classification, unavailable volatility, and same-scope checks rather than resolving them by assumption.",
      review: {
        decision: "defer_review",
        rationale: "Gather one more classified, comparable observation before reconsidering the advance-written policy.",
        followUpAt: "2026-10-15T14:00:00.000Z",
        cooldownDays: 14,
      },
    },
  ],
  productBoundary: {
    did: [
      "Stored a fictional advance-written review policy.",
      "Evaluated deterministic conditions against saved observations.",
      "Preserved unavailable evidence and contrary evidence.",
      "Recorded a bounded human disposition with rationale and follow-up.",
    ],
    didNot: [
      "Generate a forecast or probability.",
      "Recommend a trade or change to the fictional portfolio.",
      "Execute an order or contact a broker.",
      "Resolve uncertainty with a hidden score.",
    ],
  },
});
