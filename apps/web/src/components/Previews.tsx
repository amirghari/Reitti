/**
 * V1 ships with zero therapists onboarded, so the marketplace appears as clearly
 * labelled previews. Being honest about what does not exist yet is the point —
 * an empty directory dressed up as a live one is how trust gets spent early.
 */
import { t } from '../i18n';

export function Previews() {
  return (
    <section className="previews">
      <p className="eyebrow" style={{ marginBottom: '0.4rem' }}>
        {t('previews.eyebrow')}
      </p>
      <p className="prose" style={{ margin: '0 0 1.5rem', maxWidth: '62ch' }}>
{t('previews.lede')}
      </p>
      <div className="grid grid-3">
        <article className="preview-card">
          <span className="badge">{t('home.comingSoon')}</span>
          <h4 style={{ marginTop: '0.65rem' }}>{t('previews.card1.title')}</h4>
          <p>{t('previews.card1.body')}</p>
        </article>
        <article className="preview-card">
          <span className="badge">{t('home.comingSoon')}</span>
          <h4 style={{ marginTop: '0.65rem' }}>{t('previews.card2.title')}</h4>
          <p>{t('previews.card2.body')}</p>
        </article>
        <article className="preview-card">
          <span className="badge">{t('home.comingSoon')}</span>
          <h4 style={{ marginTop: '0.65rem' }}>{t('previews.card3.title')}</h4>
          <p>{t('previews.card3.body')}</p>
        </article>
      </div>
    </section>
  );
}
