/**
 * The ladder as a list of steps: full width, equal, stacked top-down, the
 * lightest first. Opening a step shows what is on it directly underneath.
 *
 * It replaced the staircase (D-37). The staircase tested badly twice: people
 * did not see that it could be clicked, asked why it was a pyramid, and nobody
 * read it bottom-up. And its panels rendered after every step, so opening one
 * on a desktop or a phone showed nothing where the person was looking.
 *
 * Order is ladder level, lowest first, which is also free first: the free and
 * public steps are the light ones. That is a reading of the config, not a rule
 * this component makes, and no step is ever hidden (CLAUDE.md).
 *
 * Everything is read from `config/ladder` and `config/directory`. A step is
 * tinted where the directory has free `care` or `gated-care` on it, and the
 * legend says so, so the tint is information rather than decoration.
 */
import { useId, useRef, useState } from 'react';
import { entriesForRung, freeCareAt, gatedFreeCareAt } from '@reitti/engine';
import { directory, ladder } from '../config';
import { t } from '../i18n';
import { OptionCard } from './Options';

/** How many entries a panel shows before "see all" opens the rest. */
const PREVIEW = 2;

export function StepList({ careLanguage = 'fi' }: { careLanguage?: string }) {
  const steps = [...ladder.rungs].sort((a, b) => a.level - b.level);

  const [openId, setOpenId] = useState<string | null>(steps[0]?.id ?? null);
  const [showAll, setShowAll] = useState(false);
  const panelId = useId();
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);

  const toggle = (id: string) => {
    setShowAll(false);
    setOpenId((current) => (current === id ? null : id));
  };

  /** Arrow keys walk the list in reading order; Enter and Space are the button's. */
  const onKeyDown = (event: React.KeyboardEvent, index: number) => {
    const next =
      event.key === 'ArrowDown' || event.key === 'ArrowRight'
        ? index + 1
        : event.key === 'ArrowUp' || event.key === 'ArrowLeft'
          ? index - 1
          : event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? steps.length - 1
              : null;
    if (next === null) return;
    const target = buttons.current[Math.max(0, Math.min(steps.length - 1, next))];
    if (!target) return;
    event.preventDefault();
    target.focus();
  };

  return (
    <section className="steplist-section">
      <h2 className="section-title" data-reveal>{t('ladder.pyramid.title')}</h2>
      <p className="steplist-subline">{t('ladder.pyramid.subline')}</p>
      <p className="steplist-hint">{t('ladder.pyramid.hint')}</p>
      {/* The tint was unexplained. Now it is a key. */}
      <p className="steplist-legend">
        <span className="steplist-swatch" aria-hidden="true" />
        {t('ladder.pyramid.legend')}
      </p>

      <ol className="steplist">
        {steps.map((step, index) => {
          const free = freeCareAt(directory, step.id) ?? gatedFreeCareAt(directory, step.id);
          const open = openId === step.id;
          // Language reorders and never removes, so the panel lists what the
          // step really has; `entriesForRung` applies age only.
          const entries = entriesForRung(directory, step.id, { careLanguage });
          const shown = showAll ? entries : entries.slice(0, PREVIEW);
          return (
            <li key={step.id} className="steplist-item" data-rung={step.id} data-level={step.level}>
              <button
                type="button"
                ref={(el) => {
                  buttons.current[index] = el;
                }}
                className="steplist-bar"
                data-free={free ? 'true' : undefined}
                aria-expanded={open}
                aria-controls={`${panelId}-${step.id}`}
                onClick={() => toggle(step.id)}
                onKeyDown={(event) => onKeyDown(event, index)}
              >
                <span className="steplist-name">{t(step.labelRef)}</span>
                <span className="steplist-meta">
                  <span className="steplist-cost" data-free={free ? 'true' : undefined}>
                    {t(step.costShortRef)}
                  </span>
                  <svg className="steplist-chevron" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
                    <path d="M3.5 6l4.5 4.5L12.5 6" fill="none" stroke="currentColor" strokeWidth="1.75"
                      strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </button>

              {/* Directly under the step that owns it, so opening a step shows
                  its contents where the person is looking, on every screen. */}
              <div id={`${panelId}-${step.id}`} className="steplist-panel" hidden={!open} aria-label={t(step.labelRef)}>
                {/* One child, so the panel can animate its height through
                    grid-template-rows 0fr to 1fr when motion is on. At rest,
                    and with motion off, `hidden` is what closes it. */}
                <div className="steplist-panel-inner">
                  <div className="steplist-panel-body">
                    {/* The cost is on the step's own chip, directly above. */}
                    {entries.length === 0 && <p className="steplist-none">{t('ladder.pyramid.noneFree')}</p>}
                    <ul className="option-list">
                      {shown.map((entry) => (
                        <OptionCard key={entry.id} entry={entry} careLanguage={careLanguage} showCost={false} />
                      ))}
                    </ul>
                    {entries.length > PREVIEW && (
                      <button type="button" className="link steplist-see-all" onClick={() => setShowAll((v) => !v)}>
                        {showAll
                          ? t('ladder.pyramid.showFewer')
                          : `${t('ladder.pyramid.seeAll')} ${entries.length}`}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
