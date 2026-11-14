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
  return { status: p.status, text: pageText(p.html ?? '') };
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
  const good = { checkedAt: '2026-12-01T05:00:01.000Z', results: [{ kind: 'entry', id: 'b', status: 200, missing: [0] }] };

  it('passes a real result and drops anything it does not use', () => {
    const extra = { ...good, results: [{ ...good.results[0], note: '<!-- -->' }] };
    expect(validate(extra, T).results).toEqual([{ kind: 'entry', id: 'b', status: 200, missing: [0] }]);
  });

  it.each([
    ['an id not in the config', { ...good, results: [{ kind: 'entry', id: 'zz', status: 200, missing: [] }] }],
    ['a crisis id as an entry', { ...good, results: [{ kind: 'entry', id: 'emergency', status: 200, missing: [] }] }],
    ['a missing index past the claims', { ...good, results: [{ kind: 'entry', id: 'b', status: 200, missing: [5] }] }],
    ['free text as a missing claim', { ...good, results: [{ kind: 'entry', id: 'b', status: 200, missing: ['| injected |'] }] }],
    ['a language the entry has no page in', { ...good, results: [{ kind: 'local', id: 'b', lang: 'sv', status: 200 }] }],
    ['a time that is not a time', { ...good, checkedAt: 'today' }],
  ])('refuses %s', (_, raw) => {
    expect(() => validate(raw, T)).toThrow(/rejected/);
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
    const real = targets.entries[0];
    const results = { checkedAt: '2026-12-01T05:00:01.000Z', results: [{ kind: 'entry', id: real.id, status: 200, missing: real.claims.length ? [0] : [] }] };
    writeFileSync(join(dir, 'r.json'), JSON.stringify(results));
    writeFileSync(join(dir, 'STATUS.md'), '# S\n');
    const { execFileSync } = await import('node:child_process');
    execFileSync('node', [join(__dirname, '../reverify.mjs'), 'write', join(dir, 'r.json'), join(dir, 'STATUS.md')]);
    const md = readFileSync(join(dir, 'STATUS.md'), 'utf8');
    expect(md).toContain('## Directory re-verification, monthly: 2026-12-01');
    if (real.claims.length) expect(md).toContain(real.claims[0]);
  });
});
