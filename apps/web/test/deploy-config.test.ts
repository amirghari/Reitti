/**
 * Only a deploy on Amir's word reaches mielenreitti.fi (D-45). Vercel's Git
 * integration used to build every merge to main as production and give it the
 * domain within a minute, so merged work went live before his word (found
 * 14.11.2026). Amir, 17.11.2026: "a merge to main never reaches mielenreitti.fi
 * by itself". Pull-request previews stay on; `vercel deploy --prod` is unaffected.
 */
import { describe, expect, it } from 'vitest';
import vercel from '../vercel.json' with { type: 'json' };

describe('automatic production deploys', () => {
  it('are off for main, the production branch', () => {
    expect((vercel as { git?: { deploymentEnabled?: Record<string, boolean> } }).git?.deploymentEnabled?.main).toBe(false);
  });

  it('are not switched off for every branch, so pull requests still get previews', () => {
    const enabled = (vercel as { git?: { deploymentEnabled?: unknown } }).git?.deploymentEnabled;
    expect(typeof enabled).toBe('object');
    expect(Object.keys(enabled as object)).toEqual(['main']);
  });
});
