/**
 * The professional page and the city pages, as static HTML (D-39).
 *
 * Pure: rows in, `{ path, html }` out. No script runs on these pages; the crisis
 * lines are printed at the top of every one (invariant 1), from
 * `config/crisis.json` through the same ordering the app uses.
 *
 * Every page carries `noindex` while the gate in `data.ts` is shut, and none is
 * in the sitemap. A sample row is stamped "Sample, not a real professional" in
 * its title, its first line and its structured data.
 */
import crisis from '../../../config/crisis.json' with { type: 'json' };
import ladder from '../../../config/ladder/ladder.json' with { type: 'json' };
import uiEn from '../../../config/i18n/ui/en.json' with { type: 'json' };
import uiFi from '../../../config/i18n/ui/fi.json' with { type: 'json' };
import uiSv from '../../../config/i18n/ui/sv.json' with { type: 'json' };
import clinicalEn from '../../../config/i18n/clinical/en.json' with { type: 'json' };
import clinicalFi from '../../../config/i18n/clinical/fi.json' with { type: 'json' };
import clinicalSv from '../../../config/i18n/clinical/sv.json' with { type: 'json' };
import { formatHours, type HoursWindow } from '../src/crisisHours.ts';
import {
  CITIES,
  CONTACT_ADDRESS,
  DATA_CONTROLLER,
  TRANSFERS_CONFIRMED,
  PUBLIC_PAGES_APPROVED,
  cityOf,
  ladderSteps,
  listed,
  type City,
  type Professional,
  type ProfessionalType,
  type TriState,
} from './data.ts';

export type Lang = 'fi' | 'sv' | 'en';
export const LANGS: Lang[] = ['fi', 'sv', 'en'];

export const ORIGIN = 'https://mielenreitti.fi';
export const STYLESHEET = '/pro-pages/pages.css';

const flatten = (...parts: Record<string, unknown>[]): Record<string, string> =>
  Object.fromEntries(
    parts.flatMap((part) => Object.entries(part).filter(([k, v]) => !k.startsWith('_') && typeof v === 'string')),
  ) as Record<string, string>;

const BUNDLES: Record<Lang, Record<string, string>> = {
  en: flatten(uiEn, clinicalEn),
  fi: flatten(uiFi, clinicalFi),
  sv: flatten(uiSv, clinicalSv),
};

/** A missing string fails the build: a page never ships a raw key. */
export function tr(lang: Lang, key: string, vars: Record<string, string | number> = {}): string {
  const value = BUNDLES[lang][key];
  if (value === undefined) throw new Error(`[pages] no "${key}" in ${lang}`);
  return value.replace(/\{(\w+)\}/g, (_, name: string) => {
    if (!(name in vars)) throw new Error(`[pages] "${key}" in ${lang} needs {${name}}`);
    return String(vars[name]);
  });
}

/** A string with its {placeholders} left in, for a script on the page to fill. */
function template(lang: Lang, key: string): string {
  const value = BUNDLES[lang][key];
  if (value === undefined) throw new Error(`[pages] no "${key}" in ${lang}`);
  return value;
}

const esc = (text: string): string =>
  text.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

// ---------------------------------------------------------------------------
// Addresses. The slug is the same in every language; the folder is not.
// ---------------------------------------------------------------------------

const FOLDERS = {
  profile: { fi: '/ammattilaiset/', sv: '/sv/yrkespersoner/', en: '/en/professionals/' },
  psychotherapist: { fi: '/psykoterapeutit/', sv: '/sv/psykoterapeuter/', en: '/en/psychotherapists/' },
  psychologist: { fi: '/psykologit/', sv: '/sv/psykologer/', en: '/en/psychologists/' },
  // The page's own folder, not all of /tietosuoja/: a privacy page for the
  // whole site may live there later, and the build clears what it owns.
  privacy: { fi: '/tietosuoja/ammattilaiset/', sv: '/sv/dataskydd/yrkespersoner/', en: '/en/privacy/professionals/' },
} as const;

