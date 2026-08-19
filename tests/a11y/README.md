# The accessibility suite

A real browser, the real routing spine, and axe-core pointed at every screen a
person can reach.

```bash
npm run test:a11y:setup   # once — downloads Chromium
npm run test:a11y         # starts the dev server and runs the gate
npm run test:a11y:report  # open the HTML report
```

## What is in here

| File                     | What it covers                                                        |
| ------------------------ | --------------------------------------------------------------------- |
| `axe.ts`                 | The scan helper and the failure threshold                              |
| `flow.ts`                | Walking `home → context → questions → result`, and the crisis panel    |
| `a11y.spec.ts`           | An axe scan of each of those screens                                   |
| `crisis-path.spec.ts`    | Safety invariants 1–4, checked in the DOM rather than in the config    |
| `interaction.spec.ts`    | Focus, announcements, honest progress, refresh durability, no repeats  |
| `wcag.spec.ts`           | Reflow at 320px, WCAG text spacing, `prefers-reduced-motion`           |

Every test runs in four projects (`playwright.config.ts`): **desktop**,
**forced-colors** (OS high-contrast, where anything carried by colour alone
disappears), **mobile**, and **mobile-safari** — WebKit, because Chrome-on-Android
emulation is still Chromium and iOS Safari is a different engine with its own
viewport, focus and on-screen-keyboard behaviour.

> `forcedColors` is **not** a Playwright fixture option. Written straight onto
> `use` it is accepted and silently dropped, which is how the forced-colors
> project ran as a duplicate of `desktop` for its whole life while reporting
> high-contrast coverage. It has to go in `contextOptions`. `reducedMotion` has
> the same trap; `page.emulateMedia()` is the safer way to reach it per-test.

## The threshold

`critical` and `serious` violations fail the run. `moderate` and `minor` are
attached to the report and printed instead. That is a ratchet, not a ceiling —
existing debt stays visible without wedging the pipeline, and the threshold
should tighten once the moderate list is empty.

## Why the crisis tests live here and not in the engine

`packages/engine/test/invariants.test.ts` proves the invariants hold in the
config and in the pure logic. It cannot see a control that renders off-screen, a
dialog that never takes focus, or a panel no keyboard can open — which is where
a crisis path actually fails a person. These tests cover that gap.

If one of them fails, the failure is correct and the feature is wrong. Never
edit a test to make a feature pass.

## What green does not mean

Automated rules cover roughly a third of WCAG. This suite is the floor: no
mechanical failure. It says nothing about whether the assessment is too long
before a payoff, whether the result lands with warmth, or whether the crisis
panel reads as calm rather than alarming. Those need a person — an expert
heuristic pass, and eventually consented, moderated sessions with people from
the target population.

`interaction.spec.ts` and `wcag.spec.ts` exist because axe reads the DOM and
cannot judge *behaviour*: where focus goes when a dialog opens and closes, what
a screen reader is told when the question swaps in place, whether the progress
bar agrees with the value it announces, whether a refresh throws the answers
away, or whether the same question gets asked twice. Each of those was a real
gap when the tests were written, not a hypothetical one.

Note the one thing that must **not** be added here: session recording, heatmaps
or any always-on behavioural analytics. The privacy claim is that answers never
leave the device, and this suite deliberately runs against a local dev server for
the same reason.

## Assertions and the clinician's copy

The helpers pick options by position, not by label. Every user-facing string on
these screens comes from `config/i18n`, which the clinician owns and is expected
to change without a code review — a test that asserted on that wording would
break on a copy edit and teach everyone to ignore it.

The two exceptions are deliberate: the crisis panel must name MIELI and 112, and
the result must say plainly that Reitti does not diagnose. Those are invariants,
not copy.
