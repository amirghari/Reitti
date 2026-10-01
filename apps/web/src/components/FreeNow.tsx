/**
 * "Free, right now" and the trust row: the foot of the landing page.
 *
 * The three services are read from `config/directory` with the same functions
 * the rest of the app uses, and nothing here is hard-coded. They are the free
 * `care` entries a person can use today: `role: 'care'` excludes navigators
 * that only route somewhere, and `gated-care` is excluded too, because a
 * programme behind a doctor's referral is not "right now".
 */
import { orderFreeFirst } from '@reitti/engine';
import { directory } from '../config';
import { t } from '../i18n';
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
      <section className="landing-band is-bg" id="free-now">
        <div className="wrap free-now">
          {/* Focusable so "You can stop any time" can land a person here. */}
          <h2 className="section-title" id="free-now-title" tabIndex={-1} data-reveal>
            {t('home.free.title')}
          </h2>
          <p className="free-now-lede">{t('home.free.lede')}</p>
          <ul className="option-list">
            {freeNow.map((entry, index) => (
              <OptionCard key={entry.id} entry={entry} careLanguage={careLanguage} showCost={false} revealIndex={index} />
            ))}
          </ul>
        </div>
      </section>

      {/* Plain sentences. No stats and no logos: the claims here are checkable,
          and a logo is not a claim. No action either; this section is only
          something to read. */}
      <section className="landing-band is-surface">
        <div className="wrap">
          <h2 className="section-title" data-reveal>{t('home.trust.title')}</h2>
          <div className="trust-row">
            {(['reviewer', 'crisis', 'privacy'] as const).map((key, i) => (
              <p key={key} data-reveal style={{ ['--i' as string]: i }}>
                {t(`home.trust.${key}`)}
              </p>
            ))}
          </div>
        </div>
      </section>

      {/* The crisis strip that used to close this page is the footer's crisis
          block now, one scroll further, rendered by the same component from the
          same config. Two blocks of the same numbers a screen apart was part of
          what read as a wall. */}
    </>
  );
}
