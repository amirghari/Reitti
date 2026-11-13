/**
 * The partner page is a PREVIEW (Amir, 13.11.2026): it says what the draft says,
 * and nothing lets it reach the live site or a search engine before he reads it.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { llms } from '../api/llms';
import { sitemap } from '../api/sitemap';
import { LEDE, PARTNER_PATH, SECTIONS, TITLE, partnerPage } from '../partners/page';
import { ADDRESSES } from '../src/addresses';

const ROOT = fileURLToPath(new URL('../../..', import.meta.url));
const SCRIPT = join(ROOT, 'scripts/build-partners.ts');
const VITE_NODE = join(ROOT, 'node_modules/.bin/vite-node');

function build(env: Record<string, string>, prepare?: (dir: string) => string): { dir: string; out: string } {
  const dir = mkdtempSync(join(tmpdir(), 'partners-'));
  const out = prepare ? prepare(dir) : dir;
  execFileSync(VITE_NODE, [SCRIPT, '--out', out], { cwd: ROOT, env: { ...process.env, VERCEL_ENV: '', ...env }, stdio: 'pipe' });
  return { dir, out };
}

describe('the partner page', () => {
  const html = partnerPage();

  it('carries the draft: title, lede and its seven sections', () => {
    expect(html).toContain(`<h1>${TITLE}</h1>`);
    expect(html).toContain(LEDE);
    expect(SECTIONS.map((s) => s.heading)).toEqual([
      'What it does',
      'What it never does',
      'Privacy, in plain words',
      'How it has been checked, and what has not been yet',
      'How to link to it',
      'Who runs it',
      'Contact',
    ]);
    expect(html).toContain('<strong>A review by a Finland-registered psychologist is in progress and not yet complete.</strong>');
    expect(html).toContain('href="mailto:tietosuoja@mielenreitti.fi"');
  });

  it('is under the crisis lines like every static page (invariant 1)', () => {
    expect(html.indexOf('112')).toBeGreaterThan(-1);
    expect(html.indexOf('112')).toBeLessThan(html.indexOf('<main'));
  });

  it('asks search engines to stay away, and nothing on the site lists or links it', () => {
    expect(html).toContain('<meta name="robots" content="noindex, nofollow">');
    expect(sitemap()).not.toContain(PARTNER_PATH);
    expect(llms()).not.toContain(PARTNER_PATH);
    expect(JSON.stringify(ADDRESSES)).not.toContain('partner');
  });

  it('has no em dash and no script', () => {
    expect(html).not.toContain('—');
    expect(html).not.toContain('<script');
  });
});

describe('scripts/build-partners.ts', () => {
  it('writes the preview outside production', () => {
    const { dir, out } = build({ VERCEL_ENV: 'preview' });
    try {
      expect(readFileSync(join(out, 'partners/index.html'), 'utf8')).toBe(partnerPage());
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }, 60_000);

  it('writes nothing in a production build, by environment or by a `vercel build --prod` output', () => {
    const byEnv = build({ VERCEL_ENV: 'production' });
    const byOutput = build({}, (dir) => {
      writeFileSync(join(dir, 'builds.json'), JSON.stringify({ target: 'production' }));
      return join(dir, 'static');
    });
    try {
      expect(existsSync(join(byEnv.out, 'partners'))).toBe(false);
      expect(existsSync(join(byOutput.out, 'partners'))).toBe(false);
    } finally {
      rmSync(byEnv.dir, { recursive: true, force: true });
      rmSync(byOutput.dir, { recursive: true, force: true });
    }
  }, 60_000);
});
