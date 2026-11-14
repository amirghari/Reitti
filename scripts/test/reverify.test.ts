/**
 * The monthly re-verification (scripts/reverify.mjs, Amir 14.11.2026): every
 * entry has something to look for, a missing phrase flags the entry for a person,
 * nothing free-form reaches STATUS.md, and nothing is ever re-dated.
 */
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  END,
  START,
  STALE_DAYS,
  buildSection,
  check,
  extractSection,
  fold,
  loadTargets,
  missingClaims,
  pageText,
  reasonOf,
  replaceSection,
  validate,
  // @ts-expect-error plain JavaScript module, no declarations
} from '../reverify.mjs';

type Target = { id: string; url: string; localUrls: Record<string, string>; claims: string[]; manual: string | null; verifiedOn: string };
type Targets = { entries: Target[]; crisis: { id: string; url: string; claims: string[] }[] };
const targets: Targets = loadTargets();

describe('the config the job reads', () => {
  it('every directory entry has claims or says why a person reads it, never both', () => {
    expect(targets.entries.length).toBe(23);
    for (const t of targets.entries) {
      expect(t.claims.length > 0 || Boolean(t.manual), t.id).toBe(true);
      expect(t.claims.length > 0 && Boolean(t.manual), t.id).toBe(false);
    }
  });

  it('every crisis line with a source has phrases to look for', () => {
    expect(targets.crisis.map((c) => c.id).sort()).toEqual(['emergency', 'mieli-fi', 'mieli-sv']);
    for (const c of targets.crisis) expect(c.claims.length, c.id).toBeGreaterThan(0);
  });
});

describe('reading a page', () => {
  it('Klubitalot is checked on the page its claims come from, not the map it links', () => {
    const k = targets.entries.find((t) => t.id === 'suomen-klubitalot')!;
    expect(k.url).toBe('https://suomenklubitalot.fi/mika-on-klubitalo/');
  });

  it('turns a fetch failure into one of a fixed set of reasons', () => {
    expect(reasonOf({ cause: { code: 'UNABLE_TO_GET_ISSUER_CERT_LOCALLY' } })).toBe('certificate');
    expect(reasonOf({ name: 'AbortError', code: 20 })).toBe('timeout');
    expect(reasonOf({ cause: { code: 'ENOTFOUND' } })).toBe('dns');
    expect(reasonOf({ cause: { code: 'something <!-- odd' } })).toBe('other');
  });

  it('decodes the Finnish and Swedish letters a page may write as names', () => {
    expect(pageText('<p>j&auml;senyys &aring;r &Ouml;</p>')).toBe('jäsenyys år ö');
  });

  it('finds a phrase through tags, entities, JSON escapes, case, dashes and curly quotes', () => {
    const raw = `<p>Jos olet <b>16&ndash;67</b>-vuotias</p><script>{"d":"It\\u2019s anonymous and completely free"}</script>`;
    const text = pageText(raw);
    expect(missingClaims(text, ['jos olet 16–67-vuotias', "It's anonymous and completely free", 'not there'])).toEqual([2]);
  });

  it('folds only what does not change meaning', () => {
    expect(fold('  Må  och ONS kl. 16–20 ')).toBe('må och ons kl. 16-20');
  });
});

const fake = (pages: Record<string, { status: number; html?: string }>) => async (url: string) => {
  const p = pages[url] ?? { status: 200, html: '' };
  return { status: p.status, ...(p.status === 0 ? { reason: 'timeout' } : {}), text: pageText(p.html ?? '') };
};
const T: Targets = {
  entries: [
    { id: 'a', url: 'https://a/', localUrls: { sv: 'https://a/sv' }, claims: ['open daily', 'free'], manual: null, verifiedOn: '2026-11-12' },
    { id: 'b', url: 'https://b/', localUrls: {}, claims: ['ages 12-29'], manual: null, verifiedOn: '2026-09-01' },
    { id: 'c', url: 'https://c/', localUrls: {}, claims: [], manual: 'a script-only site', verifiedOn: '2026-11-12' },
    { id: 'd', url: 'https://d/', localUrls: {}, claims: ['x'], manual: null, verifiedOn: '2026-11-12' },
  ],
  crisis: [{ id: 'emergency', url: 'https://112/', claims: ['24/7'] }],
};
const PAGES = {
  'https://a/': { status: 200, html: '<p>Open daily, and free.</p>' },
  'https://a/sv': { status: 404 },
  'https://b/': { status: 200, html: '<p>ages 13-29</p>' },
  'https://d/': { status: 403 },
  'https://112/': { status: 200, html: 'palvelemme 24/7' },
};

