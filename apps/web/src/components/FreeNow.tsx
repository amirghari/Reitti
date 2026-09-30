/**
 * "Free, right now", the trust row, and the crisis strip: the foot of the
 * landing page.
 *
 * The three services are read from `config/directory` with the same functions
 * the rest of the app uses, and nothing here is hard-coded. They are the free
 * `care` entries a person can use today: `role: 'care'` excludes navigators
 * that only route somewhere, and `gated-care` is excluded too, because a
 * programme behind a doctor's referral is not "right now".
 *
 * The crisis strip renders from `config/crisis.json`. No number is typed into
 * this file. The design export shows 09 2525 0113 and 116 006; the first is on
 * our closed list, confirmed closed by MIELI, and the second is in no config we
 * hold. Numbers come from the file that has a source and a date on every line.
 */
import { orderFreeFirst } from '@reitti/engine';
import { directory } from '../config';
import { t } from '../i18n';
import { CrisisLines } from './CrisisLines';
import { OptionCard } from './Options';

/** Free, usable today, domestic, and the support itself rather than a route to it. */
const freeNow = orderFreeFirst(
  directory.filter(
    (entry) =>
      entry.role === 'care' &&
      entry.costBand === 'free' &&
      entry.origin === 'domestic' &&
      !entry.fallbackOnly &&
      !entry.audienceRef,
  ),
).slice(0, 3);

export function FreeNow({ careLanguage = 'fi' }: { careLanguage?: string }) {
  return (
    <>
      <section className="wrap free-now">
        <h2 className="section-title" data-reveal>{t('home.free.title')}</h2>
        <p className="free-now-lede">{t('home.free.lede')}</p>
        <ul className="option-list">
          {freeNow.map((entry, index) => (
            <OptionCard
              key={entry.id}
              entry={entry}
              careLanguage={careLanguage}
              showCost={false}
              reveal="up"
              revealIndex={index}
            />
          ))}
        </ul>
      </section>

      {/* Plain sentences. No stats and no logos: the claims here are checkable,
          and a logo is not a claim. */}
      <section className="wrap trust-row">
        <p>{t('home.trust.reviewer')}</p>
        <p>{t('home.trust.crisis')}</p>
        <p>{t('home.trust.privacy')}</p>
      </section>

      <section className="crisis-strip">
        <div className="wrap">
          <h2 className="crisis-strip-title">{t('home.crisisStrip.title')}</h2>
          <CrisisLines />
          <p className="crisis-strip-foot">{t('crisis.ifClosed')}</p>
        </div>
      </section>
    </>
  );
}
