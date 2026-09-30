/**
 * The one questionnaire engine's UI. Every instrument renders through this
 * component — adding an instrument is a config change, never a component change.
 *
 * Items are shown one at a time. That is partly kindness (a wall of symptom
 * questions is a lot to meet at once) and partly safety invariant 2: a crisis
 * answer can interrupt the moment it is given, before scoring happens.
 */
import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import {
  carriedAnswers,
  checkCrisis,
  itemsToAsk,
  scaleFor,
  type Answers,
  type CarriedAnswer,
  type FunnelPosition,
  type Instrument,
  type OpenedVia,
} from '@reitti/engine';
import { useAdvanceFocus } from '../advanceFocus';
import { useAnswerHold } from '../answerHold';
import { t } from '../i18n';

interface QuestionnaireProps {
  instrument: Instrument;
  onComplete: (answers: Answers) => void;
  /** The gate was answered "no" — this instrument does not apply to this person. */
  onSkip: () => void;
  /** A crisis item fired. The parent shows the panel; the flow waits here. */
  onCrisis: () => void;
  /** "You can stop any time": to the free options, keeping the run. */
  onStop: () => void;
  /** Which part of the funnel this is, and the most there could be. */
  position: FunnelPosition;
  /** Why the funnel opened this instrument, for the milestone between parts. */
  openedVia: OpenedVia;
  /** Set while the crisis panel is open, so answering cannot continue behind it. */
  paused: boolean;
  /** Bumped by the parent when the person closes the crisis panel and continues. */
  resumeToken: number;
  /** Answers already given for this instrument — a restored draft, or carried over. */
  initialAnswers?: Answers;
  /** Where to resume. */
  initialIndex?: number;
  /**
   * Committed progress, for the refresh-durable draft. Called only for answers
   * that did not trip a crisis item — those are held, not committed.
   */
  onProgress?: (answers: Answers, index: number) => void;
  /**
   * Items of this instrument already answered under another one — PHQ-4 is the
   * first two items of PHQ-9 and of GAD-7. Reused rather than asked again.
   */
  carried?: CarriedAnswer[];
}

