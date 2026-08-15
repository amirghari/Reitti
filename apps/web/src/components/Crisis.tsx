/**
 * Safety invariants 1–3.
 *
 * The trigger is rendered by the app shell on every screen, so it is reachable
 * without signing up, without starting a test, and without finishing one.
 * The panel lists phone numbers to trained humans. Never a chatbot. Never AI.
 */
import { useEffect, useRef } from 'react';
import { crisis } from '../config';
import { t } from '../i18n';

export function CrisisTrigger({ onOpen }: { onOpen: () => void }) {
  return (
    <button type="button" className="crisis-trigger" onClick={onOpen}>
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

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const resources = [...crisis.resources].sort((a, b) => {
    if (!preferredLanguage) return 0;
    return (
      Number(b.languages.includes(preferredLanguage)) - Number(a.languages.includes(preferredLanguage))
    );
  });

  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-labelledby="crisis-heading">
      <div className="panel crisis-panel">
        <h2 id="crisis-heading">
          {triggeredByAnswer ? t('crisis.heading') : t('crisis.alwaysAvailable')}
        </h2>

        {triggeredByAnswer && <p className="crisis-body">{t('crisis.body')}</p>}

        <ul className="crisis-resources">
          {resources.map((resource) => (
            <li key={resource.id}>
              <a href={`tel:${resource.phone.replace(/\s/g, '')}`} className="crisis-call">
                <span className="crisis-name">{t(resource.nameRef)}</span>
                <span className="crisis-phone">{resource.phone}</span>
              </a>
              <span className="crisis-hours">
                {resource.availability === '24/7' ? 'Around the clock' : 'Limited hours — check before calling'}
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
          <button type="button" className="btn" ref={closeRef} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
