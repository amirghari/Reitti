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

describe('the hero reads as one thought stepping down', () => {
  it('leads with what Reitti is, then what it promises, then how', () => {
    for (const language of UI_LANGUAGES) {
      const ui = strings('ui', language);
      expect(ui['home.title'], `${language} has no headline`).toBeTruthy();
      expect(ui['home.subtitle'], `${language} has no subtitle`).toBeTruthy();
      expect(ui['home.lede'], `${language} has no lede`).toBeTruthy();
    }
  });

  it('the headline is the access-layer line, not a label above it', () => {
    // It used to sit in an eyebrow above the real heading. It is the heading now,
    // so the eyebrow key must be gone rather than quietly orphaned.
    expect(strings('ui', 'en')['home.title']).toMatch(/access layer/i);
    for (const language of UI_LANGUAGES) {
      expect(strings('ui', language)['home.eyebrow'], `${language} still has an eyebrow`).toBeUndefined();
    }
  });

  it('each hero line is shorter than the one it introduces', () => {
    // A headline longer than its own subtitle is not a headline.
    for (const language of UI_LANGUAGES) {
      const ui = strings('ui', language);
      expect(ui['home.title'].length, language).toBeLessThan(ui['home.subtitle'].length);
      expect(ui['home.subtitle'].length, language).toBeLessThan(ui['home.lede'].length);
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
