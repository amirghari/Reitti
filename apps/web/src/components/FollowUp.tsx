/**
 * "Did you get in?" (C3).
 *
 * The seed of the outcomes story, and deliberately the thinnest possible version
 * of it. Three buttons, one of three integers goes up, and nothing else is sent —
 * not the rung, not the band, not the time. A richer record is what would turn
 * Reitti into a health-data controller, so the answer to "can we segment this by
 * rung" is in decision D-6 rather than in this file.
 */
import { useState } from 'react';
import { t } from '../i18n';
import { dismissFollowUp, markAnswered, type OutcomeBucket } from '../followUp';
import { poolingEnabled, submitOutcome } from '../pool';

const BUCKETS: OutcomeBucket[] = ['got-in', 'still-waiting', 'gave-up'];

export function FollowUp({ onDone }: { onDone: () => void }) {
  const [sending, setSending] = useState(false);

  const answer = async (bucket: OutcomeBucket) => {
    setSending(true);
    if (poolingEnabled()) await submitOutcome(bucket).catch(() => false);
    markAnswered();
    onDone();
  };

  return (
    <section className="follow-up" role="region" aria-label={t('followUp.heading')}>
      <h2 className="follow-up-heading">{t('followUp.heading')}</h2>
      <p className="follow-up-help">{t('followUp.help')}</p>

      <div className="follow-up-actions">
        {BUCKETS.map((bucket) => (
          <button
            key={bucket}
            type="button"
            className="btn btn-ghost"
            disabled={sending}
            onClick={() => answer(bucket)}
          >
            {t(`followUp.${bucket}`)}
          </button>
        ))}
      </div>

      <p className="follow-up-privacy">{t('followUp.privacy')}</p>

      <button
        type="button"
        className="link"
        onClick={() => {
          dismissFollowUp();
          onDone();
        }}
      >
        {t('followUp.dismiss')}
      </button>
    </section>
  );
}
