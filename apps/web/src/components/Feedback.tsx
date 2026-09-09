/**
 * Somewhere to send a note about the product.
 *
 * Deliberately a `mailto:` and a relay, never a form that posts somewhere with a
 * database behind it. Free text typed into a mental-health site will sometimes
 * describe somebody's mental health, and a store of that makes Reitti the
 * controller of special-category data. `/api/feedback` forwards to an inbox and
 * keeps nothing.
 *
 * Three ways to reach it, because each one fails for somebody: the form needs
 * the relay to be up, the `mailto:` needs a desktop mail client (the first
 * person to try it had none, and it silently did nothing), and the webmail links
 * only help Gmail and Outlook users. The copyable address always works.
 *
 * The copy carries more weight than any of them. It says what this is for, that
 * nobody is watching it, and where to go instead — pointing at the crisis
 * control rather than repeating a number that has one verified home in
 * `config/crisis.json`.
 *
 * Renders nothing while no address is configured, so an unset value ships safely.
 */
import { useRef, useState } from 'react';
import { feedback } from '../config';
import { t, uiLanguage } from '../i18n';
import { useFocusTrap } from '../useFocusTrap';

type FormState = 'idle' | 'sending' | 'sent' | 'error' | 'rate-limited';

/**
 * The form and the ways to reach the address, shared by the home-page section
 * and the dialog so the two cannot drift apart.
 */
function FeedbackBody() {
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState('');
  const [website, setWebsite] = useState(''); // honeypot: a real person never sees this
  const [state, setState] = useState<FormState>('idle');

  const address = feedback.address ?? '';
  const subject = encodeURIComponent(feedback.subject);
  const href = `mailto:${address}?subject=${subject}`;

  // Why the mailto failed for the first person who tried it: their mail is a
  // browser tab, not an application, so the operating system had nothing to hand
  // the link to. These open a compose window in the two clients that cover most
  // of that case. Plain links, so nothing is requested unless somebody clicks.
  const webmail = [
    {
      id: 'gmail',
      label: 'Gmail',
      url: `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(address)}&su=${subject}`,
    },
    {
      id: 'outlook',
      label: 'Outlook',
      url: `https://outlook.live.com/mail/0/deeplink/compose?to=${encodeURIComponent(address)}&subject=${subject}`,
    },
  ];

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 4000);
    } catch {
      // Clipboard denied or unavailable. The address is selectable text a few
      // pixels away, so there is nothing to recover from and nothing to say.
    }
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (message.trim() === '' || state === 'sending') return;
    setState('sending');
    try {
      // Same origin, so `connect-src 'self'` needs no widening. The body is
      // exactly what the person typed plus which language they were reading in.
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'omit',
        body: JSON.stringify({ message: message.trim(), locale: uiLanguage(), website }),
      });
      if (response.status === 204) {
        setState('sent');
        setMessage('');
      } else {
        setState(response.status === 429 ? 'rate-limited' : 'error');
      }
    } catch {
      setState('error');
    }
  };

  return (
    <>
      {feedback.formEnabled && (
        <form className="feedback-form" onSubmit={submit}>
          <label className="feedback-label" htmlFor="feedback-message">
            {t('feedback.fieldLabel')}
          </label>
          <textarea
            id="feedback-message"
            className="feedback-textarea"
            value={message}
            maxLength={feedback.maxLength}
            rows={5}
            onChange={(event) => {
              setMessage(event.target.value);
              if (state !== 'idle') setState('idle');
            }}
            placeholder={t('feedback.placeholder')}
          />

          {/* The honeypot. Off-screen rather than display:none, because some bots
              skip fields that are not rendered; aria-hidden and tabIndex -1 keep
              it away from anybody using a keyboard or a screen reader. */}
          <input
            type="text"
            className="feedback-honeypot"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            value={website}
            onChange={(event) => setWebsite(event.target.value)}
          />

          <div className="feedback-form-foot">
            <button type="submit" className="btn" disabled={state === 'sending' || !message.trim()}>
              {state === 'sending' ? t('feedback.sending') : t('feedback.send')}
            </button>
            <span className="feedback-count">
              {message.length} / {feedback.maxLength}
            </span>
          </div>

          <p className="feedback-result" role="status">
            {state === 'sent' && t('feedback.sent')}
            {state === 'error' && t('feedback.error')}
            {state === 'rate-limited' && t('feedback.rateLimited')}
          </p>
        </form>
      )}

      <div className="feedback-actions">
        <a className="btn btn-ghost" href={href}>
          {t('feedback.cta')}
        </a>

        <span className="feedback-webmail">
          {t('feedback.inBrowser')}{' '}
          {webmail.map((client, i) => (
            <span key={client.id}>
              {i > 0 && <span aria-hidden="true"> · </span>}
              <a href={client.url} target="_blank" rel="noreferrer noopener">
                {client.label}
              </a>
            </span>
          ))}
        </span>

        <span className="feedback-address">
          <span className="feedback-address-label">{t('feedback.orWrite')}</span>{' '}
          {/* Real, selectable text: the one path that works with no mail client,
              no clipboard permission and no JavaScript behaving itself. */}
          <a className="feedback-address-value" href={href}>
            {address}
          </a>
          <button type="button" className="feedback-copy" onClick={copy}>
            {copied ? t('feedback.copied') : t('feedback.copy')}
          </button>
        </span>
      </div>

      {/* Announced, not only recoloured, so the confirmation reaches somebody
          who cannot see the button change. */}
      <p className="sr-only" role="status">
        {copied ? t('feedback.copied') : ''}
      </p>
    </>
  );
}

/** The home-page section. Same content as the dialog, in the flow of the page. */
export function Feedback() {
  if (!feedback.address) return null;

  return (
    <section className="feedback">
      <h2 className="feedback-heading">{t('feedback.heading')}</h2>
      <p className="feedback-body">{t('feedback.body')}</p>

      {/* Before the form, not after it. Somebody who came here looking for help
          should meet this sentence before they start writing. */}
      <p className="feedback-not-support">{t('feedback.notSupport')}</p>

      <FeedbackBody />
    </section>
  );
}

/**
 * The same thing, reachable from anywhere.
 *
 * The section at the foot of the home page cannot be reached from a result
 * screen, which is exactly where somebody has just formed an opinion worth
 * hearing. A dialog rather than a link home, so nobody loses their place: an
 * assessment in progress stays in progress behind it.
 */
export function FeedbackDialog({ onClose }: { onClose: () => void }) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  useFocusTrap(panelRef, onClose, closeRef);

  if (!feedback.address) return null;

  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-labelledby="feedback-dialog-heading">
      <div className="panel feedback-dialog" ref={panelRef}>
        <h2 className="feedback-heading" id="feedback-dialog-heading">
          {t('feedback.heading')}
        </h2>
        <p className="feedback-body">{t('feedback.body')}</p>
        <p className="feedback-not-support">{t('feedback.notSupport')}</p>

        <FeedbackBody />

        <div className="panel-actions">
          <button type="button" className="btn btn-secondary" ref={closeRef} onClick={onClose}>
            {t('feedback.close')}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * The header entry point. A quiet link, not a button: the header has exactly one
 * primary action and it is "Find your path". A feedback link competing with it
 * on a mental-health routing tool would be the wrong thing shouting.
 */
export function FeedbackTrigger({ onOpen }: { onOpen: () => void }) {
  if (!feedback.address) return null;
  return (
    <button type="button" className="link" onClick={onOpen} aria-haspopup="dialog">
      {t('feedback.navLabel')}
    </button>
  );
}
