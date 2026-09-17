/**
 * Printing a crisis line's real opening hours.
 *
 * The panel used to label every limited-hours line "limited hours, check before
 * calling". Someone in distress at 2am then dials a number that does not answer
 * and is given no way to work out why, at the moment they have the least
 * capacity to. The hours are public, so print them.
 *
 * Deliberately clock-free. No "open now" badge, no `Date.now()`: the device
 * clock and timezone are not ours, DST moves, and a badge that says "open" over
 * a line that is closed is worse than no badge. Static hours plus the standing
 * "if a line is closed" note in the panel carry the same information and cannot
 * be wrong about the present moment.
 *
 * Day names come from `Intl` rather than from `config/i18n`, so fi/sv/en parity
 * here cannot drift: there is nothing to keep in sync.
 */

/** ISO weekdays, 1 = Monday .. 7 = Sunday, in the resource's own timezone. */
export interface HoursWindow {
  days: number[];
  from: string;
  to: string;
}

/** 2024-01-01 was a Monday, so day N is that date plus N-1 days. UTC throughout. */
const ISO_WEEK_START = Date.UTC(2024, 0, 1);
const DAY_MS = 86_400_000;

export function weekdayName(day: number, locale: string): string {
  const date = new Date(ISO_WEEK_START + (day - 1) * DAY_MS);
  return new Intl.DateTimeFormat(locale, { weekday: 'short', timeZone: 'UTC' }).format(date);
}

/** "09:00" reads as "9" and "16:30" stays "16:30". All three locales use a 24h clock. */
const clock = (hhmm: string): string => {
  const [hour, minute] = hhmm.split(':');
  return minute === '00' ? String(Number(hour)) : `${Number(hour)}:${minute}`;
};

/**
 * "Mon, Wed 16–20 · Tue, Thu, Fri 9–13".
 *
 * Days are listed rather than collapsed into ranges: the real windows are not
 * contiguous (Tue, Thu, Fri), and "Tue–Fri" would silently add a day the line
 * does not answer on.
 */
export function formatHours(windows: HoursWindow[], locale: string): string {
  return windows
    .map((w) => `${w.days.map((d) => weekdayName(d, locale)).join(', ')} ${clock(w.from)}–${clock(w.to)}`)
    .join(' · ');
}
