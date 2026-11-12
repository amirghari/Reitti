/**
 * Structured data (search visibility plan item 6, Amir 11.11.2026): JSON-LD that
 * says in schema.org terms only what the page already says in text.
 *
 *   /, /fi, /sv   Organization and WebSite (the same two on all three)
 *   each guide    Article, on a WebPage that belongs to the WebSite
 *   each service  Service, on a WebPage that belongs to the WebSite
 *
 * No FAQ markup (Amir, 11.11.2026). No "reviewed by" until the clinician has
 * agreed in writing to be named: `reviewFields` returns nothing without that
 * consent on record, and the visible "reviewed by" line on the page belongs in
 * the same pull request as filling in `CLINICAL_REVIEW` (plan item 3).
 *
 * No imports and no `window`: the pre-render (entry-server.tsx) and the guide
 * build (guides/render.ts, run by vite-node) both read it.
 */
export const ORIGIN = 'https://mielenreitti.fi';
export const SITE_NAME = 'Mielenreitti';
const ORG_ID = `${ORIGIN}/#organization`;
const SITE_ID = `${ORIGIN}/#website`;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

type Json = Record<string, unknown>;

/** The project, named as the site names itself. Not a registered company (D-40). */
export function organization(): Json {
  return {
    '@type': 'Organization',
    '@id': ORG_ID,
    name: SITE_NAME,
    url: `${ORIGIN}/`,
    logo: `${ORIGIN}/apple-touch-icon.png`,
    email: 'hello@mielenreitti.fi',
  };
}

export function website(): Json {
  return {
    '@type': 'WebSite',
    '@id': SITE_ID,
    name: SITE_NAME,
    url: `${ORIGIN}/`,
    inLanguage: ['en', 'fi', 'sv'],
    publisher: { '@id': ORG_ID },
  };
}

// ---------------------------------------------------------------------------
// "Reviewed by": empty until written consent
// ---------------------------------------------------------------------------

export interface ClinicalReview {
  name: string;
  jobTitle: string;
  /** The day the review was done (YYYY-MM-DD). */
  reviewedOn: string;
  /**
   * The clinician's written agreement to be named: the day it arrived and where
   * it is kept. Without it, nothing about the review is published.
   */
  writtenConsent?: { receivedOn: string; keptIn: string };
}

/** Nobody has agreed in writing to be named yet (plan item 3 waits on the review of 23.11). */
export const CLINICAL_REVIEW: ClinicalReview | null = null;

export const hasWrittenConsent = (review: ClinicalReview | null): review is ClinicalReview & { writtenConsent: { receivedOn: string; keptIn: string } } =>
  !!review?.writtenConsent && DATE.test(review.writtenConsent.receivedOn) && review.writtenConsent.keptIn.trim().length > 0;

/** `reviewedBy` and `lastReviewed` for a page, or nothing at all without written consent. */
export function reviewFields(review: ClinicalReview | null = CLINICAL_REVIEW): Json {
  if (!hasWrittenConsent(review) || !DATE.test(review.reviewedOn)) return {};
  return {
    reviewedBy: { '@type': 'Person', name: review.name, jobTitle: review.jobTitle },
    lastReviewed: review.reviewedOn,
  };
}

/**
 * A day as Google wants a date-time: the start of that day in Helsinki, with
 * its offset at that midnight: +03:00 in summer time, else +02:00. The clocks
 * change at 01:00 UTC (03:00 or 04:00 in Helsinki) on the last Sundays of March
 * and October, so midnight on the March Sunday is still +02:00 and midnight on
 * the October Sunday is still +03:00. The guides record a day, so the time says
 * no more than that.
 */
export function helsinkiDay(iso: string): string {
  if (!DATE.test(iso)) throw new Error(`[structured data] not a date: ${iso}`);
  const [y, m, d] = iso.split('-').map(Number);
  const lastSunday = (month: number) => {
    const last = new Date(Date.UTC(y, month, 0));
    return last.getUTCDate() - last.getUTCDay();
  };
  const summer = (m > 3 && m < 10) || (m === 3 && d > lastSunday(3)) || (m === 10 && d <= lastSunday(10));
  return `${iso}T00:00:00${summer ? '+03:00' : '+02:00'}`;
}

