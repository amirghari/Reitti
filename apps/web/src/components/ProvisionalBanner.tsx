/**
 * A person can now reach this build from a public URL with no login in front of
 * it, and nothing on the page told them what they were looking at.
 *
 * Every routing rule, band reflection and directory entry here is provisional
 * and unreviewed by a clinician. That is fine for a preview being used to think
 * with, and not fine for somebody who arrived looking for help and has no way to
 * tell the difference. The scope statement on the result screen says what Reitti
 * is; this says what *this build* is, and it has to be visible before they start
 * rather than after they finish.
 *
 * It is dismissible per device, because a partner clicking through it twenty
 * times is a banner everybody learns to ignore. It is not dismissible for good:
 * the crisis control stays regardless, and this comes back in a new session.
 */
import { useState } from 'react';
import { t } from '../i18n';

const KEY = 'reitti.previewNoticeDismissed';

export function ProvisionalBanner() {
  const [dismissed, setDismissed] = useState(() => {
    try {
      return sessionStorage.getItem(KEY) === 'true';
    } catch {
      return false;
    }
  });

  if (dismissed) return null;

  return (
    <aside className="provisional-banner" role="note" aria-label={t('preview.label')}>
      <p className="provisional-banner-body">
        <strong>{t('preview.heading')}</strong> {t('preview.body')}
      </p>
      <button
        type="button"
        className="provisional-banner-dismiss"
        onClick={() => {
          setDismissed(true);
          try {
            // Session-scoped on purpose: it returns for the next person, and for
            // this person tomorrow.
            sessionStorage.setItem(KEY, 'true');
          } catch {
            /* private browsing — the banner simply stays, which is the safe way to fail */
          }
        }}
      >
        {t('preview.dismiss')}
      </button>
    </aside>
  );
}
