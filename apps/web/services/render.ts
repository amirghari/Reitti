/**
 * A page per directory service, as static HTML (Amir, 12.11.2026), built by
 * scripts/build-services.ts into each language's directory folder:
 * /directory/<id>, /fi/palvelut/<id>, /sv/tjanster/<id>.
 *
 * The page says what the service's card says and nothing more: the same
 * strings, the same rules. Who runs it, who it is for, the card's note, the
 * caution where there is one (never without it), cost, hours, who you talk to,
 * anonymity, languages, how you reach it, the link and phone, and the day the
 * details were checked. "Who you talk to" is left out for a website you use
 * alone, as on the card. Same frame as the guides: crisis lines first
 * (invariant 1), no script, no third-party request.
 */
import { languageMismatch, visitLink, type DirectoryEntry } from '@reitti/engine';
import { frame } from '../guides/render.ts';
import { esc, tr, type Lang } from '../pages/frame.ts';
import { formatDate } from '../src/formatDate.ts';
import { jsonLdScript, serviceJsonLd } from '../src/structuredData.ts';
import { servicePath, servicesIndexPath } from './paths.ts';

export { servicePath, servicesIndexPath };

const LANGS: Lang[] = ['en', 'fi', 'sv'];

const operatorOf = (entry: DirectoryEntry, lang: Lang) => (entry.operatorRef ? tr(lang, entry.operatorRef) : entry.operator);

export function servicePage(entry: DirectoryEntry, lang: Lang): string {
  if (entry.fallbackOnly) throw new Error(`[services] ${entry.id} is fallback only and has no page of its own`);
  const name = tr(lang, entry.nameRef);
  const fact = (key: string, value: string) => `<div><dt>${esc(tr(lang, key))}</dt><dd>${value}</dd></div>`;
  const facts = [
    fact('directory.label.operator', esc(operatorOf(entry, lang))),
    fact('directory.label.cost', esc(tr(lang, `cost.band.${entry.costBand}`))),
    fact('directory.label.hours', esc(tr(lang, entry.hoursRef))),
    ...(entry.whoAnswers !== 'not-applicable' ? [fact('directory.label.whoAnswers', esc(tr(lang, `directory.whoAnswers.${entry.whoAnswers}`)))] : []),
    fact('directory.label.anonymity', esc(tr(lang, entry.anonymityRef ?? `directory.anonymity.${entry.anonymity}`))),
    fact(
      'directory.label.languages',
      esc(entry.languagesRef ? tr(lang, entry.languagesRef) : entry.languages.map((l) => tr(lang, `directory.language.${l}`)).join(', ')),
    ),
    fact('directory.label.formats', esc(entry.formats.map((f) => tr(lang, `directory.format.${f}`)).join(', '))),
  ];
  // The card's rule, from the engine: languages not stated warn of no mismatch.
  const visit = visitLink(entry, lang);
  const mismatch = !languageMismatch(entry, lang)
    ? ''
    : `<p class="language-warning">${esc(tr(lang, 'directory.languageMismatch'))} ${esc(entry.languages.map((l) => tr(lang, `directory.language.${l}`)).join(', '))}</p>\n`;
  const phone = entry.phone
    ? ` <a class="service-phone" href="tel:${esc(entry.phone.replace(/\s/g, ''))}">${esc(entry.phone)}</a>`
    : '';
  const body = `<article class="service">
<p class="back"><a href="${servicesIndexPath(lang)}">${esc(tr(lang, 'directory.page.title'))}</a></p>
<h1>${esc(name)}</h1>
<p class="intro">${esc(tr(lang, 'service.lede'))}</p>
${entry.audienceRef ? `<p class="service-audience">${esc(tr(lang, entry.audienceRef))}</p>\n` : ''}${
    entry.costNoteRef ? `<p>${esc(tr(lang, entry.costNoteRef))}</p>\n` : ''
  }${entry.cautionRef ? `<p class="service-caution">${esc(tr(lang, entry.cautionRef))}</p>\n` : ''}${mismatch}<dl class="facts">${facts.join('')}</dl>
${entry.hasConsentCode ? `<p>${esc(tr(lang, 'directory.terapianavigaattori.haveCode'))}</p>\n` : ''}<p class="service-actions"><a href="${esc(visit.href)}" rel="noopener">${esc(
    tr(lang, visit.labelLanguage ? `directory.visitIn.${visit.labelLanguage}` : 'directory.visit'),
  )}</a>${phone}</p>
<p class="checked">${esc(tr(lang, 'directory.verifiedOn'))} <time datetime="${entry.verifiedOn}">${esc(formatDate(entry.verifiedOn, lang))}</time></p>
</article>`;

  const path = servicePath(entry.id, lang);
  const jsonLd = jsonLdScript(
    serviceJsonLd({
      lang,
      path,
      name,
      description: entry.costNoteRef ? tr(lang, entry.costNoteRef) : undefined,
      operator: operatorOf(entry, lang),
      // Not stated at the source: claim no language in the markup either.
      languages: entry.languagesRef ? [] : entry.languages,
      serviceUrl: visit.href,
      phone: entry.phone,
      checkedOn: entry.verifiedOn,
    }),
  );
  return frame({
    lang,
    title: `${name} | ${tr(lang, 'app.name')}`,
    description: tr(lang, 'service.description', { name, date: formatDate(entry.verifiedOn, lang) }),
    path,
    body,
    jsonLd,
    nav: { href: servicesIndexPath(lang), label: tr(lang, 'directory.page.title') },
    alternates: LANGS.map((l) => ({ lang: l, path: servicePath(entry.id, l) })),
  });
}

