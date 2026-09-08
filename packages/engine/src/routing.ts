import type {
  AgeBand,
  Budget,
  Duration,
  Ladder,
  RoutingInput,
  RoutingOutput,
  RoutingRules,
  RuleCondition,
  Rung,
  SafetyFlag,
  ScoreResult,
} from './types.js';
import { ConfigError } from './scoring.js';

export interface RoutingContext {
  duration: Duration;
  budget: Budget;
  language: string;
  /** What the person said brings them here, before any instrument ran. */
  statedDomain?: string;
  ageBand?: AgeBand;
}

/**
 * Collapse a set of instrument results into the six routing inputs.
 * Severity is the highest band raised — routing to the *lowest* rung any single
 * screener suggested would under-serve the person.
 */
export function deriveRoutingInput(results: ScoreResult[], context: RoutingContext): RoutingInput {
  const routingResults = results.filter((r) => r.type === 'routing');

  const severity = routingResults.reduce((max, r) => Math.max(max, r.severity), 0);

  // The domain of the most severe screener that actually raised something;
  // otherwise fall back to what the person told us.
  const raised = routingResults
    .filter((r) => r.severity > 0 && r.domainTag && r.domainTag !== 'general')
    .sort((a, b) => b.severity - a.severity);
  const primaryDomain = raised[0]?.domainTag ?? context.statedDomain ?? 'general';

  const safetyFlags = [...new Set(results.flatMap((r) => r.safetyFlags))] as SafetyFlag[];

  return {
    severity,
    primaryDomain,
    duration: context.duration,
    budget: context.budget,
    language: context.language,
    safetyFlags,
    ageBand: context.ageBand,
  };
}

export function matchesCondition(condition: RuleCondition, input: RoutingInput): boolean {
  if (condition.ageBandIn && !(input.ageBand && condition.ageBandIn.includes(input.ageBand))) {
    return false;
  }
  if (condition.severityAtLeast !== undefined && input.severity < condition.severityAtLeast) return false;
  if (condition.severityAtMost !== undefined && input.severity > condition.severityAtMost) return false;
  if (condition.durationIn && !condition.durationIn.includes(input.duration)) return false;
  if (condition.domainIn && !condition.domainIn.includes(input.primaryDomain)) return false;
  if (condition.budgetIn && !condition.budgetIn.includes(input.budget)) return false;
  if (condition.languageNotIn && condition.languageNotIn.includes(input.language)) return false;
  if (condition.safetyFlag && !input.safetyFlags.includes(condition.safetyFlag)) return false;
  return true;
}

/**
 * Band and tags in, a suggestion out. No inference, no diagnosis.
 *
 * A crisis flag short-circuits before any rule is consulted (safety invariant 5:
 * nothing downstream — including a future AI layer — can reach past this).
 */
export function route(input: RoutingInput, rules: RoutingRules, ladder: Ladder): RoutingOutput {
  if (input.safetyFlags.includes('crisis')) {
    return {
      crisis: true,
      suggestedRung: null,
      adjacentRungs: { below: null, above: null },
      providerTags: [],
      matchedRuleId: null,
      appliedModifierIds: [],
      // No reasons on the crisis path. A crisis result is not a recommendation
      // to explain — the panel is, and it does not argue.
      reasons: [],
      rulesVersion: rules.version,
    };
  }

  const base = rules.baseRules.find((rule) => matchesCondition(rule.when, input));
  if (!base) {
    throw new ConfigError(
      'No base rule matched. The rules table must end with an unconditional catch-all.',
    );
  }

  const tags = [...base.then.tags];
  const appliedModifierIds: string[] = [];
  const reasons: string[] = [base.because];
  let rungId = base.then.rung;
  let delta = 0;

  // A `final` base rule is a gate: nothing downstream may move it. Without this,
  // the age gate would be advisory — R0 hands an under-18 to youth services and
  // M5 would then happily prefer an adult group rung.
  for (const modifier of base.then.final ? [] : rules.modifiers) {
    if (!matchesCondition(modifier.when, input)) continue;
    appliedModifierIds.push(modifier.id);
    reasons.push(modifier.because);
    delta += modifier.then.rungDelta;
    if (modifier.then.preferRung) rungId = modifier.then.preferRung;
    tags.push(...modifier.then.tags);
  }

  const byId = new Map(ladder.rungs.map((r) => [r.id, r]));
  const start = byId.get(rungId);
  if (!start) throw new ConfigError(`Rules reference rung "${rungId}", which is not in the ladder.`);

  const sorted = [...ladder.rungs].sort((a, b) => a.level - b.level);
  const index = sorted.findIndex((r) => r.id === start.id);
  const clamped = Math.min(Math.max(index + delta, 0), sorted.length - 1);

  return {
    crisis: false,
    suggestedRung: sorted[clamped],
    adjacentRungs: {
      below: clamped > 0 ? sorted[clamped - 1] : null,
      above: clamped < sorted.length - 1 ? sorted[clamped + 1] : null,
    },
    providerTags: [...new Set(tags)],
    matchedRuleId: base.id,
    appliedModifierIds,
    reasons,
    rulesVersion: rules.version,
  };
}

