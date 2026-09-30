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
import { formatHours, type HoursWindow } from '../src/crisisHours.js';
import { answerOnProductionOnly, type NodeRequest, type NodeResponse } from './robots.js';

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

export function llms(): string {
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
    `${t('home.lede')} ${t('footer.scope.1')} ${t('footer.scope.2')}`,
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
    `- [${t('ladder.pyramid.title')}](${ORIGIN}/#services)`,
    `- [${t('home.free.title')}](${ORIGIN}/#free-now)`,
    '',
    `Also in Finnish (${ORIGIN}/?lang=fi) and Swedish (${ORIGIN}/?lang=sv).`,
    '',
  ].join('\n');
}

export default function handler(req: NodeRequest, res: NodeResponse): void {
  answerOnProductionOnly(req, res, 'text/plain; charset=utf-8', llms);
}
