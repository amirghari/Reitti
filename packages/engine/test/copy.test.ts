/**
 * House style for product copy.
 *
 * Not safety invariants — nobody is harmed by a dash. These are the rules that
 * keep `config/i18n/ui/` readable by somebody who is struggling rather than by
 * an investor, and they live in a test because style drifts back the moment it
 * is only written down in a comment.
 *
 * The clinician's surface (`clinical/`) and the service registry (`directory/`)
 * are deliberately exempt. Those are governed content: a clinician signs off on
 * that wording and it is not ours to restyle.
 */
import { describe, expect, it } from 'vitest';
import { feedback, strings, UI_LANGUAGES } from './helpers.js';

describe('product copy avoids the em dash', () => {
  // One em dash is a pause. Twenty across a page is a tic, and it reads as
  // breathless — which is the opposite of what someone anxious needs from a
  // page about getting help. Commas, colons and full stops do the same work.
  it('no UI string in any language contains one', () => {
    for (const language of UI_LANGUAGES) {
      const offenders = Object.entries(strings('ui', language))
        .filter(([, value]) => value.includes('—'))
        .map(([key]) => key);
      expect(
        offenders,
        `${language} UI copy contains em dashes: ${offenders.join(', ')}`,
      ).toEqual([]);
    }
  });

  it('covers the directory labels we wrote ourselves', () => {
    // Service names, hours and cost notes are ours to phrase even though they
    // describe someone else's service, so the same style applies. Nothing
    // factual was changed to satisfy it: the numbers are asserted below.
    for (const language of UI_LANGUAGES) {
      const offenders = Object.entries(strings('directory', language))
        .filter(([, value]) => value.includes('—'))
        .map(([key]) => key);
      expect(
        offenders,
        `${language} directory copy contains em dashes: ${offenders.join(', ')}`,
      ).toEqual([]);
    }
  });

  it('leaves the clinician’s surface alone', () => {
    // Asserted rather than assumed: this test must never be "fixed" by reaching
    // into instrument wording, band reflections or crisis copy and restyling
    // them. That content is signed off by a clinician and is not ours to edit.
    const clinical = Object.values(strings('clinical', 'en'));
    expect(clinical.some((v) => v.includes('—'))).toBe(true);
  });

  it('keeps the verified hours in the directory intact', () => {
    // The one thing restyling must never do is move a number. Somebody turning
    // up to a closed line because a comma became a full stop and took an hour
    // with it is the failure this guards against.
    const hours = strings('directory', 'en');
    expect(hours['directory.mieli-kristelefonen.hours']).toContain('16–20');
    expect(hours['directory.mieli-kristelefonen.hours']).toContain('9–13');
    expect(hours['directory.sekasin.hours']).toContain('9–24');
    expect(hours['directory.sekasin.hours']).toContain('15–24');
    expect(hours['directory.arligt-talat.hours']).toContain('9–12');
    expect(hours['directory.arligt-talat.hours']).toContain('19–22');
    expect(hours['directory.mieli-chat-en.hours']).toContain('30 minutes');
  });

  it('leaves the 7 Cups caution exactly as the brief worded it', () => {
    // Case-insensitive only because the label opens the sentence.
    const caution = strings('directory', 'en')['directory.7cups.caution'].toLowerCase();
    expect(caution).toContain('international volunteer listeners');
    expect(caution).toContain('quality varies');
    expect(caution).toContain('not moderated in real time');
    expect(caution).toContain('not a crisis service');
  });
});

describe('the hero answers three questions', () => {
  // Review round 3 (D-32): the headline says something true but not what the
  // site is. Under it, three facts, one per row: what this is, what it costs,
  // what happens next. They replace the subtitle and the lede, which are gone
  // on purpose, so this also holds them gone rather than letting one drift back.
  it('has the three facts in every language, each one short line', () => {
    for (const language of UI_LANGUAGES) {
      const ui = strings('ui', language);
      for (const fact of ['what', 'cost', 'next']) {
        const line = ui[`home.fact.${fact}`];
        expect(line, `${language} has no home.fact.${fact}`).toBeTruthy();
        expect(line.length, `${language} home.fact.${fact} is not a short line`).toBeLessThanOrEqual(90);
      }
      expect(ui['home.subtitle'], `${language} still has a subtitle`).toBeUndefined();
      expect(ui['home.lede'], `${language} still has a lede`).toBeUndefined();
    }
  });

  it('the headline says what the site is, and the italic word is in it', () => {
    // Three reviewers in a row could not tell what the site was from the hook
    // line ("You don't have to know what's wrong..."), so the plain statement the
    // site launched with is back (D-37). It is a name for the thing, not a
    // sentence, so it no longer ends in a full stop. What holds: it is the
    // heading, no label sits above it, and the emphasised word is a substring of
    // it in every language, including inside a Finnish or Swedish compound.
    for (const language of UI_LANGUAGES) {
      const ui = strings('ui', language);
      expect(ui['home.title'], `${language} has no headline`).toBeTruthy();
      expect(ui['home.title'].includes(ui['home.title.em']), `${language}: emphasis not in headline`).toBe(true);
      expect(ui['home.eyebrow'], `${language} still has an eyebrow`).toBeUndefined();
      expect(ui['assessment.intro.title'], `${language} lost the old line`).toBeTruthy();
    }
  });
});

