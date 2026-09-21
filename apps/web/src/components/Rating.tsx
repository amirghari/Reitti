/**
 * "Was this useful?" — one optional number, at the bottom of the result.
 *
 * Three rules, all of them load-bearing:
 *
 * 1. **It never appears on the crisis path.** Not on the crisis panel, not on
 *    the under-18 screen, and not for the rest of a session in which the crisis
 *    path has opened for any reason. `mayAskForRating` owns that decision, the
 *    engine tests own the rule, and a browser test walks the crisis journey to
 *    prove the thing is actually absent from the page.
 * 2. **It sends three values.** The number, the interface language, the screen.
 *    The body is built by `ratingBody`, which constructs it key by key, so the
 *    result object sitting a few lines away in `Result.tsx` cannot leak into it.
 * 3. **It says so.** A person deciding whether to press a number should not have
 *    to take our word for what a click sends, so the copy states it before the
 *    click, not in a policy page.
 *
 * Buttons rather than radios on purpose: a radio group moves selection with the
 * arrow keys, and since picking a number sends it, that would fire a send per
 * keypress. Five buttons send once, when pressed.
 *
 * Dismissal is component state and reaches no storage. It is a "not now" for
 * this visit, and one more key in `localStorage` would be one more thing to
 * explain on a page whose claim is that it keeps nothing.
 */
import { useState } from 'react';
import { mayAskForRating, ratingBody, type RatingContext } from '@reitti/engine';
import { feedback } from '../config';
import { t, uiLanguage } from '../i18n';

type State = 'idle' | 'sending' | 'sent' | 'error' | 'dismissed';

export function Rating(context: RatingContext) {
  const [state, setState] = useState<State>('idle');

  // Asked once, before anything renders. Everything below is unreachable on the
  // crisis path, rather than hidden with CSS on it.
  if (!mayAskForRating(feedback.rating, context)) return null;
  if (state === 'dismissed') return null;

  const send = async (rating: number) => {
    if (state === 'sending' || state === 'sent') return;
    setState('sending');
    try {
      const body = ratingBody(feedback.rating, {
        rating,
        locale: uiLanguage(),
        screen: context.screen,
      });
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'omit',
        body: JSON.stringify(body),
      });
      setState(response.status === 204 ? 'sent' : 'error');
    } catch {
      setState('error');
    }
  };

  if (state === 'sent') {
    return (
      <section className="rating rating-done no-print" aria-live="polite">
        <p className="rating-thanks">{t('rating.sent')}</p>
      </section>
    );
  }

  const scale: number[] = [];
  for (let n = feedback.rating.min; n <= feedback.rating.max; n += 1) scale.push(n);

  return (
    <section className="rating no-print" aria-labelledby="rating-heading">
      <p className="rating-heading" id="rating-heading">
        {t('rating.heading')}
      </p>

      <div className="rating-scale" role="group" aria-labelledby="rating-heading">
        <span className="rating-end">{t('rating.low')}</span>
        {scale.map((n) => (
          <button
            key={n}
            type="button"
            className="rating-btn"
            data-rating={n}
            disabled={state === 'sending'}
            onClick={() => void send(n)}
          >
            {n}
          </button>
        ))}
        <span className="rating-end">{t('rating.high')}</span>
      </div>

      {/* Before the click, not after it, and not on a policy page. */}
      <p className="rating-note">{t('rating.nothingSent')}</p>

      {state === 'error' && (
        <p className="rating-note" role="status">
          {t('rating.error')}
        </p>
      )}

      <button type="button" className="link rating-dismiss" onClick={() => setState('dismissed')}>
        {t('rating.dismiss')}
      </button>
    </section>
  );
}
