/**
 * Guide pages as static HTML, built by `npm run build` (scripts/build-guides.ts),
 * so a search engine or an AI crawler reads them without running script.
 *
 * Same frame as the directory pages: the crisis lines first (invariant 1), the
 * site's own stylesheet, no script, no third-party request. English first
 * (docs/next-phase.md, Phase C); the chrome strings are `guide.*` in the ui
 * bundles so Finnish and Swedish pages need content, not code.
 */
import { ORIGIN, crisisBand, tr, type Lang } from '../pages/frame.ts';
import type { Block, Guide } from './types.ts';

export const GUIDE_STYLESHEET = '/site-pages.css';
const INDEX_PATH: Record<Lang, string> = { en: '/en/guides', fi: '/fi/oppaat', sv: '/sv/guider' };
export const guidesIndexPath = (lang: Lang = 'en') => INDEX_PATH[lang];
export const guidePath = (slug: string, lang: Lang = 'en') => `${guidesIndexPath(lang)}/${slug}`;

const esc = (text: string): string =>
  text.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

/** "8 November 2026" in English; "8.11.2026" in Finnish and Swedish, as Finnish pages write it. */
export function formatDate(iso: string, lang: Lang = 'en'): string {
  const [y, m, d] = iso.split('-').map(Number);
  if (lang !== 'en') return `${d}.${m}.${y}`;
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(Date.UTC(y, m - 1, d)),
  );
}

/** An address in the app, in the page's language. */
const appPath = (path: string, lang: Lang) => (lang === 'en' ? path : `${path}?lang=${lang}`);
const langOf = (guide: Guide): Lang => guide.lang ?? 'en';

/** Escape, then apply the three inline marks. Order matters: links before refs. */
function inline(text: string, guide: Guide): string {
  const numbers = new Map(guide.sources.map((s, i) => [s.id, i + 1]));
  // A note sits against its word, not after a space.
  return esc(text.replace(/\s+(\[\[)/g, '$1'))
    .replace(/\[\[([a-z0-9-]+)\]\]/g, (_, id: string) => {
      const n = numbers.get(id);
      if (!n) throw new Error(`[guides] ${guide.slug}: unknown source "${id}"`);
      return `<sup class="ref"><a href="#source-${id}" aria-label="Source ${n}">${n}</a></sup>`;
    })
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, label: string, url: string) => {
      const external = url.startsWith('https://');
      return `<a href="${url}"${external ? ' rel="noopener"' : ''}>${label}</a>`;
    })
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
}

function block(b: Block, guide: Guide): string {
  if (typeof b === 'string') return `<p>${inline(b, guide)}</p>`;
  if ('list' in b) return `<ul>${b.list.map((item) => `<li>${inline(item, guide)}</li>`).join('')}</ul>`;
  const head = b.table.head.map((h) => `<th scope="col">${inline(h, guide)}</th>`).join('');
  const rows = b.table.rows
    .map((row) => `<tr>${row.map((cell, i) => (i === 0 ? `<th scope="row">${inline(cell, guide)}</th>` : `<td>${inline(cell, guide)}</td>`)).join('')}</tr>`)
    .join('');
  return `<div class="table-wrap"><table><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table></div>`;
}

