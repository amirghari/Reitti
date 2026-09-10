/**
 * "How Reitti decides" — the transparency page (decision D-19).
 *
 * The reasoning for publishing this at all: the decision surface is not a moat,
 * so hiding it protects nothing. The instruments are published and free, the
 * cutoffs are Kroenke et al.'s public numbers, and `npm run rules:print` already
 * renders the whole table. The moat is the cross-sector directory, the
 * budget-aware ordering and demand pooling, none of which this gives away.
 * Meanwhile transparency *is* the trust claim: the thing that makes Reitti
 * not-a-chatbot is that it can show you the exact line that decided your result.
 *
 * Two build notes that are not obvious:
 *
 * The diagram is HTML boxes with SVG connectors, not one SVG drawing. SVG text
 * does not wrap, and the Finnish and Swedish strings are half again as long as
 * the English — an all-SVG version reads fine in one language and overflows in
 * the other two. HTML boxes also mean the text is real text for a screen reader
 * and for translation, rather than glyphs in a picture.
 *
 * The green box uses `--accent-deep` with `--accent-soft` text. The reference
 * mockup put `#cfddd3` on `#4a6e5a`, which measures 4.07:1 and fails AA for
 * small text. This pairing is 6.52:1.
 */
import { useEffect, useRef, useState } from 'react';
import { t } from '../i18n';

/**
 * Renders `**bold**` runs from a translated string.
 *
 * The limits read as "claim, then explanation", and the claim needs to carry.
 * Marking it in the copy rather than splitting every entry into two keys keeps
 * the sentence whole for whoever translates it, which is how it stays a
 * sentence rather than two fragments glued together.
 */
function Bold({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
        part.startsWith('**') && part.endsWith('**') ? (
          <strong key={i}>{part.slice(2, -2)}</strong>
        ) : (
          part
        ),
      )}
    </>
  );
}

/** A drawn connector. The line animates its own stroke, so the path builds. */
function Connector({ label }: { label?: string }) {
  return (
    <div className="hw-connector">
      <svg viewBox="0 0 24 44" aria-hidden="true" focusable="false">
        <defs>
          <marker
            id="hw-arrow"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto"
          >
            <path
              d="M2 1L8 5L2 9"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </marker>
        </defs>
        <line
          className="hw-connector-line"
          x1="12"
          y1="2"
          x2="12"
          y2="36"
          stroke="currentColor"
          strokeWidth="1.4"
          markerEnd="url(#hw-arrow)"
        />
      </svg>
      {label && <span className="hw-connector-label">{label}</span>}
    </div>
  );
}

