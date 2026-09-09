---
name: add-directory-entry
description: Add a service to Reitti's cross-sector directory — a helpline, chat, self-help programme, public pathway or provider — with the verification, role, age and honesty checks applied. Use when asked to add, list, or configure a service, helpline, provider, or anything that appears as an option on a rung.
---

# Adding a directory entry

The directory is **config, never code**, and it is the surface where a mistake reaches a person
directly. A wrong phone number or a stale opening hour sends somebody in difficulty to a closed
line. Treat this as clinical content, not as data entry.

## 1. Is it allowed to be added at all?

- **Named in the brief, or flagged.** Do not add a service the product owner has not named without
  saying so explicitly and getting agreement. `docs/v2-decisions.md` D-15 is the worked example: HUS
  ryhmähoidot belongs on rung 3, is not in the brief, and is therefore *recorded and not added*.
- **Verified against the live source, today.** Open the service's own site. Do not take hours,
  numbers or age ranges from a third-party listing or from memory.
- **Never invent hours.** If the source does not state them, use the honest fallback
  (`directory.hours.unverified` → "hours change, so check the site before you go"). A stale hour
  presented as current is worse than no hour.

## 2. Pick the file and the role

```
config/directory/public.json        HUS, Terapianavigaattori, Mielenterveystalo, health stations
config/directory/third-sector.json  MIELI ry, Tukinet, MTKL, Sekasin, Ärligt talat
config/directory/kela.json          Kela-subsidised routes
config/directory/private.json       deliberately EMPTY — see D-12
config/directory/youth.json         under-18 handoff (C4)
```

`role` is the field people get wrong. It decides whether the ladder may name the entry as the free
thing at a rung:

| role | meaning | example |
|---|---|---|
| `care` | the support itself, walk in today | Tukinet, Mielenterveystalo omahoito |
| `gated-care` | real care, free, but behind a referral | HUS Nettiterapiat |
| `route` | a way of *reaching* care | Terapianavigaattori, health station |

Terapianavigaattori lists `group-therapy` among its rungs because it routes people there. Naming it
beside "Group therapy" would announce free group therapy that does not exist. That is why the split
exists — see D-14.

## 3. Write the entry

Every field below is required and a build check enforces it:

`id` · `nameRef` · `operator` (who runs it, shown verbatim, never translated) · `rungs` ·
`sector` · `costBand` · `languages` (the **care** language) · `ageRange` · `formats` · `hoursRef` ·
`anonymity` · `whoAnswers` · `url` · `origin` · `role` · `verifiedOn` (ISO) · `verifiedBy` ·
`clinicianReviewed`

- **`clinicianReviewed: false`** unless a clinician has actually signed it off. It blocks nothing and
  prints loudly.
- **`whoAnswers`** — professional, trained volunteer, or peer with lived experience is a real choice
  a person makes. Do not flatten it to "support". Use `mixed` when both are true depending on when
  you go, and say which is which in the hours string.
- **`fallbackOnly: true`** requires a `cautionRef`, and the entry then always renders last.
- **`origin: 'international'`** never orders above a domestic service.

## 4. Write the content

Add every `*Ref` to `config/i18n/directory/{en,fi,sv}.json` — all three, same key set.
**Organisation and service names are proper nouns and are not translated.** Hours, cost notes and
labels are.

## 5. Verify

```bash
npm run directory:verify -- --live   # completeness (blocks) + URL liveness (reports)
npm run directory:print              # the clinician/partner sign-off sheet
npm test                             # invariants 12–16, 21
npm run typecheck
```

The invariants that will catch you: no filter may empty a rung (12), a fallback entry never outranks
a domestic one (13), every entry carries hours/language/anonymity/who-answers/verifiedOn (14), every
language × age band still reaches a person (15), and a rung labelled free must name real care (21).

## 6. Say what is unresolved

Report which fields you verified against the live source and which used the fallback, and state
plainly that the entry is unreviewed. All directory content is provisional until a clinician signs
it off.
