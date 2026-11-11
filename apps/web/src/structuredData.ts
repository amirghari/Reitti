/**
 * Structured data (search visibility plan item 6, Amir 11.11.2026): JSON-LD that
 * says in schema.org terms only what the page already says in text.
 *
 *   /, /fi, /sv   Organization and WebSite (the same two on all three)
 *   each guide    Article, on a WebPage that belongs to the WebSite
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
        dateModified: a.checkedOn,
        author,
        publisher: { '@type': 'Organization', '@id': ORG_ID, name: SITE_NAME, logo: { '@type': 'ImageObject', url: `${ORIGIN}/apple-touch-icon.png` } },
        isAccessibleForFree: true,
        citation: a.sources.map((s) => ({ '@type': 'CreativeWork', name: s.label, url: s.url })),
      },
    ],
  };
}

/** A JSON-LD block for the head. "<" is escaped so no string can close the script early. */
export const jsonLdScript = (data: Json): string =>
  `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`;
