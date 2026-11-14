/**
 * The monthly re-verification (Amir, 14.11.2026, on the proposal of 13.11).
 *
 * The daily check (liveness-status.mjs) knows whether an address answers. It
 * cannot know whether the page still says what the card says. Each directory
 * entry carries `claims`: exact phrases from its source page that its card rests
 * on. Once a month this fetches every page and reports, in STATUS.md on the
 * status branch, which entries still hold, which changed (a phrase is gone, so a
 * person re-reads the page), and which cannot be checked from GitHub (a site that
 * refuses GitHub's servers, or a script-only site with `claimsManual`). It also
 * lists every entry checked more than 40 days ago.
 *
 * It re-dates nothing. A phrase still being on a page is not a person having read
 * it, and only a reading re-dates an entry (the rule of the 12.11 pass). The
 * crisis lines' sources (config/crisis-source-claims.json) are reported the same
 * way and nothing more: a crisis line changes only with the written confirmation
 * invariant 3 requires.
 *
 *   node scripts/reverify.mjs check <results.json>                fetch and check (no npm, no secrets)
 *   node scripts/reverify.mjs write <results.json> <STATUS.md> [run url]
 *   node scripts/reverify.mjs carry <from STATUS.md> <to STATUS.md>  (scripts/push-status.sh)
 */
import { existsSync, readFileSync, readdirSync, realpathSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const CONFIG = join(dirname(fileURLToPath(import.meta.url)), '../config');
export const START = '<!-- reverify:start (written monthly by .github/workflows/directory-reverify.yml; not edited by hand) -->';
export const END = '<!-- reverify:end -->';
export const STALE_DAYS = 40;
const LANGS = ['en', 'fi', 'sv'];

// ---------------------------------------------------------------- the config

/** Directory entries and crisis sources, as the job checks them. */
export function loadTargets(config = CONFIG) {
  const entries = readdirSync(join(config, 'directory'))
    .filter((f) => f.endsWith('.json'))
    .flatMap((f) => JSON.parse(readFileSync(join(config, 'directory', f), 'utf8')).entries ?? []);
  const crisis = JSON.parse(readFileSync(join(config, 'crisis.json'), 'utf8')).resources;
  const crisisClaims = JSON.parse(readFileSync(join(config, 'crisis-source-claims.json'), 'utf8')).claims;
  return {
    entries: entries.map((e) => ({
      id: e.id,
      // The page the claims were read on: the entry's own unless it names another
      // (Klubitalot's card rests on "Mikä on Klubitalo?", not the map it links).
      url: e.claimsUrl ?? e.url,
      localUrls: e.localUrls ?? {},
      claims: e.claims ?? [],
      manual: e.claimsManual ?? null,
      verifiedOn: e.verifiedOn,
    })),
    crisis: crisis
      .filter((r) => r.sourceUrl)
      .map((r) => ({ id: r.id, url: r.sourceUrl, claims: crisisClaims[r.id] ?? [] })),
  };
}

// ------------------------------------------------------------ reading a page

/**
 * A page's text as the job compares it: script contents kept (a Next.js page
 * carries its text in a JSON blob), JSON and HTML escapes decoded, inline tags
 * dropped and other tags read as a space, then the same folding as `fold`.
 */
export function pageText(raw) {
  const decoded = raw
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/\\"/g, '"')
    .replace(/\\\//g, '/')
    .replace(/\\n/g, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    // Inline tags sit inside words ("<b>16–67</b>-vuotias"); every other tag is a break.
    .replace(/<\/?(?:a|b|strong|em|i|span|abbr|small|sup|sub|mark|u)\b[^>]*>/gi, '')
    .replace(/<[^>]+>/g, ' ');
  return fold(decodeEntities(decoded));
}

const NAMED = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', ndash: '–', mdash: '—', shy: '', hellip: '…',
  rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“', auml: 'ä', ouml: 'ö', aring: 'å', Auml: 'Ä', Ouml: 'Ö', Aring: 'Å', eacute: 'é',
};
function decodeEntities(s) {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
    if (e[0] === '#') return String.fromCodePoint(e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10));
    return NAMED[e] ?? NAMED[e.toLowerCase()] ?? m;
  });
}

