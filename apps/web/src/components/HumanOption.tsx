/**
 * A person to talk to (C1), on every result screen.
 *
 * The gap the competitive review exposed: a tool that produces a band, a set of
 * rungs and a list of links, and no way to say any of it out loud to somebody.
 * This block is deliberately above the rungs — for a lot of people the useful
 * next step is a conversation, not a programme.
 *
 * The engine guarantees this is never empty (invariant 15). If it throws, that is
 * a config bug surfacing at build time, which is where it belongs.
 */
import { humanOptionFor, visitLink, type AgeBand } from '@reitti/engine';
import { directory, humanFallback } from '../config';
import { t, uiLanguage } from '../i18n';
import { OptionCard } from './Options';

export function HumanOption({
  careLanguage,
  ageBand = '30-plus',
}: {
  careLanguage: string;
  ageBand?: AgeBand;
}) {
  const person = humanOptionFor(directory, careLanguage, ageBand, humanFallback);
  const publicRoute = directory.find((e) => e.id === humanFallback.publicRouteEntryId);

  return (
    <section className="human-option">
      <h2 className="human-option-heading">{t('human.heading')}</h2>
      <p className="human-option-help">{t('human.help')}</p>

      <ul className="option-list">
        <OptionCard entry={person} careLanguage={careLanguage} detailed />
      </ul>

      {publicRoute && (
        <div className="human-public-route">
          <p className="human-public-route-label">{t('human.publicRoute')}</p>
          <p className="human-public-route-body">{t('human.ensijasennys')}</p>
          {(() => {
            // The health station's page in the reader's language, or labelled.
            const visit = visitLink(publicRoute, uiLanguage());
            return (
              <a className="option-link" href={visit.href} target="_blank" rel="noreferrer noopener">
                {visit.labelLanguage ? t(`directory.visitIn.${visit.labelLanguage}`) : t('directory.visit')}
              </a>
            );
          })()}
        </div>
      )}
    </section>
  );
}
