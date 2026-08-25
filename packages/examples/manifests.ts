import type { CovenantInput } from "../domain/types.js";
import type { TriggerDefinitionInput, TriggerStateName, TriggerType } from "../triggers/types.js";
import type { CovenantExample, DeepReadonly, ExamplePack, FictionalExampleStory, FictionalObservation } from "./types.js";

const DAY = 86_400_000;

function covenant(overrides: Partial<CovenantInput> & Pick<CovenantInput, "name" | "purpose" | "coveredExposure" | "objective" | "cooldownPolicy">): CovenantInput {
  return {
    name: overrides.name,
    purpose: overrides.purpose,
    coveredExposure: overrides.coveredExposure,
    objective: overrides.objective,
    timeHorizon: overrides.timeHorizon ?? "5 years",
    maximumIntendedConcentration: overrides.maximumIntendedConcentration ?? 0.35,
    maximumTolerableDrawdown: overrides.maximumTolerableDrawdown ?? 0.25,
    reviewRules: overrides.reviewRules ?? ["Review only after the configured condition persists in saved observations."],
    candidateActions: overrides.candidateActions ?? ["Continue the current policy", "De-escalate under the written conditions", "Create a successor covenant"],
    falsifiers: overrides.falsifiers ?? ["The observation is stale, incomplete, duplicated, or measured against the wrong scope."],
    deescalationConditions: overrides.deescalationConditions ?? ["The condition clears below its written exit threshold."],
    reentryConditions: overrides.reentryConditions ?? ["The original objective and evidence remain valid after cooldown."],
    cooldownPolicy: overrides.cooldownPolicy,
    notes: overrides.notes ?? "Fictional teaching example. The values are illustrative, not suggested settings.",
  };
}

function numericTrigger(type: Extract<TriggerType, "ai_exposure" | "single_position_concentration" | "trailing_drawdown" | "trailing_volatility" | "appreciation_concentration">, entryThreshold: number, exitThreshold: number, overrides: Partial<TriggerDefinitionInput> = {}): TriggerDefinitionInput {
  const settings = type === "trailing_volatility"
    ? { lookbackObservations: 3, annualizationFactor: 12, missingObservationPolicy: "hold_prior_state" }
    : type === "appreciation_concentration"
      ? { minimumConcentrationChange: 0.05, minimumAppreciationContribution: 0.05 }
      : {};
  return {
    type,
    enabled: true,
    entryThreshold,
    exitThreshold,
    persistenceObservations: 2,
    clearingPersistenceObservations: 2,
    cooldownMs: 14 * DAY,
    severity: "normal",
    missingDataPolicy: "hold_prior_state",
    reviewInstructions: "Inspect the saved observation, check data quality, and apply only the written covenant.",
    settings,
    ...overrides,
  };
}

function scheduledTrigger(scheduledAt: string, overrides: Partial<TriggerDefinitionInput> = {}): TriggerDefinitionInput {
  return {
    type: "scheduled_review",
    enabled: true,
    entryThreshold: null,
    exitThreshold: null,
    persistenceObservations: 1,
    clearingPersistenceObservations: 1,
    cooldownMs: 30 * DAY,
    severity: "normal",
    missingDataPolicy: "hold_prior_state",
    reviewInstructions: "Review the policy on the written schedule even if no market condition is active.",
    settings: { scheduledAt, timezone: "America/New_York" },
    ...overrides,
  };
}

function overdueTrigger(intervalDays: number, overrides: Partial<TriggerDefinitionInput> = {}): TriggerDefinitionInput {
  return {
    type: "overdue_review",
    enabled: true,
    entryThreshold: null,
    exitThreshold: null,
    persistenceObservations: 1,
    clearingPersistenceObservations: 1,
    cooldownMs: 14 * DAY,
    severity: "normal",
    missingDataPolicy: "hold_prior_state",
    reviewInstructions: "Re-establish a documented review cadence before changing the policy.",
    settings: { reviewIntervalMs: intervalDays * DAY, timezone: "America/New_York", reviewClock: "last_review" },
    ...overrides,
  };
}

