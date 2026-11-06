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

## The gate

`npm run build` never builds these pages, so a Vercel git build has none. They are built only when
someone runs:

    npm run pages:build -- --data ../Reitti-data --out <dir>

A production build (`--production`, or `VERCEL_ENV=production`) refuses and builds nothing while any
of `productionBlockers()` stands:

- `PUBLIC_PAGES_APPROVED` is `false`. Setting it to `true` is Amir's decision, made as a reviewed edit.
- `CONTACT_ADDRESS_CONFIRMED` is `false`. The address is `tietosuoja@mielenreitti.fi` (Amir,
  6.11.2026); the flag goes to `true` once a test message sent to it from outside has arrived.
- `DATA_CONTROLLER` is `null` (see the open items).
- `TRANSFERS_CONFIRMED` is `false` (see the open items).
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

## Open items

- **The data controller is not decided** (6.11.2026): Amir personally, or a company. The Article 14
  notice must name one, so every professional page says it is not decided yet, and **no real entry
  goes public until it is.** `DATA_CONTROLLER` in `apps/web/pages/data.ts` blocks a production build
  until then.
- **The basis for transfers outside the EU is not confirmed.** Vercel (hosting) and GitHub (the
  private data repository) are US companies that process the professionals' data. The privacy page
  says the basis is still being confirmed. Once it is checked against each provider's terms, it goes
  in as `pro.privacy.transfers.body` in the three ui bundles, and `TRANSFERS_CONFIRMED` becomes `true`.

## Not built yet

- The 410 for removed slugs (the removal path's step 3) and the privacy-page section.
- The `?spoken=` language filter on city pages.
- The refresh job that marks rows `stale`. It waits for Kela's answer to the letter.
- Checking new rows against `suppressed.json`. The build only checks that the file is well formed: matching needs the salt, which is in neither repository. Until the hand-entry step does that check, look up each new person in the suppression list by hand before adding them.
- Sitemap entries. They come when the gate opens.
