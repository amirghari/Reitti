/**
 * The daily directory link check, written into STATUS.md (Amir, 12.11.2026).
 *
 * /directory says every service's address is checked daily. The check ran, but a
 * failure only reached a green run's log, which nobody reads. This keeps one
 * section of STATUS.md on the `status` branch, between two markers, rewritten by
 * .github/workflows/directory-liveness.yml every morning: which addresses did not
 * answer 200, what that answer usually means, and since when.
 *
 *   node scripts/liveness-status.mjs write <results.json> <STATUS.md> [run url]
 *       rewrite the section from verify-directory's --json output; prints it
 *   node scripts/liveness-status.mjs carry <from STATUS.md> <to STATUS.md>
 *       copy the section across (scripts/push-status.sh, so a session's own
 *       STATUS.md never overwrites the morning's report)
 *
 * Plain JavaScript, no dependencies: push-status.sh runs it with bare node.
 */
import { existsSync, readFileSync, readdirSync, realpathSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const START = '<!-- liveness:start (written daily by .github/workflows/directory-liveness.yml; not edited by hand) -->';
export const END = '<!-- liveness:end -->';
const DATA = /<!-- liveness-data (\{.*?\}) -->/;

/** What a status code usually means for a link check run from GitHub's servers. */
export function meaning(status) {
  if (status === 0) return 'no answer (timed out or the connection failed)';
  if (status === 401 || status === 403 || status === 429)
    return 'the site refused an automated request from GitHub; open it in a browser to check';
  if (status === 404 || status === 410) return 'page gone: the address needs fixing';
  if (status >= 500) return 'server error at their end; check by hand if it lasts';
  return `answered ${status}; check by hand`;
}

/**
 * The section from a STATUS.md, markers included, or null when it has none. The
 * end marker is looked for after the start one, so a stray end marker earlier in
 * the file is ignored; a start marker with no end after it throws, because
 * guessing where the section ends could replace someone's notes.
 */
export function extractSection(md) {
  const a = md.indexOf(START);
  if (a === -1) return null;
  const b = md.indexOf(END, a);
  if (b === -1) throw new Error('STATUS.md has a liveness start marker and no end marker after it; fix the file by hand');
  return md.slice(a, b + END.length);
}

/** STATUS.md with its section replaced, or appended when it has none. */
export function replaceSection(md, section) {
  const old = extractSection(md);
  if (old) return md.replace(old, () => section);
  return `${md.replace(/\s*$/, '')}\n\n${section}\n`;
}

/** The section for one run. `previous` is yesterday's section, for the "since" dates. */
export function buildSection({ checkedAt, total, results }, previous, runUrl) {
  const day = checkedAt.slice(0, 10);
  let before = {};
  const m = previous && previous.match(DATA);
  if (m) {
    try {
      before = JSON.parse(m[1]).failing ?? {};
    } catch {
      before = {};
    }
  }
  const bad = results.filter((r) => r.status !== 200);
  const failing = Object.fromEntries(bad.map((r) => [r.id, { status: r.status, since: before[r.id]?.since ?? day }]));
  const run = runUrl ? ` ([run](${runUrl}))` : '';
  const lines = [
    START,
    `## Directory links, daily check: ${day}`,
    '',
    bad.length === 0
      ? `All ${total} addresses answered 200 at ${checkedAt.slice(11, 16)} UTC${run}.`
      : `**${bad.length} of ${total} addresses did not answer 200** at ${checkedAt.slice(11, 16)} UTC${run}. Not blocking (D-7); each needs a person to look.`,
  ];
  if (bad.length > 0) {
    lines.push('', '| Service | Answer | Failing since | Usually means |', '|---|---|---|---|');
    for (const r of bad) {
      lines.push(`| ${r.id} | ${r.status || 'none'} | ${failing[r.id].since} | ${meaning(r.status)} |`);
    }
  }
  lines.push('', `If this date is not today, the daily check did not run: look at the workflow.`);
  lines.push(`<!-- liveness-data ${JSON.stringify({ day, failing })} -->`, END);
  return lines.join('\n');
}

/** The directory's ids, from the checkout this script sits in. */
export function directoryIds(configDir = join(dirname(fileURLToPath(import.meta.url)), '../config/directory')) {
  return new Set(
    readdirSync(configDir)
      .filter((f) => f.endsWith('.json'))
      .flatMap((f) => JSON.parse(readFileSync(join(configDir, f), 'utf8')).entries ?? [])
      .map((e) => e.id),
  );
}

/**
 * The results file comes from the job that runs npm code, and the section lands in
 * a file other agents read, so nothing free-form passes: every id must be one of
 * the directory's own, the numbers numbers and the time a time. Throws otherwise.
 */
export function validate(results, ids) {
  const bad = (why) => {
    throw new Error(`liveness results rejected: ${why}`);
  };
  if (!results || typeof results !== 'object') bad('not an object');
  const { checkedAt, total, results: list } = results;
  if (typeof checkedAt !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/.test(checkedAt)) bad('checkedAt');
  if (!Number.isInteger(total) || total < 0 || total > 1000) bad('total');
  if (!Array.isArray(list) || list.length !== total) bad('results');
  for (const r of list) {
    if (typeof r?.id !== 'string' || !/^[a-z0-9-]+$/.test(r.id) || !ids.has(r.id)) bad(`id ${JSON.stringify(r?.id)}`);
    if (!Number.isInteger(r.status) || r.status < 0 || r.status > 999) bad(`status for ${r.id}`);
  }
  return { checkedAt, total, results: list.map(({ id, status }) => ({ id, status })) };
}

function main([cmd, a, b, runUrl]) {
  if (cmd === 'write' && a && b) {
    const results = validate(JSON.parse(readFileSync(a, 'utf8')), directoryIds());
    if (runUrl !== undefined && !/^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/actions\/runs\/\d+$/.test(runUrl)) {
      throw new Error('run url rejected');
    }
    const md = existsSync(b) ? readFileSync(b, 'utf8') : '';
    const section = buildSection(results, extractSection(md), runUrl);
    writeFileSync(b, replaceSection(md, section));
    process.stdout.write(`${section}\n`);
    return;
  }
  if (cmd === 'carry' && a && b) {
    const source = existsSync(a) ? readFileSync(a, 'utf8') : '';
    const section = extractSection(source);
    // Something marker-like that is not the marker: stop, so the caller never
    // overwrites a section this script failed to recognise.
    if (!section && source.includes('liveness:start')) throw new Error(`${a} has a liveness marker this script does not recognise`);
    if (section && existsSync(b)) writeFileSync(b, replaceSection(readFileSync(b, 'utf8'), section));
    return;
  }
  console.error('usage: liveness-status.mjs write <results.json> <STATUS.md> [run url] | carry <from> <to>');
  process.exit(2);
}

// Real paths on both sides, so a symlinked path still runs the CLI instead of
// silently doing nothing.
const invoked = process.argv[1] && existsSync(process.argv[1]) ? realpathSync(process.argv[1]) : '';
if (invoked === realpathSync(fileURLToPath(import.meta.url))) main(process.argv.slice(2));
