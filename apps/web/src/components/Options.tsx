/**
 * Where you can actually go.
 *
 * This component is value #1 of V2 made visible: public, Kela, third-sector and
 * private in one list, free routes first, with what each costs. It is the
 * difference between "start with structured online therapy" and "here are three
 * ways to start it this week, and this one is free."
 *
 * It orders; it never filters. The only entries missing from a list are ones the
 * age gate removed — see `entriesForRung` and invariant 12.
 */
import { entriesForRung, type AgeBand, type DirectoryEntry } from '@reitti/engine';
import type { Budget } from '@reitti/engine';
import { directory } from '../config';
import { t } from '../i18n';

interface OptionsProps {
  rungId: string;
  careLanguage: string;
  budget?: Budget;
  ageBand?: AgeBand;
  /** Rung 2 shows who-answers and anonymity on the card, not behind a disclosure. */
  detailed?: boolean;
}

export function Options({ rungId, careLanguage, budget, ageBand, detailed }: OptionsProps) {
  const entries = entriesForRung(directory, rungId, { careLanguage, budget, ageBand });

  if (entries.length === 0) {
    return <p className="option-empty">{t('directory.empty')}</p>;
  }

  return (
    <ul className="option-list" data-rung={rungId}>
      {entries.map((entry) => (
        <OptionCard key={entry.id} entry={entry} careLanguage={careLanguage} detailed={detailed} />
      ))}
    </ul>
  );
}

export function OptionCard({
  entry,
  careLanguage,
  detailed,
}: {
  entry: DirectoryEntry;
  careLanguage: string;
  detailed?: boolean;
}) {
  const speaksIt = entry.languages.includes(careLanguage);

  return (
    <li
      className="option-card"
      data-entry={entry.id}
      data-cost={entry.costBand}
      data-fallback={entry.fallbackOnly ? 'true' : undefined}
    >
      <div className="option-head">
        <h4 className="option-name">{t(entry.nameRef)}</h4>
        <span className="option-cost" data-cost-band={entry.costBand}>
          {t(`cost.band.${entry.costBand}`)}
        </span>
      </div>

      <p className="option-operator">
        {t('directory.label.operator')}: {entry.operator}
      </p>

      {entry.costNoteRef && <p className="option-cost-note">{t(entry.costNoteRef)}</p>}

      {/* The caution is part of the entry, not a footnote: an entry that carries
          one may never render without it (invariant 13). */}
      {entry.cautionRef && <p className="option-caution">{t(entry.cautionRef)}</p>}

      {/* Saying "this one is Finnish only" is the honest move. Hiding it would
          make the list look better and the person's afternoon worse. */}
      {!speaksIt && (
        <p className="option-language-warning">
          {t('directory.languageMismatch')}{' '}
          {entry.languages.map((l) => t(`directory.language.${l}`)).join(', ')}
        </p>
      )}

      <dl className={detailed ? 'option-facts option-facts-detailed' : 'option-facts'}>
        <div>
          <dt>{t('directory.label.hours')}</dt>
          <dd>{t(entry.hoursRef)}</dd>
        </div>
        <div>
          <dt>{t('directory.label.whoAnswers')}</dt>
          <dd>{t(`directory.whoAnswers.${entry.whoAnswers}`)}</dd>
        </div>
        <div>
          <dt>{t('directory.label.anonymity')}</dt>
          <dd>{t(`directory.anonymity.${entry.anonymity}`)}</dd>
        </div>
        <div>
          <dt>{t('directory.label.languages')}</dt>
          <dd>{entry.languages.map((l) => t(`directory.language.${l}`)).join(', ')}</dd>
        </div>
        <div>
          <dt>{t('directory.label.formats')}</dt>
          <dd>{entry.formats.map((f) => t(`directory.format.${f}`)).join(', ')}</dd>
        </div>
      </dl>

      {entry.hasConsentCode && (
        <p className="option-consent-code">{t('directory.terapianavigaattori.haveCode')}</p>
      )}

      <p className="option-actions">
        <a className="option-link" href={entry.url} target="_blank" rel="noreferrer noopener">
          {t('directory.visit')}
        </a>
        {entry.phone && <span className="option-phone">{entry.phone}</span>}
      </p>

      {/* Shown, not hidden: the date is the claim's expiry, and a person can see
          how old our information about a service actually is. */}
      <p className="option-verified mono">
        {t('directory.verifiedOn')} {entry.verifiedOn}
      </p>
    </li>
  );
}
