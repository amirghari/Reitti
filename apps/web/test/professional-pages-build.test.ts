/**
 * The page build as a program: its flags, the production folder it can recognise,
 * and the folders it owns. Each test runs the real script on invented rows in a
 * temporary directory.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';

const ROOT = fileURLToPath(new URL('../../..', import.meta.url));
const SCRIPT = join(ROOT, 'scripts/build-professional-pages.ts');
const VITE_NODE = join(ROOT, 'node_modules/.bin/vite-node');

const row = (overrides: Record<string, unknown> = {}) => ({
  id: 'fixture-1', slug: 'keksitty-henkilo', type: 'psychologist', name: 'Keksitty Henkilo',
  title: 'Psykologi (keksitty)', languages: ['fi'], city: 'Oulu', region: 'Pohjois-Pohjanmaa', methods: [],
  kela_approved: false, kela_checked_on: '2026-11-06', licence_checked_on: '2026-11-06',
  registered_provider_checked_on: null, business_id: null, website: null, booking_url: null, phone: null,
  email: null, prices: null, waiting_time: null, remote_available: 'unknown', accepting_new_clients: 'unknown',
  sources: [{ source: 'kela', url: 'https://www.kela.fi/hae-palveluntuottajaa', read_on: '2026-11-06', fields: ['city'] }],
  claimed: false, claimed_on: null, status: 'active', stale_since: null, do_not_list: false, do_not_list_on: null,
  sample: true, ...overrides,
});

let dirs: string[] = [];
afterEach(() => {
  for (const dir of dirs) rmSync(dir, { recursive: true, force: true });
  dirs = [];
});

function setup(rows: object[]) {
  const dir = mkdtempSync(join(tmpdir(), 'pages-build-'));
  dirs.push(dir);
  const data = join(dir, 'data');
  mkdirSync(data);
  writeFileSync(join(data, 'professionals.json'), JSON.stringify({ rows }));
  writeFileSync(join(data, 'suppressed.json'), JSON.stringify({ entries: [] }));
  return { dir, data, out: join(dir, 'out') };
}

function build(args: string[]): { code: number; output: string } {
  try {
    const output = execFileSync(VITE_NODE, [SCRIPT, ...args], { cwd: ROOT, encoding: 'utf8', stdio: 'pipe', env: { ...process.env, VERCEL_ENV: '' } });
    return { code: 0, output };
  } catch (error) {
    const e = error as { status: number; stdout: string; stderr: string };
    return { code: e.status, output: `${e.stdout}${e.stderr}` };
  }
}

describe('npm run pages:build', () => {
  it('refuses a misspelt or unknown flag instead of building as a preview', () => {
    const { data, out } = setup([row()]);
    for (const flag of ['--production=true', '--prod', '--Production']) {
      const result = build(['--data', data, '--out', out, flag]);
      expect(result.code, flag).toBe(1);
      expect(result.output, flag).toMatch(/unknown arguments/);
      expect(existsSync(out), flag).toBe(false);
    }
  }, 60_000);

  it('treats a `vercel build --prod` output folder as production, however it was called', () => {
    const { dir, data } = setup([row()]);
    const out = join(dir, '.vercel/output/static');
    mkdirSync(out, { recursive: true });
    writeFileSync(join(dir, '.vercel/output/builds.json'), JSON.stringify({ target: 'production' }));
    const result = build(['--data', data, '--out', out]);
    expect(result.code).toBe(1);
    expect(result.output).toMatch(/not public until Amir says so/);
    expect(existsSync(join(out, 'psykologit'))).toBe(false);
  }, 60_000);

  it('a row removed since the last build leaves no page behind in the same folder', () => {
    const { data, out } = setup([row()]);
    expect(build(['--data', data, '--out', out]).code).toBe(0);
    expect(existsSync(join(out, 'ammattilaiset/keksitty-henkilo/index.html'))).toBe(true);

    writeFileSync(join(data, 'professionals.json'), JSON.stringify({ rows: [row({ do_not_list: true, do_not_list_on: '2026-11-06' })] }));
    expect(build(['--data', data, '--out', out]).code).toBe(0);
    for (const path of ['ammattilaiset', 'sv/yrkespersoner', 'en/professionals']) {
      expect(existsSync(join(out, path, 'keksitty-henkilo')), path).toBe(false);
    }
    expect(readFileSync(join(out, 'psykologit/oulu/index.html'), 'utf8')).not.toContain('Keksitty Henkilo');
  }, 60_000);
});
