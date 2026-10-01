import { useEffect, useRef, useState } from 'react';
import type { AgeBand, Answers, Budget, Duration, RoutingOutput, ScoreResult } from '@reitti/engine';
import {
  carryForward,
  deriveRoutingInput,
  funnelPosition,
  isGatedOut,
  nextInstrumentId,
  route,
  scoreInstrument,
  whyOpened,
} from '@reitti/engine';
import { flow, instrumentById, instruments, ladder, rules } from './config';
import {
  AVAILABLE_UI_LANGUAGES,
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
import { CrisisLines } from './components/CrisisLines';
import { ContextQuestions, type ContextAnswers } from './components/ContextQuestions';
import { Questionnaire } from './components/Questionnaire';
import { Result } from './components/Result';
import { YouthResult } from './components/YouthResult';
import { HowItWorks } from './components/HowItWorks';
import { Home } from './components/Home';
import { Why } from './components/Why';
import { assessmentOfferedIn } from './assessmentLanguage';

type Screen = 'home' | 'context' | 'questions' | 'result' | 'language-notice' | 'how-it-works' | 'why';

/**
 * A view opened from a link: `?page=how-it-decides` is how the sitemap and
 * llms.txt reach "How Mielenreitti decides", which is otherwise a screen with
 * no address. Read once and taken out of the address bar, so a refresh after
 * pressing Back does not open it again.
 *
 * Once, at module load, and not in a useState initializer: StrictMode calls an
 * initializer twice, and the first call removing the parameter left the second
 * with nothing to find.
 */
function openedAt(): Screen | null {
  if (typeof window === 'undefined') return null;
  // "/why" is a real path, the one screen with one of its own: it is a page
  // people will link to, and the sitemap lists it (D-32).
  if (window.location.pathname === WHY_PATH) return 'why';
  const url = new URL(window.location.href);
  if (url.searchParams.get('page') !== 'how-it-decides') return null;
  url.searchParams.delete('page');
  window.history.replaceState(window.history.state, '', url);
  return 'how-it-works';
}

const WHY_PATH = '/why';

/**
 * Keep the address bar's path in step with the screen, for "/why" only. Every
 * other screen is "/", as it always was; the query (the language) is kept.
 */
function syncPath(screen: Screen, mode: 'push' | 'replace' = 'push'): void {
  const path = screen === 'why' ? WHY_PATH : '/';
  if (window.location.pathname === path) return;
  const url = `${path}${window.location.search}`;
  if (mode === 'push') window.history.pushState(null, '', url);
  else window.history.replaceState(null, '', url);
}

const OPENED_AT = openedAt();

/** The endonym for each interface language — never translated. */
const UI_LANGUAGE_LABEL: Record<UiLanguage, string> = {
  fi: 'Suomi',
  sv: 'Svenska',
  en: 'English',
};

export default function App() {
  // A refresh mid-assessment used to lose everything. The draft lives in
  // sessionStorage and dies with the tab — see draft.ts for why not localStorage.
  // Cleared the moment the person starts over, or it would pre-fill a fresh run
  // with the answers from whatever tab was refreshed an hour ago.
  const [restored, setRestored] = useState(loadDraft);
  const [run, setRun] = useState(0);

  const [screen, setScreen] = useState<Screen>(OPENED_AT ?? restored?.screen ?? 'home');
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
  const assessmentAvailable = assessmentOfferedIn(language);

  const startAssessment = () => go(assessmentAvailable ? 'context' : 'language-notice');

  // Crisis state. `triggeredByAnswer` distinguishes an interrupted flow from
  // someone reaching for help directly; both must always be possible.
  const [crisisOpen, setCrisisOpen] = useState(false);
  const [crisisFromAnswer, setCrisisFromAnswer] = useState(false);

  /**
   * Has the crisis path opened at all this visit, however it opened?
   *
   * Sticky and never cleared, including by `reset()`: somebody who restarts
   * after a crisis panel is the same person on the same difficult afternoon.
   * The optional rating reads this and stays away for the rest of the session.
   */
  const [crisisSeen, setCrisisSeen] = useState(false);
  const openCrisisPanel = (fromAnswer: boolean) => {
    setCrisisFromAnswer(fromAnswer);
    setCrisisOpen(true);
    setCrisisSeen(true);
  };
  const [resumeToken, setResumeToken] = useState(0);

  // Checked once on mount rather than on every render: the prompt appearing
  // halfway through answering a screener would be its own small cruelty.
  const [showFollowUp, setShowFollowUp] = useState(followUpDue);

  // Reachable from every screen, so an opinion formed on the result screen has
  // somewhere to go without losing the result.
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  // Where "How Reitti decides" was opened from, so Back returns there rather
  // than dumping somebody who was reading their result back onto the home page.
  const [cameFrom, setCameFrom] = useState<Screen>('home');
  const openHowItWorks = () => {
    setCameFrom(screen);
    go('how-it-works');
  };
  const openWhy = () => go('why');

  /**
   * Publish the header's height as `--header-h`, as the preview banner does with
   * its own. On the landing page the header floats over the photograph, so the
   * hero has to start below it, and its height changes with the language and
   * the width (a phone wraps it onto three rows). A guessed padding let the
   * headline slide under the header on a phone once the hero grew three facts.
   */
  const headerRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = headerRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const root = document.documentElement;
    const measure = () => root.style.setProperty('--header-h', `${Math.round(el.getBoundingClientRect().height)}px`);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Back and Forward across "/why". Only that path is tracked, so leaving it by
  // Back lands on the landing page, which is where "/" leads.
  useEffect(() => {
    const onPop = () => {
      const onWhy = window.location.pathname === WHY_PATH;
      setScreen((current) => (onWhy ? 'why' : current === 'why' ? 'home' : current));
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const go = (next: Screen) => {
    setScreen(next);
    syncPath(next);
    window.scrollTo(0, 0);
  };

  /** Write the draft. Only the two mid-flow screens are restorable. */
  const persist = (patch: Omit<Draft, 'version'>) => saveDraft({ version: 1, ...patch });

  /** Forget the run: answers, results, the draft. The language stays, and so
   *  does `crisisSeen`, which nothing clears. */
  const clearRun = () => {
    setContext(null);
    setCompleted([]);
    setSkipped([]);
    setCurrentId(null);
    setRouting(null);
    setRestored(null);
    clearDraft();
  };

  /** The wordmark: home, with the run forgotten. */
  const reset = () => {
    clearRun();
    go('home');
  };

  /**
   * "Start over": back to the first question, not to the landing page. The
   * control used to be "Start again" and went home, which is not what anybody
   * pressing it in the middle of a questionnaire means.
   */
  const startOver = () => {
    clearRun();
    // A new run is a new component. Starting over from inside the context
    // questions goes from 'context' to 'context', and without a new key React
    // keeps the old instance, step counter and all.
    setRun((n) => n + 1);
    startAssessment();
  };

  /**
   * "You can stop any time": the free options on the landing page, without
   * throwing the run away. The draft stays, so a refresh brings them back.
   * Focus goes to the section, which is where the person asked to be.
   */
  const stopAndBrowse = () => {
    setScreen('home');
    window.requestAnimationFrame(() => {
      const heading = document.getElementById('free-now-title');
      if (!heading) return;
      const land = () => heading.scrollIntoView({ block: 'start' });
      land();
      heading.focus({ preventScroll: true });
      // The landing page settles for a moment after it mounts (the hero sizes
      // itself from the header's measured height), and Safari has no scroll
      // anchoring to hold the reader's place through that, so the heading slid
      // off screen. Hold it in view while the layout settles, then let go, so
      // this never fights the person's own scrolling for long.
      if (typeof ResizeObserver === 'undefined') return;
      const settle = new ResizeObserver(land);
      settle.observe(document.body);
      const release = () => settle.disconnect();
      window.setTimeout(release, 1000);
      window.addEventListener('wheel', release, { once: true, passive: true });
      window.addEventListener('touchstart', release, { once: true, passive: true });
    });
  };

  const openCrisis = () => openCrisisPanel(false);

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
      openCrisisPanel(true);
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
      {/* Three zones rather than one flat row: who we are, where you can go,
          and what you can do. The middle zone is new — "How Reitti decides" was
          in the footer, and a reviewer reading the site concluded the matching
          logic was not visible at all. It was; nobody found it. */}
      <ProvisionalBanner />

      {/* The header positions against this wrapper rather than the page, so
          when it floats over the landing photo it starts below the preview
          banner instead of on top of it. */}
      <div className="app-body">
      {/* On the landing page the header stops being a bar: it floats over the
          photograph so the picture reaches every edge. The controls are the same
          controls, so the crisis path, the language switch and the flow are all
          still one click from where they always were. */}
      <header ref={headerRef} className={`app-header${screen === 'home' ? ' is-over-hero' : ''}`}>
        <button type="button" className="wordmark" onClick={reset}>
          <span className="wordmark-glyph" aria-hidden="true" />
          <span className="wordmark-text">{t('app.name')}</span>
        </button>

        <nav className="header-nav" aria-label={t('app.navLabel')}>
          <button
            type="button"
            className={`nav-link${screen === 'how-it-works' ? ' is-current' : ''}`}
            aria-current={screen === 'how-it-works' ? 'page' : undefined}
            onClick={openHowItWorks}
          >
            {t('howItWorks.navLabel')}
          </button>
          <button
            type="button"
            className={`nav-link${screen === 'why' ? ' is-current' : ''}`}
            aria-current={screen === 'why' ? 'page' : undefined}
            onClick={openWhy}
          >
            {t('home.whyBuilt')}
          </button>
          <FeedbackTrigger onOpen={() => setFeedbackOpen(true)} />
        </nav>

        <div className="header-actions">
          {(screen === 'context' || screen === 'questions' || screen === 'result') && (
            <button type="button" className="link" onClick={startOver}>
              {t('app.startOver')}
            </button>
          )}

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

      <main>
        {screen === 'home' && showFollowUp && (
          <div className="wrap-read" style={{ paddingTop: '2rem' }}>
            <FollowUp onDone={() => setShowFollowUp(false)} />
          </div>
        )}

        {screen === 'home' && <Home onStart={startAssessment} />}

        {screen === 'why' && <Why />}

        {screen === 'how-it-works' && (
          <div className="wrap-read" style={{ paddingBlock: '2.75rem 4rem' }}>
            <HowItWorks onBack={() => go(cameFrom)} />
          </div>
        )}

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
              key={run}
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
              onCrisis={() => openCrisisPanel(true)}
              onStop={stopAndBrowse}
              paused={crisisOpen}
              position={funnelPosition(
                flow,
                instruments,
                { completed, skipped, statedDomain: context?.statedDomain },
                currentId,
              )}
              openedVia={whyOpened(flow, { completed, skipped, statedDomain: context?.statedDomain }, currentId)}
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
              onRestart={startOver}
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
              onRestart={startOver}
              onClearData={() => {
                clearAllData();
                reset();
              }}
              onHowItWorks={openHowItWorks}
              crisisTriggeredInSession={crisisSeen}
            />
          </div>
        )}
      </main>

      </div>
      {/* Three columns: what this is, where else to go, and who to call. It used
          to be one monospace paragraph carrying all three, with a crisis number
          typed into the copy; the numbers now come from `config/crisis.json`
          through the same component as the landing page's crisis strip. */}
      <footer className="app-footer">
        <div className="footer-inner">
          <div className="footer-about">
            <p className="footer-wordmark">{t('app.name')}</p>
            <p className="footer-tagline">{t('app.tagline')}</p>
            <p>{t('footer.scope.1')}</p>
            <p>{t('footer.scope.2')}</p>
          </div>

          <nav className="footer-links" aria-label={t('footer.navLabel')}>
            <ul>
              <li>
                <button type="button" className="footer-link" onClick={openHowItWorks}>
                  {t('howItWorks.navLabel')}
                </button>
              </li>
              <li>
                <button type="button" className="footer-link" onClick={openWhy}>
                  {t('home.whyBuilt')}
                </button>
              </li>
              <li>
                <FeedbackTrigger onOpen={() => setFeedbackOpen(true)} className="footer-link" />
              </li>
            </ul>
            <p className="footer-privacy">
              <span className="footer-label">{t('footer.privacy')}</span> {t('app.onDevice')}
            </p>
            <p className="footer-credit">{t('home.trust.reviewer')}</p>
          </nav>

          {/* The only place in the footer the crisis colour appears. */}
          <section className="footer-crisis" aria-labelledby="footer-crisis-title">
            <h2 className="footer-crisis-title" id="footer-crisis-title">
              {t('home.crisisStrip.title')}
            </h2>
            <CrisisLines language={context?.language ?? language} />
            <p className="footer-crisis-foot">{t('crisis.ifClosed')}</p>
          </section>
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
