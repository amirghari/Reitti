/**
 * A page per directory service (Amir, 12.11.2026): 22 services, 7 Cups left out,
 * each in en, fi and sv at its own address, in sitemap.xml and llms.txt, with
 * structured data. Each page shows only what the service's card shows.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import crisis from '../../../config/crisis.json' with { type: 'json' };
import directoryEn from '../../../config/i18n/directory/en.json' with { type: 'json' };
import directoryFi from '../../../config/i18n/directory/fi.json' with { type: 'json' };
import directorySv from '../../../config/i18n/directory/sv.json' with { type: 'json' };
import uiEn from '../../../config/i18n/ui/en.json' with { type: 'json' };
import uiFi from '../../../config/i18n/ui/fi.json' with { type: 'json' };
import uiSv from '../../../config/i18n/ui/sv.json' with { type: 'json' };
import { llms } from '../api/llms';
import { sitemap } from '../api/sitemap';
import { publishedServicePages, SERVICE_IDS } from '../services/published';
import { servicePage, servicePath, servicesIndexPath } from '../services/render';
import { ADDRESSES } from '../src/addresses';
import { OptionCard } from '../src/components/Options';
import { directory } from '../src/config';
import { render } from '../src/entry-server';
import { formatDate } from '../src/formatDate';

const ROOT = fileURLToPath(new URL('../../..', import.meta.url));
const LANGS = ['en', 'fi', 'sv'] as const;
type L = (typeof LANGS)[number];
const STRINGS: Record<L, Record<string, string>> = {
  en: { ...(uiEn as unknown as Record<string, string>), ...(directoryEn as unknown as Record<string, string>) },
  fi: { ...(uiFi as unknown as Record<string, string>), ...(directoryFi as unknown as Record<string, string>) },
  sv: { ...(uiSv as unknown as Record<string, string>), ...(directorySv as unknown as Record<string, string>) },
};
const s = (lang: L, key: string) => {
  const value = STRINGS[lang][key];
  if (typeof value !== 'string') throw new Error(`no ${key} in ${lang}`);
  return value;
};
const esc = (text: string) => text.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
const withPage = directory.filter((e) => !e.fallbackOnly);

describe('which services have a page', () => {
  it('every directory entry except the fallback-only one: 22, and no 7 Cups', () => {
    expect(new Set(SERVICE_IDS)).toEqual(new Set(withPage.map((e) => e.id)));
    expect(SERVICE_IDS).toHaveLength(22);
    expect(SERVICE_IDS).not.toContain('7cups');
    expect(directory.filter((e) => e.fallbackOnly).map((e) => e.id)).toEqual(['7cups']);
  });

  it('a fallback-only entry cannot be rendered as a page', () => {
    const sevenCups = directory.find((e) => e.id === '7cups')!;
    expect(() => servicePage(sevenCups, 'en')).toThrow(/fallback only/);
  });

  it('lives under each language’s directory address', () => {
    for (const lang of LANGS) {
      expect(servicesIndexPath(lang)).toBe(ADDRESSES.directory[lang]);
      expect(servicePath('tukinet', lang)).toBe(`${ADDRESSES.directory[lang]}/tukinet`);
    }
    expect(publishedServicePages()).toHaveLength(66);
  });
});

describe('each page', () => {
  for (const entry of withPage) {
    for (const lang of LANGS) {
      it(`${entry.id} (${lang}) shows what its card shows, under the crisis lines`, () => {
        const html = servicePage(entry, lang);
        const main = html.slice(html.indexOf('<main'), html.indexOf('</main>'));
        // Frame: language, its own address and its translations, crisis lines first (invariant 1).
        expect(html).toContain(`<html lang="${lang}">`);
        expect(html).toContain(`<link rel="canonical" href="https://mielenreitti.fi${servicePath(entry.id, lang)}">`);
        for (const alt of LANGS) expect(html).toContain(`hreflang="${alt}" href="https://mielenreitti.fi${servicePath(entry.id, alt)}"`);
        expect(html).toContain(`hreflang="x-default" href="https://mielenreitti.fi${servicePath(entry.id, 'en')}"`);
        expect(html.indexOf('class="crisis-band"')).toBeLessThan(html.indexOf('<main'));
        for (const line of crisis.resources) expect(html).toContain(line.phone);
        expect(html).not.toContain('<script src');
        expect(html).not.toContain('noindex');
        // The card's facts.
        expect(main).toContain(`<h1>${esc(s(lang, entry.nameRef))}</h1>`);
        expect(main).toContain(esc(entry.operatorRef ? s(lang, entry.operatorRef) : entry.operator));
        expect(main).toContain(esc(s(lang, `cost.band.${entry.costBand}`)));
        expect(main).toContain(esc(s(lang, entry.hoursRef)));
        expect(main).toContain(esc(s(lang, `directory.anonymity.${entry.anonymity}`)));
        for (const l of entry.languages) expect(main).toContain(esc(s(lang, `directory.language.${l}`)));
        for (const f of entry.formats) expect(main).toContain(esc(s(lang, `directory.format.${f}`)));
        if (entry.whoAnswers === 'not-applicable') expect(main).not.toContain(esc(s(lang, 'directory.label.whoAnswers')));
        else expect(main).toContain(esc(s(lang, `directory.whoAnswers.${entry.whoAnswers}`)));
        if (entry.costNoteRef) expect(main).toContain(esc(s(lang, entry.costNoteRef)));
        if (entry.audienceRef) expect(main).toContain(esc(s(lang, entry.audienceRef)));
        if (entry.cautionRef) expect(main).toContain(esc(s(lang, entry.cautionRef)));
        if (entry.phone) expect(main).toContain(`href="tel:${entry.phone.replace(/\s/g, '')}"`);
        expect(main).toContain(`href="${esc(entry.url)}"`);
        expect(main).toContain(`<time datetime="${entry.verifiedOn}">${esc(formatDate(entry.verifiedOn, lang))}</time>`);
        expect(main).toContain(`href="${servicesIndexPath(lang)}"`);
        // Says when it does not speak the page's language, as the card does.
        expect(main.includes(esc(s(lang, 'directory.languageMismatch')))).toBe(!entry.languages.includes(lang));
      });
    }
  }

  it('structured data: a Service on a WebPage, saying only what the page says', () => {
    for (const entry of withPage) {
      for (const lang of LANGS) {
        const html = servicePage(entry, lang);
        const json = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)![1]);
        const graph = json['@graph'] as Record<string, unknown>[];
        const page = graph.find((n) => n['@type'] === 'WebPage')!;
        const service = graph.find((n) => n['@type'] === 'Service')!;
        expect(page['@id']).toBe(`https://mielenreitti.fi${servicePath(entry.id, lang)}`);
        expect(page.inLanguage).toBe(lang);
        expect(service.name).toBe(s(lang, entry.nameRef));
        expect((service.provider as { name: string }).name).toBe(entry.operatorRef ? s(lang, entry.operatorRef) : entry.operator);
        expect(service.availableLanguage).toEqual(entry.languages);
        expect(service.url).toBe(entry.url);
        // No claims in a form the page's reader never sees.
        for (const key of ['hoursAvailable', 'offers', 'areaServed', 'isAccessibleForFree', 'aggregateRating', 'review', 'reviewedBy']) {
          expect(Object.keys(service), key).not.toContain(key);
          expect(Object.keys(page), key).not.toContain(key);
        }
      }
    }
  });

  it('the new strings exist in all three languages, without an em dash, and fi/sv wait for the native reviewer', () => {
    for (const lang of LANGS) {
      for (const key of ['service.lede', 'service.description', 'directory.label.cost', 'directory.servicePage']) {
        expect(s(lang, key), `${lang} ${key}`).not.toMatch(/—/);
      }
    }
    for (const bundle of [uiFi, uiSv] as unknown as { _needsNativeReview: string[] }[]) {
      expect(bundle._needsNativeReview).toEqual(expect.arrayContaining(['service.lede', 'service.description']));
    }
  });
});

describe('each card on /directory links to its page, and only there', () => {
  it.each(LANGS)('on the %s directory page, every card but 7 Cups', (lang) => {
    const html = render('directory', lang);
    for (const entry of withPage) {
      expect(html, entry.id).toContain(`class="option-more" href="${servicePath(entry.id, lang)}"`);
    }
    expect(html).not.toContain(`href="${servicePath('7cups', lang)}"`);
    expect(html.match(/class="option-more"/g)).toHaveLength(withPage.length);
  });

  it.each(LANGS)('the %s landing page shows cards but no page link: a same-tab link out of the app loses screens that cannot be restored', (lang) => {
    const html = render('home', lang);
    expect(html).toContain('class="option-card"');
    expect(html).not.toContain('class="option-more"');
  });

  it('a card links to its page only when asked to: the result, youth and person-to-talk-to screens never ask', () => {
    const entry = withPage[0];
    const plain = renderToStaticMarkup(createElement('ul', null, createElement(OptionCard, { entry, careLanguage: 'en' })));
    const linked = renderToStaticMarkup(createElement('ul', null, createElement(OptionCard, { entry, careLanguage: 'en', pageLink: true })));
    expect(plain).toContain('class="option-card"');
    expect(plain).not.toContain('option-more');
    expect(linked).toContain('option-more');
  });

  it('the link names its service for assistive tech', () => {
    const html = render('directory', 'en');
    const tukinet = withPage.find((e) => e.id === 'tukinet')!;
    expect(html).toContain(`aria-label="${s('en', 'directory.servicePage')}: ${s('en', tukinet.nameRef)}"`);
  });
});

describe('a caution is never left off a page', () => {
  it('an entry with a caution prints it, in every language', () => {
    const sevenCups = directory.find((e) => e.id === '7cups')!;
    // No entry with a page carries a caution today; this one is made up from 7 Cups' own, without the fallback flag.
    const withCaution = { ...withPage[0], cautionRef: sevenCups.cautionRef };
    for (const lang of LANGS) {
      expect(servicePage(withCaution, lang)).toContain(`<p class="service-caution">${esc(s(lang, sevenCups.cautionRef!))}</p>`);
    }
  });
});

describe('in sitemap.xml and llms.txt', () => {
  const xml = sitemap();
  const blocks = xml.split('<url>').slice(1);
  const block = (path: string) => blocks.find((b) => b.includes(`<loc>https://mielenreitti.fi${path}</loc>`));

  it('every page, each with its three languages and English as x-default', () => {
    for (const page of publishedServicePages()) {
      const b = block(page.path);
      expect(b, page.path).toBeTruthy();
      for (const alt of LANGS) expect(b).toContain(`hreflang="${alt}" href="https://mielenreitti.fi${servicePath(page.id, alt)}"`);
      expect(b).toContain(`hreflang="x-default" href="https://mielenreitti.fi${servicePath(page.id, 'en')}"`);
    }
    expect(xml).not.toContain('7cups');
  });

  it('llms.txt names each English page by its card name, and no 7 Cups', () => {
    const body = llms();
    for (const page of publishedServicePages().filter((p) => p.lang === 'en')) {
      expect(body).toContain(`- [${page.title}](https://mielenreitti.fi${page.path})`);
    }
    expect(body).not.toContain('7cups');
    expect(body).not.toMatch(/\/(fi\/palvelut|sv\/tjanster)\//);
  });
});

describe('npm run build writes them', () => {
  it('66 pages into the build output, none for 7 Cups', () => {
    const out = mkdtempSync(join(tmpdir(), 'services-'));
    try {
      execFileSync('npx', ['vite-node', '../../scripts/build-services.ts', '--out', out], { cwd: join(ROOT, 'apps/web'), stdio: 'pipe' });
      for (const lang of LANGS) {
        const dir = join(out, servicesIndexPath(lang));
        expect(readdirSync(dir).sort()).toEqual([...SERVICE_IDS].sort());
        for (const id of SERVICE_IDS) expect(existsSync(join(dir, id, 'index.html'))).toBe(true);
      }
      expect(existsSync(join(out, 'site-pages.css'))).toBe(true);
    } finally {
      rmSync(out, { recursive: true, force: true });
    }
  }, 60_000);
});
