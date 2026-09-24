# Task: migrate Mielenreitti to the v2 visual design

Read `CLAUDE.md` first. Every rule in it still applies. This task changes the **shape** of the app,
never its message, its clinical content, its routing, or its safety behaviour.

Reference design: `docs/design/mielenreitti-redesign-v2.dc.html` (Claude Design export, committed
with this task). Treat it as a picture, not as code: it uses a template syntax, CDN fonts and CDN
images, and invents crisis numbers. Copy its look; take nothing else from it.

## 0. What does not change

- **Functionality.** Questionnaires, tiered funnel, scoring, bands, reflections, ladder, directory,
  entry points, rating widget, feedback form, share/summary, language switch, preview banner, crisis
  control on every screen. Every existing test stays green; no test is edited to pass.
- **Copy.** All user-facing strings stay in `config/i18n`. The design's copy is English-only sample
  text; where it differs from current strings, keep the current string unless a line is listed in
  §6. Never touch `config/i18n/*/clinical`.
- **`RECOMMEND_RUNG` off.** The design's results frame shows one "Talking support" card and a "you
  are here" marker on a rung. That is the regulated act the flag prevents. Results render band +
  reflection + 2–3 rungs in ladder order with no visual, positional or textual distinction, exactly
  as today. The route-line marker may show the **band**; it never points at a rung.
- **Crisis content.** The design shows 09 2525 0113 and 116 006; neither is in `config/crisis.json`
  and neither is verified. The crisis strip, crisis panel and under-18 screen render **only** from
  `config/crisis.json` (112 first for English; 0111 24/7 "answered in Finnish"; 0112 with its
  verified hours; `closedLines` never rendered). No crisis number is ever typed into a component.
- **No CDN.** Fonts via `@fontsource-variable/fraunces` and `@fontsource-variable/inter`, self-hosted.
  Photos downloaded into `apps/web/public/img/`, never hot-linked. `connect-src`/`img-src` in
  `apps/web/vercel.json` stay unchanged.
- **Reduced motion is the base case.** Finished state renders by default; animation exists only
  inside `@media (prefers-reduced-motion: no-preference)` **and** behind a `js-motion` class added on
  mount. If either is absent, nothing is hidden and nothing moves.
- **Em dash rule.** New product copy uses commas, full stops or a colon. `copy.test.ts` enforces it.

## 1. Tokens (replace, do not add alongside)

Put these in the global stylesheet as CSS custom properties and delete the old ones. Every
component reads tokens; no hex values in component files.

```
--bg:           #F8F7F4   warm white, page background
--surface:      #EEF2EF   pale mist, secondary sections
--line:         #DDE3E0   1px borders
--text:         #1E2A2B
--muted:        #5B6A6B
--primary:      #1F6B5E   actions, route line, links
--primary-deep: #164F45   hover / pressed
--tint:         #D7EAE4   selected state, free-rung fill
--sun:          #F2C14E   ONLY: italic-word underline, FREE chip, current-step dot
--crisis:       #6E3B4E   ONLY: crisis strip, crisis screens, crisis control
--band-1..5:    #D7EAE4 → #9FCBBE → #5C9C8C → #1F6B5E → #164F45
--radius:       12px
--shadow:       none
--font-display: 'Fraunces Variable', Georgia, serif
--font-body:    'Inter Variable', system-ui, sans-serif
```

Rules: no shadows anywhere (depth = `--bg` vs `--surface`). `--sun` is never a button. The band ramp
is one hue; never green/amber/red. The crisis colour appears nowhere except crisis UI.

## 2. Typography

