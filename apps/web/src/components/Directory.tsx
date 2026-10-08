/**
 * "/directory": every service in one list, with two filters (D-37).
 *
 * The data was already structured; the reviewer asked to be able to use it.
 * Filter by the language a service is offered in and by how you reach it. A
 * service matches a filter when it offers any of the values chosen in it, and
 * must match both filters when both are set. With nothing chosen, everything
 * shows.
 *
 * These filters are for this list only. On the ladder, budget and language
 * reorder and never hide a step (CLAUDE.md), and nothing here changes that.
 *
 * The filters live in the address, so a filtered view can be shared or placed:
 * `/directory?spoken=en&how=chat`. "spoken", not "lang": `lang` is the
 * interface language, and a filter for English-speaking services must not turn
 * the whole site into English. `?entry=<id>` opens the list at one service.
 */
import { useEffect, useMemo, useState } from 'react';
import { orderFreeFirst, type DirectoryEntry } from '@reitti/engine';
import { directory } from '../config';
import { t, uiLanguage } from '../i18n';
import { OptionCard } from './Options';

/** Languages a service may be offered in: the interface languages first, then any other in config. */
const LANGUAGES = [...new Set(['fi', 'sv', 'en', ...directory.flatMap((e) => e.languages)])];
/** Ways to reach a service, in the order they read most naturally. */
const FORMATS = [
  ...new Set(['phone', 'chat', 'in-person', 'video', 'group', 'self-guided', ...directory.flatMap((e) => e.formats)]),
].filter((f) => directory.some((e) => (e.formats as string[]).includes(f)));

const ALL = orderFreeFirst(directory) as DirectoryEntry[];

const readList = (params: URLSearchParams, key: string, allowed: string[]): string[] =>
  (params.get(key) ?? '').split(',').filter((v) => allowed.includes(v));

export function Directory() {
  const initial = useMemo(() => new URLSearchParams(window.location.search), []);
  const focusEntry = initial.get('entry');
  // Arriving at one service shows the whole list, so that service is in it.
  const [spoken, setSpoken] = useState<string[]>(() => (focusEntry ? [] : readList(initial, 'spoken', LANGUAGES)));
  const [how, setHow] = useState<string[]>(() => (focusEntry ? [] : readList(initial, 'how', FORMATS)));

  // Keep the address in step, so the view can be shared as it stands.
  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.delete('entry');
    for (const [key, values] of [['spoken', spoken], ['how', how]] as const) {
      if (values.length) url.searchParams.set(key, values.join(','));
      else url.searchParams.delete(key);
    }
    window.history.replaceState(window.history.state, '', url);
  }, [spoken, how]);

  // Open at one service: bring its card into view and to the screen reader.
  useEffect(() => {
    if (!focusEntry) return;
    const card = document.querySelector<HTMLElement>(`.directory-list [data-entry="${CSS.escape(focusEntry)}"]`);
    if (!card) return;
    card.classList.add('is-target');
    card.setAttribute('tabindex', '-1');
    card.scrollIntoView({ block: 'center' });
    card.focus({ preventScroll: true });
  }, [focusEntry]);

  const shown = ALL.filter(
    (e) =>
      (spoken.length === 0 || e.languages.some((l) => spoken.includes(l))) &&
      (how.length === 0 || (e.formats as string[]).some((f) => how.includes(f))),
  );

  // Which care language the cards check against: the one filtered for, if just
  // one, otherwise the language the person is reading in.
  const careLanguage = spoken.length === 1 ? spoken[0] : uiLanguage();

  const toggle = (setter: (f: (v: string[]) => string[]) => void, value: string) =>
    setter((current) => (current.includes(value) ? current.filter((v) => v !== value) : [...current, value]));
  const reset = () => {
    setSpoken([]);
    setHow([]);
  };

  return (
    <div className="wrap directory-page">
      <h1 className="section-title directory-title">{t('directory.page.title')}</h1>
      <p className="directory-lede">{t('directory.page.lede')}</p>

      <div className="directory-filters">
        <fieldset className="directory-filter">
          <legend>{t('directory.filter.language')}</legend>
          {LANGUAGES.map((code) => (
            <button
              key={code}
              type="button"
              className="filter-chip"
              aria-pressed={spoken.includes(code)}
              onClick={() => toggle(setSpoken, code)}
            >
              {t(`directory.language.${code}`)}
            </button>
          ))}
        </fieldset>
        <fieldset className="directory-filter">
          <legend>{t('directory.filter.how')}</legend>
          {FORMATS.map((format) => (
            <button
              key={format}
              type="button"
              className="filter-chip"
              aria-pressed={how.includes(format)}
              onClick={() => toggle(setHow, format)}
            >
              {t(`directory.format.${format}`)}
            </button>
          ))}
        </fieldset>
      </div>

      {/* Announced, so a filter change is heard and not only seen. */}
      <p className="directory-count" role="status">
        {t('directory.page.count').replace('{shown}', String(shown.length)).replace('{total}', String(ALL.length))}
      </p>

      {shown.length === 0 ? (
        <p className="directory-none">
          {t('directory.filter.none')}{' '}
          <button type="button" className="link" onClick={reset}>
            {t('directory.filter.reset')}
          </button>
        </p>
      ) : (
        <ul className="option-list directory-list">
          {shown.map((entry) => (
            <OptionCard key={entry.id} entry={entry} careLanguage={careLanguage} />
          ))}
        </ul>
      )}
    </div>
  );
}
