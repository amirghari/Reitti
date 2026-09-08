/**
 * `POST /api/feedback` — the same-origin relay endpoint.
 *
 * Same origin matters: the page's CSP is `connect-src 'self'`, so a form
 * posting here needs no CSP widening and no third-party origin. The page still
 * talks to nobody but itself.
 *
 * This file is the adapter only. Every decision worth testing lives in
 * `services/feedback-relay/src/handler.ts`, which has no idea it is running on
 * Vercel.
 */
import { TokenBucket, handleFeedback, type Mailer } from '../../../services/feedback-relay/src/handler.js';

/**
 * One bucket per warm instance. Not shared across instances, so the real limit
 * is looser than the number suggests — which is the acceptable direction to be
 * wrong in for a spam guard that deliberately holds no identifiers.
 */
const bucket = new TokenBucket();

/** Resend, chosen because it can be pinned to an EU region. */
const mailer: Mailer = {
  async send({ to, from, subject, text }) {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${process.env.FEEDBACK_RELAY_TOKEN}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ to, from, subject, text }),
    });
    return response.ok;
  },
};

export const config = { runtime: 'nodejs' };

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response(null, { status: 405, headers: { allow: 'POST' } });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'body must be JSON' }, { status: 400 });
  }

  const result = await handleFeedback(
    {
      to: process.env.FEEDBACK_TO,
      from: process.env.FEEDBACK_FROM,
      token: process.env.FEEDBACK_RELAY_TOKEN,
      maxLength: 4000,
    },
    bucket,
    mailer,
    body,
  );

  if (result.status === 204) return new Response(null, { status: 204 });
  return Response.json(result.body, { status: result.status });
}
