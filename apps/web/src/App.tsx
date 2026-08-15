import { useState } from 'react';
import {
  deriveRoutingInput,
  isGatedOut,
  nextInstrumentId,
  route,
  scoreInstrument,
  type Answers,
  type Budget,
  type Duration,
  type RoutingOutput,
  type ScoreResult,
} from '@reitti/engine';
import { flow, instrumentById, ladder, rules } from './config';
import { t } from './i18n';
import { clearAllData, saveSession } from './store';
import { CrisisPanel, CrisisTrigger } from './components/Crisis';
import { ContextQuestions, type ContextAnswers } from './components/ContextQuestions';
import { Questionnaire } from './components/Questionnaire';
import { Result } from './components/Result';
import { Home } from './components/Home';

type Screen = 'home' | 'context' | 'questions' | 'result';

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [context, setContext] = useState<ContextAnswers | null>(null);
  const [completed, setCompleted] = useState<ScoreResult[]>([]);
  const [skipped, setSkipped] = useState<string[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [routing, setRouting] = useState<RoutingOutput | null>(null);

  // Crisis state. `triggeredByAnswer` distinguishes an interrupted flow from
  // someone reaching for help directly; both must always be possible.
  const [crisisOpen, setCrisisOpen] = useState(false);
  const [crisisFromAnswer, setCrisisFromAnswer] = useState(false);
  const [resumeToken, setResumeToken] = useState(0);

  const go = (next: Screen) => {
    setScreen(next);
    window.scrollTo(0, 0);
  };

  const reset = () => {
    setContext(null);
    setCompleted([]);
    setSkipped([]);
    setCurrentId(null);
    setRouting(null);
    go('home');
  };

  const openCrisis = () => {
    setCrisisFromAnswer(false);
    setCrisisOpen(true);
  };

  /** Advance the funnel, or finish and route. */
  const advance = (nextCompleted: ScoreResult[], nextSkipped: string[], ctx: ContextAnswers) => {
    const next = nextInstrumentId(flow, {
      completed: nextCompleted,
      skipped: nextSkipped,
      statedDomain: ctx.statedDomain,
    });

    if (next) {
      setCurrentId(next);
      go('questions');
      return;
    }

    const input = deriveRoutingInput(nextCompleted, {
      duration: ctx.duration as Duration,
      budget: ctx.budget as Budget,
      language: ctx.language,
      statedDomain: ctx.statedDomain,
    });
    const output = route(input, rules, ladder);
    setRouting(output);

    saveSession({
      completedAt: new Date().toISOString(),
      context: ctx,
      results: nextCompleted,
      suggestedRungId: output.suggestedRung?.id ?? null,
      rulesVersion: output.rulesVersion,
    });

    // A crisis-flagged result routes to the crisis path, not to a rung.
    if (output.crisis) {
      setCrisisFromAnswer(true);
      setCrisisOpen(true);
    }
    go('result');
  };

  const onContextComplete = (answers: ContextAnswers) => {
    setContext(answers);
    advance([], [], answers);
  };

  const onInstrumentComplete = (answers: Answers) => {
    if (!currentId || !context) return;
    const instrument = instrumentById(currentId);

    if (isGatedOut(instrument, answers)) {
      const nextSkipped = [...skipped, currentId];
      setSkipped(nextSkipped);
      advance(completed, nextSkipped, context);
      return;
    }

    const result = scoreInstrument(instrument, answers);
    const nextCompleted = [...completed, result];
    setCompleted(nextCompleted);
    advance(nextCompleted, skipped, context);
  };

  const onSkipInstrument = () => {
    if (!currentId || !context) return;
    const nextSkipped = [...skipped, currentId];
    setSkipped(nextSkipped);
    advance(completed, nextSkipped, context);
  };

  return (
    <div className="app">
      <header className="app-header">
        <button type="button" className="wordmark" onClick={reset}>
          <span className="wordmark-glyph" aria-hidden="true" />
          <span className="wordmark-text">{t('app.name')}</span>
        </button>
        <div className="header-actions">
          {screen !== 'home' && (
            <button type="button" className="link" onClick={reset}>
              Start again
            </button>
          )}
          <button type="button" className="btn" onClick={() => go('context')}>
            Find your path
          </button>
        </div>
      </header>

      <main>
        {screen === 'home' && <Home onStart={() => go('context')} onOpenCrisis={openCrisis} />}

        {screen === 'context' && (
          <div className="wrap-read" style={{ paddingBlock: '2.75rem 5rem' }}>
            <ContextQuestions onComplete={onContextComplete} onBack={reset} />
          </div>
        )}

        {screen === 'questions' && currentId && (
          <div className="wrap-read" style={{ paddingBlock: '2.75rem 5rem' }}>
            <Questionnaire
              key={currentId}
              instrument={instrumentById(currentId)}
              onComplete={onInstrumentComplete}
              onSkip={onSkipInstrument}
              onCrisis={() => {
                setCrisisFromAnswer(true);
                setCrisisOpen(true);
              }}
              paused={crisisOpen}
              resumeToken={resumeToken}
            />
          </div>
        )}

        {screen === 'result' && routing && (
          <div className="wrap-read" style={{ paddingBlock: '2.75rem 4rem' }}>
            <Result
              results={completed}
              routing={routing}
              onRestart={reset}
              onClearData={() => {
                clearAllData();
                reset();
              }}
            />
          </div>
        )}
      </main>

      <footer className="app-footer">
        <div className="footer-inner">
          <p className="mono" style={{ maxWidth: '90ch' }}>
            {t('app.notDiagnosis')} {t('app.onDevice')} In an emergency call 112; for crisis support
            call the MIELI ry crisis line on 09 2525 0111.
          </p>
        </div>
      </footer>

      <CrisisTrigger onOpen={openCrisis} />

      {crisisOpen && (
        <CrisisPanel
          triggeredByAnswer={crisisFromAnswer}
          preferredLanguage={context?.language}
          onClose={() => {
            setCrisisOpen(false);
            setResumeToken((n) => n + 1);
          }}
          onContinue={
            screen === 'questions'
              ? () => {
                  setCrisisOpen(false);
                  setResumeToken((n) => n + 1);
                }
              : undefined
          }
        />
      )}
    </div>
  );
}
