import { describe, expect, it, vi } from 'vitest';
import {
  FEEDBACK_BODY_KEYS,
  TokenBucket,
  handleFeedback,
  subjectFor,
  type Mailer,
  type RelayConfig,
} from '../src/handler.js';

const config: RelayConfig = {
  to: 'owner@example.fi',
  from: 'noreply@example.fi',
  token: 'test-token',
  maxLength: 4000,
};

const ok = (): { mailer: Mailer; sent: unknown[] } => {
  const sent: unknown[] = [];
  return {
    sent,
    mailer: {
      async send(input) {
        sent.push(input);
        return true;
      },
    },
  };
};

const valid = { message: 'The Swedish hours are wrong.', locale: 'sv', website: '' };

describe('POST /api/feedback', () => {
  it('forwards the message and returns nothing back', async () => {
    const { mailer, sent } = ok();
    const result = await handleFeedback(config, new TokenBucket(), mailer, valid);
    expect(result.status).toBe(204);
    expect(result.body).toBeUndefined();
    expect(sent).toHaveLength(1);
  });

  it('forwards the message and NOTHING else', async () => {
    // The whole design: no IP, no user agent, no timestamp, no session id, no
    // referrer. If anything is ever added to this payload it fails here first.
    const { mailer, sent } = ok();
    await handleFeedback(config, new TokenBucket(), mailer, valid);
    const mail = sent[0] as Record<string, unknown>;
    expect(Object.keys(mail).sort()).toEqual(['from', 'subject', 'text', 'to']);
    expect(mail.text).toBe(valid.message);
    for (const forbidden of ['ip', 'userAgent', 'timestamp', 'sessionId', 'referrer', 'headers']) {
      expect(mail).not.toHaveProperty(forbidden);
    }
  });

  it('stores nothing, because there is nothing to store into', async () => {
    // Asserted as a shape: the handler takes a mailer, never a store. A store
    // would make Reitti the controller of special-category free text.
    expect(handleFeedback.length).toBe(4);
    const { mailer } = ok();
    await handleFeedback(config, new TokenBucket(), mailer, valid);
    expect(Object.keys(mailer)).toEqual(['send']);
  });

  it('rejects an extra key rather than ignoring it', async () => {
    const { mailer, sent } = ok();
    const result = await handleFeedback(config, new TokenBucket(), mailer, {
      ...valid,
      email: 'someone@example.com',
    });
    expect(result.status).toBe(400);
    expect(sent).toHaveLength(0);
  });

  it('rejects a missing key', async () => {
    const { mailer } = ok();
    expect((await handleFeedback(config, new TokenBucket(), mailer, { message: 'hi' })).status).toBe(400);
  });

  it('rejects an empty or oversized message', async () => {
    const { mailer, sent } = ok();
    expect((await handleFeedback(config, new TokenBucket(), mailer, { ...valid, message: '   ' })).status).toBe(400);
    const long = { ...valid, message: 'x'.repeat(config.maxLength + 1) };
    expect((await handleFeedback(config, new TokenBucket(), mailer, long)).status).toBe(400);
    expect(sent).toHaveLength(0);
  });

  it('rejects a locale it does not ship', async () => {
    const { mailer } = ok();
    expect((await handleFeedback(config, new TokenBucket(), mailer, { ...valid, locale: 'de' })).status).toBe(400);
  });

  it('rejects a body that is not an object', async () => {
    const { mailer } = ok();
    for (const body of [null, 'hi', 42, ['hi'], undefined]) {
      expect((await handleFeedback(config, new TokenBucket(), mailer, body)).status, String(body)).toBe(400);
    }
  });

  it('swallows a filled honeypot without telling the bot which check it failed', async () => {
    const { mailer, sent } = ok();
    const result = await handleFeedback(config, new TokenBucket(), mailer, {
      ...valid,
      website: 'https://spam.example',
    });
    expect(result.status).toBe(204);
    expect(sent, 'honeypot submissions must not be forwarded').toHaveLength(0);
  });

  it('is a 503, not a 400, when nobody has configured it', async () => {
    const { mailer } = ok();
    for (const missing of ['to', 'from', 'token'] as const) {
      const partial = { ...config, [missing]: undefined };
      const result = await handleFeedback(partial, new TokenBucket(), mailer, valid);
      expect(result.status, `missing ${missing}`).toBe(503);
    }
  });

  it('reports a delivery failure rather than pretending it worked', async () => {
    const failing: Mailer = { async send() { return false; } };
    expect((await handleFeedback(config, new TokenBucket(), failing, valid)).status).toBe(502);
  });

  it('declares exactly the three keys it accepts', () => {
    expect([...FEEDBACK_BODY_KEYS].sort()).toEqual(['locale', 'message', 'website']);
  });
});

describe('the rate limiter holds no identifiers', () => {
  it('lets a reasonable number through and then stops', async () => {
    const bucket = new TokenBucket(3);
    const { mailer, sent } = ok();
    for (let i = 0; i < 3; i++) {
      expect((await handleFeedback(config, bucket, mailer, valid)).status).toBe(204);
    }
    const blocked = await handleFeedback(config, bucket, mailer, valid);
    expect(blocked.status).toBe(429);
    expect(sent, 'the blocked message must not be forwarded').toHaveLength(3);
  });

  it('refills over time', () => {
    const start = 1_000_000;
    const bucket = new TokenBucket(1, 1 / 1000, start);
    expect(bucket.take(start)).toBe(true);
    expect(bucket.take(start)).toBe(false);
    expect(bucket.take(start + 1000), 'a second later there should be a token').toBe(true);
  });

  it('takes no argument that could identify anybody', () => {
    // Per-IP limiting would be more precise and would mean holding an address
    // for everyone who writes in, which is the one thing this service avoids.
    expect(TokenBucket.prototype.take.length).toBeLessThanOrEqual(1);
    vi.spyOn(TokenBucket.prototype, 'take');
  });
});

describe('the subject line', () => {
  it('differs per message, so an inbox does not thread them into one', () => {
    // Every email used to be titled "Reitti feedback (en)". Gmail threads by
    // subject, so the second message onward looked exactly like nothing had
    // arrived — it had, folded inside the thread above it.
    const a = subjectFor('en', 'The Swedish hours are wrong');
    const b = subjectFor('en', 'Rung 3 names nobody');
    expect(a).not.toBe(b);
  });

  it('opens with the message so an inbox is scannable', () => {
    expect(subjectFor('fi', 'Ruotsinkieliset ajat ovat väärin')).toContain(
      'Ruotsinkieliset ajat ovat väärin',
    );
  });

  it('clips a long message rather than dragging it all into the header', () => {
    const subject = subjectFor('en', 'x'.repeat(500));
    expect(subject.length).toBeLessThan(100);
    expect(subject.endsWith('…')).toBe(true);
  });

  it('strips line breaks, because a subject is a mail header', () => {
    // CR or LF inside a header is how header injection works: somebody could
    // otherwise open their message with a newline and add headers of their own.
    const nasty = 'hello\r\nBcc: victim@example.com\nX-Evil: yes';
    const subject = subjectFor('en', nasty);
    expect(subject).not.toMatch(/[\r\n]/);
    expect(subject).toContain('hello');
  });

  it('still says which language the person was reading in', () => {
    for (const locale of ['fi', 'sv', 'en']) {
      expect(subjectFor(locale, 'note')).toContain(`(${locale})`);
    }
  });
});
