/**
 * The under-18 screen (C4).
 *
 * Reitti is an adult service and stays one. The thing that matters here is tone:
 * this has to read as a redirection to somewhere better, not as a door closing.
 * A fifteen-year-old who worked up the nerve to answer these questions and gets
 * told "you are not eligible" has been failed by us, not filtered by us.
 *
 * So: no rungs, no ladder, no cost table, no private options — just the services
 * built for their age, free and open now, and the crisis path which is for
 * everyone.
 */
import type { DirectoryEntry } from '@reitti/engine';
import { orderFreeFirst } from '@reitti/engine';
import { directory, youth } from '../config';
import { t } from '../i18n';
import { OptionCard } from './Options';
import { ScopeStatement } from './Result';

export function YouthResult({
  careLanguage,
  onRestart,
  onClearData,
}: {
  careLanguage: string;
  onRestart: () => void;
  onClearData: () => void;
}) {
  const entries = orderFreeFirst(
    youth.entryIds
      .map((id) => directory.find((e) => e.id === id))
      .filter((e): e is DirectoryEntry => e !== undefined),
    { careLanguage },
  );

  return (
    <section className="youth-result">
      <header className="result-header">
        <h1 className="section-title">{t('youth.heading')}</h1>
      </header>

      {/* Invariant 4 applies to every screen that ends the flow, this one
          included: a person told "not for you" still has to be told plainly
          that nothing here was a diagnosis. */}
      <p className="disclaimer">{t('app.notDiagnosis')}</p>

      <p className="prose">{t('youth.body')}</p>

      <ul className="option-list">
        {entries.map((entry) => (
          <OptionCard key={entry.id} entry={entry} careLanguage={careLanguage} detailed />
        ))}
      </ul>

      <p className="youth-crisis-note">{t('youth.crisisNote')}</p>

      <ScopeStatement />

      <div className="panel-actions no-print">
        <button type="button" className="btn btn-secondary" onClick={onRestart}>
          {t('result.restart')}
        </button>
      </div>

      <button type="button" className="link danger no-print" onClick={onClearData}>
        {t('result.clearData')}
      </button>
    </section>
  );
}