/** Case, dash, quote and space differences are not changes in what a page says. */
export function fold(s) {
  return s
    .normalize('NFKC')
    .replace(/\u00ad/g, '')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/[\u2010-\u2015\u2212]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/** Indexes of the claims the page no longer carries. */
export function missingClaims(text, claims) {
  return claims.flatMap((c, i) => (text.includes(fold(c)) ? [] : [i]));
}

// ------------------------------------------------------------------ checking

async function fetchPage(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20_000);
  try {
    // The same honest request as the daily check: who is asking, never a browser.
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'user-agent': 'Mielenreitti-reverify/1.0 (+https://mielenreitti.fi/about)',
        accept: 'text/html,*/*;q=0.8',
        'accept-language': 'fi,sv;q=0.9,en;q=0.8',
      },
    });
    return { status: res.status, text: res.status === 200 ? pageText(await res.text()) : '' };
  } catch (err) {
    return { status: 0, reason: reasonOf(err), text: '' };
  } finally {
    clearTimeout(timer);
  }
}

/** Why a page gave no answer, as one of a fixed set: nothing free-form travels. */
export const REASONS = ['certificate', 'timeout', 'dns', 'refused', 'other'];
export function reasonOf(err) {
  // An abort is a DOMException named AbortError whose numeric code says nothing.
  if (/Abort|Timeout/i.test(String(err?.name ?? ''))) return 'timeout';
  const code = String(err?.cause?.code ?? err?.code ?? err?.name ?? '');
  if (/CERT|SELF_SIGNED|ISSUER|TLS|SSL/i.test(code)) return 'certificate';
  if (/TIMEDOUT/i.test(code)) return 'timeout';
  if (/ENOTFOUND|EAI_AGAIN/.test(code)) return 'dns';
  if (/ECONNREFUSED|ECONNRESET/.test(code)) return 'refused';
  return 'other';
}
const REASON_TEXT = {
  certificate: 'its certificate cannot be verified from GitHub',
  timeout: 'no answer within 20 seconds',
  dns: 'the name did not resolve',
  refused: 'the connection was refused',
  other: 'no answer',
};

/** At most four pages at a time: several entries share mieli.fi and nyyti.fi. */
async function pool(tasks, size = 4) {
  const out = new Array(tasks.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(size, tasks.length) }, async () => {
      while (next < tasks.length) {
        const i = next++;
        out[i] = await tasks[i]();
      }
    }),
  );
  return out;
}

export async function check(targets, fetcher = fetchPage) {
  const one = (kind, t) => async () => {
    if (kind === 'entry' && t.manual) return { kind, id: t.id, status: -1, missing: [] };
    const page = await fetcher(t.url);
    return {
      kind,
      id: t.id,
      status: page.status,
      ...(page.status === 0 ? { reason: page.reason ?? 'other' } : {}),
      missing: page.status === 200 ? missingClaims(page.text, t.claims) : [],
    };
  };
  // Other-language pages: whether they answer, as the daily check does; their
  // claims are the main page's, read by a person when that one is flagged.
  const local = (t, lang, url) => async () => ({ kind: 'local', id: t.id, lang, status: (await fetcher(url)).status });
  const results = await pool([
    ...targets.entries.map((t) => one('entry', t)),
    ...targets.crisis.map((t) => one('crisis', t)),
    ...targets.entries.flatMap((t) => Object.entries(t.localUrls).map(([lang, url]) => local(t, lang, url))),
  ]);
  return { checkedAt: new Date().toISOString(), results };
}

// ------------------------------------------------- what reaches STATUS.md

/**
 * The results come from the job that fetched other people's pages, and the
 * section lands in a file other agents read, so nothing free-form passes: ids
 * must be the config's own, statuses numbers, missing claims indexes into the
 * config's own claims. Every word in the section comes from this checkout.
 */
