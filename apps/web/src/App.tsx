import { useState } from 'react';
import {
  carryForward,
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
import { clearDraft, loadDraft, saveDraft, type Draft } from './draft';
import { CrisisPanel, CrisisTrigger } from './components/Crisis';
import { ContextQuestions, type ContextAnswers } from './components/ContextQuestions';
import { Questionnaire } from './components/Questionnaire';
import { Result } from './components/Result';
import { Home } from './components/Home';

type Screen = 'home' | 'context' | 'questions' | 'result';

export default function App() {
  // A refresh mid-assessment used to lose everything. The draft lives in
  // sessionStorage and dies with the tab — see draft.ts for why not localStorage.
  const [restored] = useState(loadDraft);

  const [screen, setScreen] = useState<Screen>(restored?.screen ?? 'home');
  const [context, setContext] = useState<ContextAnswers | null>(restored?.context ?? null);
  const [completed, setCompleted] = useState<ScoreResult[]>(restored?.completed ?? []);
  const [skipped, setSkipped] = useState<string[]>(restored?.skipped ?? []);
  const [currentId, setCurrentId] = useState<string | null>(restored?.currentId ?? null);
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

  /** Write the draft. Only the two mid-flow screens are restorable. */
  const persist = (patch: Omit<Draft, 'version'>) => saveDraft({ version: 1, ...patch });

  const reset = () => {
    setContext(null);
    setCompleted([]);
    setSkipped([]);
    setCurrentId(null);
    setRouting(null);
    clearDraft();
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
      persist({
        screen: 'questions',
        context: ctx,
        contextProgress: null,
        completed: nextCompleted,
        skipped: nextSkipped,
        currentId: next,
        inProgress: null,
      });
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

    // The assessment is finished and saved; there is no longer a draft to resume.
    clearDraft();

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
            <ContextQuestions
              onComplete={onContextComplete}
              onBack={reset}
              initialAnswers={restored?.contextProgress?.answers}
              initialIndex={restored?.contextProgress?.index}
              onProgress={(answers, index) =>
                persist({
                  screen: 'context',
                  context: null,
                  contextProgress: { answers, index },
                  completed,
                  skipped,
                  currentId: null,
                  inProgress: null,
                })
              }
            />
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
              // PHQ-4 is the first two items of PHQ-9 and of GAD-7, so the funnel
              // would otherwise ask four questions twice. The engine decides what
              // is genuinely the same question; the component shows the person.
              carried={carryForward(
                instrumentById(currentId),
                completed.map((result) => ({
                  instrument: instrumentById(result.instrumentId),
                  result,
                })),
              )}
              initialAnswers={
                restored?.currentId === currentId ? restored?.inProgress?.answers : undefined
              }
              initialIndex={
                restored?.currentId === currentId ? restored?.inProgress?.index : undefined
              }
              onProgress={(answers, index) => {
                if (!context) return;
                persist({
                  screen: 'questions',
                  context,
                  contextProgress: null,
                  completed,
                  skipped,
                  currentId,
                  inProgress: { answers, index },
                });
              }}
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
