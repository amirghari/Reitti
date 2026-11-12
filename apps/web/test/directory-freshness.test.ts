/**
 * E2 (Amir, 12.11.2026): every directory card shows the day its details were
 * checked, in the reader's language, and the directory page says the links are
 * checked daily. Both were true before and visible nowhere.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import en from '../../../config/i18n/ui/en.json' with { type: 'json' };
import fi from '../../../config/i18n/ui/fi.json' with { type: 'json' };
import sv from '../../../config/i18n/ui/sv.json' with { type: 'json' };
import directoryEn from '../../../config/i18n/directory/en.json' with { type: 'json' };
import directoryFi from '../../../config/i18n/directory/fi.json' with { type: 'json' };
import directorySv from '../../../config/i18n/directory/sv.json' with { type: 'json' };
import { directory } from '../src/config';
import { render } from '../src/entry-server';
import { formatDate } from '../src/formatDate';

const ROOT = fileURLToPath(new URL('../../..', import.meta.url));
const UI = { en, fi, sv } as unknown as Record<'en' | 'fi' | 'sv', Record<string, string>>;
const LABEL = { en: directoryEn, fi: directoryFi, sv: directorySv } as unknown as Record<'en' | 'fi' | 'sv', Record<string, string>>;
const LANGS = ['en', 'fi', 'sv'] as const;

describe('the date on each card', () => {
  it('reads as each language writes a date', () => {
    expect(formatDate('2026-09-08', 'en')).toBe('8 September 2026');
    expect(formatDate('2026-09-08', 'fi')).toBe('8.9.2026');
    expect(formatDate('2026-09-08', 'sv')).toBe('8.9.2026');
    expect(formatDate('2026-11-12', 'en')).toBe('12 November 2026');
  });

  it.each(LANGS)('every service on the %s directory page shows its own date, labelled, with the ISO day for machines', (lang) => {
    const html = render('directory', lang);
    const label = LABEL[lang]['directory.verifiedOn'];
    expect(label).toBeTruthy();
    for (const entry of directory) {
      // React writes the attribute as `dateTime`; HTML attribute names are case-insensitive.
      const stamp = new RegExp(`<time datetime="${entry.verifiedOn}">${formatDate(entry.verifiedOn, lang)}</time>`, 'i');
      expect(html, `${lang} / ${entry.id}`).toMatch(stamp);
    }
    // One per card, and none left as a bare ISO date.
    expect(html.match(/class="option-verified mono">/g)).toHaveLength(directory.length);
    expect(html.match(new RegExp(`class="option-verified mono">${label}(<!-- -->)? (<!-- -->)?<time `, 'g'))).toHaveLength(directory.length);
  });
});

describe('the line on the directory page', () => {
  it.each(LANGS)('is on the %s directory page, under the lede', (lang) => {
    const html = render('directory', lang);
    const line = UI[lang]['directory.page.freshness'];
    expect(line).toBeTruthy();
    expect(html).toContain(`<p class="directory-freshness">${line.replace(/'/g, '&#x27;')}</p>`);
    expect(html.indexOf('directory-freshness')).toBeGreaterThan(html.indexOf('directory-lede'));
  });

  it('stays true: the liveness job runs every day and checks every directory address', () => {
    const job = readFileSync(`${ROOT}.github/workflows/directory-liveness.yml`, 'utf8');
    expect(job).toMatch(/cron: '0 4 \* \* \*'/);
    expect(job).toContain('npm run directory:verify -- --live');
    expect(UI.en['directory.page.freshness']).toMatch(/daily/);
  });
});