export function Questionnaire({
  instrument,
  onComplete,
  onSkip,
  onCrisis,
  onStop,
  position,
  openedVia,
  paused,
  resumeToken,
  initialAnswers,
  initialIndex,
  onProgress,
  carried,
}: QuestionnaireProps) {
  // The person can decline the carry-over and answer everything again.
  const [reuse, setReuse] = useState(true);
  const active = useMemo(() => (reuse ? (carried ?? []) : []), [reuse, carried]);
  const askItems = useMemo(() => itemsToAsk(instrument, active), [instrument, active]);

  const [answers, setAnswers] = useState<Answers>(() => ({
    ...carriedAnswers(carried ?? []),
    ...initialAnswers,
  }));
  const [index, setIndex] = useState(initialIndex ?? 0);
  // Answers already present mean the gate was passed before the refresh.
  const [gatePassed, setGatePassed] = useState(
    !instrument.gate || Object.keys(initialAnswers ?? {}).length > 0,
  );
  // Answers held back because a crisis fired; applied when the person continues.
  const [pending, setPending] = useState<{ answers: Answers; complete: boolean } | null>(null);
  const handledResume = useRef(resumeToken);

  // The parent bumped resumeToken: the person closed the crisis panel, so the
  // held answers may now be applied. This runs after commit rather than during
  // render, because completing calls back into the parent's state.
  useEffect(() => {
    if (resumeToken === handledResume.current) return;
    handledResume.current = resumeToken;
    if (!pending) return;
    const held = pending;
    setPending(null);
    if (held.complete) {
      onComplete(held.answers);
    } else {
      // Safe to commit to the draft now: the panel has been seen and dismissed.
      onProgress?.(held.answers, index + 1);
      setIndex((i) => i + 1);
    }
  });

  const item = askItems[index];
  const scale = useMemo(() => (item ? scaleFor(instrument, item.key) : []), [instrument, item]);

  const heading = useRef<HTMLHeadingElement>(null);
  // The gate is its own screen, so passing it counts as a move even though the
  // item index is still 0. Held while the crisis panel is open.
  useAdvanceFocus(heading, gatePassed ? index : 'gate', { hold: paused });

  const answerHold = useAnswerHold();
  // Read when a hold ends, which is after the render that started it.
  const pausedNow = useRef(paused);
  pausedNow.current = paused;

  /** Decline the carry-over: drop those answers and ask the whole instrument. */
  const answerCarriedAgain = () => {
    const stripped = { ...answers };
    for (const c of carried ?? []) delete stripped[c.key];
    setReuse(false);
    setAnswers(stripped);
    setIndex(0);
    onProgress?.(stripped, 0);
  };

  if (!gatePassed && instrument.gate) {
    return (
      <section>
        <InstrumentHeader instrument={instrument} />
        <p className="question">{t(instrument.gate.textRef)}</p>
        <div className="options">
          <button type="button" className="option" onClick={() => setGatePassed(true)}>
            Yes
          </button>
          <button type="button" className="option" onClick={onSkip}>
            No
          </button>
        </div>
        <button type="button" className="link" onClick={onSkip}>
          I'd rather not answer this
        </button>
      </section>
    );
  }

  if (!item) return null;

  const choose = (value: number) => {
    if (paused || answerHold.holding) return;
    const next = { ...answers, [item.key]: value };
    setAnswers(next);

    const isLast = index === askItems.length - 1;

    if (checkCrisis(instrument, next)) {
      // Hold everything. Nothing is scored and nothing advances until the
      // person has seen the crisis panel and chosen to continue. Checked before
      // the pause below, never after it: the panel opens on the answer.
      setPending({ answers: next, complete: isLast });
      onCrisis();
      return;
    }

    answerHold.hold(() => {
      // The crisis control was pressed during the pause. Nothing moves behind
      // the panel; the answer is applied when it closes, as a crisis answer is.
      if (pausedNow.current) {
        setPending({ answers: next, complete: isLast });
        return;
      }
      if (isLast) {
        onComplete(next);
      } else {
        onProgress?.(next, index + 1);
        setIndex(index + 1);
      }
    });
  };

  const partLabel = t(position.exact ? 'questionnaire.partExact' : 'questionnaire.part')
    .replace('{part}', String(position.part))
    .replace('{total}', String(position.upTo));
  const questionLabel = t('questionnaire.question')
    .replace('{current}', String(index + 1))
    .replace('{total}', String(askItems.length));

  return (
    <section>
      {/* The instrument's own introduction, once, at the start of its part, as
          a milestone: a new part should read as progress, not as a restart.
          After that, only its name and the science on demand. */}
      {index === 0 ? (
        <Milestone
          instrument={instrument}
          questionCount={askItems.length}
          openedVia={openedVia}
          carried={
            active.length > 0 ? (
              <CarriedNote instrument={instrument} carried={active} onAnswerAgain={answerCarriedAgain} />
            ) : null
          }
        />
      ) : (
        <InstrumentHeader instrument={instrument} questionCount={askItems.length} compact />
      )}

      <RouteLine position={position} index={index} total={askItems.length} />
      <p className="progress-label">
        {partLabel} · {questionLabel}
      </p>

      {/* Position only. Focus moves to the question below, which is how its
          wording gets announced — repeating the wording here would say every
          question twice. How far along the person is has no other spoken source,
          so it is what this carries. Silent while the crisis panel is open: that
          dialog is the only thing that should be speaking. */}
      <p className="sr-only" role="status">
        {paused ? '' : `Question ${index + 1} of ${askItems.length}.`}
      </p>

      <p className="prompt">{t(instrument.promptRef)}</p>
      {/* The instrument and item ids are in the DOM so end-to-end tests can drive
          a specific journey — "answer moderately but do not trip the self-harm
          item" — without asserting on the clinician's wording, which is expected
          to change without a code review. Ids, never answers.

          Keyed by item so React replaces the node rather than editing its text,
          which is what restarts the enter animation. */}
      <h1
        key={`q-${item.key}`}
        ref={heading}
        tabIndex={-1}
        className="question"
        data-instrument={instrument.id}
        data-item={item.key}
      >
        {t(item.textRef)}
      </h1>

      {/* The response scale is governed content: styled, never restructured.
          `aria-pressed` carries the answer already given, so going back shows
          it, and a screen reader hears which one it was. */}
      <div className="options" key={`o-${item.key}`}>
        {scale.map((option) => (
          <button
            key={option.value}
            type="button"
            className="option"
            aria-pressed={answers[item.key] === option.value}
            disabled={paused}
            onClick={() => choose(option.value)}
          >
            <span className="option-mark" aria-hidden="true" />
            <span className="option-label">{t(option.labelRef)}</span>
          </button>
        ))}
      </div>

      <div className="question-foot">
        {index > 0 && (
          <button
            type="button"
            className="link"
            onClick={() => {
              answerHold.cancel();
              onProgress?.(answers, index - 1);
              setIndex(index - 1);
            }}
          >
            ← Previous question
          </button>
        )}
        {/* Always under the item, on every question. Stopping keeps the run, so
            this costs the person nothing. */}
        <button type="button" className="link stop-link" onClick={onStop}>
          {t('questionnaire.stopAnyTime')}
        </button>
      </div>
    </section>
  );
}

/**
 * The route line: one dot per part the funnel could run, the current one in
 * the sun colour, finished ones in the primary colour, the rest in the line
 * colour. The segment after the current dot is the question-level progress bar,
 * with the same role and the same numbers it always had: a part is drawn as
 * travelled exactly as far as the questions in it have been.
 *
 * The count comes from `funnelPosition`, from config, and is a ceiling. It is
 * never a promise, which is why the label says "up to" until it is certain.
 */