export function HowItWorks({ onBack }: { onBack: () => void }) {
  const flowRef = useRef<HTMLDivElement>(null);
  const [built, setBuilt] = useState(false);
  const [animate, setAnimate] = useState(false);

  /**
   * The path assembles as you reach it, once. Not on every scroll: a diagram
   * that rebuilds each time it re-enters view is a diagram that fidgets, and
   * this page is meant to steady somebody rather than perform for them.
   *
   * `prefers-reduced-motion` is handled in CSS rather than here, so the final
   * composed state is what renders even if this effect never runs at all.
   */
  useEffect(() => {
    const node = flowRef.current;
    if (!node) return;

    if (typeof IntersectionObserver === 'undefined') {
      setBuilt(true);
      return;
    }

    // Only now does anything become hidden. If this line is never reached the
    // diagram simply stays composed, which is the failure mode to want.
    setAnimate(true);

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setBuilt(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <article className="how-it-works">
      <p className="eyebrow">{t('howItWorks.eyebrow')}</p>
      <h1 className="section-title">{t('howItWorks.title')}</h1>
      <p className="lede hw-lede">{t('howItWorks.lede')}</p>

      <div className="card hw-card">
        {/* One text alternative for the whole diagram. The motion is decorative
            and carries nothing the words do not. */}
        <div
          className={`hw-flow${animate ? ' will-animate' : ''}${built ? ' is-built' : ''}`}
          ref={flowRef}
          role="img"
          aria-label={t('howItWorks.diagram.alt')}
        >
          {/* A single dot travelling the path: one person's answers moving
              through it. Slow, and gone once it arrives. */}
          <span className="hw-token" aria-hidden="true" />

          <div className="hw-stage" style={{ '--i': 0 } as React.CSSProperties}>
            <p className="hw-stage-title">{t('howItWorks.stage.context.title')}</p>
            <p className="hw-stage-sub">{t('howItWorks.stage.context.sub')}</p>
          </div>

          <Connector />

          <div className="hw-stage hw-stage-phq" style={{ '--i': 1 } as React.CSSProperties}>
            <p className="hw-stage-title">{t('howItWorks.stage.phq4.title')}</p>
            <p className="hw-stage-sub">{t('howItWorks.stage.phq4.sub')}</p>
          </div>

          <Connector />

          {/* Wider than the flow on purpose: it spans the path rather than
              sitting in it, because it applies at every step. */}
          <div className="hw-crisis" style={{ '--i': 2 } as React.CSSProperties}>
            <span className="hw-crisis-dot" aria-hidden="true" />
            <p className="hw-crisis-text">
              {t('howItWorks.crisis.line1')} {t('howItWorks.crisis.line2')}
            </p>
          </div>

          <Connector />

          <div className="hw-stage hw-stage-deeper" style={{ '--i': 3 } as React.CSSProperties}>
            <p className="hw-stage-title">{t('howItWorks.stage.deeper.title')}</p>
            <div className="hw-branches">
              {(['anxiety', 'mood', 'grief'] as const).map((id, i) => (
                <span
                  key={id}
                  className="hw-branch"
                  style={{ '--j': i } as React.CSSProperties}
                >
                  <span className="hw-branch-a">{t(`howItWorks.chip.${id}.a`)}</span>
                  <span className="hw-branch-b">{t(`howItWorks.chip.${id}.b`)}</span>
                </span>
              ))}
            </div>
          </div>

          <Connector label={t('howItWorks.connector.band')} />

          <div className="hw-stage hw-options" style={{ '--i': 4 } as React.CSSProperties}>
            <p className="hw-stage-title">{t('howItWorks.stage.options.title')}</p>
            <p className="hw-stage-sub">{t('howItWorks.stage.options.sub')}</p>
          </div>
        </div>

        <p className="hw-diagram-foot">{t('howItWorks.diagramFoot')}</p>

        <div className={`hw-trust${animate ? ' will-animate' : ''}${built ? ' is-built' : ''}`}>
          {(['noAi', 'published', 'clinician', 'onDevice'] as const).map((id, i) => (
            <span key={id} className="chip hw-chip" style={{ '--i': i } as React.CSSProperties}>
              {t(`howItWorks.trust.${id}`)}
            </span>
          ))}
        </div>
      </div>

      <section className="hw-why">
        <h2 className="hw-why-title">{t('howItWorks.why.title')}</h2>
        <p>{t('howItWorks.why.p1')}</p>
        <p>{t('howItWorks.why.p2')}</p>
        <p>{t('howItWorks.why.p3')}</p>
      </section>

      {/* The edges, stated plainly.
          An outside review of the site asked, reasonably, how this handles
          adolescents, severe cases, regional variation, waiting times and
          languages beyond three. Some of those are handled and invisible; some
          are genuinely not handled. Either way the honest move is to say so on
          the page rather than let somebody find out by relying on it. */}
      <section className="hw-limits">
        <h2 className="hw-why-title">{t('howItWorks.limits.title')}</h2>
        <p className="hw-limits-lede">{t('howItWorks.limits.lede')}</p>
        <ul className="hw-limits-list">
          {(['age', 'risk', 'availability', 'region', 'language', 'supply'] as const).map((id) => (
            <li key={id}>
              <Bold text={t(`howItWorks.limits.${id}`)} />
            </li>
          ))}
        </ul>
      </section>

      {/* The same honesty the rest of the app carries: the mechanism above is
          final, the thresholds and wording are not. */}
      <aside className="hw-note" role="note">
        {t('howItWorks.note')}
      </aside>

      <div className="panel-actions no-print">
        <button type="button" className="btn btn-secondary" onClick={onBack}>
          {t('howItWorks.back')}
        </button>
      </div>
    </article>
  );
}
