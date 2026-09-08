/**
 * The home page carries the argument for the product, not just the entry button.
 *
 * Structure: hero, the free front door, the two values, the gap in the market,
 * today-vs-Reitti, where to start. Every claim here has to survive a clinician
 * reading it, so there are no invented statistics; where a number would help,
 * the copy names the mechanism instead.
 *
 * All wording lives in `config/i18n/ui/`. It is written to be read by somebody
 * who is struggling, not by an investor: short sentences, plain words, and the
 * second person. Em dashes are avoided on purpose — stacked up across a page
 * they make prose feel breathless, which is the opposite of what this page needs.
 */
import { useState } from 'react';
import { directory, ladder } from '../config';
import { freeCareAt, gatedFreeCareAt } from '@reitti/engine';
import { t } from '../i18n';
import { Previews } from './Previews';
import { EntryPoints } from './EntryPoints';

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
  const rungs = [...ladder.rungs].sort((a, b) => a.level - b.level);

  return (
    <>
      <section className="wrap hero">
        <div>
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
          <div className="assurances">
            <span className="pill">{t('home.assurance.onDevice')}</span>
            <span className="pill">{t('home.assurance.noAccount')}</span>
            <span className="pill">{t('home.assurance.noDiagnosis')}</span>
          </div>
        </div>

        <aside className="ladder-card">
          <div className="ladder-head">
            <span className="mono" style={{ letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              {t('home.ladder.title')}
            </span>
            <span className="mono">{t('home.ladder.count')}</span>
          </div>
          {rungs.map((rung) => {
            // "FREE" tells someone a rung costs nothing. It does not tell them
            // what the free thing *is*, which is the question they actually have.
            //
            // Never a route: Terapianavigaattori routes people to group therapy,
            // so naming it beside "Group therapy" would announce free group
            // therapy that does not exist.
            //
            // But a blank row is its own false claim. A rung labelled FREE that
            // names nobody reads as free care having run out, and above the peer
            // rung that is not true: nettiterapia is real public treatment, free
            // to the patient, waiting behind a referral. So gated care is named
            // too, with the gate said out loud rather than implied by silence.
            const free = freeCareAt(directory, rung.id);
            const gated = free ? undefined : gatedFreeCareAt(directory, rung.id);
            return (
              <div key={rung.id} className="ladder-row">
                <span className="ladder-step">{rung.level}</span>
                <span className="ladder-name">
                  {t(rung.labelRef)}
                  {free && (
                    <span className="ladder-free">
                      {t('home.ladder.freeHere')}{' '}
                      <a href={free.url} target="_blank" rel="noreferrer noopener">
                        {t(free.nameRef)}
                      </a>
                    </span>
                  )}
                  {gated && (
                    <span className="ladder-free ladder-free-gated">
                      {t('home.ladder.freeGated')}{' '}
                      <a href={gated.url} target="_blank" rel="noreferrer noopener">
                        {t(gated.nameRef)}
                      </a>
                      <span className="ladder-gate">{t('home.ladder.gateNote')}</span>
                    </span>
                  )}
                </span>
                <span className="ladder-cost">{t(rung.costShortRef)}</span>
              </div>
            );
          })}
          <p className="ladder-foot">{t('home.ladder.foot')}</p>
        </aside>
      </section>

      {/* A1. The public entry point is the front door, not the result screen. */}
      <section className="wrap" style={{ paddingBlock: '0 1rem' }}>
        <EntryPoints />
      </section>

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
    </>
  );
}
