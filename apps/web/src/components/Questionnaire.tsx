/**
 * The one questionnaire engine's UI. Every instrument renders through this
 * component — adding an instrument is a config change, never a component change.
 *
 * Items are shown one at a time. That is partly kindness (a wall of symptom
 * questions is a lot to meet at once) and partly safety invariant 2: a crisis
 * answer can interrupt the moment it is given, before scoring happens.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  carriedAnswers,
  checkCrisis,
  itemsToAsk,
  scaleFor,
  type Answers,
  type CarriedAnswer,
  type Instrument,
} from '@reitti/engine';
import { t } from '../i18n';

interface QuestionnaireProps {
  instrument: Instrument;
  onComplete: (answers: Answers) => void;
  /** The gate was answered "no" — this instrument does not apply to this person. */
  onSkip: () => void;
  /** A crisis item fired. The parent shows the panel; the flow waits here. */
  onCrisis: () => void;
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
    if (paused) return;
    const next = { ...answers, [item.key]: value };
    setAnswers(next);

    const isLast = index === askItems.length - 1;

    if (checkCrisis(instrument, next)) {
      // Hold everything. Nothing is scored and nothing advances until the
      // person has seen the crisis panel and chosen to continue.
      setPending({ answers: next, complete: isLast });
      onCrisis();
      return;
    }

    if (isLast) {
      onComplete(next);
    } else {
      onProgress?.(next, index + 1);
      setIndex(index + 1);
    }
  };

  return (
    <section>
      <InstrumentHeader instrument={instrument} questionCount={askItems.length} />

      {active.length > 0 && (
        <CarriedNote
          instrument={instrument}
          carried={active}
          onAnswerAgain={answerCarriedAgain}
        />
      )}

      <div
        className="progress"
        role="progressbar"
        aria-label="Questionnaire progress"
        aria-valuenow={index + 1}
        aria-valuemin={1}
        aria-valuemax={askItems.length}
      >
        <div
          className="progress-bar"
          style={{ width: `${((index + 1) / askItems.length) * 100}%` }}
        />
      </div>
      <p className="progress-label">
        Question {index + 1} of {askItems.length}
      </p>

      {/* The question swaps in place, so nothing about it is announced on its
          own. Silent while the crisis panel is open: that dialog is the only
          thing that should be speaking. */}
      <p className="sr-only" role="status">
        {paused ? '' : `Question ${index + 1} of ${askItems.length}. ${t(item.textRef)}`}
      </p>

      <p className="prompt">{t(instrument.promptRef)}</p>
      <h1 className="question">{t(item.textRef)}</h1>

      <div className="options">
        {scale.map((option) => (
          <button
            key={option.value}
            type="button"
            className="option"
            disabled={paused}
            onClick={() => choose(option.value)}
          >
            {t(option.labelRef)}
          </button>
        ))}
      </div>

      {index > 0 && (
        <button
          type="button"
          className="link"
          onClick={() => {
            onProgress?.(answers, index - 1);
            setIndex(index - 1);
          }}
        >
          ← Previous question
        </button>
      )}
    </section>
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
        <summary>See what was carried over</summary>
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
}: {
  instrument: Instrument;
  /** What will actually be asked, which is fewer than the instrument's items when
      answers were carried over. The person is counting screens, not items. */
  questionCount?: number;
}) {
  return (
    <header className="instrument-header">
      <h2>
        {instrument.name} · {questionCount ?? instrument.items.length} questions
      </h2>
      <p className="purpose">{t(instrument.purposeRef)}</p>
      <details className="about">
        <summary>About this test</summary>
        <p>{t(instrument.aboutRef)}</p>
        <p className="fine-print" style={{ marginTop: '0.6rem' }}>
          {instrument.source}
        </p>
      </details>
    </header>
  );
}
