/**
 * The home page carries the argument for the product, not just the entry button.
 *
 * Structure: hero, the two values, the gap in the market, today-vs-Reitti,
 * where to start. Every claim here has to survive a clinician
 * reading it, so there are no invented statistics; where a number would help,
 * the copy names the mechanism instead.
 *
 * All wording lives in `config/i18n/ui/`. It is written to be read by somebody
 * who is struggling, not by an investor: short sentences, plain words, and the
 * second person. Em dashes are avoided on purpose — stacked up across a page
 * they make prose feel breathless, which is the opposite of what this page needs.
 */
import { useState } from 'react';
import { useReveal } from '../useReveal';
import { t } from '../i18n';
import { LadderPyramid } from './LadderPyramid';
import { FreeNow } from './FreeNow';
import { Previews } from './Previews';
import { Feedback } from './Feedback';

const GAP_NUMBERS = ['01', '02', '03', '04', '05'] as const;
const TODAY_STEP_KEYS = [1, 2, 3, 4, 5, 6, 7] as const;

// "Get a suggested rung" is gone on purpose: with RECOMMEND_RUNG off the product
// does not suggest a rung, and the home page must not promise one.
const REITTI_STEP_KEYS = [1, 2, 3, 4] as const;

export function Home({
  onStart,
  onOpenCrisis,
}: {
  onStart: () => void;
  onOpenCrisis: () => void;
}) {
  // The comparison reveals one dead end at a time. Reading the friction beats
  // being told about it, and it costs one piece of state.
  const [revealed, setRevealed] = useState(1);

  // Landing page only. No other screen moves.
  useReveal();

  return (
    <>
      {/* Full bleed, with the veil only behind the text. The photo stays at full
          exposure everywhere else: a scrim across the whole image would turn it
          into texture, and the point of a photograph of someone walking is that
          it is a person. */}
      <section className="hero">
        <picture className="hero-photo">
          <source
            type="image/webp"
            srcSet="/img/hero-1000.webp 1000w, /img/hero-2000.webp 2000w"
            sizes="100vw"
          />
          {/* Self-hosted. The design export hot-links this from the Unsplash CDN,
              which would put a third-party request on every page load. */}
          <img src="/img/hero-1600.jpg" alt={t('home.heroAlt')} width={2000} height={1100} />
        </picture>
        <div className="hero-veil" aria-hidden="true" />

        <div className="wrap hero-inner">
          <div className="hero-text" data-reveal>
          {/* The access-layer line is the first thing a person reads, and it is
              the headline rather than a label above one. What Reitti promises
              sits directly under it, and the explanation under that. */}
          <h1 className="display">{t('home.title')}</h1>
          <p className="hero-subtitle">{t('home.subtitle')}</p>
          <p className="lede" style={{ marginTop: '1.1rem' }}>
            {t('home.lede')}
          </p>
          <div className="hero-cta">
            <button type="button" className="btn btn-large" onClick={onStart}>
              {t('app.findYourPath')}
            </button>
            <button type="button" className="btn btn-secondary btn-large" onClick={onOpenCrisis}>
              {t('crisis.alwaysAvailable')}
            </button>
          </div>
          {/* The sharpest case for naming Terapianavigaattori at all: somebody
              holding a consent code should never answer twelve screening
              questions to be told they did not need to. It cost a card grid
              before; it costs one line here. */}
          <p className="hero-have-code">{t('home.haveCode')}</p>

          <div className="assurances">
            <span className="pill">{t('home.assurance.onDevice')}</span>
            <span className="pill">{t('home.assurance.noAccount')}</span>
            <span className="pill">{t('home.assurance.noDiagnosis')}</span>
          </div>
          </div>
        </div>
      </section>

      {/* Three rows, not three cards. A card implies the steps are alternatives
          you pick between; they are one thing after another, and a rule between
          rows says that with less furniture. The numerals are rendered from the
          index rather than translated: "01" is the same in every language. */}
      <section className="wrap steps-section">
        <h2 className="section-title steps-title" data-reveal>{t('home.steps.title')}</h2>
        <ol className="steps-list">
          {[1, 2, 3].map((n) => (
            <li key={n} className="steps-row" data-reveal style={{ ["--i" as string]: n }}>
              <span className="steps-numeral" aria-hidden="true">
                {`0${n}`}
              </span>
              <div className="steps-body">
                <h3 className="steps-heading">{t(`home.step${n}.title`)}</h3>
                <p className="steps-sentence">{t(`home.step${n}.body`)}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <div className="wrap">
        <LadderPyramid careLanguage="fi" />
      </div>

      <FreeNow careLanguage="fi" />

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

      {/* The market argument, behind a disclosure.
          It is written for a partner or an investor: five cards on what is
          broken, and a click-through of a failing search. A person deciding
          whether to answer twelve questions about how they feel does not need
          to read it first, and on a phone it was most of a nine-screen page.
          Nothing is deleted; it is addressed to whoever asked for it. */}
      <section className="band">
        <div className="wrap" style={{ paddingBlock: '2.6rem' }}>
          <details className="why-built">
            <summary className="why-built-summary">{t('home.whyBuilt')}</summary>
            <div className="why-built-body">
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
            </div>
          </details>
        </div>
      </section>

      <section className="wrap" style={{ paddingBlock: '3.4rem 1rem' }}>
        <p className="eyebrow" style={{ marginBottom: '0.4rem' }}>
          {t('home.start.eyebrow')}
        </p>
        <p className="prose" style={{ margin: '0 0 1.5rem', maxWidth: '62ch' }}>
          {t('home.start.lede')}
        </p>
        <div className="grid grid-3">
          <div className="entry-card">
            <h3>{t('home.entry1.title')}</h3>
            <p>{t('home.entry1.body')}</p>
            <button type="button" className="btn btn-ghost" onClick={onStart}>
              {t('home.entry1.cta')}
            </button>
          </div>
          <div className="entry-card">
            <h3>{t('home.entry2.title')}</h3>
            <p>{t('home.entry2.body')}</p>
            <span className="badge">{t('home.comingSoon')}</span>
          </div>
          <div className="entry-card">
            <h3>{t('home.entry3.title')}</h3>
            <p>{t('home.entry3.body')}</p>
            <button type="button" className="btn btn-ghost" onClick={onStart}>
              {t('home.entry3.cta')}
            </button>
          </div>
        </div>
      </section>

      <div className="wrap">
        <Previews />
      </div>

      {/* Home page only. The most valuable moment to ask would be just after a
          result, and that is exactly the moment not to: somebody who has just
          been told where to start with their mental health does not owe us
          product feedback. */}
      <div className="wrap" style={{ paddingBlock: '0 3.5rem' }}>
        <Feedback />
      </div>
    </>
  );
}
