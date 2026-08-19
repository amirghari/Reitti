/**
 * @reitti/engine — the deterministic core.
 *
 * Pure and framework-agnostic by design: it is the source of truth for scoring
 * and routing, and it stays that way permanently. The AI layer (packages/ai)
 * may only ever assist *around* these outputs — never replace them.
 */
export * from './types.js';
export { scoreInstrument, checkCrisis, isGatedOut, scaleFor, ConfigError, IncompleteAnswersError } from './scoring.js';
export { deriveRoutingInput, route, matchesCondition, printRulesTable, orderRungsForBudget } from './routing.js';
export type { RoutingContext } from './routing.js';
export { nextInstrumentId, requireInstrument } from './flow.js';
export type { FlowConfig, FlowState } from './flow.js';
export { carryForward, carriedAnswers, itemsToAsk } from './carry.js';
export type { CarriedAnswer, PriorAnswers } from './carry.js';
