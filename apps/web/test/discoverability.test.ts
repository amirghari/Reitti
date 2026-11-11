/**
 * sitemap.xml and llms.txt: served on the real domain only, and saying nothing
 * the site does not say.
 *
 * The host rule is the one robots.txt already follows (D-26): previews and the
 * old vercel.app address serve the same app and must stay out of the index, so
 * handing them a sitemap would be inviting the crawler in by the side door.
 */
import { describe, expect, it } from 'vitest';
import crisis from '../../../config/crisis.json' with { type: 'json' };
import { llms } from '../api/llms';
import llmsHandler from '../api/llms';
import { robotsFor } from '../api/robots';
import sitemapHandler, { sitemap } from '../api/sitemap';
import { GUIDES, GUIDES_PUBLISHED } from '../guides/index';
import { guidePath, guidesIndexPath, type GuideLang } from '../guides/paths';

/** Drive a handler with a fake request and record what it answered. */
function call(handler: typeof sitemapHandler, host: string | undefined, method = 'GET') {
  const out = { status: 0, headers: {} as Record<string, string>, body: '' };
  const res = {
    status(code: number) {
      out.status = code;
      return res;
    },
    setHeader(name: string, value: string) {
      out.headers[name.toLowerCase()] = value;
    },
    send(body: string) {
      out.body = body;
    },
    end() {},
  };
  handler({ method, headers: { host } }, res);
  return out;
}

const OTHER_HOSTS = [
  'reitti-seven.vercel.app',
  'reitti-git-main-amirs-projects-b107307b.vercel.app',
  'localhost:5173',
  undefined,
];

describe('served on mielenreitti.fi, and nowhere else', () => {
  for (const [name, handler] of [
    ['sitemap.xml', sitemapHandler],
    ['llms.txt', llmsHandler],
  ] as const) {
    it(`${name}: 200 on the real domain`, () => {
      const out = call(handler, 'mielenreitti.fi');
      expect(out.status).toBe(200);
      expect(out.body.length).toBeGreaterThan(100);
      expect(out.headers['cache-control']).toBe('no-store');
    });

    it(`${name}: 404 on every other host, and marked noindex`, () => {
      for (const host of OTHER_HOSTS) {
        const out = call(handler, host);
        expect(out.status, `${host} got ${name}`).toBe(404);
        expect(out.headers['x-robots-tag']).toContain('noindex');
      }
    });

    it(`${name}: refuses anything but GET and HEAD`, () => {
      expect(call(handler, 'mielenreitti.fi', 'POST').status).toBe(405);
    });
  }

  it('robots.txt on the real domain points at the sitemap', () => {
    expect(robotsFor('mielenreitti.fi')).toContain('Sitemap: https://mielenreitti.fi/sitemap.xml');
    expect(robotsFor('reitti-seven.vercel.app')).not.toContain('Sitemap:');
  });
});

describe('sitemap.xml', () => {
  const body = sitemap();
  const locs = [...body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  // The app's views; the guides are tested on their own below.
  const viewBlocks = body.split('<url>').slice(1).filter((b) => !/\/(en\/guides|fi\/oppaat|sv\/guider)/.test(b));

  it('lists each view once per language, at its own address, on the real domain (D-44)', () => {
    // 18 views, plus the English guides index and its five guides.
    expect(locs).toHaveLength(24);
    expect(viewBlocks).toHaveLength(18);
    expect(locs.filter((l) => l.includes('lang='))).toHaveLength(0);
    for (const path of ['/', '/why', '/directory', '/privacy', '/about', '/fi', '/fi/miksi', '/fi/palvelut', '/fi/tietosuoja', '/fi/tietoa', '/sv', '/sv/varfor', '/sv/tjanster', '/sv/dataskydd', '/sv/om']) {
      expect(locs).toContain(`https://mielenreitti.fi${path}`);
    }
    expect(locs).toContain('https://mielenreitti.fi/fi?page=how-it-decides');
    for (const loc of locs) expect(loc.startsWith('https://mielenreitti.fi/')).toBe(true);
  });

  it('every x-default is the English address', () => {
    for (const block of viewBlocks) {
      const xdefault = block.match(/hreflang="x-default" href="([^"]+)"/)![1];
      const en = block.match(/hreflang="en" href="([^"]+)"/)![1];
      expect(xdefault).toBe(en);
    }
  });

  it('gives every view its three languages and an x-default', () => {
    for (const block of viewBlocks) {
      for (const hreflang of ['en', 'fi', 'sv', 'x-default']) {
        expect(block, hreflang).toContain(`hreflang="${hreflang}"`);
      }
    }
  });

  it('escapes the ampersand, which a raw one makes invalid XML', () => {
    expect(body).not.toMatch(/&(?!amp;)/);
    expect(body.replace(/&amp;/g, '')).not.toContain('&');
  });
});

