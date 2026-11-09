/**
 * "/about": who runs Mielenreitti, why, how routing decisions are made, who has
 * reviewed it, and how to reach us (Amir, 9.11.2026; D-43). It carries the
 * review status that the preview banner used to, in full.
 */
import { t } from '../i18n';

const HELLO = 'hello@mielenreitti.fi';

export function About({
  onHowItWorks,
  onWhy,
  onPrivacy,
}: {
  language: string;
  onHowItWorks: () => void;
  onWhy: () => void;
  onPrivacy: () => void;
}) {
  const section = (key: string, children: React.ReactNode) => (
    <section className="privacy-section" aria-labelledby={`about-${key}`}>
      <h2 id={`about-${key}`}>{t(`about.${key}.heading`)}</h2>
      {children}
    </section>
  );

  return (
    <div className="wrap privacy-page about-page">
      <h1 className="section-title">{t('about.title')}</h1>
      <p className="prose privacy-lede">{t('about.lede')}</p>

      {section('who', <p className="prose">{t('about.who.body')}</p>)}
      {section(
        'why',
        <>
          <p className="prose">{t('about.why.body')}</p>
          <p className="prose">
            <button type="button" className="link" onClick={onWhy}>
              {t('about.why.more')}
            </button>
          </p>
        </>,
      )}
      {section(
        'how',
        <>
          <p className="prose">{t('about.how.body1')}</p>
          <p className="prose">{t('about.how.body2')}</p>
          <p className="prose">
            <button type="button" className="link" onClick={onHowItWorks}>
              {t('about.how.more')}
            </button>
          </p>
        </>,
      )}
      {section('review', <p className="prose about-review">{t('about.review.body')}</p>)}
      {section(
        'contact',
        <>
          <p className="prose">
            {t('about.contact.body')} <a href={`mailto:${HELLO}`}>{HELLO}</a>
          </p>
          <p className="prose">
            {t('about.contact.privacy')}{' '}
            <button type="button" className="link" onClick={onPrivacy}>
              {t('about.contact.privacyLink')}
            </button>
            .
          </p>
        </>,
      )}
    </div>
  );
}
