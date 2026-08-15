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
import { Previews } from './components/Previews';

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

  const reset = () => {
    setContext(null);
    setCompleted([]);
    setSkipped([]);
    setCurrentId(null);
    setRouting(null);
    setScreen('home');
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
      setScreen('questions');
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
    setScreen('result');
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
          {t('app.name')}
        </button>
        <CrisisTrigger
          onOpen={() => {
            setCrisisFromAnswer(false);
            setCrisisOpen(true);
          }}
        />
      </header>

      <main>
        {screen === 'home' && <Home onStart={() => setScreen('context')} />}

        {screen === 'context' && <ContextQuestions onComplete={onContextComplete} />}

        {screen === 'questions' && currentId && (
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
        )}

        {screen === 'result' && routing && (
          <Result
            results={completed}
            routing={routing}
            onRestart={reset}
            onClearData={() => {
              clearAllData();
              reset();
            }}
          />
        )}

        {screen !== 'questions' && <Previews />}
      </main>

      <footer className="app-footer">
        <p>{t('app.notDiagnosis')}</p>
        <p>{t('app.onDevice')}</p>
      </footer>

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

function Home({ onStart }: { onStart: () => void }) {
  return (
    <section className="card hero">
      <h1>{t('app.tagline')}</h1>
      <p className="lede">
        Answer a few questions — about a minute to start — and Reitti suggests where to begin,
        from free self-help through to subsidised long-term therapy. No account, no email.
      </p>
      <button type="button" className="btn btn-large" onClick={onStart}>
        Find your path
      </button>
      <ul className="assurances">
        <li>Your answers stay on this device</li>
        <li>Reitti doesn't diagnose — it points you somewhere sensible</li>
        <li>Free options come first whenever they fit</li>
      </ul>
    </section>
  );
}
