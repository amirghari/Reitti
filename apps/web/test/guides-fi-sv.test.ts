/**
 * The Finnish and Swedish guide drafts (Amir, 9.11.2026): held to the same rules
 * as the English ones, and not public until the native reviewer has read them.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import crisis from '../../../config/crisis.json' with { type: 'json' };
import { GUIDES, GUIDES_PUBLISHED } from '../guides/index';
import { publishedGuidePages } from '../guides/published';
import { checkGuide, guidePage, guidePath, guidesIndexPath } from '../guides/render';
import { localize } from '../src/addresses';

const ROOT = fileURLToPath(new URL('../../..', import.meta.url));

describe.each(['fi', 'sv'] as const)('%s guide drafts', (lang) => {
  const guides = GUIDES[lang];
  const known = new Set([localize('/', lang), localize('/directory', lang), localize('/privacy', lang), guidesIndexPath(lang), ...guides.map((g) => guidePath(g.slug, lang))]);

  it('five drafts, unpublished', () => {
    expect(guides).toHaveLength(5);
    expect(GUIDES_PUBLISHED[lang]).toBe(false);
  });

  it('every draft passes every rule, in its own language, checked on 9.11.2026', () => {
    for (const guide of guides) {
      expect(checkGuide(guide), guide.slug).toEqual([]);
      expect(guide.lang, guide.slug).toBe(lang);
      expect(guide.checkedOn, guide.slug).toBe('2026-11-09');
    }
  });

  it('rendered as a draft: its language, noindex, the crisis lines first, and links that stay in its language', () => {
    for (const guide of guides) {
      const html = guidePage(guide, { noindex: true });
      expect(html, guide.slug).toContain(`<html lang="${lang}">`);
      expect(html, guide.slug).toContain('<meta name="robots" content="noindex, nofollow">');
      expect(html.indexOf('class="crisis-band"'), guide.slug).toBeLessThan(html.indexOf('<main'));
      for (const r of crisis.resources) expect(html, guide.slug).toContain(`href="tel:${r.phone.replace(/\s/g, '')}"`);
      for (const [, href] of html.matchAll(/href="(\/[^"#]*)"/g)) {
        if (href.endsWith('.css') || href.endsWith('.svg')) continue;
        expect(known.has(href.replace(/&amp;/g, '&')), `${guide.slug} links to ${href}`).toBe(true);
      }
      // The closed English line appears only as closed.
      const text = html.replace(/<sup[^>]*>.*?<\/sup>/gs, '').replace(/<[^>]+>/g, ' ');
      if (text.includes('2525 0116')) expect(text, guide.slug).toMatch(/2525 0116.{0,80}(suljettu|stängd)/s);
    }
  });
});

describe('each translation is paired with the English guide it translates (reviewer note on #22)', () => {
  const englishSlugs = GUIDES.en.map((g) => g.slug);

  it('English guides name no original; each one is translated exactly once per language, in the same place', () => {
    for (const g of GUIDES.en) expect(g.translationOf, g.slug).toBeUndefined();
    for (const lang of ['fi', 'sv'] as const) {
      const originals = GUIDES[lang].map((g) => g.translationOf);
      expect(originals, lang).toEqual(englishSlugs);
    }
  });

  it('a translation has as many sections as its original', () => {
    // Only the count: a translation may fairly add a line of its own, as the
    // Swedish free-help guide adds the Swedish Sekasin chat.
    for (const lang of ['fi', 'sv'] as const) {
      for (const g of GUIDES[lang]) {
        const original = GUIDES.en.find((e) => e.slug === g.translationOf)!;
        expect(g.sections.length, `${lang}/${g.slug} ↔ ${original.slug}`).toBe(original.sections.length);
      }
    }
  });

  it('the sitemap groups each guide with its own translations, by name rather than by position', () => {
    const pages = publishedGuidePages({ en: true, fi: true, sv: true });
    for (const en of GUIDES.en) {
      const group = pages.filter((p) => p.slot === pages.find((q) => q.path === guidePath(en.slug, 'en'))!.slot);
      const expected = (['en', 'fi', 'sv'] as const).map((lang) => {
        const g = lang === 'en' ? en : GUIDES[lang].find((t) => t.translationOf === en.slug)!;
        return guidePath(g.slug, lang);
      });
      expect(group.map((p) => p.path).sort(), en.slug).toEqual(expected.sort());
    }
  });
});

describe('the gate', () => {
  const build = (env: Record<string, string>) => {
    const out = mkdtempSync(join(tmpdir(), 'guides-'));
    execFileSync(join(ROOT, 'node_modules/.bin/vite-node'), [join(ROOT, 'scripts/build-guides.ts'), '--out', out], {
      cwd: ROOT,
      stdio: 'pipe',
      env: { ...process.env, ...env },
    });
    return out;
  };

  it('a production build leaves the drafts out', () => {
    const out = build({ VERCEL_ENV: 'production' });
    expect(existsSync(join(out, 'en/guides/free-help-now/index.html'))).toBe(true);
    expect(existsSync(join(out, 'fi'))).toBe(false);
    expect(existsSync(join(out, 'sv'))).toBe(false);
    rmSync(out, { recursive: true, force: true });
  }, 60_000);

  it('a preview build includes them, each marked noindex, and leaves English indexable', () => {
    const out = build({ VERCEL_ENV: 'preview' });
    expect(readFileSync(join(out, 'fi/oppaat/ilmainen-apu-nyt/index.html'), 'utf8')).toContain('noindex');
    expect(readFileSync(join(out, 'sv/guider/gratis-hjalp-nu/index.html'), 'utf8')).toContain('noindex');
    expect(readFileSync(join(out, 'en/guides/free-help-now/index.html'), 'utf8')).not.toContain('noindex');
    rmSync(out, { recursive: true, force: true });
  }, 60_000);
});
