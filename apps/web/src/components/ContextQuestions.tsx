/**
 * The five non-clinical inputs the routing engine needs alongside a severity
 * band: domain, duration, budget, care language and age band.
 *
 * None of these is a test. Budget and language shape the suggestion and never
 * remove an option from view. The age band is the one input that genuinely does
 * filter — an under-18 is never routed to an adult private rung — which is why
 * it is a band rather than an age, and why it never leaves the device.
 */
import { useRef, useState } from 'react';
import { AGE_BANDS, BUDGETS, DOMAINS, DURATIONS, LANGUAGES } from '../config';
import { useAdvanceFocus } from '../advanceFocus';
import { useAnswerHold } from '../answerHold';
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

  const heading = useRef<HTMLHeadingElement>(null);
  useAdvanceFocus(heading, index);

  const answerHold = useAnswerHold();

  const choose = (value: string) => {
    if (answerHold.holding) return;
    const next = { ...answers, [step.key]: value };
    setAnswers(next);
    answerHold.hold(() => {
      if (index === STEPS.length - 1) {
        onComplete(next as ContextAnswers);
      } else {
        onProgress?.(next, index + 1);
        setIndex(index + 1);
      }
    });
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

      {/* Position only, same as the questionnaire: focus moves to the question
          below, so repeating its wording here would say it twice. */}
      <p className="sr-only" role="status">
        {t('context.progress')
          .replace('{current}', String(index + 1))
          .replace('{total}', String(STEPS.length))}
      </p>

      {/* The one picture in the flow: the way in, before any question about how
          somebody feels. Line art, no faces, and it never moves. */}
      {index === 0 && <RouteIllustration />}

      {/* Keyed by step so React replaces the node, which restarts the animation. */}
      <h1 key={`q-${step.key}`} ref={heading} tabIndex={-1} className="question">
        {t(step.questionRef)}
      </h1>
      <p className="help">{t(step.helpRef)}</p>

      <div className="options" key={`o-${step.key}`}>
        {step.options.map((option) => (
          <button
            key={option.id}
            type="button"
            className="option"
            aria-pressed={answers[step.key] === option.id}
            onClick={() => choose(option.id)}
          >
            <span className="option-mark" aria-hidden="true" />
            <span className="option-label">{optionLabel(option)}</span>
          </button>
        ))}
      </div>

      <button
        type="button"
        className="link"
        onClick={() => {
          answerHold.cancel();
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

/**
 * A path climbing over two hills toward a sun: the route, drawn once. Decorative
 * and hidden from assistive tech; it says nothing the heading does not.
 */
function RouteIllustration() {
  return (
    <svg className="route-illustration" viewBox="0 0 240 96" width="240" height="96" aria-hidden="true" focusable="false">
      <g fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 84 C 40 60, 70 58, 104 72 S 170 88, 236 52" />
        <path d="M18 90 C 60 76, 96 80, 130 86 S 200 90, 236 80" strokeDasharray="2 7" />
        <circle cx="196" cy="26" r="11" />
        <path d="M196 6v5M196 41v5M176 26h5M211 26h5M182 12l3.5 3.5M206.5 36.5l3.5 3.5M182 40l3.5-3.5M206.5 15.5l3.5-3.5" />
        <circle cx="44" cy="80" r="3.25" fill="currentColor" />
        <circle cx="128" cy="85" r="3.25" />
      </g>
    </svg>
  );
}
