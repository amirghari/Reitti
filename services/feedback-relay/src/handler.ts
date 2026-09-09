/**
 * The feedback relay.
 *
 * **It forwards and forgets.** There is no database behind this, deliberately:
 * free text typed into a mental-health site will sometimes describe somebody's
 * mental health, and a store of that makes Reitti the controller of
 * special-category data with retention, access and deletion obligations
 * attached. Forwarding to an inbox lands the message exactly where a `mailto:`
 * would have, and leaves nothing here to protect, subpoena or leak.
 *
 * The same discipline as `pool-counter`: an unexpected key is a 400 rather than
 * a silently-ignored field, because what is *not* sent is the whole claim.
 */

export interface RelayConfig {
  /** Where the message goes. Absent means the relay is not configured. */
  to?: string;
  from?: string;
  token?: string;
  maxLength: number;
}

export interface HandlerResult {
  status: number;
  body?: unknown;
}

/** What the relay is allowed to receive. `website` is the spam honeypot. */
export const FEEDBACK_BODY_KEYS = ['message', 'locale', 'website'] as const;

const LOCALES = ['fi', 'sv', 'en'] as const;

const bad = (message: string): HandlerResult => ({ status: 400, body: { error: message } });

function exactKeys(value: unknown, keys: readonly string[]): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const got = Object.keys(value);
  return got.length === keys.length && keys.every((k) => got.includes(k));
}

/**
 * A global token bucket rather than a per-IP one, on purpose.
 *
 * Per-IP limiting is more precise and it means holding an identifier for every
 * person who writes in, which is the one thing this service exists not to do.
 * A global bucket protects the relay from a flood without touching anybody's
 * address. The cost is honest: one determined abuser can exhaust the budget and
 * silence feedback for everyone until it refills, which for a preview is a much
 * smaller problem than keeping a list of who wrote to us.
 */
export class TokenBucket {
  private tokens: number;
  private last: number;

  constructor(
    private readonly capacity = 30,
    private readonly refillPerMs = 30 / (60 * 60 * 1000),
    now = Date.now(),
  ) {
    this.tokens = capacity;
    this.last = now;
  }

  take(now = Date.now()): boolean {
    this.tokens = Math.min(this.capacity, this.tokens + (now - this.last) * this.refillPerMs);
    this.last = now;
    if (this.tokens < 1) return false;
    this.tokens -= 1;
    return true;
  }
}

export interface Mailer {
  send(input: { to: string; from: string; subject: string; text: string }): Promise<boolean>;
}

/**
 * A subject that differs per message, which matters more than it sounds.
 *
 * Every feedback email used to be titled `Reitti feedback (en)`. Gmail threads
 * by subject, so every submission collapsed into one conversation and the
 * second message onwards looked, to the person receiving it, exactly like
 * nothing had arrived. It had; it was folded inside the thread above it.
 *
 * Line breaks are stripped rather than escaped. A subject is a mail header, and
 * a CR or LF inside one is how header injection works — somebody could
 * otherwise open their message with a newline and add headers of their own.
 */
export function subjectFor(locale: string, message: string): string {
  const opening = message
    .replace(/[\r\n]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const clipped = opening.length > 60 ? `${opening.slice(0, 60).trimEnd()}…` : opening;
  return `Reitti feedback (${locale}): ${clipped}`;
}

export async function handleFeedback(
  config: RelayConfig,
  bucket: TokenBucket,
  mailer: Mailer,
  body: unknown,
): Promise<HandlerResult> {
  if (!config.to || !config.from || !config.token) {
    // Unconfigured is not the sender's fault and not a validation error.
    return { status: 503, body: { error: 'feedback relay is not configured' } };
  }

  if (!exactKeys(body, FEEDBACK_BODY_KEYS)) {
    return bad('body must be exactly { message, locale, website }');
  }

  const { message, locale, website } = body as Record<string, unknown>;

  // The honeypot is a field a person never sees and a bot fills in. Answer 204
  // rather than 400: telling a bot which check it failed is free tuning for it.
  if (typeof website === 'string' && website.trim() !== '') return { status: 204 };
  if (typeof website !== 'string') return bad('website must be a string');

  if (typeof message !== 'string') return bad('message must be a string');
  const text = message.trim();
  if (text.length === 0) return bad('message is empty');
  if (text.length > config.maxLength) return bad(`message is longer than ${config.maxLength}`);

  if (typeof locale !== 'string' || !LOCALES.includes(locale as (typeof LOCALES)[number])) {
    return bad(`locale must be one of ${LOCALES.join(', ')}`);
  }

  if (!bucket.take()) {
    return { status: 429, body: { error: 'too many messages right now, try later' } };
  }

  const sent = await mailer.send({
    to: config.to,
    from: config.from,
    subject: subjectFor(locale, text),
    // The message alone. No IP, no user agent, no timestamp, no session, no
    // referrer — nothing that would let the message be tied back to a person.
    text,
  });

  if (!sent) return { status: 502, body: { error: 'could not forward the message' } };

  // 204: there is nothing to tell the sender back, and echoing their own words
  // would only invite this endpoint to be used as a reflector.
  return { status: 204 };
}