/**
 * The landing page's own copy, as it renders top to bottom, footer excluded:
 * the header, the hero, the ladder's framing, the three steps, "Free, right
 * now", the trust row and the feedback tab. Directory cards are service data
 * and are counted elsewhere, if anywhere. Add a key here when the landing
 * page starts rendering it.
 */
const LANDING_UI_KEYS = [
  'app.findYourPath', 'howItWorks.navLabel', 'home.whyBuilt', 'feedback.navLabel',
  'home.title', 'home.fact.what', 'home.fact.cost', 'home.fact.next', 'home.cta', 'home.browse', 'home.haveCode',
  'ladder.pyramid.title', 'ladder.pyramid.subline', 'ladder.pyramid.hint', 'ladder.pyramid.seeAll',
  'home.steps.title', 'home.step1.title', 'home.step1.body', 'home.step2.title', 'home.step2.body',
  'home.step3.title', 'home.step3.body', 'home.steps.link',
  'home.free.title', 'home.free.lede',
  'home.trust.title', 'home.trust.reviewer', 'home.trust.crisis', 'home.trust.privacy',
  'feedback.tabLabel',
];

describe('the landing page is a front door, not a wall of text (D-32)', () => {
  const ui = strings('ui', 'en');
  const words = (text: string) => text.split(/\s+/).filter(Boolean).length;

  it('every key it lists exists, so the count is of what really renders', () => {
    for (const key of LANDING_UI_KEYS) expect(ui[key], key).toBeTruthy();
  });

  it('is under 350 words in English', () => {
    const total = LANDING_UI_KEYS.reduce((n, key) => n + words(ui[key]), 0);
    expect(total).toBeLessThanOrEqual(350);
  });

  it('has no sentence over 20 words', () => {
    for (const key of LANDING_UI_KEYS) {
      for (const sentence of ui[key].split(/(?<=[.!?])\s+/)) {
        expect(words(sentence), `${key}: "${sentence}"`).toBeLessThanOrEqual(20);
      }
    }
  });

  it('keeps both facts in the reviewer line', () => {
    // Shorter must not mean less honest: who reviewed it, and that nobody
    // registered in Finland has yet.
    expect(ui['home.trust.reviewer']).toMatch(/Yasin Najafizadegan, PhD/);
    expect(ui['home.trust.reviewer']).toMatch(/No clinician registered in Finland/);
  });
});

describe('the product says "step", never "rung" (D-37)', () => {
  // "Rung" is the codename's word, and a non-native English reader did not know
  // it. Keys may keep it; no rendered ui or directory string may. A whole word,
  // so Swedish "ursprungliga" is not caught. Clinical copy is the clinician's
  // and is not part of this.
  it('no ui or directory string contains the word "rung"', () => {
    for (const bundle of ['ui', 'directory'] as const) {
      for (const language of UI_LANGUAGES) {
        for (const [key, text] of Object.entries(strings(bundle, language))) {
          expect(/\brungs?\b/i.test(text), `${bundle}/${language} ${key}: "${text}"`).toBe(false);
        }
      }
    }
  });
});

describe('the feedback section says what it is not', () => {
  // A feedback box on a mental-health site does not only receive product
  // feedback. It receives people describing their situation and asking for help.
  // The copy is the only thing standing between that person and an email nobody
  // reads tonight, so it is asserted rather than trusted.
  it('tells the person plainly that it is not a way to get help', () => {
    const patterns = {
      en: [/not a way to get help/i, /nobody is watching/i, /help button/i],
      // Finnish puts the negation on the verb: "eikä kukaan seuraa sitä".
      fi: [/ei ole tapa saada apua/i, /kukaan seuraa/i, /apupainiketta/i],
      sv: [/inte ett sätt att få hjälp/i, /ingen bevakar/i, /hjälpknappen/i],
    };
    for (const language of UI_LANGUAGES) {
      const notice = strings('ui', language)['feedback.notSupport'];
      expect(notice, `${language} has no not-support notice`).toBeTruthy();
      for (const pattern of patterns[language]) {
        expect(notice, `${language} notice is missing ${pattern}`).toMatch(pattern);
      }
    }
  });

  it('points at the crisis control rather than repeating a phone number', () => {
    // Crisis numbers have one verified home, in config/crisis.json. A second
    // copy here is a number that goes stale without anyone noticing.
    for (const language of UI_LANGUAGES) {
      const notice = strings('ui', language)['feedback.notSupport'];
      expect(notice, `${language} hard-codes a phone number`).not.toMatch(/\d{3}\s?\d{3,}/);
    }
  });

  it('publishes no mail address unless one is deliberately set', () => {
    // Null is the default and currently the shipped value. A mail address on a
    // public page is published permanently to every scraper that passes, and
    // the relay does not need the client to know it: the server delivers to
    // FEEDBACK_TO, which never reaches the browser.
    if (feedback.address === null) return;
    expect(feedback.address, 'address must be an email').toMatch(/^[^@\s]+@[^@\s]+\.[^@\s]+$/);
  });

  it('still has a way to reach us with no address published', () => {
    // The form and the address are independent channels. Guarding the section
    // on the address alone used to hide the form along with it.
    expect(
      feedback.formEnabled || feedback.address !== null,
      'no address and no form means the feedback section renders nothing at all',
    ).toBe(true);
  });

  it('carries a reason, like every other config decision here', () => {
    expect(feedback.because.length).toBeGreaterThan(40);
  });
});
