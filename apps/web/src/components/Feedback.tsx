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
 * The copy carries more weight than the link does. A feedback box on a
 * mental-health site does not only receive product feedback; it receives people
 * describing their situation and asking for help. So it says plainly what this
 * is for, that nobody is watching it, and where to go instead — pointing at the
 * crisis control rather than repeating a phone number that has one verified home
 * in `config/crisis.json`.
 *
 * Renders nothing while no address is configured, so an unset value ships safely.
 */
import { feedback } from '../config';
import { t } from '../i18n';

export function Feedback() {
  if (!feedback.address) return null;

  const href = `mailto:${feedback.address}?subject=${encodeURIComponent(feedback.subject)}`;

  return (
    <section className="feedback">
      <h2 className="feedback-heading">{t('feedback.heading')}</h2>
      <p className="feedback-body">{t('feedback.body')}</p>

      {/* Before the link, not after it. Somebody who came here looking for help
          should meet this sentence before they start composing an email that
          nobody will read tonight. */}
      <p className="feedback-not-support">{t('feedback.notSupport')}</p>

      <a className="btn btn-ghost" href={href}>
        {t('feedback.cta')}
      </a>
    </section>
  );
}
