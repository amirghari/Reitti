/**
 * The one questionnaire engine's UI. Every instrument renders through this
 * component — adding an instrument is a config change, never a component change.
 *
 * Items are shown one at a time. That is partly kindness (a wall of symptom
 * questions is a lot to meet at once) and partly safety invariant 2: a crisis
 * answer can interrupt the moment it is given, before scoring happens.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { checkCrisis, scaleFor, type Answers, type Instrument } from '@reitti/engine';
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
}

export function Questionnaire({
  instrument,
  onComplete,
  onSkip,
  onCrisis,
  paused,
  resumeToken,
}: QuestionnaireProps) {
  const [answers, setAnswers] = useState<Answers>({});
  const [index, setIndex] = useState(0);
  const [gatePassed, setGatePassed] = useState(!instrument.gate);
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
    if (held.complete) onComplete(held.answers);
    else setIndex((i) => i + 1);
  });

  const item = instrument.items[index];
  const scale = useMemo(() => (item ? scaleFor(instrument, item.key) : []), [instrument, item]);

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

    const isLast = index === instrument.items.length - 1;

    if (checkCrisis(instrument, next)) {
      // Hold everything. Nothing is scored and nothing advances until the
      // person has seen the crisis panel and chosen to continue.
      setPending({ answers: next, complete: isLast });
      onCrisis();
      return;
    }

    if (isLast) onComplete(next);
    else setIndex(index + 1);
  };

  return (
    <section>
      <InstrumentHeader instrument={instrument} />

      <div
        className="progress"
        role="progressbar"
        aria-valuenow={index + 1}
        aria-valuemin={1}
        aria-valuemax={instrument.items.length}
      >
        <div
          className="progress-bar"
          style={{ width: `${(index / instrument.items.length) * 100}%` }}
        />
      </div>
      <p className="progress-label">
        Question {index + 1} of {instrument.items.length}
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
        <button type="button" className="link" onClick={() => setIndex(index - 1)}>
          ← Previous question
        </button>
      )}
    </section>
  );
}

/** The presentation pattern from the catalog: purpose always, science on demand. */
export function InstrumentHeader({ instrument }: { instrument: Instrument }) {
  return (
    <header className="instrument-header">
      <h2>
        {instrument.name} · {instrument.items.length} questions
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
