/**
 * One address per screen per language (D-44), and vercel.json in step with it:
 * every language path is rewritten to the app, and every `?lang=` on any of
 * them redirects permanently to the matching path.
 */
import { describe, expect, it } from 'vitest';
import vercel from '../vercel.json' with { type: 'json' };
import { ADDRESSES, LANGUAGES, addressFor, localize, parseAddress, type AddressedScreen } from '../src/addresses';

const screens = Object.keys(ADDRESSES) as AddressedScreen[];

describe('the address table', () => {
  it('every address is unique, and parses back to its screen and language', () => {
    const all = screens.flatMap((s) => LANGUAGES.map((l) => addressFor(s, l)));
    expect(new Set(all).size).toBe(all.length);
    for (const screen of screens) for (const lang of LANGUAGES) expect(parseAddress(addressFor(screen, lang))).toEqual({ screen, lang });
    expect(parseAddress('/fi/miksi/')).toEqual({ screen: 'why', lang: 'fi' });
    expect(parseAddress('/fi/oppaat')).toBeNull();
  });

  it('localize moves a link into another language, keeps its other parameters and drops lang', () => {
    expect(localize('/why', 'fi')).toBe('/fi/miksi');
    expect(localize('/directory?entry=terapianavigaattori', 'sv')).toBe('/sv/tjanster?entry=terapianavigaattori');
    expect(localize('/?page=how-it-decides', 'fi')).toBe('/fi?page=how-it-decides');
    expect(localize('/directory?lang=fi&spoken=en', 'fi')).toBe('/fi/palvelut?spoken=en');
    expect(localize('/en/guides', 'fi')).toBe('/en/guides');
  });
});

describe('vercel.json', () => {
  const rewrites = new Set(vercel.rewrites.map((r) => r.source));
  const redirects = vercel.redirects as { source: string; has: { type: string; key: string; value: string }[]; destination: string; permanent: boolean }[];

  it('rewrites every language path to the app', () => {
    for (const screen of screens) for (const lang of LANGUAGES) {
      const path = addressFor(screen, lang);
      if (path !== '/') expect(rewrites.has(path), path).toBe(true);
    }
  });

  it('redirects ?lang= permanently from every address to the matching one, never to itself', () => {
    for (const screen of screens) for (const from of LANGUAGES) for (const to of LANGUAGES) {
      if (from === to) continue;
      const rule = redirects.find((r) => r.source === addressFor(screen, from) && r.has[0].value === to);
      expect(rule, `${addressFor(screen, from)}?lang=${to}`).toBeDefined();
      expect(rule!.destination).toBe(addressFor(screen, to));
      expect(rule!.permanent).toBe(true);
    }
    for (const r of redirects) expect(r.destination, r.source).not.toBe(r.source);
  });
});
