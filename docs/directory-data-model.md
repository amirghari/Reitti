# Directory data model: professionals (proposal)

Phase A of `docs/next-phase.md`. **A proposal for Amir to read, not built.** No importer, no dataset
and no page exists yet. The machine-checkable form is `docs/schemas/professional.schema.json`; this
note says why each field is there and where the proposal departs from the plan, so each departure
can be accepted or turned down on its own.

## One row per professional

| Field | Type | Where it comes from | Shown on the page |
|---|---|---|---|
| `id` | string, stable | ours, never derived from a personal identity code | no |
| `slug` | string | ours: name + city, a number on collision | in the URL |
| `type` | `psychotherapist` \| `psychologist` \| `psychiatrist` | the licence (JulkiTerhikki) or Kela's listing | yes |
| `name` | string | the source, as written there | yes |
| `title` | string | as licensed, e.g. "Psykoterapeutti (ETA)" | yes |
| `languages` | ISO 639-1 codes | Kela listing or the professional | yes |
| `city` | string | Kela listing or JulkiSoteri service point | yes |
| `region` | string | the wellbeing services county the city is in | yes |
| `methods` | string[] | Kela's therapy form and orientation, or the professional | yes |
| `kela_approved` | boolean | Kela's listing | yes |
| `kela_checked_on` | date | when we read it | yes |
| `licence_checked_on` | date \| null | JulkiTerhikki, one entry at a time | yes, "Licence checked on" |
| `registered_provider_checked_on` | date \| null | JulkiSoteri check, one entry at a time | no **(new)** |
| `business_id` | Y-tunnus \| null | JulkiSoteri, to match the same practice across sources | no **(new)** |
| `website`, `booking_url`, `phone`, `email` | string \| null | only if the source shows it or the professional adds it | yes |
| `prices` | free text \| null | only as the source or the professional states it, never ours | yes |
| `waiting_time` | free text \| null | Kela's "jonotusaika", as shown | yes **(new)** |
| `remote_available` | `unknown` \| `yes` \| `no` | Kela's "etävastaanotto" | yes **(new)** |
| `accepting_new_clients` | `unknown` \| `yes` \| `no` | Kela's listing or the professional | yes |
| `sources` | list of `{ source, url, read_on, fields }` | one per source read | yes, "Source: Kela, read 6.11.2026" |
| `claimed`, `claimed_on` | boolean, date \| null | phase B | yes |
| `status` | `active` \| `stale` | the refresh job | no **(new)** |
| `stale_since` | date \| null | the refresh job; hidden 60 days after | no **(new)** |
| `do_not_list`, `do_not_list_on` | boolean, date \| null | a removal request | no (page returns 410) |

No personal identity codes, no home addresses, no health information about the professional, as the
plan says. `null` means the source did not say; the page then says nothing, never a guess.

## Where this departs from the plan, and why

1. **`sources` is a list, not `source` / `source_url` / `source_date`.** One row will usually come
   from Kela and be checked in JulkiSoteri and JulkiTerhikki. A list keeps every claim traceable to
   where and when it was read, and `fields` says which fields each source supplied, so a correction
   request can be answered with exactly where a value came from.
2. **New fields `waiting_time` and `remote_available`.** Kela's search now carries both, filled in by
   the therapists themselves (`docs/directory-sources.md`). They are the facts a person choosing a
   therapist most needs, and they are already public by the therapist's own choice.
3. **New fields `business_id` and `registered_provider_checked_on`** for the JulkiSoteri check.
   A Y-tunnus is a business identifier, not a personal identity code; it is never rendered.
4. **`status` and `stale_since`** make the plan's "stale, hidden after 60 days" a field rather than
   a rule in the job.
5. **`notes_internal` is left out of the dataset.** Anything in the build input can end up in the
   built site or the repository. Internal notes belong in the review list (phase B) or in Amir's own
   notes, never next to the published fields.
6. **The dataset is not committed to this repository.** The plan says "a dataset in the repo". This
   repository is public: everything committed here is published on GitHub, and git history keeps it
   after deletion, so a person who asks to be removed would stay readable in the history. That cannot
   meet "removed within 7 days". Proposal: a **private** repository (say `reitti-directory-data`)
   holds the dataset and a suppression list; the build reads it with a read-only token at deploy;
   this repository holds the importer code, the schema and the pages. The site is still static and
   no server touches anyone's data, as the plan wants.
7. **A removal deletes the row, and keeps only a suppression entry**: the source, a salted hash of
   the source's key for that person, and the date, so the next import does not add them back.
   `do_not_list` stays for the window between the request and the next build. Old Vercel
   deployments keep serving their own copy at their deployment URLs, so a removal also deletes the
   deployments that contained the person.
8. **Test fixtures are synthetic.** The plan asks for importer tests against saved sample pages. A
   saved page from Kela holds real therapists, and in a public repository that is the same problem as
   point 6. The fixtures keep the real pages' structure with invented names; the real samples, if
   needed, live in the private repository.

## How the existing directory fits

The 23 public and third-sector entries in `config/directory` stay where they are, with their `role`
and every rule they carry; nothing about them changes. Professionals are a second list, rendered
alongside them on `/directory` and on the city pages. Which ladder step a professional belongs to
(a Kela-approved psychotherapist and Kela rehabilitative psychotherapy; a private psychologist and
short-term therapy; a psychiatrist on no current step) is a question for Amir, below.

## Questions for Amir

1. Accept the private-repository storage (point 6), or decide otherwise?
2. Kela: write to them first, start by hand, or an importer on your word (`docs/directory-sources.md`)?
3. JulkiSoteri: per-entry checks only until LVV publishes terms and contact details?
4. Which ladder step each `type` sits on, and whether psychiatrists are in v1 (the plan's own question).
5. The first city set: the plan suggests Helsinki, Espoo, Vantaa, Tampere, Turku, Oulu, Jyväskylä,
   Kuopio, Lahti.