- Display: Fraunces, `font-variation-settings: "opsz" 144, "SOFT" 100`, weight 500, line-height 1.05,
  letter-spacing -0.01em. Section headings 40–56px desktop, 32px mobile, left-aligned. One italic
  word per headline (already marked in the design's copy).
- Body/UI: Inter 400/500/600, 17px/1.6, max-width 62ch.
- Numerals for the three steps: Fraunces 96px, `--primary`.
- **Remove**: all eyebrow labels, all letterspaced uppercase (cost chips excepted), the old
  Newsreader/Public Sans/Plex Mono imports once nothing references them.
- Test Finnish and Swedish bundles at their longest strings (~30% longer than English) on 390px;
  headlines must wrap, never overflow.

## 3. Screens: what moves, what stays still

**Landing (`/`) — the only screen with motion and photos.** Rebuild in this order, one commit each:

1. Header: wordmark in Fraunces, language switch, crisis control (`--crisis`), feedback link.
2. Hero: full-bleed photo, gradient overlay only behind the text block (left 55%, 0.75→0), photo at
   full exposure elsewhere. Hook line as display type. Primary button + text link. Crisis line
   visible in the hero. Entry points (Terapianavigaattori, Mielenterveystalo) stay on the front door
   as today (invariant 21), directly under the hero.
3. "Find your way in three steps": vertical sequence, numeral left, heading + one sentence right,
   1px rule between rows. No cards, no icons.
4. Ladder: see §4.
5. "Free, right now": three `role: care` entries from `config/directory`, cost chip, language tags,
   "how to reach". Same data source as the directory; nothing hard-coded.
6. Trust row: reviewer credit, "crisis contacts verified with MIELI ry", "no account, nothing leaves
   your device". Plain text. No stats, no logos.
7. Crisis strip: `--crisis`, sticky bottom on mobile, rendered from `config/crisis.json`.

**Questionnaire, results, directory, crisis, under-18, feedback form.** New tokens and type only.
Same layout, same components, same order. No photos, no scroll motion. One column, 640px, `--bg`.
Answer cards: 1px `--line`, `--tint` fill + `--primary` border when selected. Progress: the route
line (§5) replaces the current progress bar, same aria attributes, same labels.

**Directory.** Wider grid (3 columns desktop, 1 mobile), cards as today with the new tokens. The
design's photo header is fine here **if** it is the same self-hosted photo as the hero; otherwise
skip it. No motion.

## 4. The ladder (pyramid)

Data from `config/ladder` as today; nothing in the component knows rung names.

- Shape: inverted staircase. Rung 1 widest at the bottom, rung 5 narrowest at the top. Desktop:
  each rung 48px narrower than the one below, centred. Mobile: plain full-width list, rung 1 first.
- Drawn as one continuous SVG outline, 1.5px `--primary`. Rungs with a free `care` or `gated-care`
  entry are filled `--tint`; rungs where free care has run out are unfilled. This is a rendering of
  existing `role` data, not a new claim.
- Labels on the steps: rung name, cost chip (FREE in `--sun`, others neutral).
- Interaction: each rung is a `<button aria-expanded>`. The active rung expands a panel to the right
  (below on mobile) with up to two directory entries for that rung, the cost label, and "see all
  N" linking to the directory pre-filtered. Rung 1 open by default. Keyboard: arrow keys move
  between rungs, Enter/Space toggles, panel is `aria-controls`-linked.
- Line under the heading, in `config/i18n/*/ui`: "Start low. You can always move up." (no em dash).
- Budget or language never hide a rung (rule in CLAUDE.md).

## 5. Motion (landing only)

Implement one small hook, `useReveal()`, on `IntersectionObserver` (threshold 0.15, once). It adds
`is-visible`. All motion is CSS transitions keyed on that class, inside the reduced-motion query,
behind `.js-motion`. No animation library. No motion that exists for its own sake: everything that
moves is a real element arriving.

| Element | Effect |
|---|---|
| Hero photo | `transform: scale(1)→scale(1.06)` over 20s, ease-out, once, on load |
| Hero text block | opacity 0→1, translateY 12px→0, 500ms, 150ms after load |
| Each section heading | opacity 0→1, translateY 16px→0, 400ms on reveal |
| Three-steps rows | stagger 90ms, same transition; numeral counts 00→0N over 600ms |
| Ladder | SVG outline draws itself (`stroke-dashoffset`), 900ms; rungs fade in bottom-up, 80ms stagger |
| "Free, right now" cards | stagger 80ms, same transition |
| Ladder panel open/close | height auto via grid-template-rows 0fr→1fr, 250ms |
| Route line (questionnaire) | dot moves between steps 200ms; that is the only motion off the landing page |

Never: parallax, floating shapes, the "ball on a string", auto-playing carousels, anything on the
crisis path. Easing `cubic-bezier(.2,.7,.2,1)`. `will-change` only on the hero image.

## 6. Copy changes (ui bundles only, all three languages)

Only these lines change; everything else keeps its current string.

- Hook line (en): "You don't have to know what's wrong to find the right help." FI/SV drafts are
  placeholders marked `needsNativeReview: true` until the B8 pass.
- Ladder subline: "Start low. You can always move up."
- Section headings: "Find your way in three steps.", "Help comes in many sizes. Start on the rung
  that fits.", "Free, right now."

## 7. Photos

- Download the two Unsplash photos referenced in the design into `apps/web/public/img/`, resized
  (hero 2000w + 1000w, WebP, `<picture>` with fallback). Add `apps/web/public/img/CREDITS.md` with
  photographer, Unsplash photo URL, licence URL, date downloaded.
- Stop if either photo page shows anything other than the standard Unsplash licence; leave a
  placeholder gradient and note it in the PR.
- `alt` text describes the scene, never the mood ("two people at a table by a window", not
  "feeling supported").

## 8. Verification before each commit

```
npm test && npm run typecheck && npm run test:a11y && npm run build
```

Plus, manually:
- Contrast: `--primary` on `--bg` and `--muted` on `--surface` at 15px must pass AA; darken to
  `--primary-deep` where they fail. Crisis strip text on `--crisis` ≥ 7:1.
- Disable JavaScript: every landing section is fully visible. Enable "reduce motion": nothing moves.
- Crisis control reachable on every screen, including with the ladder panel open.
- Lighthouse on `/`: no external requests except the app's own origin.
- Run in `fi` and `sv` at 390px.

## 9. Commit order

1. Tokens + fonts + type scale (visual change everywhere, no layout change). Screenshot before/after.
2. Landing header + hero + entry points.
3. Three steps.
4. Ladder component + panel.
5. Free right now + trust row + crisis strip.
6. Motion hook and transitions.
7. Flow screens token pass, route-line progress.
8. Directory grid.
9. `docs/v2-decisions.md`: add D-27 "Visual redesign, Sept 2026" with the token sheet, the
   reduced-motion rule, and the two things deliberately not taken from the design (single
   suggested rung on results; unverified crisis numbers).

Deploy with `vercel deploy --prod --yes` only after step 9.
