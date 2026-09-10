/**
 * @reitti/engine — the deterministic core.
 *
 * Pure and framework-agnostic by design: it is the source of truth for scoring
 * and routing, and it stays that way permanently. The AI layer (packages/ai)
 * may only ever assist *around* these outputs — never replace them.
 */
export * from './types.js';
export { scoreInstrument, checkCrisis, isGatedOut, scaleFor, ConfigError, IncompleteAnswersError } from './scoring.js';
export {
  deriveRoutingInput,
  route,
  matchesCondition,
  printRulesTable,
  orderRungsForBudget,
  budgetReordersLadder,
  fittingRungs,
} from './routing.js';
export type { RoutingContext } from './routing.js';
export { nextInstrumentId, requireInstrument, deeperScreeners } from './flow.js';
export type { FlowConfig, FlowState, DeeperScreener } from './flow.js';
export {
  entriesForRung,
  freeCareAt,
  gatedFreeCareAt,
  orderFreeFirst,
  orderRungTwo,
  humanOptionFor,
  printDirectory,
  servesAge,
  speaks,
} from './directory.js';
export type {
  AgeBand,
  HumanFallbackConfig,
  Anonymity,
  CostBand,
  DirectoryEntry,
  DirectoryFilter,
  EntryRole,
  Format,
  Sector,
  WhoAnswers,
} from './directory.js';
export {
  thresholdFor,
  readyToForm,
  poolInterestBody,
  poolKey,
  promoteNext,
  topicsForRung,
  POOL_BODY_KEYS,
} from './pool.js';
export type { GroupTopic, GroupsConfig, PoolInterestBody, PoolCount } from './pool.js';
export { carryForward, carriedAnswers, itemsToAsk } from './carry.js';
export type { CarriedAnswer, PriorAnswers } from './carry.js';
