import type {
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
  };
}

export function matchesCondition(condition: RuleCondition, input: RoutingInput): boolean {
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

  for (const modifier of rules.modifiers) {
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
    ...rules.baseRules.map((r) => line(r.id, r.because, `→ ${r.then.rung}${r.then.tags.length ? ` +[${r.then.tags.join(', ')}]` : ''}`)),
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

/** A rung is never hidden — ordering only. Invariant 6 lives here when providers arrive. */
export function orderRungsForBudget(ladder: Ladder, budget: Budget): Rung[] {
  const sorted = [...ladder.rungs].sort((a, b) => a.level - b.level);
  if (budget !== 'none') return sorted;
  return [...sorted].sort((a, b) => Number(b.publicFirst) - Number(a.publicFirst));
}