export function validate(raw, targets) {
  const bad = (why) => {
    throw new Error(`reverify results rejected: ${why}`);
  };
  if (!raw || typeof raw !== 'object') bad('not an object');
  const { checkedAt, results } = raw;
  if (typeof checkedAt !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/.test(checkedAt)) bad('checkedAt');
  if (!Array.isArray(results) || results.length > 1000) bad('results');
  const entries = new Map(targets.entries.map((t) => [t.id, t]));
  const crisis = new Map(targets.crisis.map((t) => [t.id, t]));
  const clean = results.map((r) => {
    const pool = r?.kind === 'crisis' ? crisis : r?.kind === 'entry' || r?.kind === 'local' ? entries : null;
    if (!pool || typeof r.id !== 'string' || !pool.has(r.id)) bad(`id ${JSON.stringify(r?.id)}`);
    if (!Number.isInteger(r.status) || r.status < -1 || r.status > 999) bad(`status for ${r.id}`);
    // -1 means "not fetched, a person reads it": only for an entry that says why.
    if (r.status === -1 && !(r.kind === 'entry' && pool.get(r.id).manual)) bad(`status -1 for ${r.id}`);
    if (r.kind === 'entry' && pool.get(r.id).manual && r.status !== -1) bad(`a fetched result for manual ${r.id}`);
    if (r.kind === 'local') {
      if (!LANGS.includes(r.lang) || !(r.lang in pool.get(r.id).localUrls)) bad(`lang for ${r.id}`);
      return { kind: r.kind, id: r.id, lang: r.lang, status: r.status };
    }
    const reason = r.status === 0 ? (REASONS.includes(r.reason) ? r.reason : bad(`reason for ${r.id}`)) : undefined;
    const n = pool.get(r.id).claims.length;
    if (!Array.isArray(r.missing) || r.missing.some((i) => !Number.isInteger(i) || i < 0 || i >= n)) bad(`missing for ${r.id}`);
    return { kind: r.kind, id: r.id, status: r.status, ...(reason ? { reason } : {}), missing: [...new Set(r.missing)].sort((a, b) => a - b) };
  });
  // Every page exactly once: a missing entry must not quietly drop out of the counts.
  const keys = clean.map((r) => `${r.kind}:${r.id}${r.lang ? `:${r.lang}` : ''}`);
  const want = [
    ...targets.entries.map((t) => `entry:${t.id}`),
    ...targets.crisis.map((t) => `crisis:${t.id}`),
    ...targets.entries.flatMap((t) => Object.keys(t.localUrls).map((l) => `local:${t.id}:${l}`)),
  ];
  if (new Set(keys).size !== keys.length) bad('a page listed twice');
  const missingPages = want.filter((k) => !keys.includes(k));
  if (missingPages.length || keys.length !== want.length) bad(`pages missing: ${missingPages.slice(0, 3).join(', ')}`);
  return { checkedAt, results: clean };
}

