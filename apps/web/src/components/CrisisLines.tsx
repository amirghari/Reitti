/**
 * The crisis lines, as the landing page's crisis strip and the footer show them.
 *
 * One component for both so they cannot drift, and one ordering for these and the
 * crisis panel. The strip used to render `config/crisis.json` in file order while
 * the panel sorted by language, so an English reader saw 112 first in the panel
 * and last on the page. The sort is the panel's, and its reasoning is D-21: since
 * MIELI closed its English line, an English reader's first line in their own
 * language is 112, so it leads.
 *
 * No number is typed here. Everything comes from the file that carries a source
 * and a date on every line.
 */
import { crisis } from '../config';
import { formatHours } from '../crisisHours';
import { t, uiLanguage } from '../i18n';

type CrisisResource = (typeof crisis.resources)[number];

/** Lines in the reader's language first; otherwise the file's own order. */
export function crisisLinesFor(language: string): CrisisResource[] {
  return [...crisis.resources].sort(
    (a, b) => Number(b.languages.includes(language)) - Number(a.languages.includes(language)),
  );
}

export function CrisisLines({ language = uiLanguage() }: { language?: string }) {
  const ui = uiLanguage();
  return (
    <ul className="crisis-strip-list">
      {crisisLinesFor(language).map((resource) => (
        <li key={resource.id}>
          <a href={`tel:${resource.phone.replace(/\s/g, '')}`} className="crisis-strip-call">
            <span className="crisis-strip-name">{t(resource.nameRef)}</span>
            <span className="crisis-strip-phone">{resource.phone}</span>
          </a>
          <span className="crisis-strip-hours">
            {resource.availability === '24/7'
              ? t('crisis.aroundTheClock')
              : resource.hours
                ? formatHours(resource.hours, ui)
                : t('crisis.limitedHours')}
          </span>
          {resource.languageNoteRef && !resource.languages.includes(language) && (
            <span className="crisis-strip-language">{t(resource.languageNoteRef)}</span>
          )}
        </li>
      ))}
    </ul>
  );
}