/** The directory's privacy page. */
export const privacyPath = (lang: Lang) => FOLDERS.privacy[lang].slice(0, -1);

/** Every folder the page build writes, and so may clear. Nothing else of the app lives in them. */
export const OWNED_FOLDERS: string[] = [
  ...Object.values(FOLDERS).flatMap((byLang) => Object.values(byLang)),
  STYLESHEET.slice(0, STYLESHEET.lastIndexOf('/') + 1),
];

export const profilePath = (lang: Lang, slug: string) => `${FOLDERS.profile[lang]}${slug}`;
export const cityPath = (lang: Lang, type: ProfessionalType, city: string) => `${FOLDERS[type][lang]}${city}`;
const appPath = (lang: Lang, path = '/') => (lang === 'en' ? path : `${path}?lang=${lang}`);

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

export function formatDate(iso: string, lang: Lang): string {
  const [y, m, d] = iso.split('-').map(Number);
  if (lang === 'en') {
    return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
      new Date(Date.UTC(y, m - 1, d)),
    );
  }
  return `${d}.${m}.${y}`;
}

/** Language names from Intl, as crisisHours does day names: nothing to keep in sync. */
function languageName(code: string, lang: Lang): string {
  const name = new Intl.DisplayNames([lang], { type: 'language' }).of(code) ?? code;
  return lang === 'en' ? name : name.toLocaleLowerCase(lang);
}

const tri = (lang: Lang, value: TriState) => tr(lang, `pro.tri.${value}`);

/**
 * Free text exactly as a Finnish register gives it (a title, methods, a waiting
 * time, a price note). It stays in Finnish on every page and says so, so a
 * screen reader on the Swedish or English page does not read it with the wrong
 * pronunciation (WCAG 3.1.2).
 */
const sourceText = (text: string, lang: Lang) => (lang === 'fi' ? esc(text) : `<span lang="fi">${esc(text)}</span>`);

// ---------------------------------------------------------------------------
// The frame every page shares
// ---------------------------------------------------------------------------

type Resource = (typeof crisis.resources)[number] & { hours?: HoursWindow[]; languageNoteRef?: string };

function crisisBand(lang: Lang): string {
  const lines = ([...crisis.resources] as Resource[]).sort(
    (a, b) => Number(b.languages.includes(lang)) - Number(a.languages.includes(lang)),
  );
  const items = lines
    .map((r) => {
      const hours =
        r.availability === '24/7'
          ? tr(lang, 'crisis.aroundTheClock')
          : r.hours
            ? formatHours(r.hours, lang)
            : tr(lang, 'crisis.limitedHours');
      const note = r.languageNoteRef && !r.languages.includes(lang) ? ` <span class="crisis-note">${esc(tr(lang, r.languageNoteRef))}</span>` : '';
      return `<li><a class="crisis-call" href="tel:${r.phone.replace(/\s/g, '')}"><span class="crisis-name">${esc(
        tr(lang, `crisis.${r.id}.name`),
      )}</span> <span class="crisis-phone">${esc(r.phone)}</span></a> <span class="crisis-hours">${esc(hours)}${note ? '.' : ''}</span>${note}</li>`;
    })
    .join('');
  return `<aside class="crisis-band" aria-labelledby="crisis-title">
<div class="wrap">
<h2 id="crisis-title" class="crisis-title">${esc(tr(lang, 'home.crisisStrip.title'))}</h2>
<ul class="crisis-lines">${items}</ul>
<p class="crisis-foot">${esc(tr(lang, 'crisis.ifClosed'))}</p>
</div>
</aside>`;
}

interface Frame {
  lang: Lang;
  title: string;
  description: string;
  /** The same page in each language. */
  paths: Record<Lang, string>;
  body: string;
  jsonLd?: object;
  /** No canonical, no alternates, and noindex whatever the gate: a page that is not an address of its own, like the 410. */
  unlisted?: boolean;
  /** A script of this site's own, deferred. Only the city pages have one. */
  script?: string;
}

