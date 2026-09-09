---
name: add-instrument
description: Add a validated questionnaire instrument to Reitti's config surface, with the licensing, translation and no-diagnosis checks applied. Use when asked to add, enable, or configure a test, screener, questionnaire, or instrument (e.g. PHQ-9, WHO-5, CBI, ISI).
---

# Adding an instrument

Instruments are **config, never code**. If this procedure makes you edit anything in
`packages/engine/src` or a `.tsx` file, stop — the engine is missing a capability and that is a
separate, deliberate change.

## 1. Gate it before you build it

Check `docs/reitti-test-catalog.md` first. Refuse to add an instrument that fails any of these:

- **Validated.** No Enneagram, no MBTI, no unvalidated pop instrument in Type 1 or 2.
- **Licensed for commercial use.** No NEO-PI-R, 16PF, GHQ, Maslach MBI, Beck inventories, or DAS.
  If the catalog flags it `[verify commercial license]` (ISI, PSS, ORS/SRS), it does **not** ship
  until that flag is resolved — `license: "verify-commercial"` fails a test by design.
- **Official wording.** Use the published item wording verbatim. Never paraphrase an item.
- **Official translation, or none.** Never hand-translate an item into Finnish or Swedish. A
  translated screener measures something different. Ship the item wording only in a language whose
  official validated translation you actually hold, and declare the rest `absent` (see §3).

If it fails one, say which and stop.

## 2. Write the config

Create `config/instruments/<id>.json`. Copy the closest existing instrument as a shape reference —
`phq-9.json` for a scored screener, `pc-ptsd-5.json` for a gated yes/no screen, `audit-c.json` for
per-item scales, `who-5.json` for a transformed score.

Required: `id`, `name`, `version`, `type` (`routing` | `progress` | `explore`), `license`, `source`,
`purposeRef`, `aboutRef`, `promptRef`, `items`, `scoring`, `bands`.

Rules:
- **`bands` must cover the full theoretical range with no gaps.** A test enforces this. Compute the
  maximum as the sum of each item's highest scale value (times `scoreTransform.multiplier` if set).
- **`severity`** on each band is the routing engine's intensity input: 0 none · 1 mild · 2 moderate ·
  3 moderately-severe · 4 severe. Only `type: "routing"` instruments feed severity.
- **`crisisItem`** only for an item that genuinely indicates self-harm risk. It fires the crisis
  panel mid-questionnaire, before scoring. Do not use it for "high distress".
- **`type: "explore"`** instruments must have no `routingSignal` — Type 3 is walled off from routing.

## 3. Write the content

`config/i18n/` is split by **ownership**, not by language. An instrument touches the clinical
bundle only:

```
config/i18n/ui/{en,fi,sv}.json          product copy — not yours to edit here
config/i18n/clinical/{en,fi,sv}.json    instrument wording, scales, bands, rungs, crisis  ← here
config/i18n/directory/{en,fi,sv}.json   service names, hours, cost notes
```

Add every `*Ref` to `config/i18n/clinical/en.json`. A test fails on any unresolved ref.

**Then declare the translation status.** Each `clinical/<lang>.json` carries `_translationStatus`,
an entry per instrument, either `official` or `absent`:

- `absent` means that language ships **none** of the instrument's items or response scales, and the
  app will not offer it there. That is the correct, honest state until the official validated
  translation is in hand. Invariant 18 fails if wording leaks into a language marked `absent`, and
  also if a language marked `official` is missing any item.
- Add the new instrument to `_translationStatus` in **all three** language files, `absent` where you
  do not hold the official translation. A missing entry fails a test.

- **`purposeRef`** — one human line, always visible. What this tells *you*, not what it measures.
- **`aboutRef`** — the expandable science: what it measures, how it is scored, validation in plain
  terms, that it is screening not diagnosis, item count, licensing.
- **`reflectionRef`** per band — supportive, second person, and **never a disorder label**. No
  "disorder", "diagnos-", "PTSD", "bipolar", "you have". A test enforces this. Write "low mood",
  not "depression"; describe the weight someone is carrying, not a category they belong to.

## 4. Wire it into the flow, if it routes

Nobody sees every instrument. A new Type-1 instrument needs a way to be reached — either a
`branchesTo` entry on an earlier instrument, or a trigger in `config/routing/flow.json`. Every flow
trigger carries a `because` line a clinician can read.

Type-2 (`progress`) instruments are not in the funnel; they are taken deliberately over time.

## 5. Verify

```bash
npm test              # band coverage, ref resolution, licensing, no-label, translation status
npm run typecheck
npm run rules:print   # confirm it reads correctly on the clinician sign-off sheet
```

Then say plainly what still needs clinician sign-off: the band thresholds, which deep-dive fires at
what level, and the reflection copy. All clinical content is provisional until that happens.
