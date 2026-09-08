/**
 * The five non-clinical inputs the routing engine needs alongside a severity
 * band: domain, duration, budget, care language and age band.
 *
 * None of these is a test. Budget and language shape the suggestion and never
 * remove an option from view. The age band is the one input that genuinely does
 * filter — an under-18 is never routed to an adult private rung — which is why
 * it is a band rather than an age, and why it never leaves the device.
 */
import { useState } from 'react';
import { AGE_BANDS, BUDGETS, DOMAINS, DURATIONS, LANGUAGES } from '../config';
import { t } from '../i18n';

export interface ContextAnswers {
  statedDomain: string;
  duration: string;
  budget: string;
  /** The CARE language — which language they want support in, not the interface. */
  language: string;
  /** A band, never an age (decision D-8). Never leaves the device. */
  ageBand: string;
}

interface Option {
  id: string;
  labelRef?: string;
  label?: string;
}

const STEPS: { key: keyof ContextAnswers; questionRef: string; helpRef: string; options: readonly Option[] }[] = [
  {
    key: 'statedDomain',
    questionRef: 'context.domain.question',
    helpRef: 'context.domain.help',
    options: DOMAINS,
  },
  {
    key: 'duration',
    questionRef: 'context.duration.question',
    helpRef: 'context.duration.help',
    options: DURATIONS,
  },
  {
    key: 'budget',
    questionRef: 'context.budget.question',
    helpRef: 'context.budget.help',
    options: BUDGETS,
  },
  {
    key: 'language',
    questionRef: 'context.language.question',
    helpRef: 'context.language.help',
    options: LANGUAGES,
  },
  {
    // Last, and coarse. It is the only demographic question we ask, it is asked
    // because some services are youth-only and some adult-only, and it never
    // leaves the device.
    key: 'ageBand',
    questionRef: 'context.ageBand.question',
    helpRef: 'context.ageBand.help',
    options: AGE_BANDS,
  },
];

/** An option's own endonym where it has one (Suomi), otherwise its translation. */
const optionLabel = (option: Option): string =>
  option.label ?? (option.labelRef ? t(option.labelRef) : option.id);

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
        {t('context.progress')
          .replace('{current}', String(index + 1))
          .replace('{total}', String(STEPS.length))}
      </p>

      {/* Same reason as the questionnaire: the step swaps in place. */}
      <p className="sr-only" role="status">
        {`${t('context.progress')
          .replace('{current}', String(index + 1))
          .replace('{total}', String(STEPS.length))}. ${t(step.questionRef)}`}
      </p>

      <h1 className="question">{t(step.questionRef)}</h1>
      <p className="help">{t(step.helpRef)}</p>

      <div className="options">
        {step.options.map((option) => (
          <button key={option.id} type="button" className="option" onClick={() => choose(option.id)}>
            {optionLabel(option)}
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
        ← {index > 0 ? t('context.previous') : t('context.backToStart')}
      </button>
    </section>
  );
}