function RouteLine({ position, index, total }: { position: FunnelPosition; index: number; total: number }) {
  const parts = Array.from({ length: position.upTo }, (_, i) => i + 1);
  return (
    <div className="route-line">
      {parts.map((part) => {
        const state = part < position.part ? 'done' : part === position.part ? 'current' : 'next';
        return (
          <Fragment key={part}>
            <span className="route-dot" data-state={state} />
            {state === 'current' ? (
              <div
                className="progress"
                role="progressbar"
                aria-label="Questionnaire progress"
                aria-valuenow={index + 1}
                aria-valuemin={1}
                aria-valuemax={total}
              >
                <div className="progress-bar" style={{ width: `${((index + 1) / total) * 100}%` }} />
              </div>
            ) : (
              <span className="route-segment" data-state={state} />
            )}
          </Fragment>
        );
      })}
    </div>
  );
}

/**
 * The start of a part. For the first, the instrument's purpose. For a deeper
 * one, what the funnel is doing and why: "Your first answers point us to look
 * closer at worry and tension." That describes the funnel, never the person,
 * and it is said between instruments only, never inside one, because a
 * validated instrument means nothing until it is complete (D-30).
 */
function Milestone({
  instrument,
  questionCount,
  openedVia,
  carried,
}: {
  instrument: Instrument;
  questionCount: number;
  openedVia: OpenedVia;
  carried: React.ReactNode;
}) {
  // The entry screener has no "why": it is where everyone starts. A deeper one
  // with no topic in the bundle gets no "why" line rather than a raw key; a test
  // holds every screener the funnel can open to having one.
  const topicRef = `milestone.topic.${instrument.id}`;
  const topic = openedVia === 'entry' ? null : t(topicRef);
  const why =
    topic === null || topic === topicRef ? null : t(`milestone.${openedVia}`).replace('{topic}', topic);
  const count =
    questionCount === 1
      ? t('milestone.count.one')
      : t('milestone.count.other').replace('{n}', String(questionCount));

  return (
    <header className="milestone instrument-header">
      <p className="milestone-eyebrow">
        {instrument.name} · {questionCount} questions
      </p>
      <h2 className="milestone-title">{why ?? t(instrument.purposeRef)}</h2>
      {why && (
        <p className="milestone-body">
          {count} {t(instrument.purposeRef)}
        </p>
      )}
      <details className="about">
        <summary>{t('questionnaire.about')}</summary>
        <p>{t(instrument.aboutRef)}</p>
        <p className="fine-print" style={{ marginTop: '0.6rem' }}>
          {instrument.source}
        </p>
      </details>
      {carried}
    </header>
  );
}

/**
 * What was reused, in the open.
 *
 * Silently skipping questions would look like a bug — or worse, like answers
 * being invented. The person is told how many were carried, can read exactly
 * what was carried and what they said, and can throw the carry-over away and
 * answer everything themselves. The engine decides what *may* be reused; the
 * person decides whether it is.
 */
function CarriedNote({
  instrument,
  carried,
  onAnswerAgain,
}: {
  instrument: Instrument;
  carried: CarriedAnswer[];
  onAnswerAgain: () => void;
}) {
  const one = carried.length === 1;
  return (
    <div className="carried-note">
      <p>
        {carried.length} {one ? 'question was' : 'questions were'} already answered a moment ago, so{' '}
        {one ? 'it is' : 'they are'} filled in and you will not be asked{' '}
        {one ? 'it' : 'them'} again.
      </p>
      <details>
        <summary>{t('questionnaire.carried')}</summary>
        <ul>
          {carried.map((c) => {
            const item = instrument.items.find((i) => i.key === c.key);
            const option = scaleFor(instrument, c.key).find((o) => o.value === c.value);
            return (
              <li key={c.key}>
                <span className="carried-question">{item ? t(item.textRef) : c.key}</span>
                <span className="carried-answer">{option ? t(option.labelRef) : c.value}</span>
              </li>
            );
          })}
        </ul>
        <button type="button" className="link" onClick={onAnswerAgain}>
          Answer these again instead
        </button>
      </details>
    </div>
  );
}

/** The presentation pattern from the catalog: purpose always, science on demand. */
export function InstrumentHeader({
  instrument,
  questionCount,
  compact,
}: {
  instrument: Instrument;
  /** What will actually be asked, which is fewer than the instrument's items when
      answers were carried over. The person is counting screens, not items. */
  questionCount?: number;
  /** Past the first question the purpose has been read; the name is enough. */
  compact?: boolean;
}) {
  return (
    <header className={`instrument-header${compact ? ' is-compact' : ''}`}>
      <h2>
        {instrument.name} · {questionCount ?? instrument.items.length} questions
      </h2>
      {!compact && <p className="purpose">{t(instrument.purposeRef)}</p>}
      <details className="about">
        <summary>{t('questionnaire.about')}</summary>
        <p>{t(instrument.aboutRef)}</p>
        <p className="fine-print" style={{ marginTop: '0.6rem' }}>
          {instrument.source}
        </p>
      </details>
    </header>
  );
}