function page({ lang, title, description, paths, body, jsonLd, unlisted, script }: Frame): string {
  const alternates = unlisted
    ? ''
    : [`<link rel="canonical" href="${ORIGIN}${paths[lang]}">`, ...LANGS.map((l) => `<link rel="alternate" hreflang="${l}" href="${ORIGIN}${paths[l]}">`)].join('\n');
  const switcher = LANGS.map((l) =>
    l === lang
      ? `<li><a href="${paths[l]}" lang="${l}" hreflang="${l}" aria-current="page">${esc(tr(l, 'pro.languageName'))}</a></li>`
      : `<li><a href="${paths[l]}" lang="${l}" hreflang="${l}">${esc(tr(l, 'pro.languageName'))}</a></li>`,
  ).join('');
  const ld = jsonLd ? `\n<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>` : '';
  // Shut gate, shut index. Lifting the gate is a reviewed edit to data.ts.
  const robots = PUBLIC_PAGES_APPROVED && !unlisted ? '' : '\n<meta name="robots" content="noindex, nofollow">';
  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">${robots}
${alternates}
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="${STYLESHEET}">${ld}${script ? `\n<script src="${script}" defer></script>` : ''}
</head>
<body>
<a class="skip" href="#main">${esc(tr(lang, 'pro.skip'))}</a>
${crisisBand(lang)}
<header class="site-header"><div class="wrap">
<a class="wordmark" href="${appPath(lang)}">${esc(tr(lang, 'app.name'))}</a>
<nav aria-label="${esc(tr(lang, 'app.languageLabel'))}"><ul class="lang-switch">${switcher}</ul></nav>
</div></header>
<main id="main" class="wrap">
${body}
</main>
<footer class="site-footer"><div class="wrap">
<p>${esc(tr(lang, 'pro.footer'))}</p>
<p><a href="${appPath(lang, '/directory')}">${esc(tr(lang, 'pro.freeHelp.link'))}</a> · <a href="${privacyPath(lang)}">${esc(tr(lang, 'pro.privacy.link'))}</a></p>
</div></footer>
</body>
</html>
`;
}

const sampleBanner = (lang: Lang) =>
  `<p class="sample-banner" role="note"><strong>${esc(tr(lang, 'pro.sample.label'))}</strong> ${esc(tr(lang, 'pro.sample.body'))}</p>`;

const freeLine = (lang: Lang) =>
  `<p class="free-line">${esc(tr(lang, 'pro.freeHelp.line'))} <a href="${appPath(lang, '/directory')}">${esc(tr(lang, 'pro.freeHelp.link'))}</a></p>`;

// ---------------------------------------------------------------------------
// The professional page
// ---------------------------------------------------------------------------

function contactLinks(row: Professional, lang: Lang): string {
  const items: string[] = [];
  if (row.booking_url) items.push(`<li><a href="${esc(row.booking_url)}" rel="nofollow">${esc(tr(lang, 'pro.contact.booking'))}</a></li>`);
  if (row.website) items.push(`<li><a href="${esc(row.website)}" rel="nofollow">${esc(tr(lang, 'pro.contact.website'))}</a></li>`);
  if (row.phone) items.push(`<li>${esc(tr(lang, 'pro.contact.phone'))}: <a href="tel:${esc(row.phone.replace(/\s/g, ''))}">${esc(row.phone)}</a></li>`);
  if (row.email) items.push(`<li>${esc(tr(lang, 'pro.contact.email'))}: <a href="mailto:${esc(encodeURI(row.email))}">${esc(row.email)}</a></li>`);
  return items.length ? `<ul class="contact">${items.join('')}</ul>` : `<p>${esc(tr(lang, 'pro.contact.none'))}</p>`;
}

/** Article 14(1)(a): who the controller is and how to reach them. */
function controllerLine(lang: Lang): string {
  if (!DATA_CONTROLLER) return `<p class="pending-note">${esc(tr(lang, 'pro.notice.controllerPending'))}</p>`;
  const contact = CONTACT_ADDRESS ? ` <a href="mailto:${esc(CONTACT_ADDRESS)}">${esc(CONTACT_ADDRESS)}</a>` : '';
  return `<p class="controller">${esc(tr(lang, 'pro.notice.controller', { controller: DATA_CONTROLLER }))}${contact}</p>`;
}

/** Claim and removal. Until an address is chosen they print as text and the build stays private. */
function requestLinks(row: Professional, lang: Lang): string {
  const claim = tr(lang, 'pro.claim');
  const removal = tr(lang, 'pro.removal');
  if (!CONTACT_ADDRESS) {
    return `<ul class="requests is-pending"><li>${esc(claim)}</li><li>${esc(removal)}</li></ul>
<p class="pending-note">${esc(tr(lang, 'pro.requests.pending'))}</p>`;
  }
  const mail = (subject: string) => `mailto:${CONTACT_ADDRESS}?subject=${encodeURIComponent(`${subject}: ${row.slug}`)}`;
  return `<ul class="requests"><li><a href="${esc(mail(claim))}">${esc(claim)}</a></li><li><a href="${esc(mail(removal))}">${esc(removal)}</a></li></ul>`;
}

function profileFacts(row: Professional, lang: Lang): string {
  const fact = (key: string, value: string) => `<div><dt>${esc(tr(lang, key))}</dt><dd>${value}</dd></div>`;
  const facts = [
    fact('pro.field.languages', esc(row.languages.map((code) => languageName(code, lang)).join(', ') || tr(lang, 'pro.tri.unknown'))),
    fact('pro.field.methods', row.methods.length ? sourceText(row.methods.join(', '), lang) : esc(tr(lang, 'pro.tri.unknown'))),
    fact('pro.field.kela', esc(row.kela_approved ? tr(lang, 'pro.kela.yes', { date: formatDate(row.kela_checked_on, lang) }) : tr(lang, 'pro.kela.no'))),
    fact('pro.field.remote', esc(tri(lang, row.remote_available))),
    fact('pro.field.newClients', esc(tri(lang, row.accepting_new_clients))),
    fact('pro.field.waiting', row.waiting_time ? sourceText(row.waiting_time, lang) : esc(tr(lang, 'pro.tri.unknown'))),
    fact('pro.field.prices', row.prices ? sourceText(row.prices, lang) : esc(tr(lang, 'pro.tri.unknown'))),
  ];
  return `<dl class="facts">${facts.join('')}</dl>`;
}

export function professionalPage(row: Professional, lang: Lang): string {
  const city = cityOf(row)!;
  const cityName = city.name[lang];
  const typeName = tr(lang, `pro.type.${row.type}`);
  const prefix = row.sample ? `${tr(lang, 'pro.sample.label')} ` : '';
  const steps = ladderSteps(row)
    .map((id) => ladder.rungs.find((r) => r.id === id)!)
    .map((rung) => `<li>${esc(tr(lang, rung.labelRef))}</li>`)
    .join('');
  const sources = row.sources
    .map(
      (s) =>
        `<li><a href="${esc(s.url)}" rel="nofollow">${esc(tr(lang, `pro.source.${s.source}`))}</a>, ${esc(
          tr(lang, 'pro.source.readOn', { date: formatDate(s.read_on, lang) }),
        )}</li>`,
    )
    .join('');
  const licence = row.licence_checked_on
    ? tr(lang, 'pro.licence.checked', { date: formatDate(row.licence_checked_on, lang) })
    : tr(lang, 'pro.licence.notChecked');

  const body = `${row.sample ? sampleBanner(lang) : ''}
<article class="profile"${row.sample ? ' data-sample="true"' : ''}>
<p class="eyebrow">${esc(typeName)}, ${esc(cityName)}</p>
<h1>${esc(row.name)}</h1>
<p class="licensed-as">${esc(tr(lang, 'pro.field.title'))}: ${sourceText(row.title, lang)}</p>
<p class="licence">${esc(licence)}</p>
${profileFacts(row, lang)}
<section aria-labelledby="contact-h"><h2 id="contact-h">${esc(tr(lang, 'pro.contact.heading'))}</h2>
${contactLinks(row, lang)}
</section>
<section aria-labelledby="steps-h"><h2 id="steps-h">${esc(tr(lang, 'pro.steps.heading'))}</h2>
<ul class="steps">${steps}</ul>
${freeLine(lang)}
</section>
<section class="notice" aria-labelledby="notice-h"><h2 id="notice-h">${esc(tr(lang, 'pro.notice.heading'))}</h2>
<ul class="sources">${sources}</ul>
<p>${esc(tr(lang, 'pro.notice.body'))}</p>
${controllerLine(lang)}
<p><a href="${privacyPath(lang)}">${esc(tr(lang, 'pro.privacy.link'))}</a></p>
${requestLinks(row, lang)}
</section>
<p class="back"><a href="${cityPath(lang, row.type, city.slug)}">${esc(tr(lang, `pro.city.heading.${row.type}`, { city: cityName }))}</a></p>
</article>`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: row.name,
    jobTitle: row.title,
    knowsLanguage: row.languages,
    address: { '@type': 'PostalAddress', addressLocality: row.city, addressCountry: 'FI' },
    url: `${ORIGIN}${profilePath(lang, row.slug)}`,
    ...(row.website ? { sameAs: [row.website] } : {}),
    ...(row.sample ? { description: tr(lang, 'pro.sample.label') } : {}),
  };

  return page({
    lang,
    title: `${prefix}${row.name}, ${typeName}, ${cityName} | ${tr(lang, 'app.name')}`,
    description: `${prefix}${tr(lang, 'pro.meta.profile', { name: row.name, type: typeName, city: cityName })}`,
    paths: { fi: profilePath('fi', row.slug), sv: profilePath('sv', row.slug), en: profilePath('en', row.slug) },
    body,
    jsonLd,
  });
}

// ---------------------------------------------------------------------------
// The city page
// ---------------------------------------------------------------------------

function cityCard(row: Professional, lang: Lang): string {
  const kela = row.kela_approved ? `<li class="badge">${esc(tr(lang, 'pro.kela.badge'))}</li>` : '';
  return `<li class="card" data-languages="${esc(row.languages.join(' '))}"${row.sample ? ' data-sample="true"' : ''}>
<h2 class="card-name"><a href="${profilePath(lang, row.slug)}">${esc(row.name)}</a>${row.sample ? ` <span class="sample-tag">${esc(tr(lang, 'pro.sample.tag'))}</span>` : ''}</h2>
<p class="card-title">${sourceText(row.title, lang)}</p>
<ul class="card-tags"><li>${esc(row.languages.map((code) => languageName(code, lang)).join(', '))}</li>${kela}<li>${esc(tr(lang, 'pro.field.remote'))}: ${esc(tri(lang, row.remote_available))}</li><li>${esc(tr(lang, 'pro.field.newClients'))}: ${esc(tri(lang, row.accepting_new_clients))}</li></ul>
</li>`;
}

/**
 * The language filter (?spoken=): Finnish, Swedish and English always, as on
 * /directory, then any other language someone on this page offers, by code. Hidden until FILTER_SCRIPT shows it, so without script the whole list
 * stands.
 */
function languageFilter(rows: Professional[], lang: Lang): string {
  const offered = new Set(rows.flatMap((row) => row.languages));
  const codes = ['fi', 'sv', 'en', ...[...offered].filter((c) => !['fi', 'sv', 'en'].includes(c)).sort()];
  const buttons = codes
    .map((code) => `<button type="button" class="filter-chip" data-spoken="${esc(code)}" aria-pressed="false"><span class="tick" aria-hidden="true">✓ </span>${esc(languageName(code, lang))}</button>`)
    .join('');
  return `<fieldset class="pro-filter" data-pro-filter hidden><legend>${esc(tr(lang, 'directory.filter.language'))}</legend>${buttons}</fieldset>`;
}

export const FILTER_SCRIPT = '/pro-pages/filter.js';

export function cityPage(rows: Professional[], type: ProfessionalType, city: City, lang: Lang): string {
  const here = rows.filter((row) => row.type === type && cityOf(row)?.slug === city.slug);
  const heading = tr(lang, `pro.city.heading.${type}`, { city: city.name[lang] });
  const anySample = here.some((row) => row.sample);
  const list = here.length
    ? `${languageFilter(here, lang)}
<p class="count" data-pro-count data-template="${esc(template(lang, 'directory.page.count'))}">${esc(tr(lang, 'pro.city.count', { n: here.length }))}</p>
<ul class="cards">${here.map((row) => cityCard(row, lang)).join('')}</ul>
<p class="empty" data-pro-none hidden>${esc(tr(lang, 'directory.filter.none'))} <button type="button" class="link">${esc(tr(lang, 'directory.filter.reset'))}</button></p>`
    : `<p class="empty">${esc(tr(lang, 'pro.city.empty'))}</p>`;
  const body = `${anySample ? sampleBanner(lang) : ''}
<h1>${esc(heading)}</h1>
<p class="intro">${esc(tr(lang, `pro.city.intro.${type}`, { city: city.name[lang] }))}</p>
${freeLine(lang)}
${list}`;
  return page({
    lang,
    title: `${anySample ? `${tr(lang, 'pro.sample.label')} ` : ''}${heading} | ${tr(lang, 'app.name')}`,
    description: tr(lang, `pro.meta.city.${type}`, { city: city.name[lang] }),
    paths: { fi: cityPath('fi', type, city.slug), sv: cityPath('sv', type, city.slug), en: cityPath('en', type, city.slug) },
    body,
    script: here.length ? FILTER_SCRIPT : undefined,
  });
}

// ---------------------------------------------------------------------------
// The directory's privacy page (GDPR Articles 13 and 14 for the professionals)
// ---------------------------------------------------------------------------

const OMBUDSMAN: Record<Lang, string> = {
  fi: 'https://tietosuoja.fi/etusivu',
  sv: 'https://tietosuoja.fi/sv/framsida',
  en: 'https://tietosuoja.fi/en/home',
};

export function privacyPage(lang: Lang): string {
  const section = (key: string, body: string) =>
    `<section aria-labelledby="${key}-h"><h2 id="${key}-h">${esc(tr(lang, `pro.privacy.${key}.heading`))}</h2>\n${body}\n</section>`;
  const para = (key: string) => `<p>${esc(tr(lang, key))}</p>`;
  const write = CONTACT_ADDRESS
    ? `<p>${esc(tr(lang, 'pro.privacy.rights.write'))} <a href="mailto:${esc(CONTACT_ADDRESS)}">${esc(CONTACT_ADDRESS)}</a>.</p>`
    : `<p class="pending-note">${esc(tr(lang, 'pro.requests.pending'))}</p>`;
  const body = `<h1>${esc(tr(lang, 'pro.privacy.title'))}</h1>
<p class="intro">${esc(tr(lang, 'pro.privacy.intro'))}</p>
${section('controller', controllerLine(lang))}
${section('purpose', para('pro.privacy.purpose.body'))}
${section('basis', para('pro.privacy.basis.body'))}
${section('data', para('pro.privacy.data.body'))}
${section('sources', para('pro.privacy.sources.body'))}
${section('retention', para('pro.privacy.retention.body'))}
${section('recipients', `${para('pro.privacy.recipients.body')}\n${TRANSFERS_CONFIRMED ? para('pro.privacy.transfers.body') : `<p class="pending-note">${esc(tr(lang, 'pro.privacy.transfers.pending'))}</p>`}`)}
${section('rights', `<p>${esc(tr(lang, 'pro.privacy.rights.body'))}</p>
<p><strong>${esc(tr(lang, 'pro.privacy.rights.objectLead'))}</strong> ${esc(tr(lang, 'pro.privacy.rights.object'))}</p>
${write}
<p>${esc(tr(lang, 'pro.privacy.rights.complaint'))} <a href="${OMBUDSMAN[lang]}">${esc(tr(lang, 'pro.privacy.rights.ombudsman'))}</a></p>`)}
${section('automated', para('pro.privacy.automated.body'))}`;
  return page({
    lang,
    title: `${tr(lang, 'pro.privacy.title')} | ${tr(lang, 'app.name')}`,
    description: tr(lang, 'pro.privacy.intro'),
    paths: { fi: privacyPath('fi'), sv: privacyPath('sv'), en: privacyPath('en') },
    body,
  });
}

// ---------------------------------------------------------------------------
// The 410
// ---------------------------------------------------------------------------

/**
 * What a professional's address answers once there is no page for it (the
 * removal path's step 3, D-39). Served with status 410 by the route
 * `goneRoutes()` adds. It names no one and says nothing about why: the build
 * cannot know, because a removed person's slug is not kept anywhere.
 */
export function gonePage(lang: Lang): string {
  const body = `<h1>${esc(tr(lang, 'pro.gone.title'))}</h1>
<p>${esc(tr(lang, 'pro.gone.body'))}</p>
${freeLine(lang)}`;
  return page({
    lang,
    title: `${tr(lang, 'pro.gone.title')} | ${tr(lang, 'app.name')}`,
    description: tr(lang, 'pro.gone.body'),
    paths: { fi: GONE_PAGES.fi, sv: GONE_PAGES.sv, en: GONE_PAGES.en },
    body,
    unlisted: true,
  });
}

/** Where each language's 410 page is written, inside the stylesheet's folder. */
export const GONE_PAGES: Record<Lang, string> = {
  fi: '/pro-pages/gone/fi.html',
  sv: '/pro-pages/gone/sv.html',
  en: '/pro-pages/gone/en.html',
};

type Route = Record<string, unknown>;

/**
 * Build Output API routes: a professional's address with no page answers 410
 * with that language's gone page. They go straight after `{ handle: 'filesystem' }`,
 * so a page that exists always wins. Any earlier copy is replaced, so running
 * the build twice leaves one set.
 */
export function goneRoutes(routes: Route[]): Route[] {
  const ours = LANGS.map((lang) => ({
    src: `^${FOLDERS.profile[lang]}[^/]+/?$`,
    status: 410,
    dest: GONE_PAGES[lang],
  }));
  const isOurs = (route: Route) => ours.some((r) => r.src === route.src);
  const kept = routes.filter((route) => !isOurs(route));
  const at = kept.findIndex((route) => route.handle === 'filesystem');
  if (at === -1) throw new Error('[pages] the Build Output config has no filesystem handle to put the 410 after');
  return [...kept.slice(0, at + 1), ...ours, ...kept.slice(at + 1)];
}

// ---------------------------------------------------------------------------
// Everything
// ---------------------------------------------------------------------------

export interface BuiltPage {
  path: string;
  html: string;
}

export function renderAll(rows: Professional[]): BuiltPage[] {
  const shown = listed(rows);
  const out: BuiltPage[] = [];
  for (const lang of LANGS) {
    out.push({ path: privacyPath(lang), html: privacyPage(lang) });
    for (const row of shown) out.push({ path: profilePath(lang, row.slug), html: professionalPage(row, lang) });
    for (const type of ['psychotherapist', 'psychologist'] as const) {
      for (const city of CITIES) out.push({ path: cityPath(lang, type, city.slug), html: cityPage(shown, type, city, lang) });
    }
  }
  return out;
}

/** A plain list of what was built, for whoever reviews the preview. Never public. */
export function previewIndex(pages: BuiltPage[]): string {
  const items = pages.map((p) => `<li><a href="${p.path}">${p.path}</a></li>`).join('');
  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex, nofollow">
<title>Directory pages, preview</title><link rel="stylesheet" href="${STYLESHEET}"></head>
<body>
${crisisBand('en')}
<main id="main" class="wrap"><h1>Directory pages, preview</h1>
<p>Every page the templates built from this dataset. Private preview; nothing here is public.</p>
<ul>${items}</ul>
<p>A professional's address with no page answers 410 Gone, for example <a href="/ammattilaiset/ei-ole-olemassa">/ammattilaiset/ei-ole-olemassa</a> (only on a Build Output deploy).</p></main></body></html>
`;
}