describe('a run', () => {
  it('sorts entries into changed, read by hand and hold, and never fetches a manual one', async () => {
    const asked: string[] = [];
    const out = await check(T, async (url: string) => {
      asked.push(url);
      return fake(PAGES)(url);
    });
    expect(asked).not.toContain('https://c/');
    const s: string = buildSection(validate(out, T), T, 'https://github.com/o/r/actions/runs/1');
    expect(s.startsWith(START) && s.endsWith(END)).toBe(true);
    expect(s).toContain('1 changed, 2 to read by hand, 1 hold');
    expect(s).toContain('| b | https://b/ | ages 12-29 |');
    expect(s).toContain('- c: a script-only site');
    expect(s).toContain("- d: answered 403 (refuses GitHub's servers");
    expect(s).toContain('- a (sv): its sv page answered 404');
    expect(s).toMatch(/### Hold \(1\)\n\na\n/);
    expect(s).toContain('- emergency: holds (https://112/)');
    expect(s).toContain(`### Checked more than ${STALE_DAYS} days ago (1)`);
    expect(s).toContain('b (2026-09-01)');
    expect(s).toContain('Nothing is re-dated by this job');
  });

  it('a crisis source that changed is said loudly, and stays report only', async () => {
    const out = await check(T, fake({ ...PAGES, 'https://112/': { status: 200, html: 'nothing here' } }));
    const s: string = buildSection(validate(out, T), T);
    expect(s).toContain('- emergency: CHANGED, no longer says: "24/7"');
    expect(s).toContain('report only: a crisis line changes only with written confirmation');
  });
});

describe('the results file is checked before anything reaches STATUS.md', () => {
  // A complete, clean run of T, to vary one thing at a time.
  const full = () => ({
    checkedAt: '2026-12-01T05:00:01.000Z',
    results: [
      { kind: 'entry', id: 'a', status: 200, missing: [] },
      { kind: 'entry', id: 'b', status: 200, missing: [0] },
      { kind: 'entry', id: 'c', status: -1, missing: [] },
      { kind: 'entry', id: 'd', status: 0, reason: 'certificate', missing: [] },
      { kind: 'crisis', id: 'emergency', status: 200, missing: [] },
      { kind: 'local', id: 'a', lang: 'sv', status: 200 },
    ] as Record<string, unknown>[],
  });
  const withResult = (i: number, patch: Record<string, unknown>) => {
    const r = full();
    r.results[i] = { ...r.results[i], ...patch };
    return r;
  };

  it('passes a real run and drops anything it does not use', () => {
    const r = withResult(1, { note: '<!-- -->' });
    expect(validate(r, T).results[1]).toEqual({ kind: 'entry', id: 'b', status: 200, missing: [0] });
    expect(validate(full(), T).results[3]).toEqual({ kind: 'entry', id: 'd', status: 0, reason: 'certificate', missing: [] });
  });

  it.each([
    ['an id not in the config', withResult(0, { id: 'zz' })],
    ['a crisis id as an entry', withResult(4, { kind: 'entry' })],
    ['a missing index past the claims', withResult(1, { missing: [5] })],
    ['free text as a missing claim', withResult(1, { missing: ['| injected |'] })],
    ['a language the entry has no page in', withResult(5, { lang: 'fi' })],
    ['a reason outside the fixed set', withResult(3, { reason: 'ECONN <!--' })],
    ['-1 for an entry that is not manual', withResult(0, { status: -1 })],
    ['-1 for a crisis source', withResult(4, { status: -1 })],
    ['a fetched result for a manual entry', withResult(2, { status: 200 })],
    ['a time that is not a time', { ...full(), checkedAt: 'today' }],
    ['a page listed twice', (() => { const r = full(); r.results.push(r.results[0]); return r; })()],
    ['a page left out', (() => { const r = full(); r.results.splice(1, 1); return r; })()],
  ])('refuses %s', (_, raw) => {
    expect(() => validate(raw, T)).toThrow(/rejected/);
  });

  it('a page that could not be fetched says why, in fixed words', () => {
    const s: string = buildSection(validate(full(), T), T);
    expect(s).toContain('- d: its certificate cannot be verified from GitHub');
  });
});

describe('the section in STATUS.md', () => {
  it('appends once, then replaces in place, leaving the liveness section and notes alone', () => {
    const md = '# Status\n\nnotes\n\n<!-- liveness:start x -->\nL\n<!-- liveness:end -->\n';
    const one = replaceSection(md, `${START}\nfirst\n${END}`);
    const two = replaceSection(one, `${START}\nsecond\n${END}`);
    expect(two).toContain('notes');
    expect(two).toContain('<!-- liveness:start x -->\nL\n<!-- liveness:end -->');
    expect(two.match(/reverify:start/g)).toHaveLength(1);
    expect(extractSection(two)).toBe(`${START}\nsecond\n${END}`);
  });

  it('a start marker with no end stops the run rather than eat what follows', () => {
    expect(() => extractSection(`${START}\nno end`)).toThrow(/no end marker/);
  });

  it('the CLI writes a section from a results file, with words only from the config', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'reverify-'));
    const real = targets.entries.find((t) => t.claims.length)!;
    const results = {
      checkedAt: '2026-12-01T05:00:01.000Z',
      results: [
        ...targets.entries.map((t) => ({ kind: 'entry', id: t.id, status: t.manual ? -1 : 200, missing: t.id === real.id ? [0] : [] })),
        ...targets.crisis.map((t) => ({ kind: 'crisis', id: t.id, status: 200, missing: [] })),
        ...targets.entries.flatMap((t) => Object.keys(t.localUrls).map((lang) => ({ kind: 'local', id: t.id, lang, status: 200 }))),
      ],
    };
    writeFileSync(join(dir, 'r.json'), JSON.stringify(results));
    writeFileSync(join(dir, 'STATUS.md'), '# S\n');
    const { execFileSync } = await import('node:child_process');
    execFileSync('node', [join(__dirname, '../reverify.mjs'), 'write', join(dir, 'r.json'), join(dir, 'STATUS.md')]);
    const md = readFileSync(join(dir, 'STATUS.md'), 'utf8');
    expect(md).toContain('## Directory re-verification, monthly: 2026-12-01');
    expect(md).toContain(real.claims[0]);
  });
});
