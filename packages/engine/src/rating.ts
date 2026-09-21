/**
 * The optional "was this useful?" rating.
 *
 * Two separate rules live here, and both are the point of the feature rather
 * than details of it.
 *
 * **What may be sent.** Three values: the number the person picked, the language
 * they were reading in, and which screen asked. Never the band, the score, the
 * rung, the instruments, or anything derived from them. The body is built key by
 * key like `poolInterestBody`, so passing a whole result object in cannot smuggle
 * a fourth field onto the wire.
 *
 * **Where it may be asked.** Never on the crisis path. Not on the crisis panel,
 * not on the under-18 screen, and not at all for the rest of a session in which
 * the crisis path has opened for any reason. Somebody who has just been shown a
 * phone number for a moment of danger is not a person to ask for a product
 * rating, and an answer collected there would be worthless as well as crass.
 *
 * The suppression rules are code, not config. `screens` in config can narrow
 * where the rating appears and can never widen it onto a forbidden screen:
 * `FORBIDDEN_SCREENS` wins over anything a config file says.
 */
import { ConfigError } from './scoring.js';

export interface RatingConfig {
  enabled: boolean;
  min: number;
  max: number;
  /** Screens that may ask. Intersected with the rule below, never overriding it. */
  screens: string[];
}

/**
 * The complete request body. Three values, none of them derived from a score, a
 * band, an answer, a rung or a device.
 *
 * This type is the privacy contract, exactly as `PoolInterestBody` is. Adding a
 * field to it is a change to invariant 11 and has to be argued as one.
 */
export interface RatingBody {
  rating: number;
  locale: string;
  screen: string;
}

export const RATING_BODY_KEYS = ['rating', 'locale', 'screen'] as const;

/** The interface languages. Asserted against the i18n bundles by invariant 11. */
export const RATING_LOCALES = ['fi', 'sv', 'en'] as const;

/**
 * Screens that may never ask, whatever config says. The crisis panel and the
 * under-18 handoff are both screens somebody reaches at their worst moment.
 */
export const FORBIDDEN_SCREENS = ['crisis', 'youth-result'] as const;

export interface RatingContext {
  /** Which screen is asking. */
  screen: string;
  /**
   * Has the crisis path opened at any point in this session, for any reason?
   * Sticky: an answer tripping the crisis item and somebody reaching for the
   * control themselves both count, and neither is undone by carrying on.
   */
  crisisTriggeredInSession: boolean;
  /** Safety flags on the result being shown, if any. */
  safetyFlags?: readonly string[];
  ageBand?: string;
}

/**
 * May this screen ask for a rating right now?
 *
 * Written as a single expression of "no" conditions rather than a permission
 * list, so a new screen is silently not asked rather than silently asked.
 */
export function mayAskForRating(config: RatingConfig, context: RatingContext): boolean {
  if (!config.enabled) return false;
  if (FORBIDDEN_SCREENS.includes(context.screen as (typeof FORBIDDEN_SCREENS)[number])) return false;
  if (!config.screens.includes(context.screen)) return false;
  if (context.crisisTriggeredInSession) return false;
  if (context.safetyFlags && context.safetyFlags.length > 0) return false;
  if (context.ageBand === 'under-18') return false;
  return true;
}

/**
 * Build the body, validating every value before it can leave. An out-of-range
 * rating or an unknown screen is a bug on our side, and it fails here rather
 * than becoming a free-text field on the wire.
 */
export function ratingBody(
  config: RatingConfig,
  input: { rating: number; locale: string; screen: string },
): RatingBody {
  if (!Number.isInteger(input.rating) || input.rating < config.min || input.rating > config.max) {
    throw new ConfigError(`Rating must be a whole number from ${config.min} to ${config.max}`);
  }
  if (!RATING_LOCALES.includes(input.locale as (typeof RATING_LOCALES)[number])) {
    throw new ConfigError(`No interface language "${input.locale}"`);
  }
  if (
    !config.screens.includes(input.screen) ||
    FORBIDDEN_SCREENS.includes(input.screen as (typeof FORBIDDEN_SCREENS)[number])
  ) {
    throw new ConfigError(`Screen "${input.screen}" may not ask for a rating`);
  }

  // Key by key, from validated locals. Spreading the input here is the one
  // change that would undo this whole file.
  return { rating: input.rating, locale: input.locale, screen: input.screen };
}
