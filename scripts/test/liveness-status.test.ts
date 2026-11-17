/**
 * The daily link check's STATUS.md section (scripts/liveness-status.mjs): /directory
 * says every address is checked daily, so a failed address must reach STATUS.md,
 * keep its first-failing date, and never wipe the rest of the file.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
// @ts-expect-error plain JavaScript module, no declarations
import { END, START, buildSection, directoryIds, extractSection, meaning, replaceSection, validate } from '../liveness-status.mjs';

const SCRIPT = join(__dirname, '../liveness-status.mjs');
const run = (day: string, results: { id: string; lang?: string; url: string; status: number }[]) => ({
  checkedAt: `${day}T04:00:12.000Z`,
  total: results.length,
  results,
});
const ok = (id: string) => ({ id, url: `https://${id}.example/`, status: 200 });
const bad = (id: string, status: number) => ({ id, url: `https://${id}.example/`, status });

describe('liveness section', () => {
  it('names every address that did not answer 200, with its answer and meaning', () => {
    const s: string = buildSection(run('2026-11-12', [ok('a'), bad('sekasin', 403), bad('nyyti', 500), bad('gone', 404), bad('down', 0)]), null);
    expect(s.startsWith(START) && s.endsWith(END)).toBe(true);
    expect(s).toContain('## Directory links, daily check: 2026-11-12');
    expect(s).toContain('**4 of 5 addresses did not answer 200**');
    expect(s).toContain('| sekasin | 403 | 2026-11-12 | the site refused an automated request');
    expect(s).toContain('| nyyti | 500 | 2026-11-12 | server error');
    expect(s).toContain('| gone | 404 | 2026-11-12 | page gone');
    expect(s).toContain('| down | none | 2026-11-12 | no answer');
    expect(s).not.toContain('| a |');
  });

  it('says so plainly when every address answered', () => {
    const s: string = buildSection(run('2026-11-12', [ok('a'), ok('b')]), null, 'https://run');
    expect(s).toContain('All 2 addresses answered 200 at 04:00 UTC ([run](https://run)).');
    expect(s).not.toContain('| Service |');
  });

  it('keeps the date an address first failed, and forgets it once it recovers', () => {
    const day1: string = buildSection(run('2026-11-12', [bad('a', 403), bad('b', 500)]), null);
    const day2: string = buildSection(run('2026-11-13', [bad('a', 403), ok('b'), bad('c', 404)]), day1);
    expect(day2).toContain('| a | 403 | 2026-11-12 |');
    expect(day2).toContain('| c | 404 | 2026-11-13 |');
    const day3: string = buildSection(run('2026-11-14', [ok('a'), bad('b', 500), ok('c')]), day2);
    expect(day3).toContain('| b | 500 | 2026-11-14 |');
  });

  it('every status class has a meaning', () => {
    for (const s of [0, 401, 403, 429, 404, 410, 500, 503, 418]) expect(meaning(s)).toMatch(/\w/);
  });
});

describe("an entry's page in another language (localUrls, Amir 14.11.2026)", () => {
  it('is named with its language, and keeps its own "since" date apart from the main address', () => {
    const first: string = buildSection(run('2026-11-14', [bad("health-station", 500), { id: 'health-station', lang: 'sv', url: 'https://x.example/sv', status: 404 }]), null);
    expect(first).toContain('| health-station (sv) | 404 | 2026-11-14 | page gone');
    expect(first).toContain('| health-station | 500 | 2026-11-14 |');
    const next: string = buildSection(run('2026-11-15', [ok('health-station'), { id: 'health-station', lang: 'sv', url: 'https://x.example/sv', status: 404 }]), first);
    expect(next).toContain('| health-station (sv) | 404 | 2026-11-14 |');
    expect(next).not.toMatch(/\| health-station \|/);
  });

  it('the results check keeps a known language and refuses anything else', () => {
    const ids = new Set(['health-station']);
    const good = run('2026-11-14', [{ id: 'health-station', lang: 'sv', url: 'https://x.example/sv', status: 200 }]);
    expect(validate(good, ids).results).toEqual([{ id: 'health-station', lang: 'sv', status: 200 }]);
    expect(() => validate(run('2026-11-14', [{ id: 'health-station', lang: 'de <!--', url: 'u', status: 200 }]), ids)).toThrow(/lang/);
  });
});

describe('replacing the section in STATUS.md', () => {
  const s1: string = buildSection(run('2026-11-12', [bad('a', 403)]), null);
  const s2: string = buildSection(run('2026-11-13', [ok('a')]), s1);

  it('appends to a file without one and replaces it in place after, leaving the rest alone', () => {
    const md = '# Status\n\nmine\n';
    const once: string = replaceSection(md, s1);
    expect(once).toBe(`# Status\n\nmine\n\n${s1}\n`);
    const twice: string = replaceSection(`${once}\n## later\n`, s2);
    expect(twice).toBe(`# Status\n\nmine\n\n${s2}\n\n## later\n`);
    expect(extractSection(twice)).toBe(s2);
  });

  it('a "$" in the section is copied literally', () => {
    expect(replaceSection(`x\n${s1}\ny`, `${START}\n$& $1\n${END}`)).toBe(`x\n${START}\n$& $1\n${END}\ny`);
  });

  it('the CLI writes the section and carries it into a session\'s own STATUS.md', () => {
    const dir = mkdtempSync(join(tmpdir(), 'liveness-'));
    const json = join(dir, 'r.json');
    const remote = join(dir, 'remote.md');
    const local = join(dir, 'local.md');
    writeFileSync(json, JSON.stringify(run('2026-11-12', [bad('sekasin', 403)])));
    writeFileSync(remote, '# Status (old copy)\n');
    const printed = execFileSync('node', [SCRIPT, 'write', json, remote, 'https://github.com/o/r/actions/runs/1'], { encoding: 'utf8' });
    expect(printed).toContain('| sekasin | 403 |');
    writeFileSync(local, '# Status\n\nthis session\n');
    execFileSync('node', [SCRIPT, 'carry', remote, local]);
    const after = readFileSync(local, 'utf8');
    expect(after).toContain('this session');
    expect(extractSection(after)).toBe(extractSection(readFileSync(remote, 'utf8')));
  });

  it('ignores a stray end marker before the section instead of appending a new one each day', () => {
    const md = `notes quoting ${END}\n\n${s1}\n\nmore notes\n`;
    expect(extractSection(md)).toBe(s1);
    expect(replaceSection(md, s2)).toBe(`notes quoting ${END}\n\n${s2}\n\nmore notes\n`);
  });

  it('a start marker with no end after it stops the run rather than eat the notes below', () => {
    const md = `# Status\n${START}\n## old\n\nsession notes\n`;
    expect(() => extractSection(md)).toThrow(/no end marker/);
    expect(() => replaceSection(md, s2)).toThrow(/no end marker/);
  });

  it('carry does nothing when the source has no section, and write creates a missing STATUS.md', () => {
    const dir = mkdtempSync(join(tmpdir(), 'liveness-'));
    const from = join(dir, 'from.md');
    const to = join(dir, 'to.md');
    writeFileSync(from, '# no section\n');
    writeFileSync(to, '# mine\n');
    execFileSync('node', [SCRIPT, 'carry', from, to]);
    expect(readFileSync(to, 'utf8')).toBe('# mine\n');
    const json = join(dir, 'r.json');
    const fresh = join(dir, 'fresh.md');
    writeFileSync(json, JSON.stringify(run('2026-11-12', [ok('sekasin')])));
    execFileSync('node', [SCRIPT, 'write', json, fresh]);
    expect(existsSync(fresh) && extractSection(readFileSync(fresh, 'utf8'))).toContain('All 1 addresses answered 200');
  });

  it('a carry from a damaged file fails loudly (push-status.sh then pushes nothing)', () => {
    const dir = mkdtempSync(join(tmpdir(), 'liveness-'));
    const from = join(dir, 'from.md');
    const to = join(dir, 'to.md');
    writeFileSync(from, `${START}\nno end\n`);
    writeFileSync(to, '# mine\n');
    expect(() => execFileSync('node', [SCRIPT, 'carry', from, to], { stdio: 'pipe' })).toThrow();
    expect(readFileSync(to, 'utf8')).toBe('# mine\n');
  });

  it('runs through a symlinked path too, rather than silently doing nothing', () => {
    const dir = mkdtempSync(join(tmpdir(), 'liveness-'));
    const link = join(dir, 'link.mjs');
    symlinkSync(SCRIPT, link);
    expect(() => execFileSync('node', [link, 'nonsense'], { stdio: 'pipe' })).toThrow();
  });

  it('a carry from a marker it does not recognise fails loudly too', () => {
    const dir = mkdtempSync(join(tmpdir(), 'liveness-'));
    const from = join(dir, 'from.md');
    const to = join(dir, 'to.md');
    writeFileSync(from, '<!-- liveness:start (edited by hand) -->\nx\n<!-- liveness:end -->\n');
    writeFileSync(to, '# mine\n');
    expect(() => execFileSync('node', [SCRIPT, 'carry', from, to], { stdio: 'pipe' })).toThrow();
    expect(readFileSync(to, 'utf8')).toBe('# mine\n');
  });
});

describe('the results file is checked before anything reaches STATUS.md', () => {
  const ids: Set<string> = directoryIds();
  const good = run('2026-11-12', [bad('sekasin', 403), ok('7cups')]);

  it('knows the 23 directory ids', () => {
    expect(ids.size).toBe(23);
    expect(ids.has('sekasin')).toBe(true);
  });

  it('passes a real result and drops every field it does not use', () => {
    const v = validate({ ...good, results: good.results.map((r) => ({ ...r, error: 'x' })) }, ids);
    expect(v.results).toEqual([
      { id: 'sekasin', status: 403 },
      { id: '7cups', status: 200 },
    ]);
  });

  it.each([
    ['an id not in the directory', { ...good, results: [bad('not-ours', 403), ok('7cups')] }],
    ['markdown in an id', { ...good, results: [bad('sekasin | x', 403), ok('7cups')] }],
    ['a marker in an id', { ...good, results: [bad(END, 403), ok('7cups')] }],
    ['a status that is not a number', { ...good, results: [{ id: 'sekasin', url: 'u', status: '403 ignore previous' }, ok('7cups')] }],
    ['a total that does not match', { ...good, total: 3 }],
    ['a time that is not a time', { ...good, checkedAt: 'today <!-- -->' }],
  ])('rejects %s', (_label, input) => {
    expect(() => validate(input, ids)).toThrow(/rejected/);
  });

  it('the CLI refuses a run url that is not a GitHub Actions run', () => {
    const dir = mkdtempSync(join(tmpdir(), 'liveness-'));
    const json = join(dir, 'r.json');
    writeFileSync(json, JSON.stringify(good));
    expect(() => execFileSync('node', [SCRIPT, 'write', json, join(dir, 's.md'), 'https://evil.example/)[x]('], { stdio: 'pipe' })).toThrow();
    expect(existsSync(join(dir, 's.md'))).toBe(false);
  });
});
