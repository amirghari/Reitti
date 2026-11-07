# The professionals directory: how the pages are built

Phase A of `docs/next-phase.md`, under D-39. Sources and their terms: `docs/directory-sources.md`.
Fields and the removal path: `docs/directory-data-model.md`.

## Where things are

| What | Where |
|---|---|
| The rows | private repository `amirghari/Reitti-data`, `professionals.json` (today: five invented rows, all `"sample": true`) |
| The schema | `docs/schemas/professional.schema.json` |
| Validation, ladder steps, the gate | `apps/web/pages/data.ts` |
| The templates | `apps/web/pages/render.ts`, styled by `apps/web/pages/pages.css` |
| The build | `scripts/build-professional-pages.ts` (`npm run pages:build`) |
| The copy | `pro.*` in `config/i18n/ui/{en,fi,sv}.json`, fi and sv in `_needsNativeReview` |
| Tests | `apps/web/test/professional-pages.test.ts`, `tests/a11y/professional-pages.spec.ts` |

## Pages

| | Finnish | Swedish | English |
|---|---|---|---|
| A professional | `/ammattilaiset/<slug>` | `/sv/yrkespersoner/<slug>` | `/en/professionals/<slug>` |
| Psychotherapists in a city | `/psykoterapeutit/<city>` | `/sv/psykoterapeuter/<city>` | `/en/psychotherapists/<city>` |
| Psychologists in a city | `/psykologit/<city>` | `/sv/psykologer/<city>` | `/en/psychologists/<city>` |

Cities: helsinki, espoo, vantaa, tampere, turku, oulu. Every page is static HTML with no script. Each
page opens with the crisis lines from `config/crisis.json` (invariant 1). A professional page shows
the licence check date, each source with its date, the Article 14 notice, and the claim and removal
requests. It has Person JSON-LD with no ratings. The ladder steps are derived from `type` and
`kela_approved` (D-39).

## The privacy page

`/tietosuoja/ammattilaiset`, `/sv/dataskydd/yrkespersoner`, `/en/privacy/professionals`. The site
has no privacy page of its own, so this one covers the directory only: the controller, purpose, legal
basis, what is kept, sources, retention, who else handles the data, rights (with
tietosuoja@mielenreitti.fi and the Data Protection Ombudsman) and automated decisions. Every
directory page links to it from its footer, and every professional page from its notice. It is built
and gated with the rest.

## The language filter

A city page with people on it has a language filter, `?spoken=`, with the rules of `/directory`
(D-37). Finnish, Swedish and English always have a button, then any other language someone on the
page offers. Several can be on at once, and a
card matches if it offers any of them. The choice lives in the address, comma-joined, and a value the
page has no button for is dropped. It is `apps/web/pages/filter.js`, plain script served from the
site (CSP `script-src 'self'`), and the only script on any directory page. Without it the filter
stays hidden and every card shows.

## The sitemap

`apps/web/pages/sitemap.ts`, gated like the pages. It holds the privacy page, every listed
professional, and each city page with someone on it: empty city pages are built but not offered.
Each address is listed in every language with fi/sv/en alternates, and Finnish is x-default.
- **Preview builds:** a copy at `/pro-pages/sitemap-directory.xml` to look at.
- **Production builds** (which pass every blocker first): `/sitemap-directory.xml`, plus a route,
  placed before the filesystem, that answers 404 for it on any host but mielenreitti.fi.
- **robots.txt** names it only when `PUBLIC_PAGES_APPROVED` (`apps/web/pages/gate.ts`) is true.

## The gate

`npm run build` never builds these pages, so a Vercel git build has none. They are built only when
someone runs:

    npm run pages:build -- --data ../Reitti-data --out <dir>

A production build (`--production`, or `VERCEL_ENV=production`) refuses and builds nothing while any
of `productionBlockers()` stands:

- `PUBLIC_PAGES_APPROVED` is `false`. Setting it to `true` is Amir's decision, made as a reviewed edit.
- `CONTACT_ADDRESS_CONFIRMED` is `false`. The address is `tietosuoja@mielenreitti.fi` (Amir,
  6.11.2026); the flag goes to `true` once a test message sent to it from outside has arrived.
- `TRANSFERS_CONFIRMED` is `false`: the draft is `docs/privacy-transfers-draft.md`.
- `SOURCE_CHECKS_RUNNING` is `false`: the refresh job checks every listing against its source each
  month (D-41). It waits for Kela's answer.

`PRIVACY_WORDING_APPROVED` is `true` (Amir, 7.11.2026, D-41).

**Who a production build publishes (D-41):** only listed rows with an email address from the source
and a `notified_on` date, meaning the Article 14 notice was sent (`publishable()` in
`apps/web/pages/data.ts`). Everyone else waits for the claim flow. The notice is drafted in
`docs/letters/professional-notice.md`. A preview still shows every listed row.
- Any row is a sample.
- Any listed row has no licence check.

While the gate is shut, every page carries `noindex, nofollow` and none is in the sitemap.

## A private preview

The preview deploys prebuilt to a protected Vercel preview, never to production:

    vercel pull --yes --environment=preview
    vercel build --yes
    npm run pages:build -- --data ../Reitti-data --out .vercel/output/static
    vercel deploy --prebuilt --yes

`/pro-pages/` on the preview lists every page that was built.

## The 410

A removed person's slug is not kept anywhere, so the build cannot list the addresses that should
answer 410. Instead, any professional address with no page answers **410 Gone**, with a short page in
that language (`/pro-pages/gone/<lang>.html`): the crisis lines, "This listing is not here any
more", and the free help. `pages:build` adds the three routes to `.vercel/output/config.json`
straight after the filesystem handle, so a page that exists always wins. Only a Build Output deploy
has them. A git build has neither the pages nor the routes, and those addresses stay 404.

## Open items

- **The data controller is Amir Ghari, Helsinki, for now** (D-40, 6.11.2026), with
  tietosuoja@mielenreitti.fi as the privacy contact. **A company becomes required when money or a
  paying organisation enters**; then `DATA_CONTROLLER`, the notice and the privacy page change with it.
- **The transfer basis.** Researched and drafted in `docs/privacy-transfers-draft.md`, waiting for
  Amir's approval and his answers there (Vercel plan, GitHub, Workspace).
- **The notice email** (`docs/letters/professional-notice.md`) waits for Amir's approval, including
  the proposed 14-day period between the notice and publication.
- **A written legitimate-interest assessment**, and the commercial interest stated on the privacy page
  once claimed profiles are paid (`docs/next-phase.md`, Phase B).
- **JulkiTerhikki's terms** are not read yet (`docs/directory-sources.md`); read them before it is
  named as a source on a real page.
- **The site-wide privacy notice** is PR #10 (`/privacy`), waiting for the mailbox and Amir's review.

## Not built yet

- The refresh job: the monthly check of every listing against its source, marking rows `stale` and deleting them 60 days later (D-41). It waits for Kela's answer to the letter.
- Checking new rows against `suppressed.json`. The build only checks that the file is well formed: matching needs the salt, which is in neither repository. Until the hand-entry step does that check, look up each new person in the suppression list by hand before adding them.
