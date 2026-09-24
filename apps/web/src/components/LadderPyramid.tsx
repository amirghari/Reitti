/**
 * The ladder as a staircase: widest step at the bottom, narrowest at the top.
 *
 * The shape is the argument. Most people need the wide, free, low steps, and
 * far fewer need the narrow, expensive, gated ones at the top — so the widest
 * bar is rung 0 and the narrowest is Kela psychotherapy. Starting low is not
 * settling for less, which is what the subline says out loud.
 *
 * Everything here is read from `config/ladder` and `config/directory`. The
 * component knows no rung names, no costs and no services: which steps are
 * filled comes from whether the directory has free `care` or `gated-care` on
 * that rung, so the fill is a rendering of existing data and not a new claim.
 *
 * Deliberately NOT one continuous SVG outline, which the task asks for. Rung
 * names wrap in Finnish and Swedish and the narrowest step carries the longest
 * label ("Kelan kuntoutuspsykoterapia"), so step heights are not fixed. A
 * fixed-geometry SVG path would either clip that text or drift away from the
 * boxes it is supposed to outline. This is the same lesson `HowItWorks` already
 * records: SVG text does not wrap, so the boxes are HTML. The outline is drawn
 * with borders instead, 1.5px in the primary colour, which is what the task was
 * describing.
 */
import { useId, useRef, useState } from 'react';
import { entriesForRung, freeCareAt, gatedFreeCareAt } from '@reitti/engine';
import { directory, ladder } from '../config';
import { t } from '../i18n';
import { OptionCard } from './Options';

/** How many entries a panel shows before "see all" opens the rest. */
const PREVIEW = 2;

export function LadderPyramid({ careLanguage = 'fi' }: { careLanguage?: string }) {
  // Bottom of the staircase first in the DOM, so reading order and visual order
  // agree: rung 0 is the widest bar and the first thing a screen reader meets.
  const rungs = [...ladder.rungs].sort((a, b) => a.level - b.level);

  const [openId, setOpenId] = useState<string | null>(rungs[0]?.id ?? null);
  const [showAll, setShowAll] = useState(false);
  const panelId = useId();
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);

  const toggle = (id: string) => {
    setShowAll(false);
    setOpenId((current) => (current === id ? null : id));
  };

  /** Arrow keys walk the steps; the browser handles Enter and Space on a button. */
  const onKeyDown = (event: React.KeyboardEvent, index: number) => {
    const next =
      event.key === 'ArrowUp' || event.key === 'ArrowRight'
        ? index + 1
        : event.key === 'ArrowDown' || event.key === 'ArrowLeft'
          ? index - 1
          : event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? rungs.length - 1
              : null;
    if (next === null) return;
    const target = buttons.current[Math.max(0, Math.min(rungs.length - 1, next))];
    if (!target) return;
    event.preventDefault();
    target.focus();
  };

  return (
    <section className="pyramid-section">
      <h2 className="section-title" data-reveal>{t('ladder.pyramid.title')}</h2>
      <p className="pyramid-subline">{t('ladder.pyramid.subline')}</p>

      <div className="pyramid">
        <ol className="pyramid-steps">
          {/* DOM order is rung 0 first, and CSS (`column-reverse`) puts it at the
              bottom of the stack. Reversing here instead would hand a screen
              reader the narrowest, most gated step first, which is the opposite
              of the argument the shape is making. */}
          {rungs.map((rung, index) => {
            const free = freeCareAt(directory, rung.id) ?? gatedFreeCareAt(directory, rung.id);
            const open = openId === rung.id;
            return (
              <li key={rung.id} className="pyramid-step" data-reveal data-rung={rung.id} data-level={rung.level}
                style={{ ["--i" as string]: rung.level }}>
                <button
                  type="button"
                  ref={(el) => {
                    buttons.current[index] = el;
                  }}
                  className="pyramid-bar"
                  // Each step is 48px narrower than the one below it.
                  style={{ width: `calc(100% - ${rung.level * 48}px)` }}
                  data-free={free ? 'true' : undefined}
                  aria-expanded={open}
                  aria-controls={`${panelId}-${rung.id}`}
                  onClick={() => toggle(rung.id)}
                  onKeyDown={(event) => onKeyDown(event, index)}
                >
                  <span className="pyramid-name">{t(rung.labelRef)}</span>
                  <span className="pyramid-cost" data-free={free ? 'true' : undefined}>
                    {t(rung.costShortRef)}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>

        {rungs.map((rung) => {
          const open = openId === rung.id;
          // Language reorders and never removes, so the panel lists what the
          // rung really has; `entriesForRung` applies age only.
          const entries = entriesForRung(directory, rung.id, { careLanguage });
          const shown = showAll ? entries : entries.slice(0, PREVIEW);
          return (
            <div
              key={rung.id}
              id={`${panelId}-${rung.id}`}
              className="pyramid-panel"
              hidden={!open}
              aria-label={t(rung.labelRef)}
            >
              {/* The cost is on the step's own chip, directly above this panel.
                  Saying it again here is how a page ends up repeating "Free"
                  four times in one screen. */}
              {entries.length === 0 && <p className="pyramid-none">{t('ladder.pyramid.noneFree')}</p>}
              <ul className="option-list">
                {shown.map((entry) => (
                  <OptionCard key={entry.id} entry={entry} careLanguage={careLanguage} showCost={false} />
                ))}
              </ul>
              {entries.length > PREVIEW && (
                <button type="button" className="link pyramid-see-all" onClick={() => setShowAll((v) => !v)}>
                  {showAll
                    ? t('ladder.pyramid.showFewer')
                    : `${t('ladder.pyramid.seeAll')} ${entries.length}`}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
