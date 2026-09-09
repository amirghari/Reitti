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
 *
 * The signature is the Node one, `(req, res)`, and that is load-bearing. The
 * first version of this file exported a Web-standard `(Request) => Response`
 * handler under `runtime: 'nodejs'`, so nothing ever ended the response and
 * every call hung until the gateway gave up. It looked like the function had
 * failed to deploy; it had deployed perfectly and was waiting forever.
 */
import { TokenBucket, handleFeedback, type Mailer } from '../../../services/feedback-relay/src/handler.js';

/** The minimum of Vercel's Node request/response, typed here to avoid a dependency. */
interface NodeRequest {
  method?: string;
  body?: unknown;
}
interface NodeResponse {
  status(code: number): NodeResponse;
  json(body: unknown): void;
  setHeader(name: string, value: string): void;
  end(): void;
}

/**
 * One bucket per warm instance. Not shared across instances, so the real limit
 * is looser than the number suggests — the acceptable direction to be wrong in
 * for a spam guard that deliberately holds no identifiers.
 */
const bucket = new TokenBucket();

/** Resend, whose sending region can be pinned to Ireland. */
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

export default async function handler(req: NodeRequest, res: NodeResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.setHeader('allow', 'POST');
    res.status(405).end();
    return;
  }

  // Vercel parses a JSON body for us; a string arrives when the content-type
  // was not set, which is worth accepting rather than failing on.
  let body: unknown = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      res.status(400).json({ error: 'body must be JSON' });
      return;
    }
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

  if (result.status === 204) {
    res.status(204).end();
    return;
  }
  res.status(result.status).json(result.body);
}
