/**
 * "/privacy": the site's privacy notice, as the site works today (7.11.2026).
 *
 * Every sentence here is a description of a mechanism that exists in this repo,
 * not an intention: the on-device stores (store.ts, followUp.ts, waitlist.ts,
 * draft.ts), the feedback relay (apps/web/api/feedback.ts,
 * services/feedback-relay), the CSP that allows the page to talk only to itself
 * (apps/web/vercel.json), and the hosting. If one of those changes, this page
 * changes with it, in the same pull request.
 *
 * The professionals directory has its own notice, built with its pages.
 */
import { t } from '../i18n';

const PRIVACY_ADDRESS = 'tietosuoja@mielenreitti.fi';
const VERCEL_PRIVACY = 'https://vercel.com/legal/privacy-policy';
const OMBUDSMAN: Record<string, string> = {
  fi: 'https://tietosuoja.fi/etusivu',
  sv: 'https://tietosuoja.fi/sv/framsida',
  en: 'https://tietosuoja.fi/en/home',
};

/** What the browser keeps, in the order a person meets them. */
const DEVICE_ITEMS = ['session', 'followUp', 'waitlist', 'draft'] as const;

export function Privacy({ language }: { language: string }) {
  const section = (key: string, children: React.ReactNode) => (
    <section className="privacy-section" aria-labelledby={`privacy-${key}`}>
      <h2 id={`privacy-${key}`}>{t(`privacy.${key}.heading`)}</h2>
      {children}
    </section>
  );

  return (
    <div className="wrap privacy-page">
      <h1 className="section-title">{t('privacy.title')}</h1>
      <p className="privacy-updated">{t('privacy.updated')}</p>
      <p className="prose privacy-lede">{t('privacy.lede')}</p>

      {section(
        'controller',
        <p className="prose">
          {t('privacy.controller.body')} <a href={`mailto:${PRIVACY_ADDRESS}`}>{PRIVACY_ADDRESS}</a>
        </p>,
      )}
      {section(
        'device',
        <>
          <p className="prose">{t('privacy.device.body')}</p>
          <ul className="prose privacy-list">
            {DEVICE_ITEMS.map((item) => (
              <li key={item}>{t(`privacy.device.item.${item}`)}</li>
            ))}
          </ul>
        </>,
      )}
      {section('tracking', <p className="prose">{t('privacy.tracking.body')}</p>)}
      {section(
        'visit',
        <p className="prose">
          {t('privacy.visit.body')} <a href={VERCEL_PRIVACY}>{t('privacy.visit.link')}</a>
        </p>,
      )}
      {section('feedback', <p className="prose">{t('privacy.feedback.body')}</p>)}
      {section('transfers', <p className="prose">{t('privacy.transfers.body')}</p>)}
      {section(
        'rights',
        <>
          <p className="prose">{t('privacy.rights.body')}</p>
          <p className="prose">
            {t('privacy.rights.complaint')} <a href={OMBUDSMAN[language] ?? OMBUDSMAN.en}>{t('privacy.rights.ombudsman')}</a>
          </p>
        </>,
      )}
    </div>
  );
}
