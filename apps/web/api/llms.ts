/**
 * `GET /llms.txt`, on mielenreitti.fi only.
 *
 * What a language model should know before it describes this site to somebody:
 * what it is, that it does not diagnose, who to call, and where to read more.
 * Assembled from the same config the site renders, so it can make no claim the
 * site does not already make, and a crisis number here is the number in
 * `config/crisis.json`, never one typed into this file.
 *
 * No health data. There is none on the server to include.
 */
import crisis from '../../../config/crisis.json' with { type: 'json' };
import clinicalEn from '../../../config/i18n/clinical/en.json' with { type: 'json' };
import uiEn from '../../../config/i18n/ui/en.json' with { type: 'json' };
import uiFi from '../../../config/i18n/ui/fi.json' with { type: 'json' };
import uiSv from '../../../config/i18n/ui/sv.json' with { type: 'json' };
import { GUIDES_PUBLISHED } from '../guides/index.js';
import type { GuideLang } from '../guides/paths.js';
import { publishedGuidePages } from '../guides/published.js';
import { publishedServicePages } from '../services/published.js';
import { formatHours, type HoursWindow } from '../src/crisisHours.js';
import { answerOnProductionOnly, type NodeRequest, type NodeResponse } from './robots.js';
import { PARTNER_PATH, PARTNER_TITLE } from '../partners/paths.js';

const ORIGIN = 'https://mielenreitti.fi';
const copy = { ...(uiEn as Record<string, unknown>), ...(clinicalEn as Record<string, unknown>) };

const t = (ref: string): string => {
  const value = copy[ref];
  if (typeof value !== 'string') throw new Error(`llms.txt: no English copy for ${ref}`);
  return value;
};

interface Resource {
  id: string;
  nameRef: string;
  phone: string;
  languages: string[];
  availability: string;
  languageNoteRef?: string;
  hours?: HoursWindow[];
}

/** English first, as the crisis panel sorts for an English reader: 112 leads (D-21). */
const lines = [...(crisis.resources as Resource[])].sort(
  (a, b) => Number(b.languages.includes('en')) - Number(a.languages.includes('en')),
);

/** "All guides" in the guides' own language, as the guide pages label their index link. */
const ALL_GUIDES: Record<GuideLang, unknown> = {
  en: (uiEn as Record<string, unknown>)['guide.nav.all'],
  fi: (uiFi as Record<string, unknown>)['guide.nav.all'],
  sv: (uiSv as Record<string, unknown>)['guide.nav.all'],
};

/**
 * The published guides (guides/published.ts), each by its own title, then each
 * language's index. Nothing for a language whose guides are still drafts.
 */
function guideLines(published: Record<GuideLang, boolean>): string[] {
  const pages = publishedGuidePages(published);
  if (!pages.length) return [];
  const lines = pages.map((p) => {
    const label = p.title ?? ALL_GUIDES[p.lang];
    if (typeof label !== 'string') throw new Error(`llms.txt: no label for ${p.path}`);
    return `- [${label}](${ORIGIN}${p.path})`;
  });
  return [`## ${t('guide.nav.label')}`, '', ...lines, ''];
}

/**
 * A page per directory service, in English, each by the name its card shows
 * (services/published.ts). The Finnish and Swedish pages are in sitemap.xml.
 */
function serviceLines(): string[] {
  const pages = publishedServicePages().filter((p) => p.lang === 'en');
  return [`## ${t('directory.page.title')}`, '', ...pages.map((p) => `- [${p.title}](${ORIGIN}${p.path})`), ''];
}

export function llms(published: Record<GuideLang, boolean> = GUIDES_PUBLISHED): string {
  const crisisLines = lines.map((r) => {
    const hours =
      r.availability === '24/7' ? t('crisis.aroundTheClock') : r.hours ? formatHours(r.hours, 'en') : t('crisis.limitedHours');
    const note = r.languageNoteRef && !r.languages.includes('en') ? ` ${t(r.languageNoteRef)}` : '';
    return `- ${t(r.nameRef)}: ${r.phone}. ${hours}.${note}`;
  });

  return [
    `# ${t('app.name')}`,
    '',
    `> ${t('app.tagline')}`,
    '',
    `${t('home.fact.what')} ${t('home.fact.cost')} ${t('home.fact.next')}`,
    '',
    `${t('footer.scope.1')} ${t('footer.scope.2')}`,
    '',
    t('home.trust.reviewer'),
    '',
    `## ${t('home.crisisStrip.title')}`,
    '',
    ...crisisLines,
    '',
    t('crisis.ifClosed'),
    '',
    '## Read more',
    '',
    // Titles only. A description written here would be the one sentence in this
    // file the site does not itself say.
    `- [${t('howItWorks.navLabel')}](${ORIGIN}/?page=how-it-decides)`,
    `- [${t('home.whyBuilt')}](${ORIGIN}/why)`,
    `- [${t('directory.page.title')}](${ORIGIN}/directory)`,
    `- [${t('ladder.pyramid.title')}](${ORIGIN}/#services)`,
    `- [${t('home.free.title')}](${ORIGIN}/#free-now)`,
    `- [${PARTNER_TITLE}](${ORIGIN}${PARTNER_PATH})`,
    '',
    ...guideLines(published),
    ...serviceLines(),
    `Also in Finnish (${ORIGIN}/fi) and Swedish (${ORIGIN}/sv).`,
    '',
  ].join('\n');
}

export default function handler(req: NodeRequest, res: NodeResponse): void {
  answerOnProductionOnly(req, res, 'text/plain; charset=utf-8', () => llms());
}
