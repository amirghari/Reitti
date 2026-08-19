/**
 * Types for the Reitti deterministic core.
 *
 * This package is pure: no I/O, no clock, no framework. Configs are passed in,
 * results come out. That is what makes the six safety invariants testable.
 */

export type InstrumentType = 'routing' | 'progress' | 'explore';
export type License = 'free' | 'public-domain' | 'verify-commercial';
export type SafetyFlag = 'crisis' | 'trauma' | 'substance';

export interface ScaleOption {
  labelRef: string;
  value: number;
}

export interface Item {
  key: string;
  textRef: string;
  /** Groups items for subscale scoring (e.g. PHQ-4's anxiety / depression pairs). */
  subscale?: string;
  /** Per-item scale, for instruments like AUDIT-C where every item differs. */
  scale?: ScaleOption[];
  /**
   * What this item measures, independent of which instrument it appears in.
   * Screeners are built by reusing items: PHQ-4 *is* the first two items of
   * PHQ-9 and of GAD-7. Two items sharing a concept are the same question, so a
   * person should be asked it once — see carry.ts. Omit and the item is always
   * asked directly.
   */
  concept?: string;
}

export interface Band {
  min: number;
  max: number;
  bandId: string;
  /** 0 none · 1 mild · 2 moderate · 3 moderately-severe · 4 severe. The routing engine's intensity input. */
  severity: number;
  reflectionRef: string;
}

export interface CrisisItem {
  key: string;
  triggerIf: { atLeast: number };
}

export interface Branch {
  ifSubscaleAtLeast?: { subscale: string; score: number };
  ifScoreAtLeast?: number;
  instrumentId: string;
}

export interface SafetyFlagRule {
  ifBandId: string;
  flag: SafetyFlag;
}

export interface RoutingSignal {
  domainTag: string;
  weight: number;
}

/** A yes/no question that, answered "no", skips the whole instrument (PC-PTSD-5). */
export interface Gate {
  key: string;
  textRef: string;
  skipIfNo: boolean;
}

export interface Instrument {
  id: string;
  name: string;
  version: string;
  type: InstrumentType;
  license: License;
  source: string;
  purposeRef: string;
  aboutRef: string;
  promptRef: string;
  /** Shared scale for all items. Omit when every item carries its own. */
  scale?: ScaleOption[];
  /**
   * The period the items ask about ("2-weeks", "1-month"). Two instruments may
   * only share an answer when this matches exactly: "over the last 2 weeks" and
   * "in the past month" are different measurements of the same concept. Omit and
   * nothing is ever carried into or out of this instrument.
   */
  recallWindow?: string;
  items: Item[];
  gate?: Gate;
  scoring: 'sum' | 'mean';
  /** Applied after summing — WHO-5's raw 0–25 becomes 0–100. */
  scoreTransform?: { multiplier: number };
  bands: Band[];
  crisisItem?: CrisisItem;
  safetyFlag?: SafetyFlagRule;
  branchesTo?: Branch[];
  routingSignal?: RoutingSignal;
  note?: string;
}

export type Answers = Record<string, number>;

export interface ScoreResult {
  instrumentId: string;
  instrumentVersion: string;
  type: InstrumentType;
  /** Sum (or mean) before scoreTransform. */
  rawScore: number;
  /** The score the user and the bands see. */
  score: number;
  bandId: string;
  severity: number;
  reflectionRef: string;
  subscales: Record<string, number>;
  /**
   * The answers this result was scored from. Kept so a later instrument can
   * reuse an answer to the same concept instead of asking it again (carry.ts),
   * and so the on-device store holds what the person actually said.
   */
  answers: Answers;
  crisisTriggered: boolean;
  safetyFlags: SafetyFlag[];
  domainTag?: string;
  /** Instruments the branch rules say to offer next. */
  nextInstrumentIds: string[];
}

// ---------------------------------------------------------------------------
// Routing
// ---------------------------------------------------------------------------

export type Duration = 'under-a-month' | '1-6-months' | '6-12-months' | 'over-a-year';
export type Budget = 'none' | 'low' | 'moderate' | 'flexible';

export interface RoutingInput {
  severity: number;
  primaryDomain: string;
  duration: Duration;
  budget: Budget;
  language: string;
  safetyFlags: SafetyFlag[];
}

export interface RuleCondition {
  severityAtLeast?: number;
  severityAtMost?: number;
  durationIn?: string[];
  domainIn?: string[];
  budgetIn?: string[];
  languageNotIn?: string[];
  safetyFlag?: SafetyFlag;
}

export interface BaseRule {
  id: string;
  because: string;
  when: RuleCondition;
  then: { rung: string; tags: string[] };
}

export interface Modifier {
  id: string;
  because: string;
  when: RuleCondition;
  then: { rungDelta: number; preferRung?: string; tags: string[] };
}

export interface RoutingRules {
  version: string;
  baseRules: BaseRule[];
  modifiers: Modifier[];
}

export interface Rung {
  id: string;
  level: number;
  labelRef: string;
  descriptionRef: string;
  publicFirst: boolean;
  typicalCost: string;
  note?: string;
}

export interface Ladder {
  version: string;
  rungs: Rung[];
}

export interface RoutingOutput {
  /** True when a safety flag short-circuited routing. Nothing else is meaningful when this is set. */
  crisis: boolean;
  suggestedRung: Rung | null;
  /** [one rung down, one rung up] — the "too much / not enough" pair. Either may be null at the ends. */
  adjacentRungs: { below: Rung | null; above: Rung | null };
  providerTags: string[];
  /** Audit trail so the clinician can see exactly which lines fired. */
  matchedRuleId: string | null;
  appliedModifierIds: string[];
  /**
   * The `because` line of every rule that fired, in the order they fired — the
   * base rule first, then each modifier.
   *
   * These are the same strings the clinician signs off in `rules.json` and reads
   * from `npm run rules:print`. Showing them to the person is deliberate: it makes
   * the result a recommendation with reasons rather than a verdict, and because
   * there is only one string it can never drift from the rule that actually fired.
   * A clinician editing config is editing what the person reads.
   */
  reasons: string[];
  rulesVersion: string;
}
