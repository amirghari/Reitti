/**
 * The partner page (Amir, 14.11.2026): the draft's text with his two changes,
 * live at /partners, in the sitemap and llms.txt, under the crisis lines.
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { llms } from '../api/llms';
import { sitemap } from '../api/sitemap';
import { LEDE, PARTNER_PATH, SECTIONS, TITLE, partnerPage } from '../partners/page';

const ROOT = fileURLToPath(new URL('../../..', import.meta.url));
const SCRIPT = join(ROOT, 'scripts/build-partners.ts');
const VITE_NODE = join(ROOT, 'node_modules/.bin/vite-node');

describe('the partner page', () => {
  const html = partnerPage();

  it('carries the draft: title, lede and its sections, with "How it is kept up to date" added', () => {
    expect(html).toContain(`<h1>${TITLE}</h1>`);
    expect(html).toContain(LEDE);
    expect(SECTIONS.map((s) => s.heading)).toEqual([
      'What it does',
      'What it never does',
      'Privacy, in plain words',
      'How it has been checked, and what has not been yet',
      'How it is kept up to date',
      'How to link to it',
      'Who runs it',
      'Contact',
    ]);
    expect(html).toContain('href="mailto:tietosuoja@mielenreitti.fi"');
  });

  it('says the Finnish review is booked, not in progress (Amir, 14.11.2026)', () => {
    expect(html).toContain(
      '<strong>A review by a Finland-registered psychologist is booked for the week of 23 November 2026 and not yet done.</strong>',
    );
    expect(html).not.toContain('in progress');
  });

  it('keeping it up to date: check dates, the daily address test, same-day corrections, and no monthly re-check yet', () => {
    const section = html.slice(html.indexOf('How it is kept up to date'), html.indexOf('How to link to it'));
    expect(section).toContain('date its details were last checked');
    expect(section).toContain('tested automatically each day');
    expect(section).toContain('we correct it the same day');
    expect(section.toLowerCase()).not.toContain('month');
  });

  it('is under the crisis lines like every static page (invariant 1)', () => {
    expect(html.indexOf('112')).toBeGreaterThan(-1);
    expect(html.indexOf('112')).toBeLessThan(html.indexOf('<main'));
  });

  it('is open to search engines and listed in the sitemap and llms.txt, at one address', () => {
    expect(html).not.toContain('noindex');
    expect(html).toContain(`<link rel="canonical" href="https://mielenreitti.fi${PARTNER_PATH}">`);
    expect(sitemap()).toContain(`<loc>https://mielenreitti.fi${PARTNER_PATH}</loc>`);
    expect(llms()).toContain(`[${TITLE}](https://mielenreitti.fi${PARTNER_PATH})`);
  });

  it('has no em dash and no script', () => {
    expect(html).not.toContain('—');
    expect(html).not.toContain('<script');
  });
});

describe('scripts/build-partners.ts', () => {
  it('writes the page, in a production build too', () => {
    const dir = mkdtempSync(join(tmpdir(), 'partners-'));
    try {
      execFileSync(VITE_NODE, [SCRIPT, '--out', dir], { cwd: ROOT, env: { ...process.env, VERCEL_ENV: 'production' }, stdio: 'pipe' });
      expect(readFileSync(join(dir, 'partners/index.html'), 'utf8')).toBe(partnerPage());
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }, 60_000);
});