function frame({ lang, title, description, path, body, noindex }: { lang: Lang; title: string; description: string; path: string; body: string; noindex?: boolean }): string {
  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">${noindex ? '\n<meta name="robots" content="noindex, nofollow">' : ''}
<link rel="canonical" href="${ORIGIN}${path}">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="${GUIDE_STYLESHEET}">
</head>
<body>
<a class="skip" href="#main">${esc(tr(lang, 'pro.skip'))}</a>
${crisisBand(lang)}
<header class="site-header"><div class="wrap">
<a class="wordmark" href="${appPath('/', lang)}">${esc(tr(lang, 'app.name'))}</a>
<nav aria-label="${esc(tr(lang, 'guide.nav.label'))}"><ul class="lang-switch"><li><a href="${guidesIndexPath(lang)}">${esc(tr(lang, 'guide.nav.all'))}</a></li></ul></nav>
</div></header>
<main id="main" class="wrap guide">
${body}
</main>
<footer class="site-footer"><div class="wrap">
<p>${esc(tr(lang, 'guide.scope'))}</p>
<p><a href="${appPath('/directory', lang)}">${esc(tr(lang, 'pro.freeHelp.link'))}</a> · <a href="${appPath('/privacy', lang)}">${esc(tr(lang, 'footer.privacyLink'))}</a></p>
</div></footer>
</body>
</html>
`;
}

/** The way out of every guide: the questionnaire and the directory (Phase C). */
function nextSteps(lang: Lang): string {
  return `<section class="next-steps" aria-labelledby="next-h">
<h2 id="next-h">${esc(tr(lang, 'guide.cta.heading'))}</h2>
<ul>
<li><a href="${appPath('/', lang)}">${esc(tr(lang, 'guide.cta.questionnaire'))}</a></li>
<li><a href="${appPath('/directory', lang)}">${esc(tr(lang, 'guide.cta.directory'))}</a></li>
</ul>
</section>`;
}

export function guidePage(guide: Guide, { noindex = false }: { noindex?: boolean } = {}): string {
  const lang = langOf(guide);
  const sections = guide.sections
    .map((s, i) => `<section aria-labelledby="s${i}"><h2 id="s${i}">${inline(s.heading, guide)}</h2>\n${s.body.map((b) => block(b, guide)).join('\n')}\n</section>`)
    .join('\n');
  const sources = guide.sources
    .map(
      (s) =>
        `<li id="source-${s.id}"><a href="${esc(s.url)}" rel="noopener">${esc(s.label)}</a>${s.pageDate ? `, ${esc(tr(lang, 'guide.pageDate', { date: formatDate(s.pageDate, lang) }))}` : ''}; ${esc(
          tr(lang, 'guide.checkedOn', { date: formatDate(s.checkedOn, lang) }),
        )}</li>`,
    )
    .join('');
  const body = `<article>
<h1>${esc(guide.title)}</h1>
${guide.intro.map((p) => `<p class="intro">${inline(p, guide)}</p>`).join('\n')}
${sections}
${nextSteps(lang)}
<section class="sources-list" aria-labelledby="sources-h"><h2 id="sources-h">${esc(tr(lang, 'guide.sources.heading'))}</h2>
<ol>${sources}</ol>
<p class="checked">${esc(tr(lang, 'guide.checked', { date: formatDate(guide.checkedOn, lang) }))}</p>
</section>
</article>`;
  return frame({ lang, title: `${guide.title} | ${tr(lang, 'app.name')}`, description: guide.description, path: guidePath(guide.slug, lang), body, noindex });
}

export function guidesIndex(guides: Guide[], lang: Lang = 'en', { noindex = false }: { noindex?: boolean } = {}): string {
  const items = guides
    .map((g) => `<li class="card"><h2 class="card-name"><a href="${guidePath(g.slug, lang)}">${esc(g.title)}</a></h2><p class="card-title">${esc(g.description)}</p></li>`)
    .join('');
  const body = `<h1>${esc(tr(lang, 'guide.index.title'))}</h1>
<p class="intro">${esc(tr(lang, 'guide.index.lede'))}</p>
<ul class="cards">${items}</ul>
${nextSteps(lang)}`;
  return frame({ lang, title: `${tr(lang, 'guide.index.title')} | ${tr(lang, 'app.name')}`, description: tr(lang, 'guide.index.lede'), path: guidesIndexPath(lang), body, noindex });
}

// ---------------------------------------------------------------------------
// The rules a guide is held to (docs/next-phase.md, Phase C)
// ---------------------------------------------------------------------------

const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Every way a guide breaks the rules, as readable lines. Empty means it may ship. */
export function checkGuide(guide: Guide): string[] {
  const out: string[] = [];
  const where = (s: string) => `${guide.slug}: ${s}`;
  if (!/^[a-z0-9-]+$/.test(guide.slug)) out.push(where('slug'));
  if (guide.description.length > 170) out.push(where(`description is ${guide.description.length} characters`));
  if (!DATE.test(guide.checkedOn)) out.push(where('checkedOn is not a date'));

  const texts: string[] = [...guide.intro];
  for (const s of guide.sections) {
    texts.push(s.heading);
    for (const b of s.body) {
      if (typeof b === 'string') texts.push(b);
      else if ('list' in b) texts.push(...b.list);
      else b.table.rows.forEach((row) => texts.push(row.join(' | ')));
    }
  }

  const ids = new Set(guide.sources.map((s) => s.id));
  const used = new Set<string>();
  for (const text of texts) {
    for (const [, id] of text.matchAll(/\[\[([a-z0-9-]+)\]\]/g)) {
      if (!ids.has(id)) out.push(where(`unknown source "${id}"`));
      used.add(id);
    }
    // No number without a source (Phase C): a text with a digit outside its links
    // and references must carry a reference.
    const bare = text.replace(/\[\[[^\]]+\]\]/g, '').replace(/\]\([^)]*\)/g, ']');
    if (/\d/.test(bare) && !/\[\[[a-z0-9-]+\]\]/.test(text)) out.push(where(`a figure without a source: "${text.slice(0, 70)}"`));
    if (/—/.test(text)) out.push(where(`an em dash: "${text.slice(0, 50)}"`));
    for (const [, url] of text.matchAll(/\]\(([^)\s]+)\)/g)) {
      if (!url.startsWith('/') && !url.startsWith('https://')) out.push(where(`link is neither a site path nor https: ${url}`));
    }
  }
  for (const s of guide.sources) {
    if (!used.has(s.id)) out.push(where(`source "${s.id}" is never cited`));
    if (!s.url.startsWith('https://')) out.push(where(`source "${s.id}" is not https`));
    if (!DATE.test(s.checkedOn)) out.push(where(`source "${s.id}" has no check date`));
    if (s.pageDate && !DATE.test(s.pageDate)) out.push(where(`source "${s.id}" pageDate is not a date`));
  }
  return out;
}
