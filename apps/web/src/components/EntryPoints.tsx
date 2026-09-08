/**
 * The public entry point (A1).
 *
 * Terapianavigaattori and Mielenterveystalo are first-class destinations *here*,
 * on the front door, not on the result screen. The assessment is a way in, not a
 * toll gate: a routing tool that hides the free public options behind its own
 * questionnaire has quietly made itself the destination.
 *
 * The case that made this obvious: someone who already holds a Terapianavigaattori
 * consent code should never have to answer twelve screening questions to be told
 * they did not need to.
 */
import { orderFreeFirst, type DirectoryEntry } from '@reitti/engine';
import { directory, entryPoints } from '../config';
import { t } from '../i18n';
import { OptionCard } from './Options';

export function EntryPoints({ careLanguage = 'fi' }: { careLanguage?: string }) {
  const entries = orderFreeFirst(
    entryPoints.entryIds
      .map((id) => directory.find((e) => e.id === id))
      .filter((e): e is DirectoryEntry => e !== undefined)
      // Free, domestic, no referral. Enforced here as well as in config so a
      // later edit to the id list cannot quietly put a paid or international
      // service on the front door.
      .filter((e) => e.costBand === 'free' && e.origin === 'domestic' && !e.fallbackOnly),
    { careLanguage },
  );

  if (entries.length === 0) return null;

  return (
    <section className="entry-points">
      <h2 className="entry-points-heading">{t('entryPoints.heading')}</h2>
      <p className="entry-points-help">{t('entryPoints.help')}</p>

      <ul className="option-list">
        {entries.map((entry) => (
          <OptionCard key={entry.id} entry={entry} careLanguage={careLanguage} />
        ))}
      </ul>

      <p className="entry-points-foot">{t('entryPoints.foot')}</p>
    </section>
  );
}
