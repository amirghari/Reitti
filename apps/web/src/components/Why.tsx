/**
 * "Why we built this": the argument for the product, off the front door.
 *
 * Two reviews said the landing page read as a pitch, not a front door, and this
 * was the pitch: the two values, the five gaps, the comparison of a search
 * today against one here, and what is coming. It is addressed to a partner, a
 * clinician or an investor. A person deciding whether to answer twelve questions
 * about how they feel does not need to read it first.
 *
 * Nothing was reworded on the way. The sections, their copy keys and their
 * styling are the ones the landing page had (D-32).
 */
import { useState } from 'react';
import { t } from '../i18n';
import { Previews } from './Previews';

const GAP_NUMBERS = ['01', '02', '03', '04', '05'] as const;
const TODAY_STEP_KEYS = [1, 2, 3, 4, 5, 6, 7] as const;

// "Get a suggested rung" is gone on purpose: with RECOMMEND_RUNG off the product
// does not suggest a rung, and nothing may promise one.
const REITTI_STEP_KEYS = [1, 2, 3, 4] as const;

export function Why() {
  // The comparison reveals one dead end at a time. Reading the friction beats
  // being told about it, and it costs one piece of state.
  const [revealed, setRevealed] = useState(1);

  return (
    <div className="why-page">
      <header className="wrap why-head">
        <h1 className="section-title">{t('home.whyBuilt')}</h1>
      </header>

      <section className="band">
        <div className="wrap" style={{ paddingBlock: '3.9rem 4.2rem' }}>
          <p className="eyebrow" style={{ marginBottom: '0.5rem' }}>
            {t('home.values.eyebrow')}
          </p>
          <p className="prose" style={{ margin: '0 0 1.9rem', maxWidth: '60ch' }}>
            {t('home.values.lede')}
          </p>
          <div className="grid grid-2">
            <article className="value-card">
              <p className="value-eyebrow">{t('home.value1.eyebrow')}</p>
              <h2 className="value-title">{t('home.value1.title')}</h2>
              <p className="value-body">{t('home.value1.body')}</p>
              <p className="value-foot">{t('home.value1.foot')}</p>
            </article>
            <article className="value-card">
              <p className="value-eyebrow">{t('home.value2.eyebrow')}</p>
              <h2 className="value-title">{t('home.value2.title')}</h2>
              <p className="value-body">{t('home.value2.body')}</p>
              <p className="value-foot">{t('home.value2.foot')}</p>
            </article>
          </div>
        </div>
      </section>

      <section className="band">
        <div className="wrap" style={{ paddingBlock: '3.9rem' }}>
          <h2 className="section-title">{t('home.gaps.title')}</h2>
          <p className="prose" style={{ margin: '0.6rem 0 2.4rem' }}>
            {t('home.gaps.lede')}
          </p>
          <div className="grid grid-3">
            {GAP_NUMBERS.map((num) => (
              <div key={num} className="gap-card">
                <div className="gap-num">{num}</div>
                <h3>{t(`home.gap.${num}.title`)}</h3>
                <p>{t(`home.gap.${num}.body`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="band">
        <div className="wrap" style={{ paddingBlock: '3.9rem' }}>
          <h2 className="section-title">{t('home.compare.title')}</h2>
          <p className="prose" style={{ margin: '0.6rem 0 2.2rem' }}>
            {t('home.compare.lede')}
          </p>
          <div className="grid grid-2">
            <div className="compare-col">
              <div className="compare-head">
                <h3>{t('home.compare.today')}</h3>
                <button
                  type="button"
                  className="link"
                  onClick={() => setRevealed(revealed >= TODAY_STEP_KEYS.length ? 1 : revealed + 1)}
                >
                  {revealed >= TODAY_STEP_KEYS.length
                    ? t('home.compare.startOver')
                    : t('home.compare.next')}
                </button>
              </div>
              <div className="step-list">
                {TODAY_STEP_KEYS.map((key, i) => {
                  const label = t(`home.today.${key}`);
                  const shown = i < revealed;
                  const dead = i > 0;
                  // An unrevealed step renders as a redacted placeholder with no
                  // text at all, rather than as faint text. Faint text is a half
                  // measure: it fails contrast for the sighted reader it is meant
                  // to tease, and `aria-hidden` hides it from everyone else. The
                  // placeholder says the same thing — "there is more coming" — to
                  // both, and holds the row height so the reveal does not jump.
                  return (
                    <div
                      key={key}
                      className={`step ${shown ? '' : 'pending'} ${shown && dead ? 'dead' : ''}`}
                      aria-hidden={!shown}
                    >
                      {shown ? (
                        <>
                          <span className="step-mark">{dead ? '×' : '→'}</span>
                          <span>{label}</span>
                        </>
                      ) : (
                        <>
                          <span className="step-mark step-mark-pending" />
                          <span className="step-redacted" />
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="compare-col reitti">
              <div className="compare-head">
                <h3>{t('home.compare.reitti')}</h3>
              </div>
              <div className="step-list">
                {REITTI_STEP_KEYS.map((key) => (
                  <div key={key} className="step good">
                    <span className="step-mark">✓</span>
                    <span>{t(`home.reitti.${key}`)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="wrap" style={{ paddingBlock: '3.4rem 1rem' }}>
        <div className="grid grid-3">
          <div className="entry-card">
            <h3>{t('home.entry2.title')}</h3>
            <p>{t('home.entry2.body')}</p>
            {/* Button-shaped and in the button's place, so the row reads as three
                ways in with one not open yet, rather than as a broken card. Native
                `disabled` keeps it out of the tab order; nothing happens on it. */}
            <button type="button" className="btn btn-ghost btn-soon" disabled aria-disabled="true">
              {t('home.comingSoon')}
            </button>
          </div>
        </div>
      </section>

      <div className="wrap" style={{ paddingBottom: '4rem' }}>
        <Previews />
      </div>
    </div>
  );
}
