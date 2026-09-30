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
import { useReveal } from '../useReveal';
import { t } from '../i18n';
import { HeroLoop } from './HeroLoop';
import { LadderPyramid } from './LadderPyramid';
import { FreeNow } from './FreeNow';
import { FeedbackTab } from './Feedback';



export function Home({ onStart }: { onStart: () => void }) {

  // Landing page only. No other screen moves.
  useReveal();

  /**
   * The headline with one word italicised. The sentence lives in `home.title`
   * as a whole, so the copy test and a screen reader both get one string; the
   * word to lean on is named separately. If the word is not in the sentence,
   * which a translation could easily cause, the plain sentence renders.
   */
  const title = t('home.title');
  const emphasis = t('home.title.em');
  const at = title.indexOf(emphasis);
  const hook =
    at === -1 ? (
      title
    ) : (
      <>
        {title.slice(0, at)}
        <em className="hero-em">{emphasis}</em>
        {title.slice(at + emphasis.length)}
      </>
    );

  return (
    <>
      {/* A photograph people are actually in, with the text at the bottom left
          where the water is darkest. White type on a photo needs a scrim, so a
          gradient climbs from the bottom; the top carries a lighter one so the
          header stays legible over the sky. */}
      <section className="hero">
        <picture className="hero-photo">
          <source type="image/webp" srcSet="/img/hero-1200.webp 1200w, /img/hero-2400.webp 2400w" sizes="100vw" />
          {/* Self-hosted. The export hot-links this from the Unsplash CDN. */}
          <img src="/img/hero-1800.jpg" alt={t('home.heroAlt')} width={2400} height={1350} />
        </picture>
        <HeroLoop poster="/img/hero-1800.jpg" />
        <div className="hero-scrim" aria-hidden="true" />

        <div className="hero-inner">

          <div className="hero-text">
            <h1 className="hero-hook">{hook}</h1>

            {/* Three facts, one per row: what this is, what it costs, what
                happens next. The headline says something true but not what
                the site is, and two reviews asked exactly that. */}
            <ul className="hero-facts">
              {(['what', 'cost', 'next'] as const).map((fact) => (
                <li key={fact}>
                  <svg className="hero-fact-mark" viewBox="0 0 20 20" width="20" height="20" aria-hidden="true">
                    <circle cx="10" cy="10" r="10" />
                    <path d="M5.8 10.4l2.7 2.7 5.7-6" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {t(`home.fact.${fact}`)}
                </li>
              ))}
            </ul>

            <div className="hero-cta">
              <button type="button" className="btn btn-large" onClick={onStart}>
                {t('home.cta')}
              </button>
              <a className="hero-browse" href="#services">
                {t('home.browse')}
              </a>
            </div>

            {/* On the front door, where somebody holding a Terapianavigaattori
                code will see it before anything else asks them a question. */}
            <p className="hero-have-code">{t('home.haveCode')}</p>
          </div>

        </div>
      </section>

      {/* Six sections, one action each (D-32): the hero, the ladder, three
          steps, what is free right now, what stands behind it, and the footer.
          The pitch that used to follow lives on /why. Sections alternate the
          page and surface colours so the page reads as separate blocks, not
          one wall of text. */}

      <section className="landing-band is-bg" id="services" data-reveal>
        <div className="wrap">
          <LadderPyramid careLanguage="fi" />
        </div>
      </section>

      {/* Three rows, not three cards. A card implies the steps are alternatives
          you pick between; they are one thing after another, and a rule between
          rows says that with less furniture. The numerals are rendered from the
          index rather than translated: "01" is the same in every language. */}
      <section className="landing-band is-surface" data-reveal>
        <div className="wrap steps-section">
          <h2 className="section-title steps-title">{t('home.steps.title')}</h2>
          <ol className="steps-list">
            {[1, 2, 3].map((n) => (
              <li key={n} className="steps-row">
                {/* Counts up from 00 as the row arrives, when motion is on. The
                    finished numeral is what is in the DOM, so with motion off or no
                    JavaScript it is simply the number. */}
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

          {/* The one action in this section. It was the third "way in" card;
              the first card was the hero's own button, and the second, not open
              yet, is on /why. */}
          <button type="button" className="link steps-link" onClick={onStart}>
            {t('home.steps.link')}
          </button>
        </div>
      </section>


      <FreeNow careLanguage="fi" />

      {/* Home page only, and out of the way: a tab pinned to the corner rather
          than a section as big as the page's real purpose. */}
      <FeedbackTab />
    </>
  );
}
