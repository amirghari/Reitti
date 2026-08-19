/**
 * The path. A band, a reflection, and a suggested rung with the two rungs either
 * side of it — never a diagnosis, never a label (safety invariant 4).
 *
 * The print view is the client-side PDF export from architecture v2 §7: it is
 * produced from on-device data by the browser, so it adds no health-data liability.
 */
import type { RoutingOutput, ScoreResult } from '@reitti/engine';
import { instrumentById } from '../config';
import { t } from '../i18n';

interface ResultProps {
  results: ScoreResult[];
  routing: RoutingOutput;
  onRestart: () => void;
  onClearData: () => void;
}

export function Result({ results, routing, onRestart, onClearData }: ResultProps) {
  const suggested = routing.suggestedRung;

  return (
    <section>
      <header className="result-header">
        <p className="eyebrow" style={{ marginBottom: '0.5rem', color: 'var(--accent)' }}>
          A reasonable place to start
        </p>
        <h1 className="section-title">{suggested ? t(suggested.labelRef) : 'Support options'}</h1>
        {suggested && <p className="rung-description">{t(suggested.descriptionRef)}</p>}
      </header>

      <p className="disclaimer">{t('app.notDiagnosis')}</p>

      {/* The clinician's sign-off line, shown to the person unchanged. One string,
          so the explanation can never drift from the rule that actually fired. */}
      {routing.reasons.length > 0 && (
        <div className="reasons">
          <p className="reasons-label">Why this</p>
          <ul>
            {routing.reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
          <p className="reasons-foot">
            These are the rules a clinician approved, quoted as written. Nothing here was
            generated for you.
          </p>
        </div>
      )}

      <div>
        {routing.adjacentRungs.below && (
          <div className="adjacent">
            <p className="adjacent-label">If that feels like too much, start here</p>
            <p className="adjacent-rung">{t(routing.adjacentRungs.below.labelRef)}</p>
            <p className="adjacent-description">{t(routing.adjacentRungs.below.descriptionRef)}</p>
          </div>
        )}
        {routing.adjacentRungs.above && (
          <div className="adjacent">
            <p className="adjacent-label">If that doesn't feel like enough</p>
            <p className="adjacent-rung">{t(routing.adjacentRungs.above.labelRef)}</p>
            <p className="adjacent-description">{t(routing.adjacentRungs.above.descriptionRef)}</p>
          </div>
        )}
      </div>

      {routing.providerTags.length > 0 && (
        <div className="tags">
          <p className="tags-label">What to look for</p>
          <ul>
            {routing.providerTags.map((tag) => (
              <li key={tag} className="tag">
                {TAG_COPY[tag] ?? tag}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div style={{ marginTop: '2rem' }}>
        <p className="tags-label" style={{ marginTop: 0 }}>
          What you answered
        </p>
        {results.map((result) => {
          const instrument = instrumentById(result.instrumentId);
          return (
            <div key={result.instrumentId} className="score-row">
              <div className="score-row-head">
                <span className="score-name">{instrument.name}</span>
                <span className="score-value">
                  {result.score}
                  {maxScoreLabel(result.instrumentId)}
                </span>
              </div>
              <p className="reflection">{t(result.reflectionRef)}</p>
            </div>
          );
        })}
      </div>

      <p className="fine-print" style={{ marginTop: '1.5rem' }}>
        {t('app.onDevice')}
      </p>

      <div className="panel-actions no-print">
        <button type="button" className="btn" onClick={() => window.print()}>
          Save or print this summary
        </button>
        <button type="button" className="btn btn-secondary" onClick={onRestart}>
          Start again
        </button>
      </div>

      <button type="button" className="link danger no-print" onClick={onClearData}>
        Delete everything Reitti has stored on this device
      </button>

      <p className="mono audit no-print">
        Rules version {routing.rulesVersion} · matched {routing.matchedRuleId}
        {routing.appliedModifierIds.length > 0 && ` + ${routing.appliedModifierIds.join(', ')}`}
      </p>
    </section>
  );
}

/** Plain-language tag copy. Tags come from config; unknown ones fall back to the raw id. */
const TAG_COPY: Record<string, string> = {
  'trauma-informed': 'Someone trained in trauma-informed care',
  'substance-aware': 'Support that includes alcohol or substance use',
  'language-match-needed': 'Check they work in your language',
  'public-first': 'Free and public options first',
  'free-options': 'There are no-cost routes into this',
  'group-suitable': 'A group is likely a good fit',
  structured: 'A structured, session-by-session programme',
  'long-term': 'Longer-term support rather than a short block',
  'psychiatrist-referral': "You'll need a doctor's or psychiatrist's statement",
  priority: 'Worth arranging soon rather than waiting',
  preventive: 'Prevention and maintenance rather than treatment',
};

function maxScoreLabel(instrumentId: string): string {
  const instrument = instrumentById(instrumentId);
  const max = instrument.items.reduce((sum, item) => {
    const scale = item.scale ?? instrument.scale ?? [];
    return sum + Math.max(...scale.map((o) => o.value));
  }, 0);
  const ceiling = instrument.scoreTransform ? max * instrument.scoreTransform.multiplier : max;
  return ` / ${ceiling}`;
}
