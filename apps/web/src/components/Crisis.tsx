/**
 * Safety invariants 1–3.
 *
 * The trigger is fixed to the viewport rather than placed in each screen, so it
 * is reachable without signing up, without starting a test, and without
 * finishing one — and no future screen can forget to render it.
 *
 * The panel lists phone numbers to trained humans. Never a chatbot. Never AI.
 * It also deliberately does not use the brand green: the crisis path must not
 * read as one more product feature.
 */
import { useEffect, useRef } from 'react';
import { crisis } from '../config';
import { t } from '../i18n';

export function CrisisTrigger({ onOpen }: { onOpen: () => void }) {
  return (
    <button type="button" className="crisis-fab" onClick={onOpen} aria-haspopup="dialog">
      <span className="crisis-fab-dot" aria-hidden="true" />
      {t('crisis.alwaysAvailable')}
    </button>
  );
}

interface CrisisPanelProps {
  /** True when an answer triggered this rather than the person opening it. */
  triggeredByAnswer: boolean;
  onClose: () => void;
  /** Present only when the flow was interrupted mid-questionnaire. */
  onContinue?: () => void;
  /** The support language the person chose, so their line is listed first. */
  preferredLanguage?: string;
}

export function CrisisPanel({
  triggeredByAnswer,
  onClose,
  onContinue,
  preferredLanguage,
}: CrisisPanelProps) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  /**
   * `aria-modal` is a promise to assistive technology, not an implementation.
   * Without a trap, Tab walks straight out of the panel and into the
   * questionnaire behind it — the person is answering symptom items again while
   * believing they are still in the crisis panel. That is invariant 1 failing in
   * the one way the config tests cannot see.
   *
   * Focus is also returned to whatever opened the panel, so closing it does not
   * dump a keyboard user back at the top of the document.
   */
  useEffect(() => {
    const restoreTo = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();

    const focusable = (): HTMLElement[] =>
      Array.from(
        panelRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      ).filter((el) => el.offsetParent !== null || el === document.activeElement);

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;

      const stops = focusable();
      if (stops.length === 0) return;

      const first = stops[0];
      const last = stops[stops.length - 1];
      const active = document.activeElement as HTMLElement | null;

      // Wrap at both ends, and pull focus back in if it has already escaped
      // (a browser-chrome round trip can leave it on <body>).
      if (!active || !panelRef.current?.contains(active)) {
        event.preventDefault();
        first.focus();
      } else if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      // Only restore if the trigger is still in the document and focus was not
      // deliberately moved somewhere else while the panel was closing.
      if (restoreTo?.isConnected) restoreTo.focus();
    };
  }, [onClose]);

  const resources = [...crisis.resources].sort((a, b) => {
    if (!preferredLanguage) return 0;
    return (
      Number(b.languages.includes(preferredLanguage)) - Number(a.languages.includes(preferredLanguage))
    );
  });

  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-labelledby="crisis-heading">
      <div className="panel" ref={panelRef}>
        <div className="panel-head">
          <h2 id="crisis-heading" className="panel-title">
            {t('crisis.heading')}
          </h2>
          <button type="button" className="panel-close" ref={closeRef} onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <p className="crisis-body">
          {triggeredByAnswer ? t('crisis.body') : t('crisis.lead')}
        </p>

        <ul className="crisis-resources">
          {resources.map((resource) => (
            <li key={resource.id}>
              <a href={`tel:${resource.phone.replace(/\s/g, '')}`} className="crisis-call">
                <span className="crisis-name">{t(resource.nameRef)}</span>
                <span className="crisis-phone">{resource.phone}</span>
              </a>
              <span className="crisis-hours">
                {resource.availability === '24/7'
                  ? 'Around the clock'
                  : 'Limited hours — check before calling'}
              </span>
            </li>
          ))}
        </ul>

        <p className="fine-print">{t('crisis.notDiagnosis')}</p>

        <div className="panel-actions">
          {onContinue && (
            <button type="button" className="btn btn-secondary" onClick={onContinue}>
              {t('crisis.continue')}
            </button>
          )}
          <button type="button" className="btn" onClick={onClose}>
            {t('crisis.close')}
          </button>
        </div>
      </div>
    </div>
  );
}
