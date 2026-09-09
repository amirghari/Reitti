import { useState } from 'react';
import type { AgeBand, Answers, Budget, Duration, RoutingOutput, ScoreResult } from '@reitti/engine';
import {
  carryForward,
  deriveRoutingInput,
  isGatedOut,
  nextInstrumentId,
  route,
  scoreInstrument,
} from '@reitti/engine';
import { flow, instrumentById, ladder, rules } from './config';
import {
  AVAILABLE_UI_LANGUAGES,
  hasOfficialTranslation,
  setUiLanguage,
  t,
  uiLanguage,
  type UiLanguage,
} from './i18n';
import { clearAllData, saveSession } from './store';
import { followUpDue, scheduleFollowUp } from './followUp';
import { FollowUp } from './components/FollowUp';
import { ProvisionalBanner } from './components/ProvisionalBanner';
import { FeedbackDialog, FeedbackTrigger } from './components/Feedback';
import { clearDraft, loadDraft, saveDraft, type Draft } from './draft';
import { CrisisPanel, CrisisTrigger } from './components/Crisis';
import { ContextQuestions, type ContextAnswers } from './components/ContextQuestions';
import { Questionnaire } from './components/Questionnaire';
import { Result } from './components/Result';
import { YouthResult } from './components/YouthResult';
import { Home } from './components/Home';

type Screen = 'home' | 'context' | 'questions' | 'result' | 'language-notice';

/** The endonym for each interface language — never translated. */
const UI_LANGUAGE_LABEL: Record<UiLanguage, string> = {
  fi: 'Suomi',
  sv: 'Svenska',
  en: 'English',
};

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

  // The interface language. `t()` reads a module-level value, so this state
  // exists to force a re-render when it changes — the two are kept in step by
  // `chooseUiLanguage` and nowhere else.
  const [language, setLanguage] = useState<UiLanguage>(uiLanguage());

  const chooseUiLanguage = (next: UiLanguage) => {
    setUiLanguage(next);
    setLanguage(next);
  };

  /**
   * The questionnaires only run in a language whose OFFICIAL validated
   * translation we hold. A hand-translated screening item measures something
   * different, so instead of quietly serving English items under a Finnish
   * heading, we say what the situation is and let the person decide.
   */
  const assessmentAvailable = hasOfficialTranslation(flow.entry, language);

  const startAssessment = () => go(assessmentAvailable ? 'context' : 'language-notice');

  // Crisis state. `triggeredByAnswer` distinguishes an interrupted flow from
  // someone reaching for help directly; both must always be possible.
  const [crisisOpen, setCrisisOpen] = useState(false);
  const [crisisFromAnswer, setCrisisFromAnswer] = useState(false);
  const [resumeToken, setResumeToken] = useState(0);

  // Checked once on mount rather than on every render: the prompt appearing
  // halfway through answering a screener would be its own small cruelty.
  const [showFollowUp, setShowFollowUp] = useState(followUpDue);

  // Reachable from every screen, so an opinion formed on the result screen has
  // somewhere to go without losing the result.
  const [feedbackOpen, setFeedbackOpen] = useState(false);

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
      ageBand: ctx.ageBand as AgeBand,
    });
    const output = route(input, rules, ladder);
    setRouting(output);

    saveSession({
      completedAt: new Date().toISOString(),
      context: {
        statedDomain: ctx.statedDomain,
        duration: ctx.duration,
        budget: ctx.budget,
        // Two fields, not one: they are independent by design.
        careLanguage: ctx.language,
        uiLanguage: language,
        ageBand: ctx.ageBand,
      },
      results: nextCompleted,
      suggestedRungId: output.suggestedRung?.id ?? null,
      rulesVersion: output.rulesVersion,
    });

    // The assessment is finished and saved; there is no longer a draft to resume.
    clearDraft();

    // C3. A date in localStorage, nothing more: no push token, no subscription,
    // and no endpoint anywhere that knows a reminder exists.
    scheduleFollowUp();

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
              {t('app.startAgain')}
            </button>
          )}
          <FeedbackTrigger onOpen={() => setFeedbackOpen(true)} />

          <div className="language-switch" role="group" aria-label={t('app.languageLabel')}>
            {AVAILABLE_UI_LANGUAGES.map((code) => (
              <button
                key={code}
                type="button"
                className="language-chip"
                lang={code}
                aria-pressed={language === code}
                onClick={() => chooseUiLanguage(code)}
              >
                {UI_LANGUAGE_LABEL[code]}
              </button>
            ))}
          </div>
          <button type="button" className="btn" onClick={startAssessment}>
            {t('app.findYourPath')}
          </button>
        </div>
      </header>

      {/* Before anything else on every screen: a person who arrived from a public
          link has no other way to know this build is unreviewed. */}
      <ProvisionalBanner />

      <main>
        {screen === 'home' && showFollowUp && (
          <div className="wrap-read" style={{ paddingTop: '2rem' }}>
            <FollowUp onDone={() => setShowFollowUp(false)} />
          </div>
        )}

        {screen === 'home' && <Home onStart={startAssessment} onOpenCrisis={openCrisis} />}

        {screen === 'language-notice' && (
          <div className="wrap-read" style={{ paddingBlock: '2.75rem 5rem' }}>
            <section className="language-notice">
              <h1 className="section-title">{t('assessment.englishOnly.title')}</h1>
              <p className="prose">{t('assessment.englishOnly.body')}</p>
              <div className="panel-actions">
                <button
                  type="button"
                  className="btn"
                  onClick={() => {
                    chooseUiLanguage('en');
                    go('context');
                  }}
                >
                  {t('assessment.englishOnly.continue')}
                </button>
                <button type="button" className="btn btn-secondary" onClick={reset}>
                  {t('assessment.englishOnly.back')}
                </button>
              </div>
            </section>
          </div>
        )}

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

        {/* C4. An under-18 never reaches the adult ladder, the cost table or a
            private rung — the engine's R0 gate and this branch both say so. */}
        {screen === 'result' && routing && context?.ageBand === 'under-18' && (
          <div className="wrap-read" style={{ paddingBlock: '2.75rem 4rem' }}>
            <YouthResult
              careLanguage={context.language}
              onRestart={reset}
              onClearData={() => {
                clearAllData();
                reset();
              }}
            />
          </div>
        )}

        {screen === 'result' && routing && context?.ageBand !== 'under-18' && (
          <div className="wrap-read" style={{ paddingBlock: '2.75rem 4rem' }}>
            <Result
              results={completed}
              routing={routing}
              careLanguage={context?.language ?? 'fi'}
              ageBand={(context?.ageBand ?? '30-plus') as AgeBand}
              budget={(context?.budget ?? 'none') as Budget}
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
            {t('app.notDiagnosis')} {t('app.onDevice')} {t('app.footerCrisis')}
          </p>
        </div>
      </footer>

      <CrisisTrigger onOpen={openCrisis} />

      {feedbackOpen && <FeedbackDialog onClose={() => setFeedbackOpen(false)} />}

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
