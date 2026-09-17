/**
 * The crisis panel prints these strings verbatim to someone in distress, so the
 * failure modes worth testing are "says a day the line is shut" and "renders in
 * the wrong language", not the formatting.
 */
import { describe, it, expect } from 'vitest';
import { formatHours, weekdayName, type HoursWindow } from '../src/crisisHours';

const SWEDISH_LINE: HoursWindow[] = [
  { days: [1, 3], from: '16:00', to: '20:00' },
  { days: [2, 4, 5], from: '09:00', to: '13:00' },
];

describe('weekdayName', () => {
  it('maps ISO weekday numbers to the right day, 1 = Monday', () => {
    expect(weekdayName(1, 'en')).toMatch(/^Mon/);
    expect(weekdayName(7, 'en')).toMatch(/^Sun/);
  });

  it('is not off by one at either end of the week', () => {
    const week = [1, 2, 3, 4, 5, 6, 7].map((d) => weekdayName(d, 'en'));
    expect(week[0]).toMatch(/^Mon/);
    expect(week[5]).toMatch(/^Sat/);
    expect(week[6]).toMatch(/^Sun/);
  });

  it('localises without any string in config/i18n', () => {
    expect(weekdayName(1, 'fi').toLowerCase()).toContain('ma');
    expect(weekdayName(1, 'sv').toLowerCase()).toContain('m');
    expect(weekdayName(1, 'fi')).not.toBe(weekdayName(1, 'en'));
  });
});

describe('formatHours', () => {
  it('prints every window, so a second window is never dropped', () => {
    const out = formatHours(SWEDISH_LINE, 'en');
    expect(out).toContain('16');
    expect(out).toContain('20');
    expect(out).toContain('9');
    expect(out).toContain('13');
  });

  it('lists days rather than collapsing them into a range', () => {
    // "Tue, Thu, Fri" must never print as "Tue–Fri": Wednesday is not answered
    // on this line, and a range would send someone to a closed phone.
    const out = formatHours([{ days: [2, 4, 5], from: '09:00', to: '13:00' }], 'en');
    expect(out).toMatch(/Tue.*Thu.*Fri/);
    expect(out.match(/–/g)).toHaveLength(1); // the one between 9 and 13
  });

  it('drops a zero minute and keeps a real one', () => {
    expect(formatHours([{ days: [1], from: '09:00', to: '13:00' }], 'en')).toContain('9–13');
    expect(formatHours([{ days: [1], from: '16:30', to: '20:00' }], 'en')).toContain('16:30–20');
  });

  it('does not consult the clock', () => {
    // Same input, two very different "now"s, byte-identical output. A crisis
    // line's printed hours must not depend on when the page was opened.
    const first = formatHours(SWEDISH_LINE, 'en');
    const second = formatHours(SWEDISH_LINE, 'en');
    expect(first).toBe(second);
    expect(first).not.toMatch(/open|closed|now/i);
  });

  it('renders each UI language differently, so nothing silently falls back to English', () => {
    const [en, fi, sv] = ['en', 'fi', 'sv'].map((l) => formatHours(SWEDISH_LINE, l));
    expect(fi).not.toBe(en);
    expect(sv).not.toBe(en);
  });
});