const cell = (s) => String(s).replace(/\|/g, '\\|').replace(/[\r\n]+/g, ' ');
const daysBetween = (a, b) => Math.floor((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000);

/** The STATUS.md section for one run. */
export function buildSection({ checkedAt, results }, targets, runUrl) {
  const day = checkedAt.slice(0, 10);
  const entries = new Map(targets.entries.map((t) => [t.id, t]));
  const crisis = new Map(targets.crisis.map((t) => [t.id, t]));
  const of = (kind) => results.filter((r) => r.kind === kind);
  const changed = of('entry').filter((r) => r.status === 200 && r.missing.length > 0);
  const holds = of('entry').filter((r) => r.status === 200 && r.missing.length === 0);
  const unchecked = of('entry').filter((r) => r.status !== 200);
  const localDown = of('local').filter((r) => r.status !== 200);
  const stale = targets.entries
    .filter((t) => daysBetween(t.verifiedOn, day) > STALE_DAYS)
    .sort((a, b) => a.verifiedOn.localeCompare(b.verifiedOn));
  const run = runUrl ? ` ([run](${runUrl}))` : '';

  const lines = [
    START,
    `## Directory re-verification, monthly: ${day}`,
    '',
    `Checked at ${checkedAt.slice(11, 16)} UTC${run}: ${changed.length} changed, ${unchecked.length} to read by hand, ${holds.length} hold. ` +
      'Nothing is re-dated by this job: a person re-reads each flagged page, updates the entry and re-dates it.',
    '',
    `### Changed: re-read these (${changed.length})`,
  ];
  if (changed.length === 0) lines.push('', 'None.');
  else {
    lines.push('', '| Service | Page | Phrase no longer on the page |', '|---|---|---|');
    for (const r of changed) {
      const t = entries.get(r.id);
      for (const i of r.missing) lines.push(`| ${r.id} | ${cell(t.url)} | ${cell(t.claims[i])} |`);
    }
  }
  lines.push('', `### Read by hand (${unchecked.length + localDown.length})`);
  if (unchecked.length + localDown.length === 0) lines.push('', 'None.');
  else {
    lines.push('');
    for (const r of unchecked) {
      const t = entries.get(r.id);
      lines.push(
        r.status === -1
          ? `- ${r.id}: ${cell(t.manual)}`
          : r.status === 0
            ? `- ${r.id}: ${REASON_TEXT[r.reason]}, ${cell(t.url)}`
            : `- ${r.id}: answered ${r.status} (${r.status === 403 ? 'refuses GitHub\'s servers; read it from a normal connection' : 'look at the page'}), ${cell(t.url)}`,
      );
    }
    for (const r of localDown) lines.push(`- ${r.id} (${r.lang}): its ${r.lang} page answered ${r.status || 'nothing'}, ${cell(entries.get(r.id).localUrls[r.lang])}`);
  }
  lines.push('', `### Hold (${holds.length})`, '', holds.length ? holds.map((r) => r.id).join(', ') : 'None.');
  lines.push('', '### Crisis-line sources (report only: a crisis line changes only with written confirmation, invariant 3)', '');
  for (const r of of('crisis')) {
    const t = crisis.get(r.id);
    const state =
      r.status !== 200
        ? `${r.status === 0 ? REASON_TEXT[r.reason] : `answered ${r.status}`}, read it by hand`
        : r.missing.length
          ? `CHANGED, no longer says: ${r.missing.map((i) => `"${cell(t.claims[i])}"`).join('; ')}`
          : 'holds';
    lines.push(`- ${r.id}: ${state} (${cell(t.url)})`);
  }
  lines.push('', `### Checked more than ${STALE_DAYS} days ago (${stale.length})`, '');
  lines.push(stale.length ? stale.map((t) => `${t.id} (${t.verifiedOn})`).join(', ') : 'None.');
  lines.push('', 'If this month is not the current one, the monthly job did not run: look at the workflow.', END);
  return lines.join('\n');
}

// ------------------------------------------------------- the STATUS.md section

/** The section, or null. The end marker is looked for after the start only. */
export function extractSection(md) {
  const a = md.indexOf(START);
  if (a === -1) return null;
  const b = md.indexOf(END, a);
  if (b === -1) throw new Error('STATUS.md has a reverify start marker and no end marker after it; fix the file by hand');
  return md.slice(a, b + END.length);
}

/** STATUS.md with its section replaced, or appended when it has none. */
export function replaceSection(md, section) {
  const old = extractSection(md);
  if (old) return md.replace(old, () => section);
  return `${md.replace(/\s*$/, '')}\n\n${section}\n`;
}

// ------------------------------------------------------------------- the CLI

async function main([cmd, a, b, runUrl]) {
  if (cmd === 'check' && a) {
    const out = await check(loadTargets());
    writeFileSync(a, JSON.stringify(out, null, 2));
    const flagged = out.results.filter((r) => r.status !== 200 || r.missing?.length);
    console.log(`reverify: ${out.results.length} pages, ${flagged.length} flagged`);
    return;
  }
  if (cmd === 'write' && a && b) {
    const targets = loadTargets();
    const results = validate(JSON.parse(readFileSync(a, 'utf8')), targets);
    if (runUrl !== undefined && !/^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/actions\/runs\/\d+$/.test(runUrl)) throw new Error('run url rejected');
    const md = existsSync(b) ? readFileSync(b, 'utf8') : '';
    const section = buildSection(results, targets, runUrl);
    writeFileSync(b, replaceSection(md, section));
    process.stdout.write(`${section}\n`);
    return;
  }
  if (cmd === 'carry' && a && b) {
    const source = existsSync(a) ? readFileSync(a, 'utf8') : '';
    const section = extractSection(source);
    if (!section && source.includes('reverify:start')) throw new Error(`${a} has a reverify marker this script does not recognise`);
    if (section && existsSync(b)) writeFileSync(b, replaceSection(readFileSync(b, 'utf8'), section));
    return;
  }
  console.error('usage: reverify.mjs check <results.json> | write <results.json> <STATUS.md> [run url] | carry <from> <to>');
  process.exit(2);
}

const invoked = process.argv[1] && existsSync(process.argv[1]) ? realpathSync(process.argv[1]) : '';
if (invoked === realpathSync(fileURLToPath(import.meta.url))) await main(process.argv.slice(2));
