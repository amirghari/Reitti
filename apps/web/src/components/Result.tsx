/**
 * The result.
 *
 * V2 moved this screen behind the line HUS drew. Terapianavigaattori — anonymous,
 * validated, CE-marked under MDR, 367,506 cumulative users — deliberately makes
 * no automated conclusion and no treatment recommendation: a professional decides
 * at the ensijäsennys visit. Every EU/UK tool that does map scores to a care
 * level is a regulated device. So with `RECOMMEND_RUNG` off (the default), this
 * screen shows a band, a reflection, and the two or three rungs that fit — in
 * ascending ladder order, with what each costs and where to actually go — and
 * the person chooses.
 *
 * The rules engine still computed a single rung. It is deliberately not surfaced,
 * and `fittingRungs` sorts by ladder level so it cannot leak through position
 * either (invariant 9).
 *
 * The print view is the client-side PDF export from architecture v2 §7: produced
 * from on-device data by the browser, so it adds no health-data liability.
 */
import { useState } from 'react';
import {
  fittingRungs,
  type AgeBand,
  type Budget,
  type RoutingOutput,
  type Rung,
  type ScoreResult,
} from '@reitti/engine';
import { instrumentById, ladder } from '../config';
import { t } from '../i18n';
import { RECOMMEND_RUNG } from '../flags';
import { Options } from './Options';
import { HumanOption } from './HumanOption';
import { LadderOverview } from './LadderOverview';
import { WhileYouWait, isReferralRung } from './WhileYouWait';
import { GroupWaitlist } from './GroupWaitlist';

interface ResultProps {
  results: ScoreResult[];
  routing: RoutingOutput;
  careLanguage: string;
  budget: Budget;
  ageBand?: AgeBand;
  onRestart: () => void;
  onClearData: () => void;
}