type StoryOptions = {
  baselineAsOf?: string;
  activeAsOf?: string;
  preconditionObservations?: number;
  persistenceObservations?: number;
  activeState?: Extract<TriggerStateName, "review" | "escalated_review">;
};

function spreadDate(start: string, end: string, index: number, finalIndex: number): string {
  if (index === finalIndex) return end;
  const startMs = Date.parse(`${start}T00:00:00.000Z`);
  const endMs = Date.parse(`${end}T00:00:00.000Z`);
  return new Date(startMs + ((endMs - startMs) * index) / finalIndex).toISOString().slice(0, 10);
}

function story(persona: string, situation: string, first: string, second: string, review: FictionalExampleStory["review"], options: StoryOptions = {}): FictionalExampleStory {
  const baselineAsOf = options.baselineAsOf ?? "2026-01-31";
  const activeAsOf = options.activeAsOf ?? "2026-07-31";
  const preconditionObservations = options.preconditionObservations ?? 0;
  const persistenceObservations = options.persistenceObservations ?? 2;
  const activeState = options.activeState ?? "review";
  const finalIndex = preconditionObservations + persistenceObservations;
  const snapshots: FictionalObservation[] = Array.from({ length: finalIndex + 1 }, (_, index) => {
    const isBaseline = index === 0;
    const isActive = index === finalIndex;
    const qualifyingIndex = index - preconditionObservations;
    const isPrecondition = index > 0 && qualifyingIndex <= 0;
    return {
      asOf: spreadDate(baselineAsOf, activeAsOf, index, finalIndex),
      label: isBaseline
        ? "Calm baseline"
        : isPrecondition
          ? `Cadence observation ${index}`
          : isActive
            ? "Condition confirmed"
            : `Qualifying observation ${qualifyingIndex}`,
      totalValue: Math.round(100_000 + (12_000 * index) / finalIndex),
      summary: isBaseline
        ? first
        : isPrecondition
          ? "A complete saved observation preserves the required cadence without activating the condition."
          : isActive
            ? second
            : `Confirmation ${qualifyingIndex} of ${persistenceObservations}: ${second}`,
      conditionState: isBaseline || isPrecondition ? "normal" : isActive ? activeState : "watch",
    };
  });
  return {
    fictional: true,
    persona: `Fictional ${persona}`,
    situation,
    snapshots,
    stages: [
      { title: "Policy written", body: `${persona} records the review process before a condition is active.`, state: "policy" },
      { title: "Observation changed", body: second, state: "observation" },
      { title: "Condition ready for review", body: "The persisted observation reaches the example's written entry condition.", state: "condition" },
      { title: "Review recorded", body: `${review.falsifierCheck} ${review.rationale}`, state: "review" },
      { title: "Cooldown", body: "The fictional review is complete and the written cooldown is now visible.", state: "cooldown" },
    ],
    review,
  };
}

function example(value: CovenantExample): CovenantExample {
  return deepFreeze(value);
}

function deepFreeze<T>(value: T): DeepReadonly<T> {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value as DeepReadonly<T>;
}