describe('llms.txt', () => {
  const body = llms();

  it('carries every crisis line in config, and 112 first', () => {
    for (const resource of crisis.resources) expect(body).toContain(resource.phone);
    const first = body.split('\n').find((line) => line.startsWith('- ') && /\d/.test(line));
    expect(first).toContain('112');
  });

  it('says it does not diagnose, and links to how it decides', () => {
    expect(body).toMatch(/does not diagnose/);
    expect(body).toContain('https://mielenreitti.fi/?page=how-it-decides');
    expect(body).toContain('https://mielenreitti.fi/why');
  });

  it('has no em dash, like the rest of the product copy', () => {
    expect(body).not.toContain('—');
  });
});

describe('guides in sitemap.xml and llms.txt', () => {
  const LANGS: GuideLang[] = ['en', 'fi', 'sv'];
  const pathsOf = (lang: GuideLang) => [guidesIndexPath(lang), ...GUIDES[lang].map((g) => guidePath(g.slug, lang))];
  const locsOf = (xml: string) => [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const hrefsOf = (xml: string) => [...xml.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
  const linksOf = (text: string) => [...text.matchAll(/\]\((https:\/\/[^)]+)\)/g)].map((m) => m[1]);
  // Every combination of the three publish flags, today's included.
  const combos = [0, 1, 2, 3, 4, 5, 6, 7].map((bits) => ({ en: !!(bits & 1), fi: !!(bits & 2), sv: !!(bits & 4) }));

  it('lists the five live English guides and their index in both', () => {
    expect(GUIDES_PUBLISHED.en).toBe(true);
    for (const path of pathsOf('en')) {
      expect(locsOf(sitemap()), path).toContain(`https://mielenreitti.fi${path}`);
      expect(linksOf(llms()), path).toContain(`https://mielenreitti.fi${path}`);
    }
    for (const guide of GUIDES.en) expect(llms()).toContain(`[${guide.title}](https://mielenreitti.fi${guidePath(guide.slug)})`);
  });

  it('never names an unpublished guide, under any combination of publish flags', () => {
    for (const published of combos) {
      const xml = sitemap(published);
      const text = llms(published);
      for (const lang of LANGS) {
        for (const path of pathsOf(lang)) {
          const url = `https://mielenreitti.fi${path}`;
          const where = `${path} with ${JSON.stringify(published)}`;
          if (published[lang]) {
            expect(locsOf(xml), where).toContain(url);
            expect(linksOf(text), where).toContain(url);
          } else {
            // Not as a page, not as an alternate, not as a link, not even as text.
            expect(locsOf(xml), where).not.toContain(url);
            expect(hrefsOf(xml), where).not.toContain(url);
            expect(text, where).not.toContain(path);
            expect(xml, where).not.toContain(path);
          }
        }
      }
    }
  });

  it('reaches the real domain through the handlers, as production serves them', () => {
    // The handlers must not pass anything into sitemap() or llms(): the host
    // they are handed would be read as the publish flags and drop every guide.
    const xml = call(sitemapHandler, 'mielenreitti.fi').body;
    const text = call(llmsHandler, 'mielenreitti.fi').body;
    for (const path of pathsOf('en')) {
      expect(locsOf(xml), path).toContain(`https://mielenreitti.fi${path}`);
      expect(linksOf(text), path).toContain(`https://mielenreitti.fi${path}`);
    }
    expect(xml).toBe(sitemap());
    expect(text).toBe(llms());
  });

  it('names no Finnish or Swedish guide today, while both are drafts', () => {
    expect(GUIDES_PUBLISHED.fi).toBe(false);
    expect(GUIDES_PUBLISHED.sv).toBe(false);
    for (const text of [sitemap(), llms()]) {
      expect(text).not.toContain('/fi/oppaat');
      expect(text).not.toContain('/sv/guider');
    }
  });

  it('gives a guide alternates only in its published translations, with English as x-default', () => {
    const block = (xml: string, path: string) => xml.split('<url>').find((b) => b.includes(`<loc>https://mielenreitti.fi${path}</loc>`))!;
    const enOnly = block(sitemap({ en: true, fi: false, sv: false }), guidePath(GUIDES.en[0].slug));
    expect(enOnly).not.toContain('hreflang');
    const enFi = block(sitemap({ en: true, fi: true, sv: false }), guidePath(GUIDES.fi[0].slug, 'fi'));
    expect(enFi).toContain(`hreflang="en" href="https://mielenreitti.fi${guidePath(GUIDES.en[0].slug)}"`);
    expect(enFi).toContain(`hreflang="x-default" href="https://mielenreitti.fi${guidePath(GUIDES.en[0].slug)}"`);
    expect(enFi).not.toContain('hreflang="sv"');
  });
});

describe('the meta description', () => {
  it('index.html carries the English bundle text, and it says answers never leave the phone', async () => {
    const { readFileSync } = await import('node:fs');
    const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
    const en = (await import('../../../config/i18n/ui/en.json', { with: { type: 'json' } })).default as Record<string, string>;
    expect(html).toContain(`content="${en['meta.description']}"`);
    expect(en['meta.description']).toContain('your answers never leave your phone');
    expect(html).not.toMatch(/nothing stored|stores nothing/i);
  });
});
