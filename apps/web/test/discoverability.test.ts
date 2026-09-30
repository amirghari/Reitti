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

  it('lists each view once per language, on the real domain', () => {
    expect(locs).toHaveLength(6);
    for (const language of ['en', 'fi', 'sv']) {
      expect(locs.filter((l) => l.includes(`lang=${language}`))).toHaveLength(2);
    }
    for (const loc of locs) expect(loc.startsWith('https://mielenreitti.fi/')).toBe(true);
  });

  it('gives every URL its three languages and an x-default', () => {
    const blocks = body.split('<url>').slice(1);
    for (const block of blocks) {
      for (const hreflang of ['en', 'fi', 'sv', 'x-default']) {
        expect(block, hreflang).toContain(`hreflang="${hreflang}"`);
      }
    }
  });

  it('escapes the ampersand, which a raw one makes invalid XML', () => {
    expect(body).toContain('page=how-it-decides&amp;lang=fi');
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
  });

  it('has no em dash, like the rest of the product copy', () => {
    expect(body).not.toContain('—');
  });
});
