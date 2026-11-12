/**
 * scripts/push-status.sh keeps the morning's directory-liveness section on the
 * status branch (Amir, 12.11.2026): a session's own STATUS.md never overwrites
 * it, and when the section cannot be carried, nothing is pushed at all.
 * Runs the real script against a throwaway bare remote.
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
// @ts-expect-error plain JavaScript module, no declarations
import { END, START } from '../liveness-status.mjs';

const ENV = {
  ...process.env,
  GIT_AUTHOR_NAME: 't',
  GIT_AUTHOR_EMAIL: 't@example.invalid',
  GIT_COMMITTER_NAME: 't',
  GIT_COMMITTER_EMAIL: 't@example.invalid',
  GIT_CONFIG_GLOBAL: '/dev/null',
  GIT_CONFIG_NOSYSTEM: '1',
};
const git = (cwd: string, ...args: string[]) => execFileSync('git', args, { cwd, env: ENV, encoding: 'utf8' });

/** A bare remote whose status branch holds `remoteStatus`, and a checkout of main with the scripts. */
function setup(remoteStatus: string) {
  const root = mkdtempSync(join(tmpdir(), 'push-status-'));
  const origin = join(root, 'origin.git');
  const work = join(root, 'work');
  git(root, 'init', '-q', '--bare', origin);
  git(root, 'init', '-q', '-b', 'main', work);
  mkdirSync(join(work, 'scripts'));
  for (const f of ['push-status.sh', 'liveness-status.mjs']) copyFileSync(join(__dirname, '..', f), join(work, 'scripts', f));
  git(work, 'add', '.');
  git(work, 'commit', '-qm', 'init');
  git(work, 'remote', 'add', 'origin', origin);
  git(work, 'push', '-q', 'origin', 'main');
  git(work, 'checkout', '-q', '--orphan', 'st');
  git(work, 'rm', '-rqf', '.');
  writeFileSync(join(work, 'STATUS.md'), remoteStatus);
  git(work, 'add', 'STATUS.md');
  git(work, 'commit', '-qm', 'status');
  git(work, 'push', '-q', 'origin', 'st:status');
  git(work, 'checkout', '-qf', 'main');
  mkdirSync(join(work, 'reports/daily'), { recursive: true });
  writeFileSync(join(work, 'reports/daily/2026-11-12.md'), 'day\n');
  return { work, remote: () => git(work, 'show', 'origin/status:STATUS.md') };
}
const push = (work: string) => spawnSync('bash', ['scripts/push-status.sh'], { cwd: work, env: ENV, encoding: 'utf8' });

const SECTION = `${START}\n## Directory links, daily check: 2026-11-12\n${END}`;

describe('push-status.sh and the liveness section', () => {
  it("pushes the session's STATUS.md with the morning's section kept", () => {
    const { work, remote } = setup(`# old\n\n${SECTION}\n`);
    writeFileSync(join(work, 'STATUS.md'), '# Session\n\nnotes\n');
    const r = push(work);
    expect(r.status).toBe(0);
    git(work, 'fetch', '-q', 'origin', 'status');
    expect(remote()).toBe(`# Session\n\nnotes\n\n${SECTION}\n`);
  });

  it('pushes as before when the status branch has no section', () => {
    const { work, remote } = setup('# old\n');
    writeFileSync(join(work, 'STATUS.md'), '# Session\n');
    expect(push(work).status).toBe(0);
    git(work, 'fetch', '-q', 'origin', 'status');
    expect(remote()).toBe('# Session\n');
  });

  it('pushes nothing when the section cannot be carried', () => {
    const damaged = `# old\n\n${START}\nno end marker\n`;
    const { work, remote } = setup(damaged);
    writeFileSync(join(work, 'STATUS.md'), '# Session\n');
    const r = push(work);
    expect(r.status).not.toBe(0);
    expect(r.stderr).toContain('nothing pushed');
    git(work, 'fetch', '-q', 'origin', 'status');
    expect(remote()).toBe(damaged);
  });
});
