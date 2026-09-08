/**
 * Somewhere to send a note about the product.
 *
 * Deliberately a `mailto:` and not a form. The moment feedback POSTs to a
 * server, this page starts sending things, and the claim the whole product rests
 * on — your answers stay on this device, nothing is sent anywhere — needs an
 * asterisk. A `mailto:` hands off to the person's own mail client: the page
 * sends nothing, invariant 11 is untouched, and the privacy audit still shows
 * zero outbound requests.
 *
 * But a `mailto:` on its own is a trap, and it caught the first person who tried
 * it. If the machine has no default mail handler — Gmail in a browser tab and
 * Mail.app never opened, which is most people — clicking it does **nothing at
 * all**. No error, no new window, no clue. So the address is also on the page as
 * selectable text with a copy button, and the button is the reliable path rather
 * than the fallback.
 *
 * The copy carries more weight than either. A feedback box on a mental-health
 * site does not only receive product feedback; it receives people describing
 * their situation and asking for help. So it says plainly what this is for, that
 * nobody is watching it, and where to go instead — pointing at the crisis
 * control rather than repeating a phone number that has one verified home in
 * `config/crisis.json`.
 *
 * Renders nothing while no address is configured, so an unset value ships safely.
 */
import { useState } from 'react';
import { uiLanguage } from '../i18n';
import { feedback } from '../config';
import { t } from '../i18n';

type FormState = 'idle' | 'sending' | 'sent' | 'error' | 'rate-limited';

export function Feedback() {
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState('');
  const [website, setWebsite] = useState(''); // honeypot: a real person never sees this
  const [state, setState] = useState<FormState>('idle');

  if (!feedback.address) return null;

  const address = feedback.address;
  const subject = encodeURIComponent(feedback.subject);
  const href = `mailto:${address}?subject=${subject}`;

  // The reason the mailto failed for the first person who tried it: their mail
  // is a browser tab, not an application, so the operating system had nothing to
  // hand the link to. These open a compose window in the two webmail clients
  // that cover most of that case.
  //
  // They are plain links to a third party, so nothing is requested from those
  // hosts unless somebody clicks. Worth being deliberate about anyway: this page
  // otherwise touches no origin but its own.
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
      // Nothing about their session, their answers or their device goes with it.
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
    <section className="feedback">
      <h2 className="feedback-heading">{t('feedback.heading')}</h2>
      <p className="feedback-body">{t('feedback.body')}</p>

      {/* Before the link, not after it. Somebody who came here looking for help
          should meet this sentence before they start composing an email that
          nobody will read tonight. */}
      <p className="feedback-not-support">{t('feedback.notSupport')}</p>

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

          {/* The honeypot. Hidden from sight and from assistive technology, and
              never focusable, so only something filling the form programmatically
              will put anything in it. */}
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

          {/* Announced, not only coloured. */}
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

      {/* Announced rather than only recoloured, so the confirmation reaches
          somebody who cannot see the button change. */}
      <p className="sr-only" role="status">
        {copied ? t('feedback.copied') : ''}
      </p>
    </section>
  );
}