/** Renders the whole rules table as readable lines for clinician sign-off. */
export function printRulesTable(rules: RoutingRules): string {
  const line = (id: string, because: string, then: string) => `${id.padEnd(4)} ${then}\n     ↳ ${because}`;
  return [
    `Reitti routing rules v${rules.version}`,
    '',
    'BASE RULES (first match wins)',
    ...rules.baseRules.map((r) =>
      line(
        r.id,
        r.because,
        `→ ${r.then.rung}` +
          `${r.then.tags.length ? ` +[${r.then.tags.join(', ')}]` : ''}` +
          // A gate reads differently from a starting point, and the clinician is
          // signing off on which this is.
          `${r.then.final ? '   ⟨FINAL — no modifier may move this⟩' : ''}`,
      ),
    ),
    '',
    'MODIFIERS (all matches apply, in order)',
    ...rules.modifiers.map((m) =>
      line(
        m.id,
        m.because,
        `${m.then.preferRung ? `→ ${m.then.preferRung} ` : ''}${m.then.rungDelta >= 0 ? '+' : ''}${m.then.rungDelta} rung${m.then.tags.length ? ` +[${m.then.tags.join(', ')}]` : ''}`,
      ),
    ),
  ].join('\n');
}

/**
 * The rungs that fit a result: the computed one plus its adjacent pair, **sorted
 * ascending by ladder level**.
 *
 * The sort is the point. With `RECOMMEND_RUNG` off, the person is shown a set to
 * choose from rather than a recommendation to follow — and putting the computed
 * rung first, or styling it differently, would make exactly the same
 * recommendation through position instead of through words. That is the same
 * regulated act with a thinner disguise, so the ordering is a property the
 * engine guarantees rather than a convention the UI is trusted to keep.
 *
 * Returns 2 rungs at either end of the ladder, 3 in the middle, and nothing at
 * all on the crisis path — a crisis result is not a menu.
 */
export function fittingRungs(output: RoutingOutput, ladder: Ladder): Rung[] {
  if (output.crisis || !output.suggestedRung) return [];

  const chosen = [output.adjacentRungs.below, output.suggestedRung, output.adjacentRungs.above]
    .filter((r): r is Rung => r !== null);

  const byId = new Map(ladder.rungs.map((r) => [r.id, r]));
  return chosen
    .filter((r) => byId.has(r.id))
    .sort((a, b) => a.level - b.level);
}

/**
 * The whole ladder, ordered for a budget.
 *
 * **A rung is never hidden — ordering only.** This function returns a permutation
 * of `ladder.rungs` for every budget, and invariant 7 asserts that as set
 * equality rather than as a length check, so a substitution cannot pass either.
 *
 * "No money" and "a small amount" both put the free and public rungs first,
 * because someone counting coins needs the free routes at the top of the page
 * rather than three scrolls down. A moderate or flexible budget leaves the
 * clinical ladder order alone: at that point cost is not the binding constraint,
 * and reordering by it would be shuffling a clinical sequence for no reason.
 */
export function orderRungsForBudget(ladder: Ladder, budget: Budget): Rung[] {
  const sorted = [...ladder.rungs].sort((a, b) => a.level - b.level);
  if (budget !== 'none' && budget !== 'low') return sorted;
  // Stable, so the clinical ladder order survives inside each group.
  return [...sorted].sort((a, b) => Number(b.publicFirst) - Number(a.publicFirst));
}

/** Whether a budget changes the ladder order at all — so the UI can say so honestly. */
export function budgetReordersLadder(budget: Budget): boolean {
  return budget === 'none' || budget === 'low';
}
