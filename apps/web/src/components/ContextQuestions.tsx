/**
 * The four non-clinical inputs the routing engine needs alongside a severity
 * band: domain, duration, budget and language. None of these is a test — they
 * shape the suggestion, and budget and language never remove an option from view.
 */
import { useState } from 'react';
import { BUDGETS, DOMAINS, DURATIONS, LANGUAGES } from '../config';

export interface ContextAnswers {
  statedDomain: string;
  duration: string;
  budget: string;
  language: string;
}

const STEPS = [
  {
    key: 'statedDomain' as const,
    question: 'What brings you here?',
    help: 'Pick whatever is closest. You can be wrong — this only shapes which questions we ask next.',
    options: DOMAINS,
  },
  {
    key: 'duration' as const,
    question: 'How long has this been going on?',
    help: 'A rough sense is fine. Duration tells short-term support apart from longer therapy.',
    options: DURATIONS,
  },
  {
    key: 'budget' as const,
    question: 'What can you spend on support right now?',
    help: 'This never hides an option from you — it only changes what we suggest starting with.',
    options: BUDGETS,
  },
  {
    key: 'language' as const,
    question: 'Which language do you want support in?',
    help: 'This is about the care we point you to, not the language of this page.',
    options: LANGUAGES,
  },
];

export function ContextQuestions({
  onComplete,
  onBack,
  initialAnswers,
  initialIndex,
  onProgress,
}: {
  onComplete: (answers: ContextAnswers) => void;
  onBack: () => void;
  /** A restored draft — see draft.ts. */
  initialAnswers?: Partial<ContextAnswers>;
  initialIndex?: number;
  onProgress?: (answers: Partial<ContextAnswers>, index: number) => void;
}) {
  const [index, setIndex] = useState(initialIndex ?? 0);
  const [answers, setAnswers] = useState<Partial<ContextAnswers>>(initialAnswers ?? {});

  const step = STEPS[index];

  const choose = (value: string) => {
    const next = { ...answers, [step.key]: value };
    setAnswers(next);
    if (index === STEPS.length - 1) {
      onComplete(next as ContextAnswers);
    } else {
      onProgress?.(next, index + 1);
      setIndex(index + 1);
    }
  };

  return (
    <section>
      <div
        className="progress"
        role="progressbar"
        aria-label="Context questions progress"
        aria-valuenow={index + 1}
        aria-valuemin={1}
        aria-valuemax={STEPS.length}
      >
        <div className="progress-bar" style={{ width: `${((index + 1) / STEPS.length) * 100}%` }} />
      </div>
      <p className="progress-label">
        Step {index + 1} of {STEPS.length} · about a minute
      </p>

      {/* Same reason as the questionnaire: the step swaps in place. */}
      <p className="sr-only" role="status">
        {`Step ${index + 1} of ${STEPS.length}. ${step.question}`}
      </p>

      <h1 className="question">{step.question}</h1>
      <p className="help">{step.help}</p>

      <div className="options">
        {step.options.map((option) => (
          <button key={option.id} type="button" className="option" onClick={() => choose(option.id)}>
            {option.label}
          </button>
        ))}
      </div>

      <button
        type="button"
        className="link"
        onClick={() => {
          if (index === 0) return onBack();
          onProgress?.(answers, index - 1);
          setIndex(index - 1);
        }}
      >
        ← {index > 0 ? 'Previous' : 'Back to start'}
      </button>
    </section>
  );
}