// ---------------------------------------------------------------------------
// Pages
// ---------------------------------------------------------------------------

export interface ArticleInput {
  lang: 'en' | 'fi' | 'sv';
  /** The page's path, e.g. "/en/guides/free-help-now". */
  path: string;
  headline: string;
  description: string;
  /** The day every fact on the page was checked against its source. */
  checkedOn: string;
  sources: { label: string; url: string }[];
}

export function homeJsonLd(): Json {
  return { '@context': 'https://schema.org', '@graph': [organization(), website()] };
}

export function guideJsonLd(a: ArticleInput, review: ClinicalReview | null = CLINICAL_REVIEW): Json {
  const url = `${ORIGIN}${a.path}`;
  const author = { '@type': 'Organization', '@id': ORG_ID, name: SITE_NAME, url: `${ORIGIN}/` };
  return {
    '@context': 'https://schema.org',
    '@graph': [
      organization(),
      {
        '@type': 'WebPage',
        '@id': url,
        url,
        name: a.headline,
        inLanguage: a.lang,
        isPartOf: { '@id': SITE_ID },
        mainEntity: { '@id': `${url}#article` },
        ...reviewFields(review),
      },
      {
        '@type': 'Article',
        '@id': `${url}#article`,
        headline: a.headline,
        description: a.description,
        inLanguage: a.lang,
        url,
        mainEntityOfPage: { '@id': url },
        dateModified: helsinkiDay(a.checkedOn),
        author,
        publisher: { '@type': 'Organization', '@id': ORG_ID, name: SITE_NAME, logo: { '@type': 'ImageObject', url: `${ORIGIN}/apple-touch-icon.png` } },
        citation: a.sources.map((s) => ({ '@type': 'CreativeWork', name: s.label, url: s.url })),
      },
    ],
  };
}

export interface ServiceInput {
  lang: 'en' | 'fi' | 'sv';
  /** The page's path, e.g. "/directory/tukinet". */
  path: string;
  name: string;
  /** The card's note, as the page prints it. */
  description?: string;
  /** Who runs it, as the card prints it. */
  operator: string;
  /** The languages the service itself is given in (ISO 639-1); empty when its source states none, and then left out. */
  languages: string[];
  /** The service's own site. */
  serviceUrl: string;
  phone?: string;
  /** The day the card's details were checked against the service's source. */
  checkedOn: string;
}

/**
 * A directory service's page (Amir, 12.11.2026): a WebPage whose main entity
 * is a Service. Only what the page says in text: name, the card's note, who runs
 * it, its languages, its site and phone. No hours, cost or area markup, which
 * would be claims in a form a reader of the page never sees. Google has no rich
 * result for a Service, so this is checked against schema.org, not the Rich
 * Results Test.
 */
export function serviceJsonLd(s: ServiceInput): Json {
  const url = `${ORIGIN}${s.path}`;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      organization(),
      {
        '@type': 'WebPage',
        '@id': url,
        url,
        name: s.name,
        inLanguage: s.lang,
        isPartOf: { '@id': SITE_ID },
        mainEntity: { '@id': `${url}#service` },
        dateModified: helsinkiDay(s.checkedOn),
      },
      {
        '@type': 'Service',
        '@id': `${url}#service`,
        name: s.name,
        ...(s.description ? { description: s.description } : {}),
        provider: { '@type': 'Organization', name: s.operator },
        ...(s.languages.length ? { availableLanguage: s.languages } : {}),
        url: s.serviceUrl,
        mainEntityOfPage: { '@id': url },
        availableChannel: {
          '@type': 'ServiceChannel',
          serviceUrl: s.serviceUrl,
          ...(s.languages.length ? { availableLanguage: s.languages } : {}),
          ...(s.phone ? { servicePhone: { '@type': 'ContactPoint', telephone: s.phone } } : {}),
        },
      },
    ],
  };
}

/** A JSON-LD block for the head. "<" is escaped so no string can close the script early. */
export const jsonLdScript = (data: Json): string =>
  `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`;