export function Result({
  results,
  routing,
  careLanguage,
  budget,
  ageBand = '30-plus',
  onRestart,
  onClearData,
}: ResultProps) {
  const fitting = fittingRungs(routing, ladder);

  // The budget the person is exploring with right now. Starts at what they told
  // us and can be changed here — a reordering is more honestly explained by
  // letting someone try it than by asking once and applying it silently.
  const [exploredBudget, setExploredBudget] = useState<Budget>(budget);

  return (
    <section>
      <header className="result-header">
        <p className="eyebrow" style={{ marginBottom: '0.5rem', color: 'var(--accent)' }}>
          {RECOMMEND_RUNG ? t('result.suggested.eyebrow') : t('result.eyebrow')}
        </p>
        <h1 className="section-title">
          {RECOMMEND_RUNG && routing.suggestedRung
            ? t(routing.suggestedRung.labelRef)
            : t('result.heading')}
        </h1>
      </header>

      <p className="disclaimer">{t('app.notDiagnosis')}</p>

      {/* C1: a person to talk to, above the rungs, whatever the questions said. */}
      <HumanOption careLanguage={careLanguage} ageBand={ageBand} />

      {RECOMMEND_RUNG ? (
        <RecommendedRung
          routing={routing}
          careLanguage={careLanguage}
          budget={exploredBudget}
          ageBand={ageBand}
        />
      ) : (
        <FittingRungs
          rungs={fitting}
          careLanguage={careLanguage}
          budget={exploredBudget}
          ageBand={ageBand}
        />
      )}

      {/* The clinician's sign-off line, shown to the person unchanged. One string,
          so the explanation can never drift from the rule that actually fired.
          With the flag off these lines explain how the *set* was assembled — which
          is what actually happened — so the heading says "these", not "this". */}
      {routing.reasons.length > 0 && (
        <div className="reasons">
          <p className="reasons-label">{t('result.howChosen')}</p>
          <ul>
            {routing.reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
          <p className="reasons-foot">{t('result.howChosen.foot')}</p>
        </div>
      )}

      {routing.providerTags.length > 0 && (
        <div className="tags">
          <p className="tags-label">{t('result.tags.heading')}</p>
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
          {t('result.band.heading')}
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

      {/* A2: the whole ladder with what each step costs. Budget reorders it and
          never shortens it — invariant 7. */}
      <LadderOverview budget={exploredBudget} onBudgetChange={setExploredBudget} />

      <ScopeStatement />

      <p className="fine-print" style={{ marginTop: '1.5rem' }}>
        {t('app.onDevice')}
      </p>

      <div className="panel-actions no-print">
        <button type="button" className="btn" onClick={() => window.print()}>
          {t('result.print')}
        </button>
        <button type="button" className="btn btn-secondary" onClick={onRestart}>
          {t('result.restart')}
        </button>
      </div>

      <button type="button" className="link danger no-print" onClick={onClearData}>
        {t('result.clearData')}
      </button>

      <p className="mono audit no-print">
        Rules version {routing.rulesVersion} · matched {routing.matchedRuleId}
        {routing.appliedModifierIds.length > 0 && ` + ${routing.appliedModifierIds.join(', ')}`}
      </p>
    </section>
  );
}

/**
 * The default consumer view: a set, in ladder order, with no member marked as
 * the answer. Every rung carries the same heading weight and the same affordances
 * on purpose — a visual hierarchy here would be a recommendation.
 */
function FittingRungs({
  rungs,
  careLanguage,
  budget,
  ageBand,
}: {
  rungs: Rung[];
  careLanguage: string;
  budget?: Budget;
  ageBand: AgeBand;
}) {
  if (rungs.length === 0) return null;

  return (
    <section className="fitting" data-fitting-count={rungs.length}>
      <h2 className="fitting-heading">{t('result.fittingRungs.heading')}</h2>
      <p className="fitting-help">{t('result.fittingRungs.help')}</p>

      <ol className="fitting-list">
        {rungs.map((rung) => (
          <li key={rung.id} className="fitting-rung" data-rung={rung.id} data-level={rung.level}>
            <div className="fitting-rung-head">
              <h3 className="fitting-rung-name">{t(rung.labelRef)}</h3>
              <span className="fitting-rung-cost">{t(rung.costLabelRef)}</span>
            </div>
            <p className="fitting-rung-description">{t(rung.descriptionRef)}</p>
            <Options
              rungId={rung.id}
              careLanguage={careLanguage}
              budget={budget}
              ageBand={ageBand}
              detailed={rung.id === RUNG_TWO}
            />
            {/* A3: on the group rung itself, pooling is the point. */}
            {rung.id === 'group-therapy' && (
              <GroupWaitlist rungId={rung.id} careLanguage={careLanguage} />
            )}
            {/* C2: a referral is a queue. Nobody leaves this screen with only a
                link to join it. */}
            {isReferralRung(rung.id) && (
              <WhileYouWait careLanguage={careLanguage} ageBand={ageBand} rungId={rung.id} />
            )}
          </li>
        ))}
      </ol>

      <p className="fitting-you-choose">{t('result.youChoose')}</p>
    </section>
  );
}

/**
 * The regulated view, behind `RECOMMEND_RUNG`. Unchanged from V1 in substance:
 * one suggested rung and the "too much / not enough" pair either side.
 */
function RecommendedRung({
  routing,
  careLanguage,
  budget,
  ageBand,
}: {
  routing: RoutingOutput;
  careLanguage: string;
  budget?: Budget;
  ageBand: AgeBand;
}) {
  const suggested = routing.suggestedRung;
  if (!suggested) return null;

  return (
    <section className="recommended" data-recommended-rung={suggested.id}>
      <p className="rung-description">{t(suggested.descriptionRef)}</p>
      <Options
        rungId={suggested.id}
        careLanguage={careLanguage}
        budget={budget}
        ageBand={ageBand}
        detailed={suggested.id === RUNG_TWO}
      />
      {isReferralRung(suggested.id) && (
        <WhileYouWait careLanguage={careLanguage} ageBand={ageBand} rungId={suggested.id} />
      )}

      {routing.adjacentRungs.below && (
        <div className="adjacent">
          <p className="adjacent-label">{t('result.adjacent.below')}</p>
          <p className="adjacent-rung">{t(routing.adjacentRungs.below.labelRef)}</p>
          <p className="adjacent-description">{t(routing.adjacentRungs.below.descriptionRef)}</p>
        </div>
      )}
      {routing.adjacentRungs.above && (
        <div className="adjacent">
          <p className="adjacent-label">{t('result.adjacent.above')}</p>
          <p className="adjacent-rung">{t(routing.adjacentRungs.above.labelRef)}</p>
          <p className="adjacent-description">{t(routing.adjacentRungs.above.descriptionRef)}</p>
        </div>
      )}
    </section>
  );
}

/**
 * B3. Present on every result render, in both flag states, and in the print
 * view — a summary handed to a professional needs to say what it is not.
 */
export function ScopeStatement() {
  return (
    <aside className="scope-statement" role="note">
      <p className="scope-statement-title">{t('result.scopeStatement.title')}</p>
      <p className="scope-statement-body">{t('result.scopeStatement.body')}</p>
    </aside>
  );
}

/**
 * Rung 2 — the talking-support rung. Its cards show who answers, the hours and
 * the anonymity on the card rather than behind a disclosure, because choosing
 * between a crisis professional, a trained volunteer and a peer with lived
 * experience is a real choice and it should not need a click to see.
 */
const RUNG_TWO = 'peer-community';

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
