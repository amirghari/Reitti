/**
 * IndexNow after each deploy (scripts/indexnow.mjs, Amir 14.11.2026): only the
 * sitemap's own addresses leave, only new, changed or gone ones, never before the
 * live key file answers, and a failed send saves nothing so the next run retries.
 */
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
// @ts-expect-error plain JavaScript module, no declarations
import { ENDPOINT, changedUrls, contentHash, payload, readKey, run, sitemapUrls } from '../indexnow.mjs';

const KEY = readKey();
const SITEMAP = `<urlset><url><loc>https://mielenreitti.fi/</loc></url><url><loc>https://mielenreitti.fi/fi?page=how-it-decides&amp;x=1</loc></url><url><loc>https://elsewhere.example/</loc></url></urlset>`;

function site(pages: Record<string, string>, { keyBody = KEY, api = 202 } = {}) {
  const posts: { url: string; body: unknown }[] = [];
  const fetcher = async (url: string, init?: { method?: string; body?: string }) => {
    if (init?.method === 'POST') {
      posts.push({ url, body: JSON.parse(init.body!) });
      return new Response('', { status: api });
    }
    if (url === `https://mielenreitti.fi/${KEY}.txt`) return new Response(keyBody, { status: 200 });
    if (url === 'https://mielenreitti.fi/sitemap.xml') return new Response(SITEMAP, { status: 200 });
    return url in pages ? new Response(pages[url], { status: 200 }) : new Response('', { status: 404 });
  };
  return { fetcher, posts };
}
const PAGES = {
  'https://mielenreitti.fi/': '<main>Home</main><script src="/assets/index-AAA.js"></script>',
  'https://mielenreitti.fi/fi?page=how-it-decides&x=1': '<main>Miten</main>',
};
const quiet = () => {};

describe('the pieces', () => {
  it('the key file in apps/web/public is the key, and the only one', () => {
    expect(KEY).toMatch(/^[a-f0-9]{32}$/);
    expect(readFileSync(join(__dirname, `../../apps/web/public/${KEY}.txt`), 'utf8').trim()).toBe(KEY);
  });

  it('reads only this host from a sitemap, and decodes &amp;', () => {
    expect(sitemapUrls(SITEMAP)).toEqual(['https://mielenreitti.fi/', 'https://mielenreitti.fi/fi?page=how-it-decides&x=1']);
  });

  it('a rebuilt asset name is not a change; a changed word is', () => {
    const a = contentHash('<main>Home</main><script src="/assets/index-AAA.js"></script>');
    expect(contentHash('<main>Home</main><script src="/assets/index-BBB.js"></script>')).toBe(a);
    expect(contentHash('<main>Homes</main>')).not.toBe(a);
  });

  it('sends new, changed and gone; nothing else', () => {
    expect(changedUrls({ a: '1', b: '2', gone: '3' }, { a: '1', b: '9', new: '4' }).sort()).toEqual(['b', 'gone', 'new']);
  });

  it('the payload names the host and where the key is', () => {
    expect(payload(KEY, ['u'])).toEqual({ host: 'mielenreitti.fi', key: KEY, keyLocation: `https://mielenreitti.fi/${KEY}.txt`, urlList: ['u'] });
  });
});

describe('a run', () => {
  const state = () => join(mkdtempSync(join(tmpdir(), 'indexnow-')), 'state.json');

  it('the first run sends every address once; the next sends only what changed', async () => {
    const file = state();
    const first = site(PAGES);
    await run({ fetcher: first.fetcher, state: file, log: quiet });
    expect(first.posts).toHaveLength(1);
    expect(first.posts[0].url).toBe(ENDPOINT);
    expect((first.posts[0].body as { urlList: string[] }).urlList).toHaveLength(2);

    const same = site({ ...PAGES, 'https://mielenreitti.fi/': '<main>Home</main><script src="/assets/index-ZZZ.js"></script>' });
    await run({ fetcher: same.fetcher, state: file, log: quiet });
    expect(same.posts).toHaveLength(0);

    const edited = site({ ...PAGES, 'https://mielenreitti.fi/': '<main>Home, now with a partner page</main>' });
    await run({ fetcher: edited.fetcher, state: file, log: quiet });
    expect((edited.posts[0].body as { urlList: string[] }).urlList).toEqual(['https://mielenreitti.fi/']);
  });

  it('sends nothing when the live key file does not answer with the key', async () => {
    const s = site(PAGES, { keyBody: 'something else' });
    await expect(run({ fetcher: s.fetcher, state: state(), log: quiet })).rejects.toThrow(/key file/);
    expect(s.posts).toHaveLength(0);
  });

  it('a refused send saves nothing, so the next run sends the same addresses again', async () => {
    const file = state();
    const s = site(PAGES, { api: 429 });
    await expect(run({ fetcher: s.fetcher, state: file, log: quiet })).rejects.toThrow(/429/);
    expect(existsSync(file)).toBe(false);
  });

  it('a dry run sends and saves nothing', async () => {
    const file = state();
    writeFileSync(file, JSON.stringify({ hashes: {} }));
    const s = site(PAGES);
    const r = await run({ fetcher: s.fetcher, state: file, dryRun: true, log: quiet });
    expect(r.wouldSend).toHaveLength(2);
    expect(s.posts).toHaveLength(0);
    expect(JSON.parse(readFileSync(file, 'utf8')).hashes).toEqual({});
  });
});