export const EXAMPLE_PACKS: readonly ExamplePack[] = deepFreeze([
  {
    id: "ai-theme",
    title: "AI and thematic exposure",
    description: "See how a policy can track related holdings without treating an AI classification as universal truth.",
    examples: [
      example({
        id: "ai-evidence-first",
        title: "Evidence-first participation",
        philosophy: "Require persistent evidence and a falsifier check before reconsidering a long-horizon policy.",
        situation: "Several AI-related holdings matter in aggregate, but short-term headlines should not drive the review cadence.",
        emphasis: ["Persistent observations", "Unknown classifications stay visible", "Longer cooldown"],
        tradeoffs: ["A persistent condition may be reviewed later than a more reactive policy."],
        notFor: ["Someone who needs immediate alerts or automatic portfolio actions."],
        cooldownDays: 21,
        covenant: covenant({
          name: "AI evidence-first participation",
          purpose: "Separate durable changes in AI-related exposure from short-lived narrative pressure.",
          coveredExposure: "User-classified AI-related holdings across saved accounts",
          objective: "Retain intentional participation while requiring evidence before policy reconsideration.",
          cooldownPolicy: "21 days after a completed review",
          reviewRules: ["Review AI exposure only after three qualifying saved observations.", "Check unknown classifications before interpreting the result."],
          falsifiers: ["An account is missing, an as-of date differs, or a user-authored AI classification changed between observations."],
          maximumIntendedConcentration: 0.4,
        }),
        triggers: [numericTrigger("ai_exposure", 0.4, 0.35, { persistenceObservations: 3, cooldownMs: 21 * DAY }), scheduledTrigger("2027-01-15T15:00:00.000Z", { cooldownMs: 21 * DAY })],
        story: story("Jordan", "Jordan tracks several self-classified AI holdings across two accounts.", "AI exposure is 31%, with one holding still unclassified.", "AI exposure is 42% for the third saved observation; the unclassified holding remains explicit.", {
          factualObservations: "Three saved observations place known AI exposure above the written threshold; one holding remains unclassified.",
          falsifierCheck: "Jordan checks that account scope and classifications did not change between observations.",
          decision: "defer_review",
          rationale: "The condition is real, but incomplete classification warrants a dated follow-up rather than an immediate policy change.",
        }, { persistenceObservations: 3, activeAsOf: "2026-09-30" }),
      }),
      example({
        id: "ai-cross-account",
        title: "Cross-account AI visibility",
        philosophy: "Review aggregate theme exposure and the largest position together so account boundaries do not hide concentration.",
        situation: "AI exposure is spread across retirement and taxable accounts, while one issuer may dominate the combined view.",
        emphasis: ["Combined account scope", "Theme plus issuer concentration", "Missing data requires manual review"],
        tradeoffs: ["Requires consistent account-group and classification data."],
        notFor: ["A portfolio whose accounts cannot be observed on the same dates."],
        cooldownDays: 10,
        covenant: covenant({
          name: "Cross-account AI visibility",
          purpose: "Observe AI-related exposure and single-issuer concentration across saved account groups.",
          coveredExposure: "Retirement and taxable holdings classified by the user as AI-related",
          objective: "Maintain a coherent whole-portfolio view before reviewing any one account in isolation.",
          cooldownPolicy: "10 days after a completed review",
          maximumIntendedConcentration: 0.32,
          reviewRules: ["Review only after aggregate AI exposure or issuer concentration persists across two complete cross-account observations."],
          falsifiers: ["Account exports use different as-of dates, omit an account group, or duplicate the same position."],
        }),
        triggers: [numericTrigger("ai_exposure", 0.32, 0.28, { missingDataPolicy: "require_manual_review", cooldownMs: 10 * DAY }), numericTrigger("single_position_concentration", 0.18, 0.15, { cooldownMs: 10 * DAY }), overdueTrigger(90, { cooldownMs: 10 * DAY })],
        story: story("Morgan", "Morgan has overlapping AI holdings in retirement and taxable accounts.", "Combined AI exposure is 27%; the largest issuer is 14%.", "Combined AI exposure reaches 34%, while one issuer reaches 19%.", {
          factualObservations: "Both aggregate theme exposure and the largest issuer exceed their written entry thresholds.",
          falsifierCheck: "Morgan verifies that the two account exports use the same as-of date and contain no duplicate position.",
          decision: "create_successor",
          rationale: "The original account-by-account wording no longer reflects the combined exposure being observed.",
        }, { activeAsOf: "2026-08-31", activeState: "escalated_review" }),
      }),
      example({
        id: "ai-appreciation-drift",
        title: "Theme-concentration discipline",
        philosophy: "Distinguish concentration caused by appreciation from concentration caused by new contributions.",
        situation: "A theme grows faster than the rest of the portfolio without additional purchases.",
        emphasis: ["Appreciation attribution", "Theme exposure", "Volatility context"],
        tradeoffs: ["Needs comparable prior prices and regularly spaced observations."],
        notFor: ["Sparse records without prior prices."],
        cooldownDays: 30,
        covenant: covenant({
          name: "AI appreciation drift review",
          purpose: "Review when AI-related concentration increases primarily through appreciation.",
          coveredExposure: "User-classified AI holdings with comparable saved prices",
          objective: "Keep appreciation-driven concentration visible without treating growth itself as a decision instruction.",
          cooldownPolicy: "30 days after a completed review",
          maximumIntendedConcentration: 0.38,
          reviewRules: ["Review only when both total theme exposure and appreciation attribution persist in comparable observations."],
          falsifiers: ["A split, stale price, contribution, withdrawal, or classification change explains the apparent appreciation drift."],
        }),
        triggers: [numericTrigger("ai_exposure", 0.38, 0.34, { cooldownMs: 30 * DAY }), numericTrigger("appreciation_concentration", 0.08, 0.05, { cooldownMs: 30 * DAY }), numericTrigger("trailing_volatility", 0.25, 0.2, { cooldownMs: 30 * DAY, settings: { lookbackObservations: 4, annualizationFactor: 12 } })],
        story: story("Riley", "Riley wants to separate price-led drift from intentional additions.", "AI exposure is 33%; appreciation contribution is below 3%.", "AI exposure reaches 39%, with more than 9% of concentration change attributed to appreciation.", {
          factualObservations: "Saved prices attribute most of the concentration increase to appreciation rather than purchases.",
          falsifierCheck: "Riley checks for splits, stale prices, and cash-flow changes before accepting the attribution.",
          decision: "continue_policy",
          rationale: "The observation is documented and the existing review cadence remains appropriate during cooldown.",
        }, { activeAsOf: "2026-07-31", activeState: "escalated_review" }),
      }),
    ],
  },
  {
    id: "employer-equity",
    title: "Employer and single-stock exposure",
    description: "Explore policies for one issuer growing through vesting, appreciation, or account fragmentation.",
    examples: [
      example({
        id: "employer-vesting",
        title: "Vesting accumulation review",
        philosophy: "Review concentration after repeated vesting observations rather than reacting to a single grant date.",
        situation: "Recurring equity compensation accumulates in one issuer across taxable and plan accounts.",
        emphasis: ["Repeated concentration", "Account completeness", "Scheduled context"],
        tradeoffs: ["The policy may wait through one isolated vesting spike."],
        notFor: ["Someone whose plan requires a same-day decision process."],
        cooldownDays: 7,
        covenant: covenant({ name: "Vesting accumulation review", purpose: "Track employer-equity concentration created by recurring vesting.", coveredExposure: "Employer equity across plan and taxable accounts", objective: "Keep compensation-driven concentration visible within a written review cadence.", cooldownPolicy: "7 days after a completed review", maximumIntendedConcentration: 0.25, reviewRules: ["Review after employer-equity concentration persists across two complete post-vesting observations."], falsifiers: ["A pending transfer, duplicate plan row, or excluded taxable account explains the apparent accumulation."] }),
        triggers: [numericTrigger("single_position_concentration", 0.25, 0.22, { persistenceObservations: 2, cooldownMs: 7 * DAY }), scheduledTrigger("2026-12-15T15:00:00.000Z", { cooldownMs: 7 * DAY })],
        story: story("Casey", "Casey receives recurring equity compensation from one employer.", "Employer equity is 21% after the first vesting observation.", "Employer equity remains above 26% after the next saved vesting observation.", { factualObservations: "Two post-vesting snapshots show employer equity above the written threshold.", falsifierCheck: "Casey checks for pending transfers and duplicate plan-account rows.", decision: "defer_review", rationale: "A known transfer is pending, so the review receives a short dated follow-up." }, { activeAsOf: "2026-11-30" }),
      }),
      example({
        id: "employer-issuer-drift",
        title: "Single-issuer drift",
        philosophy: "Attribute issuer concentration growth before changing policy language.",
        situation: "One legacy or employer holding grows faster than the rest of the portfolio.",
        emphasis: ["Issuer weight", "Appreciation attribution", "Review cadence"],
        tradeoffs: ["Needs prior prices to distinguish appreciation from contributions."],
        notFor: ["Holdings without comparable price history."],
        cooldownDays: 14,
        covenant: covenant({ name: "Single-issuer drift", purpose: "Document when one issuer grows into a larger share of observed value.", coveredExposure: "One issuer held across all saved accounts", objective: "Separate appreciation-led drift from intentional additions before reviewing the policy.", cooldownPolicy: "14 days after a completed review", maximumIntendedConcentration: 0.2, reviewRules: ["Review only when issuer weight and appreciation attribution persist in comparable saved observations."], falsifiers: ["A split, stale price, contribution, transfer, or incomplete account scope explains the measured drift."] }),
        triggers: [numericTrigger("single_position_concentration", 0.2, 0.17), numericTrigger("appreciation_concentration", 0.06, 0.04), overdueTrigger(120)],
        story: story("Avery", "Avery holds one long-standing issuer in several accounts.", "The issuer is 17% and appreciation contribution is 2%.", "The issuer is 22%; saved prices attribute 7% of concentration change to appreciation.", { factualObservations: "Issuer weight and appreciation attribution both meet their written conditions.", falsifierCheck: "Avery verifies prior prices, quantities, and account scope.", decision: "continue_policy", rationale: "The policy already describes this condition and remains within its review cycle." }, { activeAsOf: "2026-08-31", activeState: "escalated_review" }),
      }),
      example({
        id: "employer-scheduled",
        title: "Scheduled employer-equity review",
        philosophy: "Combine a concentration condition with a predictable calendar review and explicit overdue recovery.",
        situation: "A user prefers to review around compensation events rather than market headlines.",
        emphasis: ["Calendar discipline", "Concentration", "Overdue recovery"],
        tradeoffs: ["Calendar reviews may occur when no quantitative condition is active."],
        notFor: ["Someone unwilling to maintain scheduled observations."],
        cooldownDays: 20,
        covenant: covenant({ name: "Scheduled employer-equity review", purpose: "Review employer equity on a known cadence and when concentration persists.", coveredExposure: "Employer equity and related plan accounts", objective: "Keep review timing connected to written compensation events.", cooldownPolicy: "20 days after a completed review", maximumIntendedConcentration: 0.3, reviewRules: ["Review on the written compensation date or after concentration persists; record which vested and unvested balances are in scope."], falsifiers: ["The compensation calendar changed or the snapshot mixes covered and excluded unvested balances."] }),
        triggers: [numericTrigger("single_position_concentration", 0.3, 0.27, { cooldownMs: 20 * DAY }), numericTrigger("trailing_drawdown", 0.2, 0.15, { cooldownMs: 20 * DAY }), scheduledTrigger("2026-11-01T14:00:00.000Z", { cooldownMs: 20 * DAY }), overdueTrigger(180, { cooldownMs: 20 * DAY })],
        story: story("Taylor", "Taylor reviews employer equity near scheduled compensation milestones.", "Concentration is 27% and the scheduled date is ahead.", "The scheduled review arrives while concentration reaches 31%.", { factualObservations: "The calendar review and concentration condition are both active.", falsifierCheck: "Taylor verifies the compensation calendar and confirms the snapshot includes unvested amounts only where intended.", decision: "create_successor", rationale: "The next policy version should clarify which compensation balances are covered." }, { persistenceObservations: 2, activeAsOf: "2026-11-01", activeState: "escalated_review" }),
      }),
    ],
  },
  {
    id: "drawdown-volatility",
    title: "Drawdown and volatility",
    description: "See policies that distinguish observed loss, changing variability, and multiple simultaneous conditions.",
    examples: [
      example({
        id: "drawdown-quality",
        title: "Drawdown with data-quality checks",
        philosophy: "Treat a drawdown as reviewable only after confirming the saved reference high and cash-flow assumptions.",
        situation: "A portfolio has declined from its highest saved observation.",
        emphasis: ["Observed reference high", "Cash-flow caveat", "Scheduled verification"],
        tradeoffs: ["The calculation does not model external cash flows."],
        notFor: ["Anyone expecting a forecast or performance attribution system."],
        cooldownDays: 12,
        covenant: covenant({ name: "Observed drawdown review", purpose: "Review a saved decline without treating it as a forecast.", coveredExposure: "The complete saved portfolio series", objective: "Use a verified reference high and explicit data caveats before reconsidering policy.", cooldownPolicy: "12 days after a completed review", maximumTolerableDrawdown: 0.2, reviewRules: ["Review only after the observed drawdown persists and the selected saved reference high is verified."], falsifiers: ["A contribution, withdrawal, missing account, stale valuation, or wrong reference high explains the arithmetic decline."] }),
        triggers: [numericTrigger("trailing_drawdown", 0.2, 0.15, { cooldownMs: 12 * DAY }), scheduledTrigger("2027-02-01T15:00:00.000Z", { cooldownMs: 12 * DAY })],
        story: story("Sam", "Sam records complete monthly portfolio observations.", "Observed drawdown from the saved high is 8%.", "Observed drawdown reaches 21% from the selected saved reference high.", { factualObservations: "The saved series reports a 21% arithmetic drawdown from its reference high.", falsifierCheck: "Sam checks for contributions, withdrawals, missing accounts, and an incorrect reference high.", decision: "defer_review", rationale: "One cash-flow question remains unresolved and is assigned a follow-up date." }, { activeAsOf: "2026-07-31" }),
      }),
      example({
        id: "volatility-regime",
        title: "Volatility-regime review",
        philosophy: "Require regularly spaced observations before interpreting a change in variability.",
        situation: "Recent saved portfolio returns vary more than the policy's observation window allows.",
        emphasis: ["Regular intervals", "Unavailable gaps", "Cadence recovery"],
        tradeoffs: ["Irregular observations become unavailable instead of being interpolated."],
        notFor: ["Sparse or opportunistic snapshot schedules."],
        cooldownDays: 18,
        covenant: covenant({ name: "Volatility-regime review", purpose: "Review changing variability only from regularly spaced saved observations.", coveredExposure: "Monthly whole-portfolio observations", objective: "Keep volatility arithmetic descriptive and cadence-aware.", cooldownPolicy: "18 days after a completed review", reviewRules: ["Review only from a complete four-observation window with exact 30-day intervals and two qualifying evaluations."], falsifiers: ["Any interval is missing, irregular, duplicated, or based on an incomplete whole-portfolio observation."] }),
        triggers: [numericTrigger("trailing_volatility", 0.22, 0.18, { cooldownMs: 18 * DAY, settings: { lookbackObservations: 4, annualizationFactor: 12, returnIntervalMs: 30 * DAY, missingObservationPolicy: "hold_prior_state" } }), overdueTrigger(45, { cooldownMs: 18 * DAY })],
        story: story("Devon", "Devon saves a portfolio observation every thirty days.", "Four observations produce 14% annualized sample volatility.", "The next window produces 24% with no observation gap.", { factualObservations: "The complete four-observation window exceeds the written volatility threshold.", falsifierCheck: "Devon verifies all intervals and confirms that no observation is missing.", decision: "continue_policy", rationale: "The condition is documented; the policy remains unchanged through cooldown." }, { baselineAsOf: "2026-01-01", activeAsOf: "2026-05-31", preconditionObservations: 3 }),
      }),
      example({
        id: "multi-condition",
        title: "Multi-condition escalation",
        philosophy: "Escalate the review process when independent concentration, drawdown, and volatility conditions coincide.",
        situation: "Several different saved measurements become active at the same time.",
        emphasis: ["Independent evidence", "Aggregate escalation", "No automatic action"],
        tradeoffs: ["More conditions require more complete and timely data."],
        notFor: ["A user who wants one simple threshold."],
        cooldownDays: 28,
        covenant: covenant({ name: "Multi-condition escalation", purpose: "Use a more deliberate review packet when independent conditions coincide.", coveredExposure: "The complete observed portfolio and its largest position", objective: "Increase review rigor without converting conditions into actions.", cooldownPolicy: "28 days after a completed escalated review", maximumIntendedConcentration: 0.22, maximumTolerableDrawdown: 0.18, reviewRules: ["Open an escalated review packet only when at least two independent configured conditions are active in the same complete batch."], falsifiers: ["Account scope, price timestamps, reference high, or observation spacing invalidates any active condition."] }),
        triggers: [numericTrigger("trailing_drawdown", 0.18, 0.14, { severity: "high", cooldownMs: 28 * DAY }), numericTrigger("trailing_volatility", 0.24, 0.19, { severity: "high", cooldownMs: 28 * DAY }), numericTrigger("single_position_concentration", 0.22, 0.19, { severity: "high", cooldownMs: 28 * DAY })],
        story: story("Lee", "Lee wants independent conditions to produce a more rigorous review, not an automatic response.", "Drawdown is 9%, volatility is 16%, and the largest position is 18%.", "Drawdown reaches 19%, volatility 26%, and the largest position 23% in the same saved batch.", { factualObservations: "Three independent conditions are active in the same observation batch.", falsifierCheck: "Lee checks account completeness, price timestamps, reference high, and regular observation spacing.", decision: "deescalate", rationale: "The recorded policy decision is to enter its predefined de-escalated posture after the evidence check." }, { activeAsOf: "2026-08-31", activeState: "escalated_review" }),
      }),
    ],
  },
  {
    id: "scheduled-review",
    title: "Scheduled policy review",
    description: "Explore policies that create a review habit even when no market condition is active.",
    examples: [
      example({
        id: "scheduled-quarterly",
        title: "Quarterly policy check",
        philosophy: "Use a predictable quarterly review to separate maintenance from market urgency.",
        situation: "A user wants a simple recurring checkpoint for policy assumptions and data quality.",
        emphasis: ["Quarterly cadence", "Assumption review", "Short cooldown"],
        tradeoffs: ["A calendar review can occur when nothing material changed."],
        notFor: ["Someone unwilling to maintain quarterly records."],
        cooldownDays: 5,
        covenant: covenant({ name: "Quarterly policy check", purpose: "Review assumptions and evidence on a predictable quarterly cadence.", coveredExposure: "The full observed portfolio", objective: "Keep the policy current without reacting to every market movement.", cooldownPolicy: "5 days after the quarterly review", reviewRules: ["Review the covenant on the scheduled quarterly date even when no numeric condition is active."], falsifiers: ["The scheduled date, timezone, account scope, or current approved version is recorded incorrectly."] }),
        triggers: [scheduledTrigger("2026-10-01T14:00:00.000Z", { cooldownMs: 5 * DAY })],
        story: story("Quinn", "Quinn prefers a simple quarterly policy-maintenance ritual.", "The policy is current and the quarterly date is six weeks away.", "The scheduled date arrives with no numeric condition active.", { factualObservations: "No numeric condition is active; the scheduled review date has arrived.", falsifierCheck: "Quinn checks that the current covenant still covers every intended account and objective.", decision: "continue_policy", rationale: "The assumptions remain current, so the approved covenant continues unchanged." }, { baselineAsOf: "2026-08-20", activeAsOf: "2026-10-01", persistenceObservations: 1 }),
      }),
      example({
        id: "scheduled-annual",
        title: "Annual horizon review",
        philosophy: "Reserve broad objective and horizon changes for an annual review unless another written condition activates first.",
        situation: "A long-horizon user wants one deep annual review and explicit overdue recovery.",
        emphasis: ["Long horizon", "Deep annual review", "Overdue visibility"],
        tradeoffs: ["A yearly cadence can leave stale language visible for longer."],
        notFor: ["A rapidly changing portfolio without separate numeric conditions."],
        cooldownDays: 35,
        covenant: covenant({ name: "Annual horizon review", purpose: "Revisit the objective, covered exposure, and horizon once each year.", coveredExposure: "The long-horizon household portfolio", objective: "Keep strategic assumptions explicit and annually renewed.", cooldownPolicy: "35 days after the annual review", timeHorizon: "15 years", reviewRules: ["Use the annual review to confirm the objective, covered accounts, and time horizon; create a successor when any changed."], falsifiers: ["The review clock, approved version, account inventory, or stated horizon is incomplete or stale."] }),
        triggers: [scheduledTrigger("2027-01-05T15:00:00.000Z", { cooldownMs: 35 * DAY }), overdueTrigger(400, { cooldownMs: 35 * DAY })],
        story: story("Harper", "Harper maintains a long-horizon policy with one deep annual review.", "The covenant is ten months old and current.", "The annual review date arrives with the horizon and covered accounts ready for confirmation.", { factualObservations: "The annual review date has arrived; no numeric condition is active.", falsifierCheck: "Harper checks whether objectives, account scope, or time horizon changed during the year.", decision: "create_successor", rationale: "A new account changes the covered scope, so a successor covenant is appropriate." }, { baselineAsOf: "2026-03-05", activeAsOf: "2027-01-05", persistenceObservations: 1 }),
      }),
      example({
        id: "scheduled-overdue",
        title: "Overdue-review recovery",
        philosophy: "Make a missed review visible and restore cadence before interpreting new conditions.",
        situation: "A previously maintained policy has gone longer than intended without a documented review.",
        emphasis: ["Missed cadence", "Recovery before change", "Explicit reset"],
        tradeoffs: ["The overdue state says nothing about portfolio risk by itself."],
        notFor: ["A user looking for a market alert."],
        cooldownDays: 9,
        covenant: covenant({ name: "Overdue-review recovery", purpose: "Make a missed policy review visible and restore a deliberate cadence.", coveredExposure: "The portfolio described by the latest approved covenant", objective: "Re-establish review discipline without treating lateness as market evidence.", cooldownPolicy: "9 days after cadence is restored", reviewRules: ["Open a recovery review when the recorded interval elapses; restore cadence before interpreting other changes."], falsifiers: ["A completed review exists outside the record or the last-review timestamp is missing or incorrect."] }),
        triggers: [overdueTrigger(120, { cooldownMs: 9 * DAY })],
        story: story("Rowan", "Rowan has not documented a policy review within the written interval.", "The last completed review is 92 days old.", "The review becomes overdue at 121 days without implying any market condition.", { factualObservations: "The written review interval elapsed without a completed packet.", falsifierCheck: "Rowan checks whether a review was completed elsewhere or the recorded timestamp is incomplete.", decision: "defer_review", rationale: "The overdue review is opened now and a near-term follow-up restores the intended cadence." }, { baselineAsOf: "2026-06-01", activeAsOf: "2026-06-30", persistenceObservations: 1 }),
      }),
    ],
  },
]);
